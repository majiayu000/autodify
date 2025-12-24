/**
 * Dependency Analyzer
 *
 * Analyze variable dependencies and execution order in workflows.
 */

import type { DifyDSL, Node, NodeData } from '../types/index.js';
import type {
  VariableReference,
  NodeDependency,
  DependencyGraph,
  VariableAnalysis,
  AnalysisResult,
  AnalysisIssue,
} from './types.js';

/**
 * Variable reference pattern
 */
const VARIABLE_PATTERN = /\{\{#([^.]+)\.([^#]+)#\}\}/g;

/**
 * Dependency Analyzer
 */
export class DependencyAnalyzer {
  /**
   * Analyze a workflow DSL
   */
  analyze(dsl: DifyDSL): AnalysisResult {
    const nodes = dsl.workflow?.graph.nodes ?? [];
    const edges = dsl.workflow?.graph.edges ?? [];

    // Build dependency graph
    const dependencies = this.buildDependencyGraph(nodes, edges);

    // Analyze variables
    const variables = this.analyzeVariables(nodes);

    // Collect issues
    const issues = this.collectIssues(dependencies, variables);

    return {
      dependencies,
      variables,
      issues,
    };
  }

  /**
   * Build dependency graph from nodes and edges
   */
  private buildDependencyGraph(
    nodes: Node<NodeData>[],
    edges: Array<{ source: string; target: string }>
  ): DependencyGraph {
    const nodeMap = new Map<string, NodeDependency>();

    // Initialize all nodes
    for (const node of nodes) {
      const variableRefs = this.extractVariableReferences(node);
      const providesVars = this.extractProvidedVariables(node);

      nodeMap.set(node.id, {
        nodeId: node.id,
        dependsOn: [],
        dependedBy: [],
        variableReferences: variableRefs,
        providesVariables: providesVars,
      });
    }

    // Build edge-based dependencies
    for (const edge of edges) {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);

      if (sourceNode && targetNode) {
        if (!sourceNode.dependedBy.includes(edge.target)) {
          sourceNode.dependedBy.push(edge.target);
        }
        if (!targetNode.dependsOn.includes(edge.source)) {
          targetNode.dependsOn.push(edge.source);
        }
      }
    }

    // Add variable-based dependencies
    for (const [nodeId, nodeDep] of nodeMap) {
      for (const ref of nodeDep.variableReferences) {
        if (ref.nodeId !== nodeId && !nodeDep.dependsOn.includes(ref.nodeId)) {
          nodeDep.dependsOn.push(ref.nodeId);

          const sourceNode = nodeMap.get(ref.nodeId);
          if (sourceNode && !sourceNode.dependedBy.includes(nodeId)) {
            sourceNode.dependedBy.push(nodeId);
          }
        }
      }
    }

    // Compute topological order and detect cycles
    const { order, cycles } = this.topologicalSort(nodeMap);

    // Find orphan nodes
    const orphanNodes = Array.from(nodeMap.entries())
      .filter(([id, dep]) => {
        // Start node is allowed to have no inputs
        const node = nodes.find((n) => n.id === id);
        if (node?.data.type === 'start') return false;
        // End node is allowed to have no outputs
        if (node?.data.type === 'end') return false;
        // Orphan if no connections at all
        return dep.dependsOn.length === 0 && dep.dependedBy.length === 0;
      })
      .map(([id]) => id);

    return {
      nodes: nodeMap,
      topologicalOrder: order,
      circularDependencies: cycles,
      orphanNodes,
    };
  }

  /**
   * Extract variable references from a node
   */
  private extractVariableReferences(node: Node<NodeData>): VariableReference[] {
    const references: VariableReference[] = [];
    const nodeData = node.data;

    // Search for variable patterns in string fields
    const searchStrings = this.collectStringsFromObject(nodeData);

    for (const str of searchStrings) {
      let match;
      const pattern = new RegExp(VARIABLE_PATTERN.source, 'g');

      while ((match = pattern.exec(str)) !== null) {
        references.push({
          nodeId: match[1]!,
          variable: match[2]!,
          fullReference: match[0],
        });
      }
    }

    // Also check explicit variable selectors
    this.extractSelectorReferences(nodeData, references);

    return references;
  }

  /**
   * Extract references from variable_selector fields
   */
  private extractSelectorReferences(
    obj: unknown,
    references: VariableReference[]
  ): void {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      // Check if this looks like a variable selector [nodeId, varName]
      if (obj.length === 2 && typeof obj[0] === 'string' && typeof obj[1] === 'string') {
        const existing = references.find(
          (r) => r.nodeId === obj[0] && r.variable === obj[1]
        );
        if (!existing) {
          references.push({
            nodeId: obj[0],
            variable: obj[1],
            fullReference: `{{#${obj[0]}.${obj[1]}#}}`,
          });
        }
      } else {
        for (const item of obj) {
          this.extractSelectorReferences(item, references);
        }
      }
      return;
    }

    const record = obj as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (
        key === 'variable_selector' ||
        key === 'query_variable_selector' ||
        key === 'value_selector'
      ) {
        const selector = record[key];
        if (Array.isArray(selector) && selector.length >= 2) {
          const [nodeId, varName] = selector as [string, string];
          if (typeof nodeId === 'string' && typeof varName === 'string') {
            const existing = references.find(
              (r) => r.nodeId === nodeId && r.variable === varName
            );
            if (!existing) {
              references.push({
                nodeId,
                variable: varName,
                fullReference: `{{#${nodeId}.${varName}#}}`,
              });
            }
          }
        }
      } else {
        this.extractSelectorReferences(record[key], references);
      }
    }
  }

  /**
   * Collect all strings from an object recursively
   */
  private collectStringsFromObject(obj: unknown): string[] {
    const strings: string[] = [];

    if (typeof obj === 'string') {
      strings.push(obj);
    } else if (Array.isArray(obj)) {
      for (const item of obj) {
        strings.push(...this.collectStringsFromObject(item));
      }
    } else if (obj && typeof obj === 'object') {
      for (const value of Object.values(obj as Record<string, unknown>)) {
        strings.push(...this.collectStringsFromObject(value));
      }
    }

    return strings;
  }

  /**
   * Extract variables provided by a node
   */
  private extractProvidedVariables(node: Node<NodeData>): string[] {
    const variables: string[] = [];
    const type = node.data.type;

    switch (type) {
      case 'start':
        // Start node provides input variables
        const startData = node.data as { variables?: Array<{ variable: string }> };
        if (startData.variables) {
          for (const v of startData.variables) {
            variables.push(v.variable);
          }
        }
        break;

      case 'llm':
        variables.push('text');
        break;

      case 'knowledge-retrieval':
        variables.push('result');
        break;

      case 'code':
        const codeData = node.data as { outputs?: Array<{ variable: string }> };
        if (codeData.outputs) {
          for (const o of codeData.outputs) {
            variables.push(o.variable);
          }
        }
        break;

      case 'http-request':
        variables.push('body', 'status_code', 'headers');
        break;

      case 'question-classifier':
        variables.push('class_name');
        break;

      case 'variable-aggregator':
        variables.push('output');
        break;

      case 'template-transform':
        variables.push('output');
        break;

      case 'parameter-extractor':
        const extractorData = node.data as { parameters?: Array<{ name: string }> };
        if (extractorData.parameters) {
          for (const p of extractorData.parameters) {
            variables.push(p.name);
          }
        }
        break;

      default:
        // Default output for unknown types
        variables.push('output');
    }

    return variables;
  }

  /**
   * Analyze variables in the workflow
   */
  private analyzeVariables(nodes: Node<NodeData>[]): VariableAnalysis {
    const definedVariables = new Map<string, { nodeId: string; type: string }>();
    const referencedVariables: VariableReference[] = [];
    const undefinedReferences: VariableReference[] = [];
    const unusedVariables: Array<{ nodeId: string; variable: string }> = [];

    // Collect all defined variables
    for (const node of nodes) {
      const provided = this.extractProvidedVariables(node);
      for (const varName of provided) {
        const key = `${node.id}.${varName}`;
        definedVariables.set(key, { nodeId: node.id, type: node.data.type });
      }
    }

    // Collect all references
    for (const node of nodes) {
      const refs = this.extractVariableReferences(node);
      referencedVariables.push(...refs);
    }

    // Find undefined references
    for (const ref of referencedVariables) {
      const key = `${ref.nodeId}.${ref.variable}`;
      if (!definedVariables.has(key)) {
        undefinedReferences.push(ref);
      }
    }

    // Find unused variables
    const referencedKeys = new Set(
      referencedVariables.map((r) => `${r.nodeId}.${r.variable}`)
    );

    for (const [key, info] of definedVariables) {
      // Skip start node inputs (they're used as workflow inputs)
      if (info.type === 'start') continue;

      if (!referencedKeys.has(key)) {
        const [nodeId, variable] = key.split('.');
        unusedVariables.push({ nodeId: nodeId!, variable: variable! });
      }
    }

    return {
      definedVariables,
      referencedVariables,
      undefinedReferences,
      unusedVariables,
    };
  }

  /**
   * Topological sort with cycle detection (Kahn's algorithm)
   */
  private topologicalSort(
    nodes: Map<string, NodeDependency>
  ): { order: string[]; cycles: string[][] } {
    const order: string[] = [];
    const cycles: string[][] = [];

    // Calculate in-degree for each node
    const inDegree = new Map<string, number>();
    for (const nodeId of nodes.keys()) {
      inDegree.set(nodeId, 0);
    }
    for (const [, dep] of nodes) {
      for (const dependentId of dep.dependedBy) {
        inDegree.set(dependentId, (inDegree.get(dependentId) ?? 0) + 1);
      }
    }

    // Start with nodes that have no dependencies
    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    // Process nodes
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      order.push(nodeId);

      const node = nodes.get(nodeId);
      if (node) {
        for (const dependentId of node.dependedBy) {
          const newDegree = (inDegree.get(dependentId) ?? 0) - 1;
          inDegree.set(dependentId, newDegree);
          if (newDegree === 0) {
            queue.push(dependentId);
          }
        }
      }
    }

    // Detect cycles - if not all nodes are in the order, there's a cycle
    if (order.length < nodes.size) {
      // Find nodes not in order (part of cycles)
      const cycleNodes = Array.from(nodes.keys()).filter((id) => !order.includes(id));

      // Use DFS to find actual cycle paths
      const visited = new Set<string>();
      const inStack = new Set<string>();

      const findCycle = (nodeId: string, path: string[]): void => {
        if (inStack.has(nodeId)) {
          const cycleStart = path.indexOf(nodeId);
          if (cycleStart >= 0) {
            cycles.push([...path.slice(cycleStart), nodeId]);
          }
          return;
        }

        if (visited.has(nodeId)) return;

        visited.add(nodeId);
        inStack.add(nodeId);

        const node = nodes.get(nodeId);
        if (node) {
          for (const depId of node.dependsOn) {
            findCycle(depId, [...path, nodeId]);
          }
        }

        inStack.delete(nodeId);
      };

      for (const nodeId of cycleNodes) {
        if (!visited.has(nodeId)) {
          findCycle(nodeId, []);
        }
      }

      // Add cycle nodes to order at the end
      for (const nodeId of cycleNodes) {
        if (!order.includes(nodeId)) {
          order.push(nodeId);
        }
      }
    }

    return { order, cycles };
  }

  /**
   * Collect analysis issues
   */
  private collectIssues(
    dependencies: DependencyGraph,
    variables: VariableAnalysis
  ): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    // Circular dependencies
    for (const cycle of dependencies.circularDependencies) {
      issues.push({
        type: 'error',
        code: 'CIRCULAR_DEPENDENCY',
        message: `Circular dependency detected: ${cycle.join(' -> ')}`,
        details: { cycle },
      });
    }

    // Orphan nodes
    for (const nodeId of dependencies.orphanNodes) {
      issues.push({
        type: 'warning',
        code: 'ORPHAN_NODE',
        message: `Node "${nodeId}" is not connected to the workflow`,
        nodeId,
      });
    }

    // Undefined variable references
    for (const ref of variables.undefinedReferences) {
      issues.push({
        type: 'error',
        code: 'UNDEFINED_VARIABLE',
        message: `Reference to undefined variable: ${ref.fullReference}`,
        details: { nodeId: ref.nodeId, variable: ref.variable },
      });
    }

    // Unused variables (info level)
    for (const unused of variables.unusedVariables) {
      issues.push({
        type: 'info',
        code: 'UNUSED_VARIABLE',
        message: `Variable "${unused.nodeId}.${unused.variable}" is defined but never used`,
        nodeId: unused.nodeId,
        details: { variable: unused.variable },
      });
    }

    return issues;
  }
}

/**
 * Create a dependency analyzer
 */
export function createDependencyAnalyzer(): DependencyAnalyzer {
  return new DependencyAnalyzer();
}
