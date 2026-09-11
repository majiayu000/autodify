import { vi } from 'vitest';
import type { DifyDSL } from '@autodify/core';

/**
 * Mock LLM 响应数据
 */
export const mockDSL: DifyDSL = {
  version: '0.1.3',
  kind: 'app',
  app: {
    mode: 'workflow',
    name: '测试工作流',
    description: '这是一个测试生成的工作流',
    icon: '🤖',
    icon_background: '#0EA5E9',
    use_icon_as_answer_icon: true,
  },
  workflow: {
    graph: {
      nodes: [
        {
          id: 'start',
          data: {
            type: 'start',
            title: '开始',
            desc: '',
            variables: [],
          },
        },
        {
          id: 'llm',
          data: {
            type: 'llm',
            title: 'LLM',
            model: {
              provider: 'openai',
              name: 'gpt-4o',
              mode: 'chat',
              completion_params: {},
            },
            prompt_template: [
              {
                role: 'system',
                text: '你是一个智能助手',
              },
            ],
            memory: null,
            context: {
              enabled: false,
            },
            vision: {
              enabled: false,
            },
          },
        },
        {
          id: 'end',
          data: {
            type: 'end',
            title: '结束',
            outputs: [],
          },
        },
      ],
      edges: [
        {
          id: 'start-llm',
          source: 'start',
          target: 'llm',
        },
        {
          id: 'llm-end',
          source: 'llm',
          target: 'end',
        },
      ],
    },
    features: {
      opening_statement: '',
      suggested_questions: [],
      suggested_questions_after_answer: {
        enabled: false,
      },
      speech_to_text: {
        enabled: false,
      },
      text_to_speech: {
        enabled: false,
      },
      file_upload: {
        enabled: false,
      },
      retriever_resource: {
        enabled: false,
      },
      sensitive_word_avoidance: {
        enabled: false,
      },
    },
    environment_variables: [],
    conversation_variables: [],
  },
};

/**
 * Mock 工作流服务
 */
export function mockWorkflowService() {
  return {
    generate: vi.fn().mockResolvedValue({
      success: true,
      dsl: mockDSL,
      yaml: 'version: 0.1.3\nkind: app\n...',
      metadata: {
        duration: 1500,
        model: 'gpt-4o',
        templateUsed: null,
      },
    }),
    refine: vi.fn().mockResolvedValue({
      success: true,
      dsl: mockDSL,
      yaml: 'version: 0.1.3\nkind: app\n...',
      changes: [
        {
          type: 'modify',
          node: 'llm',
          reason: '更新了 prompt',
        },
      ],
    }),
    validate: vi.fn().mockResolvedValue({
      valid: true,
      errors: [],
      warnings: [],
    }),
    getTemplates: vi.fn().mockReturnValue([
      {
        id: 'simple-qa',
        name: '简单问答',
        description: '一个简单的问答工作流',
        category: 'basic',
        complexity: 1,
        tags: ['qa', 'basic'],
      },
    ]),
    getTemplateById: vi.fn().mockResolvedValue(mockDSL),
    generateStream: vi.fn().mockImplementation(async function* () {
      yield {
        type: 'progress',
        progress: { stage: 'initializing', percentage: 0, message: 'Starting...' },
        done: false,
      };
      yield {
        type: 'complete',
        dsl: mockDSL,
        yaml: 'version: 0.1.3\nkind: app\n...',
        metadata: {
          duration: 100,
          model: 'gpt-4o',
          templateUsed: null,
        },
        done: true,
      };
    }),
  };
}

/**
 * Mock WorkflowOrchestrator
 */
export function mockWorkflowOrchestrator() {
  return {
    generate: vi.fn().mockResolvedValue({
      success: true,
      dsl: mockDSL,
      metadata: {
        templateUsed: null,
      },
    }),
    edit: vi.fn().mockResolvedValue({
      success: true,
      dsl: mockDSL,
      changes: [
        {
          type: 'modify',
          target: 'node',
          id: 'llm',
          description: '更新了 prompt',
        },
      ],
    }),
  };
}

/**
 * Mock DSLValidator
 */
export function mockDSLValidator() {
  return {
    validate: vi.fn().mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
    }),
  };
}

/**
 * Mock TemplateStore
 */
export function mockTemplateStore() {
  return {
    getAll: vi.fn().mockReturnValue([
      {
        metadata: {
          id: 'simple-qa',
          name: '简单问答',
          description: '一个简单的问答工作流',
          category: 'basic',
          complexity: 1,
          tags: ['qa', 'basic'],
        },
        build: vi.fn().mockReturnValue(mockDSL),
      },
    ]),
    get: vi.fn().mockReturnValue({
      metadata: {
        id: 'simple-qa',
        name: '简单问答',
        description: '一个简单的问答工作流',
        category: 'basic',
        complexity: 1,
        tags: ['qa', 'basic'],
      },
      build: vi.fn().mockReturnValue(mockDSL),
    }),
  };
}
