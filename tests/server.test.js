import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

test('servidor PWA: catálogo, SSR, reseñas y VAPID', async () => {
  const port = await new Promise(resolve => {
    const server = createServer().listen(0, '127.0.0.1', () => {
      const number = server.address().port;
      server.close(() => resolve(number));
    });
  });
  const child = spawn(process.execPath, ['server.js'], { cwd: new URL('..', import.meta.url), env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
  const base = 'http://127.0.0.1:' + port;
  try {
    let ready = false;
    for (let i = 0; i < 40; i++) {
      try { const response = await fetch(base); ready = response.ok; if (ready) break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, 'El servidor debe iniciar');
    const shell = await (await fetch(base)).text();
    assert.match(shell, /manifest.json/);
    const manifest = await (await fetch(base + '/manifest.json')).json();
    assert.equal(manifest.display, 'standalone');
    const catalog = await (await fetch(base + '/api/catalog')).json();
    assert.equal(catalog.length, 3);
    const ssr = await (await fetch(base + '/lugar/' + catalog[0].id)).text();
    assert.match(ssr, /data-ssr-place/);
    assert.doesNotMatch(ssr, /Lugares para descubrir/);
    assert.match(ssr, /<base href="\/">/);
    const key = await (await fetch(base + '/api/push/key')).json();
    assert.ok(key.publicKey);
    const review = { id: crypto.randomUUID(), placeId: catalog[0].id, text: 'Prueba automatizada' };
    const saved = await fetch(base + '/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(review) });
    assert.equal(saved.status, 201);
    const reviews = await (await fetch(base + '/api/reviews?placeId=' + catalog[0].id)).json();
    assert.ok(reviews.some(item => item.id === review.id));
    const forbidden = await fetch(base + '/api/push/send', { method: 'POST' });
    assert.equal(forbidden.status, 403);
    const unknown = await fetch(base + '/not-found');
    assert.equal(unknown.status, 404);
  } finally {
    child.kill();
  }
});
