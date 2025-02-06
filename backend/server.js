// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
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

// Configure sessions with a SQLite store.
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: './' }),
  secret: crypto.randomBytes(64).toString('hex'), 
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 days persistence
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
      FOREIGN KEY(from_task) REFERENCES tasks(id),
      FOREIGN KEY(to_task) REFERENCES tasks(id),
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

// Rate limiter for the login endpoint.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
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
      function(err) {
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
        req.session.user = { id: user.id, username: user.username };
        res.json({ id: user.id, username: user.username });
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
  db.run("INSERT INTO projects (name, user_id) VALUES (?, ?)", [name, req.session.user.id], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID, name });
  });
});

app.delete('/api/projects/:id', isAuthenticated, (req, res) => {
  const projectId = req.params.id;
  db.serialize(() => {
    db.run("DELETE FROM dependencies WHERE project_id = ? AND user_id = ?", [projectId, req.session.user.id], function(err) {
      if (err) return res.status(400).json({ error: err.message });
      db.run("DELETE FROM tasks WHERE project_id = ? AND user_id = ?", [projectId, req.session.user.id], function(err2) {
        if (err2) return res.status(400).json({ error: err2.message });
        db.run("DELETE FROM projects WHERE id = ? AND user_id = ?", [projectId, req.session.user.id], function(err3) {
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
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.put('/api/tasks/:id', isAuthenticated, (req, res) => {
  const { title, posX, posY, completed, project_id } = req.body;
  db.run(
    "UPDATE tasks SET title = ?, posX = ?, posY = ?, completed = ?, project_id = ? WHERE id = ? AND user_id = ?",
    [title, posX, posY, completed, project_id, req.params.id, req.session.user.id],
    function(err) {
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
      function(err) {
        if (err) return res.status(400).json({ error: err.message });
        db.run(
          "DELETE FROM tasks WHERE id = ? AND user_id = ?",
          [req.params.id, req.session.user.id],
          function(err2) {
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
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.delete('/api/dependencies/:id', isAuthenticated, (req, res) => {
  db.run("DELETE FROM dependencies WHERE id = ? AND user_id = ?", [req.params.id, req.session.user.id], function(err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// --- Start the server ---
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
