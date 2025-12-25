/**
 * Pre-validated Node Templates
 *
 * These templates provide correct structures for complex node types.
 * The LLM fills in the variable parts, reducing schema validation errors.
 */

import type { NodeData } from '../types/index.js';

// ============================================================================
// Template Types
// ============================================================================

type NodeType = NodeData['type'];

// ============================================================================
// Node Templates
// ============================================================================

export const NODE_TEMPLATES: Partial<Record<NodeType, Record<string, unknown>>> = {
  start: {
    type: 'start',
    title: '开始',
    desc: '',
    variables: [
      {
        variable: 'input',
        label: '用户输入',
        type: 'paragraph',
        required: true,
        max_length: 2000,
      },
    ],
  },

  end: {
    type: 'end',
    title: '结束',
    desc: '',
    outputs: [
      {
        variable: 'result',
        value_selector: ['llm', 'text'],
      },
    ],
  },

  llm: {
    type: 'llm',
    title: 'AI 处理',
    desc: '',
    model: {
      provider: 'openai',
      name: 'gpt-4o',
      mode: 'chat',
      completion_params: {
        temperature: 0.7,
        max_tokens: 4096,
      },
    },
    prompt_template: [
      {
        role: 'system',
        text: '你是一个有帮助的AI助手。',
      },
      {
        role: 'user',
        text: '{{#start.input#}}',
      },
    ],
  },

  'knowledge-retrieval': {
    type: 'knowledge-retrieval',
    title: '知识检索',
    desc: '',
    query_variable_selector: ['start', 'input'],
    dataset_ids: ['dataset-placeholder'],
    retrieval_mode: 'multiple',
    multiple_retrieval_config: {
      top_k: 5,
      score_threshold: 0.5,
      reranking_enable: false,
    },
  },

  'question-classifier': {
    type: 'question-classifier',
    title: '问题分类',
    desc: '',
    query_variable_selector: ['start', 'input'],
    model: {
      provider: 'openai',
      name: 'gpt-4o',
      mode: 'chat',
      completion_params: {
        temperature: 0.3,
      },
    },
    classes: [
      { id: 'class_1', name: '类别一' },
      { id: 'class_2', name: '类别二' },
    ],
    instruction: '',
  },

  'if-else': {
    type: 'if-else',
    title: '条件分支',
    desc: '',
    conditions: [
      {
        id: 'condition_1',
        logical_operator: 'and',
        conditions: [
          {
            variable_selector: ['start', 'input'],
            comparison_operator: 'is not empty',
            value: '',
          },
        ],
      },
    ],
  },

  code: {
    type: 'code',
    title: '代码执行',
    desc: '',
    code_language: 'python3',
    code: `def main(text: str) -> dict:
    return {"result": text}`,
    variables: [
      {
        variable: 'text',
        value_selector: ['start', 'input'],
      },
    ],
    outputs: [
      {
        variable: 'result',
        variable_type: 'string',
      },
    ],
  },

  'http-request': {
    type: 'http-request',
    title: 'HTTP 请求',
    desc: '',
    method: 'get',
    url: 'https://api.example.com/endpoint',
    authorization: {
      type: 'no-auth',
    },
    headers: [],
    params: [],
    body: {
      type: 'none',
    },
  },

  'variable-aggregator': {
    type: 'variable-aggregator',
    title: '变量聚合',
    desc: '',
    variables: [['llm', 'text']],
    output_type: 'string',
  },

  'template-transform': {
    type: 'template-transform',
    title: '模板转换',
    desc: '',
    template: '{{text}}',
    variables: [
      {
        variable: 'text',
        value_selector: ['llm', 'text'],
      },
    ],
  },

  answer: {
    type: 'answer',
    title: '回复',
    desc: '',
    answer: '{{#llm.text#}}',
  },

  iteration: {
    type: 'iteration',
    title: '循环迭代',
    desc: '',
    iterator_selector: ['start', 'items'],
    output_selector: ['llm', 'text'],
    output_type: 'array[string]',
    is_parallel: false,
  },
};

