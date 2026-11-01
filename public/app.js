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
function placeCard(place, index, note) {
  const tone = ['clay', 'sage', 'sky'][index % 3];
  return '<a class="place-card" href="#/lugar/' + encodeURIComponent(place.id) + '">' +
    '<div class="card-art tone-' + tone + '" aria-hidden="true"><span class="art-symbol">' + escapeHtml(place.name.charAt(0)) + '</span></div>' +
    '<div class="card-body"><span class="eyebrow">Lugar ' + String(index + 1).padStart(2, '0') + '</span>' +
    '<h3>' + escapeHtml(place.name) + '</h3><p>' + escapeHtml(place.description) + '</p>' +
    '<div class="card-bottom"><span>' + escapeHtml(note || place.duration) + '</span><span class="card-arrow" aria-hidden="true">↗</span></div></div></a>';
}
function render() {
  const [, page, id] = location.hash.split('/');
  const navPage = document.querySelector('[data-ssr-place]') && !page ? 'catalogo' : page;
  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.dataset.nav === (navPage === 'catalogo' ? 'catalogo' : navPage === 'cerca' ? 'cerca' : 'inicio')) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (document.querySelector('[data-ssr-place]') && !location.hash) {
    hydrateSSR();
    return;
  }
  if (page === 'catalogo') {
    app.innerHTML = '<div class="page-heading"><span class="eyebrow">Guía para explorar</span><h1>Encuentra tu próximo lugar.</h1><p>Una selección breve para descubrir a tu ritmo. Abre una ficha para ver detalles y dejar una reseña.</p></div>' +
      '<div class="grid">' + places.map((place, index) => placeCard(place, index)).join('') + '</div>';
  } else if (page === 'lugar') {
    const place = places.find(item => item.id === id);
    app.innerHTML = place ? '<a class="back-link" href="#/catalogo">← Volver a lugares</a><div class="detail-layout">' +
      '<article class="detail-card"><div class="detail-cover" aria-hidden="true"><span class="art-symbol">' + escapeHtml(place.name.charAt(0)) + '</span></div><div class="detail-content">' +
      '<span class="eyebrow">Ficha del lugar</span><h1>' + escapeHtml(place.name) + '</h1><p>' + escapeHtml(place.description) + '</p><span class="detail-meta">Tiempo sugerido: ' + escapeHtml(place.duration) + '</span>' +
      (location.hostname.endsWith('github.io') ? '' : '<p><a class="text-link" href="./lugar/' + encodeURIComponent(place.id) + '">Ver ficha SSR ↗</a></p>') +
      '</div></article><section class="review-panel"><h2>Reseñas</h2><div id="reviews"></div><form id="review-form" data-place="' + escapeHtml(place.id) + '">' +
      '<label for="review-text">Comparte tu experiencia</label><textarea id="review-text" maxlength="500" required placeholder="¿Qué te gustó de este lugar?"></textarea><button>Guardar reseña</button></form></section></div>'
      : '<div class="page-heading"><h1>Lugar no encontrado</h1><a class="text-link" href="#/catalogo">Volver al catálogo</a></div>';
  } else if (page === 'cerca') {
    app.innerHTML = '<div class="page-heading"><span class="eyebrow">Explora a tu alrededor</span><h1>Cerca de mí.</h1><p>Tu ubicación se usa solo cuando pulsas el botón y no se envía al servidor.</p><button id="locate">Buscar lugares cercanos</button></div><div id="nearby" class="nearby"></div>';
  } else {
    app.innerHTML = '<section class="hero"><div class="hero-copy"><p class="eyebrow">Tu guía de lugares</p><h1>Sal a descubrir algo nuevo.</h1>' +
      '<p class="hero-lead">Encuentra sitios para visitar, consulta detalles y guarda tus reseñas. Tu guía también viaja contigo sin conexión.</p>' +
      '<div class="hero-actions"><a class="button button-light" href="#/catalogo">Explorar lugares <span aria-hidden="true">↗</span></a>' +
      '<a class="button button-outline" href="#/cerca">Cerca de mí</a>' +
      (installPrompt ? '<button id="install" class="button-light">Instalar aplicación</button>' : '') + '</div></div>' +
      '<div class="hero-art" aria-hidden="true"><div class="map-card"><div class="map-line"><span class="map-pin"><span>●</span></span></div><div class="map-card-caption"><span>UN LUGAR POR DESCUBRIR</span><span>↗</span></div></div><span class="hero-note">Explora a tu ritmo</span></div></section>' +
      '<div class="feature-strip"><div><span>01</span> Catálogo disponible offline</div><div><span>02</span> Reseñas guardadas en tu dispositivo</div><div><span>03</span> Lugares cerca de ti</div></div>' +
      '<section class="section-heading"><div><p class="eyebrow">Para empezar</p><h2>Elige tu próxima parada</h2><p>Tres ideas para salir de la rutina.</p></div><a class="text-link" href="#/catalogo">Ver todos los lugares ↗</a></section>' +
      '<div class="grid">' + places.slice(0, 3).map((place, index) => placeCard(place, index)).join('') + '</div>' +
      '<section class="utility-panel"><div><p class="eyebrow">Preferencias</p><h2>Haz tuya la experiencia</h2><p>Prueba avisos y ajusta cómo ves el catálogo.</p></div>' +
      '<div class="utility-actions"><button id="notify-local" class="button-secondary">Notificación local</button><button id="push-subscribe" class="button-secondary">Activar push</button></div>' +
      '<label class="compact-toggle"><input id="compact" type="checkbox" ' + (localStorage.getItem('compact') === 'true' ? 'checked' : '') + '> Vista compacta</label></section>';
  }
  if (page === 'lugar' && id) showReviews(id);
}
async function showReviews(id) {
  const node = document.querySelector('#reviews');
  if (!node) return;
  const local = await localReviews(id);
  let remote = [];
  try { const response = await fetch('./api/reviews?placeId=' + encodeURIComponent(id)); if (response.ok) remote = await response.json(); } catch {}
  node.innerHTML = [...local.map(item => ({...item, pending: true})), ...remote].map(item => '<div class="review-card">' + escapeHtml(item.text) + (item.pending ? '<small>Pendiente de envío</small>' : '') + '</div>').join('') || '<p>Aún no hay reseñas.</p>';
}
function hydrateSSR() {
  const article = document.querySelector('[data-ssr-place]');
  if (!article) return;
  const target = document.querySelector('#hydrated-detail');
  if (!target || target.dataset.ready) return;
  target.dataset.ready = 'true';
  target.innerHTML = '<section class="review-panel"><h2>Reseñas</h2><div id="reviews"></div><form id="review-form" data-place="' + escapeHtml(article.dataset.ssrPlace) + '"><label for="review-text">Comparte tu experiencia</label><textarea id="review-text" maxlength="500" required></textarea><button>Guardar reseña</button></form></section>';
  showReviews(article.dataset.ssrPlace);
}
document.addEventListener('click', async event => {
  if (event.target.id !== 'locate') return;
  const target = document.querySelector('#nearby');
  try {
    const point = await getLocation();
    target.innerHTML = '<div class="grid">' + places.map(place => ({...place, distance: distanceKm(point, {lat:place.lat, lon:place.lon})})).sort((a,b) => a.distance-b.distance).map((place, index) => placeCard(place, index, place.distance.toFixed(1) + ' km de tu ubicación')).join('') + '</div>';
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
window.addEventListener('reviews-sent', event => showReviews(event.detail.placeId));
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
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'reviews-sent') showReviews(event.data.placeId);
      });
      document.addEventListener('click', event => {
        if (event.target.id === 'update') registration.waiting?.postMessage('SKIP_WAITING');
      });
    } catch (error) { console.error(error); }
  });
}

function updateConnection() {
  const label = document.querySelector('#connection');
  label.textContent = navigator.onLine ? 'En línea' : 'Sin conexión';
  label.classList.toggle('is-offline', !navigator.onLine);
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
