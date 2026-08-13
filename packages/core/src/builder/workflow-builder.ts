/**
 * Workflow Builder
 *
 * Fluent API for building complete workflows.
 */

import type { DifyDSL, Node, Edge, NodeData, NodeType } from '../types/index.js';
import { createEdge } from '../types/edge.js';
import type {
  WorkflowBuilderOptions,
  StartNodeOptions,
  EndNodeOptions,
  LLMNodeOptions,
  KnowledgeRetrievalNodeOptions,
  QuestionClassifierNodeOptions,
  IfElseNodeOptions,
  CodeNodeOptions,
  HttpRequestNodeOptions,
  TemplateNodeOptions,
  AggregatorNodeOptions,
  ConnectOptions,
} from './types.js';
import {
  createStartNode,
  createEndNode,
  createAnswerNode,
  createLLMNode,
  createKnowledgeRetrievalNode,
  createQuestionClassifierNode,
  createIfElseNode,
  createCodeNode,
  createHttpRequestNode,
  createTemplateNode,
  createAggregatorNode,
} from './node-builder.js';

/**
 * 工作流构建器
 *
 * 提供流畅的 API 用于构建 Dify 工作流。
 *
 * @example
 * ```typescript
 * const dsl = new WorkflowBuilder({ name: '问答工作流' })
 *   .addStart({
 *     variables: [{ name: 'question', label: '问题', type: 'paragraph' }]
 *   })
 *   .addLLM({
 *     systemPrompt: '你是助手',
 *     userPrompt: '{{#start.question#}}'
 *   })
 *   .addEnd({
 *     outputs: [{ name: 'answer', source: ['llm-1', 'text'] }]
 *   })
 *   .connect('start', 'llm-1')
 *   .connect('llm-1', 'end-1')
 *   .build();
 * ```
 */
export class WorkflowBuilder {
  private nodes: Node<NodeData>[] = [];
  private edges: Edge[] = [];
  private options: WorkflowBuilderOptions;
  private lastNodeId: string | null = null;

  constructor(options: WorkflowBuilderOptions) {
    this.options = options;
  }

  /**
   * 添加 Start 节点
   */
  addStart(options: Omit<StartNodeOptions, 'id'>): this {
    const node = createStartNode({ ...options, id: 'start' });
    this.nodes.push(node);
    this.lastNodeId = node.id;
    return this;
  }

  /**
   * 添加 End 节点
   */
  addEnd(options: Omit<EndNodeOptions, 'id'> & { id?: string }): this {
    const node = createEndNode(options);
    this.nodes.push(node);
    this.lastNodeId = node.id;
    return this;
  }

  /**
   * 添加 Answer 节点 (Chatflow)
   */
  addAnswer(options: { id?: string; title?: string; answer: string }): this {
    const node = createAnswerNode(options);
    this.nodes.push(node);
    this.lastNodeId = node.id;
    return this;
  }

  /**
   * 添加 LLM 节点
   */
  addLLM(options: LLMNodeOptions): this {
    const node = createLLMNode(options);
    this.nodes.push(node);
    this.lastNodeId = node.id;
    return this;
  }

  /**
   * 添加知识检索节点
   */
  addKnowledgeRetrieval(options: KnowledgeRetrievalNodeOptions): this {
    const node = createKnowledgeRetrievalNode(options);
    this.nodes.push(node);
    this.lastNodeId = node.id;
    return this;
  }

  /**
   * 添加问题分类节点
   */
  addQuestionClassifier(options: QuestionClassifierNodeOptions): this {
    const node = createQuestionClassifierNode(options);
    this.nodes.push(node);
    this.lastNodeId = node.id;
    return this;
  }

  /**
   * 添加 IF/ELSE 条件节点
   */
  addIfElse(options: IfElseNodeOptions): this {
    const node = createIfElseNode(options);
    this.nodes.push(node);
    this.lastNodeId = node.id;
    return this;
  }

  /**
   * 添加代码节点
   */
  addCode(options: CodeNodeOptions): this {
    const node = createCodeNode(options);
    this.nodes.push(node);
    this.lastNodeId = node.id;
    return this;
  }

  /**
   * 添加 HTTP 请求节点
   */
  addHttpRequest(options: HttpRequestNodeOptions): this {
    const node = createHttpRequestNode(options);
    this.nodes.push(node);
    this.lastNodeId = node.id;
    return this;
  }

  /**
   * 添加模板转换节点
   */
  addTemplate(options: TemplateNodeOptions): this {
    const node = createTemplateNode(options);
    this.nodes.push(node);
    this.lastNodeId = node.id;
    return this;
  }

  /**
   * 添加变量聚合节点
   */
  addAggregator(options: AggregatorNodeOptions): this {
    const node = createAggregatorNode(options);
    this.nodes.push(node);
    this.lastNodeId = node.id;
    return this;
  }

