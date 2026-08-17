import { api, ApiError } from '@/api/client';
import type { SyncDay } from '@/api/types';
import { isNetworkError } from '@/offline/network';
import { upsertMeasurement } from '@/offline/ledger';
import {
  loadCache,
  loadOutbox,
  saveCache,
  saveOutbox,
  saveSession,
  type OutboxOp,
} from '@/offline/storage';

let flushChain: Promise<void> = Promise.resolve();

export function newId(): string {
  return crypto.randomUUID();
}

export function enqueue(userId: string, op: OutboxOp): void {
  const ops = coalesce(loadOutbox(userId), op);
  saveOutbox(userId, ops);
}

export function flushOutbox(userId: string): Promise<void> {
  flushChain = flushChain.then(
    () => runFlush(userId),
    () => runFlush(userId),
  );
  return flushChain;
}

async function runFlush(userId: string): Promise<void> {
  while (true) {
    const ops = loadOutbox(userId);
    const next = ops[0];
    if (!next) {
      return;
    }
    try {
      await execute(userId, next);
      saveOutbox(
        userId,
        loadOutbox(userId).filter((op) => op.id !== next.id),
      );
    } catch (cause) {
      if (isNetworkError(cause) || shouldKeep(cause)) {
        throw cause;
      }
      saveOutbox(
        userId,
        loadOutbox(userId).filter((op) => op.id !== next.id),
      );
    }
  }
}

function coalesce(ops: OutboxOp[], incoming: OutboxOp): OutboxOp[] {
  if (incoming.type === 'updateProfile') {
    return [...ops.filter((op) => op.type !== 'updateProfile'), incoming];
  }
  if (incoming.type === 'syncActivity') {
    const existing = ops.find((op) => op.type === 'syncActivity');
    if (existing && existing.type === 'syncActivity') {
      existing.days = mergeDays(existing.days, incoming.days);
      return ops;
    }
    return [...ops, incoming];
  }
  if (incoming.type === 'markWorkout') {
    return [
      ...ops.filter(
        (op) => !(op.type === 'markWorkout' && op.date === incoming.date),
      ),
      incoming,
    ];
  }
  if (incoming.type === 'deleteMeasurement') {
    const createIndex = ops.findIndex(
      (op) =>
        op.type === 'createMeasurement' &&
        (op.payload.clientId === incoming.measurementId ||
          op.payload.externalId === incoming.measurementId),
    );
    if (createIndex >= 0) {
      return ops.filter((_, index) => index !== createIndex);
    }
    return [...ops, incoming];
  }
  return [...ops, incoming];
}

function mergeDays(base: SyncDay[], extra: SyncDay[]): SyncDay[] {
  const map = new Map(base.map((day) => [day.date, day]));
  for (const day of extra) {
    const previous = map.get(day.date);
    if (!previous) {
      map.set(day.date, day);
      continue;
    }
    const sessions = new Map(
      (previous.sessions ?? []).map((session) => [session.externalId, session]),
    );
    for (const session of day.sessions ?? []) {
      sessions.set(session.externalId, session);
    }
    map.set(day.date, {
      ...previous,
      ...day,
      sessions: [...sessions.values()],
    });
  }
  return [...map.values()].sort((left, right) => left.date.localeCompare(right.date));
}

async function execute(userId: string, op: OutboxOp): Promise<void> {
  if (op.type === 'syncActivity') {
    await api.syncActivity(op.days);
    return;
  }
  if (op.type === 'markWorkout') {
    await api.markWorkout(op.date, op.durationMinutes);
    return;
  }
  if (op.type === 'createMeasurement') {
    const created = await api.createMeasurement({
      type: op.payload.type,
      value: op.payload.value,
      unit: op.payload.unit,
      timestamp: op.payload.timestamp,
      source: op.payload.source,
      externalId: op.payload.externalId,
    });
    const cache = loadCache(userId);
    cache.measurements = cache.measurements.filter(
      (item) =>
        item.id !== op.payload.clientId &&
        item.externalId !== op.payload.externalId,
    );
    upsertMeasurement(cache.measurements, {
      ...created,
      externalId: op.payload.externalId,
    });
    saveCache(userId, cache);
    return;
  }
  if (op.type === 'deleteMeasurement') {
    await api.deleteMeasurement(op.measurementId);
    return;
  }
  const updated = await api.updateMe(op.payload);
  saveSession(updated);
}

function shouldKeep(cause: unknown): boolean {
  if (!(cause instanceof ApiError)) {
    return true;
  }
  return cause.status === 401 || cause.status === 408 || cause.status === 429 || cause.status >= 500;
}
