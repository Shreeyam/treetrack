import json
import os
import sqlite3
import bcrypt
import secrets
import asyncio
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException, Depends, status, Body, Path
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
from contextlib import asynccontextmanager
from openai import AsyncOpenAI

# For rate limiting (install via: pip install slowapi)
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
load_dotenv()

# -----------------------------------------------------------------------------
# Application Factory
# -----------------------------------------------------------------------------
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise Exception("Missing OPENAI_API_KEY environment variable!")
client = AsyncOpenAI(api_key=openai_api_key)

conn = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global conn

    # --- Startup logic ---
    conn = sqlite3.connect("todos.db", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          premium BOOLEAN DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          user_id INTEGER,
          FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          posX REAL DEFAULT 0,
          posY REAL DEFAULT 0,
          completed INTEGER DEFAULT 0,
          project_id INTEGER,
          user_id INTEGER,
          color TEXT,
          locked BOOLEAN DEFAULT 0,
          FOREIGN KEY(project_id) REFERENCES projects(id),
          FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS dependencies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          from_task INTEGER,
          to_task INTEGER,
          project_id INTEGER,
          user_id INTEGER,
          FOREIGN KEY(from_task) REFERENCES tasks(id),
          FOREIGN KEY(to_task) REFERENCES tasks(id),
          FOREIGN KEY(project_id) REFERENCES projects(id),
          FOREIGN KEY(user_id) REFERENCES users(id)
        );
    """)
    conn.commit()
    print("Database connected and tables ensured.")

    # Yield control to the application
    yield

    # --- Shutdown logic ---
    if conn:
        conn.close()
        print("Database connection closed.")

app = FastAPI(lifespan=lifespan)

# CORS middleware: in production, restrict allowed origins appropriately.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, set to specific origin(s)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up session middleware.
# In production, sessions should be stored server-side or in a dedicated store.
secret_key = secrets.token_hex(64)
production = os.getenv("ENV") == "production"
cookie_domain = "treetrack.shreey.am" if production else None
app.add_middleware(
    SessionMiddleware,
    secret_key=secret_key,
    max_age=7 * 24 * 60 * 60,  # 7 days persistence
    https_only=production,
    domain=cookie_domain
)

# Rate limiting for the login endpoint.
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(429, _rate_limit_exceeded_handler)

# -----------------------------------------------------------------------------
# Pydantic Models
# -----------------------------------------------------------------------------
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int

class ProjectCreate(BaseModel):
    name: str

class TaskCreate(BaseModel):
    title: str
    posX: float = 0
    posY: float = 0
    completed: int = 0
    project_id: int
    color: Optional[str] = None
    locked: Optional[bool] = False  # mirrors DB default


class TaskUpdate(BaseModel):
    title: str
    posX: float
    posY: float
    completed: int
    color: Optional[str] = None
    project_id: int


class DependencyCreate(BaseModel):
    from_task: int
    to_task: int
    project_id: int

# -----------------------------------------------------------------------------
# Dependency: Get Current Authenticated User from Session
# -----------------------------------------------------------------------------
def get_current_user(request: Request):
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# -----------------------------------------------------------------------------
# Authentication Endpoints
# -----------------------------------------------------------------------------
@app.post("/api/register", response_model=UserOut)
async def register(user: UserCreate, request: Request):
    username = user.username.strip()
    password = user.password.strip()

    if not username or not password:
        raise HTTPException(status_code=400, detail="Missing username or password")

    cursor = conn.cursor()

    # Check if username already exists
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    try:
        cursor.execute(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            (username, hashed_pw)
        )
        conn.commit()
        user_id = cursor.lastrowid
        request.session["user"] = {"id": user_id, "username": username}
        return {"id": user_id, "username": username}
    except sqlite3.DatabaseError:
        raise HTTPException(status_code=500, detail="Database error. Please try again later.")

@app.post("/api/login", response_model=UserOut)
@limiter.limit("15/15minutes")
async def login(user: UserCreate, request: Request):
    username = user.username.strip()
    password = user.password.strip()

    if not username or not password:
        raise HTTPException(status_code=400, detail="Missing username or password")

    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not bcrypt.checkpw(password.encode("utf-8"), row["password"].encode("utf-8")):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    request.session["user"] = {"id": row["id"], "username": row["username"]}
    return {"id": row["id"], "username": row["username"]}

@app.post("/api/logout")
async def logout(request: Request):
    request.session.clear()
    return {"message": "Logged out"}

@app.get("/api/me")
async def get_me(request: Request, user: dict = Depends(get_current_user)):
    return {"user": user}

# -----------------------------------------------------------------------------
# Project Endpoints (Authenticated)
# -----------------------------------------------------------------------------
@app.get("/api/projects")
async def get_projects(request: Request, current_user: dict = Depends(get_current_user)):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects WHERE user_id = ?", (current_user["id"],))
    rows = cursor.fetchall()
    projects = [dict(row) for row in rows]
    return {"projects": projects}

@app.post("/api/projects")
async def create_project(project: ProjectCreate, request: Request, current_user: dict = Depends(get_current_user)):
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO projects (name, user_id) VALUES (?, ?)",
        (project.name, current_user["id"])
    )
    conn.commit()
    return {"id": cursor.lastrowid, "name": project.name}

@app.delete("/api/projects/{project_id}")
async def delete_project(
    project_id: int = Path(..., description="ID of the project to delete"),
    request: Request = None, current_user: dict = Depends(get_current_user)
):
    cursor = conn.cursor()
    try:
        cursor.execute(
            "DELETE FROM dependencies WHERE project_id = ? AND user_id = ?",
            (project_id, current_user["id"])
        )
        cursor.execute(
            "DELETE FROM tasks WHERE project_id = ? AND user_id = ?",
            (project_id, current_user["id"])
        )
        cursor.execute(
            "DELETE FROM projects WHERE id = ? AND user_id = ?",
            (project_id, current_user["id"])
        )
        conn.commit()
        return {"changes": cursor.rowcount}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# -----------------------------------------------------------------------------
# Task Endpoints (Authenticated)
# -----------------------------------------------------------------------------
@app.get("/api/tasks")
async def get_tasks(request: Request, project_id: Optional[int] = None,
                    current_user: dict = Depends(get_current_user)):
    cursor = conn.cursor()
    if project_id is not None:
        cursor.execute(
            "SELECT * FROM tasks WHERE user_id = ? AND project_id = ?",
            (current_user["id"], project_id)
        )
    else:
        cursor.execute("SELECT * FROM tasks WHERE user_id = ?", (current_user["id"],))
    rows = cursor.fetchall()
    tasks = [dict(row) for row in rows]
    return {"tasks": tasks}

@app.post("/api/tasks")
async def create_task(task: TaskCreate, request: Request, current_user: dict = Depends(get_current_user)):
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO tasks (title, posX, posY, completed, project_id, user_id) VALUES (?, ?, ?, ?, ?, ?)",
        (task.title, task.posX, task.posY, task.completed, task.project_id, current_user["id"])
    )
    conn.commit()
    return {"id": cursor.lastrowid}

@app.put("/api/tasks/{task_id}")
async def update_task(task_id: int, task: TaskUpdate, request: Request, current_user: dict = Depends(get_current_user)):
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE tasks SET title = ?, posX = ?, posY = ?, completed = ?, color = ?, project_id = ? WHERE id = ? AND user_id = ?",
        (task.title, task.posX, task.posY, task.completed, task.color, task.project_id, task_id, current_user["id"])
    )
    conn.commit()
    return {"changes": cursor.rowcount}

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: int, request: Request, current_user: dict = Depends(get_current_user)):
    cursor = conn.cursor()
    try:
        cursor.execute(
            "DELETE FROM dependencies WHERE (from_task = ? OR to_task = ?) AND user_id = ?",
            (task_id, task_id, current_user["id"])
        )
        cursor.execute(
            "DELETE FROM tasks WHERE id = ? AND user_id = ?",
            (task_id, current_user["id"])
        )
        conn.commit()
        return {"changes": cursor.rowcount}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# -----------------------------------------------------------------------------
# Dependency Endpoints (Authenticated)
# -----------------------------------------------------------------------------
@app.get("/api/dependencies")
async def get_dependencies(request: Request, project_id: Optional[int] = None,
                           current_user: dict = Depends(get_current_user)):
    cursor = conn.cursor()
    if project_id is not None:
        cursor.execute(
            "SELECT * FROM dependencies WHERE user_id = ? AND project_id = ?",
            (current_user["id"], project_id)
        )
    else:
        cursor.execute("SELECT * FROM dependencies WHERE user_id = ?", (current_user["id"],))
    rows = cursor.fetchall()
    dependencies = [dict(row) for row in rows]
    return {"dependencies": dependencies}

@app.post("/api/dependencies")
async def create_dependency(dep: DependencyCreate, request: Request, current_user: dict = Depends(get_current_user)):
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO dependencies (from_task, to_task, project_id, user_id) VALUES (?, ?, ?, ?)",
        (dep.from_task, dep.to_task, dep.project_id, current_user["id"])
    )
    conn.commit()
    return {"id": cursor.lastrowid}

@app.delete("/api/dependencies/{dep_id}")
async def delete_dependency(dep_id: int, request: Request, current_user: dict = Depends(get_current_user)):
    cursor = conn.cursor()
    cursor.execute("DELETE FROM dependencies WHERE id = ? AND user_id = ?", (dep_id, current_user["id"]))
    conn.commit()
    return {"changes": cursor.rowcount}


# -----------------------------------------------------------------------------
# The generative edit function: builds prompts and calls the OpenAI API.
# -----------------------------------------------------------------------------
async def generative_edit(user_input: str, project_id: int, user_id: int, current_state: Optional[dict] = None) -> dict:
    json_schema = """
{
  "type": "object",
  "properties": {
    "tasks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "integer"},
          "title": {"type": "string"},
          "posX": {"type": "number"},
          "posY": {"type": "number"},
          "completed": {"type": "integer"},
          "project_id": {"type": "integer"},
          "user_id": {"type": "integer"},
          "color": {"type": "string"},
          "locked": {"type": "integer"},
          "draft": {"type": "integer"}
        },
        "required": ["id", "title", "posX", "posY", "completed", "project_id", "user_id", "color", "locked"],
        "additionalProperties": false
      }
    },
    "dependencies": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "integer"},
          "from_task": {"type": "integer"},
          "to_task": {"type": "integer"},
          "project_id": {"type": "integer"},
          "user_id": {"type": "integer"}
        },
        "required": ["id", "from_task", "to_task", "project_id", "user_id"],
        "additionalProperties": false
      }
    },
    "summary": {
      "type": "string"
    }
  },
  "required": ["tasks", "dependencies", "summary"],
  "additionalProperties": false
}
"""

    system_prompt = f"""You are a project planning assistant responsible for generating or editing a complete and logically structured plan to accomplish a high-level goal. The output must be a JSON object containing two parts: an array of 'tasks' and an array of 'dependencies' between them. The input contains the current project state (if provided) in the same structure as the output.

