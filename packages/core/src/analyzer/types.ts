/**
 * Analyzer Types
 */

/**
 * Variable reference
 */
export interface VariableReference {
  /** Source node ID */
  nodeId: string;
  /** Variable name */
  variable: string;
  /** Full reference string (e.g., "{{#start.input#}}") */
  fullReference: string;
}

/**
 * Node dependency information
 */
export interface NodeDependency {
  /** Node ID */
  nodeId: string;
  /** Nodes this node depends on (inputs) */
  dependsOn: string[];
  /** Nodes that depend on this node (outputs) */
  dependedBy: string[];
  /** Variable references used */
  variableReferences: VariableReference[];
  /** Variables this node provides */
  providesVariables: string[];
}

/**
 * Dependency graph
 */
export interface DependencyGraph {
  /** All node dependencies */
  nodes: Map<string, NodeDependency>;
  /** Topological order (execution order) */
  topologicalOrder: string[];
  /** Circular dependencies detected */
  circularDependencies: string[][];
  /** Orphan nodes (no inputs or outputs) */
  orphanNodes: string[];
}

/**
 * Variable analysis result
 */
export interface VariableAnalysis {
  /** All defined variables */
  definedVariables: Map<string, { nodeId: string; type: string }>;
  /** All referenced variables */
  referencedVariables: VariableReference[];
  /** Undefined variable references */
  undefinedReferences: VariableReference[];
  /** Unused variables */
  unusedVariables: Array<{ nodeId: string; variable: string }>;
}

/**
 * Analysis result
 */
export interface AnalysisResult {
  /** Dependency graph */
  dependencies: DependencyGraph;
  /** Variable analysis */
  variables: VariableAnalysis;
  /** Issues found */
  issues: AnalysisIssue[];
}

/**
 * Analysis issue
 */
export interface AnalysisIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  nodeId?: string;
  details?: Record<string, unknown>;
}
