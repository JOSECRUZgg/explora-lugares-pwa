function decodeKey(base64) {
  const value = (base64 + '='.repeat((4 - base64.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(value), char => char.charCodeAt(0));
}
export async function localNotification() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) throw new Error('Notificaciones no disponibles');
  if (await Notification.requestPermission() !== 'granted') throw new Error('Permiso denegado');
  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification('Explora Lugares', { body: 'Tus lugares están listos para consultar.', icon: './icons/icon-192.png' });
}
export async function subscribePush() {
  if (!('PushManager' in window) || !('serviceWorker' in navigator)) throw new Error('Push no disponible');
  if (await Notification.requestPermission() !== 'granted') throw new Error('Permiso denegado');
  const keyResponse = await fetch('./api/push/key');
  if (!keyResponse.ok) throw new Error('El servidor push no está disponible');
  const { publicKey } = await keyResponse.json();
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(publicKey) });
  const response = await fetch('./api/push/subscriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subscription) });
  if (!response.ok) throw new Error('No se pudo guardar la suscripción');
}