Each task represents a specific, actionable step required to complete the overall goal. The tasks must form a directed acyclic graph (DAG) — some tasks should occur in strict sequence (e.g., A must be done before B), while others can occur in parallel or have no dependency between them.

The graph must show **clear branching**: not every task should just point to the next. There must be **multiple layers**, where:
- Some tasks have multiple children (forks)
- Some tasks have multiple parents (joins)
- Some tasks can be completed in parallel
- The graph converges toward one or more final goal tasks

Consider the real-world logical flow of a project: planning, preparation, execution, testing, and finishing. Organize the tasks accordingly, and only include meaningful dependencies—avoid unnecessary chaining of unrelated steps.

Each task object must include:
- id (integer, negative number if a new task or re-use from the input otherwise)
- title (short, descriptive name)
- posX and posY (default to 0)
- completed (set to 0)
- project_id and user_id (placeholders that will be filled in later)
- color (use a HEX color code to reflect the stage or layer of the task, e.g., planning vs execution; should be pastel-ish as they will be the background for black text)
- locked (set to 0)
- draft (set to 1)

Each dependency object must include:
- id (integer)
- from_task (source task id)
- to_task (destination task id)
- project_id and user_id (same placeholders)

The summary should be a short description of your generated or edited tasks and dependencies. Two sentences, maximum.

