/**
 * Node Registry - Re-export from nodes/ directory with caching
 */

import type { NodeMeta } from './types.js';
import { LRUCache, getCacheConfig } from '../utils/cache.js';

// Re-export all node metadata from nodes directory
export * from './nodes/index.js';
import {
  nodeMetaRegistry,
  getNodeMeta as _getNodeMeta,
  getAllNodeTypes as _getAllNodeTypes,
  getNodesByCategory as _getNodesByCategory,
} from './nodes/index.js';

// Re-export the registry
export { nodeMetaRegistry };

/**
 * Cache for node metadata queries
 */
const nodeCacheConfig = getCacheConfig('NODE');
const categoryCache = nodeCacheConfig.enabled
  ? new LRUCache<string, NodeMeta[]>({
      maxSize: nodeCacheConfig.maxSize,
      ttl: nodeCacheConfig.ttl,
      enableStats: nodeCacheConfig.enableStats,
    })
  : null;

/**
 * 获取节点元信息
 */
export function getNodeMeta(type: string): NodeMeta | undefined {
  return _getNodeMeta(type);
}

/**
 * 获取所有节点类型
 */
export function getAllNodeTypes(): string[] {
  return _getAllNodeTypes();
}

/**
 * 按分类获取节点 (with caching)
 */
export function getNodesByCategory(category: string): NodeMeta[] {
  // Check cache first
  const cached = categoryCache?.get(category);
  if (cached !== undefined) {
    return cached;
  }

  // Compute result
  const result = _getNodesByCategory(category);

  // Cache the result
  categoryCache?.set(category, result);

  return result;
}

/**
 * Get node registry cache statistics
 */
export function getNodeCacheStats() {
  return categoryCache?.getStats() ?? null;
}

/**
 * Clear node registry cache
 */
export function clearNodeCache(): void {
  categoryCache?.clear();
}
