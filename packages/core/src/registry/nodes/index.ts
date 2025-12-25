/**
 * Node Registry - Unified exports for all node metadata
 */

import type { NodeMeta } from '../types.js';
import { startNodeMeta } from './start-node.js';
import { endNodeMeta } from './end-node.js';
import { answerNodeMeta } from './answer-node.js';
import { llmNodeMeta } from './llm-node.js';
import { knowledgeRetrievalNodeMeta } from './knowledge-retrieval-node.js';
import { questionClassifierNodeMeta } from './question-classifier-node.js';
import { ifElseNodeMeta } from './if-else-node.js';
import { codeNodeMeta } from './code-node.js';
import { httpRequestNodeMeta } from './http-request-node.js';
import { templateTransformNodeMeta } from './template-transform-node.js';
import { variableAggregatorNodeMeta } from './variable-aggregator-node.js';

// Export individual node metadata
export {
  startNodeMeta,
  endNodeMeta,
  answerNodeMeta,
  llmNodeMeta,
  knowledgeRetrievalNodeMeta,
  questionClassifierNodeMeta,
  ifElseNodeMeta,
  codeNodeMeta,
  httpRequestNodeMeta,
  templateTransformNodeMeta,
  variableAggregatorNodeMeta,
};

/**
 * 所有节点元信息
 */
export const nodeMetaRegistry: Record<string, NodeMeta> = {
  start: startNodeMeta,
  end: endNodeMeta,
  answer: answerNodeMeta,
  llm: llmNodeMeta,
  'knowledge-retrieval': knowledgeRetrievalNodeMeta,
  'question-classifier': questionClassifierNodeMeta,
  'if-else': ifElseNodeMeta,
  code: codeNodeMeta,
  'http-request': httpRequestNodeMeta,
  'template-transform': templateTransformNodeMeta,
  'variable-aggregator': variableAggregatorNodeMeta,
};

/**
 * 获取节点元信息
 */
export function getNodeMeta(type: string): NodeMeta | undefined {
  return nodeMetaRegistry[type];
}

/**
 * 获取所有节点类型
 */
export function getAllNodeTypes(): string[] {
  return Object.keys(nodeMetaRegistry);
}

/**
 * 按分类获取节点
 */
export function getNodesByCategory(category: string): NodeMeta[] {
  return Object.values(nodeMetaRegistry).filter((meta) => meta.category === category);
}
