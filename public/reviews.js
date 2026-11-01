import { all, put, remove } from './storage.js';

export async function saveReview(placeId, text) {
  const review = { id: crypto.randomUUID(), placeId, text: text.trim().slice(0, 500), createdAt: new Date().toISOString() };
  if (!review.text) throw new Error('Escribe una reseña');
  await put('reviews', review);
  await sendPending();
  return review;
}
export const localReviews = placeId => all('reviews').then(items => items.filter(item => item.placeId === placeId));
export async function sendPending() {
  const pending = await all('reviews');
  for (const review of pending) {
    try {
      const response = await fetch('./api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(review) });
      if (!response.ok) throw new Error('Pendiente');
      await remove('reviews', review.id);
    } catch {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration && 'sync' in registration) await registration.sync.register('send-reviews');
        } catch {}
      }
      break;
    }
  }
}
window.addEventListener('online', () => sendPending().catch(console.error));
