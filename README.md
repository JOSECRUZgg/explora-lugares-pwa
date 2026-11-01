# Sierra Móvil PWA

Aplicación progresiva de rutas de la Sierra Gorda, creada en 14 fases con un commit por fase.

## Desarrollo

Requiere Node.js 24 o superior. Ejecuta npm ci y npm start; abre http://localhost:3000.
Para pruebas automáticas: npm test. El reporte y la tabla de casos están en REPORTE.md.

Las claves VAPID y el token administrador se guardan en .env, que está ignorado por Git. La instalación local ya los genera. En otra máquina, genera claves con web-push y copia .env.example a .env.

## Publicación

GitHub Actions publica la carpeta public en GitHub Pages al subir cambios a main.
La URL prevista es https://JOSECRUZgg.github.io/sierra-movil-pwa/.
Después de actualizar el código del service worker, incrementa VERSION en public/sw.js para renovar la caché.

GitHub Pages sirve el shell, el manifiesto, el catálogo estático, IndexedDB, navegación CSR, geolocalización, notificaciones locales y las vistas offline. Pages no ejecuta server.js: la ficha SSR, la API de reseñas, la sincronización hacia el servidor y el envío de push necesitan un servidor Node.js HTTPS aparte. El botón de suscripción push informa cuando esa API no está disponible. Las reseñas permanecen guardadas en IndexedDB hasta conectarse a un servidor con la API.

Para enviar una notificación desde el servidor Node, haz POST a /api/push/send con Authorization: Bearer seguido del valor PUSH_ADMIN_TOKEN. Nunca publiques ese token.
