# Dify DSL 格式规范参考

> 本文档详细描述 Dify 工作流 DSL 的完整格式规范，供 Autodify 开发参考。

## 1. DSL 版本与兼容性

| 版本          | 说明             |
| ------------- | ---------------- |
| 0.5.0         | 当前最新版本     |
| 0.1.0 - 0.1.5 | 旧版本，自动兼容 |

```yaml
version: '0.5.0' # 必填，字符串类型
kind: 'app' # 必填，固定值
```

---

## 2. 顶级结构

```yaml
version: '0.5.0'
kind: 'app'

app: # 应用元信息
  name: string # 应用名称
  mode: string # 应用模式
  icon: string # 图标
  icon_type: string # 图标类型
  icon_background: string # 图标背景色
  description: string # 描述
  use_icon_as_answer_icon: boolean

workflow: # workflow/advanced-chat 模式必填
  graph:
    nodes: Node[]
    edges: Edge[]
  features: Features
  environment_variables: Variable[]
  conversation_variables: Variable[]

model_config: # chat/agent-chat/completion 模式必填
  # ...

dependencies: # 插件依赖（可选）
  - provider: string
```

---

## 3. App 配置

### 3.1 mode 取值

| 值              | 说明                     |
| --------------- | ------------------------ |
| `workflow`      | 工作流应用               |
| `advanced-chat` | 高级对话应用（Chatflow） |
| `chat`          | 简单对话应用             |
| `agent-chat`    | Agent 对话应用           |
| `completion`    | 文本生成应用             |

### 3.2 icon_type 取值

| 值      | 说明       |
| ------- | ---------- |
| `emoji` | Emoji 表情 |
| `image` | 上传图片   |
| `link`  | 图片 URL   |

### 3.3 完整示例

```yaml
app:
  name: '智能客服助手'
  mode: 'workflow'
  icon: '🤖'
  icon_type: 'emoji'
  icon_background: '#FFEAD5'
  description: '基于知识库的智能问答系统'
  use_icon_as_answer_icon: false
```

---

## 4. Workflow Graph 结构

### 4.1 Nodes 数组

每个节点的通用结构：

```yaml
nodes:
  - id: string # 唯一标识，通常为时间戳字符串
    type: 'custom' # 固定值
    data:
      type: NodeType # 节点类型
      title: string # 显示标题
      desc: string # 描述（可选）
      # ... 节点特定配置
    position: # 画布位置（可选，导入时自动布局）
      x: number
      y: number
    width: number # 节点宽度（可选）
    height: number # 节点高度（可选）
```

### 4.2 Edges 数组

```yaml
edges:
  - id: string # 唯一标识
    source: string # 源节点 ID
    sourceHandle: string # 源节点出口
    target: string # 目标节点 ID
    targetHandle: string # 目标节点入口
    type: 'custom' # 固定值
    zIndex: number # 层级（默认 0）
    data:
      sourceType: string # 源节点类型
      targetType: string # 目标节点类型
      isInIteration: boolean
      isInLoop: boolean
      iterationID: string # 如果在迭代中，迭代节点 ID
```

---

## 5. 节点类型详解

### 5.1 Start 节点

工作流入口，定义输入变量。

```yaml
- id: 'start-001'
  type: 'custom'
  data:
    type: 'start'
    title: '开始'
    variables:
      - variable: string # 变量名
        label: string # 显示标签
        type: VariableType # 变量类型
        required: boolean # 是否必填
        max_length: number # 最大长度（text-input/paragraph）
        options: string[] # 选项列表（select）
        default: any # 默认值
```

**VariableType 取值：**

| 类型         | 说明     | 特有配置                                    |
| ------------ | -------- | ------------------------------------------- |
| `text-input` | 单行文本 | max_length                                  |
| `paragraph`  | 多行文本 | max_length                                  |
| `select`     | 下拉选择 | options                                     |
| `number`     | 数字     | -                                           |
| `file`       | 单文件   | allowed_file_types, allowed_file_extensions |
| `file-list`  | 多文件   | allowed_file_types, allowed_file_extensions |

**示例：**

```yaml
- id: 'start'
  data:
    type: 'start'
    title: '开始'
    variables:
      - variable: 'user_query'
        label: '用户问题'
        type: 'paragraph'
        required: true
        max_length: 2000
      - variable: 'language'
        label: '目标语言'
        type: 'select'
        required: true
        options:
          - '中文'
          - '英文'
          - '日文'
        default: '英文'
```

---

### 5.2 End 节点

工作流出口，定义输出。

```yaml
- id: 'end-001'
  data:
    type: 'end'
    title: '结束'
    outputs:
      - variable: string # 输出变量名
        value_selector: # 值来源
          - string # 节点 ID
          - string # 变量名
```

