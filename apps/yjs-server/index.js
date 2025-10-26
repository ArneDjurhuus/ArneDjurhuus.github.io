const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs/promises');
const fssync = require('fs');
const Y = require('yjs');
const { setupWSConnection, setPersistence } = require('y-websocket/bin/utils');

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('okay');
});

const wss = new WebSocket.Server({ server });

wss.on('listening', () => {
  console.log('[yjs] websocket server listening');
});

// Simple file-based persistence (append-only updates per doc)
const dataDir = path.join(process.cwd(), 'data');
async function ensureDir() {
  try { await fs.mkdir(dataDir, { recursive: true }); } catch {}
}

function docFile(docName) {
  const safe = encodeURIComponent(docName);
  return path.join(dataDir, `${safe}.bin`);
}

async function readUpdates(file) {
  if (!fssync.existsSync(file)) return [];
  const buf = await fs.readFile(file);
  const updates = [];
  let offset = 0;
  while (offset + 4 <= buf.length) {
    const len = buf.readUInt32BE(offset); offset += 4;
    if (offset + len > buf.length) break;
    updates.push(buf.subarray(offset, offset + len));
    offset += len;
  }
  return updates;
}

async function appendUpdate(file, update) {
  const lenBuf = Buffer.allocUnsafe(4);
  lenBuf.writeUInt32BE(update.length, 0);
  await fs.appendFile(file, Buffer.concat([lenBuf, Buffer.from(update)]));
}

setPersistence({
  bindState: async (docName, ydoc) => {
    await ensureDir();
    const file = docFile(docName);
    try {
      const ups = await readUpdates(file);
      for (const u of ups) {
        try { Y.applyUpdate(ydoc, u); } catch {}
      }
    } catch (e) {
      console.error('[yjs] failed to read updates for', docName, e?.message || e);
    }
    ydoc.on('update', async (update) => {
      try {
        await appendUpdate(file, update);
      } catch (e) {
        console.error('[yjs] failed to persist update', e?.message || e);
      }
    });
  },
  writeState: async () => {
    // No-op: we persist on each update.
    return Promise.resolve();
  }
});

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
