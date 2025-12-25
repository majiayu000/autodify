import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getWorkflowService } from '../services/workflow.service.js';
import { config } from '../config/index.js';
import { NotFoundError } from '../errors/custom-errors.js';
import { createValidationHook } from '../plugins/index.js';
import {
  GenerateRequestBodySchema,
  RefineRequestBodySchema,
  ValidateRequestBodySchema,
  TemplateParamsSchema,
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
   * POST /api/refine - 迭代优化工作流
   */
  fastify.post<{
    Body: RefineRequestBody;
    Reply: RefineResponse;
  }>(
    '/refine',
    {
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
   * GET /api/templates - 获取模板列表
   */
  fastify.get<{
    Reply: TemplatesResponse;
  }>(
    '/templates',
    async (_request, reply: FastifyReply) => {
      const templates = workflowService.getTemplates();
      return reply.send({ templates });
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
    async (_request, reply: FastifyReply) => {
      return reply.send({
        status: 'ok',
        timestamp: new Date().toISOString(),
      });
    }
  );
}
