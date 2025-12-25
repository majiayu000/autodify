import { AsyncLocalStorage } from 'async_hooks';
import type { RequestContext } from './types.js';
import { randomUUID } from 'crypto';

/**
 * AsyncLocalStorage 用于存储请求上下文
 */
const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * 设置请求上下文
 */
export function setRequestContext(context: RequestContext): void {
  asyncLocalStorage.enterWith(context);
}

/**
 * 获取当前请求上下文
 */
export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * 生成请求 ID
 */
export function generateRequestId(): string {
  return `req_${randomUUID().replace(/-/g, '')}`;
}

/**
 * 生成追踪 ID
 */
export function generateTraceId(): string {
  return randomUUID().replace(/-/g, '');
}

/**
 * 从请求头中提取追踪 ID
 */
export function extractTraceId(headers: Record<string, string | string[] | undefined>): string | undefined {
  const traceId = headers['x-trace-id'] || headers['x-request-id'] || headers['traceparent'];

  if (Array.isArray(traceId)) {
    return traceId[0];
  }

  return traceId;
}
