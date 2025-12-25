/**
 * DSL Generator Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DSLGenerator,
  type LLMClient,
  createSimpleDSL,
  dslToYAML,
} from './generator.js';
import type { DifyDSL } from '../types/index.js';
import { parseYAML } from '../utils/yaml.js';

// Mock LLM Client
class MockLLMClient implements LLMClient {
  private responses: string[] = [];
  private currentIndex = 0;

  constructor(responses: string[] = []) {
    this.responses = responses;
  }

  async generate(_prompt: string): Promise<string> {
    if (this.currentIndex >= this.responses.length) {
      throw new Error('No more mock responses available');
    }
    return this.responses[this.currentIndex++]!;
  }

  setResponses(responses: string[]): void {
    this.responses = responses;
    this.currentIndex = 0;
  }
}

describe('DSLGenerator', () => {
  let mockClient: MockLLMClient;
  let generator: DSLGenerator;

  beforeEach(() => {
    mockClient = new MockLLMClient();
    generator = new DSLGenerator(mockClient, {
      modelProvider: 'openai',
      modelName: 'gpt-4o',
      maxRetries: 3,
      validate: true,
    });
  });

  describe('Node Layout Calculation', () => {
    it('should create DSL with correct node positions', () => {
      const dsl = createSimpleDSL('Test Workflow', 'Test description');

      const nodes = dsl.workflow?.graph.nodes;
      expect(nodes).toBeDefined();
      expect(nodes?.length).toBe(3);

      // Check start node position
      const startNode = nodes?.find((n) => n.data.type === 'start');
      expect(startNode?.position).toEqual({ x: 80, y: 282 });
      expect(startNode?.width).toBe(244);
      expect(startNode?.height).toBe(90);

      // Check LLM node position (should be to the right)
      const llmNode = nodes?.find((n) => n.data.type === 'llm');
      expect(llmNode?.position.x).toBeGreaterThan(startNode?.position.x || 0);
      expect(llmNode?.position.y).toBe(282);
      expect(llmNode?.width).toBe(244);
      expect(llmNode?.height).toBe(98);

      // Check end node position (should be furthest right)
      const endNode = nodes?.find((n) => n.data.type === 'end');
      expect(endNode?.position.x).toBeGreaterThan(llmNode?.position.x || 0);
      expect(endNode?.position.y).toBe(282);
      expect(endNode?.height).toBe(90);
    });

    it('should set correct node dimensions for different types', () => {
      const dsl = createSimpleDSL('Test', 'Test');
      const nodes = dsl.workflow?.graph.nodes;

      const startNode = nodes?.find((n) => n.data.type === 'start');
      const llmNode = nodes?.find((n) => n.data.type === 'llm');
      const endNode = nodes?.find((n) => n.data.type === 'end');

      expect(startNode?.height).toBe(90);
      expect(llmNode?.height).toBe(98);
      expect(endNode?.height).toBe(90);
    });

    it('should set source and target positions correctly', () => {
      const dsl = createSimpleDSL('Test', 'Test');
      const nodes = dsl.workflow?.graph.nodes;

      nodes?.forEach((node) => {
        expect(node.sourcePosition).toBe('right');
        expect(node.targetPosition).toBe('left');
        expect(node.selected).toBe(false);
      });
    });

    it('should create unique node IDs', () => {
      const dsl1 = createSimpleDSL('Test1', 'Test1');
      const dsl2 = createSimpleDSL('Test2', 'Test2');

      const ids1 = dsl1.workflow?.graph.nodes.map((n) => n.id) || [];
      const ids2 = dsl2.workflow?.graph.nodes.map((n) => n.id) || [];

      // IDs should be different between different DSLs
      expect(ids1.some((id) => ids2.includes(id))).toBe(false);
    });
  });

  describe('YAML Generation', () => {
    it('should serialize DSL to valid YAML', () => {
      const dsl = createSimpleDSL('Test Workflow', 'A test workflow');
      const yaml = dslToYAML(dsl);

      expect(yaml).toBeTruthy();
      expect(yaml).toContain('version:');
      expect(yaml).toContain('kind: app');
      expect(yaml).toContain('workflow:');
      expect(yaml).toContain('graph:');
    });

    it('should parse serialized YAML back to DSL', () => {
      const originalDsl = createSimpleDSL('Test', 'Description');
      const yaml = dslToYAML(originalDsl);
      const parseResult = parseYAML(yaml);

      expect(parseResult.success).toBe(true);
      expect(parseResult.data).toBeDefined();
      expect(parseResult.data?.app.name).toBe('Test');
      expect(parseResult.data?.app.description).toBe('Description');
    });

    it('should include all required workflow fields', () => {
      const dsl = createSimpleDSL('Test', 'Test');
      const yaml = dslToYAML(dsl);

      expect(yaml).toContain('conversation_variables');
      expect(yaml).toContain('environment_variables');
      expect(yaml).toContain('features:');
      expect(yaml).toContain('file_upload:');
    });

    it('should generate edges with correct format', () => {
      const dsl = createSimpleDSL('Test', 'Test');
      const edges = dsl.workflow?.graph.edges;

      expect(edges).toBeDefined();
      expect(edges?.length).toBe(2);

      edges?.forEach((edge) => {
        expect(edge.id).toBeTruthy();
        expect(edge.source).toBeTruthy();
        expect(edge.target).toBeTruthy();
        expect(edge.sourceHandle).toBe('source');
        expect(edge.targetHandle).toBe('target');
        expect(edge.type).toBe('custom');
        expect(edge.data).toBeDefined();
      });
    });
  });

  describe('Generate Method', () => {
    it('should successfully generate DSL from valid YAML response', async () => {
      const simpleDsl = createSimpleDSL('Test', 'Test workflow');
      const validYaml = dslToYAML(simpleDsl);

      mockClient.setResponses([validYaml]);

      const result = await generator.generate('Create a simple workflow');

      expect(result.success).toBe(true);
      expect(result.dsl).toBeDefined();
      expect(result.yaml).toBeDefined();
      expect(result.retries).toBe(0);
    });

    it('should handle YAML wrapped in markdown code blocks', async () => {
      const simpleDsl = createSimpleDSL('Test', 'Test');
      const validYaml = dslToYAML(simpleDsl);
      const wrappedYaml = `\`\`\`yaml\n${validYaml}\n\`\`\``;

      mockClient.setResponses([wrappedYaml]);

      const result = await generator.generate('Create a workflow');

      expect(result.success).toBe(true);
      expect(result.dsl).toBeDefined();
    });

    it('should handle YAML with generic code block markers', async () => {
      const simpleDsl = createSimpleDSL('Test', 'Test');
      const validYaml = dslToYAML(simpleDsl);
      const wrappedYaml = `\`\`\`\n${validYaml}\n\`\`\``;

      mockClient.setResponses([wrappedYaml]);

      const result = await generator.generate('Create a workflow');

      expect(result.success).toBe(true);
    });

    it('should normalize DSL with updated node IDs', async () => {
      const simpleDsl = createSimpleDSL('Test', 'Test');
      const yaml = dslToYAML(simpleDsl);
      const originalNodeIds = simpleDsl.workflow?.graph.nodes.map((n) => n.id) || [];

      mockClient.setResponses([yaml]);

      const result = await generator.generate('Create a workflow');

      expect(result.success).toBe(true);

      const newNodeIds = result.dsl?.workflow?.graph.nodes.map((n) => n.id) || [];

      // Node IDs should be regenerated
      expect(newNodeIds.some((id) => originalNodeIds.includes(id))).toBe(false);
      expect(newNodeIds.length).toBe(originalNodeIds.length);
    });

    it('should update edge references after node ID changes', async () => {
      const simpleDsl = createSimpleDSL('Test', 'Test');
      const yaml = dslToYAML(simpleDsl);

      mockClient.setResponses([yaml]);

      const result = await generator.generate('Create a workflow');

      expect(result.success).toBe(true);

      const nodes = result.dsl?.workflow?.graph.nodes || [];
      const edges = result.dsl?.workflow?.graph.edges || [];
      const nodeIds = new Set(nodes.map((n) => n.id));

      // All edge sources and targets should exist in nodes
      edges.forEach((edge) => {
        expect(nodeIds.has(edge.source)).toBe(true);
        expect(nodeIds.has(edge.target)).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should retry on parse error', async () => {
      const invalidYaml = 'invalid: yaml: {{malformed';
      const validDsl = createSimpleDSL('Test', 'Test');
      const validYaml = dslToYAML(validDsl);

      // First response is invalid, second is the fix prompt response (also invalid), then valid
      mockClient.setResponses([invalidYaml, invalidYaml, validYaml]);

      const result = await generator.generate('Create a workflow');

      expect(result.success).toBe(true);
      expect(result.retries).toBeGreaterThan(0);
    });

    it('should return error after max retries', async () => {
      const invalidYaml = 'completely invalid yaml content ###';

      mockClient.setResponses([
        invalidYaml,
        invalidYaml,
        invalidYaml,
        invalidYaml,
        invalidYaml,
        invalidYaml,
      ]);

      const result = await generator.generate('Create a workflow');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.retries).toBe(3);
    });

    it('should handle LLM client errors', async () => {
      const errorClient = new MockLLMClient([]);

      const errorGenerator = new DSLGenerator(errorClient);
      const result = await errorGenerator.generate('Test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle validation errors', async () => {
      // Create an invalid DSL (missing start node)
      const invalidDsl: DifyDSL = {
        version: '0.1.3',
        kind: 'app',
        app: {
          name: 'Invalid',
          mode: 'workflow',
          icon: '🤖',
          icon_type: 'emoji',
        },
        workflow: {
          conversation_variables: [],
          environment_variables: [],
          graph: {
            nodes: [
              {
                id: 'end',
                type: 'custom',
                data: {
                  type: 'end',
                  title: '结束',
                  outputs: [],
                },
              },
            ],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 },
          },
          features: {
            file_upload: { enabled: false, image: { enabled: false, number_limits: 3, transfer_methods: [] } },
            opening_statement: '',
            retriever_resource: { enabled: true },
            sensitive_word_avoidance: { enabled: false },
            speech_to_text: { enabled: false },
            suggested_questions: [],
            suggested_questions_after_answer: { enabled: false },
            text_to_speech: { enabled: false, language: '', voice: '' },
          },
        },
      };

      const invalidYaml = dslToYAML(invalidDsl);
      mockClient.setResponses([invalidYaml, invalidYaml, invalidYaml, invalidYaml]);

      const result = await generator.generate('Create workflow');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
    });

    it('should skip validation when validate option is false', async () => {
      const noValidateGenerator = new DSLGenerator(mockClient, {
        validate: false,
      });

      // Invalid DSL that would fail validation
      const invalidDsl: DifyDSL = {
        version: '0.1.3',
        kind: 'app',
        app: { name: 'Test', mode: 'workflow', icon: '🤖', icon_type: 'emoji' },
        workflow: {
          conversation_variables: [],
          environment_variables: [],
          graph: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
          features: {
            file_upload: { enabled: false, image: { enabled: false, number_limits: 3, transfer_methods: [] } },
            opening_statement: '',
            retriever_resource: { enabled: true },
            sensitive_word_avoidance: { enabled: false },
            speech_to_text: { enabled: false },
            suggested_questions: [],
            suggested_questions_after_answer: { enabled: false },
            text_to_speech: { enabled: false, language: '', voice: '' },
          },
        },
      };

      mockClient.setResponses([dslToYAML(invalidDsl)]);

      const result = await noValidateGenerator.generate('Test');

      // Should succeed because validation is disabled
      expect(result.success).toBe(true);
    });
  });

  describe('generateSimpleWorkflow', () => {
    it('should create a simple workflow with custom parameters', async () => {
      const validDsl = createSimpleDSL('Custom Name', 'Custom description');
      const validYaml = dslToYAML(validDsl);

      mockClient.setResponses([validYaml]);

      const result = await generator.generateSimpleWorkflow(
        'Custom Name',
        'You are a helpful assistant',
        '用户输入'
      );

      expect(result.success).toBe(true);
      expect(result.dsl).toBeDefined();
    });

    it('should use default input label', async () => {
      const validDsl = createSimpleDSL('Test', 'Test');
      mockClient.setResponses([dslToYAML(validDsl)]);

      const result = await generator.generateSimpleWorkflow(
        'Test',
        'System prompt'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Variable Reference Updates', () => {
    it('should update variable references in prompt templates', async () => {
      const dsl = createSimpleDSL('Test', 'Test');

      // Manually add variable references to test
      const llmNode = dsl.workflow?.graph.nodes.find((n) => n.data.type === 'llm');
      if (llmNode && llmNode.data.type === 'llm') {
        const startNode = dsl.workflow?.graph.nodes.find((n) => n.data.type === 'start');
        llmNode.data.prompt_template = [
          { role: 'system', text: 'You are helpful' },
          { role: 'user', text: `Process this: {{#${startNode?.id}.input#}}` },
        ];
      }

      mockClient.setResponses([dslToYAML(dsl)]);

      const result = await generator.generate('Test');

      expect(result.success).toBe(true);

      const resultLlmNode = result.dsl?.workflow?.graph.nodes.find((n) => n.data.type === 'llm');
      if (resultLlmNode && resultLlmNode.data.type === 'llm') {
        const userPrompt = resultLlmNode.data.prompt_template?.find((p) => p.role === 'user');
        expect(userPrompt?.text).toContain('{{#');
        expect(userPrompt?.text).toContain('#}}');
      }
    });

    it('should update value_selector in outputs', async () => {
      const dsl = createSimpleDSL('Test', 'Test');
      const yaml = dslToYAML(dsl);

      mockClient.setResponses([yaml]);

      const result = await generator.generate('Test');

      expect(result.success).toBe(true);

      const endNode = result.dsl?.workflow?.graph.nodes.find((n) => n.data.type === 'end');
      const llmNode = result.dsl?.workflow?.graph.nodes.find((n) => n.data.type === 'llm');

      if (endNode && endNode.data.type === 'end') {
        const output = endNode.data.outputs?.[0];
        expect(output?.value_selector?.[0]).toBe(llmNode?.id);
      }
    });
  });

  describe('createSimpleDSL', () => {
    it('should create a valid simple DSL structure', () => {
      const dsl = createSimpleDSL('My Workflow', 'Description here');

      expect(dsl.version).toBe('0.1.3');
      expect(dsl.kind).toBe('app');
      expect(dsl.app.name).toBe('My Workflow');
      expect(dsl.app.description).toBe('Description here');
      expect(dsl.app.mode).toBe('workflow');
    });

    it('should create workflow with 3 nodes (start, llm, end)', () => {
      const dsl = createSimpleDSL('Test', 'Test');

      expect(dsl.workflow?.graph.nodes.length).toBe(3);

      const nodeTypes = dsl.workflow?.graph.nodes.map((n) => n.data.type);
      expect(nodeTypes).toContain('start');
      expect(nodeTypes).toContain('llm');
      expect(nodeTypes).toContain('end');
    });

    it('should create 2 edges connecting the nodes', () => {
      const dsl = createSimpleDSL('Test', 'Test');

      expect(dsl.workflow?.graph.edges.length).toBe(2);
    });

    it('should create LLM node with default configuration', () => {
      const dsl = createSimpleDSL('Test', 'Test');

      const llmNode = dsl.workflow?.graph.nodes.find((n) => n.data.type === 'llm');
      expect(llmNode).toBeDefined();

      if (llmNode && llmNode.data.type === 'llm') {
        expect(llmNode.data.model?.provider).toBe('openai');
        expect(llmNode.data.model?.name).toBe('gpt-4o');
        expect(llmNode.data.model?.mode).toBe('chat');
        expect(llmNode.data.prompt_template).toBeDefined();
      }
    });

    it('should create start node with input variable', () => {
      const dsl = createSimpleDSL('Test', 'Test');

      const startNode = dsl.workflow?.graph.nodes.find((n) => n.data.type === 'start');

      if (startNode && startNode.data.type === 'start') {
        expect(startNode.data.variables).toBeDefined();
        expect(startNode.data.variables?.length).toBeGreaterThan(0);
        expect(startNode.data.variables?.[0]?.variable).toBe('input');
      }
    });
  });
});
