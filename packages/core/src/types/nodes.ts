/**
 * Node type definitions for Dify DSL
 */

import type {
  CodeLanguage,
  ComparisonOperator,
  LogicalOperator,
  OutputType,
  VariableType,
  HttpMethod,
  BodyType,
  AuthorizationType,
  ApiKeyType,
  RetrievalMode,
  ErrorHandleMode,
  ProviderType,
  ReasoningMode,
  ExtractorParamType,
  EditionType,
  LLMMode,
  VisionDetail,
} from './base.js';

// ============================================================================
// Common Types
// ============================================================================

/** 变量选择器 - 引用其他节点的变量 */
export type VariableSelector = [nodeId: string, variableName: string];

/** 节点位置 */
export interface NodePosition {
  x: number;
  y: number;
}

/** 键值对 */
export interface KeyValue {
  key: string;
  value: string;
}

// ============================================================================
// Node Types Enum
// ============================================================================

/** 节点类型 */
export type NodeType =
  | 'start'
  | 'end'
  | 'answer'
  | 'llm'
  | 'knowledge-retrieval'
  | 'question-classifier'
  | 'if-else'
  | 'code'
  | 'template-transform'
  | 'variable-aggregator'
  | 'variable-assigner'
  | 'iteration'
  | 'loop'
  | 'parameter-extractor'
  | 'http-request'
  | 'tool'
  | 'agent'
  | 'document-extractor'
  | 'list-operator';

// ============================================================================
// Start Node
// ============================================================================

/** Start 节点输入变量定义 */
export interface StartVariable {
  variable: string;
  label: string;
  type: VariableType;
  required: boolean;
  max_length?: number;
  options?: string[];
  default?: string | number;
  allowed_file_types?: string[];
  allowed_file_extensions?: string[];
}

/** Start 节点数据 */
export interface StartNodeData {
  type: 'start';
  title: string;
  desc?: string;
  variables: StartVariable[];
}

// ============================================================================
// End Node
// ============================================================================

/** End 节点输出定义 */
export interface EndOutput {
  variable: string;
  value_selector: VariableSelector;
}

/** End 节点数据 */
export interface EndNodeData {
  type: 'end';
  title: string;
  desc?: string;
  outputs: EndOutput[];
}

// ============================================================================
// Answer Node (Chatflow only)
// ============================================================================

/** Answer 节点数据 */
export interface AnswerNodeData {
  type: 'answer';
  title: string;
  desc?: string;
  answer: string;
}

// ============================================================================
// LLM Node
// ============================================================================

/** 模型完成参数 */
export interface CompletionParams {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  stop?: string[];
}

/** 模型配置 */
export interface ModelConfig {
  provider: string;
  name: string;
  mode: LLMMode;
  completion_params?: CompletionParams;
}

/** Prompt 模板项 */
export interface PromptTemplate {
  role: 'system' | 'user' | 'assistant';
  text: string;
  edition_type?: EditionType;
}

/** 对话记忆配置 */
export interface MemoryConfig {
  role_prefix?: {
    user: string;
    assistant: string;
  };
  window?: {
    enabled: boolean;
    size: number;
  };
}

/** 上下文配置 */
export interface ContextConfig {
  enabled: boolean;
  variable_selector?: VariableSelector;
}

/** 视觉配置 */
export interface VisionConfig {
  enabled: boolean;
  configs?: {
    variable_selector: VariableSelector;
    detail?: VisionDetail;
  };
}

/** LLM 节点数据 */
export interface LLMNodeData {
  type: 'llm';
  title: string;
  desc?: string;
  model: ModelConfig;
  prompt_template: PromptTemplate[];
  memory?: MemoryConfig;
  context?: ContextConfig;
  vision?: VisionConfig;
}

// ============================================================================
// Knowledge Retrieval Node
// ============================================================================

/** 单一检索配置 */
export interface SingleRetrievalConfig {
  model: {
    provider: string;
    name: string;
  };
}

/** 多重检索配置 */
export interface MultipleRetrievalConfig {
  top_k: number;
  score_threshold?: number;
  score_threshold_enabled?: boolean;
  reranking_enable?: boolean;
  reranking_model?: {
    provider: string;
    model: string;
  };
}

/** Knowledge Retrieval 节点数据 */
export interface KnowledgeRetrievalNodeData {
  type: 'knowledge-retrieval';
  title: string;
  desc?: string;
  query_variable_selector: VariableSelector;
  dataset_ids: string[];
  retrieval_mode: RetrievalMode;
  single_retrieval_config?: SingleRetrievalConfig;
  multiple_retrieval_config?: MultipleRetrievalConfig;
}

