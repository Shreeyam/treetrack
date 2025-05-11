// src/api.js

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

