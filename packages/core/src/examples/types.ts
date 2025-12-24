/**
 * Few-shot Example Types
 */

import type { DifyDSL } from '../types/index.js';

/**
 * Example category for organization
 */
export type ExampleCategory =
  | 'simple'       // 简单工作流
  | 'conditional'  // 条件分支
  | 'loop'         // 循环迭代
  | 'rag'          // 知识库检索
  | 'agent'        // 智能体
  | 'api'          // API 集成
  | 'code'         // 代码处理
  | 'complex';     // 复杂场景

/**
 * Few-shot example metadata
 */
export interface ExampleMetadata {
  /** Unique example ID */
  id: string;
  /** Human-readable name */
  name: string;
  /** Detailed description */
  description: string;
  /** Category */
  category: ExampleCategory;
  /** Searchable keywords */
  keywords: string[];
  /** Node types used in this example */
  nodeTypes: string[];
  /** Complexity level (1-5) */
  complexity: number;
}

/**
 * Complete few-shot example
 */
export interface FewShotExample {
  /** Example metadata */
  metadata: ExampleMetadata;
  /** Natural language prompt that generated this workflow */
  prompt: string;
  /** The complete DSL output */
  dsl: DifyDSL;
  /** Optional explanation of the workflow structure */
  explanation?: string;
}

/**
 * Example match result from search
 */
export interface ExampleMatch {
  example: FewShotExample;
  score: number;
  matchedKeywords: string[];
}

/**
 * Format for serializing examples
 */
export interface SerializedExample {
  metadata: ExampleMetadata;
  prompt: string;
  dsl: string; // YAML string
  explanation?: string;
}
