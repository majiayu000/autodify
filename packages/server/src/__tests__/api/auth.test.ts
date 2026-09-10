import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, closeTestApp, withAuthHeaders, TEST_API_KEY } from '../helpers/build-app.js';
import { mockWorkflowService, mockDSL } from '../helpers/mock-llm.js';

vi.mock('../../services/workflow.service.js', () => ({
  getWorkflowService: () => mockWorkflowService(),
  WorkflowService: vi.fn(),
}));

describe('API Key Authentication', () => {
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

  describe('protected LLM routes', () => {
    const protectedCases = [
      {
        name: 'POST /api/generate',
        method: 'POST' as const,
        url: '/api/generate',
        payload: { prompt: '创建一个问答工作流' },
      },
      {
        name: 'POST /api/generate/stream',
        method: 'POST' as const,
        url: '/api/generate/stream',
        payload: { prompt: '创建一个问答工作流' },
      },
      {
        name: 'POST /api/refine',
        method: 'POST' as const,
        url: '/api/refine',
        payload: { dsl: mockDSL, instruction: '添加节点' },
      },
    ];

    for (const testCase of protectedCases) {
      it(`${testCase.name} 无 X-API-Key 应返回 401`, async () => {
        const response = await app.inject({
          method: testCase.method,
          url: testCase.url,
          payload: testCase.payload,
        });

        expect(response.statusCode).toBe(401);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(false);
        expect(body.statusCode).toBe(401);
        expect(body.code).toBe('UNAUTHORIZED');
      });

      it(`${testCase.name} 错误 X-API-Key 应返回 401`, async () => {
        const response = await app.inject({
          method: testCase.method,
          url: testCase.url,
          payload: testCase.payload,
          headers: withAuthHeaders({ 'x-api-key': 'wrong-key' }),
        });

        expect(response.statusCode).toBe(401);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(false);
        expect(body.code).toBe('UNAUTHORIZED');
      });

      it(`${testCase.name} 有效 X-API-Key 应通过认证`, async () => {
        const response = await app.inject({
          method: testCase.method,
          url: testCase.url,
          payload: testCase.payload,
          headers: withAuthHeaders(),
        });

        expect(response.statusCode).not.toBe(401);
        expect(response.statusCode).toBeLessThan(500);
      });
    }

    it('有效密钥应与 setup 中的 API_KEY 一致', () => {
      expect(process.env.API_KEY).toBe(TEST_API_KEY);
    });
  });

  describe('public routes', () => {
    it('GET /api/health 无需认证应返回 200', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
    });

    it('GET /api/templates 无需认证应可访问', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/templates',
      });

      expect(response.statusCode).not.toBe(401);
    });
  });
});
