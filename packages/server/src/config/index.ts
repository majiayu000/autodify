import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

// Load .env file
dotenvConfig();

/**
 * 环境变量 Schema 定义
 * 使用 Zod 进行类型验证和运行时检查
 */
const envSchema = z.object({
  // Server Configuration
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // LLM Configuration - 必需字段
  LLM_API_KEY: z.string().min(1, 'LLM_API_KEY is required'),
  LLM_BASE_URL: z.string().url('LLM_BASE_URL must be a valid URL').default('https://api.openai.com/v1'),

  // LLM Configuration - 可选字段
  LLM_DEFAULT_MODEL: z.string().default('gpt-4o'),
  LLM_PROVIDER: z.enum(['openai', 'anthropic', 'deepseek', 'custom']).default('openai'),
  LLM_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
  LLM_MAX_TOKENS: z.coerce.number().int().positive().default(4096),
  LLM_MAX_RETRIES: z.coerce.number().int().nonnegative().default(3),

  // 兼容旧的 OPENAI_* 环境变量
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().optional(),

  // CORS Configuration
  ALLOWED_ORIGINS: z.string().optional(),

  // Logging Configuration
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  // Rate Limiting Configuration
  RATE_LIMIT_GLOBAL_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_GLOBAL_TIME_WINDOW: z.string().default('15 minutes'),
  RATE_LIMIT_GENERATE_MAX: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_GENERATE_TIME_WINDOW: z.string().default('15 minutes'),
  RATE_LIMIT_REFINE_MAX: z.coerce.number().int().positive().default(30),
  RATE_LIMIT_REFINE_TIME_WINDOW: z.string().default('15 minutes'),
});

/**
 * 验证环境变量并返回类型安全的配置对象
 */
function validateEnv() {
  try {
    // 尝试验证环境变量
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
      // 格式化错误信息
      const errors = parsed.error.format();
      const errorMessages: string[] = [];

      Object.entries(errors).forEach(([key, value]) => {
        if (key !== '_errors' && value && '_errors' in value) {
          const fieldErrors = value._errors;
          if (fieldErrors.length > 0) {
            errorMessages.push(`  - ${key}: ${fieldErrors.join(', ')}`);
          }
        }
      });

      console.error('\n========================================');
      console.error('❌ Environment Variable Validation Failed');
      console.error('========================================\n');
      console.error('The following environment variables are invalid or missing:\n');
      console.error(errorMessages.join('\n'));
      console.error('\n📝 Please check your .env file or environment variables.');
      console.error('💡 Refer to .env.example for the required configuration.\n');
      console.error('========================================\n');

      process.exit(1);
    }

    return parsed.data;
  } catch (error) {
    console.error('\n❌ Unexpected error during environment validation:', error);
    process.exit(1);
  }
}

// 验证并获取环境变量
const env = validateEnv();

/**
 * 应用配置对象
 * 所有配置都经过验证，类型安全
 */
export const config = {
  // Server
  port: env.PORT,
  host: env.HOST,
  nodeEnv: env.NODE_ENV,

  // LLM Configuration
  llm: {
    // 优先使用新的 LLM_* 变量，如果不存在则回退到 OPENAI_* 变量
    apiKey: env.LLM_API_KEY || env.OPENAI_API_KEY || '',
    baseUrl: env.LLM_BASE_URL || env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    defaultModel: env.LLM_DEFAULT_MODEL,
    provider: env.LLM_PROVIDER,
    temperature: env.LLM_TEMPERATURE,
    maxTokens: env.LLM_MAX_TOKENS,
    maxRetries: env.LLM_MAX_RETRIES,
  },

  // CORS
  cors: {
    origin: (() => {
      const isDev = env.NODE_ENV === 'development';
      const allowedOrigins = env.ALLOWED_ORIGINS;

      // 如果显式配置了 ALLOWED_ORIGINS，使用它（逗号分隔）
      if (allowedOrigins) {
        const origins = allowedOrigins.split(',').map((origin) => origin.trim());
        return origins.length === 1 ? origins[0] : origins;
      }

      // 开发环境默认允许本地开发域名
      if (isDev) {
        return [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:3000',
        ];
      }

      // 生产环境必须显式配置，否则拒绝所有跨域请求
      return false;
    })(),
  },

  // Logging
  logging: {
    level: env.LOG_LEVEL,
  },

  // Rate Limiting
  rateLimit: {
    // 全局速率限制（每15分钟100次请求）
    global: {
      max: env.RATE_LIMIT_GLOBAL_MAX,
      timeWindow: env.RATE_LIMIT_GLOBAL_TIME_WINDOW,
    },
    // API生成端点速率限制（每15分钟20次请求）
    generate: {
      max: env.RATE_LIMIT_GENERATE_MAX,
      timeWindow: env.RATE_LIMIT_GENERATE_TIME_WINDOW,
    },
    // API优化端点速率限制（每15分钟30次请求）
    refine: {
      max: env.RATE_LIMIT_REFINE_MAX,
      timeWindow: env.RATE_LIMIT_REFINE_TIME_WINDOW,
    },
  },
} as const;

export type Config = typeof config;

// 导出类型以便在其他地方使用
export type EnvSchema = z.infer<typeof envSchema>;
