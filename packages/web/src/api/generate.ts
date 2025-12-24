/**
 * API client for workflow generation
 */

export interface GenerateRequest {
  prompt: string;
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface GenerateResponse {
  success: boolean;
  dsl?: unknown;
  yaml?: string;
  error?: string;
  duration?: number;
}

// For browser, we'll use a simple mock that calls the core library
// In production, this would be a backend API call

export async function generateWorkflow(request: GenerateRequest): Promise<GenerateResponse> {
  // Check if we have API config in localStorage
  const savedConfig = localStorage.getItem('autodify-api-config');
  const config = savedConfig ? JSON.parse(savedConfig) : null;

  if (!config?.apiKey) {
    // Return a demo response without API
    return generateDemoWorkflow(request.prompt);
  }

  // Call backend API (to be implemented)
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        provider: config.provider,
        model: config.model,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('API call failed, using demo mode:', error);
    return generateDemoWorkflow(request.prompt);
  }
}

// Demo workflow generator (no API required)
function generateDemoWorkflow(prompt: string): GenerateResponse {
  const lowerPrompt = prompt.toLowerCase();

  // Complex branching workflow
  if (lowerPrompt.includes('分类') || lowerPrompt.includes('客服') || lowerPrompt.includes('分支')) {
    return {
      success: true,
      dsl: {
        version: '0.5.0',
        kind: 'app',
        app: {
          name: '智能客服系统',
          mode: 'workflow',
          icon: '🎧',
          description: prompt,
        },
        workflow: {
          graph: {
            nodes: [
              { id: 'start', type: 'custom', data: { type: 'start', title: '开始', variables: [{ variable: 'question', label: '用户问题', type: 'paragraph', required: true }] } },
              { id: 'classifier', type: 'custom', data: { type: 'question-classifier', title: '问题分类' } },
              { id: 'retrieval-tech', type: 'custom', data: { type: 'knowledge-retrieval', title: '技术文档检索' } },
              { id: 'retrieval-billing', type: 'custom', data: { type: 'knowledge-retrieval', title: '账单FAQ检索' } },
              { id: 'llm-tech', type: 'custom', data: { type: 'llm', title: '技术支持回答' } },
              { id: 'llm-billing', type: 'custom', data: { type: 'llm', title: '账单咨询回答' } },
              { id: 'llm-other', type: 'custom', data: { type: 'llm', title: '通用回答' } },
              { id: 'aggregator', type: 'custom', data: { type: 'variable-aggregator', title: '结果聚合' } },
              { id: 'end', type: 'custom', data: { type: 'end', title: '结束' } },
            ],
            edges: [
              { id: 'e1', source: 'start', target: 'classifier', sourceHandle: 'source', targetHandle: 'target' },
              { id: 'e2', source: 'classifier', target: 'retrieval-tech', sourceHandle: 'tech', targetHandle: 'target' },
              { id: 'e3', source: 'classifier', target: 'retrieval-billing', sourceHandle: 'billing', targetHandle: 'target' },
              { id: 'e4', source: 'classifier', target: 'llm-other', sourceHandle: 'other', targetHandle: 'target' },
              { id: 'e5', source: 'retrieval-tech', target: 'llm-tech', sourceHandle: 'source', targetHandle: 'target' },
              { id: 'e6', source: 'retrieval-billing', target: 'llm-billing', sourceHandle: 'source', targetHandle: 'target' },
              { id: 'e7', source: 'llm-tech', target: 'aggregator', sourceHandle: 'source', targetHandle: 'target' },
              { id: 'e8', source: 'llm-billing', target: 'aggregator', sourceHandle: 'source', targetHandle: 'target' },
              { id: 'e9', source: 'llm-other', target: 'aggregator', sourceHandle: 'source', targetHandle: 'target' },
              { id: 'e10', source: 'aggregator', target: 'end', sourceHandle: 'source', targetHandle: 'target' },
            ],
          },
        },
      },
      duration: 50,
    };
  }

  // RAG workflow
  if (lowerPrompt.includes('rag') || lowerPrompt.includes('知识库') || lowerPrompt.includes('检索')) {
    return {
      success: true,
      dsl: {
        version: '0.5.0',
        kind: 'app',
        app: {
          name: 'RAG 知识问答',
          mode: 'workflow',
          icon: '📚',
          description: prompt,
        },
        workflow: {
          graph: {
            nodes: [
              { id: 'start', type: 'custom', data: { type: 'start', title: '开始', variables: [{ variable: 'query', label: '用户问题', type: 'paragraph', required: true }] } },
              { id: 'retrieval', type: 'custom', data: { type: 'knowledge-retrieval', title: '知识检索' } },
              { id: 'llm', type: 'custom', data: { type: 'llm', title: '生成回答' } },
              { id: 'end', type: 'custom', data: { type: 'end', title: '结束' } },
            ],
            edges: [
              { id: 'e1', source: 'start', target: 'retrieval', sourceHandle: 'source', targetHandle: 'target' },
              { id: 'e2', source: 'retrieval', target: 'llm', sourceHandle: 'source', targetHandle: 'target' },
              { id: 'e3', source: 'llm', target: 'end', sourceHandle: 'source', targetHandle: 'target' },
            ],
          },
        },
      },
      duration: 30,
    };
  }

  // Translation workflow
  if (lowerPrompt.includes('翻译')) {
    return {
      success: true,
      dsl: {
        version: '0.5.0',
        kind: 'app',
        app: {
          name: '智能翻译',
          mode: 'workflow',
          icon: '🌐',
          description: prompt,
        },
        workflow: {
          graph: {
            nodes: [
              { id: 'start', type: 'custom', data: { type: 'start', title: '开始', variables: [{ variable: 'text', label: '待翻译文本', type: 'paragraph', required: true }, { variable: 'target_lang', label: '目标语言', type: 'text-input', required: true }] } },
              { id: 'llm-detect', type: 'custom', data: { type: 'llm', title: '语言检测' } },
              { id: 'llm-translate', type: 'custom', data: { type: 'llm', title: '翻译处理' } },
              { id: 'end', type: 'custom', data: { type: 'end', title: '结束' } },
            ],
            edges: [
              { id: 'e1', source: 'start', target: 'llm-detect', sourceHandle: 'source', targetHandle: 'target' },
              { id: 'e2', source: 'llm-detect', target: 'llm-translate', sourceHandle: 'source', targetHandle: 'target' },
              { id: 'e3', source: 'llm-translate', target: 'end', sourceHandle: 'source', targetHandle: 'target' },
            ],
          },
        },
      },
      duration: 25,
    };
  }

  // Simple Q&A workflow (default)
  return {
    success: true,
    dsl: {
      version: '0.5.0',
      kind: 'app',
      app: {
        name: '智能问答',
        mode: 'workflow',
        icon: '💬',
        description: prompt,
      },
      workflow: {
        graph: {
          nodes: [
            { id: 'start', type: 'custom', data: { type: 'start', title: '开始', variables: [{ variable: 'question', label: '问题', type: 'paragraph', required: true }] } },
            { id: 'llm', type: 'custom', data: { type: 'llm', title: 'AI 回答' } },
            { id: 'end', type: 'custom', data: { type: 'end', title: '结束' } },
          ],
          edges: [
            { id: 'e1', source: 'start', target: 'llm', sourceHandle: 'source', targetHandle: 'target' },
            { id: 'e2', source: 'llm', target: 'end', sourceHandle: 'source', targetHandle: 'target' },
          ],
        },
      },
    },
    duration: 15,
  };
}

// Save API configuration
export function saveApiConfig(config: {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}) {
  localStorage.setItem('autodify-api-config', JSON.stringify(config));
}

// Get API configuration
export function getApiConfig(): {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
} | null {
  const saved = localStorage.getItem('autodify-api-config');
  return saved ? JSON.parse(saved) : null;
}

// Clear API configuration
export function clearApiConfig() {
  localStorage.removeItem('autodify-api-config');
}
