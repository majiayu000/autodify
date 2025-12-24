/**
 * RAG Q&A Example
 */

import type { FewShotExample } from '../types.js';
import { ragQATemplate } from '../../templates/index.js';

export const ragQAExample: FewShotExample = {
  metadata: {
    id: 'example-rag-qa',
    name: '知识库问答',
    description: '基于知识库检索的问答工作流，先检索相关文档再生成回答',
    category: 'rag',
    keywords: ['知识库', 'rag', '检索', '文档', '问答', '向量'],
    nodeTypes: ['start', 'knowledge-retrieval', 'llm', 'end'],
    complexity: 2,
  },
  prompt: '创建一个知识库问答工作流，根据用户问题检索相关文档，然后基于检索结果生成回答',
  dsl: ragQATemplate.build({
    datasetIds: ['your-dataset-id'],
    topK: 5,
  }),
  explanation: '这个工作流使用 RAG (Retrieval-Augmented Generation) 模式：首先通过知识检索节点从向量数据库中检索相关文档片段，然后将检索结果作为上下文提供给 LLM，让 AI 基于实际知识库内容回答问题，确保回答的准确性。',
};
