type ReachableListener = (reachable: boolean) => void;

const listeners = new Set<ReachableListener>();
let reachable = typeof navigator === 'undefined' ? true : navigator.onLine;

export class NetworkError extends Error {
  constructor(message = 'error-network') {
    super(message);
    this.name = 'NetworkError';
  }
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError;
}

export function isReachable(): boolean {
  return reachable;
}

export function setReachable(value: boolean): void {
  if (reachable === value) {
    return;
  }
  reachable = value;
  for (const listener of listeners) {
    listener(value);
  }
}

export function subscribeReachable(listener: ReachableListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function browserOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}
