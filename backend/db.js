import Database from 'better-sqlite3';

const db = new Database('./todos.db');
db.pragma('foreign_keys = ON');

export { db };