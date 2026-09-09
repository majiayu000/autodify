/**
 * Resolve Access-Control-Allow-Origin for responses that bypass @fastify/cors
 * (e.g. SSE via reply.raw.writeHead). Mirrors allowlist semantics used with
 * credentials: true — never returns `*`.
 */
export type CorsOriginConfig = boolean | string | string[];

export function resolveCorsAllowOrigin(
  requestOrigin: string | undefined,
  allowedOrigins: CorsOriginConfig
): string | undefined {
  if (!requestOrigin || allowedOrigins === false) {
    return undefined;
  }

  if (allowedOrigins === true) {
    return requestOrigin;
  }

  if (typeof allowedOrigins === 'string') {
    return allowedOrigins === requestOrigin ? requestOrigin : undefined;
  }

  if (Array.isArray(allowedOrigins)) {
    return allowedOrigins.includes(requestOrigin) ? requestOrigin : undefined;
  }

  return undefined;
}
