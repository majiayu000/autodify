import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

/**
 * 将 Zod schema 转换为 JSON Schema (OpenAPI 3.0 兼容)
 */
export function zodToOpenApiSchema(zodSchema: z.ZodTypeAny) {
  const jsonSchema = zodToJsonSchema(zodSchema, {
    target: 'openApi3',
    $refStrategy: 'none',
  });

  // 移除 $schema 字段（OpenAPI 不需要）
  const { $schema, ...schema } = jsonSchema as any;

  return schema;
}

/**
 * 创建带示例的 schema
 */
export function withExample<T extends z.ZodTypeAny>(
  zodSchema: T,
  example: z.infer<T>
) {
  const schema = zodToOpenApiSchema(zodSchema);
  return {
    ...schema,
    example,
  };
}

/**
 * 创建带多个示例的 schema
 */
export function withExamples<T extends z.ZodTypeAny>(
  zodSchema: T,
  examples: Record<string, { value: z.infer<T>; summary?: string; description?: string }>
) {
  const schema = zodToOpenApiSchema(zodSchema);
  return {
    ...schema,
    examples,
  };
}
