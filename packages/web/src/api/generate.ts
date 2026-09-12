/**
 * API client for workflow generation
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_KEY = import.meta.env.VITE_API_KEY || '';

function apiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };
  if (API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }
  return headers;
}

export interface GenerateRequest {
  prompt: string;
  options?: {
    model?: string;
    temperature?: number;
    useTemplate?: boolean;
  };
}

export interface GenerateResponse {
  success: boolean;
  dsl?: unknown;
  yaml?: string;
  error?: string;
  metadata?: {
    duration?: number;
    model?: string;
    templateUsed?: string | null;
  };
}

export interface RefineRequest {
  dsl: unknown;
  instruction: string;
}

export interface RefineResponse {
  success: boolean;
  dsl?: unknown;
  yaml?: string;
  error?: string;
  changes?: Array<{
    type: 'add' | 'modify' | 'remove';
    node?: string;
    edge?: string;
    reason: string;
  }>;
}

export interface ValidateResponse {
  valid: boolean;
  errors: Array<{ code: string; message: string; path?: string }>;
  warnings: Array<{ code: string; message: string; path?: string }>;
}

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: number;
  tags: string[];
}

/**
 * Stream chunk types — includes server generateStream events plus legacy types.
 */
export type StreamChunkType =
  | 'content'
  | 'progress'
  | 'metadata'
  | 'error'
  | 'done'
  | 'thinking'
  | 'node_created'
  | 'edges_created'
  | 'complete';

export interface StreamNodeInfo {
  id: string;
  type: string;
  title: string;
  position?: { x: number; y: number };
  data?: Record<string, unknown>;
}

export interface StreamEdgeInfo {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface StreamChunk {
  type: StreamChunkType;
  content?: string;
  progress?: {
    stage: string;
    percentage?: number;
    message?: string;
  };
  metadata?: {
    model?: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
  error?: string;
  done: boolean;
  /** Thinking step (server `thinking` events) */
  thinking?: {
    step: string;
    message: string;
  };
  /** Node info (server `node_created` events) */
  node?: StreamNodeInfo;
  /** Node index/total (server `node_created` events) */
  nodeProgress?: {
    current: number;
    total: number;
  };
  /** Edges (server `edges_created` events) */
  edges?: StreamEdgeInfo[];
  /** Final DSL (server `complete` events) */
  dsl?: unknown;
  /** Final YAML (server `complete` events) */
  yaml?: string;
}

/**
 * Progress callback for streaming
 */
export type ProgressCallback = (chunk: StreamChunk) => void;

/**
 * Generate workflow from natural language
 */
export async function generateWorkflow(request: GenerateRequest): Promise<GenerateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `API error: ${response.status} - ${error}`,
      };
    }

    return await response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Generate workflow with streaming (Server-Sent Events)
 */
export async function generateWorkflowStream(
  request: GenerateRequest,
  onProgress: ProgressCallback,
  abortSignal?: AbortSignal
): Promise<GenerateResponse> {
  return new Promise((resolve) => {
    let result: GenerateResponse = { success: false };
    let dslData: { dsl?: unknown; yaml?: string } | null = null;

    // We need to use fetch with SSE for POST requests
    fetch(`${API_BASE_URL}/api/generate/stream`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify(request),
      signal: abortSignal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const error = await response.text();
          result = {
            success: false,
            error: `API error: ${response.status} - ${error}`,
          };
          onProgress({
            type: 'error',
            error: result.error,
            done: true,
          });
          resolve(result);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          result = {
            success: false,
            error: 'No response body',
          };
          resolve(result);
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          for (;;) {
            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;

              try {
                const chunk = JSON.parse(trimmed.slice(6)) as StreamChunk;
                onProgress(chunk);

                // Capture final DSL from server `complete` events (done: false)
                if (chunk.type === 'complete') {
                  dslData = {
                    dsl: chunk.dsl,
                    yaml: chunk.yaml,
                  };
                  if (chunk.metadata?.model) {
                    result = {
                      ...result,
                      metadata: {
                        ...result.metadata,
                        model: chunk.metadata.model,
                      },
                    };
                  }
                }

                // Legacy: collect DSL from content chunks
                if (chunk.type === 'content' && chunk.content) {
                  try {
                    dslData = JSON.parse(chunk.content);
                  } catch {
                    // Not JSON, might be partial content
                  }
                }

                // Handle terminal chunks (`done: true` or type `done`/`error`)
                if (chunk.done || chunk.type === 'done') {
                  if (chunk.type === 'error') {
                    result = {
                      success: false,
                      error: chunk.error || 'Unknown error',
                    };
                  } else if (dslData) {
                    result = {
                      success: true,
                      dsl: dslData.dsl,
                      yaml: dslData.yaml,
                      metadata: result.metadata,
                    };
                  } else {
                    result = {
                      success: true,
                      metadata: result.metadata,
                    };
                  }
                  resolve(result);
                  return;
                }
              } catch (e) {
                console.warn('Failed to parse SSE chunk:', e);
              }
            }
          }

          // EOF after a valid `complete` (or legacy content) payload is success;
          // only treat a bare close with no captured DSL as unexpected.
          if (result.success === false && !result.error) {
            if (dslData?.dsl !== undefined) {
              result = {
                success: true,
                dsl: dslData.dsl,
                yaml: dslData.yaml,
                metadata: result.metadata,
              };
            } else {
              result = {
                success: false,
                error: 'Stream ended unexpectedly',
              };
            }
          }
          resolve(result);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Stream error';
          result = {
            success: false,
            error: message,
          };
          onProgress({
            type: 'error',
            error: message,
            done: true,
          });
          resolve(result);
        }
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Network error';
        result = {
          success: false,
          error: message,
        };
        onProgress({
          type: 'error',
          error: message,
          done: true,
        });
        resolve(result);
      });
  });
}

/**
 * Refine/edit existing workflow
 */
export async function refineWorkflow(request: RefineRequest): Promise<RefineResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/refine`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `API error: ${response.status} - ${error}`,
      };
    }

    return await response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Validate DSL
 */
export async function validateDsl(dsl: unknown): Promise<ValidateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dsl }),
    });

    if (!response.ok) {
      return {
        valid: false,
        errors: [{ code: 'E000', message: `API error: ${response.status}` }],
        warnings: [],
      };
    }

    return await response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    return {
      valid: false,
      errors: [{ code: 'E000', message }],
      warnings: [],
    };
  }
}

/**
 * Get available templates
 */
export async function getTemplates(): Promise<TemplateInfo[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/templates`);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.templates || [];
  } catch {
    return [];
  }
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// Legacy functions for backward compatibility
export function saveApiConfig(_config: {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}) {
  // API configuration is now handled server-side
  console.warn('saveApiConfig is deprecated. Configure LLM settings on the server.');
}

export function getApiConfig(): null {
  // API configuration is now handled server-side
  return null;
}

export function clearApiConfig() {
  // API configuration is now handled server-side
}
