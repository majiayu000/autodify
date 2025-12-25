/**
 * Template Transform Node Metadata
 */

import type { NodeMeta } from '../types.js';

/**
 * Template Transform 节点元信息
 */
export const templateTransformNodeMeta: NodeMeta = {
  type: 'template-transform',
  displayName: '模板转换',
  description: '使用 Jinja2 模板转换数据',
  category: 'data',
  inputs: [
    {
      name: 'variables',
      type: 'any',
      description: '模板变量',
    },
  ],
  outputs: [
    {
      name: 'output',
      type: 'string',
      description: '模板输出',
    },
  ],
  configFields: [
    {
      name: 'template',
      type: 'template',
      description: 'Jinja2 模板',
      required: true,
    },
    {
      name: 'variables',
      type: 'array',
      description: '变量映射',
      required: true,
    },
  ],
  examples: [
    {
      description: '格式化输出',
      config: {
        template: '# {{ title }}\n\n{{ content }}',
        variables: [
          { variable: 'title', value_selector: ['start', 'title'] },
          { variable: 'content', value_selector: ['llm', 'text'] },
        ],
      },
    },
  ],
  notes: ['使用 Jinja2 语法'],
};
