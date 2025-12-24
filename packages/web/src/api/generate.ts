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
