# Autodify 架构设计文档

> 通过自然语言生成和编辑 Dify 工作流的智能系统

## 1. 项目概述

### 1.1 背景与动机

[Dify](https://dify.ai/) 是一个强大的 LLM 应用开发平台，提供可视化的工作流编排能力。然而，对于复杂工作流的创建，用户需要：
- 理解各种节点类型及其配置
- 手动拖拽连接多个节点
- 逐个配置节点参数

**Autodify** 的目标是让用户通过自然语言描述，自动生成完整的 Dify 工作流 DSL，并支持自然语言编辑已有工作流。

### 1.2 核心价值

| 场景 | 传统方式 | Autodify |
|------|----------|----------|
| 创建工作流 | 手动拖拽 10+ 节点，配置参数 | "创建一个爬取网页并用 AI 总结的工作流" |
| 修改工作流 | 找到节点，修改配置 | "把 LLM 模型换成 Claude，温度调到 0.5" |
| 复制模式 | 导出 DSL，手动修改 | "基于翻译工作流，改成中日互译" |

### 1.3 竞品分析

| 产品 | 特点 | 差异 |
|------|------|------|
| [Refly.AI](https://refly.ai/) | 自建工作流引擎 + Copilot 生成 | Autodify 复用 Dify 生态 |
| [n8n AI Builder](https://n8n.io/) | 自然语言生成 n8n 工作流 | Autodify 专注 Dify DSL |
| [DslGenAgent](https://github.com/01554/DslGenAgent) | 三阶段 DSL 生成 | Autodify 增加编辑能力 |

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           用户交互层                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   CLI 界面   │  │  Web UI    │  │  API 接口   │  │  VSCode 插件 │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           核心引擎层                                      │
│                                                                          │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │   Intent Parser   │───▶│ Workflow Planner │───▶│  DSL Generator   │  │
│  │    意图解析器      │    │   工作流规划器     │    │   DSL 生成器     │  │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘  │
│           │                       │                       │             │
│           ▼                       ▼                       ▼             │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │  Context Manager  │    │  Node Registry   │    │   DSL Validator  │  │
│  │    上下文管理器    │    │    节点注册表     │    │   DSL 验证器     │  │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           基础设施层                                      │
│                                                                          │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │    LLM Provider   │    │  Template Store  │    │   Dify Client    │  │
│  │   LLM 服务提供    │    │    模板存储库     │    │   Dify API 客户端│  │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 核心模块说明

#### 2.2.1 Intent Parser（意图解析器）

**职责**：解析用户自然语言输入，识别操作意图和关键实体。

```typescript
interface ParsedIntent {
  action: 'create' | 'edit' | 'delete' | 'query';
  entities: {
    nodeTypes?: string[];        // 涉及的节点类型
    nodeIds?: string[];          // 涉及的节点 ID（编辑场景）
    parameters?: Record<string, any>; // 提取的参数
  };
  context: {
    isFollowUp: boolean;         // 是否是追问
    referenceWorkflow?: string;  // 引用的工作流
  };
}
```

**输入示例**：
```
"创建一个工作流：接收用户问题，从知识库检索相关文档，用 GPT-4 生成回答"
```

**输出示例**：
```json
{
  "action": "create",
  "entities": {
    "nodeTypes": ["start", "knowledge-retrieval", "llm", "end"],
    "parameters": {
      "llm_model": "gpt-4",
      "input_type": "用户问题"
    }
  },
  "context": {
    "isFollowUp": false
  }
}
```

#### 2.2.2 Workflow Planner（工作流规划器）

**职责**：根据解析的意图，规划工作流拓扑结构。

```typescript
interface WorkflowPlan {
  nodes: PlannedNode[];
  edges: PlannedEdge[];
  variables: {
    environment: Variable[];
    conversation: Variable[];
  };
}

interface PlannedNode {
  id: string;
  type: NodeType;
  title: string;
  description: string;
  dependsOn: string[];  // 依赖的节点 ID
}

interface PlannedEdge {
  source: string;
  target: string;
  condition?: string;  // IF/ELSE 条件
}
```

#### 2.2.3 DSL Generator（DSL 生成器）

**职责**：将工作流规划转换为符合 Dify 规范的 YAML DSL。

**生成策略**：
1. **模板匹配**：优先从模板库匹配相似工作流
2. **节点逐个生成**：按拓扑顺序生成每个节点配置
3. **边连接生成**：根据依赖关系生成 edges
4. **变量绑定**：处理节点间的变量引用 `{{#node.var#}}`

#### 2.2.4 DSL Validator（DSL 验证器）

**职责**：验证生成的 DSL 是否符合 Dify 规范。

**验证规则**：
- [ ] 必须有且仅有一个 `start` 节点
- [ ] 必须有至少一个 `end` 或 `answer` 节点
- [ ] 所有节点 ID 必须唯一
- [ ] 边的 source/target 必须引用存在的节点
- [ ] 变量引用 `{{#node.var#}}` 必须有效
- [ ] 必填参数不能为空

#### 2.2.5 Context Manager（上下文管理器）

**职责**：管理多轮对话中的上下文状态。

```typescript
interface ConversationContext {
  sessionId: string;
  currentWorkflow?: DifyDSL;      // 当前操作的工作流
  history: Message[];             // 对话历史
  pendingChanges: Change[];       // 待确认的修改
}
```

**支持的编辑场景**：
- "把第二个 LLM 节点的温度改成 0.3"
- "在知识检索后面加一个代码节点处理结果"
- "删除最后一个条件分支"

#### 2.2.6 Node Registry（节点注册表）

**职责**：存储所有节点类型的元信息，供 LLM 参考。

```typescript
interface NodeMeta {
  type: string;
  displayName: string;
  description: string;
  category: 'basic' | 'llm' | 'tool' | 'logic' | 'data';
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  configSchema: JSONSchema;       // 配置项的 JSON Schema
  examples: NodeExample[];        // Few-shot 示例
}
```

---

## 3. 数据流设计

### 3.1 创建工作流流程

```
用户输入
    │
    ▼
┌─────────────────┐
│  Intent Parser  │  "创建爬虫+AI总结工作流"
└────────┬────────┘
         │ ParsedIntent
         ▼
┌─────────────────┐
│ Workflow Planner│  规划: start → http → llm → end
└────────┬────────┘
         │ WorkflowPlan
         ▼
┌─────────────────┐
│  DSL Generator  │  逐个生成节点 DSL
└────────┬────────┘
         │ RawDSL
         ▼
┌─────────────────┐
│  DSL Validator  │  验证 + 自动修复
└────────┬────────┘
         │ ValidatedDSL
         ▼
┌─────────────────┐
│  Dify Client    │  导入到 Dify
└────────┬────────┘
         │
         ▼
    返回工作流 URL
```

### 3.2 编辑工作流流程

```
用户输入 + 现有 DSL
    │
    ▼
┌─────────────────┐
│  Intent Parser  │  "把 LLM 改成 Claude"
└────────┬────────┘
         │ EditIntent
         ▼
┌─────────────────┐
│  Diff Generator │  识别需修改的节点
└────────┬────────┘
         │ Changes
         ▼
┌─────────────────┐
│  DSL Patcher    │  应用增量修改
└────────┬────────┘
         │ UpdatedDSL
         ▼
┌─────────────────┐
│  DSL Validator  │  验证修改后的 DSL
└────────┬────────┘
         │
         ▼
    返回修改预览 / 确认后应用
```

---

## 4. Prompt 工程设计

### 4.1 System Prompt 结构

```markdown
# Role
你是 Autodify，一个专门生成 Dify 工作流 DSL 的 AI 助手。

# Capabilities
1. 理解用户的自然语言需求
2. 规划合理的工作流拓扑结构
3. 生成符合 Dify DSL 规范的 YAML 配置

# Dify DSL Reference
[嵌入精简版 DSL 格式说明]

# Node Types Available
[嵌入节点注册表信息]

# Output Format
你的输出必须是有效的 YAML，符合以下 schema:
[嵌入 DSL JSON Schema]

# Examples
[嵌入 Few-shot 示例]
```

### 4.2 Few-shot 示例库

每种常见工作流模式准备 2-3 个示例：

| 模式 | 示例数量 | 说明 |
|------|----------|------|
| 简单对话 | 2 | start → llm → end |
| RAG 检索 | 3 | 知识库 + LLM |
| 条件分支 | 2 | IF/ELSE 路由 |
| 迭代处理 | 2 | 批量数据处理 |
| API 集成 | 2 | HTTP 请求 |
| Agent | 2 | 工具调用 |

### 4.3 动态 Prompt 组装

```python
def build_prompt(user_request: str, context: Context) -> str:
    prompt_parts = [
        SYSTEM_PROMPT,
        format_node_registry(context.available_nodes),
    ]

    # 如果是编辑场景，加入当前 DSL
    if context.current_workflow:
        prompt_parts.append(f"# Current Workflow\n```yaml\n{context.current_workflow}\n```")

    # 选择相关的 few-shot 示例
    relevant_examples = select_examples(user_request, k=3)
    prompt_parts.append(format_examples(relevant_examples))

    # 用户请求
    prompt_parts.append(f"# User Request\n{user_request}")

    return "\n\n".join(prompt_parts)
```

---

## 5. 技术选型

### 5.1 技术栈

| 层次 | 技术选型 | 说明 |
|------|----------|------|
| 语言 | TypeScript | 类型安全，生态丰富 |
| 运行时 | Node.js 20+ | 长期支持版本 |
| LLM SDK | Vercel AI SDK | 统一多模型调用 |
| Schema 验证 | Zod | 运行时类型验证 |
| YAML 处理 | yaml | YAML 解析/生成 |
| CLI 框架 | Commander.js | 命令行工具 |
| Web 框架 | Hono | 轻量级 API 服务 |
| 测试 | Vitest | 快速单元测试 |

### 5.2 LLM 选择策略

| 任务 | 推荐模型 | 原因 |
|------|----------|------|
| 意图解析 | GPT-4o-mini / Claude Haiku | 快速、低成本 |
| 工作流规划 | GPT-4o / Claude Sonnet | 需要推理能力 |
| DSL 生成 | Claude Sonnet | 结构化输出稳定 |
| 复杂编辑 | GPT-4o / Claude Opus | 需要理解上下文 |

### 5.3 项目结构

```
autodify/
├── packages/
│   ├── core/                 # 核心引擎
│   │   ├── src/
│   │   │   ├── intent/       # 意图解析
│   │   │   ├── planner/      # 工作流规划
│   │   │   ├── generator/    # DSL 生成
│   │   │   ├── validator/    # DSL 验证
│   │   │   ├── context/      # 上下文管理
│   │   │   └── registry/     # 节点注册表
│   │   └── package.json
│   │
│   ├── cli/                  # 命令行工具
│   │   ├── src/
│   │   │   └── commands/
│   │   └── package.json
│   │
│   ├── api/                  # API 服务
│   │   ├── src/
│   │   │   └── routes/
│   │   └── package.json
│   │
│   └── dify-client/          # Dify API 客户端
│       ├── src/
│       └── package.json
│
├── data/
│   ├── node-registry/        # 节点元信息
│   ├── templates/            # 工作流模板
│   └── examples/             # Few-shot 示例
│
├── docs/
│   ├── design/               # 设计文档
│   └── api/                  # API 文档
│
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## 6. 接口设计

### 6.1 核心 API

#### 创建工作流

```typescript
POST /api/v1/workflows

Request:
{
  "prompt": "创建一个接收用户问题，从知识库检索后用 GPT-4 回答的工作流",
  "options": {
    "dify_base_url": "https://api.dify.ai",
    "dify_api_key": "app-xxx",
    "dry_run": false  // true 则只返回 DSL，不实际创建
  }
}

Response:
{
  "success": true,
  "workflow_id": "workflow-xxx",
  "workflow_url": "https://cloud.dify.ai/app/xxx",
  "dsl": "...",  // 生成的 YAML
  "explanation": "创建了包含 4 个节点的工作流..."
}
```

#### 编辑工作流

```typescript
PATCH /api/v1/workflows/{workflow_id}

Request:
{
  "prompt": "把 LLM 节点的模型换成 Claude 3.5 Sonnet",
  "current_dsl": "..."  // 可选，不传则自动获取
}

Response:
{
  "success": true,
  "changes": [
    {
      "node_id": "llm-1",
      "field": "model.name",
      "old_value": "gpt-4",
      "new_value": "claude-3-5-sonnet-20241022"
    }
  ],
  "updated_dsl": "...",
  "requires_confirmation": true
}
```

#### 验证 DSL

```typescript
POST /api/v1/validate

Request:
{
  "dsl": "..."
}

Response:
{
  "valid": false,
  "errors": [
    {
      "path": "workflow.graph.nodes[2].data.model",
      "message": "model.provider is required"
    }
  ],
  "warnings": [
    {
      "path": "workflow.graph.nodes[1]",
      "message": "Node has no outgoing edges"
    }
  ]
}
```

### 6.2 CLI 命令

```bash
# 创建工作流
autodify create "创建一个翻译工作流，支持中英互译"

# 从模板创建
autodify create --template rag-qa "基于产品文档的问答机器人"

# 编辑现有工作流
autodify edit workflow.yml "把 LLM 温度调到 0.3"

# 验证 DSL
autodify validate workflow.yml

# 导入到 Dify
autodify import workflow.yml --dify-url https://api.dify.ai --api-key xxx

# 交互式对话模式
autodify chat
```

---

## 7. 错误处理与容错

### 7.1 LLM 输出修复

```typescript
async function generateWithRetry(prompt: string, maxRetries = 3): Promise<DifyDSL> {
  for (let i = 0; i < maxRetries; i++) {
    const response = await llm.generate(prompt);
    const parsed = parseYAML(response);
    const validation = validate(parsed);

    if (validation.valid) {
      return parsed;
    }

    // 尝试自动修复
    const fixed = await autoFix(parsed, validation.errors);
    if (fixed) {
      return fixed;
    }

    // 将错误反馈给 LLM 重试
    prompt = appendErrorFeedback(prompt, validation.errors);
  }

  throw new Error('Failed to generate valid DSL after retries');
}
```

### 7.2 常见错误处理

| 错误类型 | 处理策略 |
|----------|----------|
| YAML 语法错误 | 尝试修复常见格式问题（缩进、引号） |
| 节点 ID 重复 | 自动重命名 |
| 变量引用无效 | 提示用户确认或自动修正 |
| 模型不存在 | 降级到默认模型 |
| 必填参数缺失 | 使用默认值或询问用户 |

---

## 8. 性能与成本优化

### 8.1 Prompt 优化

- **精简节点注册表**：只包含用户请求可能用到的节点类型
- **动态 Few-shot**：根据请求类型选择相关示例
- **增量生成**：编辑场景只生成变更部分

### 8.2 缓存策略

```typescript
interface CacheStrategy {
  // 模板缓存：相似请求复用
  templateCache: LRUCache<string, DifyDSL>;

  // Embedding 缓存：加速相似度检索
  embeddingCache: Map<string, number[]>;

  // 验证结果缓存
  validationCache: WeakMap<DifyDSL, ValidationResult>;
}
```

### 8.3 成本估算

| 操作 | 预估 Token | 成本（GPT-4o） |
|------|------------|----------------|
| 简单创建 | ~2000 | $0.02 |
| 复杂创建 | ~5000 | $0.05 |
| 编辑操作 | ~1500 | $0.015 |
| 验证修复 | ~1000 | $0.01 |

---

## 9. 安全考虑

### 9.1 敏感信息处理

- API Key 不存入 DSL，使用环境变量引用
- 导出 DSL 时自动过滤 credential 字段
- 日志中脱敏处理敏感信息

### 9.2 Prompt 注入防护

```typescript
function sanitizeUserInput(input: string): string {
  // 移除可能的 prompt 注入尝试
  const dangerous = [
    /ignore previous instructions/i,
    /system:/i,
    /```yaml\s*\n/,
  ];

  let sanitized = input;
  for (const pattern of dangerous) {
    sanitized = sanitized.replace(pattern, '');
  }

  return sanitized;
}
```

---

## 10. 扩展性设计

### 10.1 插件系统

```typescript
interface AutodifyPlugin {
  name: string;

  // 扩展节点注册表
  registerNodes?(): NodeMeta[];

  // 扩展模板库
  registerTemplates?(): WorkflowTemplate[];

  // 自定义验证规则
  registerValidators?(): Validator[];

  // 后处理 DSL
  postProcess?(dsl: DifyDSL): DifyDSL;
}
```

### 10.2 多平台支持（未来）

虽然 V1 专注 Dify，架构设计支持未来扩展：

```typescript
interface WorkflowPlatform {
  name: 'dify' | 'n8n' | 'langflow' | 'flowise';

  generateDSL(plan: WorkflowPlan): string;
  validateDSL(dsl: string): ValidationResult;
  importWorkflow(dsl: string): Promise<ImportResult>;
}
```

---

## 11. 监控与可观测性

### 11.1 指标收集

```typescript
interface Metrics {
  // 生成质量
  generation_success_rate: number;
  validation_pass_rate: number;
  retry_rate: number;

  // 性能
  avg_generation_time_ms: number;
  avg_token_usage: number;

  // 用户体验
  edit_satisfaction_rate: number;
  dsl_import_success_rate: number;
}
```

### 11.2 日志结构

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req-xxx",
  "action": "create",
  "user_prompt": "创建翻译工作流",
  "parsed_intent": {...},
  "generated_nodes": ["start", "llm", "end"],
  "validation_result": "pass",
  "token_usage": 1500,
  "duration_ms": 2300
}
```

---

## 12. 里程碑规划

### Phase 1: MVP（核心功能）
- [ ] DSL 格式解析与验证
- [ ] 基础工作流生成（5 种节点类型）
- [ ] CLI 工具
- [ ] 单元测试覆盖

### Phase 2: 增强功能
- [ ] 完整节点类型支持
- [ ] 自然语言编辑
- [ ] 多轮对话上下文
- [ ] API 服务

### Phase 3: 生态集成
- [ ] Dify 官方 API 集成
- [ ] 模板市场
- [ ] VSCode 插件
- [ ] Web UI

### Phase 4: 智能化
- [ ] 意图澄清对话
- [ ] 自动错误修复
- [ ] 工作流优化建议
- [ ] 多模型 Routing

---

## 附录

### A. 参考资料

- [Dify 官方文档](https://docs.dify.ai/)
- [Dify DSL 源码](https://github.com/langgenius/dify/blob/main/api/services/app_dsl_service.py)
- [Awesome-Dify-Workflow](https://github.com/svcvit/Awesome-Dify-Workflow)
- [DslGenAgent](https://github.com/01554/DslGenAgent)

### B. 术语表

| 术语 | 说明 |
|------|------|
| DSL | Domain Specific Language，领域特定语言 |
| Node | 工作流中的处理单元 |
| Edge | 节点间的连接关系 |
| Chatflow | 对话型工作流 |
| Workflow | 自动化批处理工作流 |
