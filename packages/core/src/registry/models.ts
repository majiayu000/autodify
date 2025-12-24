/**
 * Model Provider Registry
 *
 * Contains information about supported LLM providers and models.
 */

import type { ModelProvider, ModelInfo } from './types.js';

/**
 * OpenAI 模型 (2024-2025)
 */
export const openaiModels: ModelInfo[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    contextWindow: 128000,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    contextWindow: 128000,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    contextWindow: 128000,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    contextWindow: 8192,
    supportsVision: false,
    supportsTools: true,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    contextWindow: 16385,
    supportsVision: false,
    supportsTools: true,
  },
  {
    id: 'o1',
    name: 'O1',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: false,
  },
  {
    id: 'o1-preview',
    name: 'O1 Preview',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: false,
  },
  {
    id: 'o1-mini',
    name: 'O1 Mini',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: false,
  },
];

/**
 * Anthropic 模型
 */
export const anthropicModels: ModelInfo[] = [
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    contextWindow: 200000,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    contextWindow: 200000,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    contextWindow: 200000,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    contextWindow: 200000,
    supportsVision: true,
    supportsTools: true,
  },
];

/**
 * DeepSeek 模型 (2024-2025)
 */
export const deepseekModels: ModelInfo[] = [
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: true,
  },
  {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: true,
  },
];

/**
 * 智谱 AI 模型 (2024-2025)
 */
export const zhipuModels: ModelInfo[] = [
  {
    id: 'glm-4',
    name: 'GLM-4',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: true,
  },
  {
    id: 'glm-4-plus',
    name: 'GLM-4 Plus',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: true,
  },
  {
    id: 'glm-4-air',
    name: 'GLM-4 Air',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: true,
  },
  {
    id: 'glm-4-flash',
    name: 'GLM-4 Flash',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: true,
  },
  {
    id: 'glm-4v',
    name: 'GLM-4V',
    contextWindow: 128000,
    supportsVision: true,
    supportsTools: true,
  },
];

/**
 * 模型提供商列表
 */
export const modelProviders: ModelProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: openaiModels,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: anthropicModels,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    models: deepseekModels,
  },
  {
    id: 'zhipuai',
    name: '智谱 AI',
    models: zhipuModels,
  },
];

/**
 * 获取模型提供商
 */
export function getModelProvider(providerId: string): ModelProvider | undefined {
  return modelProviders.find((p) => p.id === providerId);
}

/**
 * 获取模型信息
 */
export function getModelInfo(providerId: string, modelId: string): ModelInfo | undefined {
  const provider = getModelProvider(providerId);
  return provider?.models.find((m) => m.id === modelId);
}

/**
 * 获取所有模型
 */
export function getAllModels(): Array<{ provider: string; model: ModelInfo }> {
  return modelProviders.flatMap((p) =>
    p.models.map((m) => ({ provider: p.id, model: m }))
  );
}

/**
 * 获取支持视觉的模型
 */
export function getVisionModels(): Array<{ provider: string; model: ModelInfo }> {
  return getAllModels().filter((m) => m.model.supportsVision);
}

/**
 * 获取支持工具调用的模型
 */
export function getToolModels(): Array<{ provider: string; model: ModelInfo }> {
  return getAllModels().filter((m) => m.model.supportsTools);
}

/**
 * 默认模型配置
 */
export const defaultModelConfig = {
  provider: 'openai',
  name: 'gpt-4o',
  mode: 'chat' as const,
  completion_params: {
    temperature: 0.7,
    max_tokens: 4096,
  },
};
