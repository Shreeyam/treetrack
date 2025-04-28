// server.js
import express from 'express';
import Database from 'better-sqlite3';
import BetterSqlite3Store from 'better-sqlite3-session-store';
import cors from 'cors';
import session from 'express-session';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import OpenAI from 'openai';
import 'dotenv/config';


// const openai = new OpenAI();
const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const SqliteStore = BetterSqlite3Store(session);

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

app.set('trust proxy', 1);

// Connect to our main SQLite DB.
const db = new Database('./todos.db', { verbose: console.log });
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Configure sessions with a better-sqlite3 store.
const sessionDb = new Database('sessions.db', { verbose: console.log });
app.use(session({
  store: new SqliteStore({ client: sessionDb }),
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, secure: process.env.NODE_ENV === 'production', domain: process.env.NODE_ENV === 'production' ? 'treetrack.xyz' : undefined }
}));

// Initialize database schema
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    premium BOOLEAN DEFAULT 0
  );
`).run();
db.prepare(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`).run();
db.prepare(`
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
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS dependencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_task INTEGER,
    to_task INTEGER,
    project_id INTEGER,
    user_id INTEGER,
    FOREIGN KEY(from_task) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY(to_task) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`).run();

// Middleware to check for an authenticated user.
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: "Not authenticated" });
}

// Middleware to check if the user is a premium user.
function isPremium(req, res, next) {
  if (req.session && req.session.user && req.session.user.premium) {
    return next();
  }
  return res.status(403).json({ error: "Premium access required" });
}

// Rate limiter for the login endpoint.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 55,
  message: "Too many login attempts. Please try again later."
});

// Register a new user.
app.post('/api/register', async (req, res) => { // Make handler async for bcrypt
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use synchronous .run() and get info object
    const info = db.prepare(
      "INSERT INTO users (username, password) VALUES (?, ?)"
    ).run(username, hashedPassword); // Errors will throw here

    const newUser = {
      id: info.lastInsertRowid,
      username: username,
      premium: 0 // Default premium status
    };

    // Automatically log in the new user by setting the session
    req.session.user = {
      id: newUser.id,
      username: newUser.username,
      premium: Boolean(newUser.premium) // Ensure boolean
    };
    console.log(`User ${newUser.username} registered. Session user set:`, req.session.user);

    res.json({
      id: newUser.id,
      username: newUser.username,
      premium: Boolean(newUser.premium)
    });

  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: error });
    } else {
      res.status(500).json({ error: error });
    }
  }
});

// Login endpoint.
app.post('/api/login', loginLimiter, async (req, res) => { // Make handler async for bcrypt
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }

  try {
    // Use synchronous .get() directly
    const user = db.prepare("SELECT id, username, password, premium FROM users WHERE username = ?").get(username);

    if (!user) {
      // User not found
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Use await for the async bcrypt comparison
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      // --- Login successful ---
      // Set the session data *before* sending the response
      req.session.user = {
        id: user.id,
        username: user.username,
        premium: Boolean(user.premium) // Ensure it's a boolean
      };

      // Optional: Log to confirm session is set server-side
      console.log(`User ${user.username} logged in. Session user set:`, req.session.user);

      // Save the session explicitly if needed (though usually automatic on modification/response end)
      // req.session.save(); // Usually not necessary unless ending response early without modification

      res.json({
        id: user.id,
        username: user.username,
        premium: Boolean(user.premium)
      });
    } else {
      // Password incorrect
      res.status(400).json({ error: "Invalid credentials" });
    }

  } catch (error) {
    // Handle potential synchronous DB errors or bcrypt errors
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login process" });
  }
});

// Logout endpoint.
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Could not log out" });
    res.json({ message: "Logged out" });
  });
});

