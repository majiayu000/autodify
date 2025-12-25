/**
 * 自定义错误类
 * 提供统一的错误处理和响应格式
 */

/**
 * 错误码定义
 */
export enum ErrorCode {
  // 通用错误 (1xxx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',

  // 验证错误 (2xxx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  INVALID_DSL = 'INVALID_DSL',

  // 资源错误 (3xxx)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',

  // 业务逻辑错误 (4xxx)
  GENERATION_FAILED = 'GENERATION_FAILED',
  REFINEMENT_FAILED = 'REFINEMENT_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',

  // 外部服务错误 (5xxx)
  LLM_ERROR = 'LLM_ERROR',
  LLM_TIMEOUT = 'LLM_TIMEOUT',
  LLM_RATE_LIMIT = 'LLM_RATE_LIMIT',

  // 认证授权错误 (6xxx)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // 速率限制 (7xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

/**
 * 错误响应格式
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  statusCode: number;
  stack?: string;
  details?: unknown;
}

/**
 * 基础应用错误类
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: string = ErrorCode.INTERNAL_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    // 维护正确的堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 转换为响应格式
   */
  toResponse(includeStack: boolean = false): ErrorResponse {
    const response: ErrorResponse = {
      success: false,
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };

    if (this.details) {
      response.details = this.details;
    }

    if (includeStack && this.stack) {
      response.stack = this.stack;
    }

    return response;
  }
}

/**
 * 验证错误 (400)
 */
export class ValidationError extends AppError {
  constructor(message: string = '请求参数验证失败', details?: unknown) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, true, details);
  }
}

/**
 * 无效请求错误 (400)
 */
export class InvalidRequestError extends AppError {
  constructor(message: string = '无效的请求', details?: unknown) {
    super(message, ErrorCode.INVALID_REQUEST, 400, true, details);
  }
}

/**
 * 无效 DSL 错误 (400)
 */
export class InvalidDSLError extends AppError {
  constructor(message: string = '无效的 DSL 格式', details?: unknown) {
    super(message, ErrorCode.INVALID_DSL, 400, true, details);
  }
}

/**
 * 资源未找到错误 (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = '请求的资源不存在', resource?: string) {
    const code = resource === 'template' ? ErrorCode.TEMPLATE_NOT_FOUND : ErrorCode.NOT_FOUND;
    super(message, code, 404, true);
  }
}

/**
 * 未授权错误 (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权访问') {
    super(message, ErrorCode.UNAUTHORIZED, 401, true);
  }
}

/**
 * 禁止访问错误 (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = '禁止访问') {
    super(message, ErrorCode.FORBIDDEN, 403, true);
  }
}

/**
 * 速率限制错误 (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = '请求过于频繁，请稍后再试') {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, true);
  }
}

/**
 * 内部服务器错误 (500)
 */
export class InternalError extends AppError {
  constructor(message: string = '服务器内部错误', details?: unknown) {
    super(message, ErrorCode.INTERNAL_ERROR, 500, false, details);
  }
}

/**
 * LLM 服务错误 (502)
 */
export class LLMError extends AppError {
  constructor(message: string = 'LLM 服务错误', details?: unknown) {
    super(message, ErrorCode.LLM_ERROR, 502, true, details);
  }
}

/**
 * LLM 超时错误 (504)
 */
export class LLMTimeoutError extends AppError {
  constructor(message: string = 'LLM 服务响应超时') {
    super(message, ErrorCode.LLM_TIMEOUT, 504, true);
  }
}

/**
 * LLM 速率限制错误 (429)
 */
export class LLMRateLimitError extends AppError {
  constructor(message: string = 'LLM 服务速率限制') {
    super(message, ErrorCode.LLM_RATE_LIMIT, 429, true);
  }
}

/**
 * 工作流生成失败错误 (500)
 */
export class GenerationFailedError extends AppError {
  constructor(message: string = '工作流生成失败', details?: unknown) {
    super(message, ErrorCode.GENERATION_FAILED, 500, true, details);
  }
}

/**
 * 工作流优化失败错误 (500)
 */
export class RefinementFailedError extends AppError {
  constructor(message: string = '工作流优化失败', details?: unknown) {
    super(message, ErrorCode.REFINEMENT_FAILED, 500, true, details);
  }
}

/**
 * DSL 验证失败错误 (400)
 */
export class DSLValidationFailedError extends AppError {
  constructor(message: string = 'DSL 验证失败', details?: unknown) {
    super(message, ErrorCode.VALIDATION_FAILED, 400, true, details);
  }
}

/**
 * 判断是否为操作性错误（可预期的错误）
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}
