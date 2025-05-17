// index.js -----------------------------------------------------------
import http from 'http';
import expressWs from 'express-ws';
import { Hocuspocus } from "@hocuspocus/server";
import { SQLite } from '@hocuspocus/extension-sqlite';
import * as Y from "yjs";
import { auth } from "./auth.js";

import { app, db } from './server.js';

const server = http.createServer(app);
expressWs(app, server);


const collaborationServer = new Hocuspocus({
  // piggy‑back, no own listener
  extensions: [new SQLite({ database: 'yjs.db' })],
  async onConnect(data) {
    // Output some information
    console.log(`New websocket connection to document: ${data.documentName}`);
  },
  async onChange(data) {

  },
  async onOpen() {
    console.log('onOpen -  trying to opened');
  },
});

const PROJECT_QUERY =
  'SELECT 1 FROM projects WHERE user_id = ? AND id = ?';

app.ws('/collaboration/:id', async (ws, req) => {
  console.log('New WebSocket connection');
  // Parse the session first
  const cookieHeader = req.headers.cookie ?? "";

  // Get the user from BetterAuth
  const { user, session } = await auth.api.getSession({
    headers: {
      cookie: cookieHeader,
      host: req.headers.host,
      "x-forwarded-proto": req.headers["x-forwarded-proto"] ?? "https",
    },
  });

  // If session failed or no user, bail out
  if (!user) {
    console.error('Unauthenticated WS connection:', err);
    return ws.close();
  }

  const projectId = req.params.id;

  try {
    // Check that this user actually owns / can access the project
    const row = db.prepare(PROJECT_QUERY).get(user.id, projectId);

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
  } catch (dbErr) {
    console.error('DB error during authorization:', dbErr);
    return ws.close();
  }

});

server.listen(3001, () =>
  console.log('HTTP & Hocuspocus listening on http://localhost:3001'),
);

