/**
 * IF/ELSE Node Metadata
 */

import type { NodeMeta } from '../types.js';

/**
 * IF/ELSE 节点元信息
 */
export const ifElseNodeMeta: NodeMeta = {
  type: 'if-else',
  displayName: '条件分支',
  description: '根据条件判断路由到不同分支',
  category: 'logic',
  inputs: [
    {
      name: 'any',
      type: 'any',
      description: '任意输入',
    },
  ],
  outputs: [],
  configFields: [
    {
      name: 'conditions',
      type: 'array',
      description: '条件分支列表',
      required: true,
    },
  ],
  examples: [
    {
      description: '检查是否为空',
      config: {
        conditions: [
          {
            id: 'cond-1',
            logical_operator: 'and',
            conditions: [
              {
                variable_selector: ['start', 'user_input'],
                comparison_operator: 'is not empty',
                value: '',
              },
            ],
          },
        ],
      },
    },
  ],
  multipleOutputs: true,
  notes: ['Edge sourceHandle: 条件 ID 或 "false"'],
};
