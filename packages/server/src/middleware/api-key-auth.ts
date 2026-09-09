import { timingSafeEqual } from 'crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { config } from '../config/index.js';
import { UnauthorizedError } from '../errors/custom-errors.js';

export const API_KEY_HEADER = 'x-api-key';

/**
 * Compare secrets in constant time when lengths match.
 */
function safeEqual(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);

  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }

  return timingSafeEqual(providedBuf, expectedBuf);
}

/**
 * Validate X-API-Key against the server API_KEY secret.
 * Apply only to LLM-consuming routes; keep /health public.
 */
export async function apiKeyAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const provided = request.headers[API_KEY_HEADER];
  const headerValue = Array.isArray(provided) ? provided[0] : provided;

  if (!headerValue || !safeEqual(headerValue, config.apiKey)) {
    throw new UnauthorizedError('缺少或无效的 API Key，请在请求头中提供有效的 X-API-Key');
  }
}
