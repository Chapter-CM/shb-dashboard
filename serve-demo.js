#!/usr/bin/env node
// serve-demo.js — Mini static server để xem dashboard tại nhà
// Chạy: node serve-demo.js
// Mở:   http://localhost:3000

'use strict';
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];

  // Route mặc định → index_preview.html
  if (urlPath === '/' || urlPath === '/index.html') {
    urlPath = '/index_preview.html';
  }

  const filePath = path.join(ROOT, urlPath);

  // Chặn path traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end(`404 Not Found: ${urlPath}`);
    }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ CM Dashboard đang chạy tại http://localhost:${PORT}`);
  console.log(`   Nhấn Ctrl+C để dừng\n`);
});
