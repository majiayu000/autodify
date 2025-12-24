import Fastify from 'fastify';
import cors from '@fastify/cors';
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

  // CORS
  await fastify.register(cors, {
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
