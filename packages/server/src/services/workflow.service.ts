import {
  WorkflowOrchestrator,
  DSLValidator,
  TemplateStore,
  type DifyDSL,
  type LLMProvider,
  type GenerationRequest,
  type StreamChunk,
} from '@autodify/core';
import { config } from '../config/index.js';
import yaml from 'js-yaml';
import {
  GenerationFailedError,
  RefinementFailedError,
  LLMError,
  InternalError,
} from '../errors/custom-errors.js';
import { getLogger } from '../lib/logging/index.js';

export interface GenerateApiRequest {
  prompt: string;
  options?: {
    model?: string;
    temperature?: number;
    useTemplate?: boolean;
  };
}

export interface GenerateApiResult {
  success: boolean;
  dsl?: DifyDSL;
  yaml?: string;
  error?: string;
  metadata?: {
    duration: number;
    model: string;
    tokens?: { input: number; output: number };
    templateUsed?: string | null;
    confidence?: number;
  };
}

export interface RefineApiRequest {
  dsl: DifyDSL;
  instruction: string;
}

export interface RefineApiResult {
  success: boolean;
  dsl?: DifyDSL;
  yaml?: string;
  error?: string;
  changes?: Array<{
    type: 'add' | 'modify' | 'remove';
    node?: string;
    edge?: string;
    reason: string;
  }>;
}

export interface ValidateApiResult {
  valid: boolean;
  errors: Array<{ code: string; message: string; path?: string }>;
  warnings: Array<{ code: string; message: string; path?: string }>;
}

export class WorkflowService {
  private orchestrator: WorkflowOrchestrator;
  private validator: DSLValidator;
  private templateStore: TemplateStore;

  constructor() {
    // 确定 provider 类型
    let provider: LLMProvider = config.llm.provider;

    // LiteLLM proxy 或自定义 URL 使用 OpenAI 兼容模式
    if (
      config.llm.provider === 'custom' ||
      config.llm.baseUrl.includes('litellm') ||
      config.llm.baseUrl.includes(':4000')
    ) {
      provider = 'openai';
    }

    // 创建 Orchestrator - 启用多阶段生成器
    this.orchestrator = new WorkflowOrchestrator({
      provider,
      apiKey: config.llm.apiKey,
      baseUrl: config.llm.baseUrl !== 'https://api.openai.com/v1' ? config.llm.baseUrl : undefined,
      planningModel: config.llm.defaultModel,
      generationModel: config.llm.defaultModel,
      maxRetries: config.llm.maxRetries,
      verbose: config.nodeEnv === 'development',
      useMultiStage: true,  // 使用多阶段生成器以更好地支持复杂工作流
    });

    this.validator = new DSLValidator();
    this.templateStore = new TemplateStore();
  }

  async generate(request: GenerateApiRequest): Promise<GenerateApiResult> {
    const startTime = Date.now();
    const model = request.options?.model || config.llm.defaultModel;

    try {
      // 构建生成请求
      const genRequest: GenerationRequest = {
        prompt: request.prompt,
        skipTemplates: request.options?.useTemplate === false,
        preferredModel: model,
      };

      // 使用 Orchestrator 生成工作流
      const result = await this.orchestrator.generate(genRequest);

      if (!result.success || !result.dsl) {
        throw new GenerationFailedError(result.error || '工作流生成失败', {
          duration: Date.now() - startTime,
          model,
        });
      }

      // 增强 DSL 为 Dify 兼容格式（添加位置信息等）
      const enhancedDsl = this.enhanceDslForDify(result.dsl);

      // 转换为 YAML
      const yamlStr = yaml.dump(enhancedDsl, {
        indent: 2,
        lineWidth: -1,
        quotingType: "'",
        forceQuotes: false,
      });

      return {
        success: true,
        dsl: enhancedDsl,
        yaml: yamlStr,
        metadata: {
          duration: Date.now() - startTime,
          model,
          templateUsed: result.metadata?.templateUsed || null,
          generator: result.metadata?.generator || 'legacy',
        },
      };
    } catch (error) {
      // 如果已经是自定义错误，直接抛出
      if (error instanceof GenerationFailedError) {
        throw error;
      }

      // 检查是否是 LLM 相关错误
      const message = error instanceof Error ? error.message : '未知错误';
      if (message.toLowerCase().includes('api') || message.toLowerCase().includes('llm')) {
        throw new LLMError('LLM 服务调用失败', { originalError: message, duration: Date.now() - startTime });
      }

      // 其他未知错误
      const logger = getLogger();
      logger.error(
        {
          err: error,
          error_message: message,
          duration_ms: Date.now() - startTime,
          model,
          prompt: request.prompt.substring(0, 100), // 只记录前100个字符
        },
        'Workflow generation failed with unexpected error'
      );
      throw new InternalError('工作流生成过程中发生错误', { originalError: message, duration: Date.now() - startTime });
    }
  }

