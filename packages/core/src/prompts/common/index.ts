/**
 * Common Prompt Components
 */

export * from './dsl-format.js';
export * from './node-types.js';
export * from './rules.js';

import {
  DSL_TOP_LEVEL_STRUCTURE,
  NODE_STRUCTURE,
  EDGE_STRUCTURE,
  VARIABLE_REFERENCE,
  COMPLETE_DSL_EXAMPLE,
} from './dsl-format.js';
import { getNodeTypesDocumentation } from './node-types.js';
import { OUTPUT_REQUIREMENTS, DESIGN_PRINCIPLES, VALIDATION_RULES } from './rules.js';

/**
 * 构建完整的 DSL 格式文档
 */
export function buildDSLFormatDoc(): string {
  return `# Dify DSL 格式要求

${DSL_TOP_LEVEL_STRUCTURE}

${NODE_STRUCTURE}

${EDGE_STRUCTURE}

${VARIABLE_REFERENCE}

${COMPLETE_DSL_EXAMPLE}`;
}

/**
 * 构建完整的节点类型文档
 */
export function buildNodeTypesDoc(types?: string[]): string {
  return getNodeTypesDocumentation(types);
}

/**
 * 构建完整的规则文档
 */
export function buildRulesDoc(): string {
  return `${OUTPUT_REQUIREMENTS}

${DESIGN_PRINCIPLES}

${VALIDATION_RULES}`;
}
