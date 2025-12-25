/**
 * Start Node Metadata
 */

import type { NodeMeta } from '../types.js';

/**
 * Start 节点元信息
 */
export const startNodeMeta: NodeMeta = {
  type: 'start',
  displayName: '开始',
  description: '工作流入口节点，定义工作流的输入变量',
  category: 'basic',
  inputs: [],
  outputs: [
    {
      name: 'variables',
      type: 'any',
      description: '定义的输入变量',
    },
  ],
  configFields: [
    {
      name: 'variables',
      type: 'array',
      description: '输入变量定义列表',
      required: true,
    },
  ],
  examples: [
    {
      description: '简单文本输入',
      config: {
        variables: [
          {
            variable: 'user_input',
            label: '用户输入',
            type: 'paragraph',
            required: true,
            max_length: 2000,
          },
        ],
      },
    },
  ],
  notes: ['每个工作流必须有且仅有一个 Start 节点'],
};
