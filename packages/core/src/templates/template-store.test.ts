/**
 * TemplateStore Tests
 */

import { describe, it, expect } from 'vitest';
import { TemplateStore, createTemplateStore, defaultTemplateStore } from './template-store.js';
import { simpleQATemplate, ragQATemplate, conditionalTemplate } from './builtin/index.js';

describe('TemplateStore', () => {
  describe('Registration', () => {
    it('should register built-in templates by default', () => {
      const store = new TemplateStore();
      const all = store.getAll();

      expect(all.length).toBeGreaterThan(0);
      expect(store.get('simple-qa')).toBeDefined();
      expect(store.get('rag-qa')).toBeDefined();
    });

    it('should allow disabling built-in templates', () => {
      const store = new TemplateStore({ includeBuiltin: false });
      expect(store.getAll()).toHaveLength(0);
    });

    it('should allow adding custom templates', () => {
      const store = new TemplateStore({ includeBuiltin: false });

      store.register({
        metadata: {
          id: 'custom',
          name: '自定义模板',
          description: '测试',
          category: 'automation',
          tags: ['测试'],
          keywords: ['custom', 'test'],
          nodeTypes: ['start', 'end'],
          complexity: 1,
        },
        build: () => simpleQATemplate.build(),
      });

      expect(store.get('custom')).toBeDefined();
    });

    it('should unregister templates', () => {
      const store = new TemplateStore();
      expect(store.get('simple-qa')).toBeDefined();

      const removed = store.unregister('simple-qa');
      expect(removed).toBe(true);
      expect(store.get('simple-qa')).toBeUndefined();
    });
  });

  describe('Query', () => {
    it('should get templates by category', () => {
      const store = defaultTemplateStore;
      const analysis = store.getByCategory('analysis');

      expect(analysis.length).toBeGreaterThan(0);
      expect(analysis.every((t) => t.metadata.category === 'analysis')).toBe(true);
    });

    it('should get templates by tag', () => {
      const store = defaultTemplateStore;
      const llmTemplates = store.getByTag('LLM');

      expect(llmTemplates.length).toBeGreaterThan(0);
    });
  });

  describe('Matching', () => {
    it('should match templates by keywords', () => {
      const store = defaultTemplateStore;

      const matches = store.match('创建一个简单的问答工作流');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]?.template.metadata.id).toBe('simple-qa');
    });

    it('should match RAG templates for knowledge base queries', () => {
      const store = defaultTemplateStore;

      const matches = store.match('创建一个知识库问答，从文档中检索答案');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]?.template.metadata.id).toBe('rag-qa');
    });

    it('should match conditional templates for branching queries', () => {
      const store = defaultTemplateStore;

      const matches = store.match('根据条件判断执行不同的分支处理');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]?.template.metadata.id).toBe('conditional');
    });

    it('should match translation templates', () => {
      const store = defaultTemplateStore;

      const matches = store.match('翻译一段文字到英语');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]?.template.metadata.id).toBe('translation');
    });

    it('should match summarizer templates', () => {
      const store = defaultTemplateStore;

      const matches = store.match('对长文本进行摘要总结');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]?.template.metadata.id).toBe('summarizer');
    });

    it('should return matched keywords', () => {
      const store = defaultTemplateStore;

      const matches = store.match('帮我做一个问答对话机器人');
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]?.matchedKeywords.length).toBeGreaterThan(0);
    });

    it('should find best match', () => {
      const store = defaultTemplateStore;

      const best = store.findBest('调用外部 API 获取数据');
      expect(best).not.toBeNull();
      expect(best?.template.metadata.id).toBe('api-caller');
    });

    it('should respect limit parameter', () => {
      const store = defaultTemplateStore;

      const matches = store.match('工作流', 2);
      expect(matches.length).toBeLessThanOrEqual(2);
    });
  });

  describe('createTemplateStore', () => {
    it('should create a new store with config', () => {
      const store = createTemplateStore({ includeBuiltin: true });
      expect(store.getAll().length).toBeGreaterThan(0);
    });
  });
});
