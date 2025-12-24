/**
 * Node Registry - Metadata for all Dify workflow nodes
 */

import type { NodeMeta } from './types.js';

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

/**
 * Answer 节点元信息
 */
export const answerNodeMeta: NodeMeta = {
  type: 'answer',
  displayName: '回答',
  description: '流式输出节点，用于 Chatflow 对话场景',
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
      name: 'answer',
      type: 'template',
      description: '回答内容模板，支持变量引用',
      required: true,
    },
  ],
  examples: [
    {
      description: '输出 LLM 回答',
      config: {
        answer: '{{#llm.text#}}',
      },
    },
  ],
  notes: ['仅用于 Chatflow 模式', '支持流式输出'],
};

/**
 * LLM 节点元信息
 */
export const llmNodeMeta: NodeMeta = {
  type: 'llm',
  displayName: 'LLM',
  description: '调用大语言模型进行对话、生成、分类等任务',
  category: 'llm',
  inputs: [
    {
      name: 'context',
      type: 'any',
      description: '可选的上下文输入',
      required: false,
    },
  ],
  outputs: [
    {
      name: 'text',
      type: 'string',
      description: '模型生成的文本',
    },
  ],
  configFields: [
    {
      name: 'model',
      type: 'object',
      description: '模型配置',
      required: true,
    },
    {
      name: 'prompt_template',
      type: 'array',
      description: '提示词模板',
      required: true,
    },
    {
      name: 'memory',
      type: 'object',
      description: '对话记忆配置',
      required: false,
    },
    {
      name: 'context',
      type: 'object',
      description: '上下文配置',
      required: false,
    },
    {
      name: 'vision',
      type: 'object',
      description: '视觉能力配置',
      required: false,
    },
  ],
  examples: [
    {
      description: '简单问答',
      config: {
        model: {
          provider: 'openai',
          name: 'gpt-4o',
          mode: 'chat',
          completion_params: {
            temperature: 0.7,
          },
        },
        prompt_template: [
          { role: 'system', text: '你是一个有帮助的助手。' },
          { role: 'user', text: '{{#start.user_input#}}' },
        ],
      },
    },
  ],
  notes: ['temperature 范围 0-2', '支持多种模型提供商'],
};

/**
 * Knowledge Retrieval 节点元信息
 */
export const knowledgeRetrievalNodeMeta: NodeMeta = {
  type: 'knowledge-retrieval',
  displayName: '知识检索',
  description: '从知识库中检索相关文档',
  category: 'data',
  inputs: [
    {
      name: 'query',
      type: 'string',
      description: '检索查询',
      required: true,
    },
  ],
  outputs: [
    {
      name: 'result',
      type: 'array[object]',
      description: '检索结果列表',
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
      name: 'dataset_ids',
      type: 'array',
      description: '知识库 ID 列表',
      required: true,
    },
    {
      name: 'retrieval_mode',
      type: 'select',
      description: '检索模式',
      required: true,
      options: ['single', 'multiple'],
    },
  ],
  examples: [
    {
      description: '多路检索',
      config: {
        query_variable_selector: ['start', 'user_input'],
        dataset_ids: ['dataset-xxx'],
        retrieval_mode: 'multiple',
        multiple_retrieval_config: {
          top_k: 5,
          score_threshold: 0.5,
          reranking_enable: true,
        },
      },
    },
  ],
  notes: ['需要提前在 Dify 中创建知识库'],
};

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

/**
 * HTTP Request 节点元信息
 */
export const httpRequestNodeMeta: NodeMeta = {
  type: 'http-request',
  displayName: 'HTTP 请求',
  description: '发送 HTTP 请求调用外部 API',
  category: 'tool',
  inputs: [
    {
      name: 'any',
      type: 'any',
      description: '任意输入',
    },
  ],
  outputs: [
    {
      name: 'status_code',
      type: 'number',
      description: 'HTTP 状态码',
    },
    {
      name: 'body',
      type: 'string',
      description: '响应体',
    },
    {
      name: 'headers',
      type: 'object',
      description: '响应头',
    },
  ],
  configFields: [
    {
      name: 'method',
      type: 'select',
      description: 'HTTP 方法',
      required: true,
      options: ['get', 'post', 'put', 'patch', 'delete', 'head'],
    },
    {
      name: 'url',
      type: 'string',
      description: '请求 URL',
      required: true,
    },
    {
      name: 'authorization',
      type: 'object',
      description: '授权配置',
      required: false,
    },
    {
      name: 'headers',
      type: 'array',
      description: '请求头',
      required: false,
    },
    {
      name: 'body',
      type: 'object',
      description: '请求体',
      required: false,
    },
  ],
  examples: [
    {
      description: 'GET 请求',
      config: {
        method: 'get',
        url: 'https://api.example.com/data',
        timeout: { connect: 10, read: 30, write: 10 },
      },
    },
  ],
  notes: ['URL 支持变量模板 {{#node.var#}}'],
};

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

/**
 * 所有节点元信息
 */
export const nodeMetaRegistry: Record<string, NodeMeta> = {
  start: startNodeMeta,
  end: endNodeMeta,
  answer: answerNodeMeta,
  llm: llmNodeMeta,
  'knowledge-retrieval': knowledgeRetrievalNodeMeta,
  'question-classifier': questionClassifierNodeMeta,
  'if-else': ifElseNodeMeta,
  code: codeNodeMeta,
  'http-request': httpRequestNodeMeta,
  'template-transform': templateTransformNodeMeta,
  'variable-aggregator': variableAggregatorNodeMeta,
};

/**
 * 获取节点元信息
 */
export function getNodeMeta(type: string): NodeMeta | undefined {
  return nodeMetaRegistry[type];
}

/**
 * 获取所有节点类型
 */
export function getAllNodeTypes(): string[] {
  return Object.keys(nodeMetaRegistry);
}

/**
 * 按分类获取节点
 */
export function getNodesByCategory(category: string): NodeMeta[] {
  return Object.values(nodeMetaRegistry).filter((meta) => meta.category === category);
}
