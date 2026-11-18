# Reporte de pruebas · Explora Lugares PWA

Autor: José Cruz Ramírez Fortanel.

Actualizado: 18 de noviembre de 2026.

Estado general: todas las fases están implementadas y tienen al menos un commit. Se comprobó también la recuperación de una reseña tras una caída del servidor; la instalación, el splash del sistema, el catálogo sin red y la notificación local ya se comprobaron en Android. Background Sync, geolocalización y entrega push siguen sin prueba concluyente. El backend público aún no está desplegado.

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
| P07 | Instalar | Abrir Pages en Android e instalar | App instalada con ícono y splash del sistema | Aprobado: WebAPK instalado, ventana standalone y splash capturados el 18/11/2026 |
| P08 | Offline | Cargar una vez, activar modo avión y navegar | Shell y catálogo disponibles | Aprobado: catálogo visible en Android instalado con modo avión activo e indicador «Sin conexión» |
| P09 | Sync | Crear reseña con servidor caído, reiniciarlo y reabrir app | Se envía y desaparece «pendiente» | Navegador: pasó por reintento al abrir; evento Background Sync sin verificar |
| P10 | Push | Suscribirse y enviar desde servidor | Notificación push visible y abre app | Pendiente: la notificación local sí apareció en Android; no hubo suscripción ni entrega push real |
| P11 | Ubicación | Permitir ubicación en «Cerca de mí» | Lugares ordenados por distancia | Pendiente de prueba manual |
| P12 | Actualización | Publicar versión nueva y recargar | Aviso «Actualizar» | Navegador: pasó |
| P13 | Publicación | Abrir GitHub Pages | Inicio y catálogo visibles | Navegador: pasó |
| P14 | Diseño escritorio | Abrir inicio y catálogo a 1280 px | Cabecera, portada, tarjetas y controles legibles | Navegador local: pasó |
| P15 | Diseño móvil | Abrir inicio y catálogo a 375 px | Navegación visible y sin desplazamiento horizontal | Navegador local: pasó |
| P16 | Diseño intermedio | Abrir ficha a 768 px | Sin desplazamiento horizontal y navegación de 44 px | Navegador local: pasó |
| P17 | Ficha SSR visual | Abrir /lugar/plaza-centro en servidor local | Ficha y reseñas hidratadas con el nuevo diseño | Navegador local: pasó |
| P18 | Página offline visual | Abrir offline.html directamente | Mensaje y regreso al inicio legibles | Navegador local: pasó; P08 también se verificó con modo avión real |
| P19 | Fallback offline | Abrir ficha SSR no guardada con servidor caído | Redirección a /offline.html y enlace correcto al inicio | Automatizado y navegador: pasó |
| P20 | Distancia | Comparar coordenadas iguales y separadas un grado | 0 km y más de 100 km, respectivamente | Automatizado: pasó |
| P21 | Suscripción push | POST válido e inválido al servidor de prueba | 201 y persistencia; 400 para entrada inválida | Automatizado: pasó |
| P22 | Preferencia local | Activar vista compacta y recargar Pages | Casilla conserva el estado; se restablece después | Navegador: pasó |
| P23 | Cola de reseñas | Guardar reseña con servidor detenido | Aparece «Pendiente de envío» en ficha | Navegador local: pasó |
| P24 | Recuperación | Reiniciar servidor y reabrir app | Reseña persiste en API y desaparece etiqueta pendiente | Navegador local: pasó |

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

1. Probar específicamente el evento Background Sync tras recuperar la red; el reintento al abrir la app ya se comprobó.
2. Verificar la geolocalización y la ordenación por distancia en el dispositivo.
3. Desplegar la API Node.js en HTTPS, conectarla a la versión de Pages y comprobar SSR, reseñas y push reales.

## Mejora visual · 1 de noviembre de 2026

Se rediseñaron el inicio, el catálogo, la ficha, la página offline y la navegación. La portada tiene una llamada principal al catálogo y un mapa decorativo hecho con CSS; las tarjetas usan tres tonos y muestran nombre, descripción y tiempo sugerido. Las preferencias y notificaciones quedaron en una sección secundaria. En móvil, la navegación permanece accesible al pie; en escritorio se integra en la cabecera. La ficha SSR comparte el diseño de la vista CSR y conserva la hidratación de reseñas.

Los elementos visuales usan CSS y SVG local, por lo que no requieren recursos externos para aparecer sin conexión. Se añadieron estados de foco visibles, áreas de navegación de 44 px, espacio para la barra móvil y ajuste para movimiento reducido. La actualización incrementó la versión del service worker para renovar el shell.

Verificación visual en navegador local: portada y catálogo a 1280 px; portada y catálogo a 375 px; ficha a 768 px; ficha SSR con reseñas hidratadas; página offline abierta directamente. A 375 px, el documento midió 360 px de ancho desplazable frente a 375 px de ventana. A 768 px midió 753 px frente a 768 px. En ambos tamaños los enlaces de navegación midieron 44 px de alto. Las pruebas de diseño precedieron a las pruebas reales de P07 y P08 del 18 de noviembre; P09, P10 y P11 mantienen límites funcionales.

