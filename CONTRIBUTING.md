# 贡献指南

感谢你对 Autodify 项目的关注！我们欢迎任何形式的贡献，包括但不限于：

- 报告 Bug
- 提交新功能建议
- 改进文档
- 提交代码补丁

在贡献之前，请仔细阅读本指南。

## 目录

- [开发环境设置](#开发环境设置)
- [项目结构](#项目结构)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [测试要求](#测试要求)
- [代码审查标准](#代码审查标准)

## 开发环境设置

### 前置要求

- Node.js >= 20.0.0
- pnpm >= 9.0.0 (推荐使用项目指定版本)
- Git

### 安装步骤

1. **Fork 仓库**

   点击 GitHub 页面右上角的 "Fork" 按钮

2. **克隆你的 Fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/autodify.git
   cd autodify
   ```

3. **添加上游仓库**

   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/autodify.git
   ```

4. **安装依赖**

   ```bash
   pnpm install
   ```

5. **构建项目**

   ```bash
   pnpm build
   ```

6. **运行开发模式**

   ```bash
   # 开发所有包
   pnpm dev

   # 或单独开发某个包
   pnpm dev:web       # 仅开发 Web
   pnpm dev:server    # 仅开发 Server
   pnpm dev:all       # 同时开发 Web 和 Server
   ```

### 环境配置

1. 复制环境变量模板：

   ```bash
   cp .env.example .env
   ```

2. 根据需要配置环境变量（如 API Keys）

### 验证安装

运行以下命令验证环境设置是否正确：

```bash
# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 运行测试
pnpm test
```

## 项目结构

本项目是一个 **Monorepo**，使用 pnpm workspace 管理多个包：

```
autodify/
├── packages/
│   ├── core/           # 核心引擎 (@autodify/core)
│   │   ├── src/
│   │   │   ├── types/        # TypeScript 类型定义
│   │   │   ├── schema/       # Zod Schema 验证
│   │   │   ├── utils/        # 工具函数
│   │   │   ├── registry/     # 节点和模型注册表
│   │   │   ├── validator/    # DSL 验证器
│   │   │   └── generator/    # DSL 生成器
│   │   └── package.json
│   │
│   ├── cli/            # 命令行工具 (@autodify/cli)
│   │   ├── src/
│   │   │   ├── commands/     # CLI 命令
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── server/         # API 服务 (@autodify/server)
│   │   ├── src/
│   │   └── package.json
│   │
│   └── web/            # Web 界面 (@autodify/web)
│       ├── src/
│       └── package.json
│
├── docs/               # 文档
├── .github/            # GitHub 配置
└── package.json        # 根配置
```

### 包依赖关系

- `cli` → 依赖 `core`
- `server` → 依赖 `core`
- `web` → 独立前端应用
- `core` → 核心库，无依赖其他包

## 代码规范

### TypeScript

- 使用 TypeScript 编写所有代码
- 启用严格模式（`strict: true`）
- 优先使用类型导入：`import type { ... } from '...'`
- 避免使用 `any`，必要时使用 `unknown`
- 为所有公共 API 提供类型定义

### ESLint 规则

项目使用 ESLint 进行代码检查，主要规则包括：

- 使用 `@typescript-eslint` 推荐规则
- 未使用的变量必须以 `_` 开头
- 必须使用 `type imports`
- 禁止浮动 Promise（必须正确处理异步）
- 限制 `console` 使用（允许 `console.warn` 和 `console.error`）

运行检查：

```bash
# 检查代码
pnpm lint

# 自动修复
pnpm lint:fix
```

### Prettier 配置

代码格式化规则：

- 使用分号
- 单引号
- 2 空格缩进
- 行宽 100 字符
- 尾随逗号（ES5）
- 箭头函数总是使用括号

运行格式化：

```bash
# 格式化所有文件
pnpm format

# 检查格式
pnpm format:check
```

### 命名约定

- **文件名**：使用 kebab-case（如 `dsl-generator.ts`）
- **类名**：使用 PascalCase（如 `DslGenerator`）
- **函数/变量**：使用 camelCase（如 `generateWorkflow`）
- **常量**：使用 UPPER_SNAKE_CASE（如 `MAX_NODES`）
- **接口/类型**：使用 PascalCase（如 `WorkflowNode`）

### 目录结构约定

- 每个包的源代码放在 `src/` 目录
- 测试文件与源文件同目录，命名为 `*.test.ts`
- 类型定义统一放在 `types/` 目录
- 工具函数放在 `utils/` 目录

## 提交规范

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 提交消息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行的变动）
- `refactor`: 重构（既不是新增功能，也不是修复 bug）
- `perf`: 性能优化
- `test`: 增加测试
- `chore`: 构建过程或辅助工具的变动
- `ci`: CI 配置文件和脚本的变动
- `build`: 影响构建系统或外部依赖的更改
- `revert`: 回退之前的提交

### Scope 范围

- `core`: 核心引擎
- `cli`: 命令行工具
- `server`: API 服务
- `web`: Web 界面
- `deps`: 依赖更新
- `*`: 多个范围

### 示例

```bash
# 好的提交消息
feat(core): 添加知识库检索节点支持
fix(cli): 修复 YAML 文件路径解析错误
docs: 更新安装文档
refactor(server): 优化 LLM 请求处理逻辑
test(core): 添加 DSL 生成器单元测试

# 不好的提交消息
update code          # 太模糊
fix bug              # 没有说明修复了什么
添加新功能            # 应使用英文
```

### Breaking Changes

如果有破坏性变更，需要在 footer 中说明：

```
feat(core): 重构 DSL 生成器 API

BREAKING CHANGE: generateWorkflow 函数签名已更改，
现在接收 options 对象而不是多个参数
```

## Pull Request 流程

### 1. 创建分支

从最新的 `main` 分支创建新分支：

```bash
# 更新主分支
git checkout main
git pull upstream main

# 创建功能分支
git checkout -b feat/your-feature-name

# 或者 bug 修复分支
git checkout -b fix/bug-description
```

分支命名规范：
- `feat/feature-name` - 新功能
- `fix/bug-name` - Bug 修复
- `docs/description` - 文档更新
- `refactor/description` - 重构
- `test/description` - 测试

### 2. 开发与测试

- 编写代码
- 添加/更新测试
- 确保所有测试通过
- 确保代码符合规范

```bash
# 运行所有检查
pnpm typecheck
pnpm lint
pnpm test
pnpm format:check
```

### 3. 提交代码

```bash
git add .
git commit -m "feat(core): add your feature description"
```

### 4. 推送到你的 Fork

```bash
git push origin feat/your-feature-name
```

### 5. 创建 Pull Request

1. 访问你的 Fork 页面
2. 点击 "Compare & pull request"
3. 填写 PR 模板
4. 提交 PR

### 6. Code Review

- 响应审查意见
- 根据反馈修改代码
- 推送更新

```bash
git add .
git commit -m "fix: address review comments"
git push origin feat/your-feature-name
```

### 7. 合并

PR 获得批准后，维护者会合并你的代码。

## 测试要求

### 测试框架

本项目使用 [Vitest](https://vitest.dev/) 作为测试框架。

### 测试类型

1. **单元测试**
   - 测试单个函数或类
   - 文件命名：`*.test.ts`
   - 位置：与源文件同目录

2. **集成测试**
   - 测试多个模块的协作
   - 文件命名：`*.integration.test.ts`

3. **端到端测试**
   - 测试完整的用户场景
   - 文件命名：`*.e2e.test.ts`

### 测试覆盖率要求

- 新代码的测试覆盖率应达到 **80%** 以上
- 核心模块（`core` 包）要求 **90%** 以上
- 使用 `pnpm test:coverage` 查看覆盖率报告

### 测试编写指南

```typescript
import { describe, it, expect } from 'vitest';
import { yourFunction } from './your-module';

describe('yourFunction', () => {
  it('should handle normal case', () => {
    const result = yourFunction('input');
    expect(result).toBe('expected');
  });

  it('should handle edge case', () => {
    const result = yourFunction('');
    expect(result).toBe('');
  });

  it('should throw error on invalid input', () => {
    expect(() => yourFunction(null)).toThrow();
  });
});
```

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行特定包的测试
pnpm --filter @autodify/core test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 监听模式（开发时使用）
pnpm --filter @autodify/core test -- --watch
```

### 测试 Best Practices

- 测试应该独立且可重复
- 使用描述性的测试名称
- 一个测试只验证一个行为
- 避免测试实现细节
- Mock 外部依赖（API、文件系统等）
- 测试边界条件和错误情况

## 代码审查标准

### 审查检查清单

PR 审查时会检查以下方面：

#### 1. 功能性

- [ ] 代码实现了预期功能
- [ ] 没有引入新的 bug
- [ ] 处理了边界情况
- [ ] 错误处理得当

#### 2. 代码质量

- [ ] 代码清晰易读
- [ ] 函数职责单一
- [ ] 避免重复代码（DRY 原则）
- [ ] 适当的注释（必要时）
- [ ] 没有调试代码（console.log 等）

#### 3. 类型安全

- [ ] 正确的 TypeScript 类型
- [ ] 没有使用 `any`（除非必要）
- [ ] 类型导入正确

#### 4. 测试

- [ ] 有足够的测试覆盖
- [ ] 测试通过
- [ ] 测试有意义且正确

#### 5. 性能

- [ ] 没有明显的性能问题
- [ ] 避免不必要的计算
- [ ] 合理使用缓存

#### 6. 安全性

- [ ] 没有安全漏洞
- [ ] 输入验证
- [ ] 敏感信息处理得当

#### 7. 文档

- [ ] 公共 API 有 JSDoc 注释
- [ ] 复杂逻辑有说明
- [ ] README 和文档已更新（如需要）

#### 8. 兼容性

- [ ] 向后兼容（或有迁移说明）
- [ ] Breaking changes 已标注

### 审查礼仪

**对于审查者**：
- 提供建设性的反馈
- 解释为什么需要修改
- 区分必须修改和建议
- 及时响应

**对于贡献者**：
- 保持开放心态
- 不要对反馈过于防御
- 及时响应审查意见
- 不确定时主动询问

## 报告 Bug

使用 [Bug Report 模板](https://github.com/ORIGINAL_OWNER/autodify/issues/new?template=bug_report.md) 报告 bug。

请提供：
- 清晰的问题描述
- 重现步骤
- 期望行为
- 实际行为
- 环境信息（Node 版本、OS 等）
- 相关日志或截图

## 建议新功能

使用 [Feature Request 模板](https://github.com/ORIGINAL_OWNER/autodify/issues/new?template=feature_request.md) 提出功能建议。

请说明：
- 功能描述
- 使用场景
- 期望的 API 设计
- 替代方案（如有）

## 提问和讨论

- 使用 GitHub Discussions 进行讨论
- 加入我们的社区（如有）
- 查看现有的 Issues 和 PRs

## 许可证

通过贡献代码，你同意你的贡献将以 MIT 许可证发布。

## 致谢

感谢所有为 Autodify 做出贡献的开发者！

---

**如有任何疑问，欢迎在 Issues 中提出。**
