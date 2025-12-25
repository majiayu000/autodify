# 统一错误处理系统实现总结

## 概述

已成功为 `packages/server` 添加了完整的统一错误处理中间件系统，包括自定义错误类、Fastify 错误处理钩子和一致的错误响应格式。

## 新增文件

### 1. `/src/errors/custom-errors.ts`
定义了所有自定义错误类和错误码。

**主要内容：**
- `ErrorCode` 枚举：定义了所有错误码（验证错误、资源错误、业务错误、LLM错误等）
- `ErrorResponse` 接口：统一的错误响应格式
- `AppError` 基类：所有自定义错误的基类
- 具体错误类：
  - `ValidationError` (400) - 请求参数验证失败
  - `InvalidRequestError` (400) - 无效请求
  - `InvalidDSLError` (400) - 无效的 DSL 格式
  - `NotFoundError` (404) - 资源未找到
  - `UnauthorizedError` (401) - 未授权
  - `ForbiddenError` (403) - 禁止访问
  - `RateLimitError` (429) - 速率限制
  - `GenerationFailedError` (500) - 工作流生成失败
  - `RefinementFailedError` (500) - 工作流优化失败
  - `DSLValidationFailedError` (400) - DSL 验证失败
  - `LLMError` (502) - LLM 服务错误
  - `LLMTimeoutError` (504) - LLM 超时
  - `LLMRateLimitError` (429) - LLM 速率限制
  - `InternalError` (500) - 内部服务器错误

### 2. `/src/middleware/error-handler.ts`
Fastify 错误处理中间件和工具函数。

**主要内容：**
- `registerErrorHandler()`: 注册全局错误处理器
- `handleError()`: 统一处理不同类型的错误
- `logError()`: 根据错误类型记录日志
- `asyncHandler()`: 包装异步路由处理器（可选）
- `validateRequest()`: 验证请求的辅助函数

**特性：**
- 自动处理 `AppError`、`ZodError`、`FastifyError` 和标准 `Error`
- 开发环境包含完整堆栈信息
- 生产环境隐藏敏感信息
- 根据错误严重程度自动选择日志级别
- 通过 `onError` 钩子支持错误监控集成

### 3. `/ERROR_HANDLING.md`
完整的错误处理系统文档。

**包含内容：**
- 错误响应格式说明
- 所有自定义错误类的使用示例
- 错误码定义
- 在路由和服务中的使用方法
- 开发环境 vs 生产环境的差异
- 错误日志说明
- 最佳实践

### 4. `/src/examples/error-handling-example.ts`
错误处理系统的使用示例代码。

**包含示例：**
- 在路由中使用 `validateRequest` 进行验证
- 使用 `NotFoundError` 处理资源未找到
- 在服务层使用自定义错误类
- 错误转换和重新抛出
- 错误响应格式示例

### 5. `/IMPLEMENTATION_SUMMARY.md`
本文档，实现总结。

## 修改的文件

### 1. `/src/index.ts`
**修改内容：**
- 导入 `registerErrorHandler`
- 在创建 Fastify 实例后立即注册全局错误处理器

```typescript
import { registerErrorHandler } from './middleware/error-handler.js';

// 注册全局错误处理器
registerErrorHandler(fastify, { isDevelopment: config.nodeEnv === 'development' });
```

### 2. `/src/routes/workflow.routes.ts`
**修改内容：**
- 导入 `NotFoundError` 和 `validateRequest`
- 更新 `/api/templates/:id` 路由使用 `NotFoundError`

**修改前：**
```typescript
if (!dsl) {
  return reply.status(404).send({
    success: false,
    error: '模板不存在',
  });
}
```

**修改后：**
```typescript
if (!dsl) {
  throw new NotFoundError('模板不存在', 'template');
}
```

### 3. `/src/services/workflow.service.ts`
**修改内容：**
- 导入自定义错误类：`GenerationFailedError`, `RefinementFailedError`, `LLMError`, `InternalError`
- 更新 `generate()` 方法的错误处理
- 更新 `refine()` 方法的错误处理

**主要改进：**
- 生成失败时抛出 `GenerationFailedError`
- 优化失败时抛出 `RefinementFailedError`
- LLM 相关错误转换为 `LLMError`
- 其他未知错误转换为 `InternalError`
- 保留错误上下文信息（duration, model 等）

