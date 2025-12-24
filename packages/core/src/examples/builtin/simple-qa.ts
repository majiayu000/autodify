/**
 * Simple Q&A Example
 */

import type { FewShotExample } from '../types.js';
import { simpleQATemplate } from '../../templates/index.js';

export const simpleQAExample: FewShotExample = {
  metadata: {
    id: 'example-simple-qa',
    name: '简单问答',
    description: '最基础的问答工作流，接收用户问题并返回 AI 回答',
    category: 'simple',
    keywords: ['问答', 'qa', '对话', '聊天', '简单', '基础'],
    nodeTypes: ['start', 'llm', 'end'],
    complexity: 1,
  },
  prompt: '帮我创建一个简单的问答工作流，用户输入问题，AI 回答',
  dsl: simpleQATemplate.build(),
  explanation: '这是最简单的工作流结构：开始节点接收用户输入，LLM 节点处理并生成回答，结束节点输出结果。适合快速构建基础的问答应用。',
};
