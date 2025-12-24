/**
 * Orchestrator Prompts
 */

import type { WorkflowPlan } from '../planner/types.js';
import type { ValidationFeedback } from './types.js';
import { stringifyYAML } from '../utils/yaml.js';
import type { DifyDSL } from '../types/index.js';

/**
 * System prompt for DSL generation
 */
export const GENERATION_SYSTEM_PROMPT = `你是一个专业的 Dify 工作流 DSL 生成专家。你的任务是根据工作流规划生成符合 Dify 格式的 YAML DSL。

## DSL 格式要求

1. **版本**: version: '0.5.0'
2. **类型**: kind: 'app'
3. **应用配置**: app 对象包含 name, mode, icon, icon_type, description
4. **工作流**: workflow.graph 包含 nodes 和 edges

## 节点结构

每个节点必须包含:
- id: 唯一标识符
- type: 'custom'
- data: 节点数据，包含 type, title 和其他配置

## 常见节点类型

### start 节点
\`\`\`yaml
- id: start
  type: custom
  data:
    type: start
    title: 开始
    variables:
      - label: 用户输入
        variable: input
        type: paragraph
        required: true
        max_length: 5000
\`\`\`

### llm 节点
\`\`\`yaml
- id: llm-1
  type: custom
  data:
    type: llm
    title: AI 处理
    model:
      provider: openai
      name: gpt-4o
      mode: chat
      completion_params:
        temperature: 0.7
        max_tokens: 4096
    prompt_template:
      - role: system
        text: 你是一个助手
      - role: user
        text: '{{#start.input#}}'
\`\`\`

### knowledge-retrieval 节点
\`\`\`yaml
- id: retrieval
  type: custom
  data:
    type: knowledge-retrieval
    title: 知识检索
    query_variable_selector:
      - start
      - input
    dataset_ids:
      - dataset-id-here
    retrieval_mode: multiple
    multiple_retrieval_config:
      top_k: 5
      score_threshold: 0.5
\`\`\`

### if-else 节点
\`\`\`yaml
- id: condition
  type: custom
  data:
    type: if-else
    title: 条件判断
    conditions:
      - id: case1
        logical_operator: and
        conditions:
          - variable_selector:
              - start
              - mode
            comparison_operator: '='
            value: 详细
\`\`\`

### end 节点
\`\`\`yaml
- id: end
  type: custom
  data:
    type: end
    title: 结束
    outputs:
      - variable: result
        value_selector:
          - llm-1
          - text
\`\`\`

## 边结构

\`\`\`yaml
edges:
  - id: edge-1
    source: start
    target: llm-1
    sourceHandle: source
    targetHandle: target
\`\`\`

对于分支节点，sourceHandle 需要指定分支 ID：
\`\`\`yaml
  - id: edge-2
    source: condition
    target: llm-detailed
    sourceHandle: case1
\`\`\`

## 变量引用

使用 {{#nodeId.variable#}} 格式引用变量，例如：
- {{#start.input#}} - 引用开始节点的 input 变量
- {{#llm-1.text#}} - 引用 LLM 节点的输出
- {{#retrieval.result#}} - 引用检索节点的结果

## 重要规则

1. 所有节点 ID 必须唯一
2. 边必须连接存在的节点
3. 变量引用必须指向有效的节点和变量
4. 工作流必须有且只有一个 start 节点
5. 工作流必须至少有一个 end 节点
6. 不能有孤立节点（除了 start 节点，每个节点都应该有入边）

请只输出 YAML 格式的 DSL，不要包含其他解释。`;

/**
 * Build generation prompt from plan
 */
