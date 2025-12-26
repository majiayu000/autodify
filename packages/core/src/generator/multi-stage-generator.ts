/**
 * Multi-Stage DSL Generator
 *
 * Generates complex workflows through a multi-stage pipeline:
 * 1. Intent Analysis - Understand requirements and plan nodes
 * 2. Node-by-Node Generation - Generate each node with validation
 * 3. Edge Connection - Auto-infer edges based on data flow
 * 4. Assembly - Combine into valid DSL
 */

import type { ILLMService } from '../llm/types.js';
import type { DifyDSL, Node, Edge, NodeData } from '../types/index.js';
import { NodeDataSchema } from '../schema/nodes.js';
import { getNodeTemplate, NODE_TEMPLATES } from './node-templates.js';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export interface MultiStageNodePlan {
  id: string;
  type: NodeData['type'];
  title: string;
  description: string;
  inputs?: Array<{ from: string; variable: string }>;
  config?: Record<string, unknown>;
}

export interface MultiStageWorkflowPlan {
  name: string;
  description: string;
  nodes: MultiStageNodePlan[];
  complexity: 'simple' | 'medium' | 'complex';
}

export interface MultiStageGeneratorConfig {
  maxRetries: number;
  verbose: boolean;
  preferredProvider?: string;
  preferredModel?: string;
}

// Type aliases for internal use
type NodePlan = MultiStageNodePlan;
type WorkflowPlan = MultiStageWorkflowPlan;
type GeneratorConfig = MultiStageGeneratorConfig;

// ============================================================================
// Stage 1: Intent Analysis Schema
// ============================================================================

const WorkflowPlanSchema = z.object({
  name: z.string(),
  description: z.string(),
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    description: z.string(),
    inputs: z.array(z.object({
      from: z.string(),
      variable: z.string(),
    })).optional(),
    config: z.record(z.unknown()).optional(),
  })),
  complexity: z.enum(['simple', 'medium', 'complex']),
});

// ============================================================================
// Multi-Stage Generator Class
// ============================================================================

export class MultiStageGenerator {
  private llm: ILLMService;
  private config: GeneratorConfig;

