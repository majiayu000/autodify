/**
 * DSL Generator
 *
 * Generates Dify workflow DSL from natural language.
 */

import type { DifyDSL } from '../types/index.js';
import { parseYAML, stringifyYAML } from '../utils/yaml.js';
import { validateDSL } from '../validator/index.js';
import type { GeneratorOptions, GenerateResult } from './types.js';
import { buildGenerationPrompt, buildFixPrompt } from './prompts.js';

/**
 * LLM 调用接口
 */
export interface LLMClient {
  generate(prompt: string): Promise<string>;
}

/**
 * 默认生成选项
 */
const defaultOptions: GeneratorOptions = {
  modelProvider: 'openai',
  modelName: 'gpt-4o',
  temperature: 0.7,
  maxRetries: 3,
  validate: true,
};

/**
 * DSL 生成器类
 */
export class DSLGenerator {
  private options: GeneratorOptions;
  private llmClient: LLMClient;

  constructor(llmClient: LLMClient, options: GeneratorOptions = {}) {
    this.options = { ...defaultOptions, ...options };
    this.llmClient = llmClient;
  }

  /**
   * 从自然语言生成 DSL
   */
  async generate(userRequest: string): Promise<GenerateResult> {
    const prompt = buildGenerationPrompt(userRequest);

    let lastError: string | undefined;
    let retries = 0;

    for (let i = 0; i < (this.options.maxRetries ?? 3); i++) {
      try {
        // 调用 LLM 生成
        let response = await this.llmClient.generate(prompt);

        // 清理响应（移除 markdown 代码块标记）
        response = this.cleanYAMLResponse(response);

        // 解析 YAML
        const parseResult = parseYAML(response);
        if (!parseResult.success) {
          lastError = parseResult.error;
          retries++;

          // 尝试修复
          if (i < (this.options.maxRetries ?? 3) - 1) {
            const fixPrompt = buildFixPrompt(response, [parseResult.error!]);
            const fixedResponse = await this.llmClient.generate(fixPrompt);
            response = this.cleanYAMLResponse(fixedResponse);

            const fixedParseResult = parseYAML(response);
            if (fixedParseResult.success) {
              return this.validateAndReturn(fixedParseResult.data!, response, retries);
            }
          }
          continue;
        }

        // 验证 DSL
        if (this.options.validate) {
          return this.validateAndReturn(parseResult.data!, response, retries);
        }

        return {
          success: true,
          dsl: parseResult.data!,
          yaml: response,
          retries,
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        retries++;
      }
    }

    return {
      success: false,
      error: lastError ?? 'Unknown error',
      retries,
    };
  }

  /**
   * 验证并返回结果
   */
  private validateAndReturn(
    dsl: DifyDSL,
    yaml: string,
    retries: number
  ): GenerateResult {
    const validation = validateDSL(dsl);

    if (!validation.valid) {
      const errorMessages = validation.errors.map((e) => e.message);
      return {
        success: false,
        dsl,
        yaml,
        error: `Validation failed: ${errorMessages.join('; ')}`,
        retries,
      };
    }

    return {
      success: true,
      dsl,
      yaml,
      retries,
    };
  }

  /**
   * 清理 YAML 响应
   */
  private cleanYAMLResponse(response: string): string {
    // 移除 markdown 代码块标记
    let cleaned = response.trim();

    // 移除开头的 ```yaml 或 ```
    if (cleaned.startsWith('```yaml')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }

    // 移除结尾的 ```
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }

    return cleaned.trim();
  }

  /**
   * 生成简单工作流（快捷方法）
   */
  async generateSimpleWorkflow(
    name: string,
    systemPrompt: string,
    inputLabel: string = '输入'
  ): Promise<GenerateResult> {
    const request = `创建一个名为"${name}"的工作流：
- 接收用户的${inputLabel}
- 使用 LLM 处理，系统提示词是：${systemPrompt}
- 输出处理结果`;

    return this.generate(request);
  }
}

/**
 * 创建一个简单的 DSL 生成器（用于测试）
 */
export function createSimpleDSL(name: string, description: string): DifyDSL {
  return {
    version: '0.5.0',
    kind: 'app',
    app: {
      name,
      mode: 'workflow',
      icon: '🤖',
      icon_type: 'emoji',
      description,
    },
    workflow: {
      graph: {
        nodes: [
          {
            id: 'start',
            type: 'custom',
            data: {
              type: 'start',
              title: '开始',
              variables: [
                {
                  variable: 'input',
                  label: '输入',
                  type: 'paragraph',
                  required: true,
                  max_length: 2000,
                },
              ],
            },
          },
          {
            id: 'llm',
            type: 'custom',
            data: {
              type: 'llm',
              title: 'AI 处理',
              model: {
                provider: 'openai',
                name: 'gpt-4o',
                mode: 'chat',
                completion_params: {
                  temperature: 0.7,
                  max_tokens: 2000,
                },
              },
              prompt_template: [
                {
                  role: 'system',
                  text: '你是一个有帮助的助手。',
                },
                {
                  role: 'user',
                  text: '{{#start.input#}}',
                },
              ],
            },
          },
          {
            id: 'end',
            type: 'custom',
            data: {
              type: 'end',
              title: '结束',
              outputs: [
                {
                  variable: 'result',
                  value_selector: ['llm', 'text'],
                },
              ],
            },
          },
        ],
        edges: [
          {
            id: 'start-llm',
            source: 'start',
            sourceHandle: 'source',
            target: 'llm',
            targetHandle: 'target',
            type: 'custom',
            zIndex: 0,
            data: {
              sourceType: 'start',
              targetType: 'llm',
              isInIteration: false,
              isInLoop: false,
            },
          },
          {
            id: 'llm-end',
            source: 'llm',
            sourceHandle: 'source',
            target: 'end',
            targetHandle: 'target',
            type: 'custom',
            zIndex: 0,
            data: {
              sourceType: 'llm',
              targetType: 'end',
              isInIteration: false,
              isInLoop: false,
            },
          },
        ],
      },
      features: {
        file_upload: {
          enabled: false,
        },
        text_to_speech: {
          enabled: false,
        },
      },
    },
  };
}

/**
 * 将 DSL 序列化为 YAML
 */
export function dslToYAML(dsl: DifyDSL): string {
  return stringifyYAML(dsl);
}
