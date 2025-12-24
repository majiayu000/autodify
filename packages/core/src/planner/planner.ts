/**
 * Workflow Planner - Plan workflow structure from natural language
 */

import type {
  PlannerOptions,
  PlanningResult,
  WorkflowPlan,
  PlannedNode,
  PlannedEdge,
  InputVariable,
  OutputDefinition,
} from './types.js';
import { analyzeIntent } from './intent-analyzer.js';
import {
  buildPlanningPrompt,
  buildFewShotPrompt,
} from './prompts.js';
import { defaultTemplateStore } from '../templates/index.js';

/**
 * Workflow Planner
 */
export class WorkflowPlanner {
  private options: Required<PlannerOptions>;

  constructor(options: PlannerOptions = {}) {
    this.options = {
      provider: options.provider ?? 'openai',
      model: options.model ?? 'gpt-4o',
      apiKey: options.apiKey ?? '',
      maxRetries: options.maxRetries ?? 2,
      verbose: options.verbose ?? false,
    };
  }

  /**
   * Plan a workflow from natural language description
   */
  async plan(userRequest: string): Promise<PlanningResult> {
    const startTime = Date.now();

    try {
      // Step 1: Analyze intent locally
      const intent = analyzeIntent(userRequest);

      if (this.options.verbose) {
        console.log('Analyzed intent:', intent);
      }

      // Step 2: Try to match existing template (only for simple intents with high confidence)
      // Skip template for complex workflows (complexity >= 4 or conditional/classification features)
      const hasComplexFeatures = intent.features.some(f =>
        f.type === 'conditional' || f.type === 'classification' || f.type === 'iteration'
      );
      const isComplex = intent.complexity >= 4 || hasComplexFeatures;

      if (!isComplex) {
        const templateMatch = defaultTemplateStore.findBest(userRequest);

        if (templateMatch && templateMatch.score >= 80) {
          // Use template-based planning only for high confidence matches
          if (this.options.verbose) {
            console.log('Using template:', templateMatch.template.metadata.name);
          }
          const plan = this.planFromTemplate(userRequest, templateMatch.template, intent);
          return {
            success: true,
            plan,
            duration: Date.now() - startTime,
          };
        }
      } else if (this.options.verbose) {
        console.log('Complex workflow detected, skipping template matching');
      }

      // Step 3: LLM-based planning
      if (!this.options.apiKey) {
        // Fall back to rule-based planning without API
        const plan = this.planFromRules(userRequest, intent);
        return {
          success: true,
          plan,
          duration: Date.now() - startTime,
        };
      }

      // Call LLM for complex planning
      const plan = await this.planWithLLM(userRequest, intent);
      return {
        success: true,
        plan,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Plan from matched template
   */
  private planFromTemplate(
    userRequest: string,
    template: { metadata: { name: string; description: string; nodeTypes: string[] } },
    intent: ReturnType<typeof analyzeIntent>
  ): WorkflowPlan {
    const nodes: PlannedNode[] = template.metadata.nodeTypes.map((type, index) => ({
      id: `${type}-${index}`,
      type: type as PlannedNode['type'],
      title: this.getNodeTitle(type),
      description: this.getNodeDescription(type),
    }));

    const edges: PlannedEdge[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        source: nodes[i]!.id,
        target: nodes[i + 1]!.id,
      });
    }

    return {
      name: template.metadata.name,
      description: template.metadata.description,
      intent,
      nodes,
      edges,
      inputVariables: this.inferInputVariables(userRequest, intent),
      outputs: this.inferOutputs(nodes),
      confidence: 0.85,
    };
  }

  /**
   * Plan from rules without LLM
   */
  private planFromRules(
    userRequest: string,
    intent: ReturnType<typeof analyzeIntent>
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
      return this.planBranchingWorkflow(userRequest, intent, nodes, edges);
    }

    // Simple linear workflow
    return this.planLinearWorkflow(userRequest, intent, nodes, edges);
  }

