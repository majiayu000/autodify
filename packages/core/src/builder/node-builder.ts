/**
 * Node Builder
 *
 * Fluent API for building individual nodes.
 */

import type {
  Node,
  StartNodeData,
  EndNodeData,
  LLMNodeData,
  KnowledgeRetrievalNodeData,
  QuestionClassifierNodeData,
  IfElseNodeData,
  CodeNodeData,
  HttpRequestNodeData,
  TemplateTransformNodeData,
  VariableAggregatorNodeData,
  AnswerNodeData,
} from '../types/index.js';
import type {
  StartNodeOptions,
  EndNodeOptions,
  LLMNodeOptions,
  KnowledgeRetrievalNodeOptions,
  QuestionClassifierNodeOptions,
  IfElseNodeOptions,
  CodeNodeOptions,
  HttpRequestNodeOptions,
  TemplateNodeOptions,
  AggregatorNodeOptions,
} from './types.js';

let nodeIdCounter = 0;

function generateNodeId(prefix: string): string {
  return `${prefix}-${++nodeIdCounter}`;
}

/**
 * 创建 Start 节点
 */
export function createStartNode(options: StartNodeOptions): Node<StartNodeData> {
  const id = options.id ?? 'start';

  return {
    id,
    type: 'custom',
    data: {
      type: 'start',
      title: options.title ?? '开始',
      desc: options.desc,
      variables: options.variables.map((v) => ({
        variable: v.name,
        label: v.label,
        type: v.type,
        required: v.required ?? true,
        max_length: v.maxLength,
        options: v.options,
        default: v.default,
      })),
    },
  };
}

/**
 * 创建 End 节点
 */
export function createEndNode(options: EndNodeOptions): Node<EndNodeData> {
  const id = options.id ?? generateNodeId('end');

  return {
    id,
    type: 'custom',
    data: {
      type: 'end',
      title: options.title ?? '结束',
      desc: options.desc,
      outputs: options.outputs.map((o) => ({
        variable: o.name,
        value_selector: o.source,
      })),
    },
  };
}

/**
 * 创建 Answer 节点 (Chatflow)
 */
export function createAnswerNode(options: {
  id?: string;
  title?: string;
  answer: string;
}): Node<AnswerNodeData> {
  const id = options.id ?? generateNodeId('answer');

  return {
    id,
    type: 'custom',
    data: {
      type: 'answer',
      title: options.title ?? '回答',
      answer: options.answer,
    },
  };
}

/**
 * 创建 LLM 节点
 */
export function createLLMNode(options: LLMNodeOptions): Node<LLMNodeData> {
  const id = options.id ?? generateNodeId('llm');

  const data: LLMNodeData = {
    type: 'llm',
    title: options.title ?? 'LLM',
    desc: options.desc,
    model: {
      provider: options.provider ?? 'openai',
      name: options.model ?? 'gpt-4o',
      mode: 'chat',
      completion_params: {
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
      },
    },
    prompt_template: [],
  };

  // 添加 system prompt
  if (options.systemPrompt) {
    data.prompt_template.push({
      role: 'system',
      text: options.systemPrompt,
    });
  }

  // 添加 user prompt
  data.prompt_template.push({
    role: 'user',
    text: options.userPrompt,
  });

  // 添加上下文配置
  if (options.context) {
    data.context = {
      enabled: options.context.enabled,
      variable_selector: options.context.variableSelector,
    };
  }

  return { id, type: 'custom', data };
}

/**
 * 创建 Knowledge Retrieval 节点
 */
export function createKnowledgeRetrievalNode(
  options: KnowledgeRetrievalNodeOptions
): Node<KnowledgeRetrievalNodeData> {
  const id = options.id ?? generateNodeId('retrieval');

  return {
    id,
    type: 'custom',
    data: {
      type: 'knowledge-retrieval',
      title: options.title ?? '知识检索',
      desc: options.desc,
      query_variable_selector: options.queryFrom,
      dataset_ids: options.datasetIds,
      retrieval_mode: 'multiple',
      multiple_retrieval_config: {
        top_k: options.topK ?? 5,
        score_threshold: options.scoreThreshold ?? 0.5,
        score_threshold_enabled: options.scoreThreshold !== undefined,
        reranking_enable: options.rerankingEnabled ?? false,
        reranking_model: options.rerankingModel,
      },
    },
  };
}

