/**
 * LLM-Based Planner - Uses LLM for complex workflow planning
 */

import type { WorkflowPlan, WorkflowIntent } from './types.js';
import { buildPlanningPrompt, buildFewShotPrompt } from './prompts.js';
import { planFromRules } from './rule-based-planner.js';
import { inferInputVariables, inferOutputs } from './workflow-helpers.js';

/**
 * Plan workflow using LLM
 */
export async function planWithLLM(
  userRequest: string,
  intent: WorkflowIntent,
  _apiKey: string,
  _provider: string,
  _model: string
): Promise<WorkflowPlan> {
  // Build prompt (for future LLM integration)
  const fewShotContext = buildFewShotPrompt();
  // Prepare prompt for future LLM call - currently unused
  void buildPlanningPrompt(userRequest, fewShotContext);

  // For now, fall back to rule-based since we don't have LLM call implementation here
  // In production, this would call the LLM API
  console.warn('LLM planning not implemented, falling back to rule-based');
  return planFromRules(userRequest, intent);
}

/**
 * Plan from matched template
 */
export function planFromTemplate(
  userRequest: string,
  template: { metadata: { name: string; description: string; nodeTypes: string[] } },
  intent: WorkflowIntent
): WorkflowPlan {
  const nodes = template.metadata.nodeTypes.map((type, index) => ({
    id: `${type}-${index}`,
    type: type as any,
    title: getNodeTitle(type),
    description: getNodeDescription(type),
  }));

  const edges = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      source: nodes[i]!.id,
      target: nodes[i + 1]!.id,
    });
  }

  return {
    name: template.metadata.name,
    description: template.metadata.description,
    intent,
    nodes,
    edges,
    inputVariables: inferInputVariables(userRequest, intent),
    outputs: inferOutputs(nodes),
    confidence: 0.85,
  };
}

/**
 * Get default title for node type
 */
function getNodeTitle(type: string): string {
  const titles: Record<string, string> = {
    'start': '开始',
    'end': '结束',
    'answer': '回答',
    'llm': 'AI 处理',
    'knowledge-retrieval': '知识检索',
    'question-classifier': '问题分类',
    'if-else': '条件判断',
    'code': '代码执行',
    'http-request': 'HTTP 请求',
    'variable-aggregator': '变量聚合',
    'template-transform': '模板转换',
  };
  return titles[type] ?? type;
}

/**
 * Get default description for node type
 */
function getNodeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'start': '接收用户输入',
    'end': '输出结果',
    'answer': '直接回答用户',
    'llm': '使用大语言模型处理',
    'knowledge-retrieval': '从知识库检索相关内容',
    'question-classifier': '对用户问题进行分类',
    'if-else': '根据条件执行不同分支',
    'code': '执行自定义代码',
    'http-request': '调用外部 API',
    'variable-aggregator': '聚合多个变量',
    'template-transform': '转换数据格式',
  };
  return descriptions[type] ?? '';
}
