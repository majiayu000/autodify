/**
 * Rule-Based Planner - Plans workflows using rules and templates
 */

import type {
  WorkflowPlan,
  PlannedNode,
  PlannedEdge,
  WorkflowIntent,
} from './types.js';
import { planLinearWorkflow } from './linear-workflow.js';
import { planBranchingWorkflow } from './branching-workflow.js';

/**
 * Plan from rules without LLM
 */
export function planFromRules(
  userRequest: string,
  intent: WorkflowIntent
): WorkflowPlan {
  const nodes: PlannedNode[] = [];
  const edges: PlannedEdge[] = [];

  // Check if this is a complex branching workflow
  const hasClassification = intent.features.some(f => f.type === 'classification');
  const hasConditional = intent.features.some(f => f.type === 'conditional');
  const hasRag = intent.features.some(f => f.type === 'rag');

  // Always start with start node
  nodes.push({
    id: 'start',
    type: 'start',
    title: '开始',
    description: '接收用户输入',
  });

  // Complex branching workflow with classification
  if (hasClassification && (hasConditional || hasRag)) {
    return planBranchingWorkflow(userRequest, intent, nodes, edges);
  }

  // Simple linear workflow
  return planLinearWorkflow(userRequest, intent, nodes, edges);
}

// Re-export for backward compatibility
export { planLinearWorkflow } from './linear-workflow.js';
export { planBranchingWorkflow } from './branching-workflow.js';
