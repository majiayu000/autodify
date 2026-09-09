import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { workflowRoutes } from '../../routes/workflow.routes.js';
import { registerErrorHandler } from '../../middleware/error-handler.js';
import type { CorsOriginConfig } from '../../utils/cors.js';

/** Test API key — must match process.env.API_KEY from setup.ts */
export const TEST_API_KEY = 'test-server-api-key';

/**
 * Headers including a valid X-API-Key for authenticated LLM routes.
 */
export function withAuthHeaders(headers: Record<string, string> = {}): Record<string, string> {
  return {
    'x-api-key': process.env.API_KEY || TEST_API_KEY,
    ...headers,
  };
}

export interface BuildTestAppOptions {
  /**
   * CORS origin allowlist for @fastify/cors.
   * Defaults to `true` (reflect any origin) for most API tests.
   * Pass a string/array/`false` to exercise allowlist behaviour.
   */
  corsOrigin?: CorsOriginConfig;
}

/**
 * 构建测试用的 Fastify 应用
 * 不启动实际服务器，仅用于注入测试
 */
export async function buildTestApp(options: BuildTestAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // 测试时禁用日志
    ajv: {
      customOptions: {
        keywords: ['example'],
      },
    },
  });

  registerErrorHandler(app, { isDevelopment: false });

  // CORS — 与生产一致：白名单 + credentials（可在单测中收紧）
  await app.register(cors, {
    origin: options.corsOrigin ?? true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  });

  // 速率限制（测试时使用宽松的限制）
  await app.register(rateLimit, {
    max: 1000,
    timeWindow: '1 minute',
  });

  // API 路由
  await app.register(workflowRoutes, { prefix: '/api' });

  // Root endpoint
  app.get('/', async () => ({
    name: 'Autodify API',
    version: '0.1.0',
    status: 'running',
  }));

  return app;
}

/**
 * 清理测试应用
 */
export async function closeTestApp(app: FastifyInstance): Promise<void> {
  await app.close();
}
