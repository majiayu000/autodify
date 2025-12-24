# Autodify 实施计划

> 通过自然语言生成和编辑 Dify 工作流的智能系统

## 项目概览

| 项目 | 信息 |
|------|------|
| 名称 | Autodify |
| 目标 | 自然语言 → Dify DSL 生成与编辑 |
| 技术栈 | TypeScript + Node.js + Vercel AI SDK |
| 预期产出 | CLI 工具 + API 服务 |

---

## Phase 1: 基础框架与核心生成

### 目标
搭建项目基础框架，实现简单工作流的 DSL 生成能力。

### 任务清单

#### 1.1 项目初始化
- [ ] 初始化 pnpm monorepo 项目结构
- [ ] 配置 TypeScript、ESLint、Prettier
- [ ] 配置 Vitest 测试框架
- [ ] 创建 packages/core、packages/cli 基础结构

#### 1.2 DSL 类型定义
- [ ] 定义 Dify DSL 的完整 TypeScript 类型
- [ ] 实现 YAML 解析与序列化工具
- [ ] 创建 Zod schema 用于运行时验证
- [ ] 编写类型定义的单元测试

```typescript
// 预期输出示例
interface DifyDSL {
  version: string;
  kind: 'app';
  app: AppConfig;
  workflow: WorkflowConfig;
}

interface WorkflowConfig {
  graph: {
    nodes: Node[];
    edges: Edge[];
  };
  features: Features;
  environment_variables: Variable[];
  conversation_variables: Variable[];
}
```

#### 1.3 节点注册表
- [ ] 创建节点元信息数据结构
- [ ] 实现 18 种节点类型的元信息定义
- [ ] 为每种节点编写配置 schema
- [ ] 创建节点示例库（每种 2-3 个示例）

```
data/
├── node-registry/
│   ├── start.json
│   ├── end.json
│   ├── llm.json
│   ├── knowledge-retrieval.json
│   ├── question-classifier.json
│   ├── if-else.json
│   ├── code.json
│   ├── http-request.json
│   ├── template-transform.json
│   └── ...
```

#### 1.4 DSL 验证器
- [ ] 实现结构验证（必填字段、类型检查）
- [ ] 实现拓扑验证（Start 唯一、End 存在、无孤立节点）
- [ ] 实现引用验证（变量引用有效性）
- [ ] 实现边连接验证（source/target 存在）
- [ ] 输出格式化的错误信息

```typescript
// 预期 API
const result = validator.validate(dsl);
// {
//   valid: false,
//   errors: [
//     { path: 'workflow.graph.nodes[2].data.model', message: 'model.provider is required' }
//   ],
//   warnings: [
//     { path: 'workflow.graph.nodes[1]', message: 'Node has no outgoing edges' }
//   ]
// }
```

#### 1.5 核心生成器 MVP
- [x] 实现基础 prompt 模板
- [x] 集成 Vercel AI SDK（支持 OpenAI、Anthropic、DeepSeek、智谱 AI）
- [x] 实现简单工作流生成（Start → LLM → End）
- [x] 实现生成后自动验证
- [ ] 实现验证失败后的重试机制

```typescript
// 预期 API
const generator = new WorkflowGenerator({ model: 'gpt-4o' });
const dsl = await generator.generate('创建一个简单的问答工作流');
```

#### 1.6 CLI 工具 V1
- [x] 实现 `autodify create <prompt>` 命令
- [x] 实现 `autodify validate <file>` 命令
- [x] 实现配置文件支持（环境变量）
- [x] 实现输出格式选项（YAML/JSON）

```bash
# 使用示例
autodify create "创建一个翻译工作流" -o workflow.yml
autodify validate workflow.yml
```

### Phase 1 验收标准
- [x] 能够生成包含 Start、LLM、End 三节点的简单工作流
- [ ] 生成的 DSL 能够成功导入 Dify
- [x] DSL 验证器覆盖所有必要规则
- [x] CLI 基础命令可用
- [ ] 单元测试覆盖率 > 80%

---

## Phase 2: 完整节点支持与模板系统

### 目标
支持所有节点类型，建立模板系统提高生成质量。

### 任务清单

