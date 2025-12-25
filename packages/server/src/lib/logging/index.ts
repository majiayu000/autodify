/**
 * 结构化日志系统
 *
 * 使用方式：
 * 1. 在应用启动时初始化：
 *    initializeLogging({ service: 'my-service', level: 'info', environment: 'production' })
 *
 * 2. 在业务代码中使用：
 *    import { getLogger } from '@/lib/logging';
 *    const logger = getLogger();
 *    logger.info({ user_id: '123' }, 'User logged in');
 *
 * 3. 注册请求日志中间件：
 *    await fastify.register(requestLoggingPlugin, { slowRequestThreshold: 1000 });
 */

// 核心功能
export { initializeLogging, getLogger, createChildLogger, logError, logHttpRequest } from './logger.js';

// 上下文管理
export { getRequestContext, setRequestContext, generateRequestId, generateTraceId, extractTraceId } from './context.js';

// 中间件
export { requestLoggingPlugin } from './middleware.js';
export type { RequestLoggingOptions } from './middleware.js';

// 类型定义
export type { LogLevel, LoggingConfig, LogEntry, RequestContext } from './types.js';

// 配置工具
export { createPinoConfig, createPrettyTransport } from './config.js';
