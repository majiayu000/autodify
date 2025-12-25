/**
 * Common DSL Format Documentation
 */

/**
 * DSL 顶级结构说明
 */
export const DSL_TOP_LEVEL_STRUCTURE = `## DSL 顶级结构
\`\`\`yaml
version: "0.5.0"
kind: "app"
app:
  name: "工作流名称"
  mode: "workflow"
  icon: "🤖"
  icon_type: "emoji"
  description: "工作流描述"
workflow:
  graph:
    nodes: []
    edges: []
  features:
    file_upload:
      enabled: false
    text_to_speech:
      enabled: false
\`\`\``;

/**
 * 节点通用结构说明
 */
export const NODE_STRUCTURE = `## 节点通用结构
\`\`\`yaml
- id: string (唯一标识，使用有意义的名称如 start, llm, end)
  type: "custom"
  data:
    type: 节点类型
    title: string
    desc: ""
    selected: false
    # ... 节点特定配置
\`\`\``;

/**
 * 边结构说明
 */
export const EDGE_STRUCTURE = `## 边结构
\`\`\`yaml
- id: "source节点ID-source-target节点ID-target"
  source: 源节点ID
  sourceHandle: "source"
  target: 目标节点ID
  targetHandle: "target"
  type: "custom"
  zIndex: 0
  data:
    sourceType: 源节点类型
    targetType: 目标节点类型
    isInIteration: false
\`\`\`

对于分支节点，sourceHandle 需要指定分支 ID：
\`\`\`yaml
- id: "condition-case1-target-target"
  source: condition
  sourceHandle: case1
  target: target
  targetHandle: target
\`\`\``;

/**
 * 变量引用语法说明
 */
export const VARIABLE_REFERENCE = `## 变量引用语法
使用 \`{{#节点ID.变量名#}}\` 格式引用其他节点的输出。

示例：
- {{#start.user_input#}} - 引用开始节点的 user_input 变量
- {{#llm.text#}} - 引用 LLM 节点的输出文本
- {{#retrieval.result#}} - 引用知识检索节点的结果`;

/**
 * 完整的 DSL 示例
 */
export const COMPLETE_DSL_EXAMPLE = `## 完整示例

以下是一个简单问答工作流的完整 DSL：

\`\`\`yaml
version: "0.5.0"
kind: app
app:
  name: 简单问答
  mode: workflow
  icon: "💬"
  icon_type: emoji
  description: 基础的问答工作流
workflow:
  graph:
    nodes:
      - id: start
        type: custom
        data:
          type: start
          title: 开始
          variables:
            - variable: question
              label: 问题
              type: paragraph
              required: true
              max_length: 2000
      - id: llm
        type: custom
        data:
          type: llm
          title: AI 回答
          model:
            provider: openai
            name: gpt-4o
            mode: chat
            completion_params:
              temperature: 0.7
              max_tokens: 4096
          prompt_template:
            - role: system
              text: 你是一个有帮助的 AI 助手。
            - role: user
              text: "{{#start.question#}}"
      - id: end
        type: custom
        data:
          type: end
          title: 结束
          outputs:
            - variable: answer
              value_selector:
                - llm
                - text
    edges:
      - id: start-llm
        source: start
        sourceHandle: source
        target: llm
        targetHandle: target
        type: custom
        data:
          sourceType: start
          targetType: llm
      - id: llm-end
        source: llm
        sourceHandle: source
        target: end
        targetHandle: target
        type: custom
        data:
          sourceType: llm
          targetType: end
  features:
    file_upload:
      enabled: false
    text_to_speech:
      enabled: false
\`\`\``;
