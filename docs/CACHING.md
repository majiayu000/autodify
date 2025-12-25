# Caching Strategy

本文档说明 Autodify 项目中的缓存策略和配置。

## 概述

Autodify 实现了多层缓存策略以提高性能：

1. **Core 层缓存**：LRU 缓存用于模板匹配和节点注册表查询
2. **Server 层缓存**：HTTP 响应缓存与 ETag 支持

## Core 层缓存

### LRU Cache 实现

位置：`packages/core/src/utils/cache.ts`

一个通用的 LRU（Least Recently Used）缓存实现，支持：

- 可配置的最大容量
- TTL（Time To Live）过期策略
- 缓存统计（命中率、未命中次数等）
- 异步工厂函数模式（getOrSet）

#### 基本用法

```typescript
import { LRUCache, createLRUCache } from '@autodify/core';

// 创建缓存实例
const cache = new LRUCache({
  maxSize: 100,        // 最大缓存条目数
  ttl: 300000,         // 5 分钟过期（毫秒）
  enableStats: true    // 启用统计
});

// 设置和获取
cache.set('key', 'value');
const value = cache.get('key');

// 使用工厂函数模式
const result = await cache.getOrSet('key', async () => {
  return await expensiveOperation();
});

// 查看统计信息
const stats = cache.getStats();
console.log(`命中率: ${stats.hitRate * 100}%`);
```

### 模板匹配缓存

`TemplateStore` 自动缓存模板匹配结果。

#### 环境变量配置

```bash
# 启用/禁用模板缓存
TEMPLATE_CACHE_ENABLED=true

# 最大缓存条目数
TEMPLATE_CACHE_MAX_SIZE=100

# TTL（毫秒），不设置则永久缓存
TEMPLATE_CACHE_TTL=300000

# 启用统计信息
TEMPLATE_CACHE_STATS=true
```

#### 编程方式配置

```typescript
import { TemplateStore } from '@autodify/core';

const store = new TemplateStore({
  enableCache: true,
  cacheConfig: {
    maxSize: 100,
    ttl: 300000,  // 5 分钟
    enableStats: true
  }
});

// 查看缓存统计
const stats = store.getCacheStats();
console.log(stats);

// 清除缓存
store.clearCache();
```

### 节点注册表缓存

`getNodesByCategory()` 函数自动缓存查询结果。

#### 环境变量配置

```bash
# 启用/禁用节点缓存
NODE_CACHE_ENABLED=true

# 最大缓存条目数
NODE_CACHE_MAX_SIZE=50

# TTL（毫秒）
NODE_CACHE_TTL=

# 启用统计信息
NODE_CACHE_STATS=false
```

#### 使用示例

```typescript
import { getNodesByCategory, getNodeCacheStats, clearNodeCache } from '@autodify/core';

// 自动使用缓存
const llmNodes = getNodesByCategory('llm');

// 查看统计
const stats = getNodeCacheStats();

// 清除缓存
clearNodeCache();
```

## Server 层缓存

### HTTP 响应缓存

位置：`packages/server/src/routes/workflow.routes.ts`

GET `/api/templates` 端点实现了响应缓存和 ETag 支持。

#### 环境变量配置

```bash
# 启用/禁用缓存
CACHE_ENABLED=true

# 模板列表缓存 TTL（毫秒）
CACHE_TEMPLATES_TTL=300000  # 5 分钟

# 最大缓存条目数
CACHE_TEMPLATES_MAX_SIZE=50
```

#### 工作原理

1. **首次请求**：
   - 服务器获取模板列表
   - 生成 ETag（数据的 MD5 哈希）
   - 缓存响应数据和 ETag
   - 返回数据和 ETag 头

2. **后续请求**（缓存未过期）：
   - 检查客户端的 `If-None-Match` 头
   - 如果 ETag 匹配，返回 304 Not Modified
   - 如果 ETag 不匹配，返回缓存的数据

3. **缓存过期**：
   - 重新获取数据
   - 生成新的 ETag
   - 更新缓存

#### 客户端使用示例

```typescript
// 第一次请求
const response1 = await fetch('/api/templates');
const etag = response1.headers.get('etag');
const data1 = await response1.json();

// 后续请求（使用 ETag）
const response2 = await fetch('/api/templates', {
  headers: {
    'If-None-Match': etag
  }
});

if (response2.status === 304) {
  // 使用本地缓存的数据
  console.log('Data not modified, using cached version');
} else {
  // 使用新数据
  const data2 = await response2.json();
}
```

## 缓存配置最佳实践

### 开发环境

```bash
# 开发时建议禁用或使用较短的 TTL
CACHE_ENABLED=true
CACHE_TEMPLATES_TTL=30000    # 30 秒
TEMPLATE_CACHE_TTL=60000     # 1 分钟
NODE_CACHE_TTL=60000         # 1 分钟
```

### 生产环境

```bash
# 生产环境使用较长的 TTL
CACHE_ENABLED=true
CACHE_TEMPLATES_TTL=300000   # 5 分钟
TEMPLATE_CACHE_TTL=          # 永久缓存（模板很少变化）
NODE_CACHE_TTL=              # 永久缓存（节点定义不会变）
```

## 性能指标

启用缓存后的预期性能提升：

- **模板匹配**：90%+ 命中率，响应时间减少 80%
- **节点查询**：95%+ 命中率，响应时间减少 85%
- **HTTP 响应**：带宽节省 60%+（通过 304 响应）

## 监控和调试

### 查看缓存统计

```typescript
// Core 层
import { defaultTemplateStore, getNodeCacheStats } from '@autodify/core';

console.log('Template cache:', defaultTemplateStore.getCacheStats());
console.log('Node cache:', getNodeCacheStats());
```

### 清除缓存

```typescript
// 清除模板缓存
defaultTemplateStore.clearCache();

// 清除节点缓存
import { clearNodeCache } from '@autodify/core';
clearNodeCache();
```

### 禁用缓存（调试时）

```bash
# 完全禁用所有缓存
CACHE_ENABLED=false
TEMPLATE_CACHE_ENABLED=false
NODE_CACHE_ENABLED=false
```

## 常见问题

### Q: 缓存何时失效？

A:
- 达到 TTL 时间后自动失效
- 手动调用 `clear()` 或 `clearCache()`
- 修改数据源时（如注册新模板）

### Q: 如何确定合适的缓存大小？

A:
- 监控实际使用情况的统计数据
- 根据内存限制调整
- 通常默认值已足够

### Q: ETag 如何生成？

A: 使用响应数据的 MD5 哈希值作为 ETag，确保数据变化时 ETag 也会变化。

### Q: 缓存对内存的影响？

A:
- 每个缓存条目占用的内存取决于数据大小
- LRU 策略自动淘汰旧条目
- 可通过 `maxSize` 限制最大条目数

## 未来改进

- [ ] 支持 Redis 作为分布式缓存后端
- [ ] 添加缓存预热机制
- [ ] 实现更细粒度的缓存失效策略
- [ ] 添加 Prometheus 指标导出
