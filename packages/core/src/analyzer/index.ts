/**
 * Analyzer Module
 *
 * Workflow analysis and dependency tracking
 */

// Types
export type {
  VariableReference,
  NodeDependency,
  DependencyGraph,
  VariableAnalysis,
  AnalysisResult,
  AnalysisIssue,
} from './types.js';

// Analyzer
export { DependencyAnalyzer, createDependencyAnalyzer } from './dependency-analyzer.js';
