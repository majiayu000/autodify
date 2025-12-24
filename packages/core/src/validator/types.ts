/**
 * Validator Types
 */

/** 验证错误级别 */
export type ValidationSeverity = 'error' | 'warning';

/** 验证错误 */
export interface ValidationError {
  path: string;
  message: string;
  severity: ValidationSeverity;
  code?: string;
}

/** 验证结果 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/** 验证选项 */
export interface ValidatorOptions {
  /** 是否严格模式 */
  strict?: boolean;
  /** 是否检查变量引用 */
  checkVariableRefs?: boolean;
  /** 是否检查拓扑结构 */
  checkTopology?: boolean;
}
