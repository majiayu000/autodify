/**
 * Knowledge Retrieval Node Metadata
 */

import type { NodeMeta } from '../types.js';

/**
 * Knowledge Retrieval 节点元信息
 */
export const knowledgeRetrievalNodeMeta: NodeMeta = {
  type: 'knowledge-retrieval',
  displayName: '知识检索',
  description: '从知识库中检索相关文档',
  category: 'data',
  inputs: [
    {
      name: 'query',
      type: 'string',
      description: '检索查询',
      required: true,
    },
  ],
  outputs: [
    {
      name: 'result',
      type: 'array[object]',
      description: '检索结果列表',
    },
  ],
  configFields: [
    {
      name: 'query_variable_selector',
      type: 'array',
      description: '查询变量选择器',
      required: true,
    },
    {
      name: 'dataset_ids',
      type: 'array',
      description: '知识库 ID 列表',
      required: true,
    },
    {
      name: 'retrieval_mode',
      type: 'select',
      description: '检索模式',
      required: true,
      options: ['single', 'multiple'],
    },
  ],
  examples: [
    {
      description: '多路检索',
      config: {
        query_variable_selector: ['start', 'user_input'],
        dataset_ids: ['dataset-xxx'],
        retrieval_mode: 'multiple',
        multiple_retrieval_config: {
          top_k: 5,
          score_threshold: 0.5,
          reranking_enable: true,
        },
      },
    },
  ],
  notes: ['需要提前在 Dify 中创建知识库'],
};
