/**
 * RAG Q&A Template
 */

import { createWorkflow } from '../../builder/index.js';
import type { WorkflowTemplate } from '../types.js';

export const ragQATemplate: WorkflowTemplate = {
  metadata: {
    id: 'rag-qa',
    name: '知识库问答',
    description: '基于知识库检索的问答系统，先检索相关文档再生成回答',
    category: 'rag',
    tags: ['RAG', '知识库', '问答', '检索'],
    keywords: [
      '知识库',
      '文档',
      '检索',
      'RAG',
      '知识问答',
      '文档问答',
      '资料库',
      '数据库',
      'knowledge',
      'retrieval',
      '查询文档',
    ],
    nodeTypes: ['start', 'knowledge-retrieval', 'llm', 'end'],
    complexity: 2,
  },

  build: (params = {}) => {
    const datasetIds = (params['datasetIds'] as string[]) ?? ['your-dataset-id'];
    const topK = (params['topK'] as number) ?? 5;
    const scoreThreshold = (params['scoreThreshold'] as number) ?? 0.5;
    const model = (params['model'] as string) ?? 'gpt-4o';
    const provider = (params['provider'] as string) ?? 'openai';
    const systemPrompt =
      (params['systemPrompt'] as string) ??
      `你是一个专业的客服助手。请根据提供的参考资料回答用户的问题。

要求：
1. 只根据参考资料中的信息回答，不要编造
2. 如果参考资料中没有相关信息，请诚实地说"我没有找到相关信息"
3. 回答要简洁明了
4. 如果需要，可以引用资料中的具体内容`;

    return createWorkflow({
      name: '知识库问答',
      description: '基于知识库的 RAG 问答系统',
      icon: '📚',
    })
      .addStart({
        variables: [
          {
            name: 'query',
            label: '问题',
            type: 'paragraph',
            required: true,
            maxLength: 2000,
          },
        ],
      })
      .addKnowledgeRetrieval({
        id: 'retrieval',
        title: '知识检索',
        queryFrom: ['start', 'query'],
        datasetIds,
        topK,
        scoreThreshold,
        rerankingEnabled: true,
        rerankingModel: {
          provider: 'cohere',
          model: 'rerank-multilingual-v2.0',
        },
      })
      .addLLM({
        id: 'llm',
        title: '生成回答',
        provider,
        model,
        temperature: 0.5,
        systemPrompt,
        userPrompt: '{{#start.query#}}',
        context: {
          enabled: true,
          variableSelector: ['retrieval', 'result'],
        },
      })
      .addEnd({
        id: 'end',
        outputs: [{ name: 'answer', source: ['llm', 'text'] }],
      })
      .connect('start', 'retrieval')
      .connect('retrieval', 'llm')
      .connect('llm', 'end')
      .build();
  },
};