  async refine(request: RefineApiRequest): Promise<RefineApiResult> {
    try {
      // 使用 Orchestrator 的 edit 功能
      const result = await this.orchestrator.edit({
        currentDsl: request.dsl,
        instruction: request.instruction,
      });

      if (!result.success || !result.dsl) {
        throw new RefinementFailedError(result.error || '工作流优化失败');
      }

      const yamlStr = yaml.dump(result.dsl, {
        indent: 2,
        lineWidth: -1,
        quotingType: "'",
        forceQuotes: false,
      });

      return {
        success: true,
        dsl: result.dsl,
        yaml: yamlStr,
        changes: result.changes?.map((c) => ({
          type: c.type,
          node: c.target === 'node' ? c.id : undefined,
          edge: c.target === 'edge' ? c.id : undefined,
          reason: c.description,
        })),
      };
    } catch (error) {
      // 如果已经是自定义错误，直接抛出
      if (error instanceof RefinementFailedError) {
        throw error;
      }

      // 检查是否是 LLM 相关错误
      const message = error instanceof Error ? error.message : '未知错误';
      if (message.toLowerCase().includes('api') || message.toLowerCase().includes('llm')) {
        throw new LLMError('LLM 服务调用失败', { originalError: message });
      }

      // 其他未知错误
      throw new InternalError('工作流优化过程中发生错误', { originalError: message });
    }
  }

  async validate(dsl: unknown): Promise<ValidateApiResult> {
    const result = this.validator.validate(dsl as DifyDSL);

    return {
      valid: result.valid,
      errors: result.errors.map((e) => ({
        code: e.code || 'E000',
        message: e.message,
        path: e.path,
      })),
      warnings:
        result.warnings?.map((w) => ({
          code: w.code || 'W000',
          message: w.message,
          path: w.path,
        })) || [],
    };
  }

  getTemplates() {
    const complexityMap: Record<number, 'simple' | 'medium' | 'complex'> = {
      1: 'simple',
      2: 'medium',
      3: 'complex',
    };
    return this.templateStore.getAll().map((t) => ({
      id: t.metadata.id,
      name: t.metadata.name,
      description: t.metadata.description,
      category: t.metadata.category as string,
      complexity: complexityMap[t.metadata.complexity] || 'medium',
      tags: t.metadata.tags,
    }));
  }

  async getTemplateById(id: string): Promise<DifyDSL | null> {
    const template = this.templateStore.get(id);
    if (!template) return null;
    return template.build();
  }

