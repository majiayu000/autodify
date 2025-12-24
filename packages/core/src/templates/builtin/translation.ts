/**
 * Translation Template
 */

import { createWorkflow } from '../../builder/index.js';
import type { WorkflowTemplate } from '../types.js';

export const translationTemplate: WorkflowTemplate = {
  metadata: {
    id: 'translation',
    name: '智能翻译',
    description: '自动检测语言并翻译，支持中英文互译',
    category: 'translation',
    tags: ['翻译', 'LLM', '多语言'],
    keywords: ['翻译', '中英', '英中', '互译', '语言', 'translate', 'translation', '中文', '英文'],
    nodeTypes: ['start', 'llm', 'end'],
    complexity: 1,
  },

  build: (params = {}) => {
    const targetLanguage = (params['targetLanguage'] as string) ?? '';
    const model = (params['model'] as string) ?? 'gpt-4o';
    const provider = (params['provider'] as string) ?? 'openai';

    let systemPrompt: string;
    if (targetLanguage) {
      systemPrompt = `你是专业翻译。请将用户输入的文本翻译成${targetLanguage}。
要求：
1. 保持原文的语气和风格
2. 专业术语翻译准确
3. 只输出翻译结果，不要解释`;
    } else {
      systemPrompt = `你是专业翻译。请判断输入文本的语言：
- 如果是中文，翻译成英文
- 如果是英文，翻译成中文
- 如果是其他语言，翻译成中文

要求：
1. 保持原文的语气和风格
2. 专业术语翻译准确
3. 只输出翻译结果，不要解释`;
    }

    return createWorkflow({
      name: '智能翻译',
      description: '自动检测语言并翻译',
      icon: '🌐',
    })
      .addStart({
        variables: [
          {
            name: 'text',
            label: '待翻译文本',
            type: 'paragraph',
            required: true,
            maxLength: 10000,
          },
        ],
      })
      .addLLM({
        id: 'llm',
        title: '翻译',
        provider,
        model,
        temperature: 0.3,
        systemPrompt,
        userPrompt: '{{#start.text#}}',
      })
      .addEnd({
        id: 'end',
        outputs: [{ name: 'translation', source: ['llm', 'text'] }],
      })
      .connect('start', 'llm')
      .connect('llm', 'end')
      .build();
  },
};
