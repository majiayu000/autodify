/**
 * Zod schemas for Dify DSL node validation
 */

import { z } from 'zod';
import {
  VariableTypeSchema,
  OutputTypeSchema,
  CodeLanguageSchema,
  HttpMethodSchema,
  BodyTypeSchema,
  ComparisonOperatorSchema,
  LogicalOperatorSchema,
  RetrievalModeSchema,
  ErrorHandleModeSchema,
  AuthorizationTypeSchema,
  ApiKeyTypeSchema,
  ProviderTypeSchema,
  ReasoningModeSchema,
  ExtractorParamTypeSchema,
  EditionTypeSchema,
  LLMModeSchema,
  VisionDetailSchema,
  VariableSelectorSchema,
  NodePositionSchema,
  KeyValueSchema,
} from './base.js';

// ============================================================================
// Model Configuration Schemas
// ============================================================================

export const CompletionParamsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  max_tokens: z.number().positive().optional(),
  presence_penalty: z.number().optional(),
  frequency_penalty: z.number().optional(),
  stop: z.array(z.string()).optional(),
});

export const ModelConfigSchema = z.object({
  provider: z.string().min(1),
  name: z.string().min(1),
  mode: LLMModeSchema,
  completion_params: CompletionParamsSchema.optional(),
});

export const PromptTemplateSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  text: z.string(),
  edition_type: EditionTypeSchema.optional(),
});

// ============================================================================
// Start Node Schema
// ============================================================================

export const StartVariableSchema = z.object({
  variable: z.string().min(1),
  label: z.string().min(1),
  type: VariableTypeSchema,
  required: z.boolean(),
  max_length: z.number().positive().optional(),
  options: z.array(z.string()).optional(),
  default: z.union([z.string(), z.number()]).optional(),
  allowed_file_types: z.array(z.string()).optional(),
  allowed_file_extensions: z.array(z.string()).optional(),
});

export const StartNodeDataSchema = z.object({
  type: z.literal('start'),
  title: z.string().min(1),
  desc: z.string().optional(),
  variables: z.array(StartVariableSchema),
});

// ============================================================================
// End Node Schema
// ============================================================================

export const EndOutputSchema = z.object({
  variable: z.string().min(1),
  value_selector: VariableSelectorSchema,
});

export const EndNodeDataSchema = z.object({
  type: z.literal('end'),
  title: z.string().min(1),
  desc: z.string().optional(),
  outputs: z.array(EndOutputSchema),
});

// ============================================================================
// Answer Node Schema
// ============================================================================

export const AnswerNodeDataSchema = z.object({
  type: z.literal('answer'),
  title: z.string().min(1),
  desc: z.string().optional(),
  answer: z.string(),
});

// ============================================================================
// LLM Node Schema
// ============================================================================

export const MemoryConfigSchema = z.object({
  role_prefix: z.object({
    user: z.string(),
    assistant: z.string(),
  }).optional(),
  window: z.object({
    enabled: z.boolean(),
    size: z.number().positive(),
  }).optional(),
});

export const ContextConfigSchema = z.object({
  enabled: z.boolean(),
  variable_selector: VariableSelectorSchema.optional(),
});

export const VisionConfigSchema = z.object({
  enabled: z.boolean(),
  configs: z.object({
    variable_selector: VariableSelectorSchema,
    detail: VisionDetailSchema.optional(),
  }).optional(),
});

export const LLMNodeDataSchema = z.object({
  type: z.literal('llm'),
  title: z.string().min(1),
  desc: z.string().optional(),
  model: ModelConfigSchema,
  prompt_template: z.array(PromptTemplateSchema).min(1),
  memory: MemoryConfigSchema.optional(),
  context: ContextConfigSchema.optional(),
  vision: VisionConfigSchema.optional(),
});

// ============================================================================
// Knowledge Retrieval Node Schema
// ============================================================================

export const SingleRetrievalConfigSchema = z.object({
  model: z.object({
    provider: z.string(),
    name: z.string(),
  }),
});

export const MultipleRetrievalConfigSchema = z.object({
  top_k: z.number().positive(),
  score_threshold: z.number().min(0).max(1).optional(),
  score_threshold_enabled: z.boolean().optional(),
  reranking_enable: z.boolean().optional(),
  reranking_model: z.object({
    provider: z.string(),
    model: z.string(),
  }).optional(),
});

export const KnowledgeRetrievalNodeDataSchema = z.object({
  type: z.literal('knowledge-retrieval'),
  title: z.string().min(1),
  desc: z.string().optional(),
  query_variable_selector: VariableSelectorSchema,
  dataset_ids: z.array(z.string()).min(1),
  retrieval_mode: RetrievalModeSchema,
  single_retrieval_config: SingleRetrievalConfigSchema.optional(),
  multiple_retrieval_config: MultipleRetrievalConfigSchema.optional(),
});

