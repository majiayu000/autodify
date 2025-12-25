import pino, { type Logger as PinoLogger } from 'pino';
import { createPinoConfig, createPrettyTransport } from './config.js';
import type { LoggingConfig } from './types.js';

/**
 * 全局 Logger 实例
 */
let globalLogger: PinoLogger | null = null;
let isInitialized = false;

/**
 * 初始化全局日志系统
 * 必须在应用启动时调用一次
 */
export function initializeLogging(config: LoggingConfig): PinoLogger {
  if (isInitialized && globalLogger) {
    globalLogger.warn('Logger already initialized, returning existing instance');
    return globalLogger;
  }

  const pinoConfig = createPinoConfig(config);

  // 开发环境使用 pretty transport
  if (config.pretty && config.environment === 'development') {
    globalLogger = pino(pinoConfig, pino.transport(createPrettyTransport()));
  } else {
    globalLogger = pino(pinoConfig);
  }

  isInitialized = true;

  globalLogger.info({ config: { service: config.service, level: config.level, env: config.environment } }, 'Logger initialized');

  return globalLogger;
}

/**
 * 获取全局 Logger 实例
 * @throws {Error} 如果 Logger 未初始化
 */
export function getLogger(): PinoLogger {
  if (!globalLogger || !isInitialized) {
    throw new Error('Logger not initialized. Call initializeLogging() first.');
  }
  return globalLogger;
}

/**
 * 创建带有上下文的子 Logger
 * @param context - 附加的上下文信息
 */
export function createChildLogger(context: Record<string, unknown>): PinoLogger {
  const logger = getLogger();
  return logger.child(context);
}

/**
 * 辅助函数：记录错误
 */
export function logError(error: Error | unknown, message: string, context?: Record<string, unknown>) {
  const logger = getLogger();

  if (error instanceof Error) {
    logger.error(
      {
        err: error,
        error_message: error.message,
        error_stack: error.stack,
        ...context,
      },
      message
    );
  } else {
    logger.error(
      {
        error: error,
        ...context,
      },
      message
    );
  }
}

/**
 * 辅助函数：记录 HTTP 请求
 */
export function logHttpRequest(data: {
  method: string;
  path: string;
  status: number;
  duration_ms: number;
  request_id?: string;
  user_id?: string;
}) {
  const logger = getLogger();
  logger.info(
    {
      http_method: data.method,
      http_path: data.path,
      http_status: data.status,
      duration_ms: data.duration_ms,
      request_id: data.request_id,
      user_id: data.user_id,
    },
    `${data.method} ${data.path} ${data.status} - ${data.duration_ms}ms`
  );
}
