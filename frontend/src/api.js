// src/api.js
const API_BASE = 'http://localhost:3001';

export const fetchTasks = async () => {
  const res = await fetch(`${API_BASE}/tasks`);
  return res.json();
};

export const fetchDependencies = async () => {
  const res = await fetch(`${API_BASE}/dependencies`);
  return res.json();
};

export const createTask = async (title, description) => {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });
  return res.json();
};

export const createDependency = async (child, parent) => {
  const res = await fetch(`${API_BASE}/dependencies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ child, parent }),
  });
  return res.json();
};
