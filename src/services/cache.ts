// ─── Simple TTL cache backed by localStorage ──────────────────────────────
//
// Orange Belt requirement: "Basic caching implementation"
//
// Usage:
//   cache.set('vault_info', data, 30_000);   // 30s TTL
//   const hit = cache.get<VaultInfo>('vault_info');
//   cache.invalidate('vault_info');

interface CacheEntry<T> {
  data: T;
  ts: number;  // stored-at timestamp (ms)
  ttl: number; // time-to-live (ms)
}

const PREFIX = 'sv_'; // stellar-vault

export const cache = {
  /**
   * Store a value with a TTL (default 30 seconds).
   */
  set<T>(key: string, data: T, ttlMs = 30_000): void {
    const entry: CacheEntry<T> = { data, ts: Date.now(), ttl: ttlMs };
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(entry));
    } catch {
      // quota exceeded — silently ignore
    }
  },

  /**
   * Retrieve a cached value. Returns `null` if missing or expired.
   */
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - entry.ts >= entry.ttl) {
        localStorage.removeItem(PREFIX + key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  },

  /**
   * Remove a single key from cache.
   */
  invalidate(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // ignore
    }
  },

  /**
   * Clear every StellarVault cache entry.
   */
  invalidateAll(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  },
};
