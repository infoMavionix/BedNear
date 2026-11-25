import { api } from './api';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types/user';
const TOKEN_KEY = 'bednear_access_token';
export async function getToken() { return SecureStore.getItemAsync(TOKEN_KEY); }
export async function saveToken(token: string) { await SecureStore.setItemAsync(TOKEN_KEY, token); }
export async function clearToken() { await SecureStore.deleteItemAsync(TOKEN_KEY); }
export async function loginWithPhone(phone: string): Promise<{ user: User; token: string }> {
  const { data } = await api.post('/auth/login', { phone });
  const token = data.accessToken ?? data.token;
  if (!token) throw new Error('The server did not return a session token.');
  await saveToken(token);
  return { user: data.user, token };
}
