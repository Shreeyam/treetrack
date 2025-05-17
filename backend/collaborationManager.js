// collaborationManager.js
// Manages WebSocket connections for each project

// Map of projectId -> Map of WebSocket connection to user
export const projectSockets = new Map();

/**
 * Register a new WebSocket connection for a project
 * @param {string} projectId
 * @param {WebSocket} ws
 * @param {object} user - the authenticated user for this connection
 */
export function registerConnection(projectId, ws, user) {
  const connMap = projectSockets.get(projectId) || new Map();
  connMap.set(ws, user);
  projectSockets.set(projectId, connMap);
  {
    // Log active connections with user info
    const activeConns = projectSockets.get(projectId) || new Map();
    console.log(
      `Active connections for project ${projectId}:`,
      Array.from(activeConns.entries()).map(([conn, user]) => ({
        readyState: conn.readyState,
        remoteAddress: conn._socket?.remoteAddress,
        remotePort: conn._socket?.remotePort,
        user
      }))
    );
  }
}

/**
 * Unregister a WebSocket connection for a project
 */
export function unregisterConnection(projectId, ws) {
  const connMap = projectSockets.get(projectId);
  if (connMap) {
    connMap.delete(ws);
    if (connMap.size === 0) {
      projectSockets.delete(projectId);
    }
  }
}

/**
 * Close connections for a project.
 * If reason is provided, only connections for that userId are closed and sent the reason.
 * Otherwise, all connections for the project are closed for project deletion.
 * We will use this to close all connections when a project is deleted and to revoke acces to a project when the owner changes roles for people.
 * @param {string} projectId
 * @param {number} [userId] - optional user ID to close only that user's connections
 * @param {string} [reason] - optional reason to send to the user(s)
 */
export function closeProjectConnections(projectId, userId, reason) {
  const connMap = projectSockets.get(projectId);
  if (!connMap) return;
  for (const [ws, user] of connMap.entries()) {
    // skip other users when doing a user-specific close
    if (reason != null && user.id !== userId) continue;
    const payload = reason != null
      ? { type: 'connectionClosed', projectId, reason }
      : { type: 'projectDeleted', projectId };
    try {
      ws.send(JSON.stringify(payload));
    } catch (err) {
      console.error('Error sending close message:', err);
    }
    ws.close();
    connMap.delete(ws);
  }
  // remove project entry if no connections remain
  if (connMap.size === 0) {
    projectSockets.delete(projectId);
  }
}
