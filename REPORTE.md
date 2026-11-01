# Reporte de pruebas · Explora Lugares PWA

Fecha: 1 de noviembre de 2026.

Estado general: fases 0–4, 9 y 13 comprobadas; las fases 5–8 y 10–12 tienen verificaciones pendientes. El backend público aún no está desplegado.

## Herramientas
- Node.js node --test para API y archivos servidos.
- Chrome/Edge DevTools: Application (manifiesto, service worker, IndexedDB, Cache Storage), Network (modo offline) y Lighthouse.
- Un teléfono compatible para instalación, geolocalización y push real.

## Casos de prueba

| ID | Caso | Procedimiento | Resultado esperado | Estado |
|---|---|---|---|---|
| P01 | Shell | GET / | HTML 200 con manifiesto | Automatizado: pasó |
| P02 | Manifiesto | GET /manifest.json | display: standalone | Automatizado: pasó |
| P03 | Catálogo | GET /api/catalog | Tres lugares JSON | Automatizado: pasó |
| P04 | SSR | GET /lugar/plaza-centro | Ficha HTML con datos iniciales | Automatizado: pasó |
| P05 | Reseña | POST y GET /api/reviews | La reseña persiste | Automatizado: pasó |
| P06 | Push, acceso | POST /api/push/send sin token | Respuesta 403 | Automatizado: pasó |
| P07 | Instalar | Abrir en HTTPS/localhost y usar «Instalar» | App instalada con ícono y splash del sistema | Pendiente de prueba manual |
| P08 | Offline | Cargar una vez, desactivar red y navegar | Shell y catálogo disponibles | Pendiente de prueba manual |
| P09 | Sync | Crear reseña offline y restablecer red | Se envía y desaparece «pendiente» | Pendiente de prueba manual |
| P10 | Push | Suscribirse y enviar desde servidor | Notificación visible y abre app | Pendiente de prueba manual |
| P11 | Ubicación | Permitir ubicación en «Cerca de mí» | Lugares ordenados por distancia | Pendiente de prueba manual |
| P12 | Actualización | Publicar versión nueva y recargar | Aviso «Actualizar» | Navegador: pasó |
| P13 | Publicación | Abrir GitHub Pages | Inicio y catálogo visibles | Navegador: pasó |
| P14 | Diseño escritorio | Abrir inicio y catálogo a 1280 px | Cabecera, portada, tarjetas y controles legibles | Navegador local: pasó |
| P15 | Diseño móvil | Abrir inicio y catálogo a 375 px | Navegación visible y sin desplazamiento horizontal | Navegador local: pasó |
| P16 | Diseño intermedio | Abrir ficha a 768 px | Sin desplazamiento horizontal y navegación de 44 px | Navegador local: pasó |
| P17 | Ficha SSR visual | Abrir /lugar/plaza-centro en servidor local | Ficha y reseñas hidratadas con el nuevo diseño | Navegador local: pasó |
| P18 | Página offline visual | Abrir offline.html directamente | Mensaje y regreso al inicio legibles | Navegador local: pasó; red offline aún pendiente |
| P19 | Fallback offline | Simular fallo de red en una ficha no guardada | Service worker responde offline.html | Automatizado: pasó |
| P20 | Distancia | Comparar coordenadas iguales y separadas un grado | 0 km y más de 100 km, respectivamente | Automatizado: pasó |
| P21 | Suscripción push | POST válido e inválido al servidor de prueba | 201 y persistencia; 400 para entrada inválida | Automatizado: pasó |
| P22 | Preferencia local | Activar vista compacta y recargar Pages | Casilla conserva el estado; se restablece después | Navegador: pasó |

Ejecutar pruebas automáticas: npm test. Última ejecución: 3 pruebas, 3 aprobadas.
En navegadores sin Background Sync, el envío pendiente también se intenta al volver la conexión o abrir la app.

## Implementación por fases

| Fase | Implementación |
|---|---|
| 0 | Proyecto Git independiente, Node.js, package.json, .gitignore y servidor mínimo |
| 1 | Shell HTML y estilos adaptables |
| 2 | Íconos PNG de 192 y 512 px y manifiesto instalable |
| 3 | Registro y eventos install, activate y fetch del service worker |
| 4 | Catálogo JSON, vistas CSR y ficha SSR servida por Node.js |
| 5 | Splash visual, inicio y botón de instalación cuando el navegador lo ofrece |
| 6 | Catálogo en IndexedDB y vista compacta en localStorage |
| 7 | Caché de shell, datos y navegación; respaldo offline e indicador de conexión |
| 8 | Reseñas locales, API y Background Sync con reintento al volver la red |
| 9 | Aviso de actualización, skipWaiting y clients.claim |
| 10 | Notificación local, suscripción push y VAPID con claves privadas fuera de Git |
| 11 | Geolocalización, distancia a lugares e hidratación de la ficha SSR |
| 12 | Pruebas automáticas y tabla de casos |
| 13 | Repositorio público, workflow y publicación en GitHub Pages |

