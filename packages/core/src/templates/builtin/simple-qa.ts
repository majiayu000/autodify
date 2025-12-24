/**
 * Simple Q&A Template
 */

import { createWorkflow } from '../../builder/index.js';
import type { WorkflowTemplate } from '../types.js';

export const simpleQATemplate: WorkflowTemplate = {
  metadata: {
    id: 'simple-qa',
    name: '简单问答',
    description: '基础的单轮问答工作流，接收问题并使用 LLM 生成回答',
    category: 'qa',
    tags: ['问答', 'LLM', '基础'],
    keywords: ['问答', '回答', '对话', '聊天', '助手', '问问题', 'qa', 'chat'],
    nodeTypes: ['start', 'llm', 'end'],
    complexity: 1,
  },

  build: (params = {}) => {
    const systemPrompt = (params['systemPrompt'] as string) ??
      '你是一个有帮助的 AI 助手。请根据用户的问题提供准确、简洁的回答。';
    const inputLabel = (params['inputLabel'] as string) ?? '问题';
    const model = (params['model'] as string) ?? 'gpt-4o';
    const provider = (params['provider'] as string) ?? 'openai';

    return createWorkflow({
      name: '简单问答',
      description: '基础的单轮问答工作流',
      icon: '💬',
    })
      .addStart({
        variables: [
          {
            name: 'question',
            label: inputLabel,
            type: 'paragraph',
            required: true,
            maxLength: 2000,
          },
        ],
      })
      .addLLM({
        id: 'llm',
        title: 'AI 回答',
        provider,
        model,
        temperature: 0.7,
        systemPrompt,
        userPrompt: '{{#start.question#}}',
      })
      .addEnd({
        id: 'end',
        outputs: [{ name: 'answer', source: ['llm', 'text'] }],
      })
      .connect('start', 'llm')
      .connect('llm', 'end')
      .build();
  },
};
