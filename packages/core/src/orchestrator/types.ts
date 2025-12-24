/**
 * Orchestrator Types
 */

import type { DifyDSL } from '../types/index.js';
import type { LLMProvider } from '../llm/types.js';

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
  /** LLM provider */
  provider: LLMProvider;
  /** API key */
  apiKey: string;
  /** Model for planning */
  planningModel?: string;
  /** Model for generation */
  generationModel?: string;
  /** Base URL for custom provider */
  baseUrl?: string;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Max retries */
  maxRetries?: number;
}

/**
 * Generation request
 */
export interface GenerationRequest {
  /** Natural language description */
  prompt: string;
  /** Additional context/requirements */
  context?: string;
  /** Preferred model provider for the workflow */
  preferredProvider?: string;
  /** Preferred model for the workflow */
  preferredModel?: string;
  /** Knowledge base IDs to use */
  datasetIds?: string[];
  /** Maximum complexity (1-5) */
  maxComplexity?: number;
  /** Skip template matching and always use LLM */
  skipTemplates?: boolean;
}

/**
 * Generation result
 */
export interface GenerationResult {
  success: boolean;
  dsl?: DifyDSL;
  yaml?: string;
  error?: string;
  /** Generation metadata */
  metadata?: {
    /** Time taken in ms */
    duration: number;
    /** Tokens used */
    tokensUsed?: number;
    /** Template used (if any) */
    templateUsed?: string;
    /** Planning result */
    planSummary?: string;
  };
}

/**
 * Edit request
 */
export interface EditRequest {
  /** Current DSL */
  currentDsl: DifyDSL;
  /** Edit instruction */
  instruction: string;
  /** Specific nodes to focus on */
  targetNodes?: string[];
}

/**
 * Edit result
 */
export interface EditResult {
  success: boolean;
  dsl?: DifyDSL;
  yaml?: string;
  error?: string;
  /** Changes made */
  changes?: EditChange[];
}

/**
 * Single edit change
 */
export interface EditChange {
  type: 'add' | 'remove' | 'modify';
  target: 'node' | 'edge' | 'config';
  id?: string;
  description: string;
}

/**
 * Validation feedback for LLM retry
 */
export interface ValidationFeedback {
  errors: string[];
  suggestions: string[];
}
