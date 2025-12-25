import type { LoggerOptions } from 'pino';
import type { LoggingConfig } from './types.js';

/**
 * 创建 Pino 日志配置
 */
export function createPinoConfig(config: LoggingConfig): LoggerOptions {
  const baseConfig: LoggerOptions = {
    name: config.service,
    level: config.level,

    // 基础字段定制
    base: {
      service: config.service,
      env: config.environment,
    },

    // 时间戳格式
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,

    // 格式化器
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
      bindings: (bindings) => {
        return {
          pid: bindings.pid,
          host: bindings.hostname,
        };
      },
    },

    // 脱敏配置
    redact: {
      paths: config.redactPaths || [
        'password',
        'token',
        'apiKey',
        'api_key',
        'secret',
        'authorization',
        'cookie',
        'creditCard',
        'ssn',
        '*.password',
        '*.token',
        '*.apiKey',
        '*.api_key',
        '*.secret',
      ],
      censor: '***REDACTED***',
    },

    // 序列化器
    serializers: {
      err: (err: Error) => {
        return {
          type: err.name,
          message: err.message,
          stack: err.stack,
        };
      },
      req: (req: any) => {
        return {
          id: req.id,
          method: req.method,
          url: req.url,
          headers: {
            host: req.headers?.host,
            'user-agent': req.headers?.[' user-agent'],
          },
          remoteAddress: req.ip,
        };
      },
      res: (res: any) => {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  };

  return baseConfig;
}

/**
 * 创建开发环境的 Pretty Transport 配置
 */
export function createPrettyTransport() {
  return {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss.l',
      ignore: 'pid,hostname',
      messageFormat: '{levelLabel} | {msg}',
      customLevels: 'fatal:60,error:50,warn:40,info:30,debug:20,trace:10',
      customColors: 'fatal:bgRed,error:red,warn:yellow,info:green,debug:blue,trace:gray',
    },
  };
}
