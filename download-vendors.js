// ============================================================
// download-vendors.js
// Download tất cả CDN scripts vào public/vendors/
// Chạy trong Docker build: node download-vendors.js
// ============================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VENDORS_DIR = path.join('public', 'vendors');
if (!fs.existsSync(VENDORS_DIR)) fs.mkdirSync(VENDORS_DIR, { recursive: true });

// Map: tên file output → package@version + đường dẫn UMD trong node_modules
const PACKAGES = [
  {
    out:  'react.production.min.js',
    pkg:  'react@18',
    src:  'node_modules/react/umd/react.production.min.js',
  },
  {
    out:  'react-dom.production.min.js',
    pkg:  'react-dom@18',
    src:  'node_modules/react-dom/umd/react-dom.production.min.js',
  },
  {
    out:  'babel.min.js',
    pkg:  '@babel/standalone',
    src:  'node_modules/@babel/standalone/babel.min.js',
  },
  {
    out:  'prop-types.min.js',
    pkg:  'prop-types@15.8.1',
    src:  'node_modules/prop-types/prop-types.min.js',
  },
  {
    out:  'Recharts.min.js',
    pkg:  'recharts@2.12.7',
    src:  'node_modules/recharts/umd/Recharts.js',
  },
  {
    out:  'html2canvas.min.js',
    pkg:  'html2canvas@1.4.1',
    src:  'node_modules/html2canvas/dist/html2canvas.min.js',
  },
  {
    out:  'jspdf.umd.min.js',
    pkg:  'jspdf@2.5.1',
    src:  'node_modules/jspdf/dist/jspdf.umd.min.js',
  },
];

console.log('[vendors] Bắt đầu cài vendor packages...');

// npm install tất cả packages
const pkgList = PACKAGES.map(p => p.pkg).join(' ');
try {
  execSync(
    `npm install --no-save --prefer-offline ${pkgList}`,
    { stdio: 'inherit' }
  );
} catch (e) {
  console.error('[vendors] npm install thất bại:', e.message);
  process.exit(1);
}

// Copy UMD files vào public/vendors/
let ok = 0, fail = 0;
for (const { out, src } of PACKAGES) {
  const dest = path.join(VENDORS_DIR, out);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    const kb = (fs.statSync(dest).size / 1024).toFixed(0);
    console.log(`[vendors] ✅ ${out} (${kb} KB)`);
    ok++;
  } else {
    console.error(`[vendors] ❌ Không tìm thấy: ${src}`);
    fail++;
  }
}

if (fail > 0) {
  console.error(`[vendors] ${fail} file bị thiếu — kiểm tra lại package paths`);
  process.exit(1);
}

// Patch index.html: thay CDN URLs → /vendors/ paths
const HTML_PATH = path.join('public', 'index.html');
if (!fs.existsSync(HTML_PATH)) {
  console.warn('[vendors] Không tìm thấy public/index.html — bỏ qua patch');
  process.exit(0);
}

let html = fs.readFileSync(HTML_PATH, 'utf8');
const REPLACEMENTS = [
  ['https://unpkg.com/react@18/umd/react.production.min.js',              '/vendors/react.production.min.js'],
  ['https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',      '/vendors/react-dom.production.min.js'],
  ['https://unpkg.com/@babel/standalone/babel.min.js',                    '/vendors/babel.min.js'],
  ['https://unpkg.com/prop-types@15.8.1/prop-types.min.js',              '/vendors/prop-types.min.js'],
  ['https://cdn.jsdelivr.net/npm/recharts@2.12.7/umd/Recharts.min.js',   '/vendors/Recharts.min.js'],
  ['https://cdn.jsdelivr.net/npm/recharts@2.12.7/umd/Recharts.js',        '/vendors/Recharts.min.js'],
  ['https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', '/vendors/html2canvas.min.js'],
  ['https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', '/vendors/jspdf.umd.min.js'],
];

let patched = 0;
for (const [cdn, local] of REPLACEMENTS) {
  if (html.includes(cdn)) {
    html = html.replaceAll(cdn, local);
    console.log(`[vendors] 🔁 ${path.basename(local)}`);
    patched++;
  }
}

fs.writeFileSync(HTML_PATH, html, 'utf8');
console.log(`\n[vendors] Done — ${ok} files, ${patched} URL patches trong index.html`);
