import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL as string | undefined;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (Platform.OS === 'web') return 'http://localhost:9000';
  const host = (Constants.expoConfig?.hostUri || '').split(':')[0];
  if (host) return `http://${host}:9000`;
  return 'http://localhost:9000';
};

const BASE_URL = getBaseUrl();
if (!BASE_URL) throw new Error('EXPO_PUBLIC_API_URL is not defined');

const TOKEN_KEY = 'auth_token';
const isWeb = Platform.OS === 'web';

const webStore = {
  getItemAsync: async (k: string) => {
    try { return isWeb ? localStorage.getItem(k) : null; } catch { return null; }
  },
  setItemAsync: async (k: string, v: string) => {
    try { if (isWeb) localStorage.setItem(k, v); } catch {}
  },
  deleteItemAsync: async (k: string) => {
    try { if (isWeb) localStorage.removeItem(k); } catch {}
  },
};

const store: typeof SecureStore = (isWeb ? (webStore as any) : SecureStore) as any;

export const tokenStore = {
  get: () => store.getItemAsync(TOKEN_KEY),
  set: (t: string) => store.setItemAsync(TOKEN_KEY, t),
  remove: () => store.deleteItemAsync(TOKEN_KEY),
};

class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const authFetch = async (path: string, options: RequestInit = {}) => {
  const token = await tokenStore.get();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${BASE_URL}/api${path}`, { ...options, headers });
};

const fetchWithErrorHandling = async (path: string, options?: RequestInit) => {
  try {
    const response = await authFetch(path, options);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(error.message || `HTTP ${response.status}`, response.status, error.code);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Network error', 0, 'NETWORK_ERROR');
  }
};

// Skill-compliant API client using fetch (not axios)
export const api = {
  get: <T,>(path: string): Promise<T> => fetchWithErrorHandling(path, { method: 'GET' }),
  post: <T,>(path: string, body?: unknown): Promise<T> =>
    fetchWithErrorHandling(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T,>(path: string, body?: unknown): Promise<T> =>
    fetchWithErrorHandling(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T,>(path: string): Promise<T> => fetchWithErrorHandling(path, { method: 'DELETE' }),
  // For FormData (assignments file upload) - don't set Content-Type, let fetch set boundary
  postForm: async <T,>(path: string, formData: FormData): Promise<T> => {
    const token = await tokenStore.get();
    const response = await fetch(`${BASE_URL}/api${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(error.message || `HTTP ${response.status}`, response.status);
    }
    return response.json();
  },
};

export { ApiError };
