/**
 * Text Summarizer Template
 */

import { createWorkflow } from '../../builder/index.js';
import type { WorkflowTemplate } from '../types.js';

export const summarizerTemplate: WorkflowTemplate = {
  metadata: {
    id: 'summarizer',
    name: '文本摘要',
    description: '对长文本进行智能摘要，提取关键信息',
    category: 'analysis',
    tags: ['摘要', '总结', '分析', 'LLM'],
    keywords: [
      '摘要',
      '总结',
      '概括',
      '提取',
      '精简',
      'summary',
      'summarize',
      '要点',
      '关键信息',
      '长文本',
    ],
    nodeTypes: ['start', 'llm', 'end'],
    complexity: 1,
  },

  build: (params = {}) => {
    const style = (params['style'] as string) ?? 'bullet'; // 'bullet' | 'paragraph' | 'outline'
    const maxLength = (params['maxLength'] as number) ?? 500;
    const model = (params['model'] as string) ?? 'gpt-4o';
    const provider = (params['provider'] as string) ?? 'openai';

    let systemPrompt: string;
    switch (style) {
      case 'bullet':
        systemPrompt = `你是文本摘要专家。请将用户提供的文本总结为简洁的要点列表。

要求：
1. 提取 3-7 个核心要点
2. 每个要点一句话，简洁明了
3. 使用 "•" 作为要点符号
4. 保持原文的关键信息和数据
5. 总字数不超过 ${maxLength} 字`;
        break;
      case 'paragraph':
        systemPrompt = `你是文本摘要专家。请将用户提供的文本总结为一段简洁的摘要。

要求：
1. 摘要应包含原文的核心观点和关键信息
2. 使用流畅的段落形式
3. 保持客观中立的语气
4. 总字数不超过 ${maxLength} 字`;
        break;
      case 'outline':
        systemPrompt = `你是文本摘要专家。请将用户提供的文本整理为结构化的大纲。

要求：
1. 使用多级标题结构
2. 提取主要论点和支撑细节
3. 保持逻辑层次清晰
4. 总字数不超过 ${maxLength} 字`;
        break;
      default:
        systemPrompt = `请总结以下文本，提取关键信息，总字数不超过 ${maxLength} 字。`;
    }

    return createWorkflow({
      name: '文本摘要',
      description: '对长文本进行智能摘要',
      icon: '📝',
    })
      .addStart({
        variables: [
          {
            name: 'text',
            label: '待摘要文本',
            type: 'paragraph',
            required: true,
            maxLength: 50000,
          },
        ],
      })
      .addLLM({
        id: 'llm',
        title: '生成摘要',
        provider,
        model,
        temperature: 0.3,
        maxTokens: 2000,
        systemPrompt,
        userPrompt: '{{#start.text#}}',
      })
      .addEnd({
        id: 'end',
        outputs: [{ name: 'summary', source: ['llm', 'text'] }],
      })
      .connect('start', 'llm')
      .connect('llm', 'end')
      .build();
  },
};