/**
 * 创建 Question Classifier 节点
 */
export function createQuestionClassifierNode(
  options: QuestionClassifierNodeOptions
): Node<QuestionClassifierNodeData> {
  const id = options.id ?? generateNodeId('classifier');

  return {
    id,
    type: 'custom',
    data: {
      type: 'question-classifier',
      title: options.title ?? '问题分类',
      desc: options.desc,
      query_variable_selector: options.queryFrom,
      model: {
        provider: options.provider ?? 'openai',
        name: options.model ?? 'gpt-4o-mini',
        mode: 'chat',
        completion_params: {
          temperature: 0,
        },
      },
      classes: options.classes,
      instruction: options.instruction,
    },
  };
}

/**
 * 创建 IF/ELSE 节点
 */
export function createIfElseNode(options: IfElseNodeOptions): Node<IfElseNodeData> {
  const id = options.id ?? generateNodeId('ifelse');

  return {
    id,
    type: 'custom',
    data: {
      type: 'if-else',
      title: options.title ?? '条件判断',
      desc: options.desc,
      conditions: options.conditions.map((cond) => ({
        id: cond.id,
        logical_operator: cond.logicalOperator ?? 'and',
        conditions: cond.rules.map((rule) => ({
          variable_selector: rule.variableSelector,
          comparison_operator: rule.operator as any,
          value: rule.value,
        })),
      })),
    },
  };
}

/**
 * 创建 Code 节点
 */
export function createCodeNode(options: CodeNodeOptions): Node<CodeNodeData> {
  const id = options.id ?? generateNodeId('code');

  return {
    id,
    type: 'custom',
    data: {
      type: 'code',
      title: options.title ?? '代码执行',
      desc: options.desc,
      code_language: options.language,
      code: options.code,
      variables: options.inputs.map((input) => ({
        variable: input.name,
        value_selector: input.source,
      })),
      outputs: options.outputs.map((output) => ({
        variable: output.name,
        variable_type: output.type,
      })),
    },
  };
}

/**
 * 创建 HTTP Request 节点
 */
export function createHttpRequestNode(
  options: HttpRequestNodeOptions
): Node<HttpRequestNodeData> {
  const id = options.id ?? generateNodeId('http');

  const data: HttpRequestNodeData = {
    type: 'http-request',
    title: options.title ?? 'HTTP 请求',
    desc: options.desc,
    method: options.method,
    url: options.url,
  };

  if (options.headers && options.headers.length > 0) {
    data.headers = options.headers;
  }

  if (options.params && options.params.length > 0) {
    data.params = options.params;
  }

  if (options.body) {
    data.body = {
      type: options.body.type,
      data: options.body.data,
    };
  }

  if (options.authorization && options.authorization.type !== 'no-auth') {
    data.authorization = {
      type: options.authorization.type,
      config: {
        type: 'bearer',
        api_key: options.authorization.apiKey,
        username: options.authorization.username,
        password: options.authorization.password,
      },
    };
  }

  if (options.timeout) {
    data.timeout = options.timeout;
  }

  return { id, type: 'custom', data };
}

/**
 * 创建 Template Transform 节点
 */
export function createTemplateNode(
  options: TemplateNodeOptions
): Node<TemplateTransformNodeData> {
  const id = options.id ?? generateNodeId('template');

  return {
    id,
    type: 'custom',
    data: {
      type: 'template-transform',
      title: options.title ?? '模板转换',
      desc: options.desc,
      template: options.template,
      variables: options.variables.map((v) => ({
        variable: v.name,
        value_selector: v.source,
      })),
    },
  };
}

/**
 * 创建 Variable Aggregator 节点
 */
export function createAggregatorNode(
  options: AggregatorNodeOptions
): Node<VariableAggregatorNodeData> {
  const id = options.id ?? generateNodeId('aggregator');

  return {
    id,
    type: 'custom',
    data: {
      type: 'variable-aggregator',
      title: options.title ?? '变量聚合',
      desc: options.desc,
      variables: options.variables,
      output_type: options.outputType,
    },
  };
}

/**
 * 重置节点 ID 计数器（用于测试）
 */
export function resetNodeIdCounter(): void {
  nodeIdCounter = 0;
}
