import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getWorkflowService } from '../services/workflow.service.js';
import { config } from '../config/index.js';

// Request schemas
const GenerateRequestSchema = z.object({
  prompt: z.string().min(1, '请输入工作流描述'),
  options: z
    .object({
      model: z.string().optional(),
      temperature: z.number().min(0).max(2).optional(),
      useTemplate: z.boolean().optional(),
    })
    .optional(),
});

const RefineRequestSchema = z.object({
  dsl: z.record(z.unknown()),
  instruction: z.string().min(1, '请输入修改指令'),
});

const ValidateRequestSchema = z.object({
  dsl: z.record(z.unknown()),
});

export async function workflowRoutes(fastify: FastifyInstance) {
  const workflowService = getWorkflowService();

  // POST /api/generate - 生成工作流
  fastify.post(
    '/generate',
    {
      config: {
        rateLimit: {
          max: config.rateLimit.generate.max,
          timeWindow: config.rateLimit.generate.timeWindow,
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: z.infer<typeof GenerateRequestSchema> }>,
      reply: FastifyReply
    ) => {
      const parseResult = GenerateRequestSchema.safeParse(request.body);

      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: parseResult.error.errors[0].message,
        });
      }

      const result = await workflowService.generate(parseResult.data);
      return reply.send(result);
    }
  );

  // POST /api/refine - 迭代优化工作流
  fastify.post(
    '/refine',
    {
      config: {
        rateLimit: {
          max: config.rateLimit.refine.max,
          timeWindow: config.rateLimit.refine.timeWindow,
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: z.infer<typeof RefineRequestSchema> }>,
      reply: FastifyReply
    ) => {
      const parseResult = RefineRequestSchema.safeParse(request.body);

      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: parseResult.error.errors[0].message,
        });
      }

      const result = await workflowService.refine({
        dsl: parseResult.data.dsl as any,
        instruction: parseResult.data.instruction,
      });
      return reply.send(result);
    }
  );

  // POST /api/validate - 验证 DSL
  fastify.post(
    '/validate',
    async (
      request: FastifyRequest<{ Body: z.infer<typeof ValidateRequestSchema> }>,
      reply: FastifyReply
    ) => {
      const parseResult = ValidateRequestSchema.safeParse(request.body);

      if (!parseResult.success) {
        return reply.status(400).send({
          valid: false,
          errors: [{ code: 'E001', message: parseResult.error.errors[0].message }],
          warnings: [],
        });
      }

      const result = await workflowService.validate(parseResult.data.dsl);
      return reply.send(result);
    }
  );

  // GET /api/templates - 获取模板列表
  fastify.get('/templates', async (_request, reply) => {
    const templates = workflowService.getTemplates();
    return reply.send({ templates });
  });

  // GET /api/templates/:id - 获取模板详情
  fastify.get(
    '/templates/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const dsl = await workflowService.getTemplateById(request.params.id);
      if (!dsl) {
        return reply.status(404).send({
          success: false,
          error: '模板不存在',
        });
      }
      return reply.send({ success: true, dsl });
    }
  );

  // GET /api/health - 健康检查
  fastify.get('/health', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });
}
