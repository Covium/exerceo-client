import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api/client';
import {
  browserOffline,
  isReachable,
  subscribeReachable,
} from '@/offline/network';
import { flushOutbox } from '@/offline/outbox';
import { loadSession } from '@/offline/storage';
import { useDashboardStore } from '@/stores/dashboard';

const PROBE_INTERVAL_MS = 15000;

export const useConnectivityStore = defineStore('connectivity', () => {
  const unreachable = ref(browserOffline() || !isReachable());
  let bound = false;
  let reconnecting = false;

  function syncFlag(): void {
    unreachable.value = browserOffline() || !isReachable();
  }

  async function reconnect(): Promise<void> {
    if (reconnecting || browserOffline()) {
      return;
    }
    const session = loadSession();
    if (!session) {
      return;
    }
    reconnecting = true;
    try {
      await api.me();
      await flushOutbox(session.id);
      await useDashboardStore().refresh();
    } catch {
      syncFlag();
    } finally {
      reconnecting = false;
      syncFlag();
    }
  }

  function bind(): void {
    if (bound || typeof window === 'undefined') {
      return;
    }
    bound = true;
    syncFlag();
    subscribeReachable(() => {
      const wasUnreachable = unreachable.value;
      syncFlag();
      if (wasUnreachable && !unreachable.value) {
        void reconnect();
      }
    });
    window.addEventListener('online', () => {
      syncFlag();
      void reconnect();
    });
    window.addEventListener('offline', () => {
      unreachable.value = true;
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && unreachable.value) {
        void reconnect();
      }
    });
    window.setInterval(() => {
      if (unreachable.value && !browserOffline()) {
        void reconnect();
      }
    }, PROBE_INTERVAL_MS);
  }

  return { unreachable, bind, reconnect, syncFlag };
});