**示例：**

```yaml
- id: 'end'
  data:
    type: 'end'
    title: '输出结果'
    outputs:
      - variable: 'answer'
        value_selector:
          - 'llm-001'
          - 'text'
      - variable: 'sources'
        value_selector:
          - 'retrieval-001'
          - 'result'
```

---

### 5.3 Answer 节点（Chatflow 专用）

流式输出节点，用于对话场景。

```yaml
- id: 'answer-001'
  data:
    type: 'answer'
    title: '回答'
    answer: '{{#llm-001.text#}}' # 支持变量模板
```

---

### 5.4 LLM 节点

调用大语言模型。

```yaml
- id: "llm-001"
  data:
    type: "llm"
    title: "GPT 对话"
    model:
      provider: string          # 模型提供商
      name: string              # 模型名称
      mode: "chat"              # chat | completion
      completion_params:
        temperature: number     # 0-2，默认 0.7
        top_p: number           # 0-1
        max_tokens: number      # 最大 token 数
        presence_penalty: number
        frequency_penalty: number
        stop: string[]          # 停止词
    prompt_template:            # 提示词模板
      - role: "system" | "user" | "assistant"
        text: string            # 支持 {{#node.var#}} 变量
        edition_type: "basic" | "jinja2"  # 模板类型
    memory:                     # 对话记忆（可选）
      role_prefix:
        user: string
        assistant: string
      window:
        enabled: boolean
        size: number
    context:                    # 上下文配置（可选）
      enabled: boolean
      variable_selector:
        - string
        - string
    vision:                     # 视觉能力（可选）
      enabled: boolean
      configs:
        variable_selector:
          - string
          - string
        detail: "low" | "high"
```

**常用模型 provider + name 组合：**

| Provider    | Model Name                   | 说明                    |
| ----------- | ---------------------------- | ----------------------- |
| `openai`    | `gpt-4o`                     | GPT-4o (旗舰多模态模型) |
| `openai`    | `gpt-4o-mini`                | GPT-4o Mini (轻量版)    |
| `openai`    | `gpt-4-turbo`                | GPT-4 Turbo             |
| `openai`    | `gpt-4`                      | GPT-4                   |
| `openai`    | `gpt-3.5-turbo`              | GPT-3.5 Turbo           |
| `openai`    | `o1`                         | O1 (推理模型)           |
| `openai`    | `o1-preview`                 | O1 Preview              |
| `openai`    | `o1-mini`                    | O1 Mini                 |
| `anthropic` | `claude-3-5-sonnet-20241022` | Claude 3.5 Sonnet       |
| `anthropic` | `claude-3-opus-20240229`     | Claude 3 Opus           |
| `anthropic` | `claude-3-sonnet-20240229`   | Claude 3 Sonnet         |
| `anthropic` | `claude-3-haiku-20240307`    | Claude 3 Haiku          |
| `deepseek`  | `deepseek-chat`              | DeepSeek Chat           |
| `deepseek`  | `deepseek-coder`             | DeepSeek Coder          |
| `zhipuai`   | `glm-4`                      | 智谱 GLM-4              |
| `zhipuai`   | `glm-4-plus`                 | GLM-4 Plus (增强版)     |
| `zhipuai`   | `glm-4-air`                  | GLM-4 Air (轻量版)      |
| `zhipuai`   | `glm-4-flash`                | GLM-4 Flash (极速版)    |
| `zhipuai`   | `glm-4v`                     | GLM-4V (视觉模型)       |

**完整示例：**

```yaml
- id: 'llm-001'
  data:
    type: 'llm'
    title: '智能翻译'
    model:
      provider: 'openai'
      name: 'gpt-4o'
      mode: 'chat'
      completion_params:
        temperature: 0.3
        max_tokens: 4000
    prompt_template:
      - role: 'system'
        text: |
          你是一个专业翻译。请将用户输入的文本翻译成{{#start.language#}}。
          要求：
          1. 保持原文的语气和风格
          2. 专业术语翻译准确
          3. 只输出翻译结果，不要解释
      - role: 'user'
        text: '{{#start.user_query#}}'
```

---

### 5.5 Knowledge Retrieval 节点

知识库检索。

```yaml
- id: "retrieval-001"
  data:
    type: "knowledge-retrieval"
    title: "知识检索"
    query_variable_selector:    # 查询变量
      - string                  # 节点 ID
      - string                  # 变量名
    dataset_ids:                # 知识库 ID 列表
      - string
    retrieval_mode: "single" | "multiple"
    single_retrieval_config:    # single 模式配置
      model:
        provider: string
        name: string
    multiple_retrieval_config:  # multiple 模式配置
      top_k: number             # 返回条数
      score_threshold: number   # 分数阈值
      score_threshold_enabled: boolean
      reranking_model:          # 重排序模型
        provider: string
        model: string
      reranking_enable: boolean
```

