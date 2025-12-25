# 流式响应功能说明

本文档介绍 Autodify 的流式响应功能，包括实现细节和使用方法。

## 功能概述

流式响应允许用户在工作流生成过程中实时查看进度，提供更好的用户体验。系统支持：

- **实时进度更新**：显示生成的各个阶段和完成百分比
- **中间结果展示**：实时显示生成过程中的关键信息
- **取消生成**：用户可以随时中止正在进行的生成任务

## 架构设计

### 1. 核心层 (packages/core)

#### 新增类型定义

在 `src/llm/types.ts` 中添加了流式相关类型：

```typescript
// 流式数据块类型
export type StreamChunkType = 'content' | 'progress' | 'metadata' | 'error' | 'done';

// 流式数据块结构
export interface StreamChunk {
  type: StreamChunkType;
  content?: string;
  progress?: {
    stage: string;
    percentage?: number;
    message?: string;
  };
  metadata?: {
    model?: string;
    usage?: { ... };
  };
  error?: string;
  done: boolean;
}

// 流式选项
export interface StreamingCompletionOptions extends CompletionOptions {
  onProgress?: ProgressCallback;
  signal?: AbortSignal;
}
```

#### LLM 服务更新

- **BaseLLMService**: 添加 `chatStream()` 和 `completeStream()` 方法
- **OpenAIService**: 实现了完整的流式调用功能，支持 SSE 解析

```typescript
// 使用示例
const stream = await llmService.chatStream(messages, {
  onProgress: (chunk) => {
    console.log(chunk);
  },
  signal: abortController.signal,
});

for await (const chunk of stream) {
  // 处理每个数据块
  if (chunk.type === 'content') {
    console.log(chunk.content);
  }
}
```

### 2. 服务层 (packages/server)

#### 新增 SSE 端点

添加了 `POST /api/generate/stream` 端点，使用 Server-Sent Events (SSE) 协议：

**特性：**
- 支持客户端断开检测
- 自动取消任务（通过 AbortController）
- 错误处理和恢复

**响应格式：**
```
data: {"type":"progress","progress":{"stage":"initializing","percentage":0,"message":"Starting..."},"done":false}

data: {"type":"content","content":"...","done":false}

data: {"type":"done","done":true}
```

#### WorkflowService 更新

添加了 `generateStream()` 方法，支持流式生成工作流：

```typescript
async *generateStream(
  request: GenerateApiRequest,
  signal?: AbortSignal
): AsyncGenerator<StreamChunk>
```

**生成阶段：**
1. initializing (0%) - 初始化
2. analyzing (10%) - 分析需求
3. generating (30%) - 生成工作流结构
4. converting (80%) - 转换为 YAML
5. finalizing (90%) - 完成

### 3. 前端层 (packages/web)

#### API 客户端

在 `src/api/generate.ts` 中添加了 `generateWorkflowStream()` 函数：

```typescript
export async function generateWorkflowStream(
  request: GenerateRequest,
  onProgress: ProgressCallback,
  abortSignal?: AbortSignal
): Promise<GenerateResponse>
```

#### UI 组件更新

**App.tsx**
- 添加流式状态管理（progress, abortController）
- 实现 `handleCancelGeneration()` 取消功能
- 支持流式和非流式两种模式切换

**PromptInput.tsx**
- 添加进度条显示
- 添加取消按钮
- 实时更新生成进度

**进度条示例：**
```
┌─────────────────────────────────────┐
│ Generating workflow structure...   │
│ 30%                                 │
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░   │
└─────────────────────────────────────┘
```

## 使用方法

### 后端使用

启动服务器后，可以使用 curl 测试流式端点：

```bash
curl -N -X POST http://localhost:3001/api/generate/stream \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "创建一个客服聊天机器人",
    "options": {
      "model": "gpt-4",
      "temperature": 0.7
    }
  }'
```

### 前端使用

前端会自动使用流式 API（默认启用）。用户可以：

1. **查看进度**：在输入框下方看到实时进度条
2. **取消生成**：点击"取消生成"按钮
3. **切换模式**：通过 `useStreaming` 状态切换流式/非流式模式

## 技术细节

### SSE vs WebSocket

我们选择 SSE (Server-Sent Events) 而不是 WebSocket 的原因：

- **简单性**：SSE 是单向通信，更适合进度推送
- **兼容性**：基于 HTTP，易于部署和调试
- **自动重连**：浏览器原生支持断线重连
- **文本协议**：易于调试和监控

### 取消机制

使用 AbortController 实现取消：

```typescript
// 前端
const controller = new AbortController();
await generateWorkflowStream(request, onProgress, controller.signal);

// 取消
controller.abort();

// 后端
request.raw.on('close', () => {
  abortController.abort();
});
```

### 错误处理

系统在多个层面处理错误：

1. **网络错误**：fetch 错误捕获
2. **SSE 解析错误**：跳过无效数据块
3. **生成错误**：通过 error 类型的数据块传递
4. **取消错误**：特殊处理 AbortError

## 性能考虑

- **缓冲优化**：使用流式解码器避免内存堆积
- **进度节流**：避免过于频繁的 UI 更新
- **连接管理**：客户端断开时自动清理资源
- **错误恢复**：网络中断时提供友好提示

## 未来改进

- [ ] 支持 WebSocket 作为备选协议
- [ ] 添加重连机制
- [ ] 优化进度计算算法
- [ ] 支持更细粒度的生成阶段
- [ ] 添加生成速度统计

## 相关文件

### Core
- `/packages/core/src/llm/types.ts` - 类型定义
- `/packages/core/src/llm/base-service.ts` - 基础服务
- `/packages/core/src/llm/openai-service.ts` - OpenAI 流式实现

### Server
- `/packages/server/src/routes/workflow.routes.ts` - SSE 端点
- `/packages/server/src/services/workflow.service.ts` - 流式生成服务

### Web
- `/packages/web/src/api/generate.ts` - API 客户端
- `/packages/web/src/App.tsx` - 主应用逻辑
- `/packages/web/src/components/PromptInput.tsx` - 进度 UI

## 测试

运行以下命令测试流式功能：

```bash
# 启动开发服务器
npm run dev:all

# 访问 Web 界面
open http://localhost:5173

# 测试 API 端点
curl -N -X POST http://localhost:3001/api/generate/stream \
  -H "Content-Type: application/json" \
  -d '{"prompt": "测试流式响应"}'
```