#### 2.1 扩展节点支持
- [ ] 实现 Knowledge Retrieval 节点生成
- [ ] 实现 Question Classifier 节点生成
- [ ] 实现 IF/ELSE 条件节点生成
- [ ] 实现 Code 节点生成（Python/JavaScript）
- [ ] 实现 HTTP Request 节点生成
- [ ] 实现 Template Transform 节点生成
- [ ] 实现 Iteration 循环节点生成
- [ ] 实现 Variable Aggregator/Assigner 节点生成
- [ ] 实现 Parameter Extractor 节点生成
- [ ] 实现 Tool 节点生成
- [ ] 实现 Agent 节点生成

#### 2.2 模板系统
- [ ] 设计模板数据结构
- [ ] 收集 10+ 常见工作流模板
- [ ] 实现模板匹配算法（基于语义相似度）
- [ ] 实现模板参数化填充
- [ ] 支持从 Awesome-Dify-Workflow 导入模板

```typescript
// 预期 API
const templates = await templateStore.search('RAG 问答', { limit: 3 });
const dsl = await generator.generateFromTemplate(templates[0], {
  llm_model: 'gpt-4o',
  knowledge_base: 'kb-xxx'
});
```

#### 2.3 Few-shot 示例管理
- [ ] 为每种工作流模式准备示例
- [ ] 实现动态示例选择（根据请求类型）
- [ ] 实现示例嵌入向量化
- [ ] 优化 prompt 长度（精简示例）

#### 2.4 工作流规划器
- [ ] 实现意图解析模块
- [ ] 实现拓扑规划模块
- [ ] 实现节点配置推断
- [ ] 实现分步生成流程

```typescript
// 预期流程
1. parseIntent(userPrompt) → { action, entities }
2. planTopology(intent) → { nodes[], edges[] }
3. generateNodes(plan) → Node[]
4. assembleDSL(nodes, edges) → DifyDSL
```

#### 2.5 复杂工作流测试
- [ ] 创建 RAG 工作流测试用例
- [ ] 创建条件分支测试用例
- [ ] 创建迭代处理测试用例
- [ ] 创建多分支合并测试用例
- [ ] 端到端测试（生成 → 导入 Dify → 执行）

### Phase 2 验收标准
- [x] 支持所有 18 种节点类型
- [x] 模板匹配准确率 > 85%
- [ ] 复杂工作流（5+ 节点）生成成功率 > 90%
- [x] 生成的 DSL 100% 通过验证

---

## Phase 3: 编辑能力与上下文管理

### 目标
支持自然语言编辑已有工作流，实现多轮对话上下文管理。

### 任务清单

#### 3.1 DSL 解析器
- [ ] 实现 DSL 到内部模型的转换
- [ ] 实现节点依赖图构建
- [ ] 实现变量追踪分析
- [ ] 支持 DSL diff 计算

#### 3.2 编辑意图识别
- [ ] 识别编辑目标（节点/边/参数）
- [ ] 识别编辑动作（添加/修改/删除）
- [ ] 提取编辑参数
- [ ] 处理模糊引用（"第二个 LLM"、"最后一个节点"）

```typescript
// 预期输出
parseEditIntent("把 LLM 的温度改成 0.3")
// {
//   action: 'modify',
//   target: { type: 'node', nodeType: 'llm', index: 'first' },
//   field: 'model.completion_params.temperature',
//   value: 0.3
// }
```

#### 3.3 增量修改引擎
- [ ] 实现节点修改
- [ ] 实现节点添加（指定位置）
- [ ] 实现节点删除（处理边重连）
- [ ] 实现边修改
- [ ] 实现变量重命名（级联更新引用）

#### 3.4 上下文管理
- [ ] 实现会话状态存储
- [ ] 实现对话历史管理
- [ ] 实现工作流快照
- [ ] 实现撤销/重做功能

```typescript
// 预期 API
const session = await contextManager.createSession();
await session.loadWorkflow(existingDSL);

await session.edit("添加一个知识检索节点在 LLM 前面");
await session.edit("把检索的 top_k 改成 10");
await session.undo(); // 撤销上一步
const finalDSL = session.getCurrentDSL();
```

#### 3.5 变更预览与确认
- [ ] 实现变更 diff 可视化
- [ ] 实现变更影响分析
- [ ] 支持选择性应用变更
- [ ] CLI 交互式确认流程

