/**
 * Generator Prompt Builders
 */

import { buildGeneratorSystemPrompt } from './system.js';
import { getAllExamples } from './examples.js';

/**
 * 构建生成提示词
 */
export function buildGenerationPrompt(userRequest: string): string {
  return `${buildGeneratorSystemPrompt()}

${getAllExamples()}

# 用户请求
${userRequest}

# 输出
请根据用户请求生成符合 Dify DSL 规范的 YAML。只输出 YAML 代码，不要包含 \`\`\`yaml 标记或任何解释。`;
}

/**
 * 构建修复提示词
 */
export function buildFixPrompt(yaml: string, errors: string[]): string {
  return `以下 Dify DSL YAML 存在错误，请修复：

原始 YAML：
\`\`\`yaml
${yaml}
\`\`\`

错误信息：
${errors.map((e) => `- ${e}`).join('\n')}

请输出修复后的完整 YAML，不要包含 \`\`\`yaml 标记或任何解释。`;
}
