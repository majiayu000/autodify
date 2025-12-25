# 错误处理系统文档

## 概述

Autodify Server 实现了统一的错误处理中间件，提供一致的错误响应格式和完善的错误类型系统。

## 错误响应格式

所有错误响应都遵循以下统一格式：

```typescript
{
  success: false,
  error: string,        // 错误消息
  code: string,         // 错误码
  statusCode: number,   // HTTP 状态码
  stack?: string,       // 堆栈信息（仅开发环境）
  details?: unknown     // 额外的错误详情
}
```

## 自定义错误类

### 基础错误类

#### AppError
所有自定义错误的基类。

```typescript
throw new AppError(
  '错误消息',
  ErrorCode.INTERNAL_ERROR,
  500,
  true,  // isOperational
  { /* 额外详情 */ }
);
```

### 验证错误 (400)

#### ValidationError
请求参数验证失败。

```typescript
throw new ValidationError('请求参数验证失败', {
  issues: [
    { path: 'email', message: '无效的邮箱格式' }
  ]
});
```

#### InvalidRequestError
无效的请求。

```typescript
throw new InvalidRequestError('缺少必需的参数');
```

#### InvalidDSLError
无效的 DSL 格式。

```typescript
throw new InvalidDSLError('DSL 格式不正确', {
  line: 10,
  column: 5
});
```

### 资源错误 (404)

#### NotFoundError
资源未找到。

```typescript
// 通用资源未找到
throw new NotFoundError('用户不存在');

// 模板未找到
throw new NotFoundError('模板不存在', 'template');
```

### 授权错误

#### UnauthorizedError (401)
未授权访问。

```typescript
throw new UnauthorizedError('请先登录');
```

#### ForbiddenError (403)
禁止访问。

```typescript
throw new ForbiddenError('无权访问此资源');
```

### 速率限制 (429)

#### RateLimitError
请求过于频繁。

```typescript
throw new RateLimitError('请求过于频繁，请稍后再试');
```

### 业务逻辑错误 (500)

#### GenerationFailedError
工作流生成失败。

```typescript
throw new GenerationFailedError('工作流生成失败', {
  duration: 5000,
  model: 'gpt-4'
});
```

#### RefinementFailedError
工作流优化失败。

```typescript
throw new RefinementFailedError('工作流优化失败');
```

### 外部服务错误

#### LLMError (502)
LLM 服务错误。

```typescript
throw new LLMError('LLM 服务调用失败', {
  provider: 'openai',
  model: 'gpt-4'
});
```

#### LLMTimeoutError (504)
LLM 服务超时。

```typescript
throw new LLMTimeoutError('LLM 服务响应超时');
```

#### LLMRateLimitError (429)
LLM 服务速率限制。

```typescript
throw new LLMRateLimitError('LLM 服务速率限制');
```

### 内部错误 (500)

#### InternalError
服务器内部错误。

```typescript
throw new InternalError('服务器内部错误', {
  originalError: error.message
});
```

## 错误码定义

```typescript
enum ErrorCode {
  // 通用错误 (1xxx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',

  // 验证错误 (2xxx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  INVALID_DSL = 'INVALID_DSL',

  // 资源错误 (3xxx)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',

  // 业务逻辑错误 (4xxx)
  GENERATION_FAILED = 'GENERATION_FAILED',
  REFINEMENT_FAILED = 'REFINEMENT_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',

  // 外部服务错误 (5xxx)
  LLM_ERROR = 'LLM_ERROR',
  LLM_TIMEOUT = 'LLM_TIMEOUT',
  LLM_RATE_LIMIT = 'LLM_RATE_LIMIT',

  // 认证授权错误 (6xxx)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // 速率限制 (7xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}
```

## 在路由中使用

### 使用 validateRequest 辅助函数

