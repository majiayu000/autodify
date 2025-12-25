/**
 * Variable Aggregator Node Metadata
 */

import type { NodeMeta } from '../types.js';

/**
 * Variable Aggregator 节点元信息
 */
export const variableAggregatorNodeMeta: NodeMeta = {
  type: 'variable-aggregator',
  displayName: '变量聚合',
  description: '合并多个变量',
  category: 'data',
  inputs: [
    {
      name: 'variables',
      type: 'any',
      description: '待合并的变量',
    },
  ],
  outputs: [
    {
      name: 'output',
      type: 'any',
      description: '聚合结果',
    },
  ],
  configFields: [
    {
      name: 'variables',
      type: 'array',
      description: '变量选择器列表',
      required: true,
    },
    {
      name: 'output_type',
      type: 'select',
      description: '输出类型',
      required: true,
    },
  ],
  examples: [],
  notes: ['常用于合并条件分支的输出'],
};
