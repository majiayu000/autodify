/**
 * LRU (Least Recently Used) Cache Implementation
 *
 * A generic LRU cache with configurable TTL (Time To Live) and max size.
 * Automatically evicts least recently used items when capacity is exceeded.
 */

/**
 * Cache entry with value and metadata
 */
interface CacheEntry<V> {
  value: V;
  expiresAt: number | null;
  accessCount: number;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

/**
 * LRU Cache configuration options
 */
export interface LRUCacheOptions {
  /**
   * Maximum number of items in the cache
   * @default 100
   */
  maxSize?: number;

  /**
   * Time to live in milliseconds
   * Items expire after this duration
   * @default null (no expiration)
   */
  ttl?: number | null;

  /**
   * Enable cache statistics tracking
   * @default false
   */
  enableStats?: boolean;
}

/**
 * LRU Cache implementation with TTL support
 */
export class LRUCache<K = string, V = any> {
  private cache: Map<K, CacheEntry<V>>;
  private readonly maxSize: number;
  private readonly ttl: number | null;
  private readonly enableStats: boolean;

  // Statistics
  private hits = 0;
  private misses = 0;

  constructor(options: LRUCacheOptions = {}) {
    const { maxSize = 100, ttl = null, enableStats = false } = options;

    this.maxSize = maxSize;
    this.ttl = ttl;
    this.enableStats = enableStats;
    this.cache = new Map();
  }

  /**
   * Get a value from the cache
   * Returns undefined if key doesn't exist or entry has expired
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      if (this.enableStats) this.misses++;
      return undefined;
    }

    // Check if entry has expired
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      if (this.enableStats) this.misses++;
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, {
      ...entry,
      accessCount: entry.accessCount + 1,
    });

    if (this.enableStats) this.hits++;
    return entry.value;
  }

  /**
   * Set a value in the cache
   * Evicts least recently used item if cache is full
   */
  set(key: K, value: V, customTtl?: number): void {
    // Delete if exists to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict least recently used if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    // Calculate expiration time
    const ttlToUse = customTtl ?? this.ttl;
    const expiresAt = ttlToUse !== null ? Date.now() + ttlToUse : null;

    // Add new entry
    this.cache.set(key, {
      value,
      expiresAt,
      accessCount: 0,
    });
  }

  /**
   * Check if a key exists in the cache (without updating access time)
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check expiration
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the cache
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get the current size of the cache
   */
  get size(): number {
    // Clean expired entries first
    this.cleanExpired();
    return this.cache.size;
  }

  /**
   * Get cache keys
   */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /**
   * Get cache values
   */
  values(): V[] {
    const values: V[] = [];
    const cacheValues = Array.from(this.cache.values());
    for (const entry of cacheValues) {
      values.push(entry.value);
    }
    return values;
  }

  /**
   * Get cache entries
   */
  entries(): [K, V][] {
    const entries: [K, V][] = [];
    const cacheEntries = Array.from(this.cache.entries());
    for (const [key, entry] of cacheEntries) {
      entries.push([key, entry.value]);
    }
    return entries;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Remove expired entries
   */
  private cleanExpired(): void {
    const now = Date.now();
    const keysToDelete: K[] = [];

    const cacheEntries = Array.from(this.cache.entries());
    for (const [key, entry] of cacheEntries) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  /**
   * Get or set pattern - returns cached value or computes and caches new value
   */
  async getOrSet(key: K, factory: () => V | Promise<V>, customTtl?: number): Promise<V> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, customTtl);
    return value;
  }
}

/**
 * Create a new LRU cache instance
 */
export function createLRUCache<K = string, V = any>(options?: LRUCacheOptions): LRUCache<K, V> {
  return new LRUCache<K, V>(options);
}

/**
 * Cache configuration from environment variables
 */
export interface CacheConfig {
  enabled: boolean;
  maxSize: number;
  ttl: number | null;
  enableStats: boolean;
}

/**
 * Get cache configuration from environment variables
 */
export function getCacheConfig(prefix = ''): CacheConfig {
  const envPrefix = prefix ? `${prefix}_` : '';

  const cacheTtl = process.env[`${envPrefix}CACHE_TTL`];
  return {
    enabled: process.env[`${envPrefix}CACHE_ENABLED`] !== 'false',
    maxSize: parseInt(process.env[`${envPrefix}CACHE_MAX_SIZE`] || '100', 10),
    ttl: cacheTtl ? parseInt(cacheTtl, 10) : null,
    enableStats: process.env[`${envPrefix}CACHE_STATS`] === 'true',
  };
}
