/**
 * Workflow and DSL type definitions for Dify
 */

import type { DSLVersion, AppMode, IconType, VariableValueType, TransferMethod, AllowedFileType } from './base.js';
import type { Node, NodeData } from './nodes.js';
import type { Edge } from './edge.js';

// ============================================================================
// App Configuration
// ============================================================================

/** 应用配置 */
export interface AppConfig {
  name: string;
  mode: AppMode;
  icon: string;
  icon_type: IconType;
  icon_background?: string;
  description?: string;
  use_icon_as_answer_icon?: boolean;
}

// ============================================================================
// Variables
// ============================================================================

/** 环境变量 */
export interface EnvironmentVariable {
  name: string;
  value: string;
  value_type?: VariableValueType;
}

/** 对话变量 */
export interface ConversationVariable {
  id: string;
  name: string;
  value_type: VariableValueType;
  value: unknown;
  description?: string;
}

// ============================================================================
// Features
// ============================================================================

/** 图片配置 */
export interface ImageConfig {
  enabled: boolean;
  number_limits?: number;
  transfer_methods?: TransferMethod[];
}

/** 文件上传配置 */
export interface FileUploadConfig {
  enabled: boolean;
  image?: ImageConfig;
  allowed_file_types?: AllowedFileType[];
  allowed_file_extensions?: string[];
  allowed_file_upload_methods?: TransferMethod[];
  number_limits?: number;
}

/** 文本转语音配置 */
export interface TextToSpeechConfig {
  enabled: boolean;
  voice?: string;
  language?: string;
}

/** 语音转文本配置 */
export interface SpeechToTextConfig {
  enabled: boolean;
}

/** 检索资源配置 */
export interface RetrieverResourceConfig {
  enabled: boolean;
}

/** 敏感词过滤配置 */
export interface SensitiveWordConfig {
  enabled: boolean;
  type?: string;
  configs?: Record<string, unknown>;
}

/** 回答后建议问题配置 */
export interface SuggestedQuestionsAfterAnswerConfig {
  enabled: boolean;
}

/** Features 配置 */
export interface Features {
  file_upload?: FileUploadConfig;
  text_to_speech?: TextToSpeechConfig;
  speech_to_text?: SpeechToTextConfig;
  retriever_resource?: RetrieverResourceConfig;
  sensitive_word_avoidance?: SensitiveWordConfig;
  suggested_questions?: string[];
  suggested_questions_after_answer?: SuggestedQuestionsAfterAnswerConfig;
  opening_statement?: string;
}

// ============================================================================
// Graph
// ============================================================================

/** 工作流图 */
export interface WorkflowGraph {
  nodes: Node<NodeData>[];
  edges: Edge[];
}

// ============================================================================
// Workflow Configuration
// ============================================================================

/** 工作流配置 */
export interface WorkflowConfig {
  graph: WorkflowGraph;
  features?: Features;
  environment_variables?: EnvironmentVariable[];
  conversation_variables?: ConversationVariable[];
}

// ============================================================================
// Model Configuration (for non-workflow apps)
// ============================================================================

/** Agent 工具配置 */
export interface AgentModeToolConfig {
  provider: string;
  tool_name: string;
  tool_label: string;
  tool_configurations?: Record<string, unknown>;
}

/** Agent 模式配置 */
export interface AgentModeConfig {
  enabled: boolean;
  strategy?: string;
  tools?: AgentModeToolConfig[];
}

/** 数据集配置 */
export interface DatasetConfig {
  datasets: {
    dataset_id: string;
  }[];
}

/** 模型配置 (非工作流应用) */
export interface ModelConfigSection {
  model?: {
    provider: string;
    name: string;
    completion_params?: Record<string, unknown>;
  };
  agent_mode?: AgentModeConfig;
  dataset_configs?: DatasetConfig;
}

// ============================================================================
// Dependencies
// ============================================================================

/** 插件依赖 */
export interface Dependency {
  provider: string;
  [key: string]: unknown;
}

// ============================================================================
// Complete DSL
// ============================================================================

/** 完整的 Dify DSL */
export interface DifyDSL {
  version: DSLVersion;
  kind: 'app';
  app: AppConfig;
  workflow?: WorkflowConfig;
  model_config?: ModelConfigSection;
  dependencies?: Dependency[];
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * 检查 DSL 是否为工作流模式
 */
export function isWorkflowDSL(dsl: DifyDSL): dsl is DifyDSL & { workflow: WorkflowConfig } {
  return dsl.app.mode === 'workflow' || dsl.app.mode === 'advanced-chat';
}

/**
 * 检查 DSL 是否为 Chat/Completion 模式
 */
export function isModelConfigDSL(dsl: DifyDSL): dsl is DifyDSL & { model_config: ModelConfigSection } {
  return dsl.app.mode === 'chat' || dsl.app.mode === 'completion' || dsl.app.mode === 'agent-chat';
}