// ============================================================================
// Question Classifier Node Schema
// ============================================================================

export const ClassDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export const QuestionClassifierNodeDataSchema = z.object({
  type: z.literal('question-classifier'),
  title: z.string().min(1),
  desc: z.string().optional(),
  query_variable_selector: VariableSelectorSchema,
  model: ModelConfigSchema,
  classes: z.array(ClassDefinitionSchema).min(2),
  instruction: z.string().optional(),
});

// ============================================================================
// IF/ELSE Node Schema
// ============================================================================

export const SingleConditionSchema = z.object({
  variable_selector: VariableSelectorSchema,
  comparison_operator: ComparisonOperatorSchema,
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export const ConditionBranchSchema = z.object({
  id: z.string().min(1),
  logical_operator: LogicalOperatorSchema,
  conditions: z.array(SingleConditionSchema).min(1),
});

export const IfElseNodeDataSchema = z.object({
  type: z.literal('if-else'),
  title: z.string().min(1),
  desc: z.string().optional(),
  conditions: z.array(ConditionBranchSchema).min(1),
});

// ============================================================================
// Code Node Schema
// ============================================================================

export const CodeVariableSchema = z.object({
  variable: z.string().min(1),
  value_selector: VariableSelectorSchema,
});

export const CodeOutputSchema = z.object({
  variable: z.string().min(1),
  variable_type: OutputTypeSchema,
});

export const CodeNodeDataSchema = z.object({
  type: z.literal('code'),
  title: z.string().min(1),
  desc: z.string().optional(),
  code_language: CodeLanguageSchema,
  code: z.string().min(1),
  variables: z.array(CodeVariableSchema),
  outputs: z.array(CodeOutputSchema).min(1),
});

// ============================================================================
// Template Transform Node Schema
// ============================================================================

export const TemplateTransformNodeDataSchema = z.object({
  type: z.literal('template-transform'),
  title: z.string().min(1),
  desc: z.string().optional(),
  template: z.string().min(1),
  variables: z.array(CodeVariableSchema),
});

// ============================================================================
// Variable Aggregator Node Schema
// ============================================================================

export const AggregatorGroupSchema = z.object({
  output_type: OutputTypeSchema,
  variables: z.array(VariableSelectorSchema),
});

export const VariableAggregatorNodeDataSchema = z.object({
  type: z.literal('variable-aggregator'),
  title: z.string().min(1),
  desc: z.string().optional(),
  variables: z.array(VariableSelectorSchema).min(1),
  output_type: OutputTypeSchema,
  advanced_settings: z.object({
    group_enabled: z.boolean(),
    groups: z.array(AggregatorGroupSchema).optional(),
  }).optional(),
});

// ============================================================================
// Variable Assigner Node Schema
// ============================================================================

export const AssignerVariableSchema = z.object({
  variable: z.string().min(1),
  value_selector: VariableSelectorSchema,
});

export const VariableAssignerNodeDataSchema = z.object({
  type: z.literal('variable-assigner'),
  title: z.string().min(1),
  desc: z.string().optional(),
  output_type: OutputTypeSchema,
  variables: z.array(AssignerVariableSchema),
});

// ============================================================================
// Iteration Node Schema
// ============================================================================

export const IterationNodeDataSchema = z.object({
  type: z.literal('iteration'),
  title: z.string().min(1),
  desc: z.string().optional(),
  iterator_selector: VariableSelectorSchema,
  output_selector: VariableSelectorSchema,
  output_type: OutputTypeSchema,
  is_parallel: z.boolean().optional(),
  parallel_nums: z.number().positive().optional(),
  error_handle_mode: ErrorHandleModeSchema.optional(),
});

// ============================================================================
// Loop Node Schema
// ============================================================================

export const LoopNodeDataSchema = z.object({
  type: z.literal('loop'),
  title: z.string().min(1),
  desc: z.string().optional(),
  loop_condition: z.array(SingleConditionSchema).optional(),
  max_iterations: z.number().positive().optional(),
});

// ============================================================================
// Parameter Extractor Node Schema
// ============================================================================

export const ExtractorParameterSchema = z.object({
  name: z.string().min(1),
  type: ExtractorParamTypeSchema,
  description: z.string(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
});

export const ParameterExtractorNodeDataSchema = z.object({
  type: z.literal('parameter-extractor'),
  title: z.string().min(1),
  desc: z.string().optional(),
  query: VariableSelectorSchema,
  model: ModelConfigSchema,
  parameters: z.array(ExtractorParameterSchema).min(1),
  instruction: z.string().optional(),
  reasoning_mode: ReasoningModeSchema.optional(),
});

// ============================================================================
// HTTP Request Node Schema
// ============================================================================

export const AuthorizationConfigSchema = z.object({
  type: AuthorizationTypeSchema,
  config: z.object({
    type: ApiKeyTypeSchema.optional(),
    api_key: z.string().optional(),
    header: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  }).optional(),
});

export const BodyConfigSchema = z.object({
  type: BodyTypeSchema,
  data: z.union([z.string(), z.array(KeyValueSchema)]).optional(),
});

export const TimeoutConfigSchema = z.object({
  connect: z.number().positive().optional(),
  read: z.number().positive().optional(),
  write: z.number().positive().optional(),
});

export const HttpRequestNodeDataSchema = z.object({
  type: z.literal('http-request'),
  title: z.string().min(1),
  desc: z.string().optional(),
  method: HttpMethodSchema,
  url: z.string().min(1),
  authorization: AuthorizationConfigSchema.optional(),
  headers: z.array(KeyValueSchema).optional(),
  params: z.array(KeyValueSchema).optional(),
  body: BodyConfigSchema.optional(),
  timeout: TimeoutConfigSchema.optional(),
});

// ============================================================================
// Tool Node Schema
// ============================================================================

export const ToolParameterSchema = z.object({
  type: z.enum(['variable', 'constant', 'mixed']),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  variable_selector: VariableSelectorSchema.optional(),
});

export const ToolNodeDataSchema = z.object({
  type: z.literal('tool'),
  title: z.string().min(1),
  desc: z.string().optional(),
  provider_id: z.string().min(1),
  provider_type: ProviderTypeSchema,
  provider_name: z.string().min(1),
  tool_name: z.string().min(1),
  tool_label: z.string().min(1),
  tool_configurations: z.record(z.unknown()).optional(),
  tool_parameters: z.record(ToolParameterSchema).optional(),
});

// ============================================================================
// Agent Node Schema
// ============================================================================

export const AgentToolSchema = z.object({
  provider_id: z.string().min(1),
  provider_type: ProviderTypeSchema,
  provider_name: z.string().min(1),
  tool_name: z.string().min(1),
  tool_label: z.string().min(1),
  tool_configurations: z.record(z.unknown()).optional(),
});

export const AgentNodeDataSchema = z.object({
  type: z.literal('agent'),
  title: z.string().min(1),
  desc: z.string().optional(),
  agent_strategy_provider: z.string().optional(),
  agent_strategy_name: z.string().optional(),
  agent_parameters: z.object({
    max_iterations: z.number().positive().optional(),
  }).passthrough().optional(),
  model: ModelConfigSchema,
  prompt_template: z.array(PromptTemplateSchema).optional(),
  tools: z.array(AgentToolSchema),
});

// ============================================================================
// Document Extractor Node Schema
// ============================================================================

export const DocumentExtractorNodeDataSchema = z.object({
  type: z.literal('document-extractor'),
  title: z.string().min(1),
  desc: z.string().optional(),
  variable_selector: VariableSelectorSchema,
});

// ============================================================================
// List Operator Node Schema
// ============================================================================

export const ListOperatorNodeDataSchema = z.object({
  type: z.literal('list-operator'),
  title: z.string().min(1),
  desc: z.string().optional(),
  variable_selector: VariableSelectorSchema,
  operation: z.string().optional(),
});

// ============================================================================
// Union Node Data Schema
// ============================================================================

export const NodeDataSchema = z.discriminatedUnion('type', [
  StartNodeDataSchema,
  EndNodeDataSchema,
  AnswerNodeDataSchema,
  LLMNodeDataSchema,
  KnowledgeRetrievalNodeDataSchema,
  QuestionClassifierNodeDataSchema,
  IfElseNodeDataSchema,
  CodeNodeDataSchema,
  TemplateTransformNodeDataSchema,
  VariableAggregatorNodeDataSchema,
  VariableAssignerNodeDataSchema,
  IterationNodeDataSchema,
  LoopNodeDataSchema,
  ParameterExtractorNodeDataSchema,
  HttpRequestNodeDataSchema,
  ToolNodeDataSchema,
  AgentNodeDataSchema,
  DocumentExtractorNodeDataSchema,
  ListOperatorNodeDataSchema,
]);

// ============================================================================
// Node Schema
// ============================================================================

export const NodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal('custom'),
  data: NodeDataSchema,
  position: NodePositionSchema.optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});
