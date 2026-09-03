import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenStore, ApiError } from '@/lib/api';
import { useLoader } from '@/hooks/useLoader';

export type User = {
  id: number;
  public_id?: string;
  name?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  avatar?: string;
  [key: string]: unknown;
};

type AuthCtx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  /** Set when the server asks for the second factor before finishing login. */
  pendingTwoFactor: { email: string; password: string } | null;
  login: (email: string, password: string) => Promise<void>;
  completeTwoFactor: (code: string) => Promise<void>;
  cancelTwoFactor: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

function normalizeUser(data: unknown): User | null {
  const u = (data as { user?: User })?.user ?? (data as User | null);
  if (!u || typeof u !== 'object') return null;
  const obj = u as User;
  return obj.id != null || obj.name || obj.email ? obj : null;
}

/** Thrown when the server says "password OK, now give me the 2FA code". */
export const TWO_FACTOR_REQUIRED = 'TWO_FACTOR_REQUIRED';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pendingTwoFactor, setPendingTwoFactor] = useState<{ email: string; password: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { show, hide, hideWhenReady } = useLoader();

  const refreshUser = useCallback(async () => {
    try {
      const data: unknown = await api.get('/mobile/me');
      setUser(normalizeUser(data));
    } catch (e) {
      // Only clear the token on 401/403 (expired/banned). On network errors
      // (status 0) keep the token so a retry on reconnect still works.
      const status = (e as ApiError)?.status;
      if (status === 401 || status === 403) {
        await tokenStore.remove();
        setToken(null);
      }
      if (status && status !== 0) setUser(null);
    }
  }, []);

  // Restore session once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      show('Signing in...');
      const t = await tokenStore.get();
      if (t) {
        if (cancelled) return;
        setToken(t);
        await refreshUser();
      }
      if (!cancelled) {
        setLoading(false);
        hideWhenReady();
      }
      // Let GlobalLoader finish its progress animation before hiding.
      setTimeout(() => hide(), 700);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount; show/hide/hideWhenReady/refreshUser are stable
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      show('Signing in...');
      try {
        const data: any = await api.post('/mobile/auth/login', { email, password });
        // The live backend answers with {requires_two_factor: true} when the
        // account has 2FA enabled and no code was supplied yet.
        if (data?.requires_two_factor) {
          setPendingTwoFactor({ email, password });
          hide();
          throw new ApiError('Two-factor authentication is required.', 200, TWO_FACTOR_REQUIRED);
        }
        const t = (data?.token ?? data?.data?.token) as string;
        if (!t) throw new ApiError('Server did not return a session token.', 500, 'NO_TOKEN');
        await tokenStore.set(t);
        setToken(t);
        setUser(normalizeUser(data?.user ?? data?.data?.user));
        setPendingTwoFactor(null);
        hideWhenReady();
        setTimeout(() => hide(), 500);
      } catch (e) {
        hide();
        throw e;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- show/hide/hideWhenReady are stable
    []
  );

  /** Second leg of a 2FA login: resend credentials plus the code/recovery code. */
  const completeTwoFactor = useCallback(
    async (code: string) => {
      if (!pendingTwoFactor) {
        throw new ApiError('No sign-in in progress.', 400, 'NO_PENDING_LOGIN');
      }
      show('Signing in...');
      try {
        const data: any = await api.post('/mobile/auth/login', {
          email: pendingTwoFactor.email,
          password: pendingTwoFactor.password,
          two_factor_code: code,
        });
        const t = (data?.token ?? data?.data?.token) as string;
        if (!t) throw new ApiError('Server did not return a session token.', 500, 'NO_TOKEN');
        await tokenStore.set(t);
        setToken(t);
        setUser(normalizeUser(data?.user ?? data?.data?.user));
        setPendingTwoFactor(null);
        hideWhenReady();
        setTimeout(() => hide(), 500);
      } catch (e) {
        hide();
        throw e;
      }
    },
    [pendingTwoFactor, show, hide, hideWhenReady]
  );

  const cancelTwoFactor = useCallback(() => setPendingTwoFactor(null), []);

  const logout = useCallback(async () => {
    show('Signing out...');
    try {
      await api.post('/mobile/auth/logout');
    } catch {
      /* token is removed locally regardless */
    }
    await tokenStore.remove();
    // Mirror the web app: clear shared local storage keys on logout.
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith('exam_draft_') || k.startsWith('leaderboard-') || k.startsWith('luav6-')) {
            localStorage.removeItem(k);
          }
        });
      }
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
    setPendingTwoFactor(null);
    hideWhenReady();
    setTimeout(() => hide(), 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- show/hide/hideWhenReady are stable
  }, []);

  return (
    <Ctx.Provider
      value={{ user, token, loading, pendingTwoFactor, login, completeTwoFactor, cancelTwoFactor, logout, refreshUser }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