```bash
autodify edit workflow.yml "把模型换成 Claude"

# 输出:
# 检测到以下变更:
#   - nodes[1].data.model.provider: openai → anthropic
#   - nodes[1].data.model.name: gpt-4o → claude-3-5-sonnet-20241022
#
# 确认应用? [Y/n]
```

#### 3.6 CLI 编辑命令
- [ ] 实现 `autodify edit <file> <prompt>` 命令
- [ ] 实现 `autodify chat` 交互式模式
- [ ] 实现 `autodify diff <file1> <file2>` 命令
- [ ] 实现 `autodify history` 命令

### Phase 3 验收标准
- [ ] 支持 10+ 种常见编辑操作
- [ ] 编辑后 DSL 100% 有效
- [ ] 变更预览准确
- [ ] 多轮对话上下文保持正确

---

## Phase 4: API 服务与 Dify 集成

### 目标
提供 HTTP API 服务，实现与 Dify 平台的完整集成。

### 任务清单

#### 4.1 Dify API 客户端
- [ ] 封装 Dify 应用管理 API
- [ ] 实现 DSL 导入/导出
- [ ] 实现工作流执行测试
- [ ] 实现错误处理与重试

```typescript
// 预期 API
const difyClient = new DifyClient({
  baseUrl: 'https://api.dify.ai',
  apiKey: 'app-xxx'
});

await difyClient.importWorkflow(dsl);
await difyClient.exportWorkflow(appId);
await difyClient.runWorkflow(appId, { inputs: {...} });
```

#### 4.2 API 服务搭建
- [ ] 使用 Hono 搭建 API 服务
- [ ] 实现 POST /api/v1/workflows（创建）
- [ ] 实现 PATCH /api/v1/workflows/:id（编辑）
- [ ] 实现 POST /api/v1/validate（验证）
- [ ] 实现 POST /api/v1/chat（多轮对话）
- [ ] 添加认证中间件
- [ ] 添加请求限流

#### 4.3 API 文档
- [ ] 使用 OpenAPI 规范编写文档
- [ ] 生成 Swagger UI
- [ ] 编写使用示例
- [ ] 提供 SDK 生成配置

#### 4.4 部署配置
- [ ] Docker 镜像构建
- [ ] docker-compose 配置
- [ ] 环境变量管理
- [ ] 健康检查端点

```yaml
# docker-compose.yml
services:
  autodify:
    image: autodify:latest
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DIFY_BASE_URL=${DIFY_BASE_URL}
      - DIFY_API_KEY=${DIFY_API_KEY}
```

#### 4.5 监控与日志
- [ ] 结构化日志输出
- [ ] 请求追踪（request_id）
- [ ] Token 使用量统计
- [ ] 生成成功率指标
- [ ] Prometheus 指标暴露

### Phase 4 验收标准
- [ ] API 服务稳定运行
- [ ] 所有端点有完整文档
- [ ] 与 Dify 云/自托管版本均兼容
- [ ] 支持 Docker 一键部署

---

## Phase 5: 智能化增强

### 目标
提升生成质量，增加智能化特性。

### 任务清单

#### 5.1 意图澄清对话
- [ ] 识别模糊或不完整的请求
- [ ] 自动生成澄清问题
- [ ] 支持多轮澄清
- [ ] 记录用户偏好

```
用户: 创建一个问答工作流
Autodify: 需要一些额外信息来生成工作流:
  1. 是否需要知识库检索？如果是，知识库 ID 是什么？
  2. 使用哪个 LLM 模型？(默认: gpt-4o)
  3. 是否需要多轮对话记忆？
```

#### 5.2 自动错误修复
- [ ] 收集常见生成错误模式
- [ ] 实现自动修复策略
- [ ] 优化重试 prompt
- [ ] 错误反馈学习

#### 5.3 工作流优化建议
- [ ] 分析工作流性能瓶颈
- [ ] 建议节点合并/拆分
- [ ] 建议模型降级（成本优化）
- [ ] 检测潜在问题

```
Autodify: 工作流分析完成，发现以下优化建议:
  1. [性能] 建议将 3 个串行 HTTP 节点改为并行
  2. [成本] LLM-2 可以使用 gpt-4o-mini，预计节省 60% token
  3. [可靠性] 建议为 HTTP 节点添加错误处理
```

