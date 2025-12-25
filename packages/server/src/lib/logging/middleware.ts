import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import type { FastifyPluginAsync } from 'fastify';
import { getLogger } from './logger.js';
import { setRequestContext, generateRequestId, generateTraceId, extractTraceId } from './context.js';

/**
 * 请求日志中间件配置
 */
export interface RequestLoggingOptions {
  /** 是否记录请求体（注意：可能包含敏感信息） */
  logBody?: boolean;
  /** 是否记录响应体 */
  logResponse?: boolean;
  /** 排除的路径（不记录日志） */
  excludePaths?: string[];
  /** 慢请求阈值（毫秒），超过此值会记录 warn */
  slowRequestThreshold?: number;
}

/**
 * Fastify 请求日志插件
 */
export const requestLoggingPlugin: FastifyPluginAsync<RequestLoggingOptions> = async (
  fastify: FastifyInstance,
  options: RequestLoggingOptions
) => {
  const {
    logBody = false,
    logResponse = false,
    excludePaths = ['/health', '/metrics'],
    slowRequestThreshold = 1000,
  } = options;

  const logger = getLogger();

  // 请求开始
  fastify.addHook('onRequest', async (request: FastifyRequest, _reply: FastifyReply) => {
    const startTime = Date.now();

    // 生成或提取请求 ID 和追踪 ID
    const requestId = generateRequestId();
    const traceId = extractTraceId(request.headers as Record<string, string | string[] | undefined>) || generateTraceId();

    // 设置请求上下文
    setRequestContext({
      request_id: requestId,
      trace_id: traceId,
      method: request.method,
      path: request.url,
      start_time: startTime,
    });

    // 将 ID 添加到请求对象
    (request as any).requestId = requestId;
    (request as any).traceId = traceId;
    (request as any).startTime = startTime;

    // 排除路径检查
    if (excludePaths.some((path) => request.url.startsWith(path))) {
      return;
    }

    // 记录请求开始
    const logData: Record<string, unknown> = {
      request_id: requestId,
      trace_id: traceId,
      http_method: request.method,
      http_path: request.url,
      http_query: request.query,
      http_headers: {
        'user-agent': request.headers['user-agent'],
        'content-type': request.headers['content-type'],
        referer: request.headers['referer'],
      },
      ip: request.ip,
    };

    if (logBody && request.body) {
      logData.body = request.body;
    }

    logger.info(logData, `→ ${request.method} ${request.url}`);
  });

  // 请求结束
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = (request as any).requestId;
    const traceId = (request as any).traceId;
    const startTime = (request as any).startTime || Date.now();
    const duration = Date.now() - startTime;

    // 排除路径检查
    if (excludePaths.some((path) => request.url.startsWith(path))) {
      return;
    }

    const logData: Record<string, unknown> = {
      request_id: requestId,
      trace_id: traceId,
      http_method: request.method,
      http_path: request.url,
      http_status: reply.statusCode,
      duration_ms: duration,
    };

    if (logResponse && reply.sent) {
      logData.response_size = reply.getHeader('content-length');
    }

    // 根据状态码和耗时选择日志级别
    const isError = reply.statusCode >= 500;
    const isClientError = reply.statusCode >= 400 && reply.statusCode < 500;
    const isSlow = duration >= slowRequestThreshold;

    if (isError) {
      logger.error(logData, `← ${request.method} ${request.url} ${reply.statusCode} - ${duration}ms`);
    } else if (isClientError) {
      logger.warn(logData, `← ${request.method} ${request.url} ${reply.statusCode} - ${duration}ms`);
    } else if (isSlow) {
      logger.warn({ ...logData, slow_request: true }, `← ${request.method} ${request.url} ${reply.statusCode} - ${duration}ms (SLOW)`);
    } else {
      logger.info(logData, `← ${request.method} ${request.url} ${reply.statusCode} - ${duration}ms`);
    }
  });

  // 错误处理
  fastify.addHook('onError', async (request: FastifyRequest, _reply: FastifyReply, error: Error) => {
    const requestId = (request as any).requestId;
    const traceId = (request as any).traceId;
    const startTime = (request as any).startTime || Date.now();
    const duration = Date.now() - startTime;

    logger.error(
      {
        request_id: requestId,
        trace_id: traceId,
        http_method: request.method,
        http_path: request.url,
        duration_ms: duration,
        err: error,
        error_message: error.message,
        error_stack: error.stack,
      },
      `✗ ${request.method} ${request.url} - Error: ${error.message}`
    );
  });
};

/**
 * 默认导出（方便注册）
 */
export default requestLoggingPlugin;
