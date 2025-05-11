// index.js -----------------------------------------------------------
import http from 'http';
import expressWs from 'express-ws';
import { Hocuspocus } from "@hocuspocus/server";
import { SQLite } from '@hocuspocus/extension-sqlite';

import { app, sessionParser, db } from './server.js';

// 1️⃣ ONE shared HTTP server
const server = http.createServer(app);

// 2️⃣ Patch Express for *other* ws routes (if you need them)
expressWs(app, server);

// 3️⃣ Hocuspocus piggy‑backs automatically
const collaborationServer = new Hocuspocus({
// piggy‑back, no own listener
  extensions: [ new SQLite({ database: 'yjs.db' }) ],
  async onConnect(data) {
    // Output some information
    console.log(`New websocket connection to document: ${data.documentName}`);
  },
  onOpen() {
    console.log('onOpen -  trying to opened');
  },
});

// 4️⃣ If you still want an explicit route:
const PROJECT_QUERY =
  'SELECT 1 FROM projects WHERE user_id = ? AND id = ?';

app.ws('/collaboration/:id', (ws, req) => {
  // Parse the session first
  sessionParser(req, {}, (err) => {
    const user = req.session?.user;

    // If session failed or no user, bail out
    if (err || !user) {
      console.error('Unauthenticated WS connection:', err);
      return ws.close();
    }

    const projectId = req.params.id;

    // Check that this user actually owns / can access the project
    db.get(PROJECT_QUERY, [user.id, projectId], (dbErr, row) => {
      if (dbErr) {
        console.error('DB error during authorization:', dbErr);
        return ws.close();
      }
      if (!row) {
        console.warn(
          `User ${user.id} is not authorized for project ${projectId}`
        );
        return ws.close();
      }

      // All good — hand off to Hocuspocus
      console.log(
        `User ${user.id} authenticated for project ${projectId}, opening WS`
      );
      collaborationServer.handleConnection(ws, req, { user });
    });
  });
});

server.listen(3001, () =>
  console.log('HTTP & Hocuspocus listening on http://localhost:3001'),
);

