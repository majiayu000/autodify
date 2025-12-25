/**
 * Base LLM Service
 */

import type {
  ILLMService,
  LLMProvider,
  LLMServiceConfig,
  ChatMessage,
  CompletionOptions,
  CompletionResult,
  StreamingCompletionOptions,
  StreamChunk,
} from './types.js';

/**
 * Default completion options
 */
const DEFAULT_OPTIONS: Required<Omit<CompletionOptions, 'stop'>> = {
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  responseFormat: 'text',
};

/**
 * Abstract base class for LLM services
 */
export abstract class BaseLLMService implements ILLMService {
  protected config: LLMServiceConfig;

  constructor(config: LLMServiceConfig) {
    this.config = {
      timeout: 60000,
      maxRetries: 3,
      ...config,
    };
  }

  get provider(): LLMProvider {
    return this.config.provider;
  }

  /**
   * Complete a chat conversation
   */
  abstract chat(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResult>;

  /**
   * Complete a chat conversation with streaming
   */
  async chatStream(
    _messages: ChatMessage[],
    _options?: StreamingCompletionOptions
  ): Promise<AsyncGenerator<StreamChunk>> {
    throw new Error('Streaming not implemented for this provider');
  }

  /**
   * Complete a single prompt
   */
  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  /**
   * Complete a single prompt with streaming
   */
  async completeStream(
    prompt: string,
    options?: StreamingCompletionOptions
  ): Promise<AsyncGenerator<StreamChunk>> {
    return this.chatStream([{ role: 'user', content: prompt }], options);
  }

  /**
   * Check if the service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.chat(
        [{ role: 'user', content: 'test' }],
        { maxTokens: 5 }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Merge options with defaults
   */
  protected mergeOptions(options?: CompletionOptions): Required<Omit<CompletionOptions, 'stop'>> & { stop?: string[] } {
    return {
      ...DEFAULT_OPTIONS,
      model: this.config.defaultModel ?? DEFAULT_OPTIONS.model,
      ...options,
    };
  }

  /**
   * Retry helper
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    retries: number = this.config.maxRetries ?? 3
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (i < retries) {
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    throw lastError;
  }
}
