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
export type StreamChunkType =
  | 'content'
  | 'progress'
  | 'metadata'
  | 'error'
  | 'done'
  | 'thinking'      // AI 思考过程
  | 'node_created'  // 节点创建
  | 'edges_created' // 边创建
  | 'complete';     // 生成完成

/**
 * Node info for streaming
 */
export interface StreamNodeInfo {
  /** Node ID */
  id: string;
  /** Node type */
  type: string;
  /** Node title */
  title: string;
  /** Node position (optional, for layout) */
  position?: { x: number; y: number };
  /** Node data */
  data?: Record<string, unknown>;
}

/**
 * Edge info for streaming
 */
export interface StreamEdgeInfo {
  /** Edge ID */
  id: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Source handle */
  sourceHandle?: string;
  /** Target handle */
  targetHandle?: string;
}

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

  // === New fields for animation support ===

  /** Thinking step message (for 'thinking' type) */
  thinking?: {
    step: string;
    message: string;
  };
  /** Node info (for 'node_created' type) */
  node?: StreamNodeInfo;
  /** Node index and total (for 'node_created' type) */
  nodeProgress?: {
    current: number;
    total: number;
  };
  /** Edges info (for 'edges_created' type) */
  edges?: StreamEdgeInfo[];
  /** Complete DSL (for 'complete' type) */
  dsl?: unknown;
  /** YAML string (for 'complete' type) */
  yaml?: string;
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
