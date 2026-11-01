import { getLocation, distanceKm } from './device.js';
import { localNotification, subscribePush } from './notifications.js';
import { saveReview, localReviews, sendPending } from './reviews.js';
import { get, put } from './storage.js';
const app = document.querySelector('#app');
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let routes = [];
let installPrompt;

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  render();
});
window.addEventListener('appinstalled', () => { installPrompt = null; render(); });

async function catalog() {
  try {
    const response = await fetch('./api/catalog');
    if (!response.ok) throw new Error('API no disponible');
    const data = await response.json();
    await put('catalog', data, 'routes');
    return data;
  } catch {
    try {
      const response = await fetch('./data/catalog.json');
      if (!response.ok) throw new Error('Catálogo no disponible');
      const data = await response.json();
      await put('catalog', data, 'routes');
      return data;
    } catch {
      const saved = await get('catalog', 'routes');
      if (saved) return saved;
      throw new Error('Catálogo no disponible');
    }
  }
}
function render() {
  if (document.querySelector('[data-ssr-route]') && !location.hash) {
    hydrateSSR();
    return;
  }
  const [, page, id] = location.hash.split('/');
  if (page === 'catalogo') {
    app.innerHTML = '<h1>Catálogo de rutas</h1><div class="grid">' + routes.map(route =>
      '<article class="card"><h2>' + escapeHtml(route.name) + '</h2><p>' + escapeHtml(route.description) + '</p><p class="muted">' + escapeHtml(route.duration) + '</p><a href="#/ruta/' + encodeURIComponent(route.id) + '">Ver ficha</a></article>'
    ).join('') + '</div>';
  } else if (page === 'ruta') {
    const route = routes.find(item => item.id === id);
    app.innerHTML = route ? '<article class="card"><h1>' + escapeHtml(route.name) + '</h1><p>' + escapeHtml(route.description) + '</p><p>Duración estimada: ' + escapeHtml(route.duration) + '</p><a href="./ruta/' + encodeURIComponent(route.id) + '">Ver ficha SSR</a><h2>Reseñas</h2><div id="reviews"></div><form id="review-form" data-route="' + escapeHtml(route.id) + '"><label for="review-text">Tu reseña</label><textarea id="review-text" maxlength="500" required></textarea><button>Guardar reseña</button></form></article>' : '<h1>Ruta no encontrada</h1>';
  } else if (page === 'cerca') {
    app.innerHTML = '<h1>Cerca de mí</h1><p>Usamos tu ubicación solo cuando pulsas el botón.</p><button id="locate">Buscar rutas cercanas</button><div id="nearby"></div>';
  } else {
    app.innerHTML = '<section class="hero"><h1>Muévete por la Sierra</h1><p>Rutas y paradas a mano, incluso sin conexión.</p><a href="#/catalogo"><button>Explorar rutas</button></a> ' + (installPrompt ? '<button id="install">Instalar aplicación</button>' : '') + '</section><p><button id="notify-local">Probar notificación local</button> <button id="push-subscribe">Activar push</button></p><p><label><input id="compact" type="checkbox" ' + (localStorage.getItem('compact') === 'true' ? 'checked' : '') + '> Vista compacta</label></p>';
  }
  if (page === 'ruta' && id) showReviews(id);
}
async function showReviews(id) {
  const node = document.querySelector('#reviews');
  if (!node) return;
  const local = await localReviews(id);
  let remote = [];
  try { const response = await fetch('./api/reviews?routeId=' + encodeURIComponent(id)); if (response.ok) remote = await response.json(); } catch {}
  node.innerHTML = [...local.map(item => ({...item, pending: true})), ...remote].map(item => '<p class="card">' + escapeHtml(item.text) + (item.pending ? ' <small>(pendiente de envío)</small>' : '') + '</p>').join('') || '<p>Aún no hay reseñas.</p>';
}
function hydrateSSR() {
  const article = document.querySelector('[data-ssr-route]');
  if (!article) return;
  const target = article.querySelector('#hydrated-detail');
  if (!target || target.dataset.ready) return;
  target.dataset.ready = 'true';
  target.innerHTML = '<h2>Reseñas</h2><div id="reviews"></div><form id="review-form" data-route="' + escapeHtml(article.dataset.ssrRoute) + '"><label for="review-text">Tu reseña</label><textarea id="review-text" maxlength="500" required></textarea><button>Guardar reseña</button></form>';
  showReviews(article.dataset.ssrRoute);
}
document.addEventListener('click', async event => {
  if (event.target.id !== 'locate') return;
  const target = document.querySelector('#nearby');
  try {
    const point = await getLocation();
    target.innerHTML = '<div class="grid">' + routes.map(route => ({...route, distance: distanceKm(point, {lat:route.lat, lon:route.lon})})).sort((a,b) => a.distance-b.distance).map(route => '<article class="card"><h2>' + escapeHtml(route.name) + '</h2><p>' + route.distance.toFixed(1) + ' km de tu ubicación</p><a href="#/ruta/' + encodeURIComponent(route.id) + '">Ver ruta</a></article>').join('') + '</div>';
  } catch (error) { target.textContent = error.message; }
});
document.addEventListener('submit', async event => {
  if (event.target.id !== 'review-form') return;
  event.preventDefault();
  const text = event.target.querySelector('textarea');
  try { await saveReview(event.target.dataset.route, text.value); text.value = ''; await showReviews(event.target.dataset.route); }
  catch (error) { alert(error.message); }
});
document.addEventListener('change', event => {
  if (event.target.id === 'compact') {
    localStorage.setItem('compact', String(event.target.checked));
    document.body.classList.toggle('compact', event.target.checked);
  }
});
document.body.classList.toggle('compact', localStorage.getItem('compact') === 'true');
document.addEventListener('click', async event => {
  if (event.target.id !== 'install' || !installPrompt) return;
  await installPrompt.prompt();
  installPrompt = null;
  render();
});
window.addEventListener('hashchange', render);
catalog().then(data => { routes = data; render(); }).catch(() => {
  app.innerHTML = '<p class="notice">No se pudo cargar el catálogo. Reintenta cuando tengas conexión.</p>';
});
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      const promptUpdate = () => {
        if (!registration.waiting || !navigator.serviceWorker.controller) return;
        document.querySelector('#toast').innerHTML = 'Hay una versión nueva. <button id="update">Actualizar</button>';
      };
      if (registration.waiting) promptUpdate();
      registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', promptUpdate));
      navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
      document.addEventListener('click', event => {
        if (event.target.id === 'update') registration.waiting?.postMessage('SKIP_WAITING');
      });
    } catch (error) { console.error(error); }
  });
}

function updateConnection() {
  const label = document.querySelector('#connection');
  label.textContent = navigator.onLine ? 'En línea' : 'Sin conexión';
  label.style.color = navigator.onLine ? '#dcfce7' : '#fde68a';
}
window.addEventListener('online', updateConnection);
window.addEventListener('offline', updateConnection);
updateConnection();

sendPending().catch(console.error);

document.addEventListener('click', async event => {
  try {
    if (event.target.id === 'notify-local') await localNotification();
    if (event.target.id === 'push-subscribe') { await subscribePush(); document.querySelector('#toast').textContent = 'Notificaciones push activadas'; }
  } catch (error) { document.querySelector('#toast').textContent = error.message; }
});
