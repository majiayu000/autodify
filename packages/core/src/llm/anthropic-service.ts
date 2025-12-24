/**
 * Anthropic LLM Service
 */

import type {
  LLMServiceConfig,
  ChatMessage,
  CompletionOptions,
  CompletionResult,
} from './types.js';
import { BaseLLMService } from './base-service.js';

/**
 * Anthropic API response types
 */
interface AnthropicContent {
  type: 'text';
  text: string;
}

interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
}

interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: AnthropicContent[];
  model: string;
  stop_reason: string;
  usage: AnthropicUsage;
}

/**
 * Anthropic LLM service
 */
export class AnthropicService extends BaseLLMService {
  private baseUrl: string;

  constructor(config: Omit<LLMServiceConfig, 'provider'> & { provider?: 'anthropic' }) {
    super({
      ...config,
      provider: 'anthropic',
      defaultModel: config.defaultModel ?? 'claude-sonnet-4-20250514',
    });
    this.baseUrl = config.baseUrl ?? 'https://api.anthropic.com/v1';
  }

  /**
   * Complete a chat conversation
   */
  async chat(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResult> {
    const opts = this.mergeOptions(options);

    // Extract system message
    const systemMessage = messages.find((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    return this.withRetry(async () => {
      // Handle both standard Anthropic API and compatible APIs
      const messagesEndpoint = this.baseUrl.includes('/v1')
        ? `${this.baseUrl}/messages`
        : `${this.baseUrl}/v1/messages`;

      const response = await fetch(messagesEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: opts.model,
          max_tokens: opts.maxTokens,
          system: systemMessage?.content,
          messages: chatMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          temperature: opts.temperature,
          top_p: opts.topP,
          stop_sequences: opts.stop,
        }),
        signal: AbortSignal.timeout(this.config.timeout ?? 60000),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as AnthropicResponse;

      // Handle different response formats (Anthropic vs compatible APIs like GLM)
      let textContent: string;

      if (data.content && Array.isArray(data.content)) {
        const textBlock = data.content.find((c) => c.type === 'text');
        if (!textBlock) {
          throw new Error('No text response from API');
        }
        textContent = textBlock.text;
      } else if (typeof (data as unknown as { content: string }).content === 'string') {
        // Some compatible APIs return content as a string directly
        textContent = (data as unknown as { content: string }).content;
      } else {
        throw new Error(`Unexpected response format: ${JSON.stringify(data)}`);
      }

      return {
        content: textContent,
        finishReason: data.stop_reason === 'end_turn' ? 'stop' :
          data.stop_reason === 'max_tokens' ? 'length' : 'error',
        usage: data.usage ? {
          promptTokens: data.usage.input_tokens ?? 0,
          completionTokens: data.usage.output_tokens ?? 0,
          totalTokens: (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
        } : undefined,
        model: data.model,
      };
    });
  }
}

/**
 * Create an Anthropic service
 */
export function createAnthropicService(apiKey: string, options?: {
  model?: string;
  baseUrl?: string;
}): AnthropicService {
  return new AnthropicService({
    apiKey,
    defaultModel: options?.model,
    baseUrl: options?.baseUrl,
  });
}
