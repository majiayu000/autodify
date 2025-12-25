/**
 * Planner Example Plans
 */

import type { WorkflowPlan } from '../../planner/types.js';

/**
 * 示例规划
 */
export const EXAMPLE_PLAN: WorkflowPlan = {
  name: '智能问答助手',
  description: '接收用户问题，从知识库检索相关信息后生成回答',
  intent: {
    action: '问答',
    domain: '知识库',
    requirements: ['检索相关文档', '生成准确回答'],
    features: [
      { type: 'rag', description: '知识库检索', required: true },
      { type: 'llm', description: 'LLM 生成回答', required: true },
    ],
    complexity: 2,
  },
  nodes: [
    {
      id: 'start',
      type: 'start',
      title: '开始',
      description: '接收用户问题',
    },
    {
      id: 'retrieval',
      type: 'knowledge-retrieval',
      title: '知识检索',
      description: '从知识库检索相关文档',
      configHints: { topK: 5 },
    },
    {
      id: 'llm',
      type: 'llm',
      title: '生成回答',
      description: '基于检索结果生成回答',
      configHints: { temperature: 0.7 },
    },
    {
      id: 'end',
      type: 'end',
      title: '结束',
      description: '输出回答结果',
    },
  ],
  edges: [
    { source: 'start', target: 'retrieval' },
    { source: 'retrieval', target: 'llm' },
    { source: 'llm', target: 'end' },
  ],
  inputVariables: [
    {
      name: 'question',
      label: '问题',
      type: 'paragraph',
      required: true,
      description: '用户的问题',
    },
  ],
  outputs: [
    {
      name: 'answer',
      source: ['llm', 'text'],
      description: 'AI 生成的回答',
    },
  ],
  confidence: 0.9,
  alternatives: ['可以添加问题分类节点，针对不同类型问题使用不同的知识库'],
};

/**
 * 构建少样本提示词
 */
export function buildFewShotPrompt(): string {
  return `## 示例

用户需求：创建一个知识库问答工作流，根据用户问题检索相关文档并生成回答

规划结果：
\`\`\`json
${JSON.stringify(EXAMPLE_PLAN, null, 2)}
\`\`\`

请参考以上示例格式输出你的规划结果。`;
}