  /**
   * Plan a simple linear workflow
   */
  private planLinearWorkflow(
    userRequest: string,
    intent: ReturnType<typeof analyzeIntent>,
    nodes: PlannedNode[],
    edges: PlannedEdge[]
  ): WorkflowPlan {
    let prevNodeId = 'start';

    // Add nodes based on detected features
    for (const feature of intent.features) {
      let nodeId: string;
      let node: PlannedNode;

      switch (feature.type) {
        case 'rag':
          nodeId = 'retrieval';
          node = {
            id: nodeId,
            type: 'knowledge-retrieval',
            title: '知识检索',
            description: '从知识库检索相关内容',
          };
          nodes.push(node);
          edges.push({ source: prevNodeId, target: nodeId });
          prevNodeId = nodeId;
          break;

        case 'classification':
          nodeId = 'classifier';
          node = {
            id: nodeId,
            type: 'question-classifier',
            title: '问题分类',
            description: '对用户问题进行分类',
          };
          nodes.push(node);
          edges.push({ source: prevNodeId, target: nodeId });
          prevNodeId = nodeId;
          break;

        case 'code':
          nodeId = 'code';
          node = {
            id: nodeId,
            type: 'code',
            title: '代码处理',
            description: '执行代码进行数据处理',
          };
          nodes.push(node);
          edges.push({ source: prevNodeId, target: nodeId });
          prevNodeId = nodeId;
          break;

        case 'api':
          nodeId = 'http';
          node = {
            id: nodeId,
            type: 'http-request',
            title: 'API 请求',
            description: '调用外部 API',
          };
          nodes.push(node);
          edges.push({ source: prevNodeId, target: nodeId });
          prevNodeId = nodeId;
          break;

        case 'llm':
          nodeId = 'llm';
          node = {
            id: nodeId,
            type: 'llm',
            title: 'AI 处理',
            description: '使用 LLM 进行处理',
          };
          nodes.push(node);
          edges.push({ source: prevNodeId, target: nodeId });
          prevNodeId = nodeId;
          break;
      }
    }

    // Ensure at least one LLM node
    if (!nodes.some((n) => n.type === 'llm')) {
      const llmNode: PlannedNode = {
        id: 'llm',
        type: 'llm',
        title: 'AI 处理',
        description: '使用 LLM 进行处理',
      };
      nodes.push(llmNode);
      edges.push({ source: prevNodeId, target: 'llm' });
      prevNodeId = 'llm';
    }

    // End node
    nodes.push({
      id: 'end',
      type: 'end',
      title: '结束',
      description: '输出结果',
    });
    edges.push({ source: prevNodeId, target: 'end' });

    return {
      name: this.generateWorkflowName(intent),
      description: userRequest,
      intent,
      nodes,
      edges,
      inputVariables: this.inferInputVariables(userRequest, intent),
      outputs: this.inferOutputs(nodes),
      confidence: 0.7,
    };
  }

  /**
   * Plan a branching workflow with classification
   */
  private planBranchingWorkflow(
    userRequest: string,
    intent: ReturnType<typeof analyzeIntent>,
    nodes: PlannedNode[],
    edges: PlannedEdge[]
  ): WorkflowPlan {
    // Extract branch info from user request
    const branches = this.extractBranches(userRequest);

    // Add classifier node
    nodes.push({
      id: 'classifier',
      type: 'question-classifier',
      title: '问题分类',
      description: '对用户问题进行智能分类',
      configHints: {
        classes: branches.map(b => ({ id: b.id, name: b.name })),
      },
    });
    edges.push({ source: 'start', target: 'classifier' });

    // Add branch nodes
    for (const branch of branches) {
      if (branch.needsRetrieval) {
        // Add retrieval node for this branch
        const retrievalId = `retrieval-${branch.id}`;
        nodes.push({
          id: retrievalId,
          type: 'knowledge-retrieval',
          title: `${branch.name}知识检索`,
          description: `从${branch.datasetName ?? '知识库'}检索`,
          configHints: {
            datasetId: branch.datasetId,
          },
        });
        edges.push({
          source: 'classifier',
          target: retrievalId,
          sourceHandle: branch.id,
          condition: branch.name,
        });

        // Add LLM node for this branch
        const llmId = `llm-${branch.id}`;
        nodes.push({
          id: llmId,
          type: 'llm',
          title: `${branch.name}回答`,
          description: `基于检索结果生成${branch.name}回答`,
        });
        edges.push({ source: retrievalId, target: llmId });

        // Connect to aggregator
        edges.push({ source: llmId, target: 'aggregator' });
      } else {
        // Direct LLM branch
        const llmId = `llm-${branch.id}`;
        nodes.push({
          id: llmId,
          type: 'llm',
          title: `${branch.name}回答`,
          description: `直接生成${branch.name}回答`,
        });
        edges.push({
          source: 'classifier',
          target: llmId,
          sourceHandle: branch.id,
          condition: branch.name,
        });
        edges.push({ source: llmId, target: 'aggregator' });
      }
    }

    // Add variable aggregator to merge branches
    nodes.push({
      id: 'aggregator',
      type: 'variable-aggregator',
      title: '结果聚合',
      description: '聚合各分支的输出结果',
    });

    // End node
    nodes.push({
      id: 'end',
      type: 'end',
      title: '结束',
      description: '输出最终结果',
    });
    edges.push({ source: 'aggregator', target: 'end' });

    return {
      name: this.generateWorkflowName(intent),
      description: userRequest,
      intent,
      nodes,
      edges,
      inputVariables: this.inferInputVariables(userRequest, intent),
      outputs: [{ name: 'final_answer', source: ['aggregator', 'output'], description: '最终回答' }],
      confidence: 0.75,
    };
  }

