# Autodify API 文档

## Swagger UI

本项目已集成 OpenAPI 3.0 (Swagger) 文档，提供交互式 API 文档界面。

### 访问方式

启动服务器后，访问以下地址查看 API 文档：

- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI JSON**: http://localhost:3000/docs/json
- **OpenAPI YAML**: http://localhost:3000/docs/yaml

### 功能特性

- **完整的 API 端点文档**：所有端点都包含详细的描述、参数说明和示例
- **请求/响应 Schema**：基于 Zod schema 自动生成 JSON Schema
- **交互式测试**：直接在浏览器中测试 API 端点
- **请求示例**：每个端点都包含真实的请求和响应示例
- **错误代码说明**：详细的错误响应格式和状态码

### API 端点分类

#### Workflow (工作流)
- `POST /api/generate` - 生成工作流
- `POST /api/refine` - 优化工作流
- `POST /api/validate` - 验证 DSL

#### Template (模板)
- `GET /api/templates` - 获取模板列表
- `GET /api/templates/:id` - 获取模板详情

#### Health (健康检查)
- `GET /api/health` - 服务健康检查

### 示例使用

#### 1. 生成工作流

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "创建一个客服聊天机器人，能够回答常见问题",
    "options": {
      "model": "gpt-4",
      "temperature": 0.7
    }
  }'
```

#### 2. 优化工作流

```bash
curl -X POST http://localhost:3000/api/refine \
  -H "Content-Type: application/json" \
  -d '{
    "dsl": { ... },
    "instruction": "添加一个知识库检索节点"
  }'
```

#### 3. 验证 DSL

```bash
curl -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "dsl": { ... }
  }'
```

### 技术实现

- **框架**: Fastify + @fastify/swagger + @fastify/swagger-ui
- **Schema 验证**: Zod
- **Schema 转换**: zod-to-json-schema
- **OpenAPI 版本**: 3.0.0

### 开发说明

#### 添加新的 API 端点文档

在路由中添加 `schema` 配置：

```typescript
fastify.post('/api/example', {
  schema: {
    description: '端点描述',
    tags: ['category'],
    summary: '简短摘要',
    body: withExample(RequestSchema, {
      // 请求示例
    }),
    response: {
      200: {
        description: '成功响应',
        ...withExample(ResponseSchema, {
          // 响应示例
        }),
      },
    },
  },
  // ... handler
});
```

#### Zod Schema 转换

使用 `zodToOpenApiSchema` 函数自动将 Zod schema 转换为 OpenAPI compatible JSON Schema：

```typescript
import { zodToOpenApiSchema, withExample } from '../utils/zod-to-schema.js';

const schema = zodToOpenApiSchema(MyZodSchema);
const schemaWithExample = withExample(MyZodSchema, exampleData);
```

### 生产部署

在生产环境中，建议：

1. 限制 Swagger UI 访问（仅内网或需要认证）
2. 配置正确的服务器 URL
3. 添加 API 版本控制
4. 启用 HTTPS

编辑 `src/plugins/swagger.plugin.ts` 中的服务器配置：

```typescript
servers: [
  {
    url: 'https://api.autodify.io',
    description: 'Production server',
  },
],
```
