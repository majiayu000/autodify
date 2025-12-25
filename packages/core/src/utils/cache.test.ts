import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LRUCache, createLRUCache, getCacheConfig } from './cache.js';

describe('LRUCache', () => {
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    cache = new LRUCache<string, number>({ maxSize: 3, enableStats: true });
  });

  describe('基本操作', () => {
    it('应该能够设置和获取值', () => {
      cache.set('a', 1);
      expect(cache.get('a')).toBe(1);
    });

    it('应该在键不存在时返回 undefined', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('应该能够删除值', () => {
      cache.set('a', 1);
      expect(cache.delete('a')).toBe(true);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.delete('a')).toBe(false);
    });

    it('应该能够检查键是否存在', () => {
      cache.set('a', 1);
      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
    });

    it('应该能够清空缓存', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.get('a')).toBeUndefined();
    });
  });

  describe('LRU 淘汰策略', () => {
    it('应该在达到最大容量时淘汰最少使用的项', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('d', 4); // 应该淘汰 'a'

      expect(cache.has('a')).toBe(false);
      expect(cache.has('b')).toBe(true);
      expect(cache.has('c')).toBe(true);
      expect(cache.has('d')).toBe(true);
    });

    it('访问应该更新项的位置', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.get('a'); // 访问 'a'，使其成为最近使用
      cache.set('d', 4); // 应该淘汰 'b' 而不是 'a'

      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
      expect(cache.has('c')).toBe(true);
      expect(cache.has('d')).toBe(true);
    });
  });

  describe('TTL 支持', () => {
    it('应该在 TTL 过期后返回 undefined', async () => {
      const cacheWithTTL = new LRUCache<string, number>({ maxSize: 10, ttl: 100 });
      cacheWithTTL.set('a', 1);

      expect(cacheWithTTL.get('a')).toBe(1);

      // 等待 TTL 过期
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(cacheWithTTL.get('a')).toBeUndefined();
    });

    it('应该支持自定义 TTL', async () => {
      const cacheWithTTL = new LRUCache<string, number>({ maxSize: 10, ttl: 1000 });
      cacheWithTTL.set('a', 1, 50); // 自定义 50ms TTL

      expect(cacheWithTTL.get('a')).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(cacheWithTTL.get('a')).toBeUndefined();
    });
  });

  describe('统计信息', () => {
    it('应该正确跟踪命中和未命中', () => {
      cache.set('a', 1);

      cache.get('a'); // 命中
      cache.get('b'); // 未命中
      cache.get('a'); // 命中

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(2 / 3);
    });

    it('应该能够重置统计信息', () => {
      cache.set('a', 1);
      cache.get('a');
      cache.get('b');

      cache.resetStats();

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('getOrSet 模式', () => {
    it('应该返回缓存值', async () => {
      cache.set('a', 1);
      const factory = vi.fn(() => 2);

      const value = await cache.getOrSet('a', factory);

      expect(value).toBe(1);
      expect(factory).not.toHaveBeenCalled();
    });

    it('应该在缓存未命中时调用工厂函数', async () => {
      const factory = vi.fn(() => 42);

      const value = await cache.getOrSet('a', factory);

      expect(value).toBe(42);
      expect(factory).toHaveBeenCalledTimes(1);
      expect(cache.get('a')).toBe(42);
    });

    it('应该支持异步工厂函数', async () => {
      const factory = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 99;
      });

      const value = await cache.getOrSet('a', factory);

      expect(value).toBe(99);
      expect(cache.get('a')).toBe(99);
    });
  });

  describe('辅助方法', () => {
    it('keys() 应该返回所有键', () => {
      cache.set('a', 1);
      cache.set('b', 2);

      const keys = Array.from(cache.keys());
      expect(keys).toContain('a');
      expect(keys).toContain('b');
    });

    it('values() 应该返回所有值', () => {
      cache.set('a', 1);
      cache.set('b', 2);

      const values = cache.values();
      expect(values).toContain(1);
      expect(values).toContain(2);
    });

    it('entries() 应该返回所有键值对', () => {
      cache.set('a', 1);
      cache.set('b', 2);

      const entries = cache.entries();
      expect(entries).toContainEqual(['a', 1]);
      expect(entries).toContainEqual(['b', 2]);
    });
  });
});

describe('createLRUCache', () => {
  it('应该创建新的缓存实例', () => {
    const cache = createLRUCache<string, number>({ maxSize: 10 });
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
  });
});

describe('getCacheConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('应该从环境变量读取配置', () => {
    process.env.TEST_CACHE_ENABLED = 'true';
    process.env.TEST_CACHE_MAX_SIZE = '200';
    process.env.TEST_CACHE_TTL = '5000';
    process.env.TEST_CACHE_STATS = 'true';

    const config = getCacheConfig('TEST');

    expect(config.enabled).toBe(true);
    expect(config.maxSize).toBe(200);
    expect(config.ttl).toBe(5000);
    expect(config.enableStats).toBe(true);
  });

  it('应该使用默认值', () => {
    const config = getCacheConfig('NONEXISTENT');

    expect(config.enabled).toBe(true);
    expect(config.maxSize).toBe(100);
    expect(config.ttl).toBeNull();
    expect(config.enableStats).toBe(false);
  });

  it('应该在设置为 false 时禁用缓存', () => {
    process.env.TEST_CACHE_ENABLED = 'false';

    const config = getCacheConfig('TEST');

    expect(config.enabled).toBe(false);
  });
});
