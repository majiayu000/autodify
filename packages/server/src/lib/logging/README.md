# 结构化日志系统

基于 Pino 的高性能结构化日志系统，遵循最佳实践设计。

## 特性

- ✅ 结构化 JSON 日志输出
- ✅ 自动请求追踪（Request ID、Trace ID）
- ✅ 请求/响应日志中间件
- ✅ 自动记录耗时、状态码
- ✅ 敏感数据自动脱敏
- ✅ 开发环境美化输出
- ✅ 生产环境 JSON 输出
- ✅ 慢请求自动告警

## 快速开始

### 1. 初始化日志系统

在应用启动时（`src/index.ts`）初始化：

```typescript
import { initializeLogging } from './lib/logging/index.js';

const logger = initializeLogging({
  service: 'autodify-server',
  level: 'info',
  environment: 'production',
  pretty: false, // 开发环境设为 true
});
```

### 2. 注册请求日志中间件

```typescript
import { requestLoggingPlugin } from './lib/logging/index.js';

await fastify.register(requestLoggingPlugin, {
  excludePaths: ['/health', '/metrics'], // 排除不需要记录的路径
  slowRequestThreshold: 1000, // 慢请求阈值（毫秒）
});
```

### 3. 在业务代码中使用

```typescript
import { getLogger } from '@/lib/logging';

const logger = getLogger();

// 基础日志
logger.info('User logged in');

// 带结构化数据的日志
logger.info({ user_id: '123', action: 'login' }, 'User logged in successfully');

// 错误日志
logger.error({ err: error, user_id: '123' }, 'Failed to process request');

// 警告日志
logger.warn({ cache_hit_rate: 0.3 }, 'Cache hit rate is low');
```

### 4. 创建子 Logger（带上下文）

```typescript
import { createChildLogger } from '@/lib/logging';

// 创建带有固定上下文的子 logger
const serviceLogger = createChildLogger({ service_name: 'workflow-service' });

serviceLogger.info({ workflow_id: 'wf_123' }, 'Workflow started');
// 输出: { service_name: 'workflow-service', workflow_id: 'wf_123', message: 'Workflow started', ... }
```

### 5. 记录错误

```typescript
import { logError } from '@/lib/logging';

try {
  // some code
} catch (error) {
  logError(error, 'Operation failed', { operation: 'generate-workflow', user_id: '123' });
}
```

## 日志字段规范

### 必需字段（Tier 1）

- `timestamp` - ISO 8601 时间戳
- `level` - 日志级别（FATAL, ERROR, WARN, INFO, DEBUG, TRACE）
- `message` - 人类可读的消息
- `service` - 服务名称

### 追踪字段（Tier 2）

- `request_id` - 请求 ID（自动生成）
- `trace_id` - 追踪 ID（用于分布式追踪）
- `span_id` - Span ID

### 上下文字段（Tier 3）

- `http_method` - HTTP 方法
- `http_path` - 请求路径
- `http_status` - HTTP 状态码
- `duration_ms` - 耗时（毫秒）
- `user_id` - 用户 ID
- `error_message` - 错误消息
- `error_stack` - 错误堆栈

## 日志级别使用指南

| 级别    | 何时使用                         | 生产环境 | 告警 |
| ------- | -------------------------------- | -------- | ---- |
| `fatal` | 应用无法继续运行                 | ✅       | 立即 |
| `error` | 需要关注的失败                   | ✅       | 是   |
| `warn`  | 异常但可恢复的情况               | ✅       | 可选 |
| `info`  | 正常的业务操作里程碑             | ✅       | 否   |
| `debug` | 开发诊断信息                     | ❌       | 否   |
| `trace` | 详细的调试跟踪                   | ❌       | 否   |
| `silent`| 禁用所有日志                     | -        | -    |

## 最佳实践

### ✅ DO

```typescript
// 使用结构化数据
logger.info({ order_id: 'ord_123', amount: 99.99 }, 'Order created');

// 包含相关 ID
logger.info({ trace_id, user_id, order_id }, 'Processing payment');

// 在边界记录日志
logger.info({ method: 'POST', path: '/orders' }, 'API request received');
logger.info({ status: 201, duration_ms: 145 }, 'API response sent');
```

### ❌ DON'T

