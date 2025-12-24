/**
 * Generator Types
 */

import type { DifyDSL } from '../types/index.js';

/** 生成选项 */
export interface GeneratorOptions {
  /** 模型提供商 */
  modelProvider?: string;
  /** 模型名称 */
  modelName?: string;
  /** 温度参数 */
  temperature?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 是否启用验证 */
  validate?: boolean;
}

/** 生成结果 */
export interface GenerateResult {
  success: boolean;
  dsl?: DifyDSL;
  yaml?: string;
  error?: string;
  retries?: number;
}

/** Prompt 构建器选项 */
export interface PromptBuilderOptions {
  /** 包含的节点类型 */
  includeNodeTypes?: string[];
  /** Few-shot 示例数量 */
  exampleCount?: number;
  /** 是否简化输出 */
  simplified?: boolean;
}
