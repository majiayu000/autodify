# Autodify

> 通过自然语言生成和编辑 Dify 工作流

Autodify 是一个 CLI 工具，让你可以使用自然语言描述来生成 [Dify](https://dify.ai/) 工作流 DSL，并支持验证和编辑。

## 特性

- 🚀 **自然语言生成** - 用一句话描述你想要的工作流
- ✅ **DSL 验证** - 验证工作流配置的正确性
- 🔧 **多模型支持** - 支持 OpenAI、Anthropic、DeepSeek、智谱 AI 等多种 LLM
- 📦 **完整类型定义** - TypeScript 类型定义，支持 IDE 智能提示

## 安装

```bash
# 克隆项目
git clone https://github.com/your-username/autodify.git
cd autodify

# 安装依赖
pnpm install

# 构建
pnpm build
```

## 快速开始

### 生成工作流

```bash
# 设置 API Key
export OPENAI_API_KEY=sk-xxx

# 使用自然语言生成工作流
pnpm --filter @autodify/cli start create "创建一个中英互译的工作流" -o translation.yml

# 简单模式（不调用 LLM，直接创建基础工作流）
pnpm --filter @autodify/cli start create "翻译助手" --simple -o simple.yml
```

### 验证工作流

```bash
# 验证 DSL 文件
pnpm --filter @autodify/cli start validate translation.yml

# JSON 格式输出
pnpm --filter @autodify/cli start validate translation.yml --json
```

### 查看帮助

```bash
# 查看所有命令
pnpm --filter @autodify/cli start --help

# 查看可用节点类型
pnpm --filter @autodify/cli start info --nodes

# 查看可用模型
pnpm --filter @autodify/cli start info --models

# 查看特定节点详情
pnpm --filter @autodify/cli start info --node llm
```

## 项目结构

```
autodify/
├── packages/
│   ├── core/                 # 核心引擎
│   │   ├── src/
│   │   │   ├── types/        # TypeScript 类型定义
│   │   │   ├── schema/       # Zod Schema 验证
│   │   │   ├── utils/        # 工具函数（YAML 解析等）
│   │   │   ├── registry/     # 节点和模型注册表
│   │   │   ├── validator/    # DSL 验证器
│   │   │   └── generator/    # DSL 生成器
│   │   └── package.json
│   │
│   └── cli/                  # 命令行工具
│       ├── src/
│       │   ├── commands/     # CLI 命令
│       │   └── index.ts
│       └── package.json
│
├── docs/
│   ├── design/               # 设计文档
│   │   └── ARCHITECTURE.md   # 架构设计
│   ├── reference/            # 参考文档
│   │   └── DIFY_DSL_SPEC.md  # Dify DSL 规范
│   └── ROADMAP.md            # 实施计划
│
└── README.md
```

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式（监听变化）
pnpm dev

# 运行测试
pnpm test

# 类型检查
pnpm typecheck

# 代码格式化
pnpm format
```

## 支持的节点类型

| 类型 | 名称 | 说明 |
|------|------|------|
| `start` | 开始 | 工作流入口 |
| `end` | 结束 | 工作流出口 |
| `llm` | LLM | 大语言模型调用 |
| `knowledge-retrieval` | 知识检索 | 知识库检索 |
| `question-classifier` | 问题分类 | LLM 驱动的分类 |
| `if-else` | 条件分支 | 条件判断 |
| `code` | 代码执行 | Python/JavaScript |
| `http-request` | HTTP 请求 | 外部 API 调用 |
| `template-transform` | 模板转换 | Jinja2 模板 |
| `variable-aggregator` | 变量聚合 | 合并变量 |

## 支持的 LLM

| Provider | Models |
|----------|--------|
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-4, gpt-3.5-turbo, o1, o1-preview, o1-mini |
| Anthropic | claude-3-5-sonnet-20241022, claude-3-opus-20240229, claude-3-sonnet-20240229, claude-3-haiku-20240307 |
| DeepSeek | deepseek-chat, deepseek-coder |
| 智谱 AI | glm-4, glm-4-plus, glm-4-air, glm-4-flash, glm-4v |

## 路线图

- [x] Phase 1: 基础框架与核心生成
  - [x] 项目结构初始化
  - [x] TypeScript 类型定义
  - [x] YAML 解析与验证
  - [x] DSL 验证器
  - [x] 核心生成器 MVP
  - [x] CLI 工具 V1

- [x] Phase 2: 完整节点支持与模板系统
- [ ] Phase 3: 编辑能力与上下文管理
- [ ] Phase 4: API 服务与 Dify 集成
- [ ] Phase 5: 智能化增强

详见 [ROADMAP.md](./docs/ROADMAP.md)

## 相关链接

- [Dify 官方文档](https://docs.dify.ai/)
- [Awesome-Dify-Workflow](https://github.com/svcvit/Awesome-Dify-Workflow) - DSL 模板库

## License

MIT