// ============================================================================
// Question Classifier Node
// ============================================================================

/** 分类定义 */
export interface ClassDefinition {
  id: string;
  name: string;
}

/** Question Classifier 节点数据 */
export interface QuestionClassifierNodeData {
  type: 'question-classifier';
  title: string;
  desc?: string;
  query_variable_selector: VariableSelector;
  model: ModelConfig;
  classes: ClassDefinition[];
  instruction?: string;
}

// ============================================================================
// IF/ELSE Node
// ============================================================================

/** 单个条件 */
export interface SingleCondition {
  variable_selector: VariableSelector;
  comparison_operator: ComparisonOperator;
  value: string | number | boolean;
}

/** 条件分支 */
export interface ConditionBranch {
  id: string;
  logical_operator: LogicalOperator;
  conditions: SingleCondition[];
}

/** IF/ELSE 节点数据 */
export interface IfElseNodeData {
  type: 'if-else';
  title: string;
  desc?: string;
  conditions: ConditionBranch[];
}

// ============================================================================
// Code Node
// ============================================================================

/** 代码输入变量 */
export interface CodeVariable {
  variable: string;
  value_selector: VariableSelector;
}

/** 代码输出变量 */
export interface CodeOutput {
  variable: string;
  variable_type: OutputType;
}

/** Code 节点数据 */
export interface CodeNodeData {
  type: 'code';
  title: string;
  desc?: string;
  code_language: CodeLanguage;
  code: string;
  variables: CodeVariable[];
  outputs: CodeOutput[];
}

// ============================================================================
// Template Transform Node
// ============================================================================

/** Template Transform 节点数据 */
export interface TemplateTransformNodeData {
  type: 'template-transform';
  title: string;
  desc?: string;
  template: string;
  variables: CodeVariable[];
}

// ============================================================================
// Variable Aggregator Node
// ============================================================================

/** 分组配置 */
export interface AggregatorGroup {
  output_type: OutputType;
  variables: VariableSelector[];
}

/** Variable Aggregator 节点数据 */
export interface VariableAggregatorNodeData {
  type: 'variable-aggregator';
  title: string;
  desc?: string;
  variables: VariableSelector[];
  output_type: OutputType;
  advanced_settings?: {
    group_enabled: boolean;
    groups?: AggregatorGroup[];
  };
}

// ============================================================================
// Variable Assigner Node
// ============================================================================

/** 赋值变量 */
export interface AssignerVariable {
  variable: string;
  value_selector: VariableSelector;
}

/** Variable Assigner 节点数据 */
export interface VariableAssignerNodeData {
  type: 'variable-assigner';
  title: string;
  desc?: string;
  output_type: OutputType;
  variables: AssignerVariable[];
}

// ============================================================================
// Iteration Node
// ============================================================================

/** Iteration 节点数据 */
export interface IterationNodeData {
  type: 'iteration';
  title: string;
  desc?: string;
  iterator_selector: VariableSelector;
  output_selector: VariableSelector;
  output_type: OutputType;
  is_parallel?: boolean;
  parallel_nums?: number;
  error_handle_mode?: ErrorHandleMode;
}

// ============================================================================
// Loop Node
// ============================================================================

/** Loop 节点数据 */
export interface LoopNodeData {
  type: 'loop';
  title: string;
  desc?: string;
  // Loop 节点配置（简化版）
  loop_condition?: SingleCondition[];
  max_iterations?: number;
}

// ============================================================================
// Parameter Extractor Node
// ============================================================================

/** 提取参数定义 */
export interface ExtractorParameter {
  name: string;
  type: ExtractorParamType;
  description: string;
  required: boolean;
  options?: string[];
}

/** Parameter Extractor 节点数据 */
export interface ParameterExtractorNodeData {
  type: 'parameter-extractor';
  title: string;
  desc?: string;
  query: VariableSelector;
  model: ModelConfig;
  parameters: ExtractorParameter[];
  instruction?: string;
  reasoning_mode?: ReasoningMode;
}

// ============================================================================
// HTTP Request Node
// ============================================================================

/** 授权配置 */
export interface AuthorizationConfig {
  type: AuthorizationType;
  config?: {
    type?: ApiKeyType;
    api_key?: string;
    header?: string;
    username?: string;
    password?: string;
  };
}

/** Body 配置 */
export interface BodyConfig {
  type: BodyType;
  data?: string | KeyValue[];
}

/** 超时配置 */
export interface TimeoutConfig {
  connect?: number;
  read?: number;
  write?: number;
}

