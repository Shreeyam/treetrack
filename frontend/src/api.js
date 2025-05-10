// src/api.js
const API_BASE = 'http://localhost:3001';

// Import functionality from hocus.js
import { initializeHocusProvider } from "./hocus.js";

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

export const fetchUser = async () => {
  const res = await fetch('/api/me', { credentials: 'include' });
  return res.json();
};

export const fetchProjects = async () => {
  const res = await fetch('/api/projects', { credentials: 'include' });
  return res.json();
};

export const createProject = async (name) => {
  const res = await fetch('/api/projects', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
};

export const deleteProject = async (projectId) => {
  const res = await fetch(`/api/projects/${projectId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
};

export const updateTask = async (taskId, taskData) => {
  await fetch(`/api/tasks/${taskId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });
};

export const deleteTask = async (taskId) => {
  await fetch(`/api/tasks/${taskId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
};

export const deleteDependency = async (dependencyId) => {
  await fetch(`/api/dependencies/${dependencyId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
};

export const generate = async (userInput, projectId, currentState) => {
  const res = await fetch('/api/generate', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_input: userInput, project_id: projectId, current_state: currentState }),
  });
  return res.json();
};

export const fetchProjectState = async (projectId) => {
  const tasksRes = await fetch(`/api/tasks?project_id=${projectId}`, { credentials: 'include' });
  const depRes   = await fetch(`/api/dependencies?project_id=${projectId}`, { credentials: 'include' });
  const tasks    = (await tasksRes.json()).tasks;
  const deps     = (await depRes.json()).dependencies;
  return { tasks, dependencies: deps };
};