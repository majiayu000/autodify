/**
 * WorkflowBuilder Tests
 */

import { describe, it, expect } from 'vitest';
import { createWorkflow } from './workflow-builder.js';
import { DSLValidator } from '../validator/index.js';

describe('WorkflowBuilder', () => {
  describe('Basic Workflow', () => {
    it('should create a simple Q&A workflow', () => {
      const dsl = createWorkflow({
        name: '简单问答',
        description: '测试工作流',
      })
        .addStart({
          variables: [
            {
              name: 'question',
              label: '问题',
              type: 'paragraph',
              required: true,
            },
          ],
        })
        .addLLM({
          id: 'llm',
          title: 'AI 回答',
          provider: 'openai',
          model: 'gpt-4o',
          systemPrompt: '你是一个助手',
          userPrompt: '{{#start.question#}}',
        })
        .addEnd({
          id: 'end',
          outputs: [{ name: 'answer', source: ['llm', 'text'] }],
        })
        .connect('start', 'llm')
        .connect('llm', 'end')
        .build();

      expect(dsl.app.name).toBe('简单问答');
      expect(dsl.workflow?.graph.nodes).toHaveLength(3);
      expect(dsl.workflow?.graph.edges).toHaveLength(2);

      // Validate the generated DSL
      const validator = new DSLValidator();
      const result = validator.validate(dsl);
      expect(result.valid).toBe(true);
    });

    it('should auto-generate node IDs', () => {
      const dsl = createWorkflow({ name: '自动ID测试' })
        .addStart({
          variables: [{ name: 'input', label: '输入', type: 'text-input', required: true }],
        })
        .addLLM({
          title: 'LLM 1',
          provider: 'openai',
          model: 'gpt-4o',
          systemPrompt: 'test',
          userPrompt: '{{#start.input#}}',
        })
        .addLLM({
          title: 'LLM 2',
          provider: 'openai',
          model: 'gpt-4o',
          systemPrompt: 'test',
          userPrompt: '{{#llm-1.text#}}',
        })
        .addEnd({
          id: 'end',
          outputs: [{ name: 'result', source: ['llm-2', 'text'] }],
        })
        .connect('start', 'llm-1')
        .connect('llm-1', 'llm-2')
        .connect('llm-2', 'end')
        .build();

      const nodeIds = dsl.workflow?.graph.nodes.map((n) => n.id) ?? [];
      expect(nodeIds).toContain('start');
      expect(nodeIds).toContain('llm-1');
      expect(nodeIds).toContain('llm-2');
      expect(nodeIds).toContain('end');
    });
  });

  describe('Conditional Workflow', () => {
    it('should create a workflow with IF/ELSE branching', () => {
      const dsl = createWorkflow({ name: '条件分支' })
        .addStart({
          variables: [
            { name: 'input', label: '输入', type: 'paragraph', required: true },
            { name: 'mode', label: '模式', type: 'select', required: true, options: ['详细', '简洁'] },
          ],
        })
        .addIfElse({
          id: 'condition',
          title: '检查模式',
          conditions: [
            {
              id: 'is-detailed',
              logicalOperator: 'and',
              rules: [{ variableSelector: ['start', 'mode'], operator: '=', value: '详细' }],
            },
          ],
        })
        .addLLM({
          id: 'detailed-llm',
          title: '详细处理',
          provider: 'openai',
          model: 'gpt-4o',
          systemPrompt: '详细分析',
          userPrompt: '{{#start.input#}}',
        })
        .addLLM({
          id: 'brief-llm',
          title: '简洁处理',
          provider: 'openai',
          model: 'gpt-4o',
          systemPrompt: '简洁回答',
          userPrompt: '{{#start.input#}}',
        })
        .addAggregator({
          id: 'agg',
          title: '聚合',
          variables: [['detailed-llm', 'text'], ['brief-llm', 'text']],
          outputType: 'string',
        })
        .addEnd({
          id: 'end',
          outputs: [{ name: 'result', source: ['agg', 'output'] }],
        })
        .connect('start', 'condition')
        .connect('condition', 'detailed-llm', { sourceHandle: 'is-detailed' })
        .connect('condition', 'brief-llm', { sourceHandle: 'false' })
        .connect('detailed-llm', 'agg')
        .connect('brief-llm', 'agg')
        .connect('agg', 'end')
        .build();

      expect(dsl.workflow?.graph.nodes).toHaveLength(6);
      expect(dsl.workflow?.graph.edges).toHaveLength(6);

      // Check IF/ELSE node
      const ifElseNode = dsl.workflow?.graph.nodes.find((n) => n.data.type === 'if-else');
      expect(ifElseNode).toBeDefined();
      expect((ifElseNode?.data as { conditions?: unknown[] }).conditions).toHaveLength(1);
    });
  });

  describe('RAG Workflow', () => {
    it('should create a knowledge retrieval workflow', () => {
      const dsl = createWorkflow({ name: '知识库问答' })
        .addStart({
          variables: [{ name: 'query', label: '问题', type: 'paragraph', required: true }],
        })
        .addKnowledgeRetrieval({
          id: 'retrieval',
          title: '知识检索',
          queryFrom: ['start', 'query'],
          datasetIds: ['dataset-1'],
          topK: 5,
        })
        .addLLM({
          id: 'llm',
          title: '生成回答',
          provider: 'openai',
          model: 'gpt-4o',
          systemPrompt: '基于以下内容回答问题：\n{{#retrieval.result#}}',
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

      expect(dsl.workflow?.graph.nodes).toHaveLength(4);

      const retrievalNode = dsl.workflow?.graph.nodes.find((n) => n.data.type === 'knowledge-retrieval');
      expect(retrievalNode).toBeDefined();
      expect(retrievalNode?.data.dataset_ids).toContain('dataset-1');
    });
  });

  describe('Code Node Workflow', () => {
    it('should create a workflow with code execution', () => {
      const dsl = createWorkflow({ name: '代码处理' })
        .addStart({
          variables: [{ name: 'data', label: '数据', type: 'paragraph', required: true }],
        })
        .addCode({
          id: 'code',
          title: '数据处理',
          language: 'python3',
          code: 'def main(data):\n    return {"result": data.upper()}',
          inputs: [{ name: 'data', source: ['start', 'data'] }],
          outputs: [{ name: 'result', type: 'string' }],
        })
        .addEnd({
          id: 'end',
          outputs: [{ name: 'processed', source: ['code', 'result'] }],
        })
        .connect('start', 'code')
        .connect('code', 'end')
        .build();

      const codeNode = dsl.workflow?.graph.nodes.find((n) => n.data.type === 'code');
      expect(codeNode).toBeDefined();
      expect(codeNode?.data.code_language).toBe('python3');
    });
  });

  describe('HTTP Request Workflow', () => {
    it('should create a workflow with HTTP request', () => {
      const dsl = createWorkflow({ name: 'API 调用' })
        .addStart({
          variables: [{ name: 'param', label: '参数', type: 'text-input', required: false }],
        })
        .addHttpRequest({
          id: 'http',
          title: 'API 请求',
          method: 'get',
          url: 'https://api.example.com/data',
          headers: [{ key: 'Content-Type', value: 'application/json' }],
          timeout: { connect: 10, read: 30, write: 10 },
        })
        .addLLM({
          id: 'llm',
          title: '处理结果',
          provider: 'openai',
          model: 'gpt-4o',
          systemPrompt: '分析数据',
          userPrompt: '{{#http.body#}}',
        })
        .addEnd({
          id: 'end',
          outputs: [{ name: 'result', source: ['llm', 'text'] }],
        })
        .connect('start', 'http')
        .connect('http', 'llm')
        .connect('llm', 'end')
        .build();

      const httpNode = dsl.workflow?.graph.nodes.find((n) => n.data.type === 'http-request');
      expect(httpNode).toBeDefined();
      expect(httpNode?.data.method).toBe('get');
      expect(httpNode?.data.url).toBe('https://api.example.com/data');
    });
  });

  describe('Question Classifier Workflow', () => {
    it('should create a workflow with question classification', () => {
      const dsl = createWorkflow({ name: '意图路由' })
        .addStart({
          variables: [{ name: 'question', label: '问题', type: 'paragraph', required: true }],
        })
        .addQuestionClassifier({
          id: 'classifier',
          title: '问题分类',
          queryFrom: ['start', 'question'],
          provider: 'openai',
          model: 'gpt-4o-mini',
          classes: [
            { id: 'tech', name: '技术问题' },
            { id: 'business', name: '业务问题' },
          ],
        })
        .addLLM({
          id: 'tech-llm',
          title: '技术回答',
          provider: 'openai',
          model: 'gpt-4o',
          systemPrompt: '你是技术专家',
          userPrompt: '{{#start.question#}}',
        })
        .addLLM({
          id: 'business-llm',
          title: '业务回答',
          provider: 'openai',
          model: 'gpt-4o',
          systemPrompt: '你是业务专家',
          userPrompt: '{{#start.question#}}',
        })
        .addAggregator({
          id: 'agg',
          title: '聚合',
          variables: [['tech-llm', 'text'], ['business-llm', 'text']],
          outputType: 'string',
        })
        .addEnd({
          id: 'end',
          outputs: [{ name: 'answer', source: ['agg', 'output'] }],
        })
        .connect('start', 'classifier')
        .connect('classifier', 'tech-llm', { sourceHandle: 'tech' })
        .connect('classifier', 'business-llm', { sourceHandle: 'business' })
        .connect('tech-llm', 'agg')
        .connect('business-llm', 'agg')
        .connect('agg', 'end')
        .build();

      const classifierNode = dsl.workflow?.graph.nodes.find((n) => n.data.type === 'question-classifier');
      expect(classifierNode).toBeDefined();
      expect(classifierNode?.data.classes).toHaveLength(2);
    });
  });
});
