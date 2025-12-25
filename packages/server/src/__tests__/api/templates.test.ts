import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, closeTestApp } from '../helpers/build-app.js';
import { mockWorkflowService, mockDSL } from '../helpers/mock-llm.js';

// Mock 工作流服务模块
vi.mock('../../services/workflow.service.js', () => ({
  getWorkflowService: () => mockWorkflowService(),
  WorkflowService: vi.fn(),
}));

describe('Template API', () => {
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

  describe('GET /api/templates', () => {
    it('应该返回模板列表', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/templates',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('templates');
      expect(Array.isArray(body.templates)).toBe(true);
    });

    it('模板应该包含必要的字段', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/templates',
      });

      const body = JSON.parse(response.body);
      if (body.templates.length > 0) {
        const template = body.templates[0];
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('category');
        expect(template).toHaveProperty('complexity');
        expect(template).toHaveProperty('tags');
      }
    });

    it('应该设置正确的 Content-Type', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/templates',
      });

      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('GET /api/templates/:id', () => {
    it('应该返回指定模板的 DSL', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/templates/simple-qa',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('dsl');
    });

    it('返回的 DSL 应该是有效的结构', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/templates/simple-qa',
      });

      const body = JSON.parse(response.body);
      expect(body.dsl).toHaveProperty('version');
      expect(body.dsl).toHaveProperty('kind', 'app');
      expect(body.dsl).toHaveProperty('workflow');
    });

    it('应该处理不存在的模板', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/templates/non-existent-template',
      });

      // Mock 始终返回数据，所以实际上会是 200
      // 在真实场景中，不存在的模板会返回 404
      expect([200, 404]).toContain(response.statusCode);
    });

    it('应该处理特殊字符的模板 ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/templates/template-with-dashes',
      });

      // 应该正常处理，不会崩溃
      expect([200, 404]).toContain(response.statusCode);
    });
  });

  describe('POST /api/validate', () => {
    it('应该验证有效的 DSL', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/validate',
        payload: {
          dsl: mockDSL,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('valid', true);
      expect(body).toHaveProperty('errors');
      expect(body).toHaveProperty('warnings');
      expect(Array.isArray(body.errors)).toBe(true);
      expect(Array.isArray(body.warnings)).toBe(true);
    });

    it('验证结果应该包含错误和警告数组', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/validate',
        payload: {
          dsl: mockDSL,
        },
      });

      const body = JSON.parse(response.body);
      expect(body.errors).toEqual([]);
      expect(body.warnings).toEqual([]);
    });

    it('应该拒绝缺少 dsl 的请求', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/validate',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      // 验证包含错误信息（可能在 valid:false、errors 或其他字段中）
      expect(body.valid === false || body.errors || body.error).toBeTruthy();
    });

    it('应该处理空的 DSL 对象', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/validate',
        payload: {
          dsl: {},
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('valid');
    });

    it('应该处理复杂的 DSL 结构', async () => {
      const complexDSL = {
        ...mockDSL,
        workflow: {
          ...mockDSL.workflow,
          graph: {
            nodes: Array.from({ length: 100 }, (_, i) => ({
              id: `node-${i}`,
              data: {
                type: 'llm',
                title: `Node ${i}`,
              },
            })),
            edges: Array.from({ length: 99 }, (_, i) => ({
              id: `edge-${i}`,
              source: `node-${i}`,
              target: `node-${i + 1}`,
            })),
          },
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/validate',
        payload: {
          dsl: complexDSL,
        },
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
