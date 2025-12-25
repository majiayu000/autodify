import { z } from 'zod';

/**
 * ==================== 请求 Schema ====================
 */

// POST /api/generate - 生成工作流
export const GenerateRequestBodySchema = z.object({
  prompt: z.string()
    .min(1, '请输入工作流描述')
    .max(10000, '工作流描述不能超过 10000 字符'),
  options: z.object({
    model: z.string().optional(),
    temperature: z.number()
      .min(0, '温度参数不能小于 0')
      .max(2, '温度参数不能大于 2')
      .optional(),
    useTemplate: z.boolean().optional(),
  }).optional(),
});

// POST /api/refine - 迭代优化工作流
export const RefineRequestBodySchema = z.object({
  dsl: z.record(z.unknown())
    .refine(
      (val) => typeof val === 'object' && val !== null,
      { message: 'DSL 必须是一个有效的对象' }
    ),
  instruction: z.string()
    .min(1, '请输入修改指令')
    .max(5000, '修改指令不能超过 5000 字符'),
});

// POST /api/validate - 验证 DSL
export const ValidateRequestBodySchema = z.object({
  dsl: z.record(z.unknown())
    .refine(
      (val) => typeof val === 'object' && val !== null,
      { message: 'DSL 必须是一个有效的对象' }
    ),
});

// GET /api/templates/:id - 获取模板详情
export const TemplateParamsSchema = z.object({
  id: z.string()
    .min(1, '模板 ID 不能为空')
    .regex(/^[a-zA-Z0-9_-]+$/, '模板 ID 只能包含字母、数字、下划线和短横线'),
});

/**
 * ==================== 响应 Schema ====================
 */

// 元数据 Schema
const MetadataSchema = z.object({
  duration: z.number(),
  model: z.string(),
  tokens: z.object({
    input: z.number(),
    output: z.number(),
  }).optional(),
  templateUsed: z.string().nullable().optional(),
  confidence: z.number().optional(),
});

// 变更记录 Schema
const ChangeRecordSchema = z.object({
  type: z.enum(['add', 'modify', 'remove']),
  node: z.string().optional(),
  edge: z.string().optional(),
  reason: z.string(),
});

// 验证错误/警告 Schema
const ValidationIssueSchema = z.object({
  code: z.string(),
  message: z.string(),
  path: z.string().optional(),
});

// 模板信息 Schema
const TemplateInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  complexity: z.enum(['simple', 'medium', 'complex']),
  tags: z.array(z.string()),
});

// 生成响应
export const GenerateResponseSchema = z.object({
  success: z.boolean(),
  dsl: z.record(z.unknown()).optional(),
  yaml: z.string().optional(),
  error: z.string().optional(),
  metadata: MetadataSchema.optional(),
});

// 优化响应
export const RefineResponseSchema = z.object({
  success: z.boolean(),
  dsl: z.record(z.unknown()).optional(),
  yaml: z.string().optional(),
  error: z.string().optional(),
  changes: z.array(ChangeRecordSchema).optional(),
});

// 验证响应
export const ValidateResponseSchema = z.object({
  valid: z.boolean(),
  errors: z.array(ValidationIssueSchema),
  warnings: z.array(ValidationIssueSchema),
});

// 模板列表响应
export const TemplatesResponseSchema = z.object({
  templates: z.array(TemplateInfoSchema),
});

// 模板详情响应
export const TemplateDetailResponseSchema = z.object({
  success: z.boolean(),
  dsl: z.record(z.unknown()).optional(),
  error: z.string().optional(),
});

// 健康检查响应
export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string(),
});

/**
 * ==================== TypeScript 类型导出 ====================
 */

// 请求类型
export type GenerateRequestBody = z.infer<typeof GenerateRequestBodySchema>;
export type RefineRequestBody = z.infer<typeof RefineRequestBodySchema>;
export type ValidateRequestBody = z.infer<typeof ValidateRequestBodySchema>;
export type TemplateParams = z.infer<typeof TemplateParamsSchema>;

// 响应类型
export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;
export type RefineResponse = z.infer<typeof RefineResponseSchema>;
export type ValidateResponse = z.infer<typeof ValidateResponseSchema>;
export type TemplatesResponse = z.infer<typeof TemplatesResponseSchema>;
export type TemplateDetailResponse = z.infer<typeof TemplateDetailResponseSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

// 辅助类型
export type Metadata = z.infer<typeof MetadataSchema>;
export type ChangeRecord = z.infer<typeof ChangeRecordSchema>;
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;
export type TemplateInfo = z.infer<typeof TemplateInfoSchema>;
