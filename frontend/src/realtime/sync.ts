import { io, type Socket } from 'socket.io-client';
import { getToken, onTokenChange } from '@/api/client';
import { browserOffline } from '@/offline/network';
import { isRealtimeEvent } from '@/realtime/guard';
import { useDashboardStore } from '@/stores/dashboard';
import { todayIso } from '@/utils/dates';

let socket: Socket | null = null;
let bound = false;
let lastHelloDate: string | null = null;
let midnightTimer: number | null = null;

function socketTarget(): { url: string; path: string } {
  const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
  if (/^https?:\/\//i.test(base)) {
    const parsed = new URL(base);
    const prefix = parsed.pathname.replace(/\/$/, '');
    return {
      url: parsed.origin,
      path: `${prefix}/socket.io`,
    };
  }
  const prefix = base.startsWith('/') ? base : `/${base}`;
  return {
    url: window.location.origin,
    path: `${prefix}/socket.io`,
  };
}

function sendHello(): void {
  if (!socket?.connected) {
    return;
  }
  const today = todayIso();
  lastHelloDate = today;
  socket.emit('hello', { today });
}

function connect(): void {
  const token = getToken();
  if (!token || browserOffline() || socket) {
    return;
  }
  const { url, path } = socketTarget();
  socket = io(url, {
    path,
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
  });
  socket.on('connect', () => {
    sendHello();
  });
  socket.on('sync', (payload: unknown) => {
    if (!isRealtimeEvent(payload)) {
      return;
    }
    useDashboardStore().applySyncEvent(payload);
  });
}

function disconnect(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}

function syncSocketAuth(): void {
  if (getToken() && !browserOffline()) {
    if (!socket) {
      connect();
    }
    return;
  }
  disconnect();
}

function msUntilNextLocalMidnight(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return Math.max(next.getTime() - now.getTime(), 1000);
}

function scheduleMidnightHello(): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (midnightTimer !== null) {
    window.clearTimeout(midnightTimer);
  }
  midnightTimer = window.setTimeout(() => {
    sendHello();
    void useDashboardStore().refresh();
    scheduleMidnightHello();
  }, msUntilNextLocalMidnight());
}

export function bindRealtime(): void {
  if (bound || typeof window === 'undefined') {
    return;
  }
  bound = true;
  onTokenChange(() => {
    disconnect();
    syncSocketAuth();
  });
  window.addEventListener('online', () => {
    syncSocketAuth();
  });
  window.addEventListener('offline', () => {
    disconnect();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') {
      return;
    }
    const today = todayIso();
    if (lastHelloDate !== today) {
      sendHello();
      void useDashboardStore().refresh();
      return;
    }
    sendHello();
  });
  scheduleMidnightHello();
  syncSocketAuth();
}
