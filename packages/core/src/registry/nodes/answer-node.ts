/**
 * Answer Node Metadata
 */

import type { NodeMeta } from '../types.js';

/**
 * Answer 节点元信息
 */
export const answerNodeMeta: NodeMeta = {
  type: 'answer',
  displayName: '回答',
  description: '流式输出节点，用于 Chatflow 对话场景',
  category: 'basic',
  inputs: [
    {
      name: 'any',
      type: 'any',
      description: '任意输入',
    },
  ],
  outputs: [],
  configFields: [
    {
      name: 'answer',
      type: 'template',
      description: '回答内容模板，支持变量引用',
      required: true,
    },
  ],
  examples: [
    {
      description: '输出 LLM 回答',
      config: {
        answer: '{{#llm.text#}}',
      },
    },
  ],
  notes: ['仅用于 Chatflow 模式', '支持流式输出'],
};
