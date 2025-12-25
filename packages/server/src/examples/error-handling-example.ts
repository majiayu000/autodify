/**
 * 错误处理系统使用示例
 * 演示如何在路由和服务中使用自定义错误类
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  ValidationError,
  NotFoundError,
  GenerationFailedError,
  LLMError,
  InternalError,
} from '../errors/custom-errors.js';
import { validateRequest } from '../middleware/error-handler.js';
import { z } from 'zod';

// ============================================================================
// 示例 1: 在路由中使用 validateRequest 进行请求验证
// ============================================================================

const CreateUserSchema = z.object({
  email: z.string().email('无效的邮箱格式'),
  name: z.string().min(2, '姓名至少需要2个字符'),
  age: z.number().min(18, '年龄必须大于18岁').optional(),
});

export function exampleRoutes(fastify: FastifyInstance) {
  // 使用 validateRequest 自动验证并抛出 ValidationError
  fastify.post('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = validateRequest(CreateUserSchema, request.body);

    // data 现在是类型安全的
    console.log(`Creating user: ${data.email}`);

    return reply.send({ success: true, user: data });
  });

  // 使用 NotFoundError
  fastify.get('/users/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = request.params.id;
    const user = await findUser(userId);

    if (!user) {
      throw new NotFoundError(`用户 ${userId} 不存在`);
    }

    return reply.send({ success: true, user });
  });
}

// ============================================================================
// 示例 2: 在服务层使用自定义错误类
// ============================================================================

class ExampleService {
  async generateWorkflow(prompt: string) {
    try {
      // 模拟调用 LLM
      const result = await this.callLLM(prompt);

      if (!result.success) {
        throw new GenerationFailedError('工作流生成失败', {
          reason: result.error,
          prompt: prompt.substring(0, 100), // 只记录前100个字符
        });
      }

      return result;
    } catch (error) {
      // 重新抛出已知错误
      if (error instanceof GenerationFailedError) {
        throw error;
      }

      // 转换 LLM 错误
      if (this.isLLMError(error)) {
        throw new LLMError('LLM 服务调用失败', {
          originalError: error instanceof Error ? error.message : '未知错误',
        });
      }

      // 其他未知错误
      throw new InternalError('服务内部错误', {
        originalError: error instanceof Error ? error.message : '未知错误',
      });
    }
  }

  private async callLLM(prompt: string) {
    // 模拟 LLM 调用
    return { success: true, data: {} };
  }

  private isLLMError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const message = error.message.toLowerCase();
    return message.includes('api') || message.includes('llm') || message.includes('timeout');
  }
}

// ============================================================================
// 示例 3: 手动创建和使用自定义错误
// ============================================================================

async function processData(data: unknown) {
  // 验证数据
  if (!data || typeof data !== 'object') {
    throw new ValidationError('无效的数据格式', {
      expected: 'object',
      received: typeof data,
    });
  }

  // 检查资源
  const resource = await findResource('resource-id');
  if (!resource) {
    throw new NotFoundError('请求的资源不存在', 'resource');
  }

  // 处理业务逻辑
  try {
    return await doSomething(data);
  } catch (error) {
    throw new InternalError('处理数据时发生错误', {
      originalError: error instanceof Error ? error.message : '未知错误',
    });
  }
}

// ============================================================================
// 示例 4: 错误响应格式
// ============================================================================

/*
开发环境错误响应示例：

{
  "success": false,
  "error": "工作流生成失败",
  "code": "GENERATION_FAILED",
  "statusCode": 500,
  "details": {
    "reason": "LLM API 调用超时",
    "prompt": "创建一个用户注册流程..."
  },
  "stack": "Error: 工作流生成失败\n    at WorkflowService.generate (...)"
}

生产环境错误响应示例（隐藏敏感信息）：

{
  "success": false,
  "error": "服务器内部错误",
  "code": "INTERNAL_ERROR",
  "statusCode": 500
}
*/

// ============================================================================
// 工具函数（示例用）
// ============================================================================

async function findUser(id: string) {
  // 模拟数据库查询
  return null;
}

async function findResource(id: string) {
  // 模拟资源查找
  return null;
}

async function doSomething(data: unknown) {
  // 模拟业务逻辑
  return { success: true };
}