### 4. `/src/plugins/validator.plugin.ts`
**修改内容：**
- 导入 `ValidationError`
- 将验证失败时的直接响应改为抛出 `ValidationError`
- 让错误由统一的错误处理器处理

**修改前：**
```typescript
return reply.status(400).send({
  success: false,
  error: errorMessage,
  statusCode: 400,
  details: errors,
});
```

**修改后：**
```typescript
throw new ValidationError(errorMessage, { fields: errors });
```

## 统一错误响应格式

### 成功响应
```json
{
  "success": true,
  "dsl": { ... },
  "metadata": { ... }
}
```

### 错误响应（开发环境）
```json
{
  "success": false,
  "error": "工作流生成失败",
  "code": "GENERATION_FAILED",
  "statusCode": 500,
  "details": {
    "duration": 5000,
    "model": "gpt-4"
  },
  "stack": "Error: 工作流生成失败\n    at WorkflowService.generate (...)"
}
```

### 错误响应（生产环境）
```json
{
  "success": false,
  "error": "服务器内部错误",
  "code": "INTERNAL_ERROR",
  "statusCode": 500
}
```

## 主要特性

### 1. 统一的错误格式
所有错误响应都遵循相同的结构，便于前端处理。

### 2. 类型安全
使用 TypeScript 定义错误类型，提供完整的类型检查。

### 3. 环境感知
开发环境提供详细的调试信息，生产环境保护敏感信息。

### 4. 自动日志
根据错误类型和严重程度自动记录日志。

### 5. 错误分类
明确区分操作性错误（可预期）和编程错误（不可预期）。

### 6. 易于扩展
可以轻松添加新的错误类型。

### 7. 集成验证
与 Zod 验证库无缝集成。

## 使用示例

### 在路由中使用

```typescript
import { NotFoundError, validateRequest } from '../errors/custom-errors.js';

// 验证请求
fastify.post('/api/generate', async (request, reply) => {
  const data = validateRequest(GenerateRequestSchema, request.body);
  const result = await service.generate(data);
  return reply.send(result);
});

// 资源未找到
fastify.get('/api/templates/:id', async (request, reply) => {
  const template = await service.getTemplate(request.params.id);
  if (!template) {
    throw new NotFoundError('模板不存在', 'template');
  }
  return reply.send(template);
});
```

### 在服务层使用

```typescript
import { GenerationFailedError, LLMError, InternalError } from '../errors/custom-errors.js';

async generate(request: GenerateRequest) {
  try {
    const result = await this.orchestrator.generate(request);

    if (!result.success) {
      throw new GenerationFailedError('工作流生成失败', {
        duration: Date.now() - startTime,
        model,
      });
    }

    return result;
  } catch (error) {
    if (error instanceof GenerationFailedError) {
      throw error;
    }

    if (this.isLLMError(error)) {
      throw new LLMError('LLM 服务调用失败', { originalError: error.message });
    }

    throw new InternalError('服务内部错误', { originalError: error.message });
  }
}
```

## 测试建议

1. **单元测试**：测试每个错误类的创建和 `toResponse()` 方法
2. **集成测试**：测试错误处理器处理不同类型错误的行为
3. **端到端测试**：验证客户端收到的错误响应格式正确

## 未来改进建议

1. **错误监控集成**：
   - 集成 Sentry 或其他错误监控服务
   - 在 `onError` 钩子中上报错误

2. **错误追踪**：
   - 添加 Request ID 用于错误追踪
   - 关联日志和错误

3. **错误恢复**：
   - 为某些错误添加自动重试机制
   - 实现降级策略

4. **错误分析**：
   - 收集错误统计数据
   - 生成错误报告

5. **国际化**：
   - 支持多语言错误消息
   - 根据 Accept-Language 返回对应语言

## 总结

统一的错误处理系统已成功实现并集成到 `packages/server` 中。系统提供了：

- 一致的错误响应格式
- 完善的错误类型系统
- 自动错误日志记录
- 环境感知的错误信息
- 易于使用的 API

所有现有路由和服务已更新使用新的错误处理机制。系统设计灵活，易于扩展，为未来的功能开发提供了坚实的基础。
