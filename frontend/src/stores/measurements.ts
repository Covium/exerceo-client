import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api/client';
import type { Measurement } from '@/api/types';
import {
  applyOutboxToCache,
  emptyActivityDay,
  ingestMeasurements,
} from '@/offline/ledger';
import { browserOffline, isNetworkError, isReachable } from '@/offline/network';
import { enqueue, flushOutbox, newId } from '@/offline/outbox';
import {
  loadCache,
  loadOutbox,
  loadSession,
  saveCache,
} from '@/offline/storage';
import { useAuthStore } from '@/stores/auth';
import { useDashboardStore } from '@/stores/dashboard';

export const useMeasurementsStore = defineStore('measurements', () => {
  const items = ref<Measurement[]>([]);

  function currentUserId(): string | null {
    const auth = useAuthStore();
    return auth.user?.id ?? loadSession()?.id ?? null;
  }

  function paint(): void {
    const userId = currentUserId();
    if (!userId) {
      items.value = [];
      return;
    }
    items.value = loadCache(userId).measurements;
    useDashboardStore().paintFromCache();
  }

  async function load(): Promise<void> {
    paint();
    const userId = currentUserId();
    if (!userId || browserOffline() || !isReachable()) {
      return;
    }
    try {
      await flushOutbox(userId);
      const measurements = await api.listMeasurements();
      const cache = loadCache(userId);
      ingestMeasurements(cache, measurements);
      applyOutboxToCache(cache, loadOutbox(userId));
      saveCache(userId, cache);
      paint();
    } catch (cause) {
      if (!isNetworkError(cause)) {
        throw cause;
      }
    }
  }

  async function add(input: {
    type: string;
    value: number;
    unit: string;
    timestamp: string;
  }): Promise<void> {
    const userId = currentUserId();
    if (!userId) {
      return;
    }
    const clientId = newId();
    const externalId = `manual:${clientId}`;
    const local: Measurement = {
      id: clientId,
      type: input.type,
      value: input.value,
      unit: input.unit,
      timestamp: input.timestamp,
      source: 'manual',
      externalId,
    };
    const cache = loadCache(userId);
    cache.measurements.push(local);
    if (input.type === 'weight' || input.type === 'body_fat') {
      const date = input.timestamp.slice(0, 10);
      const day = cache.activity[date] ?? emptyActivityDay(date);
      cache.activity[date] = {
        ...day,
        weight: input.type === 'weight' ? input.value : day.weight,
        bodyFat: input.type === 'body_fat' ? input.value : day.bodyFat,
      };
    }
    saveCache(userId, cache);
    enqueue(userId, {
      id: newId(),
      type: 'createMeasurement',
      payload: {
        type: input.type,
        value: input.value,
        unit: input.unit,
        timestamp: input.timestamp,
        source: 'manual',
        externalId,
        clientId,
      },
    });
    paint();
    if (isReachable() && !browserOffline()) {
      try {
        await flushOutbox(userId);
        await load();
      } catch (cause) {
        if (!isNetworkError(cause)) {
          throw cause;
        }
      }
    }
  }

  async function remove(id: string): Promise<void> {
    const userId = currentUserId();
    if (!userId) {
      return;
    }
    const cache = loadCache(userId);
    const existing = cache.measurements.find((item) => item.id === id);
    cache.measurements = cache.measurements.filter((item) => item.id !== id);
    saveCache(userId, cache);
    enqueue(userId, {
      id: newId(),
      type: 'deleteMeasurement',
      measurementId: existing?.id ?? id,
    });
    paint();
    if (isReachable() && !browserOffline()) {
      try {
        await flushOutbox(userId);
        await load();
      } catch (cause) {
        if (!isNetworkError(cause)) {
          throw cause;
        }
      }
    }
  }

  return { items, paint, load, add, remove };
});
