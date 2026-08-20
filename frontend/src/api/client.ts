import type {
  AuthResponse,
  Dashboard,
  Measurement,
  PublicUser,
  SearchUser,
  SyncDay,
} from '@/api/types';
import {
  clearNativeSession,
  isHealthBridgeAvailable,
  setNativeSession,
} from '@/bridge/health';
import { NetworkError, setReachable } from '@/offline/network';

const TOKEN_KEY = 'exerceo.token';
const REQUEST_TIMEOUT_MS = 5000;

function apiBase(): string {
  return (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
}

type TokenListener = (token: string | null) => void;

const tokenListeners = new Set<TokenListener>();

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function onTokenChange(listener: TokenListener): () => void {
  tokenListeners.add(listener);
  return () => {
    tokenListeners.delete(listener);
  };
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
  for (const listener of tokenListeners) {
    listener(token);
  }
  mirrorNativeSession(token);
}

export function syncNativeSession(): void {
  mirrorNativeSession(getToken());
}

function absoluteApiBase(): string {
  const base = apiBase();
  if (/^https?:\/\//i.test(base)) {
    return base;
  }
  const path = base.startsWith('/') ? base : `/${base}`;
  return `${window.location.origin}${path}`;
}

function mirrorNativeSession(token: string | null): void {
  if (!isHealthBridgeAvailable()) {
    return;
  }
  const task = token
    ? setNativeSession(token, absoluteApiBase())
    : clearNativeSession();
  void task.catch(() => undefined);
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export { NetworkError } from '@/offline/network';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  if (init.signal) {
    if (init.signal.aborted) {
      controller.abort();
    } else {
      init.signal.addEventListener('abort', () => controller.abort(), {
        once: true,
      });
    }
  }

  let response: Response;
  try {
    response = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } catch {
    setReachable(false);
    throw new NetworkError();
  } finally {
    window.clearTimeout(timer);
  }

  if (response.status === 204) {
    setReachable(true);
    return undefined as T;
  }
  const text = await response.text();
  const data = parseBody(text);
  if (!response.ok) {
    if (isUnreachableResponse(response.status, data)) {
      setReachable(false);
      throw new NetworkError();
    }
    setReachable(true);
    const message = errorMessage(data, response.statusText);
    if (response.status === 401) {
      setToken(null);
    }
    throw new ApiError(response.status, message);
  }
  setReachable(true);
  return data as T;
}

function parseBody(text: string): unknown {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function isUnreachableResponse(status: number, data: unknown): boolean {
  if (status === 502 || status === 503 || status === 504) {
    return true;
  }
  if (status !== 500) {
    return false;
  }
  return !isApiErrorBody(data);
}

function isApiErrorBody(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    ('message' in data || 'statusCode' in data)
  );
}

function errorMessage(data: unknown, fallback: string): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    (typeof data.message === 'string' || Array.isArray(data.message))
  ) {
    return Array.isArray(data.message) ? data.message.join(', ') : data.message;
  }
  return fallback;
}

export const api = {
  enter(body: {
    login: string;
    password: string;
    displayName?: string;
    language?: string;
  }) {
    return request<AuthResponse>('/auth/enter', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  me() {
    return request<PublicUser>('/auth/me');
  },
  updateMe(body: {
    displayName?: string;
    language?: string;
    weeklyWorkoutGoal?: number;
  }) {
    return request<PublicUser>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
  searchUsers(query: string) {
    return request<SearchUser[]>(
      `/users/search?q=${encodeURIComponent(query)}`,
    );
  },
  dashboard(today: string) {
    return request<Dashboard>(`/dashboard?today=${encodeURIComponent(today)}`);
  },
  markWorkout(date: string, durationMinutes?: number) {
    return request<{ date: string; workedOut: boolean }>('/workouts/manual', {
      method: 'POST',
      body: JSON.stringify({ date, durationMinutes }),
    });
  },
  syncActivity(days: SyncDay[]) {
    return request<{ synced: number }>('/activity/sync', {
      method: 'PUT',
      body: JSON.stringify({ days }),
    });
  },
  listMeasurements(type?: string) {
    const suffix = type ? `?type=${encodeURIComponent(type)}` : '';
    return request<Measurement[]>(`/measurements${suffix}`);
  },
  createMeasurement(body: {
    type: string;
    value: number;
    unit: string;
    timestamp: string;
    source?: string;
    externalId?: string;
  }) {
    return request<Measurement>('/measurements', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  deleteMeasurement(id: string) {
    return request<{ id: string }>(`/measurements/${id}`, { method: 'DELETE' });
  },
  createGroup(name: string) {
    return request<{ id: string; name: string }>('/groups', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },
  invite(groupId: string, login: string) {
    return request<unknown>(`/groups/${groupId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ login }),
    });
  },
  acceptInvitation(id: string) {
    return request<{ accepted: boolean; groupId: string }>(
      `/invitations/${id}/accept`,
      { method: 'POST' },
    );
  },
  declineInvitation(id: string) {
    return request<{ declined: boolean }>(`/invitations/${id}/decline`, {
      method: 'POST',
    });
  },
  leaveGroup(id: string) {
    return request<{ left: boolean }>(`/groups/${id}/leave`, {
      method: 'DELETE',
    });
  },
};
