/**
 * Node Types Documentation
 */

/**
 * start 节点说明
 */
export const NODE_TYPE_START = `### start (开始)
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
\`\`\``;

/**
 * end 节点说明
 */
export const NODE_TYPE_END = `### end (结束)
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
\`\`\``;

/**
 * answer 节点说明
 */
export const NODE_TYPE_ANSWER = `### answer (直接回复)
Chatflow (advanced-chat) 模式的回复节点。
\`\`\`yaml
data:
  type: answer
  title: 直接回复
  desc: ""
  answer: "{{#llm.text#}}"
  variables: []
\`\`\``;

/**
 * llm 节点说明
 */
export const NODE_TYPE_LLM = `### llm (大语言模型)
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
      max_tokens: 4096
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
\`\`\``;

/**
 * knowledge-retrieval 节点说明
 */
export const NODE_TYPE_KNOWLEDGE_RETRIEVAL = `### knowledge-retrieval (知识检索)
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
\`\`\``;

/**
 * if-else 节点说明
 */
export const NODE_TYPE_IF_ELSE = `### if-else (条件分支)
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
条件分支的边：sourceHandle 使用条件 ID (如 "cond-1") 或 "false"。`;

/**
 * code 节点说明
 */
export const NODE_TYPE_CODE = `### code (代码执行)
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
\`\`\``;

/**
 * http-request 节点说明
 */
export const NODE_TYPE_HTTP_REQUEST = `### http-request (HTTP 请求)
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
\`\`\``;

/**
 * agent 节点说明
 */
export const NODE_TYPE_AGENT = `### agent (Agent)
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
\`\`\``;

/**
 * 所有节点类型列表
 */
export const ALL_NODE_TYPES = [
  'start',
  'end',
  'answer',
  'llm',
  'knowledge-retrieval',
  'question-classifier',
  'if-else',
  'code',
  'template-transform',
  'variable-aggregator',
  'variable-assigner',
  'iteration',
  'loop',
  'parameter-extractor',
  'http-request',
  'tool',
  'agent',
  'document-extractor',
  'list-operator',
] as const;

/**
 * 获取完整的节点类型文档
 */
export function getNodeTypesDocumentation(types?: string[]): string {
  const docs = [
    NODE_TYPE_START,
    NODE_TYPE_END,
    NODE_TYPE_ANSWER,
    NODE_TYPE_LLM,
    NODE_TYPE_KNOWLEDGE_RETRIEVAL,
    NODE_TYPE_IF_ELSE,
    NODE_TYPE_CODE,
    NODE_TYPE_HTTP_REQUEST,
    NODE_TYPE_AGENT,
  ];

  return `# 可用节点类型\n\n${docs.join('\n\n')}`;
}
