/**
 * Plan Validator - Validates workflow plans
 */

import type { WorkflowPlan, PlannedNode, FeatureType } from './types.js';

export interface PlanValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a workflow plan
 */
export function validatePlan(plan: WorkflowPlan): PlanValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for start node
  if (!plan.nodes.some(n => n.type === 'start')) {
    errors.push('Workflow must have a start node');
  }

  // Check for end/answer node
  if (!plan.nodes.some(n => n.type === 'end' || n.type === 'answer')) {
    errors.push('Workflow must have an end or answer node');
  }

  // Check for duplicate node IDs
  const nodeIds = new Set<string>();
  for (const node of plan.nodes) {
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`);
    }
    nodeIds.add(node.id);
  }

  // Check for orphaned nodes
  const connectedNodes = new Set<string>();
  for (const edge of plan.edges) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }

  for (const node of plan.nodes) {
    if (node.type !== 'start' && node.type !== 'end' && !connectedNodes.has(node.id)) {
      warnings.push(`Orphaned node: ${node.id}`);
    }
  }

  // Check for invalid edges
  for (const edge of plan.edges) {
    const sourceExists = plan.nodes.some(n => n.id === edge.source);
    const targetExists = plan.nodes.some(n => n.id === edge.target);

    if (!sourceExists) {
      errors.push(`Edge references non-existent source node: ${edge.source}`);
    }
    if (!targetExists) {
      errors.push(`Edge references non-existent target node: ${edge.target}`);
    }
  }

  // Check for cycles (simple DFS-based detection)
  const cycles = detectCycles(plan.nodes, plan.edges);
  if (cycles.length > 0) {
    warnings.push(`Potential cycles detected: ${cycles.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Detect cycles in the workflow graph
 */
function detectCycles(nodes: PlannedNode[], edges: Array<{ source: string; target: string }>): string[] {
  const cycles: string[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  // Build adjacency list
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, []);
    }
    adjacency.get(edge.source)!.push(edge.target);
  }

  function dfs(nodeId: string, path: string[]): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adjacency.get(nodeId) ?? [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, [...path])) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        cycles.push([...path, neighbor].join(' -> '));
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  }

  return cycles;
}

/**
 * Check if plan has required features
 */
export function checkPlanFeatures(plan: WorkflowPlan, requiredFeatures: FeatureType[]): boolean {
  const planFeatures = plan.intent.features.map(f => f.type);
  return requiredFeatures.every(feature => planFeatures.includes(feature));
}

/**
 * Estimate plan complexity
 */
export function estimatePlanComplexity(plan: WorkflowPlan): number {
  let complexity = 0;

  // Base complexity from number of nodes
  complexity += plan.nodes.length;

  // Add complexity for branching nodes
  const branchingNodes = plan.nodes.filter(n =>
    n.type === 'question-classifier' || n.type === 'if-else'
  );
  complexity += branchingNodes.length * 2;

  // Add complexity for advanced nodes
  const advancedNodes = plan.nodes.filter(n =>
    n.type === 'code' || n.type === 'http-request'
  );
  complexity += advancedNodes.length * 1.5;

  return Math.round(complexity);
}
