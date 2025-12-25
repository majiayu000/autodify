/**
 * API client for workflow generation
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
 * Stream chunk types
 */
export type StreamChunkType = 'content' | 'progress' | 'metadata' | 'error' | 'done';

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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
          while (true) {
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

                // Collect content chunks
                if (chunk.type === 'content' && chunk.content) {
                  try {
                    dslData = JSON.parse(chunk.content);
                  } catch {
                    // Not JSON, might be partial content
                  }
                }

                // Handle completion
                if (chunk.done) {
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
                    };
                  } else {
                    result = {
                      success: true,
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

          // If we get here without a done chunk, something went wrong
          if (result.success === false && !result.error) {
            result = {
              success: false,
              error: 'Stream ended unexpectedly',
            };
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
      headers: {
        'Content-Type': 'application/json',
      },
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
