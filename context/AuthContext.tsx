import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, tokenStore, ApiError } from '@/lib/api';
import { useLoader } from '@/hooks/useLoader';

type User = { id: number; public_id: string; name: string; email: string; first_name?: string; last_name?: string; avatar?: string };

type AuthCtx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { show, hide, hideWhenReady } = useLoader();

  const refreshUser = async () => {
    try {
      const data: any = await api.get('/user');
      setUser(data);
    } catch (e) {
      // Only clear on 401/403 (expired/banned), not on network 0 - keeps token for retry like web
      const status = (e as ApiError)?.status;
      if (status === 401 || status === 403) {
        await tokenStore.remove();
        setToken(null);
      }
      // On network error (0), keep token but set user null - will retry on next mount
      if (status && status !== 0) setUser(null);
    }
  };

  useEffect(() => {
    (async () => {
      show('Signing in...');
      const t = await tokenStore.get();
      if (t) {
        setToken(t);
        await refreshUser();
      }
      setLoading(false);
      hideWhenReady();
      // let GlobalLoader handle progress to 100 before hide
      setTimeout(() => hide(), 700);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    show('Signing in...');
    try {
      const data: any = await api.post('/auth/login', { email, password });
      const t = data.token as string;
      await tokenStore.set(t);
      setToken(t);
      setUser(data.user);
      hideWhenReady();
      setTimeout(() => hide(), 500);
    } catch (e) {
      hide();
      throw e;
    }
  };

  const register = async (data: any) => {
    show('Signing in...');
    try {
      const res: any = await api.post('/auth/register', data);
      const t = res.token as string;
      await tokenStore.set(t);
      setToken(t);
      setUser(res.user);
      hideWhenReady();
      setTimeout(() => hide(), 500);
    } catch (e) {
      hide();
      throw e;
    }
  };

  const logout = async () => {
    show('Signing out...');
    try {
      await api.post('/auth/logout');
    } catch {}
    await tokenStore.remove();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith('exam_draft_') || k.startsWith('leaderboard-') || k.startsWith('luav6-')) localStorage.removeItem(k);
        });
      }
    } catch {}
    setToken(null);
    setUser(null);
    hideWhenReady();
    setTimeout(() => hide(), 500);
  };

  return <Ctx.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
