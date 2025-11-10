// Simple in-memory + sessionStorage backed TTL cache for client-side data

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 3 * 60 * 1000; // 3 minutes

function now(): number {
  return Date.now();
}

function isExpired<T>(entry: CacheEntry<T>): boolean {
  return entry.expiresAt <= now();
}

function readFromSessionStorage<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || typeof parsed.expiresAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeToSessionStorage<T>(key: string, entry: CacheEntry<T>): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Ignore storage write failures (e.g., Safari private mode or quota exceeded)
  }
}

export function getCached<T>(key: string): T | null {
  const inMemory = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (inMemory) {
    if (isExpired(inMemory)) {
      memoryCache.delete(key);
    } else {
      return inMemory.value;
    }
  }

  const fromSession = readFromSessionStorage<T>(key);
  if (fromSession) {
    if (isExpired(fromSession)) {
      sessionStorage.removeItem(key);
      return null;
    }
    // Hydrate memory cache for faster subsequent reads
    memoryCache.set(key, fromSession);
    return fromSession.value;
  }

  return null;
}

export function setCached<T>(
  key: string,
  value: T,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  const entry: CacheEntry<T> = { value, expiresAt: now() + ttlMs };
  memoryCache.set(key, entry);
  writeToSessionStorage(key, entry);
}

export function clearCacheByPrefix(prefix: string): void {
  for (const k of memoryCache.keys()) {
    if (k.startsWith(prefix)) memoryCache.delete(k);
  }
  try {
    // Best-effort clear for sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(prefix)) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }
}

export function stableKeyForObject(obj: Record<string, unknown>): string {
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return JSON.stringify(entries);
}

export const DEFAULT_CACHE_TTL_MS = DEFAULT_TTL_MS;