```typescript
// 字符串拼接（无法查询）
logger.info(`User ${userId} created order ${orderId}`);

// 记录敏感数据
logger.info({ password: '...', credit_card: '...' }, 'Login');

// 错误的日志级别
logger.error('Cache miss'); // 应该是 DEBUG
logger.debug('Payment failed'); // 应该是 ERROR

// 缺少上下文
logger.error('Something went wrong'); // 什么？哪里？为什么？
```

## 敏感数据脱敏

以下字段会自动脱敏：

- `password`
- `token`
- `apiKey`、`api_key`
- `secret`
- `authorization`
- `cookie`
- `creditCard`
- `ssn`

脱敏后显示为：`***REDACTED***`

## 请求日志示例

### 成功请求

```json
{
  "timestamp": "2025-12-25T10:30:00.123Z",
  "level": "INFO",
  "service": "autodify-server",
  "request_id": "req_abc123",
  "trace_id": "7b2e4f1a9c3d8e5b",
  "http_method": "POST",
  "http_path": "/api/generate",
  "http_status": 200,
  "duration_ms": 145,
  "message": "← POST /api/generate 200 - 145ms"
}
```

### 慢请求告警

```json
{
  "timestamp": "2025-12-25T10:30:00.123Z",
  "level": "WARN",
  "service": "autodify-server",
  "request_id": "req_def456",
  "slow_request": true,
  "duration_ms": 2500,
  "message": "← POST /api/generate 200 - 2500ms (SLOW)"
}
```

### 错误请求

```json
{
  "timestamp": "2025-12-25T10:30:00.123Z",
  "level": "ERROR",
  "service": "autodify-server",
  "request_id": "req_ghi789",
  "http_status": 500,
  "err": {
    "type": "InternalError",
    "message": "Database connection failed",
    "stack": "..."
  },
  "message": "✗ POST /api/generate - Error: Database connection failed"
}
```

## 环境配置

### 开发环境

```typescript
initializeLogging({
  service: 'autodify-server',
  level: 'debug',
  environment: 'development',
  pretty: true, // 彩色美化输出
});
```

### 生产环境

```typescript
initializeLogging({
  service: 'autodify-server',
  level: 'info',
  environment: 'production',
  pretty: false, // JSON 输出
});
```

## 集成日志聚合服务

生产环境的 JSON 日志可以直接发送到：

- **ELK Stack** (Elasticsearch + Logstash + Kibana)
- **Loki** (Grafana Loki)
- **Datadog**
- **CloudWatch**
- **Google Cloud Logging**

只需配置 stdout 收集即可，无需修改代码。

## API 参考

### initializeLogging(config)

初始化全局日志系统。

```typescript
interface LoggingConfig {
  service: string; // 服务名称
  level: LogLevel; // 日志级别
  environment: 'development' | 'production' | 'test';
  pretty?: boolean; // 是否美化输出
  redactPaths?: string[]; // 需要脱敏的字段路径
}
```

### getLogger()

获取全局 Logger 实例。

```typescript
const logger = getLogger();
logger.info('Message');
```

### createChildLogger(context)

创建带上下文的子 Logger。

```typescript
const logger = createChildLogger({ user_id: '123' });
```

### logError(error, message, context?)

记录错误的辅助函数。

```typescript
logError(error, 'Operation failed', { operation: 'generate' });
```

### requestLoggingPlugin

Fastify 请求日志插件。

```typescript
interface RequestLoggingOptions {
  logBody?: boolean; // 是否记录请求体
  logResponse?: boolean; // 是否记录响应体
  excludePaths?: string[]; // 排除的路径
  slowRequestThreshold?: number; // 慢请求阈值（ms）
}
```

## 故障排查

### Logger 未初始化错误

```
Error: Logger not initialized. Call initializeLogging() first.
```

**解决方案**：在 `src/index.ts` 的最开始调用 `initializeLogging()`。

### 日志没有输出

1. 检查日志级别配置
2. 检查 `NODE_ENV` 环境变量
3. 确认 stdout 没有被重定向

### 性能问题

Pino 是最快的 Node.js 日志库之一。如果遇到性能问题：

1. 降低日志级别（info -> warn）
2. 减少不必要的字段
3. 考虑使用 `pino.extreme()` 异步写入

## 更多资源

- [Pino 官方文档](https://getpino.io/)
- [结构化日志最佳实践](https://betterstack.com/community/guides/logging/log-formatting/)
- [OpenTelemetry 追踪标准](https://opentelemetry.io/docs/concepts/signals/traces/)