// Endpoint to get the current session's user.
app.get('/api/me', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

// --- PROJECT ENDPOINTS (Authenticated) ---

app.get('/api/projects', isAuthenticated, (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM projects WHERE user_id = ?").all(req.session.user.id);
    res.json({ projects: rows });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post('/api/projects', isAuthenticated, (req, res) => {
  const { name } = req.body;
  try {
    db.prepare("INSERT INTO projects (name, user_id) VALUES (?, ?)").run(name, req.session.user.id);
    res.json({ id: this.lastID, name });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/projects/:id', isAuthenticated, (req, res) => {
  const projectId = req.params.id;
  db.serialize(() => {
    db.run("DELETE FROM dependencies WHERE project_id = ? AND user_id = ?", [projectId, req.session.user.id], function (err) {
      if (err) return res.status(400).json({ error: err.message });
      db.run("DELETE FROM tasks WHERE project_id = ? AND user_id = ?", [projectId, req.session.user.id], function (err2) {
        if (err2) return res.status(400).json({ error: err2.message });
        db.run("DELETE FROM projects WHERE id = ? AND user_id = ?", [projectId, req.session.user.id], function (err3) {
          if (err3) return res.status(400).json({ error: err3.message });
          res.json({ changes: this.changes });
        });
      });
    });
  });
});

// --- TASK ENDPOINTS (Authenticated) ---

app.get('/api/tasks', isAuthenticated, (req, res) => {
  const { project_id } = req.query;
  const userId = req.session.user.id; // Get userId from session

  try {
    let query = "SELECT * FROM tasks WHERE user_id = ?";
    const params = [userId];

    if (project_id !== undefined && project_id !== null) { // Check if project_id exists
      query += " AND project_id = ?";
      params.push(project_id);
    }

    // Prepare and execute synchronously
    const tasks = db.prepare(query).all(params);

    // Send the correct structure
    res.json({ tasks: tasks });

  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to retrieve tasks" });
  }
});


app.post('/api/tasks', isAuthenticated, (req, res) => {
  const { title, posX, posY, completed, project_id } = req.body;
  db.run(
    "INSERT INTO tasks (title, posX, posY, completed, project_id, user_id) VALUES (?, ?, ?, ?, ?, ?)",
    [title, posX || 0, posY || 0, completed || 0, project_id, req.session.user.id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.put('/api/tasks/:id', isAuthenticated, (req, res) => {
  const { title, posX, posY, completed, color, project_id } = req.body;
  try {
    const stmt = db.prepare(`
      UPDATE tasks
      SET title      = ?,
          posX       = ?,
          posY       = ?,
          completed  = ?,
          color      = ?,
          project_id = ?
      WHERE id = ? AND user_id = ?
    `);
    const result = stmt.run(
      title,
      posX,
      posY,
      completed,
      color,
      project_id,
      req.params.id,
      req.session.user.id
    );
    res.json({ changes: result.changes });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// When deleting a task, first delete its dependencies.
app.delete('/api/tasks/:id', isAuthenticated, (req, res) => {
  const taskId = req.params.id;
  const userId = req.session.user.id;

  // wrap both operations in a transaction
  const deleteTaskAndDeps = db.transaction((taskId, userId) => {
    // 1) delete any dependencies involving this task
    db.prepare(`
      DELETE FROM dependencies
      WHERE (from_task = ? OR to_task = ?)
        AND user_id = ?
    `).run(taskId, taskId, userId);

    // 2) delete the task itself
    return db.prepare(`
      DELETE FROM tasks
      WHERE id = ? AND user_id = ?
    `).run(taskId, userId);
  });

  try {
    const result = deleteTaskAndDeps(taskId, userId);
    // result.changes is how many tasks rows were deleted
    res.json({ changes: result.changes });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- DEPENDENCY ENDPOINTS (Authenticated) ---

app.get('/api/dependencies', isAuthenticated, (req, res) => {
  const { project_id } = req.query;
  const userId = req.session.user.id; // Get userId from session

  try {
    let query = "SELECT * FROM dependencies WHERE user_id = ?";
    const params = [userId];

    if (project_id !== undefined && project_id !== null) { // Check if project_id exists
      query += " AND project_id = ?";
      params.push(project_id);
    }

    // Prepare and execute synchronously
    const dependencies = db.prepare(query).all(params);

    // Send the correct structure
    res.json({ dependencies: dependencies });

  } catch (error) {
    console.error("Error fetching dependencies:", error);
    res.status(500).json({ error: "Failed to retrieve dependencies" });
  }
});

app.post('/api/dependencies', isAuthenticated, (req, res) => {
  const { from_task, to_task, project_id } = req.body;
  db.run(
    "INSERT INTO dependencies (from_task, to_task, project_id, user_id) VALUES (?, ?, ?, ?)",
    [from_task, to_task, project_id, req.session.user.id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.delete('/api/dependencies/:id', isAuthenticated, (req, res) => {
  db.run("DELETE FROM dependencies WHERE id = ? AND user_id = ?", [req.params.id, req.session.user.id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

async function generativeEdit(userInput, projectId, userId, currentState) {
  const jsonSchema = `{
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
}`;

  // Build the system prompt with the JSON schema embedded.
  const systemPrompt = `You are a project planning assistant responsible for generating or editing a complete and logically structured plan to accomplish a high-level goal. The output must be a JSON object containing two parts: an array of 'tasks' and an array of 'dependencies' between them. The input contains the current project state (if provided) in the same structure as the output.

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
- delete (set to 1 if you want to delete the task, 0 otherwise)

Each dependency object must include:
- id (integer)
- from_task (source task id)
- to_task (destination task id)
- project_id and user_id (same placeholders)
- delete (set to 1 if you want to delete the dependency, 0 otherwise)

The summary should be a short description of your generated or edited tasks and dependencies. Two sentences, maximum.

Ensure that the output adheres strictly to the following JSON schema:
${jsonSchema}

Be thoughtful and detailed. The goal is to create a structured blueprint of the steps needed to achieve the goal, with realistic precedence and parallelization. Output only the JSON structure for the tasks and dependencies, adhering strictly to the schema provided. If you are editing existing nodes, only include the ones you have edited in the output. Remember to place them so that the graph is readable by adjusting x and y positions, readable left to right. If you want to delete a node or dependency, set the delete flag to 1.`;

  // Build the user prompt: include the current state if available.
  const userPrompt = currentState
    ? `Current project state:
${JSON.stringify(currentState, null, 2)}

Please generate an updated project plan based on this user input: '${userInput}'.`
    : `Generate a structured project plan based on this user input: '${userInput}'`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gemini-2.5-flash-preview-04-17", // Change model if desired.
      messages: messages,
      temperature: 0.7,
    });

    // Check if the response is valid.


    const responseText = completion.choices[0].message.content.replace("```json", "").replace("```", "").trim();

    // Post-process the response to affix project, user id
    let responseTasks = JSON.parse(responseText);

    responseTasks.tasks.forEach(task => {
      task.project_id = projectId;
      task.user_id = userId;
    });
    responseTasks.dependencies.forEach(dep => {
      dep.project_id = projectId;
      dep.user_id = userId;
    });

    responseTasks.summary = responseTasks.summary || "No summary provided.";

    return responseTasks;

  } catch (error) {
    console.error("Error generating project structure:", error);
    throw error;
  }
}

// Endpoint to generate a project structure using OpenAI.
app.post('/api/generate', isAuthenticated, isPremium, async (req, res) => {
  // Accept topic, project_id, and an optional current_state from the request body.
  const { user_input: user_input, project_id, current_state } = req.body;
  if (!user_input || !project_id) {
    return res.status(400).json({ error: "Missing topic or project_id" });
  }
  try {
    const projectData = await generativeEdit(user_input, project_id, req.session.user.id, current_state);
    res.json({ data: projectData });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate project structure" });
  }
});

app.post('/api/log-error', express.json(), (req, res) => {
  const { message, stack, componentStack, url, userAgent, timestamp } = req.body;
  // TODO: persist to a database for error tracking
  // console.error(`[Client Error] ${timestamp} @ ${url}\n${message}\n${stack}\nComponent stack:\n${componentStack}\nUser-Agent: ${userAgent}`);
  res.sendStatus(204);
});

// 1) Helper to turn db.run into a Promise that resolves with lastID
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this.lastID);
    });
  });
}

// --- BULK CHANGE ENDPOINT (Authenticated) ---
app.post('/api/bulk-change', isAuthenticated, (req, res) => {
  const { project_id, tasks, dependencies } = req.body;
  const userId = req.session.user.id;
  const idMap = {};      // tempId → realId
  const tasksCreated = [];
  const depsCreated = [];

  // create a single transaction that includes everything
  const bulkChange = db.transaction(() => {
    // 1) Insert new tasks
    for (let t of tasks.created) {
      const info = db
        .prepare(
          `INSERT INTO tasks
             (title,posX,posY,completed,color,project_id,user_id)
           VALUES (?,?,?,?,?,?,?)`
        )
        .run(t.title, t.posX, t.posY, t.completed, t.color, project_id, userId);

      idMap[t.tempId] = info.lastInsertRowid;
      tasksCreated.push({ tempId: String(t.tempId), newId: info.lastInsertRowid });
    }

    // 2) Update existing tasks
    for (let t of tasks.updated) {
      db
        .prepare(
          `UPDATE tasks
              SET title=?,posX=?,posY=?,completed=?,color=?,project_id=?
            WHERE id=? AND user_id=?`
        )
        .run(t.title, t.posX, t.posY, t.completed, t.color, project_id, t.id, userId);
    }

    // 3) Delete tasks & their deps
    for (let id of tasks.deleted) {
      db
        .prepare(
          `DELETE FROM dependencies
             WHERE (from_task=? OR to_task=?) AND user_id=?`
        )
        .run(id, id, userId);

      db
        .prepare(`DELETE FROM tasks WHERE id=? AND user_id=?`)
        .run(id, userId);
    }

    // 4) Insert new dependencies
    for (let d of dependencies.created) {
      const from = idMap[d.from_task] || d.from_task;
      const to = idMap[d.to_task] || d.to_task;
      const info = db
        .prepare(
          `INSERT INTO dependencies
             (from_task,to_task,project_id,user_id)
           VALUES (?,?,?,?)`
        )
        .run(from, to, project_id, userId);

      depsCreated.push({ from_task: from, to_task: to, newId: info.lastInsertRowid });
    }

    // 5) Update dependencies
    for (let d of dependencies.updated) {
      db
        .prepare(
          `UPDATE dependencies
              SET from_task=?,to_task=?,project_id=?
            WHERE id=? AND user_id=?`
        )
        .run(d.from_task, d.to_task, project_id, d.id, userId);
    }

    // 6) Delete dependencies
    for (let id of dependencies.deleted) {
      db
        .prepare(`DELETE FROM dependencies WHERE id=? AND user_id=?`)
        .run(id, userId);
    }
  });

  try {
    bulkChange();  // runs BEGIN ... COMMIT or auto-ROLLBACK on error
    res.json({ tasksCreated, dependenciesCreated: depsCreated });
  } catch (err) {
    console.error('bulk-change failed:', err);
    res.status(500).json({ error: err.message });
  }
});



export default app; // Export the app for testing purposes     