Cada fase tiene al menos un commit en la rama main.

## Publicación y alcance

- Repositorio: https://github.com/JOSECRUZgg/explora-lugares-pwa
- Aplicación: https://josecruzgg.github.io/explora-lugares-pwa/
- Último despliegue comprobado: GitHub Actions completó con éxito; la página y el catálogo cargaron en navegador.

GitHub Pages solo sirve archivos estáticos. La ficha SSR, el envío de reseñas y el envío push funcionan con server.js en un servidor Node.js; no están disponibles desde Pages sin desplegar esa API en un host HTTPS. Las reseñas escritas desde Pages se conservan localmente hasta disponer de ella. Las coordenadas del catálogo son datos de ejemplo.

## Pendientes para cumplimiento total

1. Probar instalación y splash del sistema en un navegador compatible.
2. Probar navegación sin red con DevTools o un dispositivo real.
3. Probar reseñas offline y Background Sync con un servidor accesible tras recuperar la red.
4. Desplegar la API Node.js en HTTPS, conectarla a la versión de Pages y comprobar SSR, reseñas y push reales.
5. Probar geolocalización con permiso del usuario y documentar evidencia.
6. Repetir las pruebas P07–P11 y registrar resultados observados, navegador y fecha.

## Mejora visual · 1 de noviembre de 2026

Se rediseñaron el inicio, el catálogo, la ficha, la página offline y la navegación. La portada tiene una llamada principal al catálogo y un mapa decorativo hecho con CSS; las tarjetas usan tres tonos y muestran nombre, descripción y tiempo sugerido. Las preferencias y notificaciones quedaron en una sección secundaria. En móvil, la navegación permanece accesible al pie; en escritorio se integra en la cabecera. La ficha SSR comparte el diseño de la vista CSR y conserva la hidratación de reseñas.

Los elementos visuales usan CSS y SVG local, por lo que no requieren recursos externos para aparecer sin conexión. Se añadieron estados de foco visibles, áreas de navegación de 44 px, espacio para la barra móvil y ajuste para movimiento reducido. La actualización incrementó la versión del service worker para renovar el shell.

Verificación visual en navegador local: portada y catálogo a 1280 px; portada y catálogo a 375 px; ficha a 768 px; ficha SSR con reseñas hidratadas; página offline abierta directamente. A 375 px, el documento midió 360 px de ancho desplazable frente a 375 px de ventana. A 768 px midió 753 px frente a 768 px. En ambos tamaños los enlaces de navegación midieron 44 px de alto. Estas pruebas no sustituyen P07–P11, que siguen pendientes.

## Auditoría fase por fase · 1 de noviembre de 2026

| Fase | Comprobación realizada | Estado |
|---|---|---|
| 0 · Entorno | Node.js 24, npm 11, Git; package.json, dependencia web-push, .gitignore y servidor probado | Comprobada |
| 1 · App shell | index.html y styles.css; inicio visible en escritorio y móvil | Comprobada |
| 2 · Manifiesto | manifest.json e íconos PNG medidos en 192×192 y 512×512 | Comprobada como implementación; instalación aún sin probar |
| 3 · Service worker | Registro en app.js y eventos install, activate y fetch; aviso de actualización observado | Comprobada |
| 4 · CSR y SSR | Catálogo de tres lugares, navegación CSR y ficha SSR probados con Node y navegador | Comprobada |
| 5 · Splash y Home | Splash interno e inicio vistos; botón de instalación condicionado al navegador | Parcial: falta instalación y splash del sistema |
| 6 · Datos locales | IndexedDB implementado; vista compacta persistió tras recarga en Pages | Parcial: falta inspeccionar respaldo IndexedDB con red desconectada |
| 7 · Caché y offline | Tres estrategias presentes; prueba automática del fallback offline.html aprobada | Parcial: falta navegación real sin red |
| 8 · Reseñas y Sync | API POST/GET probada; cola local y evento sync presentes; fallo de registro sync ya no bloquea la reseña | Parcial: falta sincronización real al reconectar |
| 9 · Actualización | skipWaiting, clients.claim y aviso «Actualizar» comprobados en navegador | Comprobada |
| 10 · Notificaciones | Claves VAPID locales excluidas de Git; API guarda suscripciones válidas y rechaza inválidas | Parcial: faltan notificación local y entrega push reales |
| 11 · Dispositivo e hidratación | Distancia probada; ficha SSR hidratada en navegador local | Parcial: falta probar permiso y ubicación real |
| 12 · Pruebas | Tabla P01–P22 y tres pruebas automáticas aprobadas | Parcial: P07–P11 siguen pendientes |
| 13 · Publicación | Repositorio, Pages y actualización previa comprobados; existe workflow de publicación | Comprobada |

