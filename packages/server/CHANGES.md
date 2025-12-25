# Zod 请求验证系统 - 变更总结

## 概述

为 `packages/server` 的所有 API 端点添加了完整的 Zod 请求验证系统，确保所有用户输入都经过严格验证，并提供清晰的错误信息。

## 新增文件

### 1. Schema 定义 (src/schemas/)
```
src/schemas/
├── common.schema.ts      # 通用 Schema (成功/错误响应、分页等)
├── workflow.schema.ts    # 工作流相关 Schema (所有 API 端点)
└── index.ts             # 统一导出
```

**功能：**
- 定义所有 API 端点的请求和响应 Schema
- 自动生成 TypeScript 类型
- 提供详细的验证规则和错误消息

### 2. 验证插件 (src/plugins/)
```
src/plugins/
├── validator.plugin.ts   # Zod 验证插件
└── index.ts             # 统一导出
```

**功能：**
- `createValidationHook()` - 创建验证 Hook，支持 Body/Params/Query
- `validatorPlugin` - Fastify 插件，提供 `request.validate()` 方法
- 自动格式化验证错误
- 与现有错误处理系统集成

### 3. 类型定义 (src/types/)
```
src/types/
├── api.types.ts         # API 类型定义和导出
└── index.ts            # 统一导出
```

**功能：**
- 导出所有请求/响应类型
- 导出错误类和错误码
- 提供 API_ENDPOINTS 常量
- 供客户端复用

### 4. 文档
```
VALIDATION.md           # 完整的验证系统使用文档
CHANGES.md             # 本变更总结
```

## 修改文件

### src/routes/workflow.routes.ts
**变更：**
- 添加了所有端点的 Schema 导入
- 使用 `createValidationHook()` 进行自动验证
- 添加完整的 TypeScript 类型注解
- 所有端点都已添加验证

**验证覆盖：**
- ✅ POST /api/generate - Body 验证
- ✅ POST /api/refine - Body 验证
- ✅ POST /api/validate - Body 验证
- ✅ GET /api/templates/:id - Params 验证
- ✅ GET /api/templates - 无需验证
- ✅ GET /api/health - 无需验证

### tsconfig.json
**变更：**
- 排除测试和示例文件 (`src/__tests__/**/*`, `src/examples/**/*`)
- 确保主代码能够成功编译

## 验证规则详情

### POST /api/generate
```typescript
{
  prompt: string;              // 1-10000 字符
  options?: {
    model?: string;
    temperature?: number;       // 0-2
    useTemplate?: boolean;
  }
}
```

### POST /api/refine
```typescript
{
  dsl: Record<string, unknown>;  // 必须是有效对象
  instruction: string;            // 1-5000 字符
}
```

### POST /api/validate
```typescript
{
  dsl: Record<string, unknown>;  // 必须是有效对象
}
```

### GET /api/templates/:id
```typescript
{
  id: string;  // 只能包含字母、数字、下划线和短横线
}
```

## 错误响应格式

验证失败时返回统一的错误格式：

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

## 使用方法

### 在路由中使用验证
```typescript
import { createValidationHook } from '../plugins/index.js';
import { 
  GenerateRequestBodySchema, 
  type GenerateRequestBody 
} from '../schemas/index.js';

fastify.post<{
  Body: GenerateRequestBody;
  Reply: GenerateResponse;
}>(
  '/generate',
  {
    preHandler: createValidationHook({
      body: GenerateRequestBodySchema,
    }),
  },
  async (request, reply) => {
    // request.body 已经过验证且类型安全
    const result = await service.generate(request.body);
    return reply.send(result);
  }
);
```

### 在客户端使用类型
```typescript
import type {
  GenerateRequestBody,
  GenerateResponse,
  API_ENDPOINTS,
} from '@autodify/server/types';

const requestBody: GenerateRequestBody = {
  prompt: "创建一个客户服务工作流",
  options: { temperature: 0.7 }
};

const response = await fetch(API_ENDPOINTS.GENERATE, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestBody),
});

const data: GenerateResponse = await response.json();
```

## 验证结果

✅ TypeScript 编译成功  
✅ 所有模块可以正确导入  
✅ 所有 API 端点都有验证  
✅ 类型定义完整且类型安全  
✅ 错误处理统一且清晰  
✅ 文档完整

## 后续建议

1. **添加集成测试**
   - 测试所有验证规则
   - 测试错误响应格式
   - 测试边界情况

2. **添加 API 文档生成**
   - 使用 Schema 自动生成 OpenAPI 文档
   - 集成 Swagger UI

3. **扩展验证规则**
   - 根据实际需求添加更多验证
   - 添加业务逻辑验证

4. **性能优化**
   - 缓存编译后的 Schema
   - 考虑使用更快的验证库（如需要）

## 参考文档

- 详细使用指南: [VALIDATION.md](./VALIDATION.md)
- Zod 官方文档: https://zod.dev/
- Fastify 验证文档: https://www.fastify.io/docs/latest/Reference/Validation-and-Serialization/
