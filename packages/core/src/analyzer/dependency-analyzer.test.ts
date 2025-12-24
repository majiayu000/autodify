/**
 * Dependency Analyzer Tests
 */

import { describe, it, expect } from 'vitest';
import { DependencyAnalyzer } from './dependency-analyzer.js';
import { createWorkflow } from '../builder/index.js';

describe('DependencyAnalyzer', () => {
  const analyzer = new DependencyAnalyzer();

  describe('Variable Reference Extraction', () => {
    it('should extract variable references from LLM prompts', () => {
      const dsl = createWorkflow({ name: 'Test' })
        .addStart({
          variables: [{ name: 'input', label: 'Input', type: 'paragraph', required: true }],
        })
        .addLLM({
          id: 'llm',
          title: 'Process',
          provider: 'openai',
          model: 'gpt-4o',
          systemPrompt: 'You are a helper',
          userPrompt: '{{#start.input#}}',
        })
        .addEnd({
          id: 'end',
          outputs: [{ name: 'result', source: ['llm', 'text'] }],
        })
        .connect('start', 'llm')
        .connect('llm', 'end')
        .build();

      const result = analyzer.analyze(dsl);

      expect(result.variables.referencedVariables.length).toBeGreaterThan(0);
      expect(result.variables.referencedVariables.some(
        (r) => r.nodeId === 'start' && r.variable === 'input'
      )).toBe(true);
    });

    it('should detect undefined variable references', () => {
      const dsl = createWorkflow({ name: 'Test' })
        .addStart({
          variables: [{ name: 'input', label: 'Input', type: 'paragraph', required: true }],
        })
        .addLLM({
          id: 'llm',
          title: 'Process',
          provider: 'openai',
          model: 'gpt-4o',
          systemPrompt: 'You are a helper',
          userPrompt: '{{#nonexistent.variable#}}',
        })
        .addEnd({
          id: 'end',
          outputs: [{ name: 'result', source: ['llm', 'text'] }],
        })
        .connect('start', 'llm')
        .connect('llm', 'end')
        .build();

      const result = analyzer.analyze(dsl);

      expect(result.variables.undefinedReferences.length).toBeGreaterThan(0);
      expect(result.variables.undefinedReferences.some(
        (r) => r.nodeId === 'nonexistent'
      )).toBe(true);

      expect(result.issues.some((i) => i.code === 'UNDEFINED_VARIABLE')).toBe(true);
    });
  });

  describe('Dependency Graph', () => {
    it('should build correct dependency graph', () => {
      const dsl = createWorkflow({ name: 'Test' })
        .addStart({
          variables: [{ name: 'query', label: 'Query', type: 'paragraph', required: true }],
        })
        .addKnowledgeRetrieval({
          id: 'retrieval',
          title: 'Search',
          queryFrom: ['start', 'query'],
          datasetIds: ['ds-1'],
        })
        .addLLM({
          id: 'llm',
          title: 'Answer',
          provider: 'openai',
          model: 'gpt-4o',
          systemPrompt: 'Context: {{#retrieval.result#}}',
          userPrompt: '{{#start.query#}}',
        })
        .addEnd({
          id: 'end',
          outputs: [{ name: 'answer', source: ['llm', 'text'] }],
        })
        .connect('start', 'retrieval')
        .connect('retrieval', 'llm')
        .connect('llm', 'end')
        .build();

      const result = analyzer.analyze(dsl);

      // Check dependencies
      const llmDeps = result.dependencies.nodes.get('llm');
      expect(llmDeps).toBeDefined();
      expect(llmDeps?.dependsOn).toContain('retrieval');
      expect(llmDeps?.dependsOn).toContain('start');

      // Check topological order
      expect(result.dependencies.topologicalOrder.indexOf('start'))
        .toBeLessThan(result.dependencies.topologicalOrder.indexOf('llm'));
    });

    it('should detect circular dependencies', () => {
      // Note: This is a synthetic test - in real workflows, circular deps would be prevented
      // We test the analyzer's ability to detect them if they exist

      const dsl = createWorkflow({ name: 'Test' })
        .addStart({
          variables: [{ name: 'input', label: 'Input', type: 'paragraph', required: true }],
        })
        .addLLM({
          id: 'llm-1',
          title: 'LLM 1',
          provider: 'openai',
          model: 'gpt-4o',
          systemPrompt: 'Helper',
          userPrompt: '{{#llm-2.text#}}', // References llm-2 creating a cycle
        })
        .addLLM({
          id: 'llm-2',
          title: 'LLM 2',
          provider: 'openai',
          model: 'gpt-4o',
          systemPrompt: 'Helper',
          userPrompt: '{{#llm-1.text#}}', // References llm-1 creating a cycle
        })
        .addEnd({
          id: 'end',
          outputs: [{ name: 'result', source: ['llm-1', 'text'] }],
        })
        .connect('start', 'llm-1')
        .connect('llm-1', 'llm-2')
        .connect('llm-2', 'end')
        .build();

      const result = analyzer.analyze(dsl);

      expect(result.dependencies.circularDependencies.length).toBeGreaterThan(0);
      expect(result.issues.some((i) => i.code === 'CIRCULAR_DEPENDENCY')).toBe(true);
    });
  });

  describe('Provided Variables', () => {
    it('should identify variables provided by each node type', () => {
      const dsl = createWorkflow({ name: 'Test' })
        .addStart({
          variables: [
            { name: 'input1', label: 'Input 1', type: 'paragraph', required: true },
            { name: 'input2', label: 'Input 2', type: 'text-input', required: false },
          ],
        })
        .addLLM({
          id: 'llm',
          title: 'Process',
          provider: 'openai',
          model: 'gpt-4o',
          systemPrompt: 'Helper',
          userPrompt: '{{#start.input1#}}',
        })
        .addEnd({
          id: 'end',
          outputs: [{ name: 'result', source: ['llm', 'text'] }],
        })
        .connect('start', 'llm')
        .connect('llm', 'end')
        .build();

      const result = analyzer.analyze(dsl);

      // Start node provides input variables
      expect(result.variables.definedVariables.has('start.input1')).toBe(true);
      expect(result.variables.definedVariables.has('start.input2')).toBe(true);

      // LLM node provides 'text'
      expect(result.variables.definedVariables.has('llm.text')).toBe(true);
    });
  });

  describe('Topological Order', () => {
    it('should compute correct execution order', () => {
      const dsl = createWorkflow({ name: 'Test' })
        .addStart({
          variables: [{ name: 'input', label: 'Input', type: 'paragraph', required: true }],
        })
        .addLLM({
          id: 'llm-1',
          title: 'Step 1',
          provider: 'openai',
          model: 'gpt-4o',
          systemPrompt: 'Helper',
          userPrompt: '{{#start.input#}}',
        })
        .addLLM({
          id: 'llm-2',
          title: 'Step 2',
          provider: 'openai',
          model: 'gpt-4o',
          systemPrompt: 'Helper',
          userPrompt: '{{#llm-1.text#}}',
        })
        .addLLM({
          id: 'llm-3',
          title: 'Step 3',
          provider: 'openai',
          model: 'gpt-4o',
          systemPrompt: 'Helper',
          userPrompt: '{{#llm-2.text#}}',
        })
        .addEnd({
          id: 'end',
          outputs: [{ name: 'result', source: ['llm-3', 'text'] }],
        })
        .connect('start', 'llm-1')
        .connect('llm-1', 'llm-2')
        .connect('llm-2', 'llm-3')
        .connect('llm-3', 'end')
        .build();

      const result = analyzer.analyze(dsl);
      const order = result.dependencies.topologicalOrder;

      // Verify order
      expect(order.indexOf('start')).toBeLessThan(order.indexOf('llm-1'));
      expect(order.indexOf('llm-1')).toBeLessThan(order.indexOf('llm-2'));
      expect(order.indexOf('llm-2')).toBeLessThan(order.indexOf('llm-3'));
      expect(order.indexOf('llm-3')).toBeLessThan(order.indexOf('end'));
    });
  });
});
