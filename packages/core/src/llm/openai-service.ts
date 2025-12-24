/**
 * OpenAI LLM Service
 */

import type {
  LLMServiceConfig,
  ChatMessage,
  CompletionOptions,
  CompletionResult,
} from './types.js';
import { BaseLLMService } from './base-service.js';

/**
 * OpenAI API response types
 */
interface OpenAIMessage {
  role: string;
  content: string;
}

interface OpenAIChoice {
  index: number;
  message: OpenAIMessage;
  finish_reason: string;
}

interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: OpenAIUsage;
}

/**
 * OpenAI-compatible LLM service
 */
export class OpenAIService extends BaseLLMService {
  private baseUrl: string;

  constructor(config: Omit<LLMServiceConfig, 'provider'> & { provider?: 'openai' }) {
    super({
      ...config,
      provider: 'openai',
      defaultModel: config.defaultModel ?? 'gpt-4o',
    });
    this.baseUrl = config.baseUrl ?? 'https://api.openai.com/v1';
  }

  /**
   * Complete a chat conversation
   */
  async chat(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResult> {
    const opts = this.mergeOptions(options);

    return this.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: opts.model,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          temperature: opts.temperature,
          max_tokens: opts.maxTokens,
          top_p: opts.topP,
          frequency_penalty: opts.frequencyPenalty,
          presence_penalty: opts.presencePenalty,
          stop: opts.stop,
          response_format: opts.responseFormat === 'json'
            ? { type: 'json_object' }
            : undefined,
        }),
        signal: AbortSignal.timeout(this.config.timeout ?? 60000),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as OpenAIResponse;
      const choice = data.choices[0];

      if (!choice) {
        throw new Error('No response from OpenAI');
      }

      return {
        content: choice.message.content,
        finishReason: choice.finish_reason === 'stop' ? 'stop' :
          choice.finish_reason === 'length' ? 'length' : 'error',
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        } : undefined,
        model: data.model,
      };
    });
  }
}

/**
 * Create an OpenAI service
 */
export function createOpenAIService(apiKey: string, options?: {
  model?: string;
  baseUrl?: string;
}): OpenAIService {
  return new OpenAIService({
    apiKey,
    defaultModel: options?.model,
    baseUrl: options?.baseUrl,
  });
}
