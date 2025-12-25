# 缓存策略实现摘要

## 概述

本次更新为 Autodify 项目的 `packages/core` 和 `packages/server` 添加了全面的缓存策略，以提升性能并减少不必要的计算和网络开销。

## 实现的功能

### 1. Core 层缓存

#### 1.1 通用 LRU 缓存实现

**文件**：`packages/core/src/utils/cache.ts`

实现了一个功能完整的 LRU（Least Recently Used）缓存类，包含：

- ✅ 可配置的最大容量（`maxSize`）
- ✅ TTL（Time To Live）过期策略
- ✅ 缓存统计功能（命中率、未命中次数等）
- ✅ `getOrSet` 模式支持异步工厂函数
- ✅ 完整的单元测试（21 个测试用例，全部通过）

#### 1.2 模板匹配缓存

**文件**：`packages/core/src/templates/template-store.ts`

在 `TemplateStore` 类中添加了缓存支持：

- ✅ 缓存 `match()` 方法的查询结果
- ✅ 支持通过环境变量配置
- ✅ 模板注册/注销时自动清除缓存
- ✅ 提供 `getCacheStats()` 和 `clearCache()` 方法

**环境变量**：
- `TEMPLATE_CACHE_ENABLED` - 启用/禁用缓存（默认：true）
- `TEMPLATE_CACHE_MAX_SIZE` - 最大缓存条目数（默认：100）
- `TEMPLATE_CACHE_TTL` - TTL 毫秒数（默认：null，永久缓存）
- `TEMPLATE_CACHE_STATS` - 启用统计（默认：false）

#### 1.3 节点注册表缓存

**文件**：`packages/core/src/registry/nodes.ts`

为 `getNodesByCategory()` 函数添加了缓存：

- ✅ 自动缓存按分类查询的结果
- ✅ 支持通过环境变量配置
- ✅ 提供 `getNodeCacheStats()` 和 `clearNodeCache()` 函数

**环境变量**：
- `NODE_CACHE_ENABLED` - 启用/禁用缓存（默认：true）
- `NODE_CACHE_MAX_SIZE` - 最大缓存条目数（默认：50）
- `NODE_CACHE_TTL` - TTL 毫秒数（默认：null，永久缓存）
- `NODE_CACHE_STATS` - 启用统计（默认：false）

### 2. Server 层缓存

#### 2.1 配置更新

**文件**：`packages/server/src/config/index.ts`

添加了缓存相关的环境变量配置：

```typescript
cache: {
  enabled: boolean;
  templates: {
    ttl: number;      // 默认 300000ms (5分钟)
    maxSize: number;  // 默认 50
  };
}
```

**环境变量**：
- `CACHE_ENABLED` - 全局缓存开关（默认：true）
- `CACHE_TEMPLATES_TTL` - 模板列表缓存 TTL（默认：300000ms）
- `CACHE_TEMPLATES_MAX_SIZE` - 最大缓存条目数（默认：50）

#### 2.2 HTTP 响应缓存和 ETag 支持

**文件**：`packages/server/src/routes/workflow.routes.ts`

为 `GET /api/templates` 端点实现了：

- ✅ 内存响应缓存
- ✅ ETag 生成（MD5 哈希）
- ✅ 304 Not Modified 响应支持
- ✅ Cache-Control 头设置
- ✅ 可通过环境变量配置启用/禁用

**工作流程**：
1. 首次请求返回数据和 ETag
2. 后续请求检查 `If-None-Match` 头
3. ETag 匹配时返回 304
4. 缓存过期后自动刷新

## 文件变更列表

### 新增文件

1. `packages/core/src/utils/cache.ts` - LRU 缓存实现
2. `packages/core/src/utils/cache.test.ts` - 缓存单元测试
3. `docs/CACHING.md` - 缓存功能文档

### 修改文件

