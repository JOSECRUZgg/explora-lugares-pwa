import { getLocation, distanceKm } from './device.js';
import { localNotification, subscribePush } from './notifications.js';
import { saveReview, localReviews, sendPending } from './reviews.js';
import { get, put } from './storage.js';
const app = document.querySelector('#app');
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let places = [];
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
    await put('catalog', data, 'places');
    return data;
  } catch {
    try {
      const response = await fetch('./data/catalog.json');
      if (!response.ok) throw new Error('Catálogo no disponible');
      const data = await response.json();
      await put('catalog', data, 'places');
      return data;
    } catch {
      const saved = await get('catalog', 'places');
      if (saved) return saved;
      throw new Error('Catálogo no disponible');
    }
  }
}
function render() {
  if (document.querySelector('[data-ssr-place]') && !location.hash) {
    hydrateSSR();
    return;
  }
  const [, page, id] = location.hash.split('/');
  if (page === 'catalogo') {
    app.innerHTML = '<h1>Catálogo de lugares</h1><div class="grid">' + places.map(place =>
      '<article class="card"><h2>' + escapeHtml(place.name) + '</h2><p>' + escapeHtml(place.description) + '</p><p class="muted">' + escapeHtml(place.duration) + '</p><a href="#/lugar/' + encodeURIComponent(place.id) + '">Ver ficha</a></article>'
    ).join('') + '</div>';
  } else if (page === 'lugar') {
    const place = places.find(item => item.id === id);
    app.innerHTML = place ? '<article class="card"><h1>' + escapeHtml(place.name) + '</h1><p>' + escapeHtml(place.description) + '</p><p>Tiempo sugerido: ' + escapeHtml(place.duration) + '</p><a href="./lugar/' + encodeURIComponent(place.id) + '">Ver ficha SSR</a><h2>Reseñas</h2><div id="reviews"></div><form id="review-form" data-place="' + escapeHtml(place.id) + '"><label for="review-text">Tu reseña</label><textarea id="review-text" maxlength="500" required></textarea><button>Guardar reseña</button></form></article>' : '<h1>Lugar no encontrado</h1>';
  } else if (page === 'cerca') {
    app.innerHTML = '<h1>Cerca de mí</h1><p>Usamos tu ubicación solo cuando pulsas el botón.</p><button id="locate">Buscar lugares cercanos</button><div id="nearby"></div>';
  } else {
    app.innerHTML = '<section class="hero"><h1>Descubre nuevos lugares</h1><p>Lugares y reseñas a mano, incluso sin conexión.</p><a href="#/catalogo"><button>Explorar lugares</button></a> ' + (installPrompt ? '<button id="install">Instalar aplicación</button>' : '') + '</section><p><button id="notify-local">Probar notificación local</button> <button id="push-subscribe">Activar push</button></p><p><label><input id="compact" type="checkbox" ' + (localStorage.getItem('compact') === 'true' ? 'checked' : '') + '> Vista compacta</label></p>';
  }
  if (page === 'lugar' && id) showReviews(id);
}
async function showReviews(id) {
  const node = document.querySelector('#reviews');
  if (!node) return;
  const local = await localReviews(id);
  let remote = [];
  try { const response = await fetch('./api/reviews?placeId=' + encodeURIComponent(id)); if (response.ok) remote = await response.json(); } catch {}
  node.innerHTML = [...local.map(item => ({...item, pending: true})), ...remote].map(item => '<p class="card">' + escapeHtml(item.text) + (item.pending ? ' <small>(pendiente de envío)</small>' : '') + '</p>').join('') || '<p>Aún no hay reseñas.</p>';
}
function hydrateSSR() {
  const article = document.querySelector('[data-ssr-place]');
  if (!article) return;
  const target = article.querySelector('#hydrated-detail');
  if (!target || target.dataset.ready) return;
  target.dataset.ready = 'true';
  target.innerHTML = '<h2>Reseñas</h2><div id="reviews"></div><form id="review-form" data-place="' + escapeHtml(article.dataset.ssrPlace) + '"><label for="review-text">Tu reseña</label><textarea id="review-text" maxlength="500" required></textarea><button>Guardar reseña</button></form>';
  showReviews(article.dataset.ssrPlace);
}
document.addEventListener('click', async event => {
  if (event.target.id !== 'locate') return;
  const target = document.querySelector('#nearby');
  try {
    const point = await getLocation();
    target.innerHTML = '<div class="grid">' + places.map(place => ({...place, distance: distanceKm(point, {lat:place.lat, lon:place.lon})})).sort((a,b) => a.distance-b.distance).map(place => '<article class="card"><h2>' + escapeHtml(place.name) + '</h2><p>' + place.distance.toFixed(1) + ' km de tu ubicación</p><a href="#/lugar/' + encodeURIComponent(place.id) + '">Ver lugar</a></article>').join('') + '</div>';
  } catch (error) { target.textContent = error.message; }
});
document.addEventListener('submit', async event => {
  if (event.target.id !== 'review-form') return;
  event.preventDefault();
  const text = event.target.querySelector('textarea');
  try { await saveReview(event.target.dataset.place, text.value); text.value = ''; await showReviews(event.target.dataset.place); }
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
catalog().then(data => { places = data; render(); }).catch(() => {
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
