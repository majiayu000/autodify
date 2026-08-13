/**
 * API 类型定义
 * 导出所有 API 端点的请求和响应类型，供客户端和服务端使用
 */

import type {
  GenerateRequestBody,
  GenerateResponse,
  HealthResponse,
  RefineRequestBody,
  RefineResponse,
  TemplateDetailResponse,
  TemplateParams,
  TemplatesResponse,
  ValidateRequestBody,
  ValidateResponse,
} from '../schemas/workflow.schema.js';

// 从 schemas 导出所有类型
export type {
  // 通用类型
  SuccessResponse,
  ErrorResponse,
  ValidationError,
  PaginationQuery,

  // 工作流请求类型
  GenerateRequestBody,
  RefineRequestBody,
  ValidateRequestBody,
  TemplateParams,

  // 工作流响应类型
  GenerateResponse,
  RefineResponse,
  ValidateResponse,
  TemplatesResponse,
  TemplateDetailResponse,
  HealthResponse,

  // 辅助类型
  Metadata,
  ChangeRecord,
  ValidationIssue,
  TemplateInfo,
} from '../schemas/index.js';

// 从 errors 导出错误类型
export type { ErrorResponse as ApiErrorResponse } from '../errors/custom-errors.js';

export {
  ErrorCode,
  AppError,
  ValidationError as ValidationErrorClass,
  InvalidRequestError,
  InvalidDSLError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  RateLimitError,
  InternalError,
  LLMError,
  LLMTimeoutError,
  LLMRateLimitError,
  GenerationFailedError,
  RefinementFailedError,
  DSLValidationFailedError,
  isOperationalError,
} from '../errors/custom-errors.js';

/**
 * API 端点路径常量
 */
export const API_ENDPOINTS = {
  GENERATE: '/api/generate',
  REFINE: '/api/refine',
  VALIDATE: '/api/validate',
  TEMPLATES: '/api/templates',
  TEMPLATE_BY_ID: (id: string) => `/api/templates/${id}`,
  HEALTH: '/api/health',
} as const;

/**
 * HTTP 方法
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * API 端点定义（用于类型安全的 API 客户端）
 */
export interface ApiEndpoint<TRequest = unknown, TResponse = unknown> {
  method: HttpMethod;
  path: string;
  requestType?: TRequest;
  responseType?: TResponse;
}

/**
 * 所有 API 端点的类型定义
 */
export interface ApiEndpoints {
  generate: ApiEndpoint<GenerateRequestBody, GenerateResponse>;
  refine: ApiEndpoint<RefineRequestBody, RefineResponse>;
  validate: ApiEndpoint<ValidateRequestBody, ValidateResponse>;
  templates: ApiEndpoint<void, TemplatesResponse>;
  templateById: ApiEndpoint<{ params: TemplateParams }, TemplateDetailResponse>;
  health: ApiEndpoint<void, HealthResponse>;
}
