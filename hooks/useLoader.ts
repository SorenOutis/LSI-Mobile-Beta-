import { useState, useCallback, useEffect } from 'react';

export const LOADER_MESSAGES = {
  INITIALIZING: 'Signing in...',
  TERMINATING: 'Signing out...',
} as const;

type LoaderMessage = (typeof LOADER_MESSAGES)[keyof typeof LOADER_MESSAGES] | string;

let globalState = {
  isVisible: false,
  pendingHide: false,
  message: LOADER_MESSAGES.INITIALIZING as LoaderMessage,
};

type Listener = () => void;
const listeners = new Set<Listener>();

const notify = () => listeners.forEach((l) => l());

export function useLoader() {
  const [, forceUpdate] = useState(0);
  const rerender = useCallback(() => forceUpdate((v) => v + 1), []);

  // Subscribe to global state changes
  useEffect(() => {
    const listener = () => rerender();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [rerender]);

  const show = useCallback((message: LoaderMessage = LOADER_MESSAGES.INITIALIZING) => {
    globalState.isVisible = true;
    globalState.pendingHide = false;
    globalState.message = message;
    notify();
  }, []);

  const hide = useCallback(() => {
    globalState.isVisible = false;
    globalState.pendingHide = false;
    notify();
  }, []);

  const hideWhenReady = useCallback(() => {
    globalState.pendingHide = true;
    notify();
  }, []);

  return {
    isVisible: globalState.isVisible,
    pendingHide: globalState.pendingHide,
    message: globalState.message,
    show,
    hide,
    hideWhenReady,
  };
}
