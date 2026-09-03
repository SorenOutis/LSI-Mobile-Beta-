import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useSyncExternalStore } from 'react';

const isWeb = Platform.OS === 'web';

// ---------------------------------------------------------------------------
// Base URL resolution.
//  1. EXPO_PUBLIC_API_URL — explicit override (set this for a local dev
//     server while testing; the committed .env points at the live app).
//  2. Default — the deployed LUA V6 backend (https://lsi.koamishin.com).
//
// The deployed backend exposes the /api/mobile/* JSON surface (see
// patches/luav6-mobile-api.patch in this repo — apply it to the luav6 repo
// and redeploy before using the app in production).
// ---------------------------------------------------------------------------
const LIVE_API_URL = 'https://lsi.koamishin.com';

const getBaseUrl = (): string => {
  const fromEnv = (process.env.EXPO_PUBLIC_API_URL as string | undefined) || LIVE_API_URL;
  const url = fromEnv.replace(/\/$/, '');
  if (/localhost|127\.0\.0\.1/.test(url) && !isWeb) {
    console.warn(
      `[api] ${url} is only reachable from the machine running the dev server (emulator via 10.0.2.2, iOS simulator, or same-Wi-Fi LAN IP). For live data use https://lsi.koamishin.com.`
    );
  }
  if (url.startsWith('http://') && !__DEV__) {
    console.warn('[api] Non-dev build is using plain HTTP. Use an EXPO_PUBLIC_API_URL with https:// for release builds.');
  }
  return url;
};

export const API_BASE_URL = getBaseUrl();

/** Absolute URL of a page in the LUA V6 web app (same origin as the API). */
export const webLink = (path: string): string =>
  `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

// ---------------------------------------------------------------------------
// Token storage (SecureStore on native, localStorage on web — mirrors the
// web app's storage keys so logout can clean up shared demo/local data).
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'auth_token';

const webStore = {
  getItemAsync: async (k: string): Promise<string | null> => {
    try {
      return isWeb ? localStorage.getItem(k) : null;
    } catch {
      return null;
    }
  },
  setItemAsync: async (k: string, v: string): Promise<void> => {
    try {
      if (isWeb) localStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
  deleteItemAsync: async (k: string): Promise<void> => {
    try {
      if (isWeb) localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

const store = (isWeb ? webStore : SecureStore) as typeof SecureStore;

export const tokenStore = {
  get: () => store.getItemAsync(TOKEN_KEY),
  set: (t: string) => store.setItemAsync(TOKEN_KEY, t),
  remove: () => store.deleteItemAsync(TOKEN_KEY),
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    /** Laravel field-validation errors, e.g. { email: ['...'] } */
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Human-readable message for any thrown value (use in Alerts everywhere). */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    const firstFieldError = e.errors ? Object.values(e.errors).flat()[0] : undefined;
    return firstFieldError ?? e.message;
  }
  if (e instanceof Error && e.message) return e.message;
  return 'Something went wrong. Please try again.';
}

// ---------------------------------------------------------------------------
// Connection status (so the UI can show "can't reach the server" instead of
// silent empty states).
// ---------------------------------------------------------------------------
export type ConnectionState = { reachable: boolean; lastErrorAt: number | null };

let connState: ConnectionState = { reachable: true, lastErrorAt: null };
const connListeners = new Set<() => void>();

function setConnection(reachable: boolean) {
  if (connState.reachable === reachable) return;
  connState = { reachable, lastErrorAt: reachable ? null : Date.now() };
  connListeners.forEach((l) => l());
}

/** React hook: true once a request has failed at the network level. */
export function useConnection(): ConnectionState {
  return useSyncExternalStore(
    (cb) => {
      connListeners.add(cb);
      return () => connListeners.delete(cb);
    },
    () => connState,
    () => connState,
  );
}

// ---------------------------------------------------------------------------
// Fetch core
// ---------------------------------------------------------------------------
const authFetch = async (path: string, options: RequestInit = {}) => {
  const token = await tokenStore.get();
  const bodyIsFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    // Let fetch set the multipart boundary for FormData uploads.
    ...(bodyIsFormData ? {} : { 'Content-Type': 'application/json' }),
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API_BASE_URL}/api${path}`, { ...options, headers });
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await authFetch(path, options);
  } catch {
    setConnection(false);
    throw new ApiError('Cannot reach the server. Check your connection.', 0, 'NETWORK_ERROR');
  }
  // The server answered — connection is fine even if the status is an error.
  setConnection(true);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.message || `Request failed (HTTP ${response.status})`,
      response.status,
      error.code,
      error.errors,
    );
  }
  const text = await response.text();
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('Invalid response from server.', response.status, 'BAD_JSON');
  }
}

export const api = {
  get: <T,>(path: string): Promise<T> => request<T>(path, { method: 'GET' }),
  post: <T,>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T,>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T,>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T,>(path: string): Promise<T> => request<T>(path, { method: 'DELETE' }),
  /** For FormData (e.g. assignment file upload). */
  postForm: <T,>(path: string, formData: FormData): Promise<T> =>
    request<T>(path, { method: 'POST', body: formData }),
  /** For FormData uploads via PATCH (e.g. profile avatar). */
  patchForm: <T,>(path: string, formData: FormData): Promise<T> =>
    request<T>(path, { method: 'PATCH', body: formData }),
};
