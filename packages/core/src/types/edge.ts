/**
 * Edge type definitions for Dify DSL
 */

import type { NodeType } from './nodes.js';

/** Edge 数据 */
export interface EdgeData {
  sourceType: NodeType;
  targetType: NodeType;
  isInIteration: boolean;
  isInLoop?: boolean;
  iterationID?: string;
}

/** Edge 定义 */
export interface Edge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  type: 'custom';
  zIndex?: number;
  data: EdgeData;
}

/** 创建 Edge 的辅助函数参数 */
export interface CreateEdgeParams {
  id?: string;
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
  sourceType: NodeType;
  targetType: NodeType;
  isInIteration?: boolean;
  isInLoop?: boolean;
  iterationID?: string;
}

/**
 * 创建 Edge 的辅助函数
 */
export function createEdge(params: CreateEdgeParams): Edge {
  const {
    id = `${params.source}-${params.target}`,
    source,
    sourceHandle = 'source',
    target,
    targetHandle = 'target',
    sourceType,
    targetType,
    isInIteration = false,
    isInLoop = false,
    iterationID,
  } = params;

  return {
    id,
    source,
    sourceHandle,
    target,
    targetHandle,
    type: 'custom',
    zIndex: 0,
    data: {
      sourceType,
      targetType,
      isInIteration,
      isInLoop,
      ...(iterationID && { iterationID }),
    },
  };
}
