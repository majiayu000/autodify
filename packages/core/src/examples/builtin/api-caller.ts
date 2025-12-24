/**
 * API Caller Example
 */

import type { FewShotExample } from '../types.js';
import { apiCallerTemplate } from '../../templates/index.js';

export const apiCallerExample: FewShotExample = {
  metadata: {
    id: 'example-api-caller',
    name: 'API 数据获取',
    description: '调用外部 API 获取数据并用 LLM 处理结果',
    category: 'api',
    keywords: ['api', 'http', '接口', '请求', '获取', '集成', 'webhook'],
    nodeTypes: ['start', 'http-request', 'llm', 'end'],
    complexity: 2,
  },
  prompt: '创建一个工作流，调用外部 API 获取数据，然后用 AI 分析和总结返回的结果',
  dsl: apiCallerTemplate.build({
    apiUrl: 'https://api.example.com/data',
    method: 'get',
    processPrompt: '请分析以下 API 返回的数据，并生成简洁的总结：',
  }),
  explanation: '这个工作流展示了如何集成外部 API：HTTP 请求节点调用外部接口获取数据，LLM 节点对 API 返回的数据进行分析和处理。适合需要获取实时数据并进行智能分析的场景，如天气查询、新闻摘要等。',
};
