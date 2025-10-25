const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection } = require('y-websocket/bin/utils');

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('okay');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (conn, req) => {
  const ip = req.socket.remoteAddress;
  const url = req.url;
  console.log(`[yjs] connection from ${ip} url=${url}`);
  conn.on('error', (err) => console.error('[yjs] ws error:', err?.message || err));
  conn.on('close', (code, reason) => console.log(`[yjs] ws close code=${code} reason=${reason}`));
  setupWSConnection(conn, req);
});

server.listen(1234, () => {
  console.log('Yjs websocket server listening on port 1234');
});
