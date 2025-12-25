// 节点配置常量

// 可用的 LLM 模型列表
export const LLM_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'deepseek-chat', label: 'DeepSeek Chat' },
  { value: 'glm-4', label: 'GLM-4' },
];

// 节点类型图标
export const NODE_ICONS: Record<string, string> = {
  start: '▶️',
  end: '🏁',
  llm: '🤖',
  'knowledge-retrieval': '📚',
  'question-classifier': '🏷️',
  'if-else': '🔀',
  code: '💻',
  'http-request': '🌐',
  'variable-aggregator': '📦',
  'template-transform': '📝',
  answer: '💬',
};

// 示例提示词
export const EXAMPLE_PROMPTS = [
  '创建一个简单的问答工作流',
  '创建一个 RAG 知识库问答工作流',
  '创建一个智能客服系统，根据问题类型分类后走不同分支回答',
  '创建一个文档翻译工作流，支持多语言',
];
