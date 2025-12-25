import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { workflowRoutes } from '../../routes/workflow.routes.js';

/**
 * 构建测试用的 Fastify 应用
 * 不启动实际服务器，仅用于注入测试
 */
export async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // 测试时禁用日志
  });

  // CORS
  await app.register(cors, {
    origin: true, // 测试时允许所有源
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
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
