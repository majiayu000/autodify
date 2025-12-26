# Autodify

> 通过自然语言生成和编辑 Dify 工作流

Autodify 让你可以使用自然语言描述来生成 [Dify](https://dify.ai/) 工作流 DSL，支持 Web 界面、API 服务和命令行工具。

## 特性

- 🎨 **可视化界面** - Web 界面实时预览生成的工作流
- 🚀 **自然语言生成** - 用一句话描述你想要的工作流
- ✅ **DSL 验证** - 验证工作流配置的正确性
- 📤 **Dify 兼容导出** - 导出的 YAML 可直接导入 Dify
- 🔧 **多模型支持** - 支持 OpenAI、Anthropic、DeepSeek 等多种 LLM

## 快速开始

### 1. 安装依赖

```bash
git clone https://github.com/your-username/autodify.git
cd autodify
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置你的 LLM API：

```bash
# 方式一：直接使用 OpenRouter（推荐，简单）
LLM_PROVIDER=openai
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_API_KEY=sk-or-your-openrouter-key
LLM_DEFAULT_MODEL=anthropic/claude-3.5-sonnet

# 方式二：直接使用 OpenAI
LLM_PROVIDER=openai
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-your-openai-key
LLM_DEFAULT_MODEL=gpt-4o
```

### 3. 构建并启动

```bash
# 构建项目
pnpm build

# 启动 Web 界面 + API 服务
pnpm start

# 或分别启动
pnpm dev:server  # API 服务 (http://localhost:3001)
pnpm dev:web     # Web 界面 (http://localhost:3000)
```

### 4. 打开浏览器

访问 http://localhost:3000 ，输入描述即可生成工作流！

## 使用方式

### Web 界面（推荐）

最简单的方式，打开浏览器访问 http://localhost:3000

```
输入：创建一个智能客服系统，根据用户问题类型分类后给出不同回答
输出：可视化工作流 + 可导出的 YAML
```

### API 调用

```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "创建一个中英互译的工作流"}'
```

### 命令行

```bash
# 生成工作流
pnpm --filter @autodify/cli start create "创建一个翻译工作流" -o output.yml

# 验证工作流
pnpm --filter @autodify/cli start validate output.yml

# 查看帮助
pnpm --filter @autodify/cli start --help
```

## 项目结构

```
autodify/
├── packages/
│   ├── core/       # 核心引擎（类型定义、验证、生成）
│   ├── server/     # API 服务（Fastify）
│   ├── web/        # Web 前端（React + ReactFlow）
│   └── cli/        # 命令行工具
├── docker-compose.yml
└── .env.example
```

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式（热重载）
pnpm dev:all      # 同时启动 server + web
pnpm dev:server   # 只启动 API 服务
pnpm dev:web      # 只启动 Web 前端

# 测试
pnpm test

# 类型检查
pnpm typecheck

# 代码格式化
pnpm format
```

## 导出到 Dify

生成的工作流可以直接导入 Dify：

1. 在 Web 界面点击「导出 YAML」
2. 打开 Dify Studio → 导入 DSL 文件
3. 选择导出的 YAML 文件

## 支持的节点类型

| 类型 | 说明 |
|------|------|
| `start` | 工作流入口 |
| `end` | 工作流出口 |
| `llm` | LLM 对话/生成 |
| `knowledge-retrieval` | 知识库检索 |
| `question-classifier` | 问题分类 |
| `if-else` | 条件分支 |
| `code` | 代码执行 |
| `http-request` | HTTP 请求 |
| `variable-aggregator` | 变量聚合 |

## 支持的 LLM

| Provider | Models |
|----------|--------|
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4-turbo, o1 |
| Anthropic | claude-3.5-sonnet, claude-3-opus, claude-3-haiku |
| DeepSeek | deepseek-chat, deepseek-coder |
| OpenRouter | 所有支持的模型 |

## 相关链接

- [Dify 官方文档](https://docs.dify.ai/)
- [Awesome-Dify-Workflow](https://github.com/svcvit/Awesome-Dify-Workflow) - DSL 模板库

## License

MIT
