/**
 * Orchestrator Prompt Builders
 */

import type { WorkflowPlan } from '../../planner/types.js';
import type { ValidationFeedback } from '../../orchestrator/types.js';
import type { DifyDSL } from '../../types/index.js';
import { stringifyYAML } from '../../utils/yaml.js';

/**
 * 从规划构建生成提示词
 */
export function buildGenerationPromptFromPlan(
  plan: WorkflowPlan,
  request: {
    preferredProvider?: string;
    preferredModel?: string;
    datasetIds?: string[];
  }
): string {
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
 * 构建修复提示词
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
 * 构建编辑提示词
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
