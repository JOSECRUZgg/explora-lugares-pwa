# Reporte de pruebas · Sierra Móvil PWA

Fecha: 1 de noviembre de 2026.

## Herramientas
- Node.js node --test para API y archivos servidos.
- Chrome/Edge DevTools: Application (manifiesto, service worker, IndexedDB, Cache Storage), Network (modo offline) y Lighthouse.
- Un teléfono compatible para instalación, geolocalización y push real.

## Casos de prueba

| ID | Caso | Procedimiento | Resultado esperado | Estado |
|---|---|---|---|---|
| P01 | Shell | GET / | HTML 200 con manifiesto | Automatizado: pasó |
| P02 | Manifiesto | GET /manifest.json | display: standalone | Automatizado: pasó |
| P03 | Catálogo | GET /api/catalog | Tres rutas JSON | Automatizado: pasó |
| P04 | SSR | GET /ruta/jalpan-xilitla | Ficha HTML con datos iniciales | Automatizado: pasó |
| P05 | Reseña | POST y GET /api/reviews | La reseña persiste | Automatizado: pasó |
| P06 | Push, acceso | POST /api/push/send sin token | Respuesta 403 | Automatizado: pasó |
| P07 | Instalar | Abrir en HTTPS/localhost y usar «Instalar» | App instalada con ícono y splash del sistema | Pendiente de prueba manual |
| P08 | Offline | Cargar una vez, desactivar red y navegar | Shell y catálogo disponibles | Pendiente de prueba manual |
| P09 | Sync | Crear reseña offline y restablecer red | Se envía y desaparece «pendiente» | Pendiente de prueba manual |
| P10 | Push | Suscribirse y enviar desde servidor | Notificación visible y abre app | Pendiente de prueba manual |
| P11 | Ubicación | Permitir ubicación en «Cerca de mí» | Rutas ordenadas por distancia | Pendiente de prueba manual |
| P12 | Actualización | Publicar versión nueva y recargar | Aviso «Actualizar» | Pendiente de prueba manual |

Ejecutar pruebas automáticas: npm test.
En navegadores sin Background Sync, el envío pendiente también se intenta al volver la conexión o abrir la app.