## Auditoría fase por fase · 1 de noviembre de 2026

| Fase | Comprobación realizada | Estado |
|---|---|---|
| 0 · Entorno | Node.js 24, npm 11, Git; package.json, dependencia web-push, .gitignore y servidor probado | Comprobada |
| 1 · App shell | index.html y styles.css; inicio visible en escritorio y móvil | Comprobada |
| 2 · Manifiesto | manifest.json e íconos PNG medidos en 192×192 y 512×512 | Comprobada; instalación real acreditada el 18/11/2026 |
| 3 · Service worker | Registro en app.js y eventos install, activate y fetch; aviso de actualización observado | Comprobada |
| 4 · CSR y SSR | Catálogo de tres lugares, navegación CSR y ficha SSR probados con Node y navegador | Comprobada |
| 5 · Splash y Home | Splash interno e inicio vistos; botón de instalación condicionado al navegador | Comprobada en Android: instalación y ambos splash |
| 6 · Datos locales | IndexedDB y preferencias implementados; catálogo disponible con servidor caído; vista compacta persistió tras recarga | Parcial: catálogo offline observado; falta inspección directa del store |
| 7 · Caché y offline | Tres estrategias presentes; shell, catálogo y redirección offline.html probados con servidor caído | Comprobada en Android con modo avión activo |
| 8 · Reseñas y Sync | Reseña guardada con servidor caído y enviada al reabrir la app; API persistió y la etiqueta pendiente desapareció | Parcial: falta observar el evento Background Sync al volver la red |
| 9 · Actualización | skipWaiting, clients.claim y aviso «Actualizar» comprobados en navegador | Comprobada |
| 10 · Notificaciones | Claves VAPID locales excluidas de Git; API guarda suscripciones válidas y rechaza inválidas | Parcial: notificación local observada; entrega push pendiente |
| 11 · Dispositivo e hidratación | Distancia probada; ficha SSR hidratada en navegador local | Parcial: falta probar permiso y ubicación real |
| 12 · Pruebas | Tabla P01–P24 y tres pruebas automáticas aprobadas | Parcial: P09, P10 y P11 pendientes; P07 y P08 comprobadas |
| 13 · Publicación | Repositorio, Pages y actualización previa comprobados; existe workflow de publicación | Comprobada |

El fallback automático simula una petición fallida; la prueba adicional del 18 de noviembre sí confirma el catálogo en un Android sin red. La prueba de suscripciones no envía una notificación push. GitHub Pages no ejecuta server.js, por lo que SSR, sincronización con servidor y push requieren alojar esa API en HTTPS.

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
| 5.1 Splash del sistema | Hecho | Captura de Android al abrir el WebAPK: figura 7 del Word |
| 5.2 Splash de la app | Hecho | Captura del splash interno en Android: figura 8 |
| 5.3 Home e instalación | Hecho | WebAPK instalado y ventana standalone en figuras 5 y 6 |
| 6.1 IndexedDB | Parcial | Capa y stores creados en código; falta inspección del almacenamiento con red desconectada |
| 6.2 localStorage | Hecho | Vista compacta persistió tras recarga |
| 6.3 Respaldo del catálogo | Hecho | Catálogo visible en Android con modo avión activo, figura 9 |
| 7.1 offline.html | Hecho | Página renderizada y verificada visualmente |
| 7.2 Tres estrategias de caché | Hecho | Shell y catálogo visibles sin red real; fallback probado por separado |
| 7.3 Indicador de conexión | Hecho | «Sin conexión» visible en Android con modo avión, figura 9 |
| 8.1 API de reseñas | Hecho en Node | POST y GET con persistencia en prueba aislada |
| 8.2 Guardar local primero | Hecho en prueba local | Reseña quedó pendiente con servidor detenido y llegó a la API al reabrir app |
| 8.3 Evento sync | Parcial | Handler presente; falta comprobar envío al recuperar red |
| 9.1 skipWaiting y clients.claim | Hecho | Código presente y versión nueva activada en navegador |
| 9.2 Aviso de actualización | Hecho | Aviso «Actualizar» observado y usado |
| 10.1 Flujo push completo | Parcial | Componentes implementados; falta entrega real |
| 10.2 Claves VAPID | Hecho local | Claves generadas en .env, no versionadas |
| 10.3 Servidor push | Parcial | Suscripciones guardadas y validadas; envío real no probado |
| 10.4 notificaciones.js | Parcial | Permiso y notificación local observados, figura 10; push remoto pendiente |
| 10.5 Evento push del SW | Parcial | Handler presente; recepción real no probada |
| 11.1 Módulo dispositivo | Hecho | distanceKm pasó prueba automática |
| 11.2 Cerca de mí | Parcial | Vista presente; permiso y orden con ubicación real pendientes |
| 11.3 Hidratación SSR | Hecho local | Formulario y reseñas visibles tras cargar HTML SSR |
| 12.1 Herramientas | Hecho | Node test, navegador y herramientas manuales documentados |
| 12.2 Casos de prueba | Parcial | Tabla P01–P24; P07 y P08 aprobadas en Android; P09 parcial; P10 y P11 pendientes |
| 13.1 Repositorio GitHub | Hecho | Rama main y commits para todas las fases |
| 13.2 GitHub Pages | Hecho | URL pública abre la PWA |
| 13.3 Alcance de Pages | Hecho | Límites del hosting estático documentados |
| 13.4 Actualización | Hecho | Cambios publicados y aviso de nueva versión comprobado |