**示例：**

```yaml
- id: 'retrieval-001'
  data:
    type: 'knowledge-retrieval'
    title: '产品文档检索'
    query_variable_selector:
      - 'start'
      - 'user_query'
    dataset_ids:
      - 'dataset-abc123'
      - 'dataset-def456'
    retrieval_mode: 'multiple'
    multiple_retrieval_config:
      top_k: 5
      score_threshold: 0.5
      score_threshold_enabled: true
      reranking_enable: true
      reranking_model:
        provider: 'cohere'
        model: 'rerank-multilingual-v2.0'
```

---

### 5.6 Question Classifier 节点

问题分类器，基于 LLM 将问题路由到不同分支。

```yaml
- id: 'classifier-001'
  data:
    type: 'question-classifier'
    title: '意图分类'
    query_variable_selector:
      - string
      - string
    model:
      provider: string
      name: string
      mode: 'chat'
      completion_params:
        temperature: number
    classes: # 分类列表
      - id: string # 分类 ID（用于 edge sourceHandle）
        name: string # 分类名称
    instruction: string # 分类指令（可选）
```

**示例：**

```yaml
- id: 'classifier-001'
  data:
    type: 'question-classifier'
    title: '问题分类'
    query_variable_selector:
      - 'start'
      - 'user_query'
    model:
      provider: 'openai'
      name: 'gpt-4o-mini'
      mode: 'chat'
      completion_params:
        temperature: 0
    classes:
      - id: 'product'
        name: '产品咨询'
      - id: 'tech'
        name: '技术支持'
      - id: 'complaint'
        name: '投诉建议'
      - id: 'other'
        name: '其他'
    instruction: '根据用户问题的内容，判断其属于哪个类别。'
```

**对应的 edges：**

```yaml
edges:
  - source: 'classifier-001'
    sourceHandle: 'product' # 对应 classes[].id
    target: 'llm-product'
  - source: 'classifier-001'
    sourceHandle: 'tech'
    target: 'llm-tech'
  # ...
```

---

### 5.7 IF/ELSE 条件节点

条件分支逻辑。

```yaml
- id: "ifelse-001"
  data:
    type: "if-else"
    title: "条件判断"
    conditions:
      - id: string              # 条件分支 ID
        logical_operator: "and" | "or"
        conditions:
          - variable_selector:
              - string
              - string
            comparison_operator: ComparisonOperator
            value: any
```

**ComparisonOperator 取值：**

| 操作符         | 说明       | 适用类型 |
| -------------- | ---------- | -------- |
| `=`            | 等于       | 所有     |
| `≠`            | 不等于     | 所有     |
| `contains`     | 包含       | 字符串   |
| `not contains` | 不包含     | 字符串   |
| `start with`   | 以...开头  | 字符串   |
| `end with`     | 以...结尾  | 字符串   |
| `is empty`     | 为空       | 所有     |
| `is not empty` | 不为空     | 所有     |
| `>`            | 大于       | 数字     |
| `<`            | 小于       | 数字     |
| `≥`            | 大于等于   | 数字     |
| `≤`            | 小于等于   | 数字     |
| `in`           | 在列表中   | 数组     |
| `not in`       | 不在列表中 | 数组     |

**示例：**

```yaml
- id: 'ifelse-001'
  data:
    type: 'if-else'
    title: '检查是否为空'
    conditions:
      - id: 'cond-1'
        logical_operator: 'and'
        conditions:
          - variable_selector:
              - 'start'
              - 'user_query'
            comparison_operator: 'is not empty'
            value: ''
          - variable_selector:
              - 'start'
              - 'user_query'
            comparison_operator: '>'
            value: '10' # 长度大于 10
```

**对应的 edges：**

```yaml
edges:
  - source: 'ifelse-001'
    sourceHandle: 'cond-1' # 条件满足
    target: 'next-node'
  - source: 'ifelse-001'
    sourceHandle: 'false' # else 分支
    target: 'fallback-node'
```

---

### 5.8 Code 代码节点

执行自定义代码。

```yaml
- id: "code-001"
  data:
    type: "code"
    title: "数据处理"
    code_language: "python3" | "javascript"
    code: string                # 代码内容
    variables:                  # 输入变量映射
      - variable: string        # 代码中的变量名
        value_selector:
          - string
          - string
    outputs:                    # 输出变量定义
      - variable: string        # 输出变量名
        variable_type: OutputType
```

**OutputType 取值：**

