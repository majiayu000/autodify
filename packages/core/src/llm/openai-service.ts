/**
 * OpenAI LLM Service
 */

import type {
  LLMServiceConfig,
  ChatMessage,
  CompletionOptions,
  CompletionResult,
  StreamingCompletionOptions,
  StreamChunk,
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
 * OpenAI streaming response types
 */
interface OpenAIStreamDelta {
  role?: string;
  content?: string;
}

interface OpenAIStreamChoice {
  index: number;
  delta: OpenAIStreamDelta;
  finish_reason: string | null;
}

interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIStreamChoice[];
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

  /**
   * Complete a chat conversation with streaming
   */
  override async chatStream(
    messages: ChatMessage[],
    options?: StreamingCompletionOptions
  ): Promise<AsyncGenerator<StreamChunk>> {
    const opts = this.mergeOptions(options);
    const signal = options?.signal;

    return this.streamChat(messages, opts, signal, options?.onProgress);
  }

  /**
   * Internal streaming implementation
   */
  private async *streamChat(
    messages: ChatMessage[],
    opts: Required<Omit<CompletionOptions, 'stop'>> & { stop?: string[] },
    signal?: AbortSignal,
    onProgress?: (chunk: StreamChunk) => void
  ): AsyncGenerator<StreamChunk> {
    let accumulatedContent = '';
    let streamModel = '';

    try {
      // Send progress: starting
      const startChunk: StreamChunk = {
        type: 'progress',
        progress: {
          stage: 'starting',
          percentage: 0,
          message: 'Initializing LLM request...',
        },
        done: false,
      };
      onProgress?.(startChunk);
      yield startChunk;

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
          stream: true,
        }),
        signal: signal || AbortSignal.timeout(this.config.timeout ?? 60000),
      });

      if (!response.ok) {
        const error = await response.text();
        const errorChunk: StreamChunk = {
          type: 'error',
          error: `OpenAI API error: ${response.status} - ${error}`,
          done: true,
        };
        onProgress?.(errorChunk);
        yield errorChunk;
        return;
      }

      // Send progress: streaming
      const streamingChunk: StreamChunk = {
        type: 'progress',
        progress: {
          stage: 'streaming',
          percentage: 50,
          message: 'Receiving response...',
        },
        done: false,
      };
      onProgress?.(streamingChunk);
      yield streamingChunk;

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6)) as OpenAIStreamChunk;
              streamModel = data.model;

              const delta = data.choices[0]?.delta;
              if (delta?.content) {
                accumulatedContent += delta.content;

                const contentChunk: StreamChunk = {
                  type: 'content',
                  content: delta.content,
                  done: false,
                };
                onProgress?.(contentChunk);
                yield contentChunk;
              }
            } catch (e) {
              // Skip invalid JSON
              console.warn('Failed to parse streaming chunk:', e);
            }
          }
        }
      }

      // Send metadata
      const metadataChunk: StreamChunk = {
        type: 'metadata',
        metadata: {
          model: streamModel || opts.model,
        },
        done: false,
      };
      onProgress?.(metadataChunk);
      yield metadataChunk;

      // Send final done chunk
      const doneChunk: StreamChunk = {
        type: 'done',
        done: true,
      };
      onProgress?.(doneChunk);
      yield doneChunk;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorChunk: StreamChunk = {
        type: 'error',
        error: errorMessage,
        done: true,
      };
      onProgress?.(errorChunk);
      yield errorChunk;
    }
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
