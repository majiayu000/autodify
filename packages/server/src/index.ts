import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/index.js';
import { workflowRoutes } from './routes/workflow.routes.js';

async function main() {
  const fastify = Fastify({
    logger: {
      level: config.logging.level,
      transport:
        config.nodeEnv === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

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
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    Autodify API Server                    ║
╠═══════════════════════════════════════════════════════════╣
║  Server:    http://${config.host}:${config.port}                        ║
║  API Base:  http://${config.host}:${config.port}/api                    ║
║  LLM:       ${config.llm.provider.padEnd(10)} @ ${config.llm.baseUrl.slice(0, 30)}...
║  Model:     ${config.llm.defaultModel.padEnd(40)}║
╚═══════════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