// ============================================================================
// Template Helpers
// ============================================================================

/**
 * Get template for a node type
 */
export function getNodeTemplate(type: string): Record<string, unknown> | null {
  return NODE_TEMPLATES[type as NodeType] || null;
}

/**
 * Create a customized node from template
 */
export function createNodeFromTemplate(
  type: NodeType,
  overrides: Partial<{
    title: string;
    desc: string;
    [key: string]: unknown;
  }> = {}
): Record<string, unknown> {
  const template = NODE_TEMPLATES[type];
  if (!template) {
    throw new Error(`No template for node type: ${type}`);
  }

  // Deep clone
  const node = JSON.parse(JSON.stringify(template));

  // Apply overrides
  Object.assign(node, overrides);

  return node;
}

/**
 * Create question-classifier with custom classes
 */
export function createQuestionClassifier(
  classes: Array<{ id: string; name: string }>,
  options: {
    title?: string;
    querySelector?: [string, string];
    model?: { provider: string; name: string };
    instruction?: string;
  } = {}
): Record<string, unknown> {
  if (classes.length < 2) {
    throw new Error('Question classifier requires at least 2 classes');
  }

  const node = createNodeFromTemplate('question-classifier', {
    title: options.title || '问题分类',
  });

  node['classes'] = classes;

  if (options.querySelector) {
    node['query_variable_selector'] = options.querySelector;
  }

  if (options.model) {
    const modelObj = node['model'] as Record<string, unknown>;
    modelObj['provider'] = options.model.provider;
    modelObj['name'] = options.model.name;
  }

  if (options.instruction) {
    node['instruction'] = options.instruction;
  }

  return node;
}

/**
 * Create if-else with custom conditions
 */
export function createIfElse(
  conditions: Array<{
    id: string;
    variableSelector: [string, string];
    operator: string;
    value: string | number | boolean;
    logicalOperator?: 'and' | 'or';
  }>,
  options: { title?: string } = {}
): Record<string, unknown> {
  const node = createNodeFromTemplate('if-else', {
    title: options.title || '条件分支',
  });

  node['conditions'] = conditions.map(c => ({
    id: c.id,
    logical_operator: c.logicalOperator || 'and',
    conditions: [
      {
        variable_selector: c.variableSelector,
        comparison_operator: c.operator,
        value: c.value,
      },
    ],
  }));

  return node;
}

/**
 * Create LLM node with custom prompt
 */
export function createLLM(
  systemPrompt: string,
  userPromptTemplate: string,
  options: {
    title?: string;
    provider?: string;
    model?: string;
    temperature?: number;
  } = {}
): Record<string, unknown> {
  const node = createNodeFromTemplate('llm', {
    title: options.title || 'AI 处理',
  });

  node['prompt_template'] = [
    { role: 'system', text: systemPrompt },
    { role: 'user', text: userPromptTemplate },
  ];

  const modelObj = node['model'] as Record<string, unknown>;
  if (options.provider) {
    modelObj['provider'] = options.provider;
  }
  if (options.model) {
    modelObj['name'] = options.model;
  }
  if (options.temperature !== undefined) {
    const completionParams = modelObj['completion_params'] as Record<string, unknown>;
    completionParams['temperature'] = options.temperature;
  }

  return node;
}

/**
 * Create code node with custom code
 */
export function createCode(
  code: string,
  language: 'python3' | 'javascript',
  inputs: Array<{ variable: string; selector: [string, string] }>,
  outputs: Array<{ variable: string; type: string }>,
  options: { title?: string } = {}
): Record<string, unknown> {
  const node = createNodeFromTemplate('code', {
    title: options.title || '代码执行',
  });

  node['code'] = code;
  node['code_language'] = language;
  node['variables'] = inputs.map(i => ({
    variable: i.variable,
    value_selector: i.selector,
  }));
  node['outputs'] = outputs.map(o => ({
    variable: o.variable,
    variable_type: o.type,
  }));

  return node;
}