#### 5.4 多模型 Routing
- [ ] 根据任务复杂度选择模型
- [ ] 成本/质量平衡策略
- [ ] 模型失败自动降级
- [ ] A/B 测试框架

#### 5.5 学习与改进
- [ ] 收集生成成功/失败案例
- [ ] 分析失败原因
- [ ] 动态更新 few-shot 示例
- [ ] prompt 自动调优

### Phase 5 验收标准
- [ ] 生成成功率 > 95%
- [ ] 用户满意度 > 90%
- [ ] 平均生成成本降低 30%

---

## Phase 6: 生态扩展（可选）

### 目标
构建更完整的生态系统。

### 任务清单

#### 6.1 VSCode 插件
- [ ] DSL 语法高亮
- [ ] DSL 智能补全
- [ ] 内联生成/编辑
- [ ] 可视化预览

#### 6.2 Web UI
- [ ] 对话式界面
- [ ] 工作流可视化
- [ ] 模板市场
- [ ] 用户管理

#### 6.3 模板市场
- [ ] 模板上传/下载
- [ ] 模板评分/评论
- [ ] 模板分类/搜索
- [ ] 热门模板推荐

#### 6.4 多平台支持
- [ ] n8n DSL 生成（实验性）
- [ ] LangFlow DSL 生成（实验性）
- [ ] 通用工作流 IR 设计

---

## 技术债务与风险

### 已知风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Dify DSL 格式变更 | 生成的 DSL 不兼容 | 版本检测 + 迁移脚本 |
| LLM 输出不稳定 | 生成失败率高 | 重试 + 多模型回退 |
| Token 成本过高 | 用户使用成本 | prompt 优化 + 模型选择 |
| 复杂工作流生成困难 | 功能受限 | 分步生成 + 模板系统 |

### 技术债务清单

| 债务 | 优先级 | 计划处理阶段 |
|------|--------|--------------|
| 完善类型定义 | 高 | Phase 1 |
| 增加测试覆盖 | 高 | 每个 Phase |
| 优化 prompt 长度 | 中 | Phase 2 |
| 性能优化 | 中 | Phase 4 |
| 文档完善 | 中 | Phase 4 |

---

## 成功指标

### Phase 1
- 简单工作流生成成功率 > 95%
- DSL 验证通过率 100%
- 单元测试覆盖率 > 80%

### Phase 2
- 所有节点类型支持
- 复杂工作流（5+ 节点）成功率 > 90%
- 模板匹配准确率 > 85%

### Phase 3
- 编辑操作成功率 > 90%
- 多轮对话上下文正确率 > 95%
- 变更预览准确率 100%

### Phase 4
- API 可用性 > 99.5%
- 平均响应时间 < 5s
- Dify 导入成功率 100%

### Phase 5
- 整体生成成功率 > 95%
- 用户满意度 > 90%
- 平均成本降低 30%

---

## 附录

### A. 相关资源

| 资源 | 链接 |
|------|------|
| Dify 官方文档 | https://docs.dify.ai/ |
| Dify GitHub | https://github.com/langgenius/dify |
| Awesome-Dify-Workflow | https://github.com/svcvit/Awesome-Dify-Workflow |
| DslGenAgent | https://github.com/01554/DslGenAgent |
| Vercel AI SDK | https://sdk.vercel.ai/ |

### B. 团队分工建议

| 角色 | 职责 |
|------|------|
| 核心开发 | DSL 生成器、验证器、编辑器 |
| Prompt 工程 | prompt 设计、few-shot 管理、优化 |
| 测试工程 | 单元测试、集成测试、E2E 测试 |
| DevOps | CI/CD、部署、监控 |

### C. 里程碑时间线参考

```
Phase 1: 基础框架与核心生成
  ├── 项目初始化与类型定义
  ├── 节点注册表与验证器
  └── MVP 生成器与 CLI

Phase 2: 完整节点支持与模板系统
  ├── 扩展所有节点类型
  ├── 模板系统实现
  └── 工作流规划器

Phase 3: 编辑能力与上下文管理
  ├── DSL 解析与编辑引擎
  ├── 上下文管理
  └── CLI 编辑命令

Phase 4: API 服务与 Dify 集成
  ├── Dify 客户端
  ├── API 服务
  └── 部署与监控

Phase 5: 智能化增强
  ├── 意图澄清
  ├── 自动修复
  └── 优化建议
```
