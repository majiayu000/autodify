import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createHash } from 'crypto';
import { getWorkflowService } from '../services/workflow.service.js';
import { config } from '../config/index.js';
import { NotFoundError } from '../errors/custom-errors.js';
import { createValidationHook } from '../plugins/index.js';
import { zodToOpenApiSchema, withExample } from '../utils/zod-to-schema.js';
import {
  GenerateRequestBodySchema,
  RefineRequestBodySchema,
  ValidateRequestBodySchema,
  TemplateParamsSchema,
  GenerateResponseSchema,
  RefineResponseSchema,
  ValidateResponseSchema,
  TemplatesResponseSchema,
  TemplateDetailResponseSchema,
  HealthResponseSchema,
  type GenerateRequestBody,
  type RefineRequestBody,
  type ValidateRequestBody,
  type TemplateParams,
  type GenerateResponse,
  type RefineResponse,
  type ValidateResponse,
  type TemplatesResponse,
  type TemplateDetailResponse,
  type HealthResponse,
} from '../schemas/index.js';

/**
 * Response cache for templates list
 */
interface CacheEntry {
  data: TemplatesResponse;
  etag: string;
  timestamp: number;
}

let templatesCache: CacheEntry | null = null;

/**
 * Generate ETag for response data
 */
function generateETag(data: any): string {
  const hash = createHash('md5');
  hash.update(JSON.stringify(data));
  return `"${hash.digest('hex')}"`;
}

/**
 * Check if cache is still valid based on TTL
 */
function isCacheValid(timestamp: number, ttl: number): boolean {
  return Date.now() - timestamp < ttl;
}