## Prueba de caída y recuperación del servidor · 1 de noviembre de 2026

En el navegador de prueba, con el servidor local en el puerto 3193 y el service worker instalado, se detuvo Node.js. El inicio y el catálogo siguieron disponibles. En la ficha de Plaza del Centro se guardó «Prueba de recuperación 3193» y apareció «Pendiente de envío». Al abrir la ficha SSR sin guardar, la aplicación redirigió a `/offline.html`; el enlace «Volver al inicio» apuntó a `/`.

Después de reiniciar el servidor y reabrir la aplicación, la reseña se encontró en el archivo JSON aislado de pruebas y se mostró en la ficha sin «Pendiente de envío». Esto valida el almacenamiento local y el reintento al abrir la app. El equipo conservó conexión de red durante la prueba; por ello no valida el indicador `navigator.onLine` ni la activación del evento Background Sync por el navegador. La ubicación no devolvió coordenadas en ese navegador. La notificación local sí se observó después en Android el 18 de noviembre y se documenta abajo.

La prueba detectó dos fallos y se corrigieron: la página offline conservaba una URL de ficha que rompía los enlaces relativos, y el estado visual de una reseña ya enviada podía quedarse en «Pendiente». El service worker ahora redirige a su página offline y la vista se actualiza tras el envío desde la app o desde el worker.

## Evidencia visual y límites de la revisión · 18 de noviembre de 2026

El Word `REPORTE_PWA_Jose_Cruz_Ramirez_Fortanel_ENTREGA.docx` usa la portada original y desarrolla las fases 0–13 con fragmentos de código. Incluye la matriz P01–P24, cuatro capturas iniciales de la aplicación publicada y siete capturas adicionales del 18 de noviembre:

| Archivo | Observación comprobada | No demuestra |
|---|---|---|
| `evidencias/01-inicio-publicado.png` | Inicio y navegación | Instalación o splash del sistema |
| `evidencias/02-cerca-publicado.png` | Vista «Cerca de mí» | Coordenadas concedidas o lista ordenada |
| `evidencias/03-catalogo-publicado.png` | Catálogo CSR | Respuesta de la API Node pública |
| `evidencias/04-ficha-publicada.png` | Ficha y formulario | Reseña enviada al servidor |

El primer intento en Chrome de la laptop no confirmó la instalación ni una notificación visible. Las pruebas posteriores en Android sí acreditaron P07, P08 y una notificación local. La geolocalización, el evento Background Sync automático y la entrega push no se observaron; P09 sigue parcial y P10–P11 pendientes. El backend público HTTPS quedó pospuesto.

## Evidencia real en Android y Chrome, 18 de noviembre de 2026

Se usó un Xiaomi 23117RA68G con Android 16. Android registró el WebAPK `org.chromium.webapk.ab105a8462e8955b3_v2`, instalado el 18/11/2026 a las 14:27:30. Se abrió sin la barra de Chrome; la grabación de pantalla permitió extraer fotogramas del splash del sistema y del splash interno. Con `airplane_mode_on=1`, el teléfono mostró el catálogo y «Sin conexión». Tras recuperar la red, el panel de Android mostró «Explora Lugares: Tus lugares están listos para consultar». La prueba de Chrome de escritorio también mostró los tres lugares sin red.

La notificación local usa el permiso del dispositivo y no demuestra una entrega push desde el servidor. Se intentó suscribir el Android al servicio push: el permiso era `granted` y el service worker estaba activo, pero Chrome devolvió `AbortError: Registration failed - push service error`. Por ello P10 sigue pendiente. La API pública HTTPS todavía no está desplegada.

| Archivo | Evidencia | Alcance |
|---|---|---|
| `evidencias/05-android-app-instalada.png` | Android muestra Explora Lugares instalado y las notificaciones habilitadas. | P07, P10 local |
| `evidencias/06-android-ventana-standalone.png` | La PWA se abrió como aplicación independiente, sin barra de Chrome. | P07 |
| `evidencias/07-android-splash-sistema.png` | Fotograma del splash de Android al abrir el WebAPK. | Fase 5.1 |
| `evidencias/08-android-splash-app.png` | Fotograma del splash interno de Explora Lugares. | Fase 5.2 |
| `evidencias/09-android-offline-catalogo.png` | Catálogo en la PWA instalada con modo avión activo e indicador Sin conexión. | P08 |
| `evidencias/10-android-notificacion-local.png` | Panel de Android con el aviso local de Explora Lugares. | Fase 10.4 |
| `evidencias/11-chrome-offline-catalogo.png` | Chrome de escritorio en modo offline muestra los tres lugares. | P08 |
