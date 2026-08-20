import type {
  ActivityDay,
  GroupStatus,
  Measurement,
  PendingInvitation,
  PublicUser,
  SyncDay,
} from '@/api/types';

export const SESSION_KEY = 'exerceo.session';
const CACHE_PREFIX = 'exerceo.cache.';
const OUTBOX_PREFIX = 'exerceo.outbox.';
const HEALTH_ASKED_KEY = 'exerceo.healthAsked';
const HEALTH_BACKGROUND_ASKED_KEY = 'exerceo.healthBackgroundAsked';
const HEALTH_LAST_SYNC_PREFIX = 'exerceo.healthLastSync.';

export type UserCache = {
  activity: Record<string, ActivityDay>;
  measurements: Measurement[];
  groups: GroupStatus[];
  pendingInvitations: PendingInvitation[];
};

export type OutboxOp =
  | { id: string; type: 'syncActivity'; days: SyncDay[] }
  | { id: string; type: 'markWorkout'; date: string; durationMinutes?: number }
  | {
      id: string;
      type: 'createMeasurement';
      payload: {
        type: string;
        value: number;
        unit: string;
        timestamp: string;
        source: string;
        externalId: string;
        clientId: string;
      };
    }
  | { id: string; type: 'deleteMeasurement'; measurementId: string }
  | {
      id: string;
      type: 'updateProfile';
      payload: {
        displayName?: string;
        language?: string;
        weeklyWorkoutGoal?: number;
      };
    };

export function emptyCache(): UserCache {
  return {
    activity: {},
    measurements: [],
    groups: [],
    pendingInvitations: [],
  };
}

export function loadSession(): PublicUser | null {
  return readJson<PublicUser>(SESSION_KEY);
}

export function saveSession(user: PublicUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function loadCache(userId: string): UserCache {
  return readJson<UserCache>(CACHE_PREFIX + userId) ?? emptyCache();
}

export function saveCache(userId: string, cache: UserCache): void {
  localStorage.setItem(CACHE_PREFIX + userId, JSON.stringify(cache));
}

export function loadOutbox(userId: string): OutboxOp[] {
  return readJson<OutboxOp[]>(OUTBOX_PREFIX + userId) ?? [];
}

export function saveOutbox(userId: string, ops: OutboxOp[]): void {
  localStorage.setItem(OUTBOX_PREFIX + userId, JSON.stringify(ops));
}

export function loadHealthAsked(): boolean {
  return localStorage.getItem(HEALTH_ASKED_KEY) === '1';
}

export function saveHealthAsked(): void {
  localStorage.setItem(HEALTH_ASKED_KEY, '1');
}

export function loadHealthBackgroundAsked(): boolean {
  return localStorage.getItem(HEALTH_BACKGROUND_ASKED_KEY) === '1';
}

export function saveHealthBackgroundAsked(): void {
  localStorage.setItem(HEALTH_BACKGROUND_ASKED_KEY, '1');
}

export function loadHealthLastSync(userId: string): string | null {
  return localStorage.getItem(HEALTH_LAST_SYNC_PREFIX + userId);
}

export function saveHealthLastSync(userId: string, iso: string): void {
  localStorage.setItem(HEALTH_LAST_SYNC_PREFIX + userId, iso);
}

function readJson<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
