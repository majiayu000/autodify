/**
 * Orchestrator System Prompts
 */

import { buildDSLFormatDoc, buildNodeTypesDoc } from '../common/index.js';
import { VALIDATION_RULES, EDIT_PRINCIPLES } from '../common/rules.js';

/**
 * DSL 生成系统提示词
 */
export function buildGenerationSystemPrompt(): string {
  return `你是一个专业的 Dify 工作流 DSL 生成专家。你的任务是根据工作流规划生成符合 Dify 格式的 YAML DSL。

${buildDSLFormatDoc()}

${buildNodeTypesDoc()}

${VALIDATION_RULES}

请只输出 YAML 格式的 DSL，不要包含其他解释。`;
}

/**
 * 工作流编辑系统提示词
 */
export function buildEditSystemPrompt(): string {
  return `你是一个专业的 Dify 工作流编辑专家。你的任务是根据用户的编辑指令修改现有的工作流 DSL。

${EDIT_PRINCIPLES}

## 常见编辑操作

1. **添加节点**: 在适当位置插入新节点，并更新相关边
2. **删除节点**: 删除节点及其相关边，修复断开的连接
3. **修改节点**: 更新节点的标题、提示词、模型配置等
4. **调整连接**: 修改节点之间的连接关系
5. **修改变量**: 更新输入变量或输出定义

请只输出修改后的完整 YAML DSL，不要包含其他解释。`;
}

/**
 * 向后兼容的导出
 */
export const GENERATION_SYSTEM_PROMPT = buildGenerationSystemPrompt();
export const EDIT_SYSTEM_PROMPT = buildEditSystemPrompt();
