/**
 * Conditional Workflow Example
 */

import type { FewShotExample } from '../types.js';
import { conditionalTemplate } from '../../templates/index.js';

export const conditionalExample: FewShotExample = {
  metadata: {
    id: 'example-conditional',
    name: '条件分支处理',
    description: '根据条件判断执行不同处理逻辑的工作流',
    category: 'conditional',
    keywords: ['条件', '分支', 'if', 'else', '判断', '选择', '逻辑'],
    nodeTypes: ['start', 'if-else', 'llm', 'variable-aggregator', 'end'],
    complexity: 2,
  },
  prompt: '创建一个条件分支工作流，根据用户选择的模式（详细/简洁）执行不同的处理',
  dsl: conditionalTemplate.build(),
  explanation: '这个工作流展示了条件分支的使用：IF/ELSE 节点根据用户选择的模式进行判断，"详细"模式走一个分支使用更多 token 生成详细回复，"简洁"模式走另一个分支生成精简回复。最后通过变量聚合节点汇总结果输出。',
};
