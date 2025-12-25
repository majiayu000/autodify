import { vi } from 'vitest';

/**
 * 测试环境设置
 * 在所有测试运行前配置环境变量和 Mock
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.LLM_API_KEY = 'test-api-key';
process.env.LLM_BASE_URL = 'http://localhost:11434/v1';
process.env.LLM_PROVIDER = 'openai';
process.env.LLM_DEFAULT_MODEL = 'gpt-4o';
process.env.PORT = '3001';
process.env.HOST = '0.0.0.0';
process.env.LOG_LEVEL = 'silent'; // 测试时禁用日志

// 清除所有 timers
vi.useFakeTimers({
  shouldAdvanceTime: true,
});

// 全局测试后清理
afterEach(() => {
  vi.clearAllMocks();
});
