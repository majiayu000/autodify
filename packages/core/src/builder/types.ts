/**
 * Builder Types
 *
 * Types for programmatic DSL construction.
 */

import type { AppMode } from '../types/index.js';

/** 工作流构建器选项 */
export interface WorkflowBuilderOptions {
  name: string;
  description?: string;
  icon?: string;
  mode?: AppMode;
}

/** 节点构建器基础选项 */
export interface NodeBuilderOptions {
  id?: string;
  title?: string;
  desc?: string;
}

/** LLM 节点选项 */
export interface LLMNodeOptions extends NodeBuilderOptions {
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  userPrompt: string;
  context?: {
    enabled: boolean;
    variableSelector?: [string, string];
  };
}

/** Start 节点选项 */
export interface StartNodeOptions extends NodeBuilderOptions {
  variables: Array<{
    name: string;
    label: string;
    type: 'text-input' | 'paragraph' | 'select' | 'number';
    required?: boolean;
    maxLength?: number;
    options?: string[];
    default?: string | number;
  }>;
}

/** End 节点选项 */
export interface EndNodeOptions extends NodeBuilderOptions {
  outputs: Array<{
    name: string;
    source: [string, string];
  }>;
}

/** Knowledge Retrieval 节点选项 */
export interface KnowledgeRetrievalNodeOptions extends NodeBuilderOptions {
  queryFrom: [string, string];
  datasetIds: string[];
  topK?: number;
  scoreThreshold?: number;
  rerankingEnabled?: boolean;
  rerankingModel?: {
    provider: string;
    model: string;
  };
}

/** Question Classifier 节点选项 */
export interface QuestionClassifierNodeOptions extends NodeBuilderOptions {
  queryFrom: [string, string];
  provider?: string;
  model?: string;
  classes: Array<{
    id: string;
    name: string;
  }>;
  instruction?: string;
}

/** IF/ELSE 节点选项 */
export interface IfElseNodeOptions extends NodeBuilderOptions {
  conditions: Array<{
    id: string;
    logicalOperator?: 'and' | 'or';
    rules: Array<{
      variableSelector: [string, string];
      operator: string;
      value: string | number | boolean;
    }>;
  }>;
}

/** Code 节点选项 */
export interface CodeNodeOptions extends NodeBuilderOptions {
  language: 'python3' | 'javascript';
  code: string;
  inputs: Array<{
    name: string;
    source: [string, string];
  }>;
  outputs: Array<{
    name: string;
    type: 'string' | 'number' | 'object' | 'array[string]' | 'array[number]' | 'array[object]';
  }>;
}

/** HTTP Request 节点选项 */
export interface HttpRequestNodeOptions extends NodeBuilderOptions {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  url: string;
  headers?: Array<{ key: string; value: string }>;
  params?: Array<{ key: string; value: string }>;
  body?: {
    type: 'none' | 'json' | 'form-data' | 'raw-text';
    data?: string;
  };
  authorization?: {
    type: 'no-auth' | 'api-key' | 'basic';
    apiKey?: string;
    username?: string;
    password?: string;
  };
  timeout?: {
    connect?: number;
    read?: number;
    write?: number;
  };
}

/** Template Transform 节点选项 */
export interface TemplateNodeOptions extends NodeBuilderOptions {
  template: string;
  variables: Array<{
    name: string;
    source: [string, string];
  }>;
}

/** Variable Aggregator 节点选项 */
export interface AggregatorNodeOptions extends NodeBuilderOptions {
  variables: Array<[string, string]>;
  outputType: 'string' | 'number' | 'object' | 'array[string]' | 'array[number]' | 'array[object]';
}

/** 连接选项 */
export interface ConnectOptions {
  sourceHandle?: string;
}