  constructor(llm: ILLMService, config: Partial<GeneratorConfig> = {}) {
    this.llm = llm;
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      verbose: config.verbose ?? false,
      preferredProvider: config.preferredProvider,
      preferredModel: config.preferredModel,
    };
  }

  /**
   * Generate a complete workflow DSL from natural language
   */
  async generate(prompt: string): Promise<{ success: boolean; dsl?: DifyDSL; error?: string }> {
    try {
      // Stage 1: Analyze intent and create plan
      this.log('Stage 1: Analyzing intent...');
      const plan = await this.analyzeIntent(prompt);
      this.log(`Plan created: ${plan.nodes.length} nodes, complexity: ${plan.complexity}`);

      // Stage 2: Generate nodes one by one
      this.log('Stage 2: Generating nodes...');
      const nodes: Node<NodeData>[] = [];

      for (const nodePlan of plan.nodes) {
        this.log(`  Generating node: ${nodePlan.id} (${nodePlan.type})`);
        const node = await this.generateNode(nodePlan, nodes);
        nodes.push(node);
      }

      // Stage 3: Infer edges
      this.log('Stage 3: Inferring edges...');
      const edges = this.inferEdges(nodes, plan.nodes);
      this.log(`  Created ${edges.length} edges`);

      // Stage 4: Assemble DSL
      this.log('Stage 4: Assembling DSL...');
      const dsl = this.assembleDSL(plan, nodes, edges);

      return { success: true, dsl };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Stage 1: Analyze intent and create workflow plan
   */
  private async analyzeIntent(prompt: string): Promise<WorkflowPlan> {
    const systemPrompt = `你是一个工作流规划专家。分析用户需求，输出工作流计划。

输出 JSON 格式：
{
  "name": "工作流名称",
  "description": "工作流描述",
  "complexity": "simple|medium|complex",
  "nodes": [
    {
      "id": "唯一ID，如 start, llm_1, condition_1",
      "type": "节点类型",
      "title": "节点标题",
      "description": "节点功能描述",
      "inputs": [{"from": "来源节点ID", "variable": "变量名"}],
      "config": {"特定配置": "值"}
    }
  ]
}

可用节点类型:
- start: 开始节点，定义输入变量
- end: 结束节点，定义输出
- llm: LLM 调用节点
- knowledge-retrieval: 知识库检索
- question-classifier: 问题分类（需要至少2个分类）
- if-else: 条件分支
- code: 代码执行
- http-request: HTTP 请求
- variable-aggregator: 变量聚合

规则:
1. 必须有且只有一个 start 节点
2. 必须有至少一个 end 节点
3. question-classifier 需要在 config 中指定 classes 数组（至少2个）
4. if-else 需要在 config 中指定 conditions
5. ID 使用有意义的名称，如 start, llm_answer, classify_intent`;

    const response = await this.llm.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.3, responseFormat: 'json' }
    );

    const parsed = this.parseJSON(response.content);
    const validated = WorkflowPlanSchema.parse(parsed);

    return validated as WorkflowPlan;
  }

  /**
   * Stage 2: Generate a single node with validation and retry
   */
  private async generateNode(
    plan: NodePlan,
    existingNodes: Node<NodeData>[]
  ): Promise<Node<NodeData>> {
    // Get template for complex nodes
    const template = getNodeTemplate(plan.type);

    // Build context from existing nodes
    const context = existingNodes.map(n => ({
      id: n.id,
      type: n.data.type,
      outputs: this.getNodeOutputs(n),
    }));

    const systemPrompt = `生成 Dify 工作流节点的 data 部分。输出纯 JSON，不要 markdown。

节点类型: ${plan.type}
节点 ID: ${plan.id}
节点功能: ${plan.description}

${template ? `参考结构:\n${JSON.stringify(template, null, 2)}` : ''}

已有节点（可引用其输出）:
${JSON.stringify(context, null, 2)}

${plan.config ? `用户指定配置:\n${JSON.stringify(plan.config, null, 2)}` : ''}

变量引用格式: ["节点ID", "变量名"]
例如引用 start 节点的 input: ["start", "input"]

输出完整的节点 data JSON。`;

    let lastError: string | null = null;

    for (let retry = 0; retry < this.config.maxRetries; retry++) {
      try {
        const userPrompt = lastError
          ? `上次生成失败: ${lastError}\n\n请修正并重新生成节点 data。`
          : `生成 ${plan.title} 节点的完整 data。`;

        const response = await this.llm.chat(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          { temperature: 0.2, responseFormat: 'json' }
        );

        const nodeData = this.parseJSON(response.content);

        // Validate against schema
        const validation = NodeDataSchema.safeParse(nodeData);

        if (validation.success) {
          return {
            id: plan.id,
            type: 'custom',
            data: validation.data as NodeData,
          };
        }

        // Collect validation errors
        lastError = validation.error.issues
          .map(i => `${i.path.join('.')}: ${i.message}`)
          .join('; ');

        this.log(`    Retry ${retry + 1}: ${lastError}`);
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Parse error';
        this.log(`    Retry ${retry + 1}: ${lastError}`);
      }
    }

    // Fallback: use template with defaults
    if (template) {
      this.log(`    Using template fallback for ${plan.type}`);
      return this.createFromTemplate(plan, existingNodes);
    }

    throw new Error(`Failed to generate node ${plan.id}: ${lastError}`);
  }

  /**
   * Create node from template with plan data
   */
  private createFromTemplate(
    plan: NodePlan,
    _existingNodes: Node<NodeData>[]
  ): Node<NodeData> {
    const template = NODE_TEMPLATES[plan.type];
    if (!template) {
      throw new Error(`No template for node type: ${plan.type}`);
    }

    // Deep clone and customize
    const data = JSON.parse(JSON.stringify(template));
    data.title = plan.title;
    data.desc = plan.description;

    // Apply config overrides
    if (plan.config) {
      Object.assign(data, plan.config);
    }

    // Wire up inputs
    if (plan.inputs && plan.inputs.length > 0) {
      this.wireInputs(data, plan.inputs);
    }

    return {
      id: plan.id,
      type: 'custom',
      data: data as NodeData,
    };
  }

  /**
   * Wire input references into node data
   */
  private wireInputs(data: Record<string, unknown>, inputs: Array<{ from: string; variable: string }>) {
    const firstInput = inputs[0];
    if (!firstInput) return;

    // Common input patterns
    if ('query_variable_selector' in data) {
      data['query_variable_selector'] = [firstInput.from, firstInput.variable];
    }
    if ('prompt_template' in data && Array.isArray(data['prompt_template'])) {
      const promptTemplate = data['prompt_template'] as Array<{ role: string; text?: string }>;
      const userPrompt = promptTemplate.find((p) => p.role === 'user');
      if (userPrompt) {
        userPrompt.text = `{{#${firstInput.from}.${firstInput.variable}#}}`;
      }
    }
  }

  /**
   * Stage 3: Infer edges from node plans
   */
  private inferEdges(nodes: Node<NodeData>[], plans: NodePlan[]): Edge[] {
    const edges: Edge[] = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const planMap = new Map(plans.map(p => [p.id, p]));

    // Create edges based on plan inputs
    for (const plan of plans) {
      if (plan.inputs) {
        for (const input of plan.inputs) {
          const sourceNode = nodeMap.get(input.from);
          const targetNode = nodeMap.get(plan.id);

          if (sourceNode && targetNode) {
            edges.push(this.createEdge(sourceNode, targetNode));
          }
        }
      }
    }

    // If no explicit inputs, create sequential edges
    if (edges.length === 0) {
      for (let i = 0; i < nodes.length - 1; i++) {
        edges.push(this.createEdge(nodes[i]!, nodes[i + 1]!));
      }
    }

    // Handle branch nodes (question-classifier, if-else)
    for (const node of nodes) {
      if (node.data.type === 'question-classifier') {
        this.addClassifierEdges(node, nodes, edges, planMap);
      } else if (node.data.type === 'if-else') {
        this.addIfElseEdges(node, nodes, edges, planMap);
      }
    }

    return edges;
  }

  /**
   * Create edge between two nodes
   */
  private createEdge(source: Node<NodeData>, target: Node<NodeData>): Edge {
    return {
      id: `${source.id}-source-${target.id}-target`,
      source: source.id,
      sourceHandle: 'source',
      target: target.id,
      targetHandle: 'target',
      type: 'custom',
      data: {
        sourceType: source.data.type,
        targetType: target.data.type,
        isInIteration: false,
      },
    };
  }

  /**
   * Add edges for question-classifier branches
   */
  private addClassifierEdges(
    classifier: Node<NodeData>,
    nodes: Node<NodeData>[],
    edges: Edge[],
    planMap: Map<string, NodePlan>
  ) {
    // Remove any existing edges from classifier
    const toRemove = edges.filter(e => e.source === classifier.id);
    for (const e of toRemove) {
      const idx = edges.indexOf(e);
      if (idx >= 0) edges.splice(idx, 1);
    }

    // Get classes from classifier data
    const data = classifier.data as { classes?: Array<{ id: string; name: string }> };
    const classes = data.classes || [];

    // Find target nodes for each class
    for (const cls of classes) {
      // Look for nodes that should handle this class
      const targetPlan = Array.from(planMap.values()).find(
        p => p.config?.['forClass'] === cls.id || p.description.includes(cls.name)
      );

      if (targetPlan) {
        const targetNode = nodes.find(n => n.id === targetPlan.id);
        if (targetNode) {
          edges.push({
            id: `${classifier.id}-${cls.id}-${targetNode.id}-target`,
            source: classifier.id,
            sourceHandle: cls.id,
            target: targetNode.id,
            targetHandle: 'target',
            type: 'custom',
            data: {
              sourceType: classifier.data.type,
              targetType: targetNode.data.type,
              isInIteration: false,
            },
          });
        }
      }
    }
  }

  /**
   * Add edges for if-else branches
   */
  private addIfElseEdges(
    ifElse: Node<NodeData>,
    nodes: Node<NodeData>[],
    edges: Edge[],
    planMap: Map<string, NodePlan>
  ) {
    // Similar logic for if-else branches
    const data = ifElse.data as { conditions?: Array<{ id: string }> };
    const conditions = data.conditions || [];

    // Remove existing edges from if-else
    const toRemove = edges.filter(e => e.source === ifElse.id);
    for (const e of toRemove) {
      const idx = edges.indexOf(e);
      if (idx >= 0) edges.splice(idx, 1);
    }

    // Add edges for each condition branch
    for (const cond of conditions) {
      const targetPlan = Array.from(planMap.values()).find(
        p => p.config?.['forCondition'] === cond.id
      );

      if (targetPlan) {
        const targetNode = nodes.find(n => n.id === targetPlan.id);
        if (targetNode) {
          edges.push({
            id: `${ifElse.id}-${cond.id}-${targetNode.id}-target`,
            source: ifElse.id,
            sourceHandle: cond.id,
            target: targetNode.id,
            targetHandle: 'target',
            type: 'custom',
            data: {
              sourceType: ifElse.data.type,
              targetType: targetNode.data.type,
              isInIteration: false,
            },
          });
        }
      }
    }

    // Add false branch
    const falsePlan = Array.from(planMap.values()).find(
      p => p.config?.['forCondition'] === 'false'
    );
    if (falsePlan) {
      const targetNode = nodes.find(n => n.id === falsePlan.id);
      if (targetNode) {
        edges.push({
          id: `${ifElse.id}-false-${targetNode.id}-target`,
          source: ifElse.id,
          sourceHandle: 'false',
          target: targetNode.id,
          targetHandle: 'target',
          type: 'custom',
          data: {
            sourceType: ifElse.data.type,
            targetType: targetNode.data.type,
            isInIteration: false,
          },
        });
      }
    }
  }

  /**
   * Stage 4: Assemble complete DSL
   */
  private assembleDSL(
    plan: WorkflowPlan,
    nodes: Node<NodeData>[],
    edges: Edge[]
  ): DifyDSL {
    // Add Dify-required positioning and UI fields to nodes
    const positionedNodes = this.addNodePositions(nodes);

    return {
      version: '0.1.2',
      kind: 'app',
      app: {
        name: plan.name,
        mode: 'workflow',
        icon: '🤖',
        icon_type: 'emoji',
        icon_background: '#FFEAD5',
        description: plan.description,
      },
      workflow: {
        graph: {
          nodes: positionedNodes,
          edges,
          viewport: {
            x: 0,
            y: 0,
            zoom: 1,
          },
        },
        features: {
          file_upload: {
            enabled: false,
            image: { enabled: false, number_limits: 3, transfer_methods: ['local_file', 'remote_url'] },
          },
          opening_statement: '',
          retriever_resource: { enabled: false },
          sensitive_word_avoidance: { enabled: false },
          speech_to_text: { enabled: false },
          suggested_questions: [],
          suggested_questions_after_answer: { enabled: false },
          text_to_speech: { enabled: false, language: '', voice: '' },
        },
      },
    };
  }

  /**
   * Add Dify-compatible positioning and UI fields to nodes
   */
  private addNodePositions(nodes: Node<NodeData>[]): Node<NodeData>[] {
    const NODE_WIDTH = 244;
    const NODE_HEIGHT = 54;
    const HORIZONTAL_GAP = 150;
    const VERTICAL_GAP = 100;
    const START_X = 80;
    const START_Y = 282;

    // Calculate levels for layout
    const levels = this.calculateNodeLevels(nodes);

    return nodes.map((node) => {
      const level = levels.get(node.id) || 0;

      // Calculate position based on level and index within level
      const nodesAtLevel = [...levels.entries()].filter(([_, l]) => l === level).map(([id]) => id);
      const indexInLevel = nodesAtLevel.indexOf(node.id);

      const x = START_X + level * (NODE_WIDTH + HORIZONTAL_GAP);
      const y = START_Y + indexInLevel * (NODE_HEIGHT + VERTICAL_GAP);

      return {
        ...node,
        position: { x, y },
        positionAbsolute: { x, y },
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        sourcePosition: 'right',
        targetPosition: 'left',
        selected: false,
      };
    });
  }

  /**
   * Calculate node levels for horizontal layout
   * Start node = level 0, then increment based on dependencies
   */
  private calculateNodeLevels(nodes: Node<NodeData>[]): Map<string, number> {
    const levels = new Map<string, number>();

    // Find start node
    const startNode = nodes.find(n => n.data.type === 'start');
    if (startNode) {
      levels.set(startNode.id, 0);
    }

    // Simple linear layout based on node order
    // (A more sophisticated algorithm could use topological sort)
    let currentLevel = 1;
    for (const node of nodes) {
      if (node.data.type !== 'start' && !levels.has(node.id)) {
        // Special handling for branching nodes
        if (node.data.type === 'question-classifier' || node.data.type === 'if-else') {
          levels.set(node.id, currentLevel);
        } else if (node.data.type === 'variable-aggregator' || node.data.type === 'end') {
          // Aggregators and end nodes go at later levels
          levels.set(node.id, Math.max(currentLevel, 3));
        } else {
          levels.set(node.id, currentLevel);
        }
        currentLevel++;
      }
    }

    return levels;
  }

  /**
   * Get output variables for a node
   */
  private getNodeOutputs(node: Node<NodeData>): string[] {
    switch (node.data.type) {
      case 'start':
        return (node.data as { variables: Array<{ variable: string }> }).variables.map(v => v.variable);
      case 'llm':
        return ['text'];
      case 'code':
        return (node.data as { outputs: Array<{ variable: string }> }).outputs.map(o => o.variable);
      case 'http-request':
        return ['status_code', 'body', 'headers'];
      case 'knowledge-retrieval':
        return ['result'];
      case 'question-classifier':
        return ['class_name'];
      default:
        return ['output'];
    }
  }

  /**
   * Parse JSON from LLM response
   */
  private parseJSON(content: string): unknown {
    // Try direct parse
    try {
      return JSON.parse(content);
    } catch {
      // Try to extract from markdown code block
      const match = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (match) {
        return JSON.parse(match[1]!);
      }
      throw new Error('Failed to parse JSON from response');
    }
  }

  /**
   * Log message if verbose
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[MultiStageGenerator] ${message}`);
    }
  }
}
