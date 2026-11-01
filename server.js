import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';

const root = resolve(import.meta.dirname, 'public');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const port = Number(process.env.PORT || 3000);

createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(join(root, pathname === '/' ? 'index.html' : pathname));
    if (file !== root && !file.startsWith(root + sep)) throw new Error('Invalid path');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('No encontrado');
  }
}).listen(port, () => console.log('PWA: http://localhost:' + port));
