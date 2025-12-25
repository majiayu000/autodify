import { z } from 'zod';

/**
 * 通用响应 Schema
 */
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  statusCode: z.number().optional(),
  details: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional(),
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.union([
    SuccessResponseSchema.extend({
      data: dataSchema,
    }),
    ErrorResponseSchema,
  ]);

/**
 * 通用验证错误格式
 */
export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string().optional(),
});

/**
 * 分页参数
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
