import {
  WorkflowOrchestrator,
  DSLValidator,
  TemplateStore,
  type DifyDSL,
  type LLMProvider,
  type GenerationRequest,
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

    // 创建 Orchestrator
    this.orchestrator = new WorkflowOrchestrator({
      provider,
      apiKey: config.llm.apiKey,
      baseUrl: config.llm.baseUrl !== 'https://api.openai.com/v1' ? config.llm.baseUrl : undefined,
      planningModel: config.llm.defaultModel,
      generationModel: config.llm.defaultModel,
      maxRetries: config.llm.maxRetries,
      verbose: config.nodeEnv === 'development',
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

      // 转换为 YAML
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
        metadata: {
          duration: Date.now() - startTime,
          model,
          templateUsed: result.metadata?.templateUsed || null,
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
    return this.templateStore.getAll().map((t) => ({
      id: t.metadata.id,
      name: t.metadata.name,
      description: t.metadata.description,
      category: t.metadata.category,
      complexity: t.metadata.complexity,
      tags: t.metadata.tags,
    }));
  }

  async getTemplateById(id: string): Promise<DifyDSL | null> {
    const template = this.templateStore.get(id);
    if (!template) return null;
    return template.build();
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
