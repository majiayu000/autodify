/**
 * LLM Service Types
 */

/**
 * Supported LLM providers
 */
export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'custom';

/**
 * Message role
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * Chat message
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/**
 * LLM completion options
 */
export interface CompletionOptions {
  /** Model name */
  model?: string;
  /** Temperature (0-2) */
  temperature?: number;
  /** Max tokens to generate */
  maxTokens?: number;
  /** Stop sequences */
  stop?: string[];
  /** Top P sampling */
  topP?: number;
  /** Frequency penalty */
  frequencyPenalty?: number;
  /** Presence penalty */
  presencePenalty?: number;
  /** Response format */
  responseFormat?: 'text' | 'json';
}

/**
 * LLM completion result
 */
export interface CompletionResult {
  /** Generated content */
  content: string;
  /** Finish reason */
  finishReason: 'stop' | 'length' | 'error';
  /** Token usage */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Model used */
  model: string;
}

/**
 * LLM service configuration
 */
export interface LLMServiceConfig {
  /** Provider */
  provider: LLMProvider;
  /** API key */
  apiKey: string;
  /** Base URL (for custom providers) */
  baseUrl?: string;
  /** Default model */
  defaultModel?: string;
  /** Request timeout in ms */
  timeout?: number;
  /** Max retries */
  maxRetries?: number;
}

/**
 * LLM service interface
 */
export interface ILLMService {
  /** Provider name */
  readonly provider: LLMProvider;

  /**
   * Complete a chat conversation
   */
  chat(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResult>;

  /**
   * Complete a single prompt
   */
  complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;

  /**
   * Check if the service is available
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Streaming chunk type
 */
export type StreamChunkType = 'content' | 'progress' | 'metadata' | 'error' | 'done';

/**
 * Streaming chunk
 */
export interface StreamChunk {
  /** Chunk type */
  type: StreamChunkType;
  /** Content for content chunks */
  content?: string;
  /** Progress information */
  progress?: {
    stage: string;
    percentage?: number;
    message?: string;
  };
  /** Metadata for metadata chunks */
  metadata?: {
    model?: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
  /** Error message for error chunks */
  error?: string;
  /** Whether this is the final chunk */
  done: boolean;
}

/**
 * Progress callback for streaming
 */
export type ProgressCallback = (chunk: StreamChunk) => void;

/**
 * Streaming completion options
 */
export interface StreamingCompletionOptions extends CompletionOptions {
  /** Progress callback */
  onProgress?: ProgressCallback;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}