```typescript
import { validateRequest } from '../middleware/error-handler.js';
import { NotFoundError } from '../errors/custom-errors.js';

fastify.post('/api/generate', async (request, reply) => {
  // 自动验证并抛出 ValidationError
  const data = validateRequest(GenerateRequestSchema, request.body);

  // 业务逻辑
  const result = await service.generate(data);

  return reply.send(result);
});

fastify.get('/api/templates/:id', async (request, reply) => {
  const template = await service.getTemplate(request.params.id);

  if (!template) {
    throw new NotFoundError('模板不存在', 'template');
  }

  return reply.send(template);
});
```

### 使用 asyncHandler 包装器（可选）

```typescript
import { asyncHandler } from '../middleware/error-handler.js';

fastify.get('/api/resource', asyncHandler(async (request, reply) => {
  // 异步操作中的错误会被自动捕获
  const data = await someAsyncOperation();
  return reply.send(data);
}));
```

## 在服务层使用

```typescript
import {
  GenerationFailedError,
  LLMError,
  InternalError
} from '../errors/custom-errors.js';

export class WorkflowService {
  async generate(request: GenerateRequest) {
    try {
      const result = await this.orchestrator.generate(request);

      if (!result.success) {
        throw new GenerationFailedError('工作流生成失败', {
          reason: result.error
        });
      }

      return result;
    } catch (error) {
      // 重新抛出已知错误
      if (error instanceof GenerationFailedError) {
        throw error;
      }

      // 转换 LLM 错误
      if (isLLMError(error)) {
        throw new LLMError('LLM 服务调用失败', {
          originalError: error.message
        });
      }

      // 其他未知错误
      throw new InternalError('服务内部错误', {
        originalError: error instanceof Error ? error.message : '未知错误'
      });
    }
  }
}
```

## 开发环境 vs 生产环境

### 开发环境
- 错误响应包含完整的堆栈信息（`stack` 字段）
- 详细的错误日志
- 原始错误消息

### 生产环境
- 错误响应不包含堆栈信息
- 敏感错误信息被隐藏
- 统一的错误消息

配置通过环境变量 `NODE_ENV` 控制：
```bash
NODE_ENV=development  # 开发环境
NODE_ENV=production   # 生产环境
```

## 错误日志

错误处理中间件会自动记录错误日志，日志级别根据错误类型自动选择：

- **500+ 错误**: `error` 级别
- **400-499 错误**: `warn` 级别
- **操作性错误**: `info` 级别
- **未预期错误**: `error` 级别（包含完整堆栈）

## 示例响应

### 成功响应
```json
{
  "success": true,
  "dsl": { ... },
  "metadata": { ... }
}
```

### 验证错误响应 (400)
```json
{
  "success": false,
  "error": "请求参数验证失败",
  "code": "VALIDATION_ERROR",
  "statusCode": 400,
  "details": {
    "issues": [
      {
        "path": "prompt",
        "message": "请输入工作流描述"
      }
    ]
  }
}
```

### 资源未找到响应 (404)
```json
{
  "success": false,
  "error": "模板不存在",
  "code": "TEMPLATE_NOT_FOUND",
  "statusCode": 404
}
```

### 内部错误响应 (500) - 开发环境
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
  "stack": "Error: ...\n    at ..."
}
```

### 内部错误响应 (500) - 生产环境
```json
{
  "success": false,
  "error": "服务器内部错误",
  "code": "INTERNAL_ERROR",
  "statusCode": 500
}
```

## 最佳实践

1. **使用合适的错误类型**: 根据错误场景选择最合适的错误类。

2. **提供有用的错误消息**: 错误消息应该清晰、可操作。

3. **包含错误详情**: 在 `details` 中提供有助于调试的额外信息。

4. **不要暴露敏感信息**: 生产环境中避免泄露内部实现细节。

5. **正确区分操作性错误和编程错误**:
   - 操作性错误（如验证失败、资源未找到）应该使用自定义错误类
   - 编程错误（如空指针、类型错误）应该让其自然抛出并被统一处理

6. **保持一致性**: 所有 API 端点都使用统一的错误格式。

7. **记录错误**: 所有错误都会被自动记录，无需手动记录。
