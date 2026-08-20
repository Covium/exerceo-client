import type {
  GroupMemberStatus,
  GroupStatus,
  PendingInvitation,
  RealtimeEvent,
  SearchUser,
} from '@/api/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSearchUser(value: unknown): value is SearchUser {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.login === 'string' &&
    typeof value.displayName === 'string'
  );
}

function isGroupMemberStatus(value: unknown): value is GroupMemberStatus {
  return (
    isRecord(value) &&
    typeof value.userId === 'string' &&
    typeof value.login === 'string' &&
    typeof value.displayName === 'string' &&
    typeof value.todayWorkedOut === 'boolean' &&
    typeof value.weekQualifying === 'number' &&
    typeof value.weekTarget === 'number' &&
    typeof value.weeklyStreak === 'number'
  );
}

function isGroupStatus(value: unknown): value is GroupStatus {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.groupStreak === 'number' &&
    Array.isArray(value.members) &&
    value.members.every(isGroupMemberStatus)
  );
}

function isPendingInvitation(value: unknown): value is PendingInvitation {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.createdAt === 'string' &&
    isRecord(value.group) &&
    typeof value.group.id === 'string' &&
    typeof value.group.name === 'string' &&
    isSearchUser(value.fromUser)
  );
}

function isWeekDay(
  value: unknown,
): value is { date: string; workedOut: boolean } {
  return (
    isRecord(value) &&
    typeof value.date === 'string' &&
    typeof value.workedOut === 'boolean'
  );
}

export function isRealtimeEvent(value: unknown): value is RealtimeEvent {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false;
  }
  switch (value.type) {
    case 'group.member':
      return (
        typeof value.asOfDate === 'string' &&
        typeof value.groupId === 'string' &&
        typeof value.groupStreak === 'number' &&
        isGroupMemberStatus(value.member)
      );
    case 'group.snapshot':
      return typeof value.asOfDate === 'string' && isGroupStatus(value.group);
    case 'group.removed':
      return typeof value.groupId === 'string';
    case 'member.left':
      return (
        typeof value.groupId === 'string' &&
        typeof value.userId === 'string' &&
        typeof value.asOfDate === 'string' &&
        (value.group === null || isGroupStatus(value.group))
      );
    case 'invitation.created':
      return isPendingInvitation(value.invitation);
    case 'invitation.removed':
      return typeof value.invitationId === 'string';
    case 'self.day':
      return (
        typeof value.asOfDate === 'string' &&
        isRecord(value.today) &&
        typeof value.today.date === 'string' &&
        typeof value.today.workedOut === 'boolean' &&
        typeof value.today.workoutMinutes === 'number' &&
        (value.today.steps === null || typeof value.today.steps === 'number') &&
        (value.today.activeCalories === null ||
          typeof value.today.activeCalories === 'number') &&
        (value.today.weight === null ||
          typeof value.today.weight === 'number') &&
        (value.today.bodyFat === null ||
          typeof value.today.bodyFat === 'number') &&
        isRecord(value.week) &&
        typeof value.week.start === 'string' &&
        typeof value.week.end === 'string' &&
        typeof value.week.qualifyingDays === 'number' &&
        typeof value.week.target === 'number' &&
        Array.isArray(value.week.days) &&
        value.week.days.every(isWeekDay) &&
        isRecord(value.streak) &&
        typeof value.streak.weekly === 'number' &&
        typeof value.streak.daily === 'number'
      );
    default:
      return false;
  }
}
