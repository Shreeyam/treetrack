// index.js -----------------------------------------------------------
import http from 'http';
import expressWs from 'express-ws';
import { WebSocketServer } from 'ws';
import { Hocuspocus } from "@hocuspocus/server";
import { SQLite } from '@hocuspocus/extension-sqlite';
import * as Y from "yjs";

import { app, sessionParser, db } from './server.js';

const server = http.createServer(app);
//expressWs(app, server);
const wss = new WebSocketServer({ noServer: true });

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

server.on('upgrade', (req, socket, head) => {
  // Parse the session cookie **before** we decide about the upgrade
  sessionParser(req, {}, (err) => {
    const user = req.session?.user;
    if (err || !user) {
      // Log unauthorized access attempt
      console.log('Unauthorized access attempt:', {
        error: err,
        user: user,
        url: req.url,
      });

      // 401 – no valid session
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      return socket.destroy();                 // handshake rejected
    }

    // Path looks like /collaboration/<projectId>
    const [, , projectId] = req.url.split('/');

    const row = db.prepare(PROJECT_QUERY).get(user.id, projectId);
    if (!row) {
      // Log forbidden access attempt
      console.log('Forbidden access attempt:', {
        userId: user.id,
        projectId: projectId,
        url: req.url,
      });

      // 403 – user has no access to this project
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      return socket.destroy();
    }

    // All good – complete the upgrade and hand over to Hocuspocus
    wss.handleUpgrade(req, socket, head, (ws) => {
      collaborationServer.handleConnection(ws, req, { user });
    });
  });
});

server.listen(3001, () =>
  console.log('HTTP & Hocuspocus listening on http://localhost:3001'),
);

