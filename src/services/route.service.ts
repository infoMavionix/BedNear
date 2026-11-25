import { api } from './api';
import { TravelMode } from '../types/listing';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RouteDestination extends Coordinates {
  id: string;
}

export interface RouteResult {
  id: string;
  available: boolean;
  distanceMeters?: number;
  durationSeconds?: number;
}

export async function getRouteMatrix(
  origin: Coordinates,
  destinations: RouteDestination[],
  mode: TravelMode
): Promise<RouteResult[]> {
  if (destinations.length === 0) return [];

  const results: RouteResult[] = [];

  // Backend currently accepts up to 25 destinations per request.
  for (let index = 0; index < destinations.length; index += 25) {
    const batch = destinations.slice(index, index + 25);

    const { data } = await api.post<{ routes: RouteResult[] }>(
      '/public/route-matrix',
      { origin, destinations: batch, mode }
    );

    results.push(...data.routes);
  }

  return results;
}

export function formatRouteDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatRouteDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes
    ? `${hours} hr ${remainingMinutes} min`
    : `${hours} hr`;
}