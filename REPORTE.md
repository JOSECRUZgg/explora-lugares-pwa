# Reporte de pruebas · Explora Lugares PWA

Fecha: 1 de noviembre de 2026.

Estado general: implementación completa en código; validación funcional y backend público pendientes.

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

Ejecutar pruebas automáticas: npm test.
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
