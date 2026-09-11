import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, closeTestApp, withAuthHeaders } from '../helpers/build-app.js';
import { mockWorkflowService } from '../helpers/mock-llm.js';
import { config } from '../../config/index.js';
import { resolveCorsAllowOrigin } from '../../utils/cors.js';

// Mock 工作流服务模块
vi.mock('../../services/workflow.service.js', () => ({
  getWorkflowService: () => mockWorkflowService(),
  WorkflowService: vi.fn(),
}));

describe('Generate Workflow API', () => {
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

  describe('POST /api/generate', () => {
    it('应该成功生成工作流', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/generate',
        payload: {
          prompt: '创建一个问答工作流',
        },
        headers: withAuthHeaders(),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('dsl');
      expect(body).toHaveProperty('yaml');
      expect(body).toHaveProperty('metadata');
    });

    it('应该返回正确的 DSL 结构', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/generate',
        payload: {
          prompt: '创建一个问答工作流',
        },
        headers: withAuthHeaders(),
      });

      const body = JSON.parse(response.body);
      expect(body.dsl).toHaveProperty('version');
      expect(body.dsl).toHaveProperty('kind', 'app');
      expect(body.dsl).toHaveProperty('app');
      expect(body.dsl).toHaveProperty('workflow');
    });

    it('应该返回元数据信息', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/generate',
        payload: {
          prompt: '创建一个问答工作流',
        },
        headers: withAuthHeaders(),
      });

      const body = JSON.parse(response.body);
      expect(body.metadata).toHaveProperty('duration');
      expect(body.metadata).toHaveProperty('model');
      expect(body.metadata.duration).toBeTypeOf('number');
      expect(body.metadata.model).toBeTypeOf('string');
    });

    it('应该接受可选的生成选项', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/generate',
        payload: {
          prompt: '创建一个问答工作流',
          options: {
            model: 'gpt-4o-mini',
            temperature: 0.5,
            useTemplate: true,
          },
        },
        headers: withAuthHeaders(),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    describe('错误处理', () => {
      it('应该拒绝空的 prompt', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/generate',
          payload: {
            prompt: '',
          },
          headers: withAuthHeaders(),
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        // 检查是否有错误信息（可能在 success:false 或 error 字段中）
        expect(body.success === false || body.error).toBeTruthy();
      });

      it('应该拒绝缺少 prompt 的请求', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/generate',
          payload: {},
          headers: withAuthHeaders(),
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.success === false || body.error).toBeTruthy();
      });

      it('应该拒绝无效的温度值', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/generate',
          payload: {
            prompt: '创建一个问答工作流',
            options: {
              temperature: 3.0, // 超出范围
            },
          },
          headers: withAuthHeaders(),
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.success === false || body.error).toBeTruthy();
      });

      it('应该拒绝无效的请求体格式', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/generate',
          payload: 'invalid-json',
          headers: withAuthHeaders({
            'content-type': 'text/plain',
          }),
        });

        expect(response.statusCode).toBe(400);
      });
    });

    describe('边界情况', () => {
      it('应该处理非常长的 prompt', async () => {
        const longPrompt = 'A'.repeat(10000);
        const response = await app.inject({
          method: 'POST',
          url: '/api/generate',
          payload: {
            prompt: longPrompt,
          },
          headers: withAuthHeaders(),
        });

        expect(response.statusCode).toBe(200);
      });

      it('应该处理包含特殊字符的 prompt', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/generate',
          payload: {
            prompt: '创建一个工作流：包含"引号"、<标签>和{大括号}',
          },
          headers: withAuthHeaders(),
        });

        expect(response.statusCode).toBe(200);
      });

      it('应该处理多语言 prompt', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/generate',
          payload: {
            prompt: 'Create a workflow with English, 中文, and 日本語',
          },
          headers: withAuthHeaders(),
        });

        expect(response.statusCode).toBe(200);
      });
    });

    describe('CORS', () => {
      it('应该包含正确的 CORS 头', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/generate',
          payload: {
            prompt: '创建一个问答工作流',
          },
          headers: withAuthHeaders({
            origin: 'http://localhost:5173',
          }),
        });

        expect(response.headers).toHaveProperty('access-control-allow-origin');
      });

      it('应该处理 OPTIONS 预检请求', async () => {
        const response = await app.inject({
          method: 'OPTIONS',
          url: '/api/generate',
          headers: {
            origin: 'http://localhost:5173',
            'access-control-request-method': 'POST',
          },
        });

        expect(response.statusCode).toBe(204);
        expect(response.headers).toHaveProperty('access-control-allow-methods');
      });
    });
  });

  describe('POST /api/generate/stream CORS (SEC-07)', () => {
    const allowedOrigin = 'http://localhost:5173';
    const disallowedOrigin = 'https://evil.example';
    let previousCorsOrigin: typeof config.cors.origin;

    beforeAll(() => {
      previousCorsOrigin = config.cors.origin;
      // Align SSE allowlist with global CORS credentials semantics for this suite
      config.cors.origin = [allowedOrigin, 'http://localhost:3000'];
    });

    afterAll(() => {
      config.cors.origin = previousCorsOrigin;
    });

    it('disallowed Origin must never receive Access-Control-Allow-Origin: *', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/generate/stream',
        payload: {
          prompt: '创建一个问答工作流',
        },
        headers: withAuthHeaders({
          origin: disallowedOrigin,
        }),
      });

      expect(response.statusCode).toBe(200);
      const acao = response.headers['access-control-allow-origin'];
      expect(acao).not.toBe('*');
      expect(acao).toBeUndefined();
    });

    it('allowed Origin is reflected exactly (not *)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/generate/stream',
        payload: {
          prompt: '创建一个问答工作流',
        },
        headers: withAuthHeaders({
          origin: allowedOrigin,
        }),
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(allowedOrigin);
      expect(response.headers['access-control-allow-origin']).not.toBe('*');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });
});

describe('resolveCorsAllowOrigin', () => {
  it('never returns * for any allowlist shape', () => {
    expect(resolveCorsAllowOrigin('https://evil.example', false)).toBeUndefined();
    expect(resolveCorsAllowOrigin('https://evil.example', 'http://localhost:5173')).toBeUndefined();
    expect(
      resolveCorsAllowOrigin('https://evil.example', ['http://localhost:5173'])
    ).toBeUndefined();
    expect(resolveCorsAllowOrigin('http://localhost:5173', true)).toBe('http://localhost:5173');
    expect(resolveCorsAllowOrigin('http://localhost:5173', 'http://localhost:5173')).toBe(
      'http://localhost:5173'
    );
  });
});
