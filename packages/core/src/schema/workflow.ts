/**
 * Zod schemas for Dify DSL workflow validation
 */

import { z } from 'zod';
import {
  DSLVersionSchema,
  AppModeSchema,
  IconTypeSchema,
  VariableValueTypeSchema,
  TransferMethodSchema,
  AllowedFileTypeSchema,
  NodeTypeSchema,
} from './base.js';
import { NodeSchema } from './nodes.js';

// ============================================================================
// Edge Schema
// ============================================================================

export const EdgeDataSchema = z.object({
  sourceType: NodeTypeSchema,
  targetType: NodeTypeSchema,
  isInIteration: z.boolean(),
  isInLoop: z.boolean().optional(),
  iterationID: z.string().optional(),
});

export const EdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  sourceHandle: z.string().min(1),
  target: z.string().min(1),
  targetHandle: z.string().min(1),
  type: z.literal('custom'),
  zIndex: z.number().optional(),
  data: EdgeDataSchema,
});

// ============================================================================
// App Configuration Schema
// ============================================================================

export const AppConfigSchema = z.object({
  name: z.string().min(1),
  mode: AppModeSchema,
  icon: z.string(),
  icon_type: IconTypeSchema,
  icon_background: z.string().optional(),
  description: z.string().optional(),
  use_icon_as_answer_icon: z.boolean().optional(),
});

// ============================================================================
// Variables Schema
// ============================================================================

export const EnvironmentVariableSchema = z.object({
  name: z.string().min(1),
  value: z.string(),
  value_type: VariableValueTypeSchema.optional(),
});

export const ConversationVariableSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  value_type: VariableValueTypeSchema,
  value: z.unknown(),
  description: z.string().optional(),
});

// ============================================================================
// Features Schema
// ============================================================================

export const ImageConfigSchema = z.object({
  enabled: z.boolean(),
  number_limits: z.number().positive().optional(),
  transfer_methods: z.array(TransferMethodSchema).optional(),
});

export const FileUploadConfigSchema = z.object({
  enabled: z.boolean(),
  image: ImageConfigSchema.optional(),
  allowed_file_types: z.array(AllowedFileTypeSchema).optional(),
  allowed_file_extensions: z.array(z.string()).optional(),
  allowed_file_upload_methods: z.array(TransferMethodSchema).optional(),
  number_limits: z.number().positive().optional(),
});

export const TextToSpeechConfigSchema = z.object({
  enabled: z.boolean(),
  voice: z.string().optional(),
  language: z.string().optional(),
});

export const SpeechToTextConfigSchema = z.object({
  enabled: z.boolean(),
});

export const RetrieverResourceConfigSchema = z.object({
  enabled: z.boolean(),
});

export const SensitiveWordConfigSchema = z.object({
  enabled: z.boolean(),
  type: z.string().optional(),
  configs: z.record(z.unknown()).optional(),
});

export const SuggestedQuestionsAfterAnswerConfigSchema = z.object({
  enabled: z.boolean(),
});

export const FeaturesSchema = z.object({
  file_upload: FileUploadConfigSchema.optional(),
  text_to_speech: TextToSpeechConfigSchema.optional(),
  speech_to_text: SpeechToTextConfigSchema.optional(),
  retriever_resource: RetrieverResourceConfigSchema.optional(),
  sensitive_word_avoidance: SensitiveWordConfigSchema.optional(),
  suggested_questions: z.array(z.string()).optional(),
  suggested_questions_after_answer: SuggestedQuestionsAfterAnswerConfigSchema.optional(),
  opening_statement: z.string().optional(),
});

// ============================================================================
// Graph Schema
// ============================================================================

export const WorkflowGraphSchema = z.object({
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
});

// ============================================================================
// Workflow Configuration Schema
// ============================================================================

export const WorkflowConfigSchema = z.object({
  graph: WorkflowGraphSchema,
  features: FeaturesSchema.optional(),
  environment_variables: z.array(EnvironmentVariableSchema).optional(),
  conversation_variables: z.array(ConversationVariableSchema).optional(),
});

// ============================================================================
// Model Configuration Schema (for non-workflow apps)
// ============================================================================

export const AgentModeToolConfigSchema = z.object({
  provider: z.string(),
  tool_name: z.string(),
  tool_label: z.string(),
  tool_configurations: z.record(z.unknown()).optional(),
});

export const AgentModeConfigSchema = z.object({
  enabled: z.boolean(),
  strategy: z.string().optional(),
  tools: z.array(AgentModeToolConfigSchema).optional(),
});

export const DatasetConfigSchema = z.object({
  datasets: z.array(z.object({
    dataset_id: z.string(),
  })),
});

export const ModelConfigSectionSchema = z.object({
  model: z.object({
    provider: z.string(),
    name: z.string(),
    completion_params: z.record(z.unknown()).optional(),
  }).optional(),
  agent_mode: AgentModeConfigSchema.optional(),
  dataset_configs: DatasetConfigSchema.optional(),
});

// ============================================================================
// Dependencies Schema
// ============================================================================

export const DependencySchema = z.object({
  provider: z.string(),
}).passthrough();

// ============================================================================
// Complete DSL Schema
// ============================================================================

export const DifyDSLSchema = z.object({
  version: DSLVersionSchema,
  kind: z.literal('app'),
  app: AppConfigSchema,
  workflow: WorkflowConfigSchema.optional(),
  model_config: ModelConfigSectionSchema.optional(),
  dependencies: z.array(DependencySchema).optional(),
}).refine(
  (data) => {
    // workflow 或 advanced-chat 模式必须有 workflow 字段
    if (data.app.mode === 'workflow' || data.app.mode === 'advanced-chat') {
      return !!data.workflow;
    }
    return true;
  },
  {
    message: 'Workflow mode requires "workflow" field',
    path: ['workflow'],
  }
);

// ============================================================================
// Type Exports
// ============================================================================

export type EdgeSchemaType = z.infer<typeof EdgeSchema>;
export type AppConfigSchemaType = z.infer<typeof AppConfigSchema>;
export type WorkflowConfigSchemaType = z.infer<typeof WorkflowConfigSchema>;
export type DifyDSLSchemaType = z.infer<typeof DifyDSLSchema>;
