export type Language = 'en' | 'ru';

export type PublicUser = {
  id: string;
  login: string;
  displayName: string;
  language: Language | string;
  weeklyWorkoutGoal: number;
};

export type AuthResponse = {
  accessToken: string;
  user: PublicUser;
};

export type SearchUser = {
  id: string;
  login: string;
  displayName: string;
};

export type Measurement = {
  id: string;
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  source: string;
  externalId?: string;
};

export type ActivityDay = {
  date: string;
  workedOut: boolean;
  workoutMinutes: number;
  steps: number | null;
  activeCalories: number | null;
  weight: number | null;
  bodyFat: number | null;
};

export type GroupMemberStatus = {
  userId: string;
  login: string;
  displayName: string;
  todayWorkedOut: boolean;
  weekQualifying: number;
  weekTarget: number;
  weeklyStreak: number;
};

export type GroupStatus = {
  id: string;
  name: string;
  groupStreak: number;
  members: GroupMemberStatus[];
};

export type PendingInvitation = {
  id: string;
  group: { id: string; name: string };
  fromUser: SearchUser;
  createdAt: string;
};

export type Dashboard = {
  user: PublicUser;
  today: {
    date: string;
    workedOut: boolean;
    workoutMinutes: number;
    steps: number | null;
    activeCalories: number | null;
    weight: number | null;
    bodyFat: number | null;
  };
  week: {
    start: string;
    end: string;
    qualifyingDays: number;
    target: number;
    days: { date: string; workedOut: boolean }[];
  };
  streak: {
    weekly: number;
    daily: number;
  };
  recentMeasurements: Measurement[];
  activityDays?: ActivityDay[];
  groups: GroupStatus[];
  pendingInvitations: PendingInvitation[];
};

export type SyncDay = {
  date: string;
  workoutMinutes?: number;
  steps?: number;
  activeCalories?: number;
  weight?: number;
  bodyFat?: number;
  sessions?: {
    externalId: string;
    durationMinutes?: number;
    qualifies?: boolean;
  }[];
};
