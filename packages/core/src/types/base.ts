/**
 * Base types for Dify DSL
 */

/** DSL 版本号 */
export type DSLVersion = '0.5.0' | '0.1.0' | '0.1.1' | '0.1.2' | '0.1.3' | '0.1.4' | '0.1.5';

/** 应用模式 */
export type AppMode = 'workflow' | 'advanced-chat' | 'chat' | 'agent-chat' | 'completion';

/** 图标类型 */
export type IconType = 'emoji' | 'image' | 'link';

/** 变量类型 */
export type VariableType =
  | 'text-input'
  | 'paragraph'
  | 'select'
  | 'number'
  | 'file'
  | 'file-list';

/** 输出变量类型 */
export type OutputType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array[string]'
  | 'array[number]'
  | 'array[object]';

/** 代码语言 */
export type CodeLanguage = 'python3' | 'javascript';

/** HTTP 方法 */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head';

/** Body 类型 */
export type BodyType = 'none' | 'form-data' | 'x-www-form-urlencoded' | 'raw-text' | 'json';

/** 比较操作符 */
export type ComparisonOperator =
  | '='
  | '≠'
  | 'contains'
  | 'not contains'
  | 'start with'
  | 'end with'
  | 'is empty'
  | 'is not empty'
  | '>'
  | '<'
  | '≥'
  | '≤'
  | 'in'
  | 'not in';

/** 逻辑操作符 */
export type LogicalOperator = 'and' | 'or';

/** 检索模式 */
export type RetrievalMode = 'single' | 'multiple';

/** 迭代错误处理模式 */
export type ErrorHandleMode = 'terminated' | 'continue-on-error' | 'remove-abnormal-output';

/** 授权类型 */
export type AuthorizationType = 'no-auth' | 'api-key' | 'basic';

/** API Key 类型 */
export type ApiKeyType = 'bearer' | 'basic' | 'custom';

/** 工具提供商类型 */
export type ProviderType = 'builtin' | 'api' | 'workflow';

/** 推理模式 */
export type ReasoningMode = 'prompt' | 'function_call';

/** 参数提取类型 */
export type ExtractorParamType =
  | 'string'
  | 'number'
  | 'bool'
  | 'select'
  | 'array[string]'
  | 'array[number]'
  | 'array[object]';

/** 文件传输方式 */
export type TransferMethod = 'remote_url' | 'local_file';

/** 允许的文件类型 */
export type AllowedFileType = 'image' | 'document' | 'audio' | 'video' | 'custom';

/** 变量值类型 */
export type VariableValueType = 'string' | 'number' | 'object' | 'secret' | 'array[string]';

/** 模板版本类型 */
export type EditionType = 'basic' | 'jinja2';

/** LLM 模式 */
export type LLMMode = 'chat' | 'completion';

/** 视觉细节级别 */
export type VisionDetail = 'low' | 'high';
