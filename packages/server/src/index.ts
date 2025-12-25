import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/index.js';
import { workflowRoutes } from './routes/workflow.routes.js';
import { registerErrorHandler } from './middleware/error-handler.js';
import { initializeLogging, requestLoggingPlugin, getLogger } from './lib/logging/index.js';
import { registerSwagger } from './plugins/index.js';

async function main() {
  // 初始化结构化日志系统
  initializeLogging({
    service: 'autodify-server',
    level: config.logging.level,
    environment: config.nodeEnv,
    pretty: config.nodeEnv === 'development',
  });

  const fastify = Fastify({
    logger: {
      level: config.logging.level,
      transport: config.nodeEnv === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'request_id',
    disableRequestLogging: true, // 使用我们的自定义请求日志中间件
    ajv: {
      customOptions: {
        strict: 'log', // 允许未知关键字但记录警告
        keywords: ['example'], // 允许 OpenAPI 的 example 关键字
      },
    },
  });

  // 注册请求日志中间件
  await fastify.register(requestLoggingPlugin, {
    excludePaths: ['/health'],
    slowRequestThreshold: 1000, // 1 秒
  });

  // 注册全局错误处理器
  registerErrorHandler(fastify, { isDevelopment: config.nodeEnv === 'development' });

  // CORS - 白名单模式
  await fastify.register(cors, {
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true, // 允许携带凭证（cookies、授权头等）
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 全局速率限制
  await fastify.register(rateLimit, {
    max: config.rateLimit.global.max,
    timeWindow: config.rateLimit.global.timeWindow,
    errorResponseBuilder: () => ({
      success: false,
      error: '请求过于频繁，请稍后再试',
      statusCode: 429,
      retryAfter: '请在稍后重试',
    }),
  });

  // Swagger 文档
  await registerSwagger(fastify);

  // API routes
  await fastify.register(workflowRoutes, { prefix: '/api' });

  // Root endpoint
  fastify.get('/', async () => ({
    name: 'Autodify API',
    version: '0.1.0',
    status: 'running',
  }));

  // Start server
  try {
    await fastify.listen({ port: config.port, host: config.host });

    fastify.log.info(
      {
        server: `http://${config.host}:${config.port}`,
        api_base: `http://${config.host}:${config.port}/api`,
        docs: `http://${config.host}:${config.port}/docs`,
        llm_provider: config.llm.provider,
        llm_base_url: config.llm.baseUrl,
        llm_model: config.llm.defaultModel,
        port: config.port,
        host: config.host,
      },
      'Autodify API Server started successfully'
    );

    // 在开发环境下额外打印一个美化的启动信息
    if (config.nodeEnv === 'development') {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    Autodify API Server                    ║
╠═══════════════════════════════════════════════════════════╣
║  Server:    http://${config.host}:${config.port}                        ║
║  API Base:  http://${config.host}:${config.port}/api                    ║
║  API Docs:  http://${config.host}:${config.port}/docs                   ║
║  LLM:       ${config.llm.provider.padEnd(10)} @ ${config.llm.baseUrl.slice(0, 30)}...
║  Model:     ${config.llm.defaultModel.padEnd(40)}║
╚═══════════════════════════════════════════════════════════╝
      `);
    }
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

main();
