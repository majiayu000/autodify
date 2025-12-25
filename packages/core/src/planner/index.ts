/**
 * Workflow Planner Module
 *
 * Plan workflow structure from natural language descriptions
 */

// Types
export type {
  WorkflowIntent,
  WorkflowFeature,
  FeatureType,
  PlannedNode,
  PlannedEdge,
  WorkflowPlan,
  InputVariable,
  OutputDefinition,
  PlannerOptions,
  PlanningResult,
} from './types.js';

// Intent Analyzer
export { analyzeIntent } from './intent-analyzer.js';

// Prompts
export {
  PLANNER_SYSTEM_PROMPT,
  buildPlanningPrompt,
  buildFewShotPrompt,
  EXAMPLE_PLAN,
} from './prompts.js';

// Rule-based planner
export { planFromRules } from './rule-based-planner.js';
export { planLinearWorkflow } from './linear-workflow.js';
export { planBranchingWorkflow } from './branching-workflow.js';

// LLM planner
export { planWithLLM, planFromTemplate } from './llm-planner.js';

// Plan validator
export {
  validatePlan,
  checkPlanFeatures,
  estimatePlanComplexity,
} from './plan-validator.js';
export type { PlanValidationResult } from './plan-validator.js';

// Template helpers
export {
  generateWorkflowName,
  inferInputVariables,
  inferOutputs,
} from './workflow-helpers.js';

// Branch extractor
export { extractBranches } from './branch-extractor.js';
export type { BranchInfo } from './branch-extractor.js';

// Main Planner class
export { WorkflowPlanner, createPlanner } from './workflow-planner.js';
