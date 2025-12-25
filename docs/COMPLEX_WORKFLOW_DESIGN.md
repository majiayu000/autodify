# 复杂工作流生成方案设计

## 问题分析

当前 LLM 直接生成复杂 DSL 存在以下问题：

1. **YAML 格式错误** - 特殊字符未转义，如引号嵌套
2. **Schema 不匹配** - 复杂节点结构不符合 Zod schema
3. **一次性生成** - 整体生成失败率高
4. **修复效率低** - 错误反馈不精确，修复成功率低

## 解决方案架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    Multi-Stage DSL Generator                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Stage 1: Intent Analysis                                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ NL Prompt   │───>│ LLM Analyze │───>│ Node Plan   │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                  │
│  Stage 2: Node-by-Node Generation (with Structured Output)       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Node Plan   │───>│ Generate    │───>│ Validate    │──┐      │
│  └─────────────┘    │ (JSON mode) │    │ (Zod)       │  │      │
│                     └─────────────┘    └─────────────┘  │      │
│                           ▲                    │         │      │
│                           └────── Retry ◄──────┘         │      │
│                                                          │      │
│  Stage 3: Edge Connection                                │      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │      │
│  │ Valid Nodes │◄───│ Infer Edges │◄───│ Data Flow   │◄─┘      │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                  │
│  Stage 4: Assembly & Final Validation                            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Assemble    │───>│ Full Valid  │───>│ YAML Output │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 核心策略

### 1. 结构化输出（JSON 优先）

**问题**: YAML 格式容易出现转义错误
**方案**: LLM 生成 JSON 对象，程序转换为 YAML

```typescript
// 使用 LLM 的 JSON mode 或 response_format
const response = await llm.chat(messages, {
  responseFormat: { type: 'json_object' }
});
```

### 2. 节点级生成与验证

**问题**: 一次性生成整个 DSL 失败率高
**方案**: 逐个节点生成，每个节点独立验证

```typescript
for (const nodePlan of plan.nodes) {
  const node = await generateNode(nodePlan);
  const validation = NodeDataSchema.safeParse(node.data);
  if (!validation.success) {
    node = await retryWithFeedback(nodePlan, validation.error);
  }
  nodes.push(node);
}
```

### 3. 节点模板 + 变量填充

**问题**: 复杂节点结构 LLM 难以正确生成
**方案**: 提供预验证的节点骨架，LLM 只填充变量部分

```typescript
const IF_ELSE_TEMPLATE = {
  type: 'if-else',
  title: '{{title}}',
  conditions: [
    {
      id: '{{condition_id}}',
      logical_operator: 'and',
      conditions: [
        {
          variable_selector: ['{{source_node}}', '{{variable}}'],
          comparison_operator: '{{operator}}',
          value: '{{value}}'
        }
      ]
    }
  ]
};
```

### 4. 智能重试机制

**问题**: 简单重试效率低
**方案**: 将具体错误信息和正确示例反馈给 LLM

```typescript
const retryPrompt = `
生成的节点验证失败:
错误: ${error.message}
路径: ${error.path}

正确格式示例:
${correctExample}

请修正并重新生成。
`;
```

### 5. 边自动推断

**问题**: 边的 sourceHandle/targetHandle 复杂
**方案**: 根据节点类型和数据流自动推断边

```typescript
function inferEdges(nodes: Node[]): Edge[] {
  // 分析节点间的变量依赖
  // 自动生成正确的 handle
}
```

## 节点类型分级

| 复杂度 | 节点类型 | 生成策略 |
|--------|----------|----------|
| 简单 | start, end, answer | 直接生成 |
| 中等 | llm, knowledge-retrieval | JSON 模式 + 验证 |
| 复杂 | if-else, question-classifier | 模板填充 |
| 高级 | code, http-request, iteration | 分步生成 + 严格验证 |

## 实现计划

### Phase 1: 结构化输出生成器
- 实现 JSON 模式调用
- 节点级 Zod 验证
- 智能重试机制

### Phase 2: 节点模板系统
- 复杂节点骨架模板
- 变量提取与填充
- 模板验证

### Phase 3: 边自动推断
- 数据流分析
- Handle 映射规则
- 分支节点特殊处理

### Phase 4: 集成与优化
- 完整 Pipeline 集成
- 性能优化
- 错误恢复

## 参考资源

- [Instructor Library](https://github.com/instructor-ai/instructor) - 结构化输出验证
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) - JSON Schema 约束
- [Awesome-Dify-Workflow](https://github.com/svcvit/Awesome-Dify-Workflow) - DSL 示例
- [LangGraph Structured Output](https://docs.langchain.com/oss/python/langgraph/workflows-agents) - 工作流状态管理
