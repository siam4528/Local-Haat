// Small local server for the prototype: node serve.js, then open http://localhost:4173
// Map tiles need a web address (OpenStreetMap can refuse requests from file:// pages). Listens on this computer only.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 4173;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };

http.createServer((req, res) => {
  let rel;
  try { rel = decodeURIComponent(req.url.split('?')[0]); } catch (e) { rel = ''; }
  const file = path.resolve(ROOT, '.' + (rel === '/' ? '/index.html' : rel));
  if ((file !== ROOT && !file.startsWith(ROOT + path.sep)) || !TYPES[path.extname(file)]) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)], 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
}).listen(PORT, '127.0.0.1', () => console.log('LocalHaat prototype: http://localhost:' + PORT));
