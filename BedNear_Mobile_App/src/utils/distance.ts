export function calculateDistance(
  userLat: number,
  userLng: number,
  pgLat: number,
  pgLng: number
): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;

  const earthRadius = 6371;

  const dLat = toRadians(pgLat - userLat);
  const dLng = toRadians(pgLng - userLng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(userLat)) *
      Math.cos(toRadians(pgLat)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}