// server.js
import express from 'express';
import sqlite3pkg from 'sqlite3';
const sqlite3 = sqlite3pkg.verbose();
import cors from 'cors';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import OpenAI from 'openai';
import 'dotenv/config';

const SQLiteStore = connectSqlite3(session);

// const openai = new OpenAI();
const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const app = express();
const port = 3001;

app.use(cors({
  origin: true, // allow credentials from any origin for testing; restrict in production!
  credentials: true
}));
app.use(express.json());

app.set('trust proxy', 1);

// Configure sessions with a SQLite store.
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: './' }),
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, secure: process.env.NODE_ENV === 'production', domain: process.env.NODE_ENV === 'production' ? 'treetrack.xyz' : undefined } // 7 days persistence
}));

// Connect to our main SQLite DB.
const db = new sqlite3.Database('./todos.db', (err) => {
  if (err) {
    console.error("Error connecting to SQLite database:", err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.run("PRAGMA foreign_keys = ON");
  }
});

db.serialize(() => {
  // Create the users table.
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      premium BOOLEAN DEFAULT 0
    )
  `);

  // Create the projects table (each project belongs to a user).
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      user_id INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Create the tasks table.
  db.run(`
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
    )
  `);

  // Create the dependencies table.
  db.run(`
    CREATE TABLE IF NOT EXISTS dependencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_task INTEGER,
      to_task INTEGER,
      project_id INTEGER,
      user_id INTEGER,
      FOREIGN KEY(from_task) REFERENCES tasks(id) DEFERRABLE INITIALLY DEFERRED,
      FOREIGN KEY(to_task) REFERENCES tasks(id) DEFERRABLE INITIALLY DEFERRED,
      FOREIGN KEY(project_id) REFERENCES projects(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
});

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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 55,
  message: "Too many login attempts. Please try again later."
});

// --- Authentication Endpoints ---

// Register a new user.
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hashedPassword],
      function (err) {
        if (err) {
          return res.status(400).json({ error: err.message });
        }
        // Automatically log in the new user.
        req.session.user = { id: this.lastID, username };
        res.json({ id: this.lastID, username });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Login endpoint.
app.post('/api/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }
  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    try {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        req.session.user = { id: user.id, username: user.username, premium: user.premium };
        res.json({ id: user.id, username: user.username, premium: user.premium });
      } else {
        res.status(400).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });
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
  db.all("SELECT * FROM projects WHERE user_id = ?", [req.session.user.id], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ projects: rows });
  });
});

app.post('/api/projects', isAuthenticated, (req, res) => {
  const { name } = req.body;
  db.run("INSERT INTO projects (name, user_id) VALUES (?, ?)", [name, req.session.user.id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID, name });
  });
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
  let query = "SELECT * FROM tasks WHERE user_id = ?";
  const params = [req.session.user.id];
  if (project_id) {
    query += " AND project_id = ?";
    params.push(project_id);
  }
  db.all(query, params, (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ tasks: rows });
  });
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

app.put('/api/tasks', isAuthenticated, (req, res) => {
  // Update many rows of table
});

app.put('/api/tasks/:id', isAuthenticated, (req, res) => {
  const { title, posX, posY, completed, color, project_id } = req.body;
  db.run(
    "UPDATE tasks SET title = ?, posX = ?, posY = ?, completed = ?, color = ?, project_id = ? WHERE id = ? AND user_id = ?",
    [title, posX, posY, completed, color, project_id, req.params.id, req.session.user.id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ changes: this.changes });
    }
  );
});

// When deleting a task, first delete its dependencies.
app.delete('/api/tasks/:id', isAuthenticated, (req, res) => {
  db.serialize(() => {
    db.run(
      "DELETE FROM dependencies WHERE (from_task = ? OR to_task = ?) AND user_id = ?",
      [req.params.id, req.params.id, req.session.user.id],
      function (err) {
        if (err) return res.status(400).json({ error: err.message });
        db.run(
          "DELETE FROM tasks WHERE id = ? AND user_id = ?",
          [req.params.id, req.session.user.id],
          function (err2) {
            if (err2) return res.status(400).json({ error: err2.message });
            res.json({ changes: this.changes });
          }
        );
      }
    );
  });
});

// --- DEPENDENCY ENDPOINTS (Authenticated) ---

app.get('/api/dependencies', isAuthenticated, (req, res) => {
  const { project_id } = req.query;
  let query = "SELECT * FROM dependencies WHERE user_id = ?";
  const params = [req.session.user.id];
  if (project_id) {
    query += " AND project_id = ?";
    params.push(project_id);
  }
  db.all(query, params, (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ dependencies: rows });
  });
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

