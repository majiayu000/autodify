import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, closeTestApp } from '../helpers/build-app.js';
import { mockWorkflowService, mockDSL } from '../helpers/mock-llm.js';

// Mock 工作流服务模块
vi.mock('../../services/workflow.service.js', () => ({
  getWorkflowService: () => mockWorkflowService(),
  WorkflowService: vi.fn(),
}));

describe('Refine Workflow API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/refine', () => {
    it('应该成功优化工作流', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/refine',
        payload: {
          dsl: mockDSL,
          instruction: '添加一个知识库检索节点',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('dsl');
      expect(body).toHaveProperty('yaml');
    });

    it('应该返回变更信息', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/refine',
        payload: {
          dsl: mockDSL,
          instruction: '修改 prompt 模板',
        },
      });

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('changes');
      expect(Array.isArray(body.changes)).toBe(true);
      if (body.changes && body.changes.length > 0) {
        expect(body.changes[0]).toHaveProperty('type');
        expect(body.changes[0]).toHaveProperty('reason');
      }
    });

    it('应该返回更新后的 DSL', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/refine',
        payload: {
          dsl: mockDSL,
          instruction: '添加一个 HTTP 请求节点',
        },
      });

      const body = JSON.parse(response.body);
      expect(body.dsl).toHaveProperty('version');
      expect(body.dsl).toHaveProperty('kind', 'app');
      expect(body.dsl).toHaveProperty('workflow');
    });

    describe('错误处理', () => {
      it('应该拒绝空的 instruction', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/refine',
          payload: {
            dsl: mockDSL,
            instruction: '',
          },
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.success === false || body.error).toBeTruthy();
      });

      it('应该拒绝缺少 instruction 的请求', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/refine',
          payload: {
            dsl: mockDSL,
          },
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.success === false || body.error).toBeTruthy();
      });

      it('应该拒绝缺少 dsl 的请求', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/refine',
          payload: {
            instruction: '添加节点',
          },
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.success === false || body.error).toBeTruthy();
      });

      it('应该拒绝无效的 DSL 格式', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/refine',
          payload: {
            dsl: 'invalid-dsl',
            instruction: '添加节点',
          },
        });

        expect(response.statusCode).toBe(400);
      });
    });

    describe('边界情况', () => {
      it('应该处理复杂的 DSL 结构', async () => {
        const complexDSL = {
          ...mockDSL,
          workflow: {
            ...mockDSL.workflow,
            graph: {
              nodes: Array.from({ length: 50 }, (_, i) => ({
                id: `node-${i}`,
                data: {
                  type: 'llm',
                  title: `Node ${i}`,
                },
              })),
              edges: Array.from({ length: 49 }, (_, i) => ({
                id: `edge-${i}`,
                source: `node-${i}`,
                target: `node-${i + 1}`,
              })),
            },
          },
        };

        const response = await app.inject({
          method: 'POST',
          url: '/api/refine',
          payload: {
            dsl: complexDSL,
            instruction: '优化工作流',
          },
        });

        expect(response.statusCode).toBe(200);
      });

      it('应该处理包含特殊字符的 instruction', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/refine',
          payload: {
            dsl: mockDSL,
            instruction: '添加节点：使用"引号"和<标签>',
          },
        });

        expect(response.statusCode).toBe(200);
      });

      it('应该处理非常长的 instruction', async () => {
        const longInstruction =
          '请详细说明如何优化这个工作流，' + 'A'.repeat(1000);
        const response = await app.inject({
          method: 'POST',
          url: '/api/refine',
          payload: {
            dsl: mockDSL,
            instruction: longInstruction,
          },
        });

        expect(response.statusCode).toBe(200);
      });

      it('应该处理多语言 instruction', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/refine',
          payload: {
            dsl: mockDSL,
            instruction: 'Add a node with English, 中文, and 日本語',
          },
        });

        expect(response.statusCode).toBe(200);
      });
    });

    describe('Content-Type', () => {
      it('应该接受 application/json', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/refine',
          payload: {
            dsl: mockDSL,
            instruction: '添加节点',
          },
          headers: {
            'content-type': 'application/json',
          },
        });

        expect(response.statusCode).toBe(200);
      });

      it('应该返回 application/json', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/refine',
          payload: {
            dsl: mockDSL,
            instruction: '添加节点',
          },
        });

        expect(response.headers['content-type']).toContain('application/json');
      });
    });
  });
});
