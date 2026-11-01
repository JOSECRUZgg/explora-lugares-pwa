import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = resolve(import.meta.dirname, 'public');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const port = Number(process.env.PORT || 3000);
const reviewsFile = resolve(import.meta.dirname, 'data/reviews.json');
async function reviews() {
  try { return JSON.parse(await readFile(reviewsFile, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
let writes = Promise.resolve();

const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/api/reviews' && req.method === 'GET') {
      const routeId = new URL(req.url, 'http://localhost').searchParams.get('routeId');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify((await reviews()).filter(item => item.routeId === routeId)));
    }
    if (pathname === '/api/reviews' && req.method === 'POST') {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 4096) { res.writeHead(413); return res.end('Demasiado grande'); }
      }
      let review;
      try { review = JSON.parse(body); } catch { res.writeHead(400); return res.end('JSON inválido'); }
      if (!review || typeof review.id !== 'string' || !/^[0-9a-f-]{36}$/.test(review.id) || typeof review.routeId !== 'string' || typeof review.text !== 'string' || !review.text.trim() || review.text.length > 500) {
        res.writeHead(400); return res.end('Reseña inválida');
      }
      const routes = JSON.parse(await readFile(resolve(root, 'data/catalog.json'), 'utf8'));
      if (!routes.some(item => item.id === review.routeId)) { res.writeHead(400); return res.end('Ruta inválida'); }
      writes = writes.then(async () => {
        const saved = await reviews();
        if (!saved.some(item => item.id === review.id)) {
          saved.push({ id: review.id, routeId: review.routeId, text: review.text.trim(), createdAt: new Date().toISOString() });
          await mkdir(resolve(import.meta.dirname, 'data'), { recursive: true });
          await writeFile(reviewsFile, JSON.stringify(saved, null, 2));
        }
      });
      await writes;
      res.writeHead(201, { 'Content-Type': 'application/json' });
      return res.end('{"ok":true}');
    }
    if (pathname === '/api/catalog') {
      const data = await readFile(resolve(root, 'data/catalog.json'));
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(data);
    }
    if (pathname.startsWith('/ruta/')) {
      const id = pathname.slice(6);
      const routes = JSON.parse(await readFile(resolve(root, 'data/catalog.json'), 'utf8'));
      const route = routes.find(item => item.id === id);
      if (!route) throw new Error('No encontrada');
      const shell = await readFile(resolve(root, 'index.html'), 'utf8');
      const detail = '<article class="card" data-ssr-route="' + esc(route.id) + '"><h1>' + esc(route.name) + '</h1><p>' + esc(route.description) + '</p><p>Duración estimada: ' + esc(route.duration) + '</p><div id="hydrated-detail"></div></article>';
      const html = shell.replace('<main id="app" class="container" tabindex="-1">', '<main id="app" class="container" tabindex="-1">' + detail).replace('<title>Sierra Móvil</title>', '<title>' + esc(route.name) + ' · Sierra Móvil</title>');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (file !== root && !file.startsWith(root + sep)) throw new Error('Invalid path');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': (types[extname(file)] || 'application/octet-stream') + '; charset=utf-8' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('No encontrado');
  }
}).listen(port, () => console.log('PWA: http://localhost:' + port));