// Update the generativeEdit function signature to accept chatHistory
async function generativeEdit(userInput, projectId, userId, currentState, chatHistory) { // Added chatHistory parameter
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
          "draft": {"type": "integer"},
          "delete": {"type": "integer"},
          "no_change": {"type": "boolean"} // Only for tasks
        },
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
          "user_id": {"type": "integer"},
          "delete": {"type": "integer"}
        },
        "required": ["id", "from_task", "to_task"],
        "additionalProperties": false
      }
    },
    "summary": {
      "type": "string"
    },
    "no_changes_required": { // Added optional flag
      "type": "boolean"
    }
  },
  "required": ["tasks", "dependencies", "summary"],
  "additionalProperties": false
}`;

  // Build the system prompt incorporating chatHistory
  const systemPrompt = `You are a project planning assistant responsible for generating or editing a complete and logically structured plan to accomplish a high-level goal. The output must be a JSON object containing two parts: an array of 'tasks' and an array of 'dependencies' between them. The input contains the current project state (if provided) in the same structure as the output.

**Conversation History:**
${chatHistory.map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`).join('\n')}

**CURRENT USER REQUEST TO RESPOND TO:** ${userInput}

**IMPORTANT:** If the user's request does not require *any* changes to the tasks or dependencies (e.g., it's just a greeting or a question not related to modifying the plan), respond normally and helpfully based on the conversation history and current request, and return the following specific JSON structure:
\`\`\`json
{
  "tasks": [],
  "dependencies": [],
  "summary": "Your conversational response here.",
  "no_changes_required": true
}
\`\`\`
**Otherwise**, if changes *are* needed, follow the instructions below and **do not** include the 'no_changes_required' flag.

Each task represents a specific, actionable step required to complete the overall goal. The tasks must form a directed acyclic graph (DAG) — some tasks should occur in strict sequence (e.g., A must be done before B), while others can occur in parallel or have no dependency between them.

The graph must show **clear branching**: not every task should just point to the next. There must be **multiple layers**, where:
- Some tasks have multiple children (forks)
- Some tasks have multiple parents (joins)
- Some tasks can be completed in parallel
- The graph converges toward one or more final goal tasks

Consider the real-world logical flow of a project: planning, preparation, execution, testing, and finishing. Organize the tasks accordingly, and only include meaningful dependencies—avoid unnecessary chaining of unrelated steps.

Each task object must include:
- id (integer, negative number if a new task or re-use from the input otherwise)
- **If the task is unchanged from the input state, include ONLY the 'id' and set 'no_change' to true.**
- **Otherwise (for new or modified tasks), include:**
  - title (short, descriptive name)
  - posX and posY (default to 0, or adjust for readability left-to-right)
  - completed (set to 0)
  - project_id and user_id (placeholders that will be filled in later)
  - color (use a HEX color code to reflect the stage or layer of the task, e.g., planning vs execution; you should use '#ffcccc', '#fff2cc', '#d9ead3', or '#d2e1f3' first. If you need more than 4 categories you can create more colors; they should be pastel-ish as they will be the background for black text)
  - locked (set to 0)
  - draft (set to 1)
  - delete (set to 1 if you want to delete the task, 0 otherwise)
  - no_change (set to false or omit)

Each dependency object represents a link between two tasks. **Only include dependencies that are NEW or MODIFIED or being DELETED.** Omit dependencies that are unchanged from the input.
Each included dependency object must include:
- id (integer, negative if new, re-use from input otherwise)
- from_task (source task id)
- to_task (destination task id)
- project_id and user_id (placeholders that will be filled in later)
- delete (set to 1 if you want to delete the dependency, 0 otherwise)

The summary should be a short description of your generated or edited tasks and dependencies, or the aforementioned helpful response if no changes at all are required. Two sentences, maximum.

Ensure that the output adheres strictly to the following JSON schema (unless the 'no_changes_required' case applies):
${jsonSchema}

Be thoughtful and detailed. The goal is to create a structured blueprint of the steps needed to achieve the goal, with realistic precedence and parallelization. Output only the JSON structure for the tasks and dependencies, adhering strictly to the schema provided. If you are editing existing nodes/dependencies, only include the ones you have edited, marked as 'no_change' (for tasks only), or marked for deletion in the output. Remember to place modified/new nodes so that the graph is readable by adjusting x and y positions, readable left to right.`;

  // Construct the user prompt part, including current state if available
  const userPrompt = currentState
    ? `Current project state:\n${JSON.stringify(currentState, null, 2)}\n\nPlease generate an updated project plan based on the current user request and conversation history.`
    : `Generate a structured project plan based on the current user request and conversation history.`;

  const messages = [
    { role: "system", content: systemPrompt },
    // Note: The user's latest message is already included in the system prompt's history section.
    // We still include a user role message, but it might be less critical now.
    { role: "user", content: userPrompt }
  ];

  // --- Log the prompt ---
  //console.log("--- AI Prompt ---");
  //console.log(JSON.stringify(messages, null, 2));
  // --- End log ---

  try {
    const completion = await openai.chat.completions.create({
      model: "gemini-2.5-flash-preview-04-17", // Change model if desired.
      messages: messages,
      temperature: 0.7,
    });

    // --- Log the raw response ---
    //console.log("--- AI Raw Response ---");
    //console.log(JSON.stringify(completion, null, 2));
    // --- End log ---

    const responseText = completion.choices[0].message.content.replace("```json", "").replace("```", "").trim();

    // Post-process the response to affix project, user id
    let responseTasks = JSON.parse(responseText);

    // Ensure tasks and dependencies arrays exist even if AI omits them when no_changes_required is true
    responseTasks.tasks = responseTasks.tasks || [];
    responseTasks.dependencies = responseTasks.dependencies || [];

    responseTasks.tasks.forEach(task => {
      if (!task.no_change) {
        task.project_id = projectId;
        task.user_id = userId;
      }
    });
    responseTasks.dependencies.forEach(dep => {
      dep.project_id = projectId;
      dep.user_id = userId;
    });

    // Ensure summary is always present.
    responseTasks.summary = responseTasks.summary || (responseTasks.no_changes_required ? "Okay." : "No summary provided.");

    return responseTasks;

  } catch (error) {
    console.error("Error generating project structure:", error);
    throw error;
  }
}