| 类型            | 说明       |
| --------------- | ---------- |
| `string`        | 字符串     |
| `number`        | 数字       |
| `object`        | 对象/字典  |
| `array[string]` | 字符串数组 |
| `array[number]` | 数字数组   |
| `array[object]` | 对象数组   |

**Python 示例：**

```yaml
- id: 'code-001'
  data:
    type: 'code'
    title: '提取关键词'
    code_language: 'python3'
    code: |
      import json

      def main(text: str) -> dict:
          # 简单分词
          words = text.split()
          # 统计词频
          freq = {}
          for word in words:
              freq[word] = freq.get(word, 0) + 1
          # 返回前 10 个高频词
          top_words = sorted(freq.items(), key=lambda x: -x[1])[:10]
          return {
              "keywords": [w[0] for w in top_words],
              "count": len(words)
          }
    variables:
      - variable: 'text'
        value_selector:
          - 'start'
          - 'user_query'
    outputs:
      - variable: 'keywords'
        variable_type: 'array[string]'
      - variable: 'count'
        variable_type: 'number'
```

**JavaScript 示例：**

```yaml
- id: 'code-002'
  data:
    type: 'code'
    title: '格式化输出'
    code_language: 'javascript'
    code: |
      function main(items) {
        return {
          formatted: items.map((item, i) => `${i + 1}. ${item}`).join('\n'),
          total: items.length
        };
      }
    variables:
      - variable: 'items'
        value_selector:
          - 'retrieval-001'
          - 'result'
    outputs:
      - variable: 'formatted'
        variable_type: 'string'
      - variable: 'total'
        variable_type: 'number'
```

---

### 5.9 HTTP Request 节点

调用外部 API。

```yaml
- id: "http-001"
  data:
    type: "http-request"
    title: "调用 API"
    method: "get" | "post" | "put" | "patch" | "delete" | "head"
    url: string                 # 支持变量模板
    authorization:
      type: "no-auth" | "api-key" | "basic"
      config:
        type: "bearer" | "basic" | "custom"
        api_key: string         # Bearer token
        header: string          # 自定义 header 名
        username: string        # Basic auth
        password: string
    headers:
      - key: string
        value: string
    params:                     # URL 参数
      - key: string
        value: string
    body:
      type: "none" | "form-data" | "x-www-form-urlencoded" | "raw-text" | "json"
      data: string | KeyValue[]
    timeout:
      connect: number           # 连接超时（秒）
      read: number              # 读取超时（秒）
      write: number             # 写入超时（秒）
```

**示例：**

```yaml
- id: 'http-001'
  data:
    type: 'http-request'
    title: '查询天气'
    method: 'get'
    url: 'https://api.weather.com/v1/current'
    authorization:
      type: 'api-key'
      config:
        type: 'bearer'
        api_key: '{{#env.WEATHER_API_KEY#}}'
    params:
      - key: 'city'
        value: '{{#start.city#}}'
      - key: 'units'
        value: 'metric'
    timeout:
      connect: 10
      read: 30
      write: 10
```

**POST JSON 示例：**

```yaml
- id: 'http-002'
  data:
    type: 'http-request'
    title: '创建记录'
    method: 'post'
    url: 'https://api.example.com/records'
    headers:
      - key: 'Content-Type'
        value: 'application/json'
    body:
      type: 'json'
      data: |
        {
          "title": "{{#start.title#}}",
          "content": "{{#llm-001.text#}}"
        }
```

---

### 5.10 Template Transform 节点

Jinja2 模板转换。

```yaml
- id: 'template-001'
  data:
    type: 'template-transform'
    title: '格式化输出'
    template: string # Jinja2 模板
    variables:
      - variable: string
        value_selector:
          - string
          - string
```

**示例：**

```yaml
- id: 'template-001'
  data:
    type: 'template-transform'
    title: '生成报告'
    template: |
      # 分析报告

      ## 用户问题
      {{ query }}

      ## 检索结果
      {% for doc in documents %}
      - {{ doc.title }}: {{ doc.content[:100] }}...
      {% endfor %}

      ## AI 回答
      {{ answer }}
    variables:
      - variable: 'query'
        value_selector:
          - 'start'
          - 'user_query'
      - variable: 'documents'
        value_selector:
          - 'retrieval-001'
          - 'result'
      - variable: 'answer'
        value_selector:
          - 'llm-001'
          - 'text'
```

---

### 5.11 Iteration 迭代节点

循环处理数组。

```yaml
- id: "iteration-001"
  data:
    type: "iteration"
    title: "批量处理"
    iterator_selector:          # 要迭代的数组
      - string
      - string
    output_selector:            # 迭代输出变量
      - string
      - string
    output_type: "array[string]" | "array[number]" | "array[object]"
    is_parallel: boolean        # 是否并行
    parallel_nums: number       # 并行数
    error_handle_mode: "terminated" | "continue-on-error" | "remove-abnormal-output"
```

