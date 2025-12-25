/**
 * End Node Metadata
 */

import type { NodeMeta } from '../types.js';

/**
 * End 节点元信息
 */
export const endNodeMeta: NodeMeta = {
  type: 'end',
  displayName: '结束',
  description: '工作流出口节点，定义最终输出',
  category: 'basic',
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
      name: 'outputs',
      type: 'array',
      description: '输出变量列表',
      required: true,
    },
  ],
  examples: [
    {
      description: '输出 LLM 结果',
      config: {
        outputs: [
          {
            variable: 'result',
            value_selector: ['llm', 'text'],
          },
        ],
      },
    },
  ],
  notes: ['每个工作流至少需要一个 End 或 Answer 节点'],
};