export async function workflowRoutes(fastify: FastifyInstance) {
  const workflowService = getWorkflowService();

  /**
   * POST /api/generate - 生成工作流
   */
  fastify.post<{
    Body: GenerateRequestBody;
    Reply: GenerateResponse;
  }>(
    '/generate',
    {
      schema: {
        description: '根据自然语言描述生成 Dify 工作流',
        tags: ['workflow'],
        summary: '生成工作流',
        body: withExample(GenerateRequestBodySchema, {
          prompt: '创建一个客服聊天机器人，能够回答常见问题',
          options: {
            model: 'gpt-4',
            temperature: 0.7,
            useTemplate: false,
          },
        }),
        response: {
          200: {
            description: '成功生成工作流',
            ...withExample(GenerateResponseSchema, {
              success: true,
              dsl: {
                version: '0.1',
                kind: 'workflow',
                nodes: [],
                edges: [],
              },
              yaml: 'version: 0.1\nkind: workflow\nnodes: []\nedges: []',
              metadata: {
                duration: 1234,
                model: 'gpt-4',
                tokens: {
                  input: 100,
                  output: 500,
                },
              },
            }),
          },
          400: {
            description: '请求参数错误',
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              error: { type: 'string', example: '请输入工作流描述' },
            },
          },
          429: {
            description: '请求频率超限',
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              error: { type: 'string', example: '请求过于频繁，请稍后再试' },
            },
          },
        },
      },
      config: {
        rateLimit: {
          max: config.rateLimit.generate.max,
          timeWindow: config.rateLimit.generate.timeWindow,
        },
      },
      preHandler: createValidationHook({
        body: GenerateRequestBodySchema,
      }),
    },
    async (request: FastifyRequest<{ Body: GenerateRequestBody }>, reply: FastifyReply) => {
      const result = await workflowService.generate(request.body);
      return reply.send(result);
    }
  );

  /**
   * POST /api/generate/stream - 生成工作流（流式响应）
   */
  fastify.post<{
    Body: GenerateRequestBody;
  }>(
    '/generate/stream',
    {
      schema: {
        description: '根据自然语言描述生成 Dify 工作流（流式响应，使用 Server-Sent Events）',
        tags: ['workflow'],
        summary: '生成工作流（流式）',
        body: withExample(GenerateRequestBodySchema, {
          prompt: '创建一个客服聊天机器人，能够回答常见问题',
          options: {
            model: 'gpt-4',
            temperature: 0.7,
            useTemplate: false,
          },
        }),
        response: {
          200: {
            description: '流式响应（Server-Sent Events）',
            type: 'string',
            example: 'data: {"type":"progress","progress":{"stage":"initializing","percentage":0,"message":"Starting..."},"done":false}\n\n',
          },
          400: {
            description: '请求参数错误',
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              error: { type: 'string', example: '请输入工作流描述' },
            },
          },
        },
      },
      config: {
        rateLimit: {
          max: config.rateLimit.generate.max,
          timeWindow: config.rateLimit.generate.timeWindow,
        },
      },
      preHandler: createValidationHook({
        body: GenerateRequestBodySchema,
      }),
    },
    async (request: FastifyRequest<{ Body: GenerateRequestBody }>, reply: FastifyReply) => {
      // Set up Server-Sent Events headers
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      // Create AbortController for cancellation support
      const abortController = new AbortController();

      // Handle client disconnect
      request.raw.on('close', () => {
        abortController.abort();
      });

      try {
        // Stream the generation
        const stream = workflowService.generateStream(request.body, abortController.signal);

        for await (const chunk of stream) {
          // Check if connection is still alive
          if (reply.raw.destroyed || abortController.signal.aborted) {
            break;
          }

          // Send SSE message
          reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);

          // If done or error, finish
          if (chunk.done) {
            break;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        reply.raw.write(`data: ${JSON.stringify({
          type: 'error',
          error: errorMessage,
          done: true,
        })}\n\n`);
      } finally {
        reply.raw.end();
      }
    }
  );

  /**
   * POST /api/refine - 迭代优化工作流
   */
  fastify.post<{
    Body: RefineRequestBody;
    Reply: RefineResponse;
  }>(
    '/refine',
    {
      schema: {
        description: '根据指令迭代优化现有的工作流',
        tags: ['workflow'],
        summary: '优化工作流',
        body: withExample(RefineRequestBodySchema, {
          dsl: {
            version: '0.1',
            kind: 'workflow',
            nodes: [],
            edges: [],
          },
          instruction: '添加一个知识库检索节点',
        }),
        response: {
          200: {
            description: '成功优化工作流',
            ...withExample(RefineResponseSchema, {
              success: true,
              dsl: {
                version: '0.1',
                kind: 'workflow',
                nodes: [],
                edges: [],
              },
              yaml: 'version: 0.1\nkind: workflow\nnodes: []\nedges: []',
              changes: [
                {
                  type: 'add',
                  node: 'knowledge-retrieval-1',
                  reason: '添加知识库检索节点以增强回答准确性',
                },
              ],
            }),
          },
          400: {
            description: '请求参数错误',
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              error: { type: 'string', example: 'DSL 必须是一个有效的对象' },
            },
          },
        },
      },
      config: {
        rateLimit: {
          max: config.rateLimit.refine.max,
          timeWindow: config.rateLimit.refine.timeWindow,
        },
      },
      preHandler: createValidationHook({
        body: RefineRequestBodySchema,
      }),
    },
    async (request: FastifyRequest<{ Body: RefineRequestBody }>, reply: FastifyReply) => {
      const result = await workflowService.refine({
        dsl: request.body.dsl as any,
        instruction: request.body.instruction,
      });
      return reply.send(result);
    }
  );

  /**
   * POST /api/validate - 验证 DSL
   */
  fastify.post<{
    Body: ValidateRequestBody;
    Reply: ValidateResponse;
  }>(
    '/validate',
    {
      schema: {
        description: '验证工作流 DSL 的正确性',
        tags: ['workflow'],
        summary: '验证 DSL',
        body: withExample(ValidateRequestBodySchema, {
          dsl: {
            version: '0.1',
            kind: 'workflow',
            nodes: [],
            edges: [],
          },
        }),
        response: {
          200: {
            description: '验证结果',
            ...withExample(ValidateResponseSchema, {
              valid: true,
              errors: [],
              warnings: [
                {
                  code: 'W001',
                  message: '工作流没有定义任何节点',
                },
              ],
            }),
          },
          400: {
            description: '请求参数错误',
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              error: { type: 'string', example: 'DSL 必须是一个有效的对象' },
            },
          },
        },
      },
      preHandler: createValidationHook({
        body: ValidateRequestBodySchema,
      }),
    },
    async (request: FastifyRequest<{ Body: ValidateRequestBody }>, reply: FastifyReply) => {
      const result = await workflowService.validate(request.body.dsl);
      return reply.send(result);
    }
  );

  /**
   * GET /api/templates - 获取模板列表 (with caching and ETag support)
   */
  fastify.get<{
    Reply: TemplatesResponse;
  }>(
    '/templates',
    {
      schema: {
        description: '获取所有可用的工作流模板列表',
        tags: ['template'],
        summary: '获取模板列表',
        response: {
          200: {
            description: '成功获取模板列表',
            ...withExample(TemplatesResponseSchema, {
              templates: [
                {
                  id: 'chatbot-basic',
                  name: '基础聊天机器人',
                  description: '一个简单的问答聊天机器人模板',
                  category: 'chatbot',
                  complexity: 'simple',
                  tags: ['chatbot', 'qa'],
                },
                {
                  id: 'content-generator',
                  name: '内容生成器',
                  description: '自动生成营销文案和社交媒体内容',
                  category: 'content',
                  complexity: 'medium',
                  tags: ['content', 'marketing'],
                },
              ],
            }),
          },
          304: {
            description: 'Not Modified - 使用缓存版本',
            type: 'null',
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Check if cache is enabled
      if (!config.cache.enabled) {
        const templates = workflowService.getTemplates();
        return reply.send({ templates });
      }

      // Check if cache is valid
      const cacheValid =
        templatesCache && isCacheValid(templatesCache.timestamp, config.cache.templates.ttl);

      // If cache is valid, check ETag
      if (cacheValid && templatesCache) {
        const clientETag = request.headers['if-none-match'];

        // If client ETag matches, return 304 Not Modified
        if (clientETag === templatesCache.etag) {
          return reply.code(304).send();
        }

        // Otherwise, return cached data with ETag
        reply.header('ETag', templatesCache.etag);
        reply.header('Cache-Control', `public, max-age=${config.cache.templates.ttl / 1000}`);
        return reply.send(templatesCache.data);
      }

      // Fetch fresh data
      const templates = workflowService.getTemplates();
      const data: TemplatesResponse = { templates };
      const etag = generateETag(data);

      // Update cache
      templatesCache = {
        data,
        etag,
        timestamp: Date.now(),
      };

      // Set response headers
      reply.header('ETag', etag);
      reply.header('Cache-Control', `public, max-age=${config.cache.templates.ttl / 1000}`);

      return reply.send(data);
    }
  );

  /**
   * GET /api/templates/:id - 获取模板详情
   */
  fastify.get<{
    Params: TemplateParams;
    Reply: TemplateDetailResponse;
  }>(
    '/templates/:id',
    {
      schema: {
        description: '根据 ID 获取特定模板的详细信息和 DSL',
        tags: ['template'],
        summary: '获取模板详情',
        params: zodToOpenApiSchema(TemplateParamsSchema),
        response: {
          200: {
            description: '成功获取模板详情',
            ...withExample(TemplateDetailResponseSchema, {
              success: true,
              dsl: {
                version: '0.1',
                kind: 'workflow',
                nodes: [],
                edges: [],
              },
            }),
          },
          404: {
            description: '模板不存在',
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              error: { type: 'string', example: '模板不存在' },
              statusCode: { type: 'number', example: 404 },
            },
          },
        },
      },
      preHandler: createValidationHook({
        params: TemplateParamsSchema,
      }),
    },
    async (request: FastifyRequest<{ Params: TemplateParams }>, reply: FastifyReply) => {
      const dsl = await workflowService.getTemplateById(request.params.id);

      if (!dsl) {
        throw new NotFoundError('模板不存在', 'template');
      }

      return reply.send({
        success: true,
        dsl
      });
    }
  );

  /**
   * GET /api/health - 健康检查
   */
  fastify.get<{
    Reply: HealthResponse;
  }>(
    '/health',
    {
      schema: {
        description: 'API 健康检查端点，用于监控服务状态',
        tags: ['health'],
        summary: '健康检查',
        response: {
          200: {
            description: '服务正常运行',
            ...withExample(HealthResponseSchema, {
              status: 'ok',
              timestamp: '2024-01-01T00:00:00.000Z',
            }),
          },
        },
      },
    },
    async (_request, reply: FastifyReply) => {
      return reply.send({
        status: 'ok',
        timestamp: new Date().toISOString(),
      });
    }
  );
}
