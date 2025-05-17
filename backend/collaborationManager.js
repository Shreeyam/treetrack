// collaborationManager.js
// Manages WebSocket connections for each project

// Map of projectId -> Set of WebSocket connections
export const projectSockets = new Map();

/**
 * Register a new WebSocket connection for a project
 * @param {string} projectId
 * @param {WebSocket} ws
 */
export function registerConnection(projectId, ws) {
  const set = projectSockets.get(projectId) || new Set();
  set.add(ws);
  projectSockets.set(projectId, set);
}

/**
 * Unregister a WebSocket connection for a project
 * @param {string} projectId
 * @param {WebSocket} ws
 */
export function unregisterConnection(projectId, ws) {
  const set = projectSockets.get(projectId);
  if (set) {
    set.delete(ws);
    if (set.size === 0) {
      projectSockets.delete(projectId);
    }
  }
}

/**
 * Send a project deleted message and close all connections
 * @param {string} projectId
 */
export function closeProjectConnections(projectId) {
  const set = projectSockets.get(projectId);
  if (set) {
    for (const ws of set) {
      try {
        ws.send(JSON.stringify({ type: 'projectDeleted', projectId }));
      } catch (err) {
        console.error('Error sending projectDeleted message:', err);
      }
      ws.close();
    }
    projectSockets.delete(projectId);
  }
}
