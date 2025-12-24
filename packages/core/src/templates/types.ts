/**
 * Template Types
 */

import type { DifyDSL } from '../types/index.js';

/** 模板分类 */
export type TemplateCategory =
  | 'qa'           // 问答
  | 'rag'          // 知识库问答
  | 'translation'  // 翻译
  | 'writing'      // 写作
  | 'analysis'     // 分析
  | 'automation'   // 自动化
  | 'agent'        // Agent
  | 'other';       // 其他

/** 模板元信息 */
export interface TemplateMetadata {
  /** 模板 ID */
  id: string;
  /** 模板名称 */
  name: string;
  /** 模板描述 */
  description: string;
  /** 分类 */
  category: TemplateCategory;
  /** 标签 */
  tags: string[];
  /** 适用场景关键词 */
  keywords: string[];
  /** 包含的节点类型 */
  nodeTypes: string[];
  /** 复杂度: 1-5 */
  complexity: number;
}

/** 模板定义 */
export interface WorkflowTemplate {
  metadata: TemplateMetadata;
  /** DSL 生成函数 */
  build: (params?: Record<string, unknown>) => DifyDSL;
}

/** 模板匹配结果 */
export interface TemplateMatch {
  template: WorkflowTemplate;
  score: number;
  matchedKeywords: string[];
}