  /**
   * 添加通用节点
   */
  addNode(node: Node<NodeData>): this {
    this.nodes.push(node);
    this.lastNodeId = node.id;
    return this;
  }

  /**
   * 连接两个节点
   */
  connect(source: string, target: string, options?: ConnectOptions): this {
    const sourceNode = this.nodes.find((n) => n.id === source);
    const targetNode = this.nodes.find((n) => n.id === target);

    if (!sourceNode) {
      throw new Error(`Source node "${source}" not found`);
    }
    if (!targetNode) {
      throw new Error(`Target node "${target}" not found`);
    }

    const edge = createEdge({
      source,
      target,
      sourceHandle: options?.sourceHandle ?? 'source',
      sourceType: sourceNode.data.type as NodeType,
      targetType: targetNode.data.type as NodeType,
    });

    this.edges.push(edge);
    return this;
  }

  /**
   * 自动连接到上一个节点
   */
  connectFromLast(target: string, options?: ConnectOptions): this {
    if (!this.lastNodeId) {
      throw new Error('No previous node to connect from');
    }
    return this.connect(this.lastNodeId, target, options);
  }

  /**
   * 链式添加并自动连接
   *
   * @example
   * ```typescript
   * builder
   *   .addStart({ variables: [...] })
   *   .chain()
   *   .addLLM({ ... })  // 自动连接到 start
   *   .chain()
   *   .addEnd({ ... })  // 自动连接到 llm
   * ```
   */
  chain(): ChainBuilder {
    return new ChainBuilder(this);
  }

  /**
   * 获取最后添加的节点 ID
   */
  getLastNodeId(): string | null {
    return this.lastNodeId;
  }

  /**
   * 获取所有节点
   */
  getNodes(): Node<NodeData>[] {
    return [...this.nodes];
  }

  /**
   * 获取所有边
   */
  getEdges(): Edge[] {
    return [...this.edges];
  }

  /**
   * 构建最终的 DSL
   */
  build(): DifyDSL {
    return {
      version: '0.5.0',
      kind: 'app',
      app: {
        name: this.options.name,
        mode: this.options.mode ?? 'workflow',
        icon: this.options.icon ?? '🤖',
        icon_type: 'emoji',
        description: this.options.description,
      },
      workflow: {
        graph: {
          nodes: this.nodes,
          edges: this.edges,
        },
        features: {
          file_upload: { enabled: false },
          text_to_speech: { enabled: false },
        },
      },
    };
  }
}

/**
 * 链式构建器辅助类
 */
class ChainBuilder {
  private builder: WorkflowBuilder;
  private previousNodeId: string | null;

  constructor(builder: WorkflowBuilder) {
    this.builder = builder;
    this.previousNodeId = builder.getLastNodeId();
  }

  addLLM(options: LLMNodeOptions): WorkflowBuilder {
    this.builder.addLLM(options);
    if (this.previousNodeId) {
      this.builder.connect(this.previousNodeId, this.builder.getLastNodeId()!);
    }
    return this.builder;
  }

  addEnd(options: Omit<EndNodeOptions, 'id'> & { id?: string }): WorkflowBuilder {
    this.builder.addEnd(options);
    if (this.previousNodeId) {
      this.builder.connect(this.previousNodeId, this.builder.getLastNodeId()!);
    }
    return this.builder;
  }

  addKnowledgeRetrieval(options: KnowledgeRetrievalNodeOptions): WorkflowBuilder {
    this.builder.addKnowledgeRetrieval(options);
    if (this.previousNodeId) {
      this.builder.connect(this.previousNodeId, this.builder.getLastNodeId()!);
    }
    return this.builder;
  }

  addCode(options: CodeNodeOptions): WorkflowBuilder {
    this.builder.addCode(options);
    if (this.previousNodeId) {
      this.builder.connect(this.previousNodeId, this.builder.getLastNodeId()!);
    }
    return this.builder;
  }

  addHttpRequest(options: HttpRequestNodeOptions): WorkflowBuilder {
    this.builder.addHttpRequest(options);
    if (this.previousNodeId) {
      this.builder.connect(this.previousNodeId, this.builder.getLastNodeId()!);
    }
    return this.builder;
  }

  addTemplate(options: TemplateNodeOptions): WorkflowBuilder {
    this.builder.addTemplate(options);
    if (this.previousNodeId) {
      this.builder.connect(this.previousNodeId, this.builder.getLastNodeId()!);
    }
    return this.builder;
  }
}

/**
 * 快捷函数：创建工作流构建器
 */
export function createWorkflow(options: WorkflowBuilderOptions): WorkflowBuilder {
  return new WorkflowBuilder(options);
}
