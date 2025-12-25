# Prompts 统一管理

这个目录包含了 Autodify 项目中所有的 Prompt 模板和构建函数，提供统一的管理和复用。

## 目录结构

```
prompts/
├── common/              # 公共 prompt 组件
│   ├── dsl-format.ts   # DSL 格式说明
│   ├── node-types.ts   # 节点类型说明
│   ├── rules.ts        # 通用规则
│   └── index.ts        # 导出和辅助函数
├── generator/          # Generator 模块的 prompts
│   ├── system.ts       # 系统提示词
│   ├── examples.ts     # 示例工作流
│   ├── builders.ts     # Prompt 构建函数
│   └── index.ts        # 统一导出
├── planner/           # Planner 模块的 prompts
│   ├── system.ts      # 系统提示词
│   ├── examples.ts    # 示例规划
│   ├── builders.ts    # Prompt 构建函数
│   └── index.ts       # 统一导出
├── orchestrator/      # Orchestrator 模块的 prompts
│   ├── system.ts      # 系统提示词
│   ├── builders.ts    # Prompt 构建函数
│   └── index.ts       # 统一导出
└── index.ts           # 根导出文件
```

## 设计原则

### 1. DRY（Don't Repeat Yourself）
- 将公共的 prompt 片段提取到 `common/` 目录
- 避免在多个地方重复相同的内容
- 使用函数组合来构建完整的 prompts

### 2. 模块化
- 每个模块（generator, planner, orchestrator）有独立的目录
- 按功能分类：系统提示词、示例、构建函数
- 清晰的导出层次

### 3. 可组合性
- 提供构建函数而不是硬编码的字符串
- 支持参数化配置
- 便于扩展和定制

### 4. 向后兼容
- 原有的 `*/prompts.ts` 文件保留为重新导出
- 不影响现有代码的使用
- 逐步迁移到新的导入路径

## 使用方法

### 直接使用公共组件

```typescript
import {
  buildDSLFormatDoc,
  buildNodeTypesDoc,
  buildRulesDoc
} from '@autodify/core/prompts/common';

// 获取完整的 DSL 格式文档
const dslDoc = buildDSLFormatDoc();

// 获取特定节点类型的文档
const nodeDoc = buildNodeTypesDoc(['llm', 'knowledge-retrieval']);
```

### 使用 Generator Prompts

```typescript
import {
  buildGenerationPrompt,
  buildFixPrompt
} from '@autodify/core/prompts/generator';

// 构建生成提示词
const prompt = buildGenerationPrompt('创建一个翻译工作流');

// 构建修复提示词
const fixPrompt = buildFixPrompt(yamlContent, ['错误1', '错误2']);
```

### 使用 Planner Prompts

```typescript
import {
  PLANNER_SYSTEM_PROMPT,
  buildPlanningPrompt,
  buildFewShotPrompt
} from '@autodify/core/prompts/planner';

// 使用系统提示词
const systemPrompt = PLANNER_SYSTEM_PROMPT;

// 构建规划提示词
const planPrompt = buildPlanningPrompt('用户需求描述', '额外上下文');

// 获取少样本提示
const fewShot = buildFewShotPrompt();
```

### 使用 Orchestrator Prompts

```typescript
import {
  buildGenerationPromptFromPlan,
  buildOrchestratorFixPrompt,
  buildEditPrompt
} from '@autodify/core/prompts/orchestrator';

// 从规划构建生成提示
const genPrompt = buildGenerationPromptFromPlan(plan, {
  preferredProvider: 'openai',
  preferredModel: 'gpt-4o',
  datasetIds: ['dataset-123']
});

// 构建修复提示
const fixPrompt = buildOrchestratorFixPrompt(yaml, feedback);

// 构建编辑提示
const editPrompt = buildEditPrompt(dsl, '修改指令', ['node1', 'node2']);
```

## 扩展指南

### 添加新的公共组件

1. 在 `common/` 目录下创建新文件
2. 导出常量或函数
3. 在 `common/index.ts` 中导出

```typescript
// common/new-component.ts
export const NEW_COMPONENT = `...`;

// common/index.ts
export * from './new-component.js';
```

### 添加新的模块 Prompts

1. 创建新的模块目录
2. 添加 `system.ts`, `examples.ts`, `builders.ts`
3. 创建 `index.ts` 统一导出
4. 在根 `index.ts` 中导出

```typescript
// prompts/new-module/index.ts
export * from './system.js';
export * from './builders.js';

// prompts/index.ts
export * from './new-module/index.js';
```

### 自定义 Prompt 构建器

```typescript
import { buildDSLFormatDoc, buildNodeTypesDoc } from '../common/index.js';

export function buildCustomPrompt(userInput: string, options: CustomOptions): string {
  const parts: string[] = [];

  parts.push('## 系统说明');
  parts.push(buildDSLFormatDoc());

  if (options.includeNodeTypes) {
    parts.push(buildNodeTypesDoc(options.nodeTypes));
  }

  parts.push('## 用户输入');
  parts.push(userInput);

  return parts.join('\n\n');
}
```

## 迁移指南

### 从旧的导入路径迁移

**旧方式：**
```typescript
import { SYSTEM_PROMPT } from '../generator/prompts.js';
import { PLANNER_SYSTEM_PROMPT } from '../planner/prompts.js';
```

**新方式：**
```typescript
import { SYSTEM_PROMPT } from '../prompts/generator/index.js';
import { PLANNER_SYSTEM_PROMPT } from '../prompts/planner/index.js';
```

### 复用公共组件

**旧方式：**
```typescript
// 在多个文件中重复相同的 DSL 格式说明
const PROMPT = `...
## DSL 格式
\`\`\`yaml
version: "0.1.3"
...
\`\`\`
...`;
```

**新方式：**
```typescript
import { buildDSLFormatDoc } from '../prompts/common/index.js';

const PROMPT = `...
${buildDSLFormatDoc()}
...`;
```

## 最佳实践

1. **优先使用构建函数**：使用 `buildXxxPrompt()` 而不是直接拼接字符串
2. **参数化配置**：通过参数传递配置，而不是硬编码
3. **复用公共组件**：使用 `common/` 中的组件避免重复
4. **保持一致性**：遵循现有的命名和结构约定
5. **文档完善**：为新增的 prompts 添加注释和使用示例

## 维护注意事项

- 修改公共组件时要考虑对所有模块的影响
- 添加新的节点类型时更新 `common/node-types.ts`
- 保持示例的准确性和时效性
- 定期检查和清理未使用的 prompts
- 更新此 README 以反映最新的结构变化
