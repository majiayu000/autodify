/**
 * DSL Validator
 *
 * Validates Dify DSL for correctness and completeness.
 */

import { DifyDSLSchema } from '../schema/index.js';
import type { DifyDSL, Node, Edge, NodeData } from '../types/index.js';
import type { ValidationResult, ValidationError, ValidatorOptions } from './types.js';

/**
 * 变量引用正则表达式
 * 匹配 {{#node.variable#}} 格式
 */
const VARIABLE_REF_REGEX = /\{\{#([^.]+)\.([^#]+)#\}\}/g;

/**
 * 默认验证选项
 */
const defaultOptions: ValidatorOptions = {
  strict: false,
  checkVariableRefs: true,
  checkTopology: true,
};

/**
 * DSL 验证器类
 */
export class DSLValidator {
  private options: ValidatorOptions;

  constructor(options: ValidatorOptions = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  /**
   * 验证 DSL
   */
  validate(dsl: DifyDSL): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // 1. Schema 验证
    this.validateSchema(dsl, errors);

    // 如果 schema 验证失败，提前返回
    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }

    // 2. 工作流特定验证
    if (dsl.workflow) {
      const { nodes, edges } = dsl.workflow.graph;

      // 拓扑验证
      if (this.options.checkTopology) {
        this.validateTopology(nodes, edges, errors, warnings);
      }

      // 变量引用验证
      if (this.options.checkVariableRefs) {
        this.validateVariableRefs(nodes, errors, warnings);
      }

      // 边验证
      this.validateEdges(nodes, edges, errors, warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Schema 验证
   */
  private validateSchema(dsl: DifyDSL, errors: ValidationError[]): void {
    const result = DifyDSLSchema.safeParse(dsl);

    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          path: issue.path.join('.'),
          message: issue.message,
          severity: 'error',
          code: 'SCHEMA_VALIDATION',
        });
      }
    }
  }

  /**
   * 拓扑验证
   */
  private validateTopology(
    nodes: Node<NodeData>[],
    edges: Edge[],
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    // 检查 Start 节点
    const startNodes = nodes.filter((n) => n.data.type === 'start');
    if (startNodes.length === 0) {
      errors.push({
        path: 'workflow.graph.nodes',
        message: 'Workflow must have exactly one "start" node',
        severity: 'error',
        code: 'MISSING_START_NODE',
      });
    } else if (startNodes.length > 1) {
      errors.push({
        path: 'workflow.graph.nodes',
        message: `Found ${startNodes.length} "start" nodes, expected exactly 1`,
        severity: 'error',
        code: 'MULTIPLE_START_NODES',
      });
    }

    // 检查 End 或 Answer 节点
    const endNodes = nodes.filter((n) => n.data.type === 'end' || n.data.type === 'answer');
    if (endNodes.length === 0) {
      errors.push({
        path: 'workflow.graph.nodes',
        message: 'Workflow must have at least one "end" or "answer" node',
        severity: 'error',
        code: 'MISSING_END_NODE',
      });
    }

    // 检查节点 ID 唯一性
    const nodeIds = new Set<string>();
    for (const node of nodes) {
      if (nodeIds.has(node.id)) {
        errors.push({
          path: `workflow.graph.nodes`,
          message: `Duplicate node ID: "${node.id}"`,
          severity: 'error',
          code: 'DUPLICATE_NODE_ID',
        });
      }
      nodeIds.add(node.id);
    }

    // 检查孤立节点（没有入边也没有出边，除了 start 节点）
    const nodesWithInEdges = new Set(edges.map((e) => e.target));
    const nodesWithOutEdges = new Set(edges.map((e) => e.source));

    for (const node of nodes) {
      if (node.data.type === 'start') continue;

      if (!nodesWithInEdges.has(node.id) && !nodesWithOutEdges.has(node.id)) {
        warnings.push({
          path: `workflow.graph.nodes[${node.id}]`,
          message: `Node "${node.id}" is isolated (no incoming or outgoing edges)`,
          severity: 'warning',
          code: 'ISOLATED_NODE',
        });
      }
    }

    // 检查不可达节点（从 start 无法到达）
    if (startNodes.length === 1) {
      const reachable = this.findReachableNodes(startNodes[0]!.id, edges);
      for (const node of nodes) {
        if (node.data.type !== 'start' && !reachable.has(node.id)) {
          warnings.push({
            path: `workflow.graph.nodes[${node.id}]`,
            message: `Node "${node.id}" is not reachable from start node`,
            severity: 'warning',
            code: 'UNREACHABLE_NODE',
          });
        }
      }
    }
  }

  /**
   * 查找从指定节点可达的所有节点
   */
  private findReachableNodes(startId: string, edges: Edge[]): Set<string> {
    const reachable = new Set<string>();
    const queue = [startId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (reachable.has(current)) continue;
      reachable.add(current);

      // 找到所有从当前节点出发的边
      for (const edge of edges) {
        if (edge.source === current && !reachable.has(edge.target)) {
          queue.push(edge.target);
        }
      }
    }

    return reachable;
  }

  /**
   * 边验证
   */
  private validateEdges(
    nodes: Node<NodeData>[],
    edges: Edge[],
    errors: ValidationError[],
    _warnings: ValidationError[]
  ): void {
    const nodeIds = new Set(nodes.map((n) => n.id));

    for (const edge of edges) {
      // 检查 source 节点存在
      if (!nodeIds.has(edge.source)) {
        errors.push({
          path: `workflow.graph.edges[${edge.id}]`,
          message: `Edge source "${edge.source}" does not exist`,
          severity: 'error',
          code: 'INVALID_EDGE_SOURCE',
        });
      }

      // 检查 target 节点存在
      if (!nodeIds.has(edge.target)) {
        errors.push({
          path: `workflow.graph.edges[${edge.id}]`,
          message: `Edge target "${edge.target}" does not exist`,
          severity: 'error',
          code: 'INVALID_EDGE_TARGET',
        });
      }

      // 检查自引用
      if (edge.source === edge.target) {
        errors.push({
          path: `workflow.graph.edges[${edge.id}]`,
          message: `Edge cannot connect a node to itself`,
          severity: 'error',
          code: 'SELF_REFERENCE_EDGE',
        });
      }
    }

    // 检查重复边
    const edgeKeys = new Set<string>();
    for (const edge of edges) {
      const key = `${edge.source}:${edge.sourceHandle}:${edge.target}:${edge.targetHandle}`;
      if (edgeKeys.has(key)) {
        errors.push({
          path: `workflow.graph.edges[${edge.id}]`,
          message: `Duplicate edge from "${edge.source}" to "${edge.target}"`,
          severity: 'error',
          code: 'DUPLICATE_EDGE',
        });
      }
      edgeKeys.add(key);
    }
  }

  /**
   * 变量引用验证
   */
  private validateVariableRefs(
    nodes: Node<NodeData>[],
    errors: ValidationError[],
    _warnings: ValidationError[]
  ): void {
    // 收集所有节点的输出变量
    const availableVars = new Map<string, Set<string>>();

    for (const node of nodes) {
      const nodeVars = this.getNodeOutputVars(node);
      availableVars.set(node.id, nodeVars);
    }

    // 添加系统变量
    availableVars.set('sys', new Set(['query', 'user_id', 'conversation_id', 'files']));
    availableVars.set('env', new Set()); // 环境变量，动态的

    // 检查每个节点中的变量引用
    for (const node of nodes) {
      const refs = this.extractVariableRefs(node);

      for (const ref of refs) {
        const { nodeId, varName, path } = ref;

        // 跳过环境变量检查
        if (nodeId === 'env') continue;

        // 检查节点是否存在
        if (!availableVars.has(nodeId)) {
          errors.push({
            path: `workflow.graph.nodes[${node.id}].${path}`,
            message: `Variable reference to non-existent node: "${nodeId}"`,
            severity: 'error',
            code: 'INVALID_VAR_REF_NODE',
          });
          continue;
        }

        // 对于非 sys 变量，检查变量是否存在
        // 注意：这里简化处理，实际需要考虑节点顺序
        const nodeVars = availableVars.get(nodeId)!;
        if (nodeId !== 'sys' && nodeVars.size > 0 && !nodeVars.has(varName)) {
          // 这是一个 warning 而不是 error，因为我们可能没有完整的变量信息
          // warnings.push({
          //   path: `workflow.graph.nodes[${node.id}].${path}`,
          //   message: `Variable "${varName}" may not exist on node "${nodeId}"`,
          //   severity: 'warning',
          //   code: 'UNKNOWN_VARIABLE',
          // });
        }
      }
    }
  }

  /**
   * 获取节点的输出变量
   */
  private getNodeOutputVars(node: Node<NodeData>): Set<string> {
    const vars = new Set<string>();

    switch (node.data.type) {
      case 'start':
        for (const v of node.data.variables) {
          vars.add(v.variable);
        }
        break;
      case 'llm':
        vars.add('text');
        break;
      case 'code':
        for (const output of node.data.outputs) {
          vars.add(output.variable);
        }
        break;
      case 'http-request':
        vars.add('status_code');
        vars.add('body');
        vars.add('headers');
        break;
      case 'knowledge-retrieval':
        vars.add('result');
        break;
      case 'question-classifier':
        vars.add('class_name');
        break;
      case 'parameter-extractor':
        for (const param of node.data.parameters) {
          vars.add(param.name);
        }
        break;
      case 'template-transform':
        vars.add('output');
        break;
      case 'variable-aggregator':
        vars.add('output');
        break;
      case 'iteration':
        vars.add('output');
        break;
      case 'agent':
        vars.add('text');
        break;
      case 'document-extractor':
        vars.add('text');
        break;
    }

    return vars;
  }

  /**
   * 从节点中提取变量引用
   */
  private extractVariableRefs(
    node: Node<NodeData>
  ): Array<{ nodeId: string; varName: string; path: string }> {
    const refs: Array<{ nodeId: string; varName: string; path: string }> = [];

    const extractFromString = (str: string, path: string) => {
      let match;
      while ((match = VARIABLE_REF_REGEX.exec(str)) !== null) {
        refs.push({
          nodeId: match[1]!,
          varName: match[2]!,
          path,
        });
      }
    };

    const extractFromObject = (obj: unknown, path: string) => {
      if (typeof obj === 'string') {
        extractFromString(obj, path);
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          extractFromObject(item, `${path}[${index}]`);
        });
      } else if (obj && typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
          extractFromObject(value, `${path}.${key}`);
        }
      }
    };

    extractFromObject(node.data, 'data');

    return refs;
  }
}

/**
 * 验证 DSL 的快捷函数
 */
export function validateDSL(dsl: DifyDSL, options?: ValidatorOptions): ValidationResult {
  const validator = new DSLValidator(options);
  return validator.validate(dsl);
}

/**
 * 验证 DSL 并在失败时抛出错误
 */
export function validateDSLOrThrow(dsl: DifyDSL, options?: ValidatorOptions): void {
  const result = validateDSL(dsl, options);
  if (!result.valid) {
    const errorMessages = result.errors.map((e) => `[${e.path}] ${e.message}`).join('\n');
    throw new Error(`DSL validation failed:\n${errorMessages}`);
  }
}
