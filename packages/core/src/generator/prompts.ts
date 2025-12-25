/**
 * Prompt Templates for DSL Generation
 */

/**
 * 系统提示词
 */
export const SYSTEM_PROMPT = `你是 Autodify，一个专门生成 Dify 工作流 DSL 的 AI 助手。

# 你的能力
1. 理解用户的自然语言需求
2. 规划合理的工作流拓扑结构
3. 生成符合 Dify DSL 规范的 YAML 配置

# Dify DSL 格式要求

## 顶级结构
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
\`\`\`

## 节点通用结构
\`\`\`yaml
- id: string (唯一标识，使用有意义的名称如 start, llm, end)
  type: "custom"
  data:
    type: 节点类型
    title: string
    desc: ""
    selected: false
    # ... 节点特定配置
\`\`\`

## 边结构
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

## 变量引用语法
使用 \`{{#节点ID.变量名#}}\` 格式引用其他节点的输出。

# 可用节点类型

## start (开始)
工作流入口，定义输入变量。
\`\`\`yaml
data:
  type: start
  title: 开始
  desc: ""
  variables:
    - variable: user_input
      label: 用户输入
      type: paragraph  # text-input | paragraph | select | number | file
      required: true
      max_length: 2000
      options: []
\`\`\`

## end (结束)
Workflow 模式的出口，定义输出。
\`\`\`yaml
data:
  type: end
  title: 结束
  desc: ""
  outputs:
    - variable: output
      value_selector:
        - llm  # 节点ID
        - text  # 变量名
\`\`\`

## answer (直接回复)
Chatflow (advanced-chat) 模式的回复节点。
\`\`\`yaml
data:
  type: answer
  title: 直接回复
  desc: ""
  answer: "{{#llm.text#}}"
  variables: []
\`\`\`

## llm (大语言模型)
调用 LLM 进行处理。
\`\`\`yaml
data:
  type: llm
  title: AI 对话
  desc: ""
  model:
    provider: openai  # openai | anthropic | deepseek | zhipuai
    name: gpt-4o  # 模型名称
    mode: chat
    completion_params:
      temperature: 0.7
  prompt_template:
    - role: system
      text: 系统提示词
    - role: user
      text: "{{#start.user_input#}}"
  context:
    enabled: false
    variable_selector: []
  vision:
    enabled: false
\`\`\`

## knowledge-retrieval (知识检索)
从知识库检索相关内容。
\`\`\`yaml
data:
  type: knowledge-retrieval
  title: 知识检索
  desc: ""
  query_variable_selector:
    - start
    - user_input
  dataset_ids:
    - dataset-xxx
  retrieval_mode: multiple
  multiple_retrieval_config:
    top_k: 5
    score_threshold: 0.5
    reranking_enable: true
\`\`\`

## if-else (条件分支)
条件判断。
\`\`\`yaml
data:
  type: if-else
  title: 条件判断
  desc: ""
  conditions:
    - id: cond-1
      logical_operator: and
      conditions:
        - variable_selector:
            - start
            - user_input
          comparison_operator: is not empty  # = | ≠ | contains | is empty | is not empty | > | <
          value: ""
\`\`\`
条件分支的边：sourceHandle 使用条件 ID (如 "cond-1") 或 "false"。

## code (代码执行)
执行 Python 或 JavaScript 代码。
\`\`\`yaml
data:
  type: code
  title: 代码执行
  desc: ""
  code_language: python3  # python3 | javascript
  code: |
    def main(text: str) -> dict:
        return {"result": text.upper()}
  variables:
    - variable: text
      value_selector:
        - start
        - user_input
  outputs:
    result:
      type: string  # string | number | object | array[string]
      children: null
\`\`\`

## http-request (HTTP 请求)
调用外部 API。
\`\`\`yaml
data:
  type: http-request
  title: API 调用
  desc: ""
  method: get  # get | post | put | delete
  url: https://api.example.com/v1/data
  authorization:
    type: no-auth  # no-auth | api-key | basic
    config: null
  headers: ""
  params: ""
  body:
    type: none  # none | json | form-data
    data: []
  timeout:
    max_connect_timeout: 0
    max_read_timeout: 0
    max_write_timeout: 0
  variables: []
\`\`\`

## agent (Agent)
使用 Agent 策略调用多个工具。
\`\`\`yaml
data:
  type: agent
  title: Agent
  desc: ""
  agent_strategy_provider_name: langgenius/agent/agent
  agent_strategy_name: function_calling
  agent_strategy_label: FunctionCalling
  agent_parameters:
    instruction:
      type: constant
      value: 根据用户需求调用工具
    model:
      type: constant
      value:
        provider: langgenius/openai/openai
        model: gpt-4o
        model_type: llm
        mode: chat
        completion_params: {}
    query:
      type: constant
      value: "{{#sys.query#}}"
    tools:
      type: constant
      value:
        - enabled: true
          provider_name: time
          tool_name: current_time
          tool_label: 获取当前时间
          type: builtin
          parameters: {}
          schemas: []
          settings: {}
\`\`\`

# 输出要求
1. 只输出有效的 YAML，不要包含任何解释
2. 节点 ID 使用有意义的名称（如 start, llm, end, answer, code）
3. 确保所有边的 source 和 target 都指向存在的节点
4. 变量引用必须正确（{{#节点ID.变量名#}}）
5. 必须有且仅有一个 start 节点
6. workflow 模式必须有 end 节点，advanced-chat 模式使用 answer 节点
7. version 使用 "0.1.3"`;