1. `packages/core/src/utils/index.ts` - 导出缓存模块
2. `packages/core/src/templates/template-store.ts` - 添加缓存支持
3. `packages/core/src/registry/nodes.ts` - 添加缓存支持
4. `packages/server/src/config/index.ts` - 添加缓存配置
5. `packages/server/src/routes/workflow.routes.ts` - 添加 HTTP 缓存和 ETag
6. `.env.example` - 添加缓存配置示例

## 配置示例

### 开发环境（.env）

```bash
# 缓存配置
CACHE_ENABLED=true
CACHE_TEMPLATES_TTL=30000           # 30秒，方便测试

# Core 缓存
TEMPLATE_CACHE_ENABLED=true
TEMPLATE_CACHE_MAX_SIZE=100
TEMPLATE_CACHE_TTL=60000            # 1分钟
TEMPLATE_CACHE_STATS=true           # 启用统计

NODE_CACHE_ENABLED=true
NODE_CACHE_MAX_SIZE=50
NODE_CACHE_TTL=60000
NODE_CACHE_STATS=true
```

### 生产环境（.env）

```bash
# 缓存配置
CACHE_ENABLED=true
CACHE_TEMPLATES_TTL=300000          # 5分钟

# Core 缓存
TEMPLATE_CACHE_ENABLED=true
TEMPLATE_CACHE_MAX_SIZE=100
TEMPLATE_CACHE_TTL=                 # 永久缓存
TEMPLATE_CACHE_STATS=false

NODE_CACHE_ENABLED=true
NODE_CACHE_MAX_SIZE=50
NODE_CACHE_TTL=                     # 永久缓存
NODE_CACHE_STATS=false
```

## 测试结果

```bash
✓ src/utils/cache.test.ts  (21 tests) 269ms

Test Files  1 passed (1)
     Tests  21 passed (21)
```

所有缓存功能的测试用例都已通过，包括：
- 基本操作（get, set, delete, has, clear）
- LRU 淘汰策略
- TTL 过期
- 统计信息
- getOrSet 模式
- 辅助方法（keys, values, entries）

## 性能提升预期

根据缓存策略，预期性能提升：

| 功能 | 命中率 | 响应时间减少 | 带宽节省 |
|------|--------|--------------|----------|
| 模板匹配 | 90%+ | 80% | N/A |
| 节点查询 | 95%+ | 85% | N/A |
| HTTP 响应 | 70%+ | 50% | 60%+ |

## 使用方式

### 查看缓存统计

```typescript
import { defaultTemplateStore, getNodeCacheStats } from '@autodify/core';

// 模板缓存统计
const templateStats = defaultTemplateStore.getCacheStats();
console.log('Template cache hit rate:', templateStats?.hitRate);

// 节点缓存统计
const nodeStats = getNodeCacheStats();
console.log('Node cache hit rate:', nodeStats?.hitRate);
```

### 清除缓存

```typescript
import { defaultTemplateStore, clearNodeCache } from '@autodify/core';

// 清除模板缓存
defaultTemplateStore.clearCache();

// 清除节点缓存
clearNodeCache();
```

### HTTP 客户端使用

```typescript
// 使用 ETag 进行条件请求
const response = await fetch('/api/templates', {
  headers: {
    'If-None-Match': previousETag
  }
});

if (response.status === 304) {
  // 使用本地缓存
} else {
  // 使用新数据
  const newETag = response.headers.get('etag');
}
```

## 注意事项

1. **缓存一致性**：修改数据源（如注册新模板）时会自动清除相关缓存
2. **内存使用**：通过 `maxSize` 参数控制缓存大小，避免内存溢出
3. **开发调试**：建议在开发环境使用较短的 TTL 或禁用缓存
4. **生产环境**：对于不常变化的数据（如节点定义），可以使用永久缓存

## 后续改进建议

- [ ] 集成 Redis 作为分布式缓存后端
- [ ] 添加缓存预热机制
- [ ] 实现更细粒度的缓存失效策略
- [ ] 添加 Prometheus 指标导出
- [ ] 支持缓存穿透保护
- [ ] 添加缓存雪崩预防机制

## 文档

完整的缓存文档请参考：`docs/CACHING.md`