  /**
   * Extract branch information from user request
   */
  private extractBranches(userRequest: string): Array<{
    id: string;
    name: string;
    needsRetrieval: boolean;
    datasetId?: string;
    datasetName?: string;
  }> {
    const branches: Array<{
      id: string;
      name: string;
      needsRetrieval: boolean;
      datasetId?: string;
      datasetName?: string;
    }> = [];

    // Try to extract branch patterns from text
    // Pattern: "技术支持/技术问题" -> tech branch
    if (userRequest.includes('技术') || userRequest.includes('产品')) {
      branches.push({
        id: 'tech',
        name: '技术支持',
        needsRetrieval: userRequest.includes('知识') || userRequest.includes('检索') || userRequest.includes('文档'),
        datasetId: 'tech-docs',
        datasetName: '技术文档库',
      });
    }

    // Pattern: "账单/付款/退款" -> billing branch
    if (userRequest.includes('账单') || userRequest.includes('付款') || userRequest.includes('退款')) {
      branches.push({
        id: 'billing',
        name: '账单咨询',
        needsRetrieval: userRequest.includes('知识') || userRequest.includes('检索') || userRequest.includes('FAQ'),
        datasetId: 'billing-faq',
        datasetName: '账单FAQ库',
      });
    }

    // Pattern: "其他/一般" -> other branch
    if (userRequest.includes('其他') || userRequest.includes('一般') || branches.length > 0) {
      branches.push({
        id: 'other',
        name: '其他问题',
        needsRetrieval: false,
      });
    }

    // Default branches if none detected
    if (branches.length === 0) {
      branches.push(
        { id: 'category1', name: '类别一', needsRetrieval: true, datasetId: 'dataset-1' },
        { id: 'category2', name: '类别二', needsRetrieval: true, datasetId: 'dataset-2' },
        { id: 'default', name: '默认', needsRetrieval: false }
      );
    }

    return branches;
  }

  /**
   * Plan with LLM for complex workflows
   */
  private async planWithLLM(
    userRequest: string,
    intent: ReturnType<typeof analyzeIntent>
  ): Promise<WorkflowPlan> {
    // Build prompt (for future LLM integration)
    const fewShotContext = buildFewShotPrompt();
    // Prepare prompt for future LLM call - currently unused
    void buildPlanningPrompt(userRequest, fewShotContext);

    // For now, fall back to rule-based since we don't have LLM call implementation here
    // In production, this would call the LLM API
    console.warn('LLM planning not implemented, falling back to rule-based');
    return this.planFromRules(userRequest, intent);
  }

  /**
   * Get default title for node type
   */
  private getNodeTitle(type: string): string {
    const titles: Record<string, string> = {
      'start': '开始',
      'end': '结束',
      'answer': '回答',
      'llm': 'AI 处理',
      'knowledge-retrieval': '知识检索',
      'question-classifier': '问题分类',
      'if-else': '条件判断',
      'code': '代码执行',
      'http-request': 'HTTP 请求',
      'variable-aggregator': '变量聚合',
      'template-transform': '模板转换',
    };
    return titles[type] ?? type;
  }

  /**
   * Get default description for node type
   */
  private getNodeDescription(type: string): string {
    const descriptions: Record<string, string> = {
      'start': '接收用户输入',
      'end': '输出结果',
      'answer': '直接回答用户',
      'llm': '使用大语言模型处理',
      'knowledge-retrieval': '从知识库检索相关内容',
      'question-classifier': '对用户问题进行分类',
      'if-else': '根据条件执行不同分支',
      'code': '执行自定义代码',
      'http-request': '调用外部 API',
      'variable-aggregator': '聚合多个变量',
      'template-transform': '转换数据格式',
    };
    return descriptions[type] ?? '';
  }

  /**
   * Generate workflow name from intent
   */
  private generateWorkflowName(intent: ReturnType<typeof analyzeIntent>): string {
    const domain = intent.domain ?? '';
    const action = intent.action;
    return domain ? `${domain}${action}` : `智能${action}`;
  }

  /**
   * Infer input variables from request and intent
   */
  private inferInputVariables(
    userRequest: string,
    _intent: ReturnType<typeof analyzeIntent>
  ): InputVariable[] {
    const variables: InputVariable[] = [];

    // Default text input
    variables.push({
      name: 'input',
      label: '用户输入',
      type: 'paragraph',
      required: true,
      description: '用户的输入内容',
    });

    // Add file input if document-related
    if (userRequest.includes('文档') || userRequest.includes('文件')) {
      variables.push({
        name: 'file',
        label: '上传文件',
        type: 'file',
        required: false,
        description: '可选的文件上传',
      });
    }

    return variables;
  }

  /**
   * Infer outputs from nodes
   */
  private inferOutputs(nodes: PlannedNode[]): OutputDefinition[] {
    // Find the last non-end node to get output from
    const outputNode = [...nodes].reverse().find((n) => n.type !== 'end' && n.type !== 'start');

    if (outputNode) {
      const outputVar = outputNode.type === 'llm' ? 'text' : 'output';
      return [
        {
          name: 'result',
          source: [outputNode.id, outputVar],
          description: '处理结果',
        },
      ];
    }

    return [];
  }
}

/**
 * Create a workflow planner
 */
export function createPlanner(options?: PlannerOptions): WorkflowPlanner {
  return new WorkflowPlanner(options);
}
