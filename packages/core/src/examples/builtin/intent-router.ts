/**
 * Intent Router Example
 */

import type { FewShotExample } from '../types.js';
import { intentRouterTemplate } from '../../templates/index.js';

export const intentRouterExample: FewShotExample = {
  metadata: {
    id: 'example-intent-router',
    name: '意图识别路由',
    description: '根据用户意图分类并路由到不同处理分支的智能客服工作流',
    category: 'complex',
    keywords: ['意图', '分类', '路由', '客服', '多分支', '智能'],
    nodeTypes: ['start', 'question-classifier', 'llm', 'variable-aggregator', 'end'],
    complexity: 3,
  },
  prompt: '创建一个智能客服工作流，能自动识别用户问题类型（产品咨询/技术支持/其他），并分别由专门的处理节点回答',
  dsl: intentRouterTemplate.build({
    classes: [
      { id: 'product', name: '产品咨询' },
      { id: 'tech', name: '技术支持' },
      { id: 'other', name: '其他问题' },
    ],
  }),
  explanation: '这个工作流使用问题分类器节点识别用户意图，将问题分为三类：产品咨询、技术支持和其他问题。每类问题都有专门的 LLM 节点处理，使用针对性的系统提示。最后通过聚合节点汇总各分支结果。这种设计使得不同类型的问题能得到专业的回答。',
};
