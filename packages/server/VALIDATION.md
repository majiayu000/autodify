# API 请求验证系统

本项目使用 Zod 进行完整的 API 请求和响应验证，确保所有用户输入都经过严格的类型检查和验证。

## 目录结构

```
src/
├── schemas/              # Schema 定义
│   ├── common.schema.ts     # 通用 Schema（分页、错误响应等）
│   ├── workflow.schema.ts   # 工作流相关 Schema
│   └── index.ts             # Schema 统一导出
├── plugins/              # Fastify 插件
│   ├── validator.plugin.ts  # Zod 验证插件
│   └── index.ts             # 插件统一导出
├── types/                # 类型定义
│   ├── api.types.ts         # API 类型定义
│   └── index.ts             # 类型统一导出
├── errors/               # 自定义错误
│   └── custom-errors.ts     # 错误类定义
└── middleware/           # 中间件
    └── error-handler.ts     # 错误处理中间件
```

## 功能特性

### 1. 完整的 Schema 定义

所有 API 端点都有明确的请求和响应 Schema：

- **请求验证**：Body、Params、Query
- **响应验证**：统一的响应格式
- **类型安全**：自动推导 TypeScript 类型

### 2. 验证方式

#### 方式一：使用 preHandler Hook（推荐）

```typescript
import { createValidationHook } from '../plugins/index.js';
import { GenerateRequestBodySchema } from '../schemas/index.js';

fastify.post<{
  Body: GenerateRequestBody;
  Reply: GenerateResponse;
}>(
  '/generate',
  {
    preHandler: createValidationHook({
      body: GenerateRequestBodySchema,
      query: SomeQuerySchema,      // 可选
      params: SomeParamsSchema,     // 可选
    }),
  },
  async (request, reply) => {
    // request.body 已经过验证且类型安全
    const result = await service.generate(request.body);
    return reply.send(result);
  }
);
```

#### 方式二：手动验证（不推荐）

```typescript
import { request.validate } from 'fastify';

// 在路由处理器中手动验证
const data = request.validate(SomeSchema, request.body);
```

### 3. 错误处理

验证失败时自动返回统一的错误格式：

```json
{
  "success": false,
  "error": "验证失败: 2 个字段存在错误",
  "statusCode": 400,
  "details": [
    {
      "field": "prompt",
      "message": "请输入工作流描述",
      "code": "too_small"
    },
    {
      "field": "options.temperature",
      "message": "温度参数不能大于 2",
      "code": "too_big"
    }
  ]
}
```

### 4. 类型导出

所有类型都可以从 `types/index.ts` 导出，供客户端使用：

```typescript
import type {
  GenerateRequestBody,
  GenerateResponse,
  ErrorResponse,
  ValidationError,
  API_ENDPOINTS,
} from '@autodify/server/types';

// 使用类型安全的 API 客户端
const response = await fetch(API_ENDPOINTS.GENERATE, {
  method: 'POST',
  body: JSON.stringify(requestBody),
});
const data: GenerateResponse = await response.json();
```

## API 端点验证详情

### POST /api/generate

**请求 Body:**
```typescript
{
  prompt: string;        // 1-10000 字符
  options?: {
    model?: string;
    temperature?: number;  // 0-2
    useTemplate?: boolean;
  };
}
```

**响应:**
```typescript
{
  success: boolean;
  dsl?: Record<string, unknown>;
  yaml?: string;
  error?: string;
  metadata?: {
    duration: number;
    model: string;
    tokens?: { input: number; output: number };
    templateUsed?: string | null;
    confidence?: number;
  };
}
```

### POST /api/refine

**请求 Body:**
```typescript
{
  dsl: Record<string, unknown>;  // 有效的对象
  instruction: string;            // 1-5000 字符
}
```

### POST /api/validate

**请求 Body:**
```typescript
{
  dsl: Record<string, unknown>;  // 有效的对象
}
```

**响应:**
```typescript
{
  valid: boolean;
  errors: Array<{
    code: string;
    message: string;
    path?: string;
  }>;
  warnings: Array<{
    code: string;
    message: string;
    path?: string;
  }>;
}
```

### GET /api/templates/:id

**路径参数:**
```typescript
{
  id: string;  // 只能包含字母、数字、下划线和短横线
}
```

## 自定义验证规则

### 添加新的 Schema

1. 在 `schemas/workflow.schema.ts` 中定义 Schema：

```typescript
export const MyRequestSchema = z.object({
  field1: z.string().min(1),
  field2: z.number().positive(),
  field3: z.enum(['option1', 'option2']),
});

export type MyRequest = z.infer<typeof MyRequestSchema>;
```

2. 在路由中使用：

```typescript
import { createValidationHook } from '../plugins/index.js';
import { MyRequestSchema, type MyRequest } from '../schemas/index.js';

fastify.post<{ Body: MyRequest }>(
  '/my-endpoint',
  {
    preHandler: createValidationHook({
      body: MyRequestSchema,
    }),
  },
  async (request, reply) => {
    // request.body 已验证
  }
);
```

### 自定义错误信息

```typescript
const MySchema = z.object({
  email: z.string()
    .email('请输入有效的邮箱地址')
    .min(1, '邮箱不能为空'),
  age: z.number()
    .int('年龄必须是整数')
    .positive('年龄必须大于 0')
    .max(150, '年龄不能超过 150'),
});
```

### 复杂验证规则

```typescript
const MySchema = z.object({
  password: z.string()
    .min(8, '密码至少 8 个字符')
    .regex(/[A-Z]/, '密码必须包含大写字母')
    .regex(/[a-z]/, '密码必须包含小写字母')
    .regex(/[0-9]/, '密码必须包含数字'),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: '两次密码输入不一致',
    path: ['confirmPassword'],
  }
);
```

## 最佳实践

1. **始终使用 preHandler Hook 进行验证**
   - 自动处理错误
   - 类型安全
   - 代码简洁

2. **定义清晰的错误消息**
   - 使用中文描述
   - 提供具体的修复建议
   - 包含字段名称

3. **响应 Schema 用于文档**
   - 虽然不强制验证响应
   - 但提供了类型定义
   - 便于 API 文档生成

4. **类型导出给客户端**
   - 共享类型定义
   - 避免类型不一致
   - 提高开发效率

5. **避免过度验证**
   - 只验证必要的字段
   - 允许额外字段（使用 `.passthrough()` 或 `.strip()`）
   - 平衡安全性和灵活性

## 测试验证

```bash
# 编译检查
npm run build

# 运行服务器
npm run dev

# 测试 API（使用 curl 或 Postman）
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "创建一个客户服务工作流",
    "options": {
      "temperature": 0.7
    }
  }'
```

## 参考资料

- [Zod 文档](https://zod.dev/)
- [Fastify 验证](https://www.fastify.io/docs/latest/Reference/Validation-and-Serialization/)
- [TypeScript 类型推导](https://www.typescriptlang.org/docs/handbook/type-inference.html)