/** HTTP Request 节点数据 */
export interface HttpRequestNodeData {
  type: 'http-request';
  title: string;
  desc?: string;
  method: HttpMethod;
  url: string;
  authorization?: AuthorizationConfig;
  headers?: KeyValue[];
  params?: KeyValue[];
  body?: BodyConfig;
  timeout?: TimeoutConfig;
}

// ============================================================================
// Tool Node
// ============================================================================

/** 工具参数 */
export interface ToolParameter {
  type: 'variable' | 'constant' | 'mixed';
  value?: string | number | boolean;
  variable_selector?: VariableSelector;
}

/** Tool 节点数据 */
export interface ToolNodeData {
  type: 'tool';
  title: string;
  desc?: string;
  provider_id: string;
  provider_type: ProviderType;
  provider_name: string;
  tool_name: string;
  tool_label: string;
  tool_configurations?: Record<string, unknown>;
  tool_parameters?: Record<string, ToolParameter>;
}

// ============================================================================
// Agent Node
// ============================================================================

/** Agent 工具配置 */
export interface AgentTool {
  provider_id: string;
  provider_type: ProviderType;
  provider_name: string;
  tool_name: string;
  tool_label: string;
  tool_configurations?: Record<string, unknown>;
}

/** Agent 节点数据 */
export interface AgentNodeData {
  type: 'agent';
  title: string;
  desc?: string;
  agent_strategy_provider?: string;
  agent_strategy_name?: string;
  agent_parameters?: {
    max_iterations?: number;
    [key: string]: unknown;
  };
  model: ModelConfig;
  prompt_template?: PromptTemplate[];
  tools: AgentTool[];
}

// ============================================================================
// Document Extractor Node
// ============================================================================

/** Document Extractor 节点数据 */
export interface DocumentExtractorNodeData {
  type: 'document-extractor';
  title: string;
  desc?: string;
  variable_selector: VariableSelector;
}

// ============================================================================
// List Operator Node
// ============================================================================

/** List Operator 节点数据 */
export interface ListOperatorNodeData {
  type: 'list-operator';
  title: string;
  desc?: string;
  variable_selector: VariableSelector;
  // 具体操作配置
  operation?: string;
}

// ============================================================================
// Union Types
// ============================================================================

/** 所有节点数据类型的联合 */
export type NodeData =
  | StartNodeData
  | EndNodeData
  | AnswerNodeData
  | LLMNodeData
  | KnowledgeRetrievalNodeData
  | QuestionClassifierNodeData
  | IfElseNodeData
  | CodeNodeData
  | TemplateTransformNodeData
  | VariableAggregatorNodeData
  | VariableAssignerNodeData
  | IterationNodeData
  | LoopNodeData
  | ParameterExtractorNodeData
  | HttpRequestNodeData
  | ToolNodeData
  | AgentNodeData
  | DocumentExtractorNodeData
  | ListOperatorNodeData;

// ============================================================================
// Node Wrapper
// ============================================================================

/** 完整的节点定义 */
export interface Node<T extends NodeData = NodeData> {
  id: string;
  type: 'custom';
  data: T;
  position?: NodePosition;
  positionAbsolute?: NodePosition;
  width?: number;
  height?: number;
  sourcePosition?: 'right' | 'left' | 'top' | 'bottom';
  targetPosition?: 'right' | 'left' | 'top' | 'bottom';
  selected?: boolean;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isStartNode(node: Node): node is Node<StartNodeData> {
  return node.data.type === 'start';
}

export function isEndNode(node: Node): node is Node<EndNodeData> {
  return node.data.type === 'end';
}

export function isAnswerNode(node: Node): node is Node<AnswerNodeData> {
  return node.data.type === 'answer';
}

export function isLLMNode(node: Node): node is Node<LLMNodeData> {
  return node.data.type === 'llm';
}

export function isKnowledgeRetrievalNode(node: Node): node is Node<KnowledgeRetrievalNodeData> {
  return node.data.type === 'knowledge-retrieval';
}

export function isQuestionClassifierNode(node: Node): node is Node<QuestionClassifierNodeData> {
  return node.data.type === 'question-classifier';
}

export function isIfElseNode(node: Node): node is Node<IfElseNodeData> {
  return node.data.type === 'if-else';
}

export function isCodeNode(node: Node): node is Node<CodeNodeData> {
  return node.data.type === 'code';
}

export function isHttpRequestNode(node: Node): node is Node<HttpRequestNodeData> {
  return node.data.type === 'http-request';
}

export function isToolNode(node: Node): node is Node<ToolNodeData> {
  return node.data.type === 'tool';
}

export function isAgentNode(node: Node): node is Node<AgentNodeData> {
  return node.data.type === 'agent';
}

export function isIterationNode(node: Node): node is Node<IterationNodeData> {
  return node.data.type === 'iteration';
}
