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
    return await response.json();
  } catch {
    const response = await fetch('./data/catalog.json');
    if (!response.ok) throw new Error('Catálogo no disponible');
    return await response.json();
  }
}
function render() {
  const [, page, id] = location.hash.split('/');
  if (page === 'catalogo') {
    app.innerHTML = '<h1>Catálogo de rutas</h1><div class="grid">' + routes.map(route =>
      '<article class="card"><h2>' + escapeHtml(route.name) + '</h2><p>' + escapeHtml(route.description) + '</p><p class="muted">' + escapeHtml(route.duration) + '</p><a href="#/ruta/' + encodeURIComponent(route.id) + '">Ver ficha</a></article>'
    ).join('') + '</div>';
  } else if (page === 'ruta') {
    const route = routes.find(item => item.id === id);
    app.innerHTML = route ? '<article class="card"><h1>' + escapeHtml(route.name) + '</h1><p>' + escapeHtml(route.description) + '</p><p>Duración estimada: ' + escapeHtml(route.duration) + '</p><a href="./ruta/' + encodeURIComponent(route.id) + '">Ver ficha SSR</a></article>' : '<h1>Ruta no encontrada</h1>';
  } else {
    app.innerHTML = '<section class="hero"><h1>Muévete por la Sierra</h1><p>Rutas y paradas a mano, incluso sin conexión.</p><a href="#/catalogo"><button>Explorar rutas</button></a> ' + (installPrompt ? '<button id="install">Instalar aplicación</button>' : '') + '</section>';
  }
}
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
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.error));
}