迭代节点内部包含子节点，通过 `isInIteration: true` 标识。

---

### 5.12 Variable Aggregator 变量聚合

合并多个变量。

```yaml
- id: 'aggregator-001'
  data:
    type: 'variable-aggregator'
    title: '合并结果'
    variables:
      - - string # 节点 ID
        - string # 变量名
    output_type: OutputType
    advanced_settings:
      group_enabled: boolean
      groups:
        - output_type: OutputType
          variables:
            - - string
              - string
```

---

### 5.13 Variable Assigner 变量赋值

设置变量值。

```yaml
- id: 'assigner-001'
  data:
    type: 'variable-assigner'
    title: '设置变量'
    output_type: OutputType
    variables:
      - variable: string
        value_selector:
          - string
          - string
```

---

### 5.14 Parameter Extractor 参数提取

从自然语言提取结构化参数。

```yaml
- id: "extractor-001"
  data:
    type: "parameter-extractor"
    title: "提取订单信息"
    query:
      - string
      - string
    model:
      provider: string
      name: string
      mode: "chat"
      completion_params:
        temperature: number
    parameters:
      - name: string            # 参数名
        type: "string" | "number" | "bool" | "select" | "array[string]" | "array[number]" | "array[object]"
        description: string     # 参数描述
        required: boolean
        options: string[]       # select 类型的选项
    instruction: string         # 提取指令
    reasoning_mode: "prompt" | "function_call"
```

**示例：**

```yaml
- id: 'extractor-001'
  data:
    type: 'parameter-extractor'
    title: '提取订单信息'
    query:
      - 'start'
      - 'user_query'
    model:
      provider: 'openai'
      name: 'gpt-4o-mini'
      mode: 'chat'
      completion_params:
        temperature: 0
    parameters:
      - name: 'order_id'
        type: 'string'
        description: '订单编号，格式如 ORD-12345'
        required: true
      - name: 'action'
        type: 'select'
        description: '用户想要的操作'
        required: true
        options:
          - '查询'
          - '取消'
          - '修改'
          - '退款'
    instruction: '从用户消息中提取订单相关信息。'
    reasoning_mode: 'function_call'
```

---

### 5.15 Tool 工具节点

调用内置或自定义工具。

```yaml
- id: "tool-001"
  data:
    type: "tool"
    title: "搜索工具"
    provider_id: string         # 工具提供商
    provider_type: "builtin" | "api" | "workflow"
    provider_name: string
    tool_name: string           # 工具名称
    tool_label: string
    tool_configurations: object # 工具配置
    tool_parameters:            # 工具参数
      parameter_name:
        type: "variable" | "constant" | "mixed"
        value: any
        variable_selector:
          - string
          - string
```

---

### 5.16 Agent 节点

自主决策的智能体。

```yaml
- id: 'agent-001'
  data:
    type: 'agent'
    title: '智能助手'
    agent_strategy_provider: string
    agent_strategy_name: string
    agent_parameters: # Agent 参数
      max_iterations: number
      # 其他策略特定参数
    model:
      provider: string
      name: string
      mode: 'chat'
      completion_params:
        temperature: number
    prompt_template:
      - role: string
        text: string
    tools: # Agent 可用工具
      - provider_id: string
        provider_type: string
        provider_name: string
        tool_name: string
        tool_label: string
        tool_configurations: object
```

---

### 5.17 Document Extractor 文档提取

提取文档内容。

```yaml
- id: 'doc-extractor-001'
  data:
    type: 'document-extractor'
    title: '提取文档'
    variable_selector:
      - string
      - string
```

---

### 5.18 List Operator 列表操作

数组操作节点。

```yaml
- id: 'list-op-001'
  data:
    type: 'list-operator'
    title: '列表操作'
    variable_selector:
      - string
      - string
    # 具体操作配置
```

---

## 6. 变量引用语法

### 6.1 基本语法

```
{{#节点ID.变量名#}}
```

### 6.2 示例

| 表达式                       | 说明                         |
| ---------------------------- | ---------------------------- |
| `{{#start.user_query#}}`     | Start 节点的 user_query 输入 |
| `{{#llm-001.text#}}`         | LLM 节点的文本输出           |
| `{{#code-001.result#}}`      | 代码节点的 result 输出       |
| `{{#http-001.body#}}`        | HTTP 节点的响应 body         |
| `{{#retrieval-001.result#}}` | 知识检索的结果数组           |
| `{{#env.API_KEY#}}`          | 环境变量                     |
| `{{#sys.query#}}`            | 系统变量（Chatflow）         |
| `{{#sys.user_id#}}`          | 用户 ID                      |
| `{{#sys.conversation_id#}}`  | 对话 ID                      |

