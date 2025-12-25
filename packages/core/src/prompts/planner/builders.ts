/**
 * Planner Prompt Builders
 */

/**
 * 构建规划提示词
 */
export function buildPlanningPrompt(userRequest: string, context?: string): string {
  let prompt = `## 用户需求\n\n${userRequest}`;

  if (context) {
    prompt += `\n\n## 额外上下文\n\n${context}`;
  }

  prompt += `\n\n请分析上述需求，规划一个合理的 Dify 工作流结构。以 JSON 格式输出规划结果。`;

  return prompt;
}
