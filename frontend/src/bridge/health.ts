export type HealthAvailability = 'available' | 'unavailable' | 'install';

export type HealthSession = {
  externalId: string;
  start: string;
  end: string;
  durationMinutes: number;
};

export type HealthDaySummary = {
  date: string;
  steps?: number;
  activeCalories?: number;
  workoutMinutes?: number;
  weight?: number;
  bodyFat?: number;
  sessions: HealthSession[];
};

type Pending = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
};

const pending = new Map<string, Pending>();
let sequence = 0;

function installCallbacks(): void {
  if (window.__exerceoResolve) {
    return;
  }
  window.__exerceoResolve = (id, payloadJson) => {
    const task = pending.get(id);
    if (!task) {
      return;
    }
    pending.delete(id);
    task.resolve(JSON.parse(payloadJson) as unknown);
  };
  window.__exerceoReject = (id, message) => {
    const task = pending.get(id);
    if (!task) {
      return;
    }
    pending.delete(id);
    console.error('[Exerceo native]', message);
    task.reject(new Error(message));
  };
}

function nativeCall<T>(
  method: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  installCallbacks();
  const native = window.ExerceoNative;
  if (!native) {
    return Promise.reject(new Error('Health Connect is not available'));
  }
  const id = String((sequence += 1));
  return new Promise<T>((resolve, reject) => {
    pending.set(id, {
      resolve: (value) => resolve(value as T),
      reject,
    });
    native.request(id, method, JSON.stringify(args));
  });
}

export function isHealthBridgeAvailable(): boolean {
  return Boolean(window.ExerceoNative);
}

export async function getHealthAvailability(): Promise<HealthAvailability> {
  if (!isHealthBridgeAvailable()) {
    return 'unavailable';
  }
  try {
    const result = await nativeCall<{ status: HealthAvailability }>(
      'getAvailability',
    );
    return result.status;
  } catch {
    return 'unavailable';
  }
}

export function requestHealthPermissions(): Promise<{ granted: boolean }> {
  return nativeCall('requestPermissions');
}

export function readHealthRange(
  startIso: string,
  endIso: string,
): Promise<HealthDaySummary[]> {
  return nativeCall('readRange', { startIso, endIso });
}
