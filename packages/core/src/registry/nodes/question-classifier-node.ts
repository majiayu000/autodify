/**
 * Question Classifier Node Metadata
 */

import type { NodeMeta } from '../types.js';

/**
 * Question Classifier 节点元信息
 */
export const questionClassifierNodeMeta: NodeMeta = {
  type: 'question-classifier',
  displayName: '问题分类',
  description: '使用 LLM 对问题进行分类，路由到不同分支',
  category: 'logic',
  inputs: [
    {
      name: 'query',
      type: 'string',
      description: '待分类的问题',
      required: true,
    },
  ],
  outputs: [
    {
      name: 'class_name',
      type: 'string',
      description: '分类结果',
    },
  ],
  configFields: [
    {
      name: 'query_variable_selector',
      type: 'array',
      description: '查询变量选择器',
      required: true,
    },
    {
      name: 'model',
      type: 'object',
      description: '模型配置',
      required: true,
    },
    {
      name: 'classes',
      type: 'array',
      description: '分类定义列表',
      required: true,
    },
    {
      name: 'instruction',
      type: 'string',
      description: '分类指令',
      required: false,
    },
  ],
  examples: [
    {
      description: '意图分类',
      config: {
        classes: [
          { id: 'product', name: '产品咨询' },
          { id: 'tech', name: '技术支持' },
          { id: 'other', name: '其他' },
        ],
      },
    },
  ],
  multipleOutputs: true,
  notes: ['Edge 的 sourceHandle 对应 class.id'],
};
