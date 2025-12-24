/**
 * LLM Service Module
 */

// Types
export type {
  LLMProvider,
  MessageRole,
  ChatMessage,
  CompletionOptions,
  CompletionResult,
  LLMServiceConfig,
  ILLMService,
  StreamChunk,
  StreamingCompletionOptions,
} from './types.js';

// Base service
export { BaseLLMService } from './base-service.js';

// Provider implementations
export { OpenAIService, createOpenAIService } from './openai-service.js';
export { AnthropicService, createAnthropicService } from './anthropic-service.js';

import type { ILLMService, LLMProvider, LLMServiceConfig } from './types.js';
import { OpenAIService } from './openai-service.js';
import { AnthropicService } from './anthropic-service.js';

/**
 * Create an LLM service based on provider
 */
export function createLLMService(config: LLMServiceConfig): ILLMService {
  const { provider, ...restConfig } = config;

  switch (provider) {
    case 'openai':
      return new OpenAIService({ ...restConfig, provider: 'openai' });
    case 'anthropic':
      return new AnthropicService({ ...restConfig, provider: 'anthropic' });
    case 'deepseek':
      // DeepSeek uses OpenAI-compatible API
      return new OpenAIService({
        ...restConfig,
        provider: 'openai',
        baseUrl: config.baseUrl ?? 'https://api.deepseek.com/v1',
        defaultModel: config.defaultModel ?? 'deepseek-chat',
      });
    case 'custom':
      // Custom provider with OpenAI-compatible API
      if (!config.baseUrl) {
        throw new Error('Custom provider requires baseUrl');
      }
      return new OpenAIService({ ...restConfig, provider: 'openai' });
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Get default model for provider
 */
export function getDefaultModel(provider: LLMProvider): string {
  switch (provider) {
    case 'openai':
      return 'gpt-4o';
    case 'anthropic':
      return 'claude-sonnet-4-20250514';
    case 'deepseek':
      return 'deepseek-chat';
    default:
      return 'gpt-4o';
  }
}
