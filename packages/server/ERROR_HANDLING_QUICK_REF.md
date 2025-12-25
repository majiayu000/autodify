# 错误处理快速参考

## 导入错误类

```typescript
import {
  ValidationError,       // 400 - 验证错误
  InvalidRequestError,   // 400 - 无效请求
  InvalidDSLError,       // 400 - 无效 DSL
  NotFoundError,         // 404 - 资源未找到
  UnauthorizedError,     // 401 - 未授权
  ForbiddenError,        // 403 - 禁止访问
  RateLimitError,        // 429 - 速率限制
  GenerationFailedError, // 500 - 生成失败
  RefinementFailedError, // 500 - 优化失败
  LLMError,              // 502 - LLM 错误
  LLMTimeoutError,       // 504 - LLM 超时
  InternalError,         // 500 - 内部错误
} from '../errors/custom-errors.js';
```

## 常用场景

### 1. 验证请求参数
```typescript
import { validateRequest } from '../middleware/error-handler.js';

const data = validateRequest(MySchema, request.body);
// 自动抛出 ValidationError 如果验证失败
```

### 2. 资源未找到
```typescript
if (!resource) {
  throw new NotFoundError('资源不存在');
}
```

### 3. 工作流生成失败
```typescript
if (!result.success) {
  throw new GenerationFailedError('生成失败', { reason: result.error });
}
```

### 4. LLM 服务错误
```typescript
catch (error) {
  if (isLLMError(error)) {
    throw new LLMError('LLM 调用失败', { originalError: error.message });
  }
}
```

### 5. 未知错误
```typescript
catch (error) {
  throw new InternalError('内部错误', {
    originalError: error instanceof Error ? error.message : '未知错误'
  });
}
```

## 错误响应格式

```typescript
{
  success: false,
  error: string,        // 错误消息
  code: string,         // 错误码（如 "VALIDATION_ERROR"）
  statusCode: number,   // HTTP 状态码
  stack?: string,       // 堆栈（仅开发环境）
  details?: unknown     // 额外详情
}
```

## 常用错误码

| 错误码 | 描述 | HTTP 状态码 |
|--------|------|-------------|
| `VALIDATION_ERROR` | 验证失败 | 400 |
| `NOT_FOUND` | 资源未找到 | 404 |
| `TEMPLATE_NOT_FOUND` | 模板未找到 | 404 |
| `GENERATION_FAILED` | 生成失败 | 500 |
| `REFINEMENT_FAILED` | 优化失败 | 500 |
| `LLM_ERROR` | LLM 错误 | 502 |
| `LLM_TIMEOUT` | LLM 超时 | 504 |
| `INTERNAL_ERROR` | 内部错误 | 500 |

## 最佳实践

1. 使用合适的错误类型
2. 提供清晰的错误消息
3. 在 details 中包含调试信息
4. 不要在生产环境暴露敏感信息
5. 重新抛出已知错误，转换未知错误

## 完整文档

详细信息请参考 `ERROR_HANDLING.md`
