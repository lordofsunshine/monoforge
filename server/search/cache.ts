type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const SEARCH_CACHE_TTL_MS = 15_000;
const SEARCH_CACHE_MAX_ENTRIES = 100;
const cache = new Map<string, CacheEntry<unknown>>();

export function getCachedSearch<T>(key: string): T | null {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.value as T;
}

export function setCachedSearch<T>(key: string, value: T) {
  if (cache.size >= SEARCH_CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;

    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  cache.set(key, {
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
    value,
  });
}

export function clearSearchCache() {
  cache.clear();
}
