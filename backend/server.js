// server.js
const express = require('express');
const Database = require('better-sqlite3'); // Use better-sqlite3
const cors = require('cors');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const app = express();
const port = 3001;

app.use(cors({
  origin: true, // allow credentials from any origin for testing; restrict in production!
  credentials: true
}));
app.use(express.json());

app.set('trust proxy', 1);

// Configure sessions with a SQLite store.
// Note: Ensure connect-sqlite3 is compatible or consider alternatives if issues arise.
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: './' }),
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, secure: process.env.NODE_ENV === 'production', domain: process.env.NODE_ENV === 'production' ? 'treetrack.shreey.am' : undefined } // 7 days persistence
}));

// Connect to our main SQLite DB using better-sqlite3.
let db;
try {
  db = new Database('./todos.db', { verbose: console.log }); // Add verbose for debugging if needed
  console.log('Connected to SQLite database.');
  db.pragma('journal_mode = WAL'); // Recommended for better concurrency
  db.pragma('foreign_keys = ON');
} catch (err) {
  console.error("Error connecting to SQLite database:", err.message);
  process.exit(1); // Exit if DB connection fails
}

// Initialize database schema
try {
  db.exec(`
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
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE -- Added ON DELETE CASCADE
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
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE, -- Added ON DELETE CASCADE
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE -- Added ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dependencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_task INTEGER,
      to_task INTEGER,
      project_id INTEGER,
      user_id INTEGER,
      FOREIGN KEY(from_task) REFERENCES tasks(id) ON DELETE CASCADE, -- Added ON DELETE CASCADE
      FOREIGN KEY(to_task) REFERENCES tasks(id) ON DELETE CASCADE, -- Added ON DELETE CASCADE
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE, -- Added ON DELETE CASCADE
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE -- Added ON DELETE CASCADE
    );
  `);
} catch (err) {
  console.error("Error initializing database schema:", err.message);
}

// Middleware to check for an authenticated user.
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: "Not authenticated" });
}

// Rate limiter for the login endpoint.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: "Too many login attempts from this IP, please try again after 15 minutes"
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
    const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
    const info = stmt.run(username, hashedPassword);
    // Automatically log in the new user.
    req.session.user = { id: info.lastInsertRowid, username };
    res.json({ id: info.lastInsertRowid, username });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({ error: "Username already exists" });
    }
    console.error("Registration error:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// Login endpoint.
app.post('/api/login', loginLimiter, async (req, res) => { // Made async
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }
  try {
    const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
    const user = stmt.get(username);

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      req.session.user = { id: user.id, username: user.username };
      res.json({ id: user.id, username: user.username });
    } else {
      res.status(400).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

// Logout endpoint.
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Could not log out" });
    }
    res.clearCookie('connect.sid'); // Optional: Clear the session cookie
    res.json({ message: "Logged out" });
  });
});

// Endpoint to get the current session's user.
app.get('/api/me', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ user: req.session.user });
  } else {
    // It's okay not to be authenticated here, just return no user
    res.json({ user: null });
  }
});

// --- PROJECT ENDPOINTS (Authenticated) ---

app.get('/api/projects', isAuthenticated, (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM projects WHERE user_id = ?");
    const projects = stmt.all(req.session.user.id);
    res.json({ projects });
  } catch (err) {
    console.error("Get projects error:", err);
    res.status(500).json({ error: "Failed to retrieve projects" });
  }
});

