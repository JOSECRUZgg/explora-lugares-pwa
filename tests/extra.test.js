import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { distanceKm } from '../public/device.js';

test('distancia de dispositivo', () => {
  assert.equal(distanceKm({ lat: 20, lon: -100 }, { lat: 20, lon: -100 }), 0);
  assert.ok(distanceKm({ lat: 20, lon: -100 }, { lat: 21, lon: -100 }) > 100);
});

test('service worker muestra offline.html en una ficha no guardada', async () => {
  const handlers = {};
  const source = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
  const shell = new Response('shell');
  const offline = new Response('offline');
  const context = {
    self: {
      location: { origin: 'https://example.com', href: 'https://example.com/app/sw.js' },
      addEventListener: (name, handler) => { handlers[name] = handler; }
    },
    caches: { match: async key => key === './index.html' ? shell : key === './offline.html' ? offline : undefined },
    fetch: async () => { throw new Error('Sin red'); },
    URL, Request, Response, Promise
  };
  runInNewContext(source, context);
  let response;
  handlers.fetch({
    request: { method: 'GET', mode: 'navigate', url: 'https://example.com/app/lugar/plaza-centro' },
    respondWith: promise => { response = promise; },
    waitUntil: () => {}
  });
  assert.equal(await (await response).text(), 'offline');
});
