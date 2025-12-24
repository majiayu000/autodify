# Autodify 系统架构

## 系统概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        Autodify System                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 Web Frontend (React)                       │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────────┐    │  │
│  │  │ 自然语言输入 │ │ 工作流编辑器 │ │ YAML 预览/导出     │    │  │
│  │  └────────────┘ └────────────┘ └────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              │ HTTP/WebSocket                    │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 API Server (Fastify)                       │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ POST /api/generate      - 生成工作流                 │  │  │
│  │  │ POST /api/refine        - 迭代优化                   │  │  │
│  │  │ POST /api/validate      - 验证 DSL                  │  │  │
│  │  │ GET  /api/templates     - 获取模板列表               │  │  │
│  │  │ POST /api/chat          - 对话式生成 (SSE)           │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 @autodify/core                             │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │            WorkflowOrchestrator                      │  │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │  │  │
│  │  │  │ Planner  │→ │Generator │→ │    Validator     │  │  │  │
│  │  │  └──────────┘  └──────────┘  └──────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                         │                                  │  │
│  │                         ▼                                  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │              LLM Service Layer                       │  │  │
│  │  │   OpenAI │ Anthropic │ DeepSeek │ LiteLLM Proxy    │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              LiteLLM Proxy (推荐)                          │  │
│  │  - 统一 OpenAI 兼容 API                                    │  │
│  │  - 支持 100+ LLM 提供商                                    │  │
│  │  - 负载均衡 / 故障转移 / 成本追踪                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│            OpenAI / Anthropic / Azure / Bedrock / ...           │
└─────────────────────────────────────────────────────────────────┘
```

## 核心流程

### 工作流生成流程

```
用户输入: "创建一个智能客服系统，根据问题分类后检索不同知识库回答"
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. 意图分析 (IntentAnalyzer)                                     │
│    ├─ 提取实体: 客服系统, 问题分类, 知识库                          │
│    ├─ 检测特征: classification, rag, llm                         │
│    └─ 输出: WorkflowIntent { features, entities, complexity }    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. 模板匹配 (TemplateStore)                                      │
│    ├─ 计算相似度分数                                              │
│    ├─ 如果 score >= 80 → 使用模板快速生成                         │
│    └─ 否则 → 进入 LLM 规划                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. 工作流规划 (WorkflowPlanner)                                  │
│    ├─ 确定所需节点: start, question-classifier, knowledge-       │
│    │   retrieval(x2), llm(x3), variable-aggregator, end         │
│    ├─ 规划连接关系和数据流                                        │
│    └─ 输出: WorkflowPlan { nodes, edges, variables }            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. DSL 生成 (DSLGenerator)                                       │
│    ├─ 构建 Prompt (包含 Dify DSL Schema + Few-shot 示例)         │
│    ├─ 调用 LLM 生成完整 YAML                                     │
│    ├─ 解析 YAML → DifyDSL 对象                                   │
│    └─ 输出: DifyDSL                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. 验证 (DSLValidator)                                           │
│    ├─ Schema 验证 (Zod)                                          │
│    ├─ 拓扑验证 (无环路, 连通性)                                   │
│    ├─ 变量引用验证 ({{#nodeId.varName#}})                        │
│    └─ 如果失败 → 修复提示 + 重试 (最多3次)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     输出: 完整的 Dify DSL
```

## 包结构

```
packages/
├── core/           # 核心引擎 (已完成)
│   ├── types/      # TypeScript 类型定义
│   ├── schema/     # Zod 验证 Schema
│   ├── llm/        # LLM 服务层
│   ├── planner/    # 工作流规划器
│   ├── generator/  # DSL 生成器
│   ├── templates/  # 工作流模板
│   ├── builder/    # 链式构建 API
│   ├── validator/  # DSL 验证器
│   ├── orchestrator/ # 智能编排器
│   └── registry/   # 节点/模型注册表
│
├── server/         # API 服务 (待实现)
│   ├── routes/     # API 路由
│   ├── services/   # 业务逻辑
│   └── middleware/ # 中间件
│
├── web/            # Web 前端 (已有基础)
│   ├── components/ # React 组件
│   ├── store/      # Zustand 状态
│   ├── api/        # API 客户端
│   └── styles/     # 样式
│
└── cli/            # CLI 工具 (已有)
```

## LiteLLM 集成

### 为什么选择 LiteLLM

1. **统一 API** - 所有 LLM 提供商使用 OpenAI 兼容格式
2. **100+ 模型支持** - OpenAI, Anthropic, Azure, Bedrock, Gemini, DeepSeek...
3. **内置功能** - 负载均衡, 故障转移, 重试, 成本追踪
4. **简单部署** - Docker 一键启动

### 集成方式

```yaml
# docker-compose.yml
services:
  litellm:
    image: ghcr.io/berriai/litellm:main-latest
    ports:
      - "4000:4000"
    environment:
      - LITELLM_MASTER_KEY=sk-autodify
    volumes:
      - ./litellm-config.yaml:/app/config.yaml
    command: ["--config", "/app/config.yaml"]

  autodify-server:
    build: ./packages/server
    ports:
      - "3001:3001"
    environment:
      - LLM_BASE_URL=http://litellm:4000/v1
      - LLM_API_KEY=sk-autodify
    depends_on:
      - litellm
```

```yaml
# litellm-config.yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

  - model_name: claude-sonnet
    litellm_params:
      model: anthropic/claude-sonnet-4-20250514
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: deepseek-chat
    litellm_params:
      model: deepseek/deepseek-chat
      api_key: os.environ/DEEPSEEK_API_KEY

litellm_settings:
  fallbacks:
    - gpt-4o: [claude-sonnet, deepseek-chat]
  set_verbose: false
```

## API 设计

### POST /api/generate

```typescript
// Request
{
  "prompt": "创建一个智能客服系统，根据问题分类后检索不同知识库回答",
  "options": {
    "model": "gpt-4o",        // 可选，默认 gpt-4o
    "temperature": 0.7,       // 可选
    "useTemplate": true       // 是否优先使用模板匹配
  }
}

// Response
{
  "success": true,
  "dsl": { ... },             // DifyDSL 对象
  "yaml": "version: ...",     // YAML 字符串
  "metadata": {
    "duration": 3500,         // 生成耗时 (ms)
    "model": "gpt-4o",
    "tokens": { "input": 1200, "output": 800 },
    "templateUsed": null,     // 使用的模板 ID (如果有)
    "confidence": 0.85
  }
}
```

### POST /api/refine

```typescript
// Request
{
  "dsl": { ... },             // 当前 DSL
  "instruction": "在 LLM 节点后添加一个代码节点来格式化输出"
}

// Response
{
  "success": true,
  "dsl": { ... },             // 修改后的 DSL
  "changes": [                // 变更说明
    { "type": "add", "node": "code-1", "reason": "格式化输出" },
    { "type": "modify", "edge": "e3", "reason": "重新连接" }
  ]
}
```

### POST /api/validate

```typescript
// Request
{
  "dsl": { ... }
}

// Response
{
  "valid": true,
  "errors": [],
  "warnings": [
    { "code": "W001", "message": "变量 'result' 未被使用", "path": "workflow.graph.nodes[2]" }
  ]
}
```

## 测试策略

### 单元测试
- LLM Service mock 测试
- Planner 逻辑测试
- Generator 输出格式测试
- Validator 规则测试

### 集成测试
- API 端到端测试
- 核心流程测试 (输入 → DSL)
- 模板匹配测试

### E2E 测试
- 前端交互测试
- 完整生成流程测试
- 错误处理测试

## 部署架构

### 开发环境
```
pnpm dev           # 启动所有服务
├── web:dev        # Vite dev server (3000)
├── server:dev     # API server (3001)
└── litellm        # LiteLLM proxy (4000) [可选]
```

### 生产环境
```
Docker Compose / Kubernetes
├── nginx          # 反向代理 + 静态资源
├── autodify-web   # React 静态构建
├── autodify-api   # Node.js API 服务
└── litellm        # LLM 代理服务
```