/**
 * 简单工作流示例
 */
export const SIMPLE_WORKFLOW_EXAMPLE = `# 示例：简单问答工作流

用户请求："创建一个简单的问答工作流"

输出：
\`\`\`yaml
app:
  description: 简单的 AI 问答工作流
  icon: 💬
  icon_background: "#FFEAD5"
  mode: workflow
  name: 简单问答
  use_icon_as_answer_icon: false
kind: app
version: 0.1.3
workflow:
  conversation_variables: []
  environment_variables: []
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
  graph:
    edges:
      - data:
          isInIteration: false
          sourceType: start
          targetType: llm
        id: start-source-llm-target
        source: start
        sourceHandle: source
        target: llm
        targetHandle: target
        type: custom
        zIndex: 0
      - data:
          isInIteration: false
          sourceType: llm
          targetType: end
        id: llm-source-end-target
        source: llm
        sourceHandle: source
        target: end
        targetHandle: target
        type: custom
        zIndex: 0
    nodes:
      - data:
          desc: ""
          selected: false
          title: 开始
          type: start
          variables:
            - label: 问题
              max_length: 2000
              options: []
              required: true
              type: paragraph
              variable: question
        id: start
        type: custom
      - data:
          context:
            enabled: false
            variable_selector: []
          desc: ""
          model:
            completion_params:
              temperature: 0.7
            mode: chat
            name: gpt-4o
            provider: openai
          prompt_template:
            - role: system
              text: 你是一个有帮助的 AI 助手。请简洁准确地回答用户的问题。
            - role: user
              text: "{{#start.question#}}"
          selected: false
          title: AI 回答
          type: llm
          vision:
            enabled: false
        id: llm
        type: custom
      - data:
          desc: ""
          outputs:
            - value_selector:
                - llm
                - text
              variable: answer
          selected: false
          title: 结束
          type: end
        id: end
        type: custom
    viewport:
      x: 0
      y: 0
      zoom: 1
\`\`\``;

/**
 * 翻译工作流示例
 */
export const TRANSLATION_WORKFLOW_EXAMPLE = `# 示例：翻译工作流

用户请求："创建一个中英互译的工作流"

输出：
\`\`\`yaml
app:
  description: 智能中英文互译工具
  icon: 🌐
  icon_background: "#FFEAD5"
  mode: workflow
  name: 中英互译
  use_icon_as_answer_icon: false
kind: app
version: 0.1.3
workflow:
  conversation_variables: []
  environment_variables: []
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
  graph:
    edges:
      - data:
          isInIteration: false
          sourceType: start
          targetType: llm
        id: start-source-llm-target
        source: start
        sourceHandle: source
        target: llm
        targetHandle: target
        type: custom
        zIndex: 0
      - data:
          isInIteration: false
          sourceType: llm
          targetType: end
        id: llm-source-end-target
        source: llm
        sourceHandle: source
        target: end
        targetHandle: target
        type: custom
        zIndex: 0
    nodes:
      - data:
          desc: ""
          selected: false
          title: 开始
          type: start
          variables:
            - label: 待翻译文本
              max_length: 5000
              options: []
              required: true
              type: paragraph
              variable: text
        id: start
        type: custom
      - data:
          context:
            enabled: false
            variable_selector: []
          desc: ""
          model:
            completion_params:
              temperature: 0.3
            mode: chat
            name: gpt-4o
            provider: openai
          prompt_template:
            - role: system
              text: |
                你是专业翻译。请判断输入文本的语言：
                - 如果是中文，翻译成英文
                - 如果是英文，翻译成中文
                - 如果是其他语言，翻译成中文

                只输出翻译结果，不要解释。
            - role: user
              text: "{{#start.text#}}"
          selected: false
          title: 翻译
          type: llm
          vision:
            enabled: false
        id: llm
        type: custom
      - data:
          desc: ""
          outputs:
            - value_selector:
                - llm
                - text
              variable: translation
          selected: false
          title: 输出
          type: end
        id: end
        type: custom
    viewport:
      x: 0
      y: 0
      zoom: 1
\`\`\``;

/**
 * 构建生成提示词
 */
export function buildGenerationPrompt(userRequest: string): string {
  return `${SYSTEM_PROMPT}

${SIMPLE_WORKFLOW_EXAMPLE}

${TRANSLATION_WORKFLOW_EXAMPLE}

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
