/**
 * Code Node Metadata
 */

import type { NodeMeta } from '../types.js';

/**
 * Code 节点元信息
 */
export const codeNodeMeta: NodeMeta = {
  type: 'code',
  displayName: '代码执行',
  description: '执行自定义 Python 或 JavaScript 代码',
  category: 'advanced',
  inputs: [
    {
      name: 'variables',
      type: 'any',
      description: '输入变量',
    },
  ],
  outputs: [
    {
      name: 'outputs',
      type: 'any',
      description: '代码输出',
    },
  ],
  configFields: [
    {
      name: 'code_language',
      type: 'select',
      description: '代码语言',
      required: true,
      options: ['python3', 'javascript'],
    },
    {
      name: 'code',
      type: 'code',
      description: '代码内容',
      required: true,
    },
    {
      name: 'variables',
      type: 'array',
      description: '输入变量映射',
      required: true,
    },
    {
      name: 'outputs',
      type: 'array',
      description: '输出变量定义',
      required: true,
    },
  ],
  examples: [
    {
      description: 'Python 数据处理',
      config: {
        code_language: 'python3',
        code: 'def main(text: str) -> dict:\n    return {"result": text.upper()}',
        variables: [{ variable: 'text', value_selector: ['start', 'input'] }],
        outputs: [{ variable: 'result', variable_type: 'string' }],
      },
    },
  ],
  notes: ['Python 需要定义 main 函数', 'JavaScript 也需要定义 main 函数'],
};
