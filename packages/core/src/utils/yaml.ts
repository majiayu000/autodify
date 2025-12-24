/**
 * YAML parsing and serialization utilities for Dify DSL
 */

import { parse, stringify } from 'yaml';
import type { DifyDSL } from '../types/index.js';

/** YAML 解析选项 */
export interface ParseOptions {
  /** 是否严格模式，遇到未知字段时报错 */
  strict?: boolean;
}

/** YAML 序列化选项 */
export interface StringifyOptions {
  /** 缩进空格数 */
  indent?: number;
  /** 是否使用单引号 */
  singleQuote?: boolean;
  /** 行宽限制 */
  lineWidth?: number;
  /** 是否保持块标量样式（多行文本） */
  blockQuote?: boolean;
}

/** 解析结果 */
export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 解析 YAML 字符串为 DifyDSL 对象
 *
 * @param content - YAML 字符串
 * @param options - 解析选项
 * @returns 解析结果
 *
 * @example
 * ```typescript
 * const result = parseYAML(yamlContent);
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function parseYAML(content: string, _options: ParseOptions = {}): ParseResult<DifyDSL> {
  try {
    const data = parse(content) as unknown;

    // 基本类型检查
    if (!data || typeof data !== 'object') {
      return {
        success: false,
        error: 'Invalid YAML: root must be an object',
      };
    }

    const obj = data as Record<string, unknown>;

    // 检查必须字段
    if (!obj['version']) {
      return {
        success: false,
        error: 'Invalid DSL: missing required field "version"',
      };
    }

    if (!obj['kind'] || obj['kind'] !== 'app') {
      return {
        success: false,
        error: 'Invalid DSL: "kind" must be "app"',
      };
    }

    if (!obj['app'] || typeof obj['app'] !== 'object') {
      return {
        success: false,
        error: 'Invalid DSL: missing required field "app"',
      };
    }

    // 对于 workflow/advanced-chat 模式，必须有 workflow 字段
    const app = obj['app'] as Record<string, unknown>;
    const mode = app['mode'] as string;

    if ((mode === 'workflow' || mode === 'advanced-chat') && !obj['workflow']) {
      return {
        success: false,
        error: `Invalid DSL: mode "${mode}" requires "workflow" field`,
      };
    }

    return {
      success: true,
      data: obj as unknown as DifyDSL,
    };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return {
      success: false,
      error: `YAML parse error: ${errorMessage}`,
    };
  }
}

/**
 * 将 DifyDSL 对象序列化为 YAML 字符串
 *
 * @param dsl - DifyDSL 对象
 * @param options - 序列化选项
 * @returns YAML 字符串
 *
 * @example
 * ```typescript
 * const yaml = stringifyYAML(dsl, { indent: 2 });
 * console.log(yaml);
 * ```
 */
export function stringifyYAML(dsl: DifyDSL, options: StringifyOptions = {}): string {
  const { indent = 2, singleQuote = true, lineWidth = 120, blockQuote = true } = options;

  return stringify(dsl, {
    indent,
    singleQuote,
    lineWidth,
    blockQuote: blockQuote ? 'literal' : undefined,
    defaultStringType: 'QUOTE_SINGLE',
    defaultKeyType: 'PLAIN',
  });
}

/**
 * 尝试解析 YAML，如果失败则抛出错误
 *
 * @param content - YAML 字符串
 * @returns DifyDSL 对象
 * @throws 如果解析失败
 */
export function parseYAMLOrThrow(content: string): DifyDSL {
  const result = parseYAML(content);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.data!;
}

/**
 * 验证 YAML 字符串是否为有效的 DSL 格式
 *
 * @param content - YAML 字符串
 * @returns 是否有效
 */
export function isValidDSLYAML(content: string): boolean {
  return parseYAML(content).success;
}

/**
 * 美化 YAML 输出（重新格式化）
 *
 * @param content - YAML 字符串
 * @param options - 序列化选项
 * @returns 格式化后的 YAML 字符串
 */
export function formatYAML(content: string, options: StringifyOptions = {}): string {
  const result = parseYAML(content);
  if (!result.success) {
    throw new Error(result.error);
  }
  return stringifyYAML(result.data!, options);
}

/**
 * 从 YAML 中提取特定字段
 *
 * @param content - YAML 字符串
 * @param path - 字段路径，如 "workflow.graph.nodes"
 * @returns 字段值或 undefined
 */
export function extractField(content: string, path: string): unknown {
  const result = parseYAML(content);
  if (!result.success) {
    return undefined;
  }

  const parts = path.split('.');
  let current: unknown = result.data;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}
