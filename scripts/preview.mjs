// Minimal local server for dist/.
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { ROOT } from './content.mjs';

const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 4173;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = normalize(join(DIST, path));
  if (file !== DIST && !file.startsWith(DIST + sep)) { res.writeHead(403).end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!path.endsWith('/')) { res.writeHead(301, { Location: `${path}/` }).end(); return; }
    file = join(file, 'index.html');
  }
  const found = existsSync(file);
  if (!found) file = join(DIST, '404.html');
  res.writeHead(found ? 200 : 404, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log(`Preview: http://localhost:${PORT}/`));
