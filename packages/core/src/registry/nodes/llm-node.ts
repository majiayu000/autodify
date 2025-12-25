/**
 * LLM Node Metadata
 */

import type { NodeMeta } from '../types.js';

/**
 * LLM 节点元信息
 */
export const llmNodeMeta: NodeMeta = {
  type: 'llm',
  displayName: 'LLM',
  description: '调用大语言模型进行对话、生成、分类等任务',
  category: 'llm',
  inputs: [
    {
      name: 'context',
      type: 'any',
      description: '可选的上下文输入',
      required: false,
    },
  ],
  outputs: [
    {
      name: 'text',
      type: 'string',
      description: '模型生成的文本',
    },
  ],
  configFields: [
    {
      name: 'model',
      type: 'object',
      description: '模型配置',
      required: true,
    },
    {
      name: 'prompt_template',
      type: 'array',
      description: '提示词模板',
      required: true,
    },
    {
      name: 'memory',
      type: 'object',
      description: '对话记忆配置',
      required: false,
    },
    {
      name: 'context',
      type: 'object',
      description: '上下文配置',
      required: false,
    },
    {
      name: 'vision',
      type: 'object',
      description: '视觉能力配置',
      required: false,
    },
  ],
  examples: [
    {
      description: '简单问答',
      config: {
        model: {
          provider: 'openai',
          name: 'gpt-4o',
          mode: 'chat',
          completion_params: {
            temperature: 0.7,
          },
        },
        prompt_template: [
          { role: 'system', text: '你是一个有帮助的助手。' },
          { role: 'user', text: '{{#start.user_input#}}' },
        ],
      },
    },
  ],
  notes: ['temperature 范围 0-2', '支持多种模型提供商'],
};
