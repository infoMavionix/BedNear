import { api } from './api';
export async function fetchFavourites() {
  const { data } = await api.get('/me/favourites');
  return data.items ?? data.data ?? data;
}
export async function addFavourite(propertyId: string) { return api.post('/me/favourites', { propertyId }); }
export async function removeFavourite(propertyId: string) { return api.delete(`/me/favourites/${propertyId}`); }
