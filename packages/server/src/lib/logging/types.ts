/**
 * 日志级别类型
 */
export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

/**
 * 日志配置接口
 */
export interface LoggingConfig {
  /** 服务名称 */
  service: string;
  /** 日志级别 */
  level: LogLevel;
  /** 环境 */
  environment: 'development' | 'production' | 'test';
  /** 是否美化输出（仅开发环境） */
  pretty?: boolean;
  /** 需要脱敏的字段路径 */
  redactPaths?: string[];
}

/**
 * 日志条目接口
 */
export interface LogEntry {
  /** 时间戳 (ISO 8601) */
  timestamp: string;
  /** 日志级别 */
  level: LogLevel;
  /** 日志消息 */
  message: string;
  /** 服务名称 */
  service: string;
  /** 环境 */
  env?: string;
  /** 请求追踪 ID */
  trace_id?: string;
  /** 请求 ID */
  request_id?: string;
  /** Span ID */
  span_id?: string;
  /** 用户 ID */
  user_id?: string;
  /** HTTP 方法 */
  http_method?: string;
  /** HTTP 路径 */
  http_path?: string;
  /** HTTP 状态码 */
  http_status?: number;
  /** 耗时（毫秒） */
  duration_ms?: number;
  /** 错误代码 */
  error_code?: string;
  /** 错误消息 */
  error_message?: string;
  /** 错误堆栈 */
  error_stack?: string;
  /** 其他自定义字段 */
  [key: string]: unknown;
}

/**
 * 请求上下文接口
 */
export interface RequestContext {
  /** 请求 ID */
  request_id: string;
  /** 追踪 ID */
  trace_id?: string;
  /** HTTP 方法 */
  method: string;
  /** 请求路径 */
  path: string;
  /** 用户 ID */
  user_id?: string;
  /** 开始时间 */
  start_time: number;
}
