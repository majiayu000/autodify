/**
 * API Caller Template
 */

import { createWorkflow } from '../../builder/index.js';
import type { WorkflowTemplate } from '../types.js';

export const apiCallerTemplate: WorkflowTemplate = {
  metadata: {
    id: 'api-caller',
    name: 'API 调用',
    description: '调用外部 API 获取数据，并用 LLM 处理结果',
    category: 'automation',
    tags: ['API', 'HTTP', '自动化', '集成'],
    keywords: [
      'API',
      'HTTP',
      '接口',
      '调用',
      '请求',
      '集成',
      '外部服务',
      'webhook',
      'REST',
      '数据获取',
    ],
    nodeTypes: ['start', 'http-request', 'llm', 'end'],
    complexity: 2,
  },

  build: (params = {}) => {
    const apiUrl = (params['apiUrl'] as string) ?? 'https://api.example.com/data';
    const method = (params['method'] as 'get' | 'post') ?? 'get';
    const model = (params['model'] as string) ?? 'gpt-4o';
    const provider = (params['provider'] as string) ?? 'openai';
    const processPrompt =
      (params['processPrompt'] as string) ?? '请分析以下 API 返回的数据，并生成简洁的总结：';

    return createWorkflow({
      name: 'API 调用',
      description: '调用外部 API 并处理结果',
      icon: '🔌',
    })
      .addStart({
        variables: [
          {
            name: 'query',
            label: '查询参数',
            type: 'text-input',
            required: false,
            maxLength: 500,
          },
        ],
      })
      .addHttpRequest({
        id: 'http',
        title: 'API 请求',
        method,
        url: apiUrl,
        headers: [{ key: 'Content-Type', value: 'application/json' }],
        timeout: {
          connect: 10,
          read: 30,
          write: 10,
        },
      })
      .addLLM({
        id: 'llm',
        title: '处理结果',
        provider,
        model,
        temperature: 0.5,
        systemPrompt: processPrompt,
        userPrompt: '{{#http.body#}}',
      })
      .addEnd({
        id: 'end',
        outputs: [
          { name: 'result', source: ['llm', 'text'] },
          { name: 'raw_data', source: ['http', 'body'] },
        ],
      })
      .connect('start', 'http')
      .connect('http', 'llm')
      .connect('llm', 'end')
      .build();
  },
};
