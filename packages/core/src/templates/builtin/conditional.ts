/**
 * Conditional Workflow Template
 */

import { createWorkflow } from '../../builder/index.js';
import type { WorkflowTemplate } from '../types.js';

export const conditionalTemplate: WorkflowTemplate = {
  metadata: {
    id: 'conditional',
    name: '条件分支',
    description: '根据条件判断执行不同的处理逻辑',
    category: 'automation',
    tags: ['条件', '分支', 'IF/ELSE', '逻辑'],
    keywords: ['条件', '判断', 'if', 'else', '分支', '逻辑', '不同处理', '选择', '决策'],
    nodeTypes: ['start', 'if-else', 'llm', 'variable-aggregator', 'end'],
    complexity: 2,
  },

  build: (params = {}) => {
    const model = (params['model'] as string) ?? 'gpt-4o';
    const provider = (params['provider'] as string) ?? 'openai';

    return (
      createWorkflow({
        name: '条件分支',
        description: '根据条件判断执行不同的处理逻辑',
        icon: '🔀',
      })
        .addStart({
          variables: [
            {
              name: 'input',
              label: '输入内容',
              type: 'paragraph',
              required: true,
              maxLength: 5000,
            },
            {
              name: 'mode',
              label: '处理模式',
              type: 'select',
              required: true,
              options: ['详细', '简洁'],
              default: '简洁',
            },
          ],
        })
        .addIfElse({
          id: 'condition',
          title: '检查模式',
          conditions: [
            {
              id: 'detailed',
              logicalOperator: 'and',
              rules: [
                {
                  variableSelector: ['start', 'mode'],
                  operator: '=',
                  value: '详细',
                },
              ],
            },
          ],
        })
        .addLLM({
          id: 'llm-detailed',
          title: '详细处理',
          provider,
          model,
          temperature: 0.7,
          maxTokens: 4000,
          systemPrompt: '请对用户输入进行详细分析和处理，提供全面的回复。',
          userPrompt: '{{#start.input#}}',
        })
        .addLLM({
          id: 'llm-brief',
          title: '简洁处理',
          provider,
          model,
          temperature: 0.5,
          maxTokens: 1000,
          systemPrompt: '请对用户输入进行简洁处理，只提供核心要点。',
          userPrompt: '{{#start.input#}}',
        })
        .addAggregator({
          id: 'aggregator',
          title: '结果聚合',
          variables: [
            ['llm-detailed', 'text'],
            ['llm-brief', 'text'],
          ],
          outputType: 'string',
        })
        .addEnd({
          id: 'end',
          outputs: [{ name: 'result', source: ['aggregator', 'output'] }],
        })
        // 连接
        .connect('start', 'condition')
        .connect('condition', 'llm-detailed', { sourceHandle: 'detailed' })
        .connect('condition', 'llm-brief', { sourceHandle: 'false' })
        .connect('llm-detailed', 'aggregator')
        .connect('llm-brief', 'aggregator')
        .connect('aggregator', 'end')
        .build()
    );
  },
};