### 6.3 在模板中使用

Jinja2 模板中可以直接使用变量名（不带 `{{# #}}`）：

```yaml
template: |
  用户问题：{{ query }}
  答案：{{ answer }}
```

---

## 7. Features 配置

```yaml
workflow:
  features:
    file_upload:
      enabled: boolean
      image:
        enabled: boolean
        number_limits: number
        transfer_methods:
          - 'remote_url'
          - 'local_file'
      allowed_file_types:
        - 'image'
        - 'document'
        - 'audio'
        - 'video'
        - 'custom'
      allowed_file_extensions:
        - '.pdf'
        - '.docx'
      allowed_file_upload_methods:
        - 'remote_url'
        - 'local_file'
      number_limits: number
    text_to_speech:
      enabled: boolean
      voice: string
      language: string
    speech_to_text:
      enabled: boolean
    retriever_resource:
      enabled: boolean
    sensitive_word_avoidance:
      enabled: boolean
      type: string
      configs:
        # 敏感词配置
    suggested_questions:
      - string
    suggested_questions_after_answer:
      enabled: boolean
    opening_statement: string
```

---

## 8. 环境变量与对话变量

### 8.1 环境变量

```yaml
workflow:
  environment_variables:
    - name: string
      value: string
      value_type: "string" | "secret"
```

引用：`{{#env.VAR_NAME#}}`

### 8.2 对话变量

```yaml
workflow:
  conversation_variables:
    - id: string
      name: string
      value_type: "string" | "number" | "object" | "array[string]"
      value: any
      description: string
```

---

## 9. 完整示例

### 9.1 简单问答工作流

```yaml
version: '0.5.0'
kind: 'app'

app:
  name: '简单问答'
  mode: 'workflow'
  icon: '💬'
  icon_type: 'emoji'
  icon_background: '#E4FBCC'
  description: '基础的 LLM 问答工作流'

workflow:
  graph:
    nodes:
      - id: 'start'
        type: 'custom'
        data:
          type: 'start'
          title: '开始'
          variables:
            - variable: 'question'
              label: '问题'
              type: 'paragraph'
              required: true
              max_length: 2000

      - id: 'llm'
        type: 'custom'
        data:
          type: 'llm'
          title: 'AI 回答'
          model:
            provider: 'openai'
            name: 'gpt-4o'
            mode: 'chat'
            completion_params:
              temperature: 0.7
              max_tokens: 2000
          prompt_template:
            - role: 'system'
              text: '你是一个有帮助的 AI 助手。请简洁、准确地回答用户的问题。'
            - role: 'user'
              text: '{{#start.question#}}'

      - id: 'end'
        type: 'custom'
        data:
          type: 'end'
          title: '结束'
          outputs:
            - variable: 'answer'
              value_selector:
                - 'llm'
                - 'text'

    edges:
      - id: 'e1'
        source: 'start'
        sourceHandle: 'source'
        target: 'llm'
        targetHandle: 'target'
        type: 'custom'
        zIndex: 0
        data:
          sourceType: 'start'
          targetType: 'llm'
          isInIteration: false
          isInLoop: false

      - id: 'e2'
        source: 'llm'
        sourceHandle: 'source'
        target: 'end'
        targetHandle: 'target'
        type: 'custom'
        zIndex: 0
        data:
          sourceType: 'llm'
          targetType: 'end'
          isInIteration: false
          isInLoop: false

  features:
    file_upload:
      enabled: false
    text_to_speech:
      enabled: false
    retriever_resource:
      enabled: false
```

### 9.2 RAG 知识库问答

