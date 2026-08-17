import type {
  ActivityDay,
  Dashboard,
  Measurement,
  PublicUser,
  SyncDay,
} from '@/api/types';
import {
  addDays,
  dailyStreak,
  endOfIsoWeek,
  formatDateOnly,
  parseDateOnly,
  startOfIsoWeek,
  weeklyStreak,
} from '@/utils/dates';
import type { OutboxOp, UserCache } from '@/offline/storage';

const recentMeasurementTake = 8;

export function emptyActivityDay(date: string): ActivityDay {
  return {
    date,
    workedOut: false,
    workoutMinutes: 0,
    steps: null,
    activeCalories: null,
    weight: null,
    bodyFat: null,
  };
}

export function cloneCache(cache: UserCache): UserCache {
  return {
    activity: { ...cache.activity },
    measurements: cache.measurements.map((item) => ({ ...item })),
    groups: cache.groups,
    pendingInvitations: cache.pendingInvitations,
  };
}

export function activityFromDashboard(
  dashboard: Dashboard,
): Record<string, ActivityDay> {
  const map: Record<string, ActivityDay> = {};
  for (const day of dashboard.activityDays ?? []) {
    map[day.date] = { ...day };
  }
  for (const day of dashboard.week.days) {
    if (!map[day.date]) {
      map[day.date] = {
        ...emptyActivityDay(day.date),
        workedOut: day.workedOut,
      };
    }
  }
  map[dashboard.today.date] = {
    date: dashboard.today.date,
    workedOut: dashboard.today.workedOut,
    workoutMinutes: dashboard.today.workoutMinutes,
    steps: dashboard.today.steps,
    activeCalories: dashboard.today.activeCalories,
    weight: dashboard.today.weight,
    bodyFat: dashboard.today.bodyFat,
  };
  return map;
}

export function ingestDashboard(cache: UserCache, dashboard: Dashboard): void {
  cache.activity = activityFromDashboard(dashboard);
  cache.groups = dashboard.groups;
  cache.pendingInvitations = dashboard.pendingInvitations;
  for (const item of dashboard.recentMeasurements) {
    upsertMeasurement(cache.measurements, item);
  }
}

export function ingestMeasurements(
  cache: UserCache,
  measurements: Measurement[],
): void {
  cache.measurements = measurements.map((item) => ({ ...item }));
}

export function mergeSyncDay(existing: ActivityDay | undefined, day: SyncDay): ActivityDay {
  const base = existing ?? emptyActivityDay(day.date);
  const qualifies = (day.sessions ?? []).some(
    (session) => session.qualifies !== false,
  );
  return {
    date: day.date,
    workedOut: base.workedOut || qualifies,
    workoutMinutes: day.workoutMinutes ?? base.workoutMinutes,
    steps: day.steps ?? base.steps,
    activeCalories: day.activeCalories ?? base.activeCalories,
    weight: day.weight ?? base.weight,
    bodyFat: day.bodyFat ?? base.bodyFat,
  };
}

export function markActivityDay(
  cache: UserCache,
  date: string,
  durationMinutes?: number,
): void {
  const current = cache.activity[date] ?? emptyActivityDay(date);
  cache.activity[date] = {
    ...current,
    workedOut: true,
    workoutMinutes: durationMinutes ?? current.workoutMinutes,
  };
}

export function upsertMeasurement(
  measurements: Measurement[],
  item: Measurement,
): void {
  const index = measurements.findIndex(
    (entry) =>
      entry.id === item.id ||
      (item.externalId !== undefined && entry.externalId === item.externalId),
  );
  if (index >= 0) {
    measurements[index] = { ...measurements[index], ...item };
    return;
  }
  measurements.push({ ...item });
}

export function applyOutboxToCache(cache: UserCache, ops: OutboxOp[]): void {
  for (const op of ops) {
    if (op.type === 'syncActivity') {
      for (const day of op.days) {
        cache.activity[day.date] = mergeSyncDay(cache.activity[day.date], day);
      }
    } else if (op.type === 'markWorkout') {
      markActivityDay(cache, op.date, op.durationMinutes);
    } else if (op.type === 'createMeasurement') {
      upsertMeasurement(cache.measurements, {
        id: op.payload.clientId,
        type: op.payload.type,
        value: op.payload.value,
        unit: op.payload.unit,
        timestamp: op.payload.timestamp,
        source: op.payload.source,
        externalId: op.payload.externalId,
      });
    } else if (op.type === 'deleteMeasurement') {
      cache.measurements = cache.measurements.filter(
        (item) =>
          item.id !== op.measurementId && item.externalId !== op.measurementId,
      );
    }
  }
}

export function applyProfilePatch(
  user: PublicUser,
  payload: {
    displayName?: string;
    language?: string;
    weeklyWorkoutGoal?: number;
  },
): PublicUser {
  return {
    ...user,
    displayName: payload.displayName ?? user.displayName,
    language: payload.language ?? user.language,
    weeklyWorkoutGoal: payload.weeklyWorkoutGoal ?? user.weeklyWorkoutGoal,
  };
}

export function effectiveUser(user: PublicUser, ops: OutboxOp[]): PublicUser {
  let next = user;
  for (const op of ops) {
    if (op.type === 'updateProfile') {
      next = applyProfilePatch(next, op.payload);
    }
  }
  return next;
}

export function buildDashboard(
  user: PublicUser,
  cache: UserCache,
  today: string,
): Dashboard {
  const todayDate = parseDateOnly(today);
  const weekStart = startOfIsoWeek(todayDate);
  const todayRow = cache.activity[today] ?? emptyActivityDay(today);
  const weekDays = [];
  for (let i = 0; i < 7; i += 1) {
    const date = formatDateOnly(addDays(weekStart, i));
    weekDays.push({
      date,
      workedOut: cache.activity[date]?.workedOut ?? false,
    });
  }
  const qualifyingDays = Object.values(cache.activity).map((day) => ({
    date: parseDateOnly(day.date),
    workedOut: day.workedOut,
  }));
  const recentMeasurements = [...cache.measurements]
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .slice(0, recentMeasurementTake);

  return {
    user,
    today: {
      date: today,
      workedOut: todayRow.workedOut,
      workoutMinutes: todayRow.workoutMinutes,
      steps: todayRow.steps,
      activeCalories: todayRow.activeCalories,
      weight: todayRow.weight,
      bodyFat: todayRow.bodyFat,
    },
    week: {
      start: formatDateOnly(weekStart),
      end: formatDateOnly(endOfIsoWeek(weekStart)),
      qualifyingDays: weekDays.filter((day) => day.workedOut).length,
      target: user.weeklyWorkoutGoal,
      days: weekDays,
    },
    streak: {
      weekly: weeklyStreak(qualifyingDays, user.weeklyWorkoutGoal, todayDate),
      daily: dailyStreak(qualifyingDays, todayDate),
    },
    recentMeasurements,
    activityDays: Object.values(cache.activity),
    groups: cache.groups,
    pendingInvitations: cache.pendingInvitations,
  };
}