  /**
   * Generate workflow with streaming support
   */
  async *generateStream(
    request: GenerateApiRequest,
    signal?: AbortSignal
  ): AsyncGenerator<StreamChunk> {
    const startTime = Date.now();
    const model = request.options?.model || config.llm.defaultModel;

    try {
      // Send initial progress
      yield {
        type: 'progress',
        progress: {
          stage: 'initializing',
          percentage: 0,
          message: 'Starting workflow generation...',
        },
        done: false,
      };

      // Check if cancelled
      if (signal?.aborted) {
        yield {
          type: 'error',
          error: 'Generation cancelled',
          done: true,
        };
        return;
      }

      // Send progress: analyzing prompt
      yield {
        type: 'progress',
        progress: {
          stage: 'analyzing',
          percentage: 10,
          message: 'Analyzing your requirements...',
        },
        done: false,
      };

      // Check if cancelled
      if (signal?.aborted) {
        yield {
          type: 'error',
          error: 'Generation cancelled',
          done: true,
        };
        return;
      }

      // Send progress: generating DSL
      yield {
        type: 'progress',
        progress: {
          stage: 'generating',
          percentage: 30,
          message: 'Generating workflow structure...',
        },
        done: false,
      };

      // Build generation request
      const genRequest: GenerationRequest = {
        prompt: request.prompt,
        skipTemplates: request.options?.useTemplate === false,
        preferredModel: model,
      };

      // Generate workflow (using non-streaming for now)
      const result = await this.orchestrator.generate(genRequest);

      // Check if cancelled
      if (signal?.aborted) {
        yield {
          type: 'error',
          error: 'Generation cancelled',
          done: true,
        };
        return;
      }

      if (!result.success || !result.dsl) {
        yield {
          type: 'error',
          error: result.error || 'Workflow generation failed',
          done: true,
        };
        return;
      }

      // Send progress: converting to YAML
      yield {
        type: 'progress',
        progress: {
          stage: 'converting',
          percentage: 80,
          message: 'Converting to YAML format...',
        },
        done: false,
      };

      // Convert to YAML
      const yamlStr = yaml.dump(result.dsl, {
        indent: 2,
        lineWidth: -1,
        quotingType: "'",
        forceQuotes: false,
      });

      // Send progress: finalizing
      yield {
        type: 'progress',
        progress: {
          stage: 'finalizing',
          percentage: 90,
          message: 'Finalizing workflow...',
        },
        done: false,
      };

      // Send the complete DSL as content
      yield {
        type: 'content',
        content: JSON.stringify({
          dsl: result.dsl,
          yaml: yamlStr,
        }),
        done: false,
      };

      // Send metadata
      yield {
        type: 'metadata',
        metadata: {
          model,
        },
        done: false,
      };

      // Send completion
      yield {
        type: 'done',
        done: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const logger = getLogger();
      logger.error(
        {
          err: error,
          error_message: message,
          duration_ms: Date.now() - startTime,
          model,
          prompt: request.prompt.substring(0, 100),
        },
        'Streaming workflow generation failed'
      );

      yield {
        type: 'error',
        error: message,
        done: true,
      };
    }
  }

  /**
   * 增强 DSL 为 Dify 兼容格式
   * 添加节点位置、视口、完整的 features 配置等
   */
  private enhanceDslForDify(dsl: DifyDSL): DifyDSL {
    const NODE_WIDTH = 244;
    const NODE_HEIGHT = 54;
    const HORIZONTAL_GAP = 150;
    const VERTICAL_GAP = 100;
    const START_X = 80;
    const START_Y = 282;

    // 深拷贝以避免修改原对象
    const enhanced = JSON.parse(JSON.stringify(dsl)) as DifyDSL;

    // 更新版本为 Dify 兼容版本
    enhanced.version = '0.1.2';

    // 确保 app 配置完整
    if (enhanced.app) {
      enhanced.app.icon_background = enhanced.app.icon_background || '#FFEAD5';
    }

    // 增强 workflow 配置
    if (enhanced.workflow?.graph) {
      // 计算节点层级
      const nodes = enhanced.workflow.graph.nodes || [];
      const levels = this.calculateNodeLevels(nodes);

      // 添加节点位置信息
      enhanced.workflow.graph.nodes = nodes.map((node) => {
        const level = levels.get(node.id) || 0;
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

      // 添加视口信息
      enhanced.workflow.graph.viewport = enhanced.workflow.graph.viewport || {
        x: 0,
        y: 0,
        zoom: 1,
      };
    }

    // 确保 features 完整
    if (enhanced.workflow) {
      enhanced.workflow.features = {
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
        ...enhanced.workflow.features,
      };
    }

    return enhanced;
  }

  /**
   * 计算节点层级（用于布局）
   */
  private calculateNodeLevels(nodes: Array<{ id: string; data: { type: string } }>): Map<string, number> {
    const levels = new Map<string, number>();

    // 找到 start 节点
    const startNode = nodes.find(n => n.data.type === 'start');
    if (startNode) {
      levels.set(startNode.id, 0);
    }

    // 简单线性布局
    let currentLevel = 1;
    for (const node of nodes) {
      if (node.data.type !== 'start' && !levels.has(node.id)) {
        if (node.data.type === 'question-classifier' || node.data.type === 'if-else') {
          levels.set(node.id, currentLevel);
        } else if (node.data.type === 'variable-aggregator' || node.data.type === 'end') {
          levels.set(node.id, Math.max(currentLevel, 3));
        } else {
          levels.set(node.id, currentLevel);
        }
        currentLevel++;
      }
    }

    return levels;
  }
}

// 单例
let workflowServiceInstance: WorkflowService | null = null;

export function getWorkflowService(): WorkflowService {
  if (!workflowServiceInstance) {
    workflowServiceInstance = new WorkflowService();
  }
  return workflowServiceInstance;
}
