import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api/client';
import {
  realtimeAsOfDate,
  type Dashboard,
  type RealtimeEvent,
  type SyncDay,
} from '@/api/types';
import {
  getHealthAvailability,
  isHealthBridgeAvailable,
  readHealthRange,
  requestHealthPermissions,
  type HealthAvailability,
} from '@/bridge/health';
import {
  applyOutboxToCache,
  applyRealtimeEvent,
  buildDashboard,
  cloneCache,
  effectiveUser,
  ingestDashboard,
  ingestHealthConnectWeights,
  ingestMeasurements,
  markActivityDay,
  mergeSyncDay,
} from '@/offline/ledger';
import { browserOffline, isNetworkError, isReachable } from '@/offline/network';
import { enqueue, flushOutbox, newId } from '@/offline/outbox';
import {
  loadCache,
  loadHealthAsked,
  loadHealthBackgroundAsked,
  loadHealthLastSync,
  loadOutbox,
  loadSession,
  saveCache,
  saveHealthAsked,
  saveHealthBackgroundAsked,
  saveHealthLastSync,
  saveSession,
} from '@/offline/storage';
import { daysAgoIso, todayIso } from '@/utils/dates';
import { useAuthStore } from '@/stores/auth';

export const useDashboardStore = defineStore('dashboard', () => {
  const data = ref<Dashboard | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const errorDetail = ref<string | null>(null);
  const healthStatus = ref<HealthAvailability>('unavailable');
  const healthError = ref<string | null>(null);
  const healthErrorDetail = ref<string | null>(null);
  const lastHealthSyncAt = ref<string | null>(null);
  const syncing = ref(false);
  const spell = ref<string | null>(null);

  function paintFromCache(): void {
    const auth = useAuthStore();
    const user = auth.user ?? loadSession();
    if (!user) {
      return;
    }
    const cache = cloneCache(loadCache(user.id));
    const ops = loadOutbox(user.id);
    applyOutboxToCache(cache, ops);
    data.value = buildDashboard(effectiveUser(user, ops), cache, todayIso());
    lastHealthSyncAt.value = loadHealthLastSync(user.id);
  }

  async function refresh(): Promise<void> {
    loading.value = true;
    error.value = null;
    errorDetail.value = null;
    paintFromCache();
    if (isHealthBridgeAvailable()) {
      healthStatus.value = await getHealthAvailability();
    } else {
      healthStatus.value = 'unavailable';
    }

    const auth = useAuthStore();
    const user = auth.user ?? loadSession();
    if (!user) {
      loading.value = false;
      return;
    }

    try {
      try {
        await mergeHealth(user.id);
        paintFromCache();
      } catch {
        paintFromCache();
      }
      if (browserOffline() || !isReachable()) {
        return;
      }
      await flushOutbox(user.id);
      const [dashboard, measurements] = await Promise.all([
        api.dashboard(todayIso()),
        api.listMeasurements().catch(() => null),
      ]);
      const cache = loadCache(user.id);
      ingestDashboard(cache, dashboard);
      if (measurements) {
        ingestMeasurements(cache, measurements);
      }
      applyOutboxToCache(cache, loadOutbox(user.id));
      saveCache(user.id, cache);
      saveSession(dashboard.user);
      auth.user = dashboard.user;
      paintFromCache();
    } catch (cause) {
      if (!isNetworkError(cause)) {
        error.value = 'error-generic';
        errorDetail.value = cause instanceof Error ? cause.message : null;
      }
    } finally {
      loading.value = false;
    }
  }

  async function markToday(durationMinutes?: number): Promise<void> {
    const auth = useAuthStore();
    const user = auth.user ?? loadSession();
    if (!user) {
      return;
    }
    const before = data.value;
    const today = todayIso();
    const cache = loadCache(user.id);
    markActivityDay(cache, today, durationMinutes);
    saveCache(user.id, cache);
    enqueue(user.id, {
      id: newId(),
      type: 'markWorkout',
      date: today,
      durationMinutes,
    });
    paintFromCache();
    const after = data.value;
    if (after) {
      if (
        after.week.qualifyingDays >= after.week.target &&
        (before?.week.qualifyingDays ?? 0) < after.week.target
      ) {
        spell.value = 'spell-goal';
      } else if ((after.streak.weekly ?? 0) > (before?.streak.weekly ?? 0)) {
        spell.value = 'spell-streak';
      } else {
        spell.value = 'exerceo-done';
      }
    }
    if (isReachable() && !browserOffline()) {
      try {
        await flushOutbox(user.id);
        await refresh();
      } catch (cause) {
        if (!isNetworkError(cause)) {
          throw cause;
        }
      }
    }
  }

  async function promptHealthAccessOnce(): Promise<void> {
    if (!isHealthBridgeAvailable()) {
      return;
    }
    try {
      healthStatus.value = await getHealthAvailability();
    } catch {
      healthStatus.value = 'unavailable';
      return;
    }
    if (
      healthStatus.value !== 'available' ||
      (loadHealthAsked() && loadHealthBackgroundAsked())
    ) {
      return;
    }
    try {
      const result = await requestHealthPermissions();
      rememberHealthAsked();
      if (!result.granted) {
        return;
      }
      const auth = useAuthStore();
      const user = auth.user ?? loadSession();
      if (!user) {
        return;
      }
      await mergeHealth(user.id);
      paintFromCache();
    } catch {
      rememberHealthAsked();
    }
  }

  async function connectHealth(): Promise<void> {
    try {
      const result = await requestHealthPermissions();
      rememberHealthAsked();
      if (!result.granted) {
        healthError.value = 'health-denied';
        healthErrorDetail.value = null;
        return;
      }
      healthError.value = null;
      healthErrorDetail.value = null;
      healthStatus.value = await getHealthAvailability();
    } catch (cause) {
      rememberHealthAsked();
      healthError.value = 'health-sync-failed';
      healthErrorDetail.value = cause instanceof Error ? cause.message : null;
    }
  }

  async function syncHealth(): Promise<void> {
    const auth = useAuthStore();
    const user = auth.user ?? loadSession();
    if (!user || !isHealthBridgeAvailable()) {
      return;
    }
    syncing.value = true;
    healthError.value = null;
    healthErrorDetail.value = null;
    try {
      const permission = await requestHealthPermissions();
      rememberHealthAsked();
      if (!permission.granted) {
        healthError.value = 'health-denied';
        healthErrorDetail.value = null;
        return;
      }
      await mergeHealth(user.id);
      paintFromCache();
      if (isReachable() && !browserOffline()) {
        await flushOutbox(user.id);
        await refresh();
      }
    } catch (cause) {
      rememberHealthAsked();
      healthError.value = 'health-sync-failed';
      healthErrorDetail.value = cause instanceof Error ? cause.message : null;
    } finally {
      syncing.value = false;
    }
  }

  function applySyncEvent(event: RealtimeEvent): void {
    const auth = useAuthStore();
    const user = auth.user ?? loadSession();
    if (!user) {
      return;
    }
    const today = todayIso();
    const asOf = realtimeAsOfDate(event);
    if (asOf !== undefined && asOf !== today) {
      void refresh();
      return;
    }
    const cache = cloneCache(loadCache(user.id));
    applyRealtimeEvent(cache, event);
    applyOutboxToCache(cache, loadOutbox(user.id));
    saveCache(user.id, cache);
    paintFromCache();
  }

  function rememberHealthAsked(): void {
    saveHealthAsked();
    saveHealthBackgroundAsked();
  }

  function rememberHealthSync(userId: string): void {
    const iso = new Date().toISOString();
    saveHealthLastSync(userId, iso);
    lastHealthSyncAt.value = iso;
  }

  async function mergeHealth(userId: string): Promise<void> {
    if (!isHealthBridgeAvailable()) {
      return;
    }
    const summaries = await readHealthRange(
      new Date(`${daysAgoIso(21)}T00:00:00`).toISOString(),
      new Date(`${todayIso()}T23:59:59.999`).toISOString(),
    );
    const days: SyncDay[] = summaries.map((day) => ({
      date: day.date,
      workoutMinutes: day.workoutMinutes,
      steps: day.steps,
      activeCalories: day.activeCalories,
      weight: day.weight,
      bodyFat: day.bodyFat,
      sessions: day.sessions.map((session) => ({
        externalId: session.externalId,
        durationMinutes: session.durationMinutes,
        qualifies: true,
      })),
    }));
    if (days.length > 0) {
      const cache = loadCache(userId);
      for (const day of days) {
        cache.activity[day.date] = mergeSyncDay(cache.activity[day.date], day);
      }
      const weights = ingestHealthConnectWeights(cache, days);
      saveCache(userId, cache);
      for (const measurement of weights) {
        enqueue(userId, {
          id: newId(),
          type: 'createMeasurement',
          payload: {
            type: measurement.type,
            value: measurement.value,
            unit: measurement.unit,
            timestamp: measurement.timestamp,
            source: measurement.source,
            externalId: measurement.externalId ?? '',
            clientId: measurement.id,
          },
        });
      }
      enqueue(userId, {
        id: newId(),
        type: 'syncActivity',
        days,
      });
    }
    rememberHealthSync(userId);
  }

  function clearSpell(): void {
    spell.value = null;
  }

  return {
    data,
    loading,
    error,
    errorDetail,
    healthStatus,
    healthError,
    healthErrorDetail,
    lastHealthSyncAt,
    syncing,
    spell,
    paintFromCache,
    applySyncEvent,
    refresh,
    markToday,
    promptHealthAccessOnce,
    connectHealth,
    syncHealth,
    clearSpell,
  };
});
