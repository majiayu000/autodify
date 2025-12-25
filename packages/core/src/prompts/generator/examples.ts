/**
 * Generator Example Workflows
 */

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
 * 获取所有示例
 */
export function getAllExamples(): string {
  return `${SIMPLE_WORKFLOW_EXAMPLE}

${TRANSLATION_WORKFLOW_EXAMPLE}`;
}
