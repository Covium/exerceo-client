export function todayIso(): string {
  return formatLocalDate(new Date());
}

export function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatLocalDate(date);
}

export function parseDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid date: ${value}`);
  }
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatLocalizedDate(
  isoDate: string,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return isoDate;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Intl.DateTimeFormat(locale, options).format(
    new Date(year, month - 1, day),
  );
}

export function formatLocalizedDateTime(
  value: string,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
  },
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(value));
}

export function startOfIsoWeek(date: Date): Date {
  const utc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() - day + 1);
  return utc;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function endOfIsoWeek(date: Date): Date {
  return addDays(startOfIsoWeek(date), 6);
}

export type QualifyingDay = {
  date: Date;
  workedOut: boolean;
};

export function countQualifyingDays(
  days: QualifyingDay[],
  weekStart: Date,
  weekEnd: Date,
): number {
  const start = formatDateOnly(weekStart);
  const end = formatDateOnly(weekEnd);
  return days.filter((day) => {
    const key = formatDateOnly(day.date);
    return day.workedOut && key >= start && key <= end;
  }).length;
}

export function weeklyStreak(
  days: QualifyingDay[],
  weeklyGoal: number,
  today: Date,
): number {
  if (weeklyGoal <= 0) {
    return 0;
  }

  let weekStart = startOfIsoWeek(today);
  const currentCount = countQualifyingDays(
    days,
    weekStart,
    endOfIsoWeek(weekStart),
  );

  if (currentCount < weeklyGoal) {
    weekStart = addDays(weekStart, -7);
  }

  let streak = 0;
  for (let i = 0; i < 520; i += 1) {
    const count = countQualifyingDays(days, weekStart, endOfIsoWeek(weekStart));
    if (count < weeklyGoal) {
      break;
    }
    streak += 1;
    weekStart = addDays(weekStart, -7);
  }
  return streak;
}

export function dailyStreak(days: QualifyingDay[], today: Date): number {
  const byDate = new Map(
    days.map((day) => [formatDateOnly(day.date), day.workedOut]),
  );
  let cursor = today;
  if (!byDate.get(formatDateOnly(cursor))) {
    cursor = addDays(cursor, -1);
  }

  let streak = 0;
  for (let i = 0; i < 3660; i += 1) {
    if (!byDate.get(formatDateOnly(cursor))) {
      break;
    }
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
