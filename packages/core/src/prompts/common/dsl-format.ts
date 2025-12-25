/**
 * Common DSL Format Documentation
 */

/**
 * DSL 顶级结构说明
 */
export const DSL_TOP_LEVEL_STRUCTURE = `## DSL 顶级结构
\`\`\`yaml
version: "0.1.3"
kind: "app"
app:
  name: string
  mode: "workflow"  # workflow | advanced-chat
  icon: string (emoji)
  icon_background: "#FFEAD5"
  description: string
  use_icon_as_answer_icon: false
workflow:
  conversation_variables: []
  environment_variables: []
  graph:
    nodes: []
    edges: []
    viewport:
      x: 0
      y: 0
      zoom: 1
  features:
    file_upload:
      enabled: false
      image:
        enabled: false
        number_limits: 3
        transfer_methods:
          - local_file
          - remote_url
    opening_statement: ""
    retriever_resource:
      enabled: true
    sensitive_word_avoidance:
      enabled: false
    speech_to_text:
      enabled: false
    suggested_questions: []
    suggested_questions_after_answer:
      enabled: false
    text_to_speech:
      enabled: false
      language: ""
      voice: ""
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
- {{#retrieval.result#}} - 引用知识检索节点的结果
- {{#sys.query#}} - 引用系统变量 query`;