app.post('/api/projects', isAuthenticated, (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
      return res.status(400).json({ error: "Project name cannot be empty" });
  }
  try {
    const stmt = db.prepare("INSERT INTO projects (name, user_id) VALUES (?, ?)");
    const info = stmt.run(name, req.session.user.id);
    res.json({ id: info.lastInsertRowid, name });
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// Define transaction for deleting a project and its contents
const deleteProjectTransaction = db.transaction((projectId, userId) => {
    const deleteProjectStmt = db.prepare("DELETE FROM projects WHERE id = ? AND user_id = ?");
    const info = deleteProjectStmt.run(projectId, userId);
    return info.changes;
});

app.delete('/api/projects/:id', isAuthenticated, (req, res) => {
  const projectId = req.params.id;
  const userId = req.session.user.id;
  try {
    const changes = deleteProjectTransaction(projectId, userId);
    if (changes > 0) {
        res.json({ changes });
    } else {
        res.status(404).json({ error: "Project not found or not owned by user" });
    }
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// --- TASK ENDPOINTS (Authenticated) ---

app.get('/api/tasks', isAuthenticated, (req, res) => {
  const { project_id } = req.query;
  const userId = req.session.user.id;
  try {
    let stmt;
    let tasks;
    if (project_id) {
      const projectCheckStmt = db.prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
      const project = projectCheckStmt.get(project_id, userId);
      if (!project) {
          return res.status(403).json({ error: "Access denied to this project's tasks" });
      }
      stmt = db.prepare("SELECT * FROM tasks WHERE user_id = ? AND project_id = ?");
      tasks = stmt.all(userId, project_id);
    } else {
      tasks = [];
    }
    res.json({ tasks });
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ error: "Failed to retrieve tasks" });
  }
});

app.post('/api/tasks', isAuthenticated, (req, res) => {
  const { title, posX, posY, completed, project_id } = req.body;
  const userId = req.session.user.id;

  if (!title || title.trim() === '') {
      return res.status(400).json({ error: "Task title cannot be empty" });
  }
  if (!project_id) {
      return res.status(400).json({ error: "Project ID is required" });
  }

  try {
    const projectCheckStmt = db.prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
    const project = projectCheckStmt.get(project_id, userId);
    if (!project) {
        return res.status(403).json({ error: "Cannot add task to this project" });
    }

    const stmt = db.prepare(
      "INSERT INTO tasks (title, posX, posY, completed, project_id, user_id) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const info = stmt.run(title, posX || 0, posY || 0, completed || 0, project_id, userId);
    res.json({ id: info.lastInsertRowid, title, posX: posX || 0, posY: posY || 0, completed: completed || 0, project_id, color: null });
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

app.put('/api/tasks/:id', isAuthenticated, (req, res) => {
  const taskId = req.params.id;
  const userId = req.session.user.id;
  const { title, posX, posY, completed, color, project_id } = req.body;

  if (title !== undefined && title.trim() === '') {
      return res.status(400).json({ error: "Task title cannot be empty" });
  }

  try {
    const taskCheckStmt = db.prepare("SELECT id, project_id FROM tasks WHERE id = ? AND user_id = ?");
    const task = taskCheckStmt.get(taskId, userId);
    if (!task) {
        return res.status(404).json({ error: "Task not found or not owned by user" });
    }

    const updates = [];
    const params = [];
    if (title !== undefined) { updates.push("title = ?"); params.push(title); }
    if (posX !== undefined) { updates.push("posX = ?"); params.push(posX); }
    if (posY !== undefined) { updates.push("posY = ?"); params.push(posY); }
    if (completed !== undefined) { updates.push("completed = ?"); params.push(Number(completed)); }
    if (color !== undefined) { updates.push("color = ?"); params.push(color); }

    if (updates.length === 0) {
        return res.status(400).json({ error: "No update fields provided" });
    }

    params.push(taskId);
    params.push(userId);

    const sql = `UPDATE tasks SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`;
    const stmt = db.prepare(sql);
    const info = stmt.run(...params);

    if (info.changes > 0) {
        const updatedTaskStmt = db.prepare("SELECT * FROM tasks WHERE id = ?");
        const updatedTask = updatedTaskStmt.get(taskId);
        res.json(updatedTask);
    } else {
        res.status(404).json({ error: "Task not found or update failed" });
    }
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

const deleteTaskTransaction = db.transaction((taskId, userId) => {
    const deleteTaskStmt = db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?");
    const info = deleteTaskStmt.run(taskId, userId);
    return info.changes;
});

app.delete('/api/tasks/:id', isAuthenticated, (req, res) => {
  const taskId = req.params.id;
  const userId = req.session.user.id;
  try {
    const changes = deleteTaskTransaction(taskId, userId);
     if (changes > 0) {
        res.json({ changes });
    } else {
        res.status(404).json({ error: "Task not found or not owned by user" });
    }
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// --- DEPENDENCY ENDPOINTS (Authenticated) ---

app.get('/api/dependencies', isAuthenticated, (req, res) => {
  const { project_id } = req.query;
  const userId = req.session.user.id;
  try {
    let stmt;
    let dependencies;
    if (project_id) {
      const projectCheckStmt = db.prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
      const project = projectCheckStmt.get(project_id, userId);
      if (!project) {
          return res.status(403).json({ error: "Access denied to this project's dependencies" });
      }
      stmt = db.prepare("SELECT * FROM dependencies WHERE user_id = ? AND project_id = ?");
      dependencies = stmt.all(userId, project_id);
    } else {
      dependencies = [];
    }
    res.json({ dependencies });
  } catch (err) {
    console.error("Get dependencies error:", err);
    res.status(500).json({ error: "Failed to retrieve dependencies" });
  }
});

app.post('/api/dependencies', isAuthenticated, (req, res) => {
  const { from_task, to_task, project_id } = req.body;
  const userId = req.session.user.id;

  if (!from_task || !to_task || !project_id) {
      return res.status(400).json({ error: "Missing required fields (from_task, to_task, project_id)" });
  }
  if (from_task === to_task) {
      return res.status(400).json({ error: "Cannot create a dependency from a task to itself" });
  }

  try {
    const projectCheckStmt = db.prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?");
    const project = projectCheckStmt.get(project_id, userId);
    if (!project) {
        return res.status(403).json({ error: "Access denied to this project" });
    }

    const taskCheckStmt = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE id IN (?, ?) AND user_id = ? AND project_id = ?");
    const taskCheck = taskCheckStmt.get(from_task, to_task, userId, project_id);
    if (taskCheck.count !== 2) {
        return res.status(404).json({ error: "One or both tasks not found in this project for this user" });
    }

    const existingDepStmt = db.prepare("SELECT id FROM dependencies WHERE from_task = ? AND to_task = ? AND project_id = ? AND user_id = ?");
    const existingDep = existingDepStmt.get(from_task, to_task, project_id, userId);
    if (existingDep) {
        return res.status(409).json({ error: "Dependency already exists", id: existingDep.id });
    }

    const stmt = db.prepare(
      "INSERT INTO dependencies (from_task, to_task, project_id, user_id) VALUES (?, ?, ?, ?)"
    );
    const info = stmt.run(from_task, to_task, project_id, userId);
    res.json({ id: info.lastInsertRowid, from_task, to_task, project_id });
  } catch (err) {
     if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return res.status(400).json({ error: "Invalid task ID provided for dependency" });
    }
    console.error("Create dependency error:", err);
    res.status(500).json({ error: "Failed to create dependency" });
  }
});

app.delete('/api/dependencies/:id', isAuthenticated, (req, res) => {
  const dependencyId = req.params.id;
  const userId = req.session.user.id;
  try {
    const stmt = db.prepare("DELETE FROM dependencies WHERE id = ? AND user_id = ?");
    const info = stmt.run(dependencyId, userId);
     if (info.changes > 0) {
        res.json({ changes: info.changes });
    } else {
        res.status(404).json({ error: "Dependency not found or not owned by user" });
    }
  } catch (err) {
    console.error("Delete dependency error:", err);
    res.status(500).json({ error: "Failed to delete dependency" });
  }
});

// --- Start the server ---
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database connection...');
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});
