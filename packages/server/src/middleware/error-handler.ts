/**
 * Fastify 错误处理中间件
 * 统一处理所有错误并返回一致的响应格式
 */

import { FastifyInstance, FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { ZodError } from 'zod';
import { AppError, ValidationError, ErrorResponse, isOperationalError, InternalError } from '../errors/custom-errors.js';

/**
 * 注册全局错误处理器
 */
export function registerErrorHandler(fastify: FastifyInstance, options: { isDevelopment: boolean }) {
  const { isDevelopment } = options;

  // 设置自定义错误处理器
  fastify.setErrorHandler(async (error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    // 记录错误
    logError(fastify, error, request);

    // 处理不同类型的错误
    const errorResponse = handleError(error, isDevelopment);

    // 发送响应
    return reply.status(errorResponse.statusCode).send(errorResponse);
  });

  // 添加 onError 钩子用于额外的错误监控
  fastify.addHook('onError', async (request, _reply, error) => {
    // 这里可以添加错误监控服务（如 Sentry）
    if (!isOperationalError(error)) {
      fastify.log.error(
        {
          err: error,
          url: request.url,
          method: request.method,
          headers: request.headers,
        },
        'Unexpected error occurred'
      );
    }
  });
}

/**
 * 处理错误并转换为统一格式
 */
function handleError(error: FastifyError | Error, isDevelopment: boolean): ErrorResponse {
  // 1. 处理自定义 AppError
  if (error instanceof AppError) {
    return error.toResponse(isDevelopment);
  }

  // 2. 处理 Zod 验证错误
  if (error instanceof ZodError) {
    const validationError = new ValidationError('请求参数验证失败', {
      issues: error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return validationError.toResponse(isDevelopment);
  }

  // 3. 处理 Fastify 错误
  if ('statusCode' in error && error.statusCode) {
    const fastifyError = error as FastifyError;

    // 根据状态码创建合适的错误响应
    const errorResponse: ErrorResponse = {
      success: false,
      error: fastifyError.message || 'Internal Server Error',
      code: fastifyError.code || 'FASTIFY_ERROR',
      statusCode: fastifyError.statusCode || 500,
    };

    if (isDevelopment && fastifyError.stack) {
      errorResponse.stack = fastifyError.stack;
    }

    return errorResponse;
  }

  // 4. 处理标准 Error
  if (error instanceof Error) {
    const internalError = new InternalError(
      isDevelopment ? error.message : '服务器内部错误',
      isDevelopment ? { originalError: error.message } : undefined
    );
    return internalError.toResponse(isDevelopment);
  }

  // 5. 未知错误
  const unknownError = new InternalError('未知错误');
  return unknownError.toResponse(isDevelopment);
}

/**
 * 记录错误日志
 */
function logError(fastify: FastifyInstance, error: Error, request: FastifyRequest) {
  const errorInfo = {
    message: error.message,
    name: error.name,
    url: request.url,
    method: request.method,
    ip: request.ip,
  };

  // 根据错误类型选择日志级别
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      fastify.log.error(errorInfo, 'Server error occurred');
    } else if (error.statusCode >= 400) {
      fastify.log.warn(errorInfo, 'Client error occurred');
    } else {
      fastify.log.info(errorInfo, 'Operational error occurred');
    }
  } else {
    // 未预期的错误，记录为 error 级别
    fastify.log.error(
      {
        ...errorInfo,
        stack: error.stack,
      },
      'Unexpected error occurred'
    );
  }
}

/**
 * 包装异步路由处理器，自动捕获异常
 * 使用示例：
 * fastify.get('/path', asyncHandler(async (request, reply) => {
 *   throw new NotFoundError('Resource not found');
 * }));
 */
export function asyncHandler<T = unknown>(
  handler: (request: FastifyRequest, reply: FastifyReply) => Promise<T>
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return await handler(request, reply);
    } catch (error) {
      throw error; // 让 Fastify 的错误处理器处理
    }
  };
}

/**
 * 验证请求体的辅助函数
 */
export function validateRequest<T>(schema: any, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ValidationError('请求参数验证失败', {
      issues: result.error.errors.map((e: any) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  return result.data;
}
