/**
 * Workflow Planner Tests
 */

import { describe, it, expect } from 'vitest';
import { WorkflowPlanner, createPlanner } from './index.js';
import { analyzeIntent } from './intent-analyzer.js';

describe('Intent Analyzer', () => {
  describe('Feature Detection', () => {
    it('should detect LLM feature for QA queries', () => {
      const intent = analyzeIntent('创建一个问答对话工作流');

      expect(intent.features.some((f) => f.type === 'llm')).toBe(true);
    });

    it('should detect RAG feature for knowledge base queries', () => {
      const intent = analyzeIntent('创建一个知识库检索问答工作流');

      expect(intent.features.some((f) => f.type === 'rag')).toBe(true);
    });

    it('should detect classification feature', () => {
      const intent = analyzeIntent('创建一个问题分类路由工作流');

      expect(intent.features.some((f) => f.type === 'classification')).toBe(true);
    });

    it('should detect conditional feature', () => {
      const intent = analyzeIntent('如果用户选择详细模式则详细回答，否则简洁回答');

      expect(intent.features.some((f) => f.type === 'conditional')).toBe(true);
    });

    it('should detect code feature', () => {
      const intent = analyzeIntent('用 Python 代码处理用户输入的数据');

      expect(intent.features.some((f) => f.type === 'code')).toBe(true);
    });

    it('should detect API feature', () => {
      const intent = analyzeIntent('调用外部 API 获取天气数据');

      expect(intent.features.some((f) => f.type === 'api')).toBe(true);
    });
  });

  describe('Complexity Estimation', () => {
    it('should estimate low complexity for simple queries', () => {
      const intent = analyzeIntent('简单的问答工作流');

      expect(intent.complexity).toBeLessThanOrEqual(2);
    });

    it('should estimate higher complexity for multi-feature queries', () => {
      const intent = analyzeIntent('知识库检索 + 条件分支 + 多个 LLM 处理');

      expect(intent.complexity).toBeGreaterThanOrEqual(3);
    });

    it('should estimate high complexity for agent queries', () => {
      const intent = analyzeIntent('创建一个智能体 agent 自主规划并执行任务');

      expect(intent.complexity).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Action Extraction', () => {
    it('should extract QA action', () => {
      const intent = analyzeIntent('创建一个问答机器人');

      expect(intent.action).toBe('问答');
    });

    it('should extract translation action', () => {
      const intent = analyzeIntent('创建一个翻译工作流');

      expect(intent.action).toBe('翻译');
    });

    it('should extract summarization action', () => {
      const intent = analyzeIntent('创建一个文本摘要总结工作流');

      expect(intent.action).toBe('摘要');
    });
  });

  describe('Domain Extraction', () => {
    it('should extract knowledge base domain', () => {
      const intent = analyzeIntent('知识库问答');

      expect(intent.domain).toBe('知识库');
    });

    it('should extract customer service domain', () => {
      const intent = analyzeIntent('客服机器人');

      expect(intent.domain).toBe('客服');
    });
  });

  describe('Requirements Extraction', () => {
    it('should extract explicit requirements', () => {
      const intent = analyzeIntent('需要支持中英文翻译，需要保持原文格式');

      expect(intent.requirements.length).toBeGreaterThan(0);
    });
  });
});

describe('WorkflowPlanner', () => {
  describe('Planning', () => {
    it('should plan a simple QA workflow', async () => {
      const planner = createPlanner();
      const result = await planner.plan('创建一个简单的问答工作流');

      expect(result.success).toBe(true);
      expect(result.plan).toBeDefined();
      expect(result.plan?.nodes.some((n) => n.type === 'start')).toBe(true);
      expect(result.plan?.nodes.some((n) => n.type === 'llm')).toBe(true);
      expect(result.plan?.nodes.some((n) => n.type === 'end')).toBe(true);
    });

    it('should plan a RAG workflow', async () => {
      const planner = createPlanner();
      const result = await planner.plan('创建一个知识库检索问答工作流');

      expect(result.success).toBe(true);
      expect(result.plan).toBeDefined();
      expect(result.plan?.nodes.some((n) => n.type === 'knowledge-retrieval')).toBe(true);
    });

    it('should plan with input variables', async () => {
      const planner = createPlanner();
      const result = await planner.plan('创建一个问答工作流');

      expect(result.success).toBe(true);
      expect(result.plan?.inputVariables.length).toBeGreaterThan(0);
    });

    it('should plan with outputs', async () => {
      const planner = createPlanner();
      const result = await planner.plan('创建一个问答工作流');

      expect(result.success).toBe(true);
      expect(result.plan?.outputs.length).toBeGreaterThan(0);
    });

    it('should include timing information', async () => {
      const planner = createPlanner();
      const result = await planner.plan('简单问答');

      expect(result.duration).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should use templates when available', async () => {
      const planner = createPlanner();
      const result = await planner.plan('简单的问答对话工作流');

      expect(result.success).toBe(true);
      expect(result.plan?.confidence).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty input gracefully', async () => {
      const planner = createPlanner();
      const result = await planner.plan('');

      // Should still succeed with default workflow
      expect(result.success).toBe(true);
    });
  });
});