// Endpoint to generate a project structure using OpenAI.
app.post('/api/generate', isAuthenticated, isPremium, async (req, res) => {
  // Accept topic, project_id, and an optional current_state from the request body.
  const { user_input: user_input, project_id, current_state, chat_history } = req.body; // Added chat_history
  if (!user_input || !project_id) {
    return res.status(400).json({ error: "Missing topic or project_id" });
  }
  try {
    const projectData = await generativeEdit(user_input, project_id, req.session.user.id, current_state, chat_history); // Pass chat_history
    res.json({ data: projectData });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate project structure" });
  }
});

app.post('/api/log-error', express.json(), (req, res) => {
  const { message, stack, componentStack, url, userAgent, timestamp } = req.body;
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

// 2) Your new bulk-change handler
// --- BULK CHANGE ENDPOINT (Authenticated) ---
app.post('/api/bulk-change', isAuthenticated, async (req, res) => {
  const { project_id, tasks, dependencies } = req.body;
  const userId = req.session.user.id;
  const idMap = {};      // tempId → realId
  const tasksCreated = [];
  const depsCreated = [];

  try {
    await runAsync("BEGIN TRANSACTION");

    // 3) Insert new tasks one by one, capturing real IDs
    for (let t of tasks.created) {
      const realId = await runAsync(
        `INSERT INTO tasks
           (title,posX,posY,completed,color,project_id,user_id)
         VALUES (?,?,?,?,?,?,?)`,
        [t.title, t.posX, t.posY, t.completed, t.color, project_id, userId]
      );
      idMap[t.tempId] = realId;
      tasksCreated.push({ tempId: String(t.tempId), newId: realId });
    }

    // 4) Update existing tasks
    for (let t of tasks.updated) {
      await runAsync(
        `UPDATE tasks
            SET title=?,posX=?,posY=?,completed=?,color=?,project_id=?
          WHERE id=? AND user_id=?`,
        [t.title, t.posX, t.posY, t.completed, t.color, project_id, t.id, userId]
      );
    }

    // 5) Delete tasks (and cascade-cleanup dependencies)
    for (let id of tasks.deleted) {
      await runAsync(
        `DELETE FROM dependencies
           WHERE (from_task=? OR to_task=?) AND user_id=?`,
        [id, id, userId]
      );
      await runAsync(
        `DELETE FROM tasks WHERE id=? AND user_id=?`,
        [id, userId]
      );
    }

    // 6) Now insert new dependencies — **using the real task IDs**!
    for (let d of dependencies.created) {
      const from = idMap[d.from_task] || d.from_task;
      const to = idMap[d.to_task] || d.to_task;
      const newDepId = await runAsync(
        `INSERT INTO dependencies
           (from_task,to_task,project_id,user_id)
         VALUES (?,?,?,?)`,
        [from, to, project_id, userId]
      );
      depsCreated.push({ from_task: from, to_task: to, newId: newDepId });
    }

    // 7) Updates & deletes for dependencies
    for (let d of dependencies.updated) {
      await runAsync(
        `UPDATE dependencies
            SET from_task=?,to_task=?,project_id=?
          WHERE id=? AND user_id=?`,
        [d.from_task, d.to_task, project_id, d.id, userId]
      );
    }
    for (let id of dependencies.deleted) {
      await runAsync(
        `DELETE FROM dependencies WHERE id=? AND user_id=?`,
        [id, userId]
      );
    }

    // 8) Commit
    await runAsync("COMMIT");
    res.json({ tasksCreated, dependenciesCreated: depsCreated });

  } catch (err) {
    await runAsync("ROLLBACK");
    console.error("bulk-change failed:", err);
    res.status(500).json({ error: err.message });
  }
});

export default app; // Export the app for testing purposes