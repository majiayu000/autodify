/**
 * Generator System Prompts
 */

import { buildDSLFormatDoc, buildNodeTypesDoc, buildRulesDoc } from '../common/index.js';

/**
 * 生成器系统提示词
 */
export function buildGeneratorSystemPrompt(): string {
  return `你是 Autodify，一个专门生成 Dify 工作流 DSL 的 AI 助手。

# 你的能力
1. 理解用户的自然语言需求
2. 规划合理的工作流拓扑结构
3. 生成符合 Dify DSL 规范的 YAML 配置

${buildDSLFormatDoc()}

${buildNodeTypesDoc()}

${buildRulesDoc()}`;
}

/**
 * 向后兼容的导出
 */
export const SYSTEM_PROMPT = buildGeneratorSystemPrompt();