```yaml
version: '0.5.0'
kind: 'app'

app:
  name: '知识库问答'
  mode: 'workflow'
  icon: '📚'
  icon_type: 'emoji'
  icon_background: '#D5F5F6'
  description: '基于知识库的 RAG 问答系统'

workflow:
  graph:
    nodes:
      - id: 'start'
        type: 'custom'
        data:
          type: 'start'
          title: '开始'
          variables:
            - variable: 'query'
              label: '用户问题'
              type: 'paragraph'
              required: true

      - id: 'retrieval'
        type: 'custom'
        data:
          type: 'knowledge-retrieval'
          title: '知识检索'
          query_variable_selector:
            - 'start'
            - 'query'
          dataset_ids:
            - 'your-dataset-id'
          retrieval_mode: 'multiple'
          multiple_retrieval_config:
            top_k: 5
            score_threshold: 0.5
            score_threshold_enabled: true
            reranking_enable: true
            reranking_model:
              provider: 'cohere'
              model: 'rerank-multilingual-v2.0'

      - id: 'llm'
        type: 'custom'
        data:
          type: 'llm'
          title: '生成回答'
          model:
            provider: 'openai'
            name: 'gpt-4o'
            mode: 'chat'
            completion_params:
              temperature: 0.5
              max_tokens: 2000
          context:
            enabled: true
            variable_selector:
              - 'retrieval'
              - 'result'
          prompt_template:
            - role: 'system'
              text: |
                你是一个专业的客服助手。请根据提供的参考资料回答用户问题。
                如果参考资料中没有相关信息，请诚实地说"我没有找到相关信息"。
            - role: 'user'
              text: '{{#start.query#}}'

      - id: 'end'
        type: 'custom'
        data:
          type: 'end'
          title: '输出'
          outputs:
            - variable: 'answer'
              value_selector:
                - 'llm'
                - 'text'

    edges:
      - id: 'e1'
        source: 'start'
        sourceHandle: 'source'
        target: 'retrieval'
        targetHandle: 'target'
        type: 'custom'
        zIndex: 0
        data:
          sourceType: 'start'
          targetType: 'knowledge-retrieval'
          isInIteration: false
          isInLoop: false

      - id: 'e2'
        source: 'retrieval'
        sourceHandle: 'source'
        target: 'llm'
        targetHandle: 'target'
        type: 'custom'
        zIndex: 0
        data:
          sourceType: 'knowledge-retrieval'
          targetType: 'llm'
          isInIteration: false
          isInLoop: false

      - id: 'e3'
        source: 'llm'
        sourceHandle: 'source'
        target: 'end'
        targetHandle: 'target'
        type: 'custom'
        zIndex: 0
        data:
          sourceType: 'llm'
          targetType: 'end'
          isInIteration: false
          isInLoop: false

  features:
    retriever_resource:
      enabled: true
```

### 9.3 条件分支工作流

```yaml
version: '0.5.0'
kind: 'app'

app:
  name: '智能路由'
  mode: 'workflow'
  icon: '🔀'
  icon_type: 'emoji'
  icon_background: '#FBE8FF'
  description: '根据问题类型路由到不同处理分支'

workflow:
  graph:
    nodes:
      - id: 'start'
        type: 'custom'
        data:
          type: 'start'
          title: '开始'
          variables:
            - variable: 'input'
              label: '用户输入'
              type: 'paragraph'
              required: true

      - id: 'classifier'
        type: 'custom'
        data:
          type: 'question-classifier'
          title: '问题分类'
          query_variable_selector:
            - 'start'
            - 'input'
          model:
            provider: 'openai'
            name: 'gpt-4o-mini'
            mode: 'chat'
            completion_params:
              temperature: 0
          classes:
            - id: 'translate'
              name: '翻译请求'
            - id: 'summarize'
              name: '摘要请求'
            - id: 'general'
              name: '一般问题'
          instruction: '判断用户意图属于哪个类别'

      - id: 'llm-translate'
        type: 'custom'
        data:
          type: 'llm'
          title: '翻译处理'
          model:
            provider: 'openai'
            name: 'gpt-4o'
            mode: 'chat'
            completion_params:
              temperature: 0.3
          prompt_template:
            - role: 'system'
              text: '你是翻译专家。请将用户的文本翻译成目标语言。'
            - role: 'user'
              text: '{{#start.input#}}'

      - id: 'llm-summarize'
        type: 'custom'
        data:
          type: 'llm'
          title: '摘要处理'
          model:
            provider: 'openai'
            name: 'gpt-4o'
            mode: 'chat'
            completion_params:
              temperature: 0.5
          prompt_template:
            - role: 'system'
              text: '你是摘要专家。请为用户的文本生成简洁的摘要。'
            - role: 'user'
              text: '{{#start.input#}}'

      - id: 'llm-general'
        type: 'custom'
        data:
          type: 'llm'
          title: '一般回答'
          model:
            provider: 'openai'
            name: 'gpt-4o'
            mode: 'chat'
            completion_params:
              temperature: 0.7
          prompt_template:
            - role: 'system'
              text: '你是一个有帮助的 AI 助手。'
            - role: 'user'
              text: '{{#start.input#}}'

      - id: 'aggregator'
        type: 'custom'
        data:
          type: 'variable-aggregator'
          title: '合并结果'
          variables:
            - - 'llm-translate'
              - 'text'
            - - 'llm-summarize'
              - 'text'
            - - 'llm-general'
              - 'text'
          output_type: 'string'

      - id: 'end'
        type: 'custom'
        data:
          type: 'end'
          title: '结束'
          outputs:
            - variable: 'result'
              value_selector:
                - 'aggregator'
                - 'output'

    edges:
      - id: 'e1'
        source: 'start'
        sourceHandle: 'source'
        target: 'classifier'
        targetHandle: 'target'
        type: 'custom'
        zIndex: 0
        data:
          sourceType: 'start'
          targetType: 'question-classifier'
          isInIteration: false
          isInLoop: false

      - id: 'e2'
        source: 'classifier'
        sourceHandle: 'translate'
        target: 'llm-translate'
        targetHandle: 'target'
        type: 'custom'
        zIndex: 0
        data:
          sourceType: 'question-classifier'
          targetType: 'llm'
          isInIteration: false
          isInLoop: false

      - id: 'e3'
        source: 'classifier'
        sourceHandle: 'summarize'
        target: 'llm-summarize'
        targetHandle: 'target'
        type: 'custom'
        zIndex: 0
        data:
          sourceType: 'question-classifier'
          targetType: 'llm'
          isInIteration: false
          isInLoop: false

      - id: 'e4'
        source: 'classifier'
        sourceHandle: 'general'
        target: 'llm-general'
        targetHandle: 'target'
        type: 'custom'
        zIndex: 0
        data:
          sourceType: 'question-classifier'
          targetType: 'llm'
          isInIteration: false
          isInLoop: false

      - id: 'e5'
        source: 'llm-translate'
        sourceHandle: 'source'
        target: 'aggregator'
        targetHandle: 'target'
        type: 'custom'
        zIndex: 0
        data:
          sourceType: 'llm'
          targetType: 'variable-aggregator'
          isInIteration: false
          isInLoop: false

      - id: 'e6'
        source: 'llm-summarize'
        sourceHandle: 'source'
        target: 'aggregator'
        targetHandle: 'target'
        type: 'custom'
        zIndex: 0
        data:
          sourceType: 'llm'
          targetType: 'variable-aggregator'
          isInIteration: false
          isInLoop: false

      - id: 'e7'
        source: 'llm-general'
        sourceHandle: 'source'
        target: 'aggregator'
        targetHandle: 'target'
        type: 'custom'
        zIndex: 0
        data:
          sourceType: 'llm'
          targetType: 'variable-aggregator'
          isInIteration: false
          isInLoop: false

      - id: 'e8'
        source: 'aggregator'
        sourceHandle: 'source'
        target: 'end'
        targetHandle: 'target'
        type: 'custom'
        zIndex: 0
        data:
          sourceType: 'variable-aggregator'
          targetType: 'end'
          isInIteration: false
          isInLoop: false

  features:
    file_upload:
      enabled: false
```

