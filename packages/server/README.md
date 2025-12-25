# Autodify Server

Autodify 后端 API 服务，提供 Dify 工作流 DSL 生成、优化和验证功能。

## 技术栈

- **Node.js** + **TypeScript**
- **Fastify** - 高性能 Web 框架
- **Zod** - 请求验证
- **LiteLLM** - LLM 服务集成
- **Vitest** - 测试框架

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发命令

```bash
# 开发模式（热重载）
npm run dev

# 构建
npm run build

# 生产环境运行
npm run start

# 代码检查
npm run lint

# 运行测试
npm run test

# 测试覆盖率
npm run test:coverage
```

### 环境变量

创建 `.env` 文件：

```bash
# 服务器配置
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# LiteLLM 配置
LITELLM_BASE_URL=http://localhost:4000
LITELLM_API_KEY=your-api-key

# 日志配置
LOG_LEVEL=info
```

## API 端点

### 工作流生成

**POST** `/api/generate`

根据用户描述生成 Dify 工作流 DSL。

**请求体：**
```json
{
  "prompt": "创建一个客户服务工作流",
  "options": {
    "model": "gpt-4",
    "temperature": 0.7,
    "useTemplate": false
  }
}
```

**响应：**
```json
{
  "success": true,
  "dsl": { ... },
  "yaml": "...",
  "metadata": {
    "duration": 1234,
    "model": "gpt-4",
    "tokens": { "input": 100, "output": 500 },
    "templateUsed": null,
    "confidence": 0.95
  }
}
```

### 工作流优化

**POST** `/api/refine`

根据用户指令优化现有的工作流 DSL。

**请求体：**
```json
{
  "dsl": { ... },
  "instruction": "添加错误处理节点"
}
```

### 工作流验证

**POST** `/api/validate`

验证工作流 DSL 的有效性。

**请求体：**
```json
{
  "dsl": { ... }
}
```

**响应：**
```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

### 模板管理

**GET** `/api/templates`

获取所有可用的工作流模板列表。

**GET** `/api/templates/:id`

获取指定模板的 DSL 内容。

**参数：**
- `id`: 模板 ID（字母、数字、下划线、短横线）

### 健康检查

**GET** `/api/health`

检查服务健康状态。

## 请求验证

所有 API 端点使用 Zod 进行严格的请求验证。

### 验证规则

#### POST /api/generate
- `prompt`: 1-10000 字符
- `options.temperature`: 0-2
- `options.model`: 可选字符串
- `options.useTemplate`: 可选布尔值

#### POST /api/refine
- `dsl`: 有效的对象
- `instruction`: 1-5000 字符

#### POST /api/validate
- `dsl`: 有效的对象

#### GET /api/templates/:id
- `id`: 只能包含字母、数字、下划线和短横线

### 验证错误响应

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
    }
  ]
}
```

## 错误处理

服务实现了统一的错误处理中间件，所有错误响应遵循一致的格式。

### 错误响应格式

```json
{
  "success": false,
  "error": "错误消息",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "details": { ... },
  "stack": "..." // 仅开发环境
}
```

### 常见错误码

| 错误码 | 描述 | HTTP 状态码 |
|--------|------|-------------|
| `VALIDATION_ERROR` | 请求参数验证失败 | 400 |
| `INVALID_DSL` | 无效的 DSL 格式 | 400 |
| `NOT_FOUND` | 资源未找到 | 404 |
| `TEMPLATE_NOT_FOUND` | 模板未找到 | 404 |
| `GENERATION_FAILED` | 工作流生成失败 | 500 |
| `REFINEMENT_FAILED` | 工作流优化失败 | 500 |
| `LLM_ERROR` | LLM 服务错误 | 502 |
| `LLM_TIMEOUT` | LLM 服务超时 | 504 |
| `RATE_LIMIT_EXCEEDED` | 请求频率超限 | 429 |
| `INTERNAL_ERROR` | 服务器内部错误 | 500 |

### 错误处理示例

```typescript
import { NotFoundError, ValidationError } from './errors/custom-errors.js';

// 资源未找到
if (!template) {
  throw new NotFoundError('模板不存在', 'template');
}

// 验证失败
if (!isValid) {
  throw new ValidationError('请求参数验证失败', { issues: [...] });
}
```

## 项目结构

```
src/
├── config/              # 配置文件
│   └── index.ts
├── core/                # 核心业务逻辑
│   ├── dsl/            # DSL 生成和处理
│   ├── llm/            # LLM 服务集成
│   └── templates/      # 工作流模板
├── errors/              # 自定义错误类
│   └── custom-errors.ts
├── middleware/          # 中间件
│   └── error-handler.ts
├── plugins/             # Fastify 插件
│   ├── validator.plugin.ts
│   └── index.ts
├── routes/              # API 路由
│   └── workflow.routes.ts
├── schemas/             # Zod Schema 定义
│   ├── common.schema.ts
│   ├── workflow.schema.ts
│   └── index.ts
├── services/            # 业务服务层
│   └── workflow.service.ts
├── types/               # TypeScript 类型定义
│   ├── api.types.ts
│   └── index.ts
└── index.ts             # 入口文件
```

## 开发指南

### 添加新的 API 端点

1. 在 `src/schemas/` 中定义请求和响应 Schema
2. 在 `src/routes/` 中添加路由
3. 使用 `createValidationHook()` 进行请求验证
4. 在服务层实现业务逻辑
5. 使用自定义错误类处理错误

### 请求验证最佳实践

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
    // request.body 已经过验证且类型安全
    const result = await service.process(request.body);
    return reply.send(result);
  }
);
```

### 错误处理最佳实践

```typescript
import { GenerationFailedError, LLMError, InternalError } from '../errors/custom-errors.js';

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
  if (this.isLLMError(error)) {
    throw new LLMError('LLM 服务调用失败', {
      originalError: error.message
    });
  }

  // 其他未知错误
  throw new InternalError('服务内部错误', {
    originalError: error instanceof Error ? error.message : '未知错误'
  });
}
```

## 测试

```bash
# 运行所有测试
npm run test

# 监听模式
npm run test:watch

# 测试覆盖率
npm run test:coverage
```

## License

MIT
