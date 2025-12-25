import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z, ZodError, ZodSchema } from 'zod';
import { ValidationError } from '../errors/custom-errors.js';

/**
 * 验证配置
 */
export interface ValidatorSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

/**
 * 验证错误详情
 */
interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
}

/**
 * 格式化 Zod 验证错误
 */
function formatZodError(error: ZodError): ValidationErrorDetail[] {
  return error.errors.map((err) => ({
    field: err.path.join('.') || 'unknown',
    message: err.message,
    code: err.code,
  }));
}

/**
 * 创建验证 Hook
 */
export function createValidationHook(schemas: ValidatorSchemas) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const errors: ValidationErrorDetail[] = [];

    // 验证请求体
    if (schemas.body) {
      const result = schemas.body.safeParse(request.body);
      if (!result.success) {
        errors.push(...formatZodError(result.error));
      } else {
        request.body = result.data;
      }
    }

    // 验证路径参数
    if (schemas.params) {
      const result = schemas.params.safeParse(request.params);
      if (!result.success) {
        errors.push(...formatZodError(result.error));
      } else {
        request.params = result.data;
      }
    }

    // 验证查询参数
    if (schemas.query) {
      const result = schemas.query.safeParse(request.query);
      if (!result.success) {
        errors.push(...formatZodError(result.error));
      } else {
        request.query = result.data;
      }
    }

    // 如果有验证错误，抛出 ValidationError
    if (errors.length > 0) {
      const errorMessage = errors.length === 1
        ? errors[0].message
        : `验证失败: ${errors.length} 个字段存在错误`;
      throw new ValidationError(errorMessage, { fields: errors });
    }
  };
}

/**
 * 验证插件
 * 提供 request.validate() 方法用于手动验证
 */
export const validatorPlugin: FastifyPluginAsync = async (fastify) => {
  // 定义验证函数
  const validateFn = <T extends ZodSchema>(
    schema: T,
    data: unknown
  ): z.infer<T> => {
    const result = schema.safeParse(data);
    if (!result.success) {
      const errors = formatZodError(result.error);
      const errorMessage = errors.length === 1
        ? errors[0].message
        : `验证失败: ${errors.length} 个字段存在错误`;
      throw new ValidationError(errorMessage, { fields: errors });
    }
    return result.data;
  };

  // 添加验证装饰器
  fastify.decorateRequest('validate', validateFn);
};

// 扩展 FastifyRequest 类型
declare module 'fastify' {
  interface FastifyRequest {
    validate<T extends ZodSchema>(schema: T, data: unknown): z.infer<T>;
  }
}

export default validatorPlugin;
