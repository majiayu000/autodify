/**
 * Node Registry Types
 *
 * Defines metadata structures for Dify workflow nodes.
 */

import type { NodeType, OutputType, VariableType } from '../types/index.js';

/** 节点分类 */
export type NodeCategory = 'basic' | 'llm' | 'logic' | 'data' | 'tool' | 'advanced';

/** 端口定义 */
export interface PortDefinition {
  name: string;
  type: OutputType | VariableType | 'any';
  description: string;
  required?: boolean;
}

/** 配置字段定义 */
export interface ConfigField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'array' | 'object' | 'code' | 'template';
  description: string;
  required: boolean;
  default?: unknown;
  options?: string[];
  min?: number;
  max?: number;
}

/** 节点示例 */
export interface NodeExample {
  description: string;
  config: Record<string, unknown>;
}

/** 节点元信息 */
export interface NodeMeta {
  /** 节点类型 */
  type: NodeType;
  /** 显示名称 */
  displayName: string;
  /** 节点描述 */
  description: string;
  /** 节点分类 */
  category: NodeCategory;
  /** 输入端口 */
  inputs: PortDefinition[];
  /** 输出端口 */
  outputs: PortDefinition[];
  /** 配置字段 */
  configFields: ConfigField[];
  /** 使用示例 */
  examples: NodeExample[];
  /** 是否支持多输出（如 IF/ELSE, Question Classifier） */
  multipleOutputs?: boolean;
  /** 特殊说明 */
  notes?: string[];
}

/** 模型提供商信息 */
export interface ModelProvider {
  id: string;
  name: string;
  models: ModelInfo[];
}

/** 模型信息 */
export interface ModelInfo {
  id: string;
  name: string;
  contextWindow?: number;
  supportsVision?: boolean;
  supportsTools?: boolean;
}