Ensure that the output adheres strictly to the following JSON schema:
{json_schema}

Be thoughtful and detailed. The goal is to create a structured blueprint of the steps needed to achieve the goal, with realistic precedence and parallelization. Output only the JSON structure for the tasks and dependencies, adhering strictly to the schema provided. If you are editing existing nodes, only include the ones you have edited in the output."""

    if current_state:
        user_prompt = f"Current project state:\n{json.dumps(current_state, indent=2)}\n\nPlease generate an updated project plan based on this user input: '{user_input}'."
    else:
        user_prompt = f"Generate a structured project plan based on this user input: '{user_input}'"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    try:
        # Call the OpenAI responses API using the asynchronous client.
        chat_completion = await client.responses.create(
            model="gpt-4.1-nano-2025-04-14",
            input=messages,
            temperature=0.7
        )
        # Extract the content from the response.
        response_text = chat_completion.output_text

        # Parse the JSON response.
        project_data = json.loads(response_text)

        # Update each task and dependency with the actual project and user IDs.
        for task in project_data.get("tasks", []):
            task["project_id"] = project_id
            task["user_id"] = user_id
        for dependency in project_data.get("dependencies", []):
            dependency["project_id"] = project_id
            dependency["user_id"] = user_id

        # Ensure that a summary is provided.
        if "summary" not in project_data or not project_data["summary"]:
            project_data["summary"] = "No summary provided."

        return project_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate project structure: {str(e)}")

class GenerateRequest(BaseModel):
    user_input: str
    project_id: int
    current_state: Optional[dict] = None

@app.post("/api/generate")
async def generate_project(data: GenerateRequest, request: Request, current_user: dict = Depends(get_current_user)):
    project_data = await generative_edit(
        user_input=data.user_input,
        project_id=data.project_id,
        user_id=current_user["id"],
        current_state=data.current_state
    )
    return {"data": project_data}

# -----------------------------------------------------------------------------
# Request model for the /api/generate endpoint
# -----------------------------------------------------------------------------
class GenerateRequest(BaseModel):
    user_input: str
    project_id: int
    current_state: Optional[dict] = None

# Get the absolute path to the frontend build folder
frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))

# Mount the static files. By setting html=True, any non-matching request
# will serve index.html. This is particularly useful for single-page applications.
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")



# -----------------------------------------------------------------------------
# Entry Point: Running with Hypercorn
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    # Production usage: run this module with Hypercorn. For example:
    #   hypercorn main:app --bind 0.0.0.0:3001 --workers 4
    #
    # Or run programmatically as shown below.
    from hypercorn.config import Config as HyperConfig
    from hypercorn.asyncio import serve

    config = HyperConfig()
    #config.bind = ["0.0.0.0:3001"]
    config.debug = True
    config.loglevel = "debug"

    # Run Hypercorn asynchronously.
    asyncio.run(serve(app, config))
