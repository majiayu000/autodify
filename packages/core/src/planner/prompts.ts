/**
 * Workflow Planner Prompts
 */

import type { WorkflowPlan } from './types.js';

/**
 * System prompt for workflow planning
 */
export const PLANNER_SYSTEM_PROMPT = `你是一个专业的 Dify 工作流规划专家。你的任务是根据用户的自然语言描述，分析需求并规划一个合理的工作流结构。

## 你需要做的事情

1. **理解意图**：分析用户的需求，识别核心目标和关键要求
2. **识别特性**：确定需要的功能特性（LLM、RAG、条件分支、代码执行等）
3. **规划节点**：设计合理的节点结构和连接关系
4. **定义输入输出**：明确工作流的输入变量和输出结果

## 可用的节点类型

- **start**: 开始节点，定义输入变量
- **end**: 结束节点，定义输出
- **answer**: 直接回答节点（用于流式输出）
- **llm**: LLM 节点，调用大语言模型
- **knowledge-retrieval**: 知识库检索节点
- **question-classifier**: 问题分类器
- **if-else**: 条件分支节点
- **code**: 代码执行节点（Python/JavaScript）
- **template-transform**: 模板转换节点
- **variable-aggregator**: 变量聚合节点
- **variable-assigner**: 变量赋值节点
- **iteration**: 迭代节点
- **loop**: 循环节点
- **parameter-extractor**: 参数提取节点
- **http-request**: HTTP 请求节点
- **tool**: 工具节点
- **agent**: 智能体节点
- **document-extractor**: 文档提取节点
- **list-operator**: 列表操作节点

## 设计原则

1. **简洁优先**：在满足需求的前提下，使用最少的节点
2. **清晰连接**：确保节点之间的连接关系清晰合理
3. **合理分支**：条件分支要有明确的判断逻辑
4. **错误处理**：考虑可能的错误情况
5. **变量命名**：使用有意义的变量名

## 输出格式

请以 JSON 格式输出工作流规划，包含以下字段：
- name: 工作流名称
- description: 工作流描述
- intent: 提取的意图信息
- nodes: 节点列表
- edges: 边（连接）列表
- inputVariables: 输入变量列表
- outputs: 输出定义列表
- confidence: 置信度 (0-1)
- alternatives: 可选的替代方案说明`;

/**
 * Build the planning prompt with user request
 */
export function buildPlanningPrompt(userRequest: string, context?: string): string {
  let prompt = `## 用户需求\n\n${userRequest}`;

  if (context) {
    prompt += `\n\n## 额外上下文\n\n${context}`;
  }

  prompt += `\n\n请分析上述需求，规划一个合理的 Dify 工作流结构。以 JSON 格式输出规划结果。`;

  return prompt;
}

/**
 * Example plan for few-shot context
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
 * Build few-shot prompt with example
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