---

## 10. 验证规则清单

### 10.1 必须满足的规则

| 规则         | 说明                                       |
| ------------ | ------------------------------------------ |
| 唯一 Start   | 有且仅有一个 type=start 的节点             |
| 必须有出口   | 至少一个 type=end 或 type=answer 的节点    |
| ID 唯一性    | 所有节点 ID 必须唯一                       |
| Edge 有效性  | source/target 必须指向存在的节点 ID        |
| 变量引用有效 | `{{#node.var#}}` 中的 node 和 var 必须存在 |
| 必填字段     | 节点的 required 字段不能为空               |

### 10.2 推荐规则

| 规则       | 说明                     |
| ---------- | ------------------------ |
| 节点可达   | 所有节点从 Start 可达    |
| 无孤立节点 | 所有节点都有入边或出边   |
| 循环检测   | 除 Loop 节点外无循环依赖 |

---

## 附录：节点类型速查表

| 类型       | type 值               | 必填字段                                | 输出变量                   |
| ---------- | --------------------- | --------------------------------------- | -------------------------- |
| Start      | `start`               | variables                               | -                          |
| End        | `end`                 | outputs                                 | -                          |
| Answer     | `answer`              | answer                                  | -                          |
| LLM        | `llm`                 | model, prompt_template                  | text                       |
| Knowledge  | `knowledge-retrieval` | query_variable_selector, dataset_ids    | result                     |
| Classifier | `question-classifier` | query_variable_selector, model, classes | class_name                 |
| IF/ELSE    | `if-else`             | conditions                              | -                          |
| Code       | `code`                | code_language, code, outputs            | (自定义)                   |
| HTTP       | `http-request`        | method, url                             | status_code, body, headers |
| Template   | `template-transform`  | template                                | output                     |
| Iteration  | `iteration`           | iterator_selector                       | output                     |
| Aggregator | `variable-aggregator` | variables                               | output                     |
| Assigner   | `variable-assigner`   | variables                               | output                     |
| Extractor  | `parameter-extractor` | query, model, parameters                | (自定义)                   |
| Tool       | `tool`                | provider_id, tool_name                  | (取决于工具)               |
| Agent      | `agent`               | model, tools                            | text                       |
