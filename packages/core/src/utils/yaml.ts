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

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 按照 Dify 期望的顺序排列 DSL 字段
 */
function orderDSLFields(dsl: DifyDSL): Record<string, unknown> {
  const src = dsl as any;
  const ordered: any = {};

  // 顶层字段顺序: app -> dependencies -> kind -> version -> workflow
  if (src.app) ordered.app = orderAppFields(src.app);
  if (src.dependencies) ordered.dependencies = src.dependencies;
  ordered.kind = src.kind;
  ordered.version = src.version;
  if (src.workflow) ordered.workflow = orderWorkflowFields(src.workflow);
  if (src.model_config) ordered.model_config = src.model_config;

  return ordered;
}

function orderAppFields(app: any): any {
  const ordered: any = {};
  if (app.description !== undefined) ordered.description = app.description;
  if (app.icon !== undefined) ordered.icon = app.icon;
  if (app.icon_background !== undefined) ordered.icon_background = app.icon_background;
  if (app.mode !== undefined) ordered.mode = app.mode;
  if (app.name !== undefined) ordered.name = app.name;
  if (app.use_icon_as_answer_icon !== undefined) ordered.use_icon_as_answer_icon = app.use_icon_as_answer_icon;
  return ordered;
}

function orderWorkflowFields(workflow: any): any {
  const ordered: any = {};
  if (workflow.conversation_variables !== undefined) ordered.conversation_variables = workflow.conversation_variables;
  if (workflow.environment_variables !== undefined) ordered.environment_variables = workflow.environment_variables;
  if (workflow.features !== undefined) ordered.features = orderFeaturesFields(workflow.features);
  if (workflow.graph !== undefined) ordered.graph = orderGraphFields(workflow.graph);
  return ordered;
}

function orderFeaturesFields(features: any): any {
  if (!features) return {};
  const ordered: any = {};

  // file_upload: 只保留 image 子字段，不输出顶层 enabled
  if (features.file_upload) {
    const fu = features.file_upload;
    const orderedFu: any = {};
    if (fu.image) orderedFu.image = fu.image;
    ordered.file_upload = orderedFu;
  }

  if (features.opening_statement !== undefined) ordered.opening_statement = features.opening_statement;
  if (features.retriever_resource !== undefined) ordered.retriever_resource = features.retriever_resource;
  if (features.sensitive_word_avoidance !== undefined) ordered.sensitive_word_avoidance = features.sensitive_word_avoidance;
  if (features.speech_to_text !== undefined) ordered.speech_to_text = features.speech_to_text;
  if (features.suggested_questions !== undefined) ordered.suggested_questions = features.suggested_questions;
  if (features.suggested_questions_after_answer !== undefined) ordered.suggested_questions_after_answer = features.suggested_questions_after_answer;
  if (features.text_to_speech !== undefined) ordered.text_to_speech = features.text_to_speech;
  return ordered;
}

function orderGraphFields(graph: any): any {
  const ordered: any = {};
  // edges 在 nodes 前面
  if (graph.edges !== undefined) ordered.edges = graph.edges.map(orderEdgeFields);
  if (graph.nodes !== undefined) ordered.nodes = graph.nodes.map(orderNodeFields);
  if (graph.viewport !== undefined) ordered.viewport = graph.viewport;
  return ordered;
}

function orderNodeFields(node: any): any {
  const ordered: any = {};
  // data 在前面
  if (node.data !== undefined) ordered.data = node.data;
  if (node.height !== undefined) ordered.height = node.height;
  if (node.id !== undefined) ordered.id = node.id;
  if (node.position !== undefined) ordered.position = node.position;
  if (node.positionAbsolute !== undefined) ordered.positionAbsolute = node.positionAbsolute;
  if (node.selected !== undefined) ordered.selected = node.selected;
  if (node.sourcePosition !== undefined) ordered.sourcePosition = node.sourcePosition;
  if (node.targetPosition !== undefined) ordered.targetPosition = node.targetPosition;
  if (node.type !== undefined) ordered.type = node.type;
  if (node.width !== undefined) ordered.width = node.width;
  return ordered;
}

function orderEdgeFields(edge: any): any {
  const ordered: any = {};
  // data 在前面
  if (edge.data !== undefined) ordered.data = edge.data;
  if (edge.id !== undefined) ordered.id = edge.id;
  if (edge.source !== undefined) ordered.source = edge.source;
  if (edge.sourceHandle !== undefined) ordered.sourceHandle = edge.sourceHandle;
  if (edge.target !== undefined) ordered.target = edge.target;
  if (edge.targetHandle !== undefined) ordered.targetHandle = edge.targetHandle;
  if (edge.type !== undefined) ordered.type = edge.type;
  if (edge.zIndex !== undefined) ordered.zIndex = edge.zIndex;
  return ordered;
}

/* eslint-enable @typescript-eslint/no-explicit-any */

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
  const { indent = 2, lineWidth = 120, blockQuote = true } = options;

  // 按 Dify 期望的顺序排列字段
  const orderedDSL = orderDSLFields(dsl);

  return stringify(orderedDSL, {
    indent,
    lineWidth,
    blockQuote: blockQuote ? 'literal' : undefined,
    // 不使用引号，与 Dify 输出一致
    defaultStringType: 'PLAIN',
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