export function buildGenerationPromptFromPlan(plan: WorkflowPlan, request: {
  preferredProvider?: string;
  preferredModel?: string;
  datasetIds?: string[];
}): string {
  const parts: string[] = [];

  parts.push('## 工作流规划\n');
  parts.push(`名称: ${plan.name}`);
  parts.push(`描述: ${plan.description}`);
  parts.push(`复杂度: ${plan.intent.complexity}/5\n`);

  parts.push('### 节点规划\n');
  for (const node of plan.nodes) {
    parts.push(`- ${node.id} (${node.type}): ${node.title} - ${node.description}`);
  }

  parts.push('\n### 连接规划\n');
  for (const edge of plan.edges) {
    const handleInfo = edge.sourceHandle ? ` [handle: ${edge.sourceHandle}]` : '';
    parts.push(`- ${edge.source} -> ${edge.target}${handleInfo}`);
  }

  parts.push('\n### 输入变量\n');
  for (const v of plan.inputVariables) {
    parts.push(`- ${v.name} (${v.type}): ${v.label}${v.required ? ' [必填]' : ''}`);
  }

  parts.push('\n### 输出定义\n');
  for (const o of plan.outputs) {
    parts.push(`- ${o.name}: 来自 ${o.source[0]}.${o.source[1]}`);
  }

  // Configuration hints
  parts.push('\n### 配置要求\n');
  parts.push(`- 模型提供商: ${request.preferredProvider ?? 'openai'}`);
  parts.push(`- 模型: ${request.preferredModel ?? 'gpt-4o'}`);

  if (request.datasetIds && request.datasetIds.length > 0) {
    parts.push(`- 知识库 ID: ${request.datasetIds.join(', ')}`);
  }

  parts.push('\n请根据以上规划生成完整的 Dify 工作流 DSL (YAML 格式)。');

  return parts.join('\n');
}

/**
 * Build fix prompt for validation errors
 */
export function buildOrchestratorFixPrompt(
  currentYaml: string,
  feedback: ValidationFeedback
): string {
  const parts: string[] = [];

  parts.push('## 当前 DSL\n');
  parts.push('```yaml');
  parts.push(currentYaml);
  parts.push('```\n');

  parts.push('## 验证错误\n');
  for (const error of feedback.errors) {
    parts.push(`- ❌ ${error}`);
  }

  if (feedback.suggestions.length > 0) {
    parts.push('\n## 修复建议\n');
    for (const suggestion of feedback.suggestions) {
      parts.push(`- 💡 ${suggestion}`);
    }
  }

  parts.push('\n请修复以上错误，输出修正后的完整 YAML DSL。');

  return parts.join('\n');
}

/**
 * System prompt for editing workflows
 */
export const EDIT_SYSTEM_PROMPT = `你是一个专业的 Dify 工作流编辑专家。你的任务是根据用户的编辑指令修改现有的工作流 DSL。

## 编辑原则

1. **最小改动**: 只修改需要改动的部分，保持其他配置不变
2. **保持一致性**: 确保修改后的节点 ID、变量引用保持一致
3. **验证连接**: 添加或删除节点时，确保边的连接正确
4. **保留配置**: 不要删除或修改用户没有要求改动的配置

## 常见编辑操作

1. **添加节点**: 在适当位置插入新节点，并更新相关边
2. **删除节点**: 删除节点及其相关边，修复断开的连接
3. **修改节点**: 更新节点的标题、提示词、模型配置等
4. **调整连接**: 修改节点之间的连接关系
5. **修改变量**: 更新输入变量或输出定义

请只输出修改后的完整 YAML DSL，不要包含其他解释。`;

/**
 * Build edit prompt
 */
export function buildEditPrompt(
  currentDsl: DifyDSL,
  instruction: string,
  targetNodes?: string[]
): string {
  const parts: string[] = [];

  parts.push('## 当前工作流 DSL\n');
  parts.push('```yaml');
  parts.push(stringifyYAML(currentDsl));
  parts.push('```\n');

  parts.push('## 编辑指令\n');
  parts.push(instruction);

  if (targetNodes && targetNodes.length > 0) {
    parts.push('\n## 目标节点\n');
    parts.push(`请重点关注以下节点: ${targetNodes.join(', ')}`);
  }

  parts.push('\n请根据以上指令修改工作流，输出完整的 YAML DSL。');

  return parts.join('\n');
}
