/**
 * Workflow Planner Types
 */

import type { NodeType } from '../types/index.js';

/**
 * Intent extracted from user input
 */
export interface WorkflowIntent {
  /** Primary action/goal */
  action: string;
  /** Domain or context */
  domain?: string;
  /** Specific requirements */
  requirements: string[];
  /** Detected features/capabilities needed */
  features: WorkflowFeature[];
  /** Estimated complexity (1-5) */
  complexity: number;
}

/**
 * Feature flags for workflow capabilities
 */
export interface WorkflowFeature {
  type: FeatureType;
  description: string;
  required: boolean;
}

/**
 * Types of features that can be detected
 */
export type FeatureType =
  | 'llm'              // LLM 对话/生成
  | 'rag'              // 知识库检索
  | 'classification'   // 意图分类
  | 'conditional'      // 条件分支
  | 'iteration'        // 循环迭代
  | 'code'             // 代码执行
  | 'api'              // API 调用
  | 'agent'            // 智能体
  | 'multi-model'      // 多模型
  | 'streaming';       // 流式输出

/**
 * Planned node in the workflow
 */
export interface PlannedNode {
  /** Suggested node ID */
  id: string;
  /** Node type */
  type: NodeType;
  /** Node title/purpose */
  title: string;
  /** Brief description */
  description: string;
  /** Configuration hints */
  configHints?: Record<string, unknown>;
}

/**
 * Planned edge in the workflow
 */
export interface PlannedEdge {
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Optional source handle for branching */
  sourceHandle?: string;
  /** Optional target handle */
  targetHandle?: string;
  /** Condition description for conditional edges */
  condition?: string;
}

/**
 * Complete workflow plan
 */
export interface WorkflowPlan {
  /** Plan name */
  name: string;
  /** Plan description */
  description: string;
  /** Extracted intent */
  intent: WorkflowIntent;
  /** Planned nodes */
  nodes: PlannedNode[];
  /** Planned edges */
  edges: PlannedEdge[];
  /** Suggested icon */
  icon?: string;
  /** Variables for start node */
  inputVariables: InputVariable[];
  /** Output definitions */
  outputs: OutputDefinition[];
  /** Confidence score (0-1) */
  confidence: number;
  /** Alternative approaches */
  alternatives?: string[];
}

/**
 * Input variable definition
 */
export interface InputVariable {
  name: string;
  label: string;
  type: 'text-input' | 'paragraph' | 'select' | 'number' | 'file' | 'file-list';
  required: boolean;
  default?: unknown;
  options?: string[];
  description?: string;
}

/**
 * Output definition
 */
export interface OutputDefinition {
  name: string;
  source: [string, string]; // [nodeId, variableName]
  description?: string;
}

/**
 * Planner options
 */
export interface PlannerOptions {
  /** LLM provider */
  provider?: string;
  /** Model to use for planning */
  model?: string;
  /** API key */
  apiKey?: string;
  /** Maximum retries */
  maxRetries?: number;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Planning result
 */
export interface PlanningResult {
  success: boolean;
  plan?: WorkflowPlan;
  error?: string;
  /** Time taken in ms */
  duration?: number;
}
