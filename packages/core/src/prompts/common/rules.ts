/**
 * Common Rules and Requirements
 */

/**
 * DSL 输出要求
 */
export const OUTPUT_REQUIREMENTS = `# 输出要求
1. 只输出有效的 YAML，不要包含任何解释
2. 节点 ID 使用有意义的名称（如 start, llm, end, answer, code）
3. 确保所有边的 source 和 target 都指向存在的节点
4. 变量引用必须正确（{{#节点ID.变量名#}}）
5. 必须有且仅有一个 start 节点
6. workflow 模式必须有 end 节点，advanced-chat 模式使用 answer 节点
7. version 使用 "0.1.3"`;

/**
 * 工作流设计原则
 */
export const DESIGN_PRINCIPLES = `# 设计原则

1. **简洁优先**：在满足需求的前提下，使用最少的节点
2. **清晰连接**：确保节点之间的连接关系清晰合理
3. **合理分支**：条件分支要有明确的判断逻辑
4. **错误处理**：考虑可能的错误情况
5. **变量命名**：使用有意义的变量名
6. **一致性**：保持命名和结构的一致性`;

/**
 * 工作流验证规则
 */
export const VALIDATION_RULES = `# 验证规则

1. 所有节点 ID 必须唯一
2. 边必须连接存在的节点
3. 变量引用必须指向有效的节点和变量
4. 工作流必须有且只有一个 start 节点
5. 工作流必须至少有一个 end 或 answer 节点
6. 不能有孤立节点（除了 start 节点，每个节点都应该有入边）
7. 不能有循环依赖（除非使用 loop 或 iteration 节点）`;

/**
 * 编辑原则
 */
export const EDIT_PRINCIPLES = `# 编辑原则

1. **最小改动**: 只修改需要改动的部分，保持其他配置不变
2. **保持一致性**: 确保修改后的节点 ID、变量引用保持一致
3. **验证连接**: 添加或删除节点时，确保边的连接正确
4. **保留配置**: 不要删除或修改用户没有要求改动的配置`;
