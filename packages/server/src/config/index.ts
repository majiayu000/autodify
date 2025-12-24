import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  // LLM Configuration
  llm: {
    // 支持 LiteLLM proxy 或直接调用
    baseUrl: process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '',

    // 默认模型
    defaultModel: process.env.LLM_DEFAULT_MODEL || 'gpt-4o',

    // Provider (openai, anthropic, deepseek, litellm)
    provider: (process.env.LLM_PROVIDER || 'openai') as 'openai' | 'anthropic' | 'deepseek' | 'custom',

    // Generation settings
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4096', 10),
    maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '3', 10),
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
} as const;

export type Config = typeof config;