La prueba automática del fallback solo simula una petición fallida en el service worker; no sustituye la prueba de navegación offline en un navegador. La prueba de suscripciones no envía una notificación push. GitHub Pages no ejecuta server.js, por lo que SSR, sincronización con servidor y push requieren alojar esa API en HTTPS.

## Verificación de cada apartado de la guía

«Hecho» indica que el apartado está implementado y se verificó con código, prueba automática o navegador. «Parcial» indica implementación presente con una prueba funcional pendiente.

| Apartado | Resultado | Evidencia o límite |
|---|---|---|
| 0.1 Herramientas | Hecho | Node.js 24, npm 11 y Git disponibles |
| 0.2 Proyecto y dependencias | Hecho | Proyecto independiente y web-push instalado |
| 0.3 package.json y .gitignore | Hecho | Scripts presentes; .env y datos privados excluidos |
| 0.4 Servidor mínimo | Hecho | GET / responde en prueba automática |
| 1.1 index.html | Hecho | Shell visible en Pages |
| 1.2 Estilos | Hecho | Diseño verificado a 375, 768 y 1280 px |
| 2.1 Íconos | Hecho | PNG reales de 192 y 512 px |
| 2.2 Manifiesto | Hecho | display standalone, scope, colores e íconos |
| 3.1 Registro SW | Hecho | app.js registra sw.js; ciclo de actualización visto |
| 3.2 Eventos base | Hecho | install, activate y fetch implementados |
| 4.1 Catálogo remoto | Hecho | GET /api/catalog devuelve tres lugares en Node |
| 4.2 CSR | Hecho | Inicio, catálogo y ficha navegados en Pages |
| 4.3 SSR | Hecho en Node | HTML inicial y ficha local comprobados; Pages no ejecuta Node |
| 5.1 Splash del sistema | Pendiente | Requiere instalar la PWA en un dispositivo compatible |
| 5.2 Splash de la app | Hecho | Animación interna visible en navegador |
| 5.3 Home e instalación | Parcial | Home funciona; botón depende de beforeinstallprompt y falta prueba de instalación |
| 6.1 IndexedDB | Parcial | Capa y stores creados en código; falta inspección del almacenamiento con red desconectada |
| 6.2 localStorage | Hecho | Vista compacta persistió tras recarga |
| 6.3 Respaldo del catálogo | Parcial | Fallback a IndexedDB implementado; falta prueba real sin red |
| 7.1 offline.html | Hecho | Página renderizada y verificada visualmente |
| 7.2 Tres estrategias de caché | Parcial | Navegación, datos y shell implementados; fallback unitario aprobado; falta prueba real offline |
| 7.3 Indicador de conexión | Parcial | Estado «En línea» visible; falta observar transición sin red |
| 8.1 API de reseñas | Hecho en Node | POST y GET con persistencia en prueba aislada |
| 8.2 Guardar local primero | Parcial | Cola IndexedDB implementada; falta prueba con desconexión real |
| 8.3 Evento sync | Parcial | Handler presente; falta comprobar envío al recuperar red |
| 9.1 skipWaiting y clients.claim | Hecho | Código presente y versión nueva activada en navegador |
| 9.2 Aviso de actualización | Hecho | Aviso «Actualizar» observado y usado |
| 10.1 Flujo push completo | Parcial | Componentes implementados; falta entrega real |
| 10.2 Claves VAPID | Hecho local | Claves generadas en .env, no versionadas |
| 10.3 Servidor push | Parcial | Suscripciones guardadas y validadas; envío real no probado |
| 10.4 notificaciones.js | Parcial | Módulo implementado; permiso/notificación pendientes |
| 10.5 Evento push del SW | Parcial | Handler presente; recepción real no probada |
| 11.1 Módulo dispositivo | Hecho | distanceKm pasó prueba automática |
| 11.2 Cerca de mí | Parcial | Vista presente; permiso y orden con ubicación real pendientes |
| 11.3 Hidratación SSR | Hecho local | Formulario y reseñas visibles tras cargar HTML SSR |
| 12.1 Herramientas | Hecho | Node test, navegador y herramientas manuales documentados |
| 12.2 Casos de prueba | Parcial | Tabla P01–P22 presente; P07–P11 siguen pendientes |
| 13.1 Repositorio GitHub | Hecho | Rama main y commits para todas las fases |
| 13.2 GitHub Pages | Hecho | URL pública abre la PWA |
| 13.3 Alcance de Pages | Hecho | Límites del hosting estático documentados |
| 13.4 Actualización | Hecho | Cambios publicados y aviso de nueva versión comprobado |
