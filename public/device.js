export function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocalización no disponible'));
    navigator.geolocation.getCurrentPosition(
      position => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      () => reject(new Error('No se pudo obtener tu ubicación')),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  });
}
export function distanceKm(a, b) {
  const rad = value => value * Math.PI / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const value = Math.sin(dLat/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1-value));
}
