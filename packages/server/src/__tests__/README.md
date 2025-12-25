# API 集成测试

本目录包含 Autodify Server 的 API 集成测试。

## 测试结构

```
src/__tests__/
├── README.md                 # 本文档
├── setup.ts                  # 测试环境设置
├── helpers/
│   ├── build-app.ts         # 测试应用构建工具
│   └── mock-llm.ts          # LLM 服务 Mock 工具
└── api/
    ├── health.test.ts       # 健康检查 API 测试
    ├── generate.test.ts     # 工作流生成 API 测试
    ├── refine.test.ts       # 工作流优化 API 测试
    └── templates.test.ts    # 模板相关 API 测试
```

## 运行测试

### 基本命令

```bash
# 监视模式（开发时使用）
pnpm test

# 单次运行所有测试
pnpm test:run

# 生成覆盖率报告
pnpm test:coverage

# 使用 UI 界面运行测试
pnpm test:ui
```

### 运行特定测试文件

```bash
# 只运行健康检查测试
pnpm vitest run src/__tests__/api/health.test.ts

# 只运行生成 API 测试
pnpm vitest run src/__tests__/api/generate.test.ts
```

### 运行特定测试用例

```bash
# 使用 -t 参数匹配测试名称
pnpm vitest run -t "应该返回正确的健康状态"
```

## 测试覆盖

### API 端点

- ✅ `GET /` - 根端点
- ✅ `GET /api/health` - 健康检查
- ✅ `POST /api/generate` - 生成工作流
- ✅ `POST /api/refine` - 优化工作流
- ✅ `POST /api/validate` - 验证 DSL
- ✅ `GET /api/templates` - 获取模板列表
- ✅ `GET /api/templates/:id` - 获取模板详情

### 测试类型

1. **功能测试** - 验证 API 正常功能
2. **错误处理测试** - 验证错误场景
3. **边界情况测试** - 验证边界条件
4. **CORS 测试** - 验证跨域配置
5. **Content-Type 测试** - 验证响应格式

## Mock 策略

### LLM 服务 Mock

所有 LLM 相关调用都被 Mock，避免真实 API 调用：

```typescript
import { mockWorkflowService } from '../helpers/mock-llm.js';

vi.mock('../../services/workflow.service.js', () => ({
  getWorkflowService: () => mockWorkflowService(),
}));
```

### Mock 数据

- `mockDSL` - 标准的 Dify DSL 结构
- `mockWorkflowService()` - 工作流服务的 Mock 实现
- `mockWorkflowOrchestrator()` - 编排器的 Mock 实现
- `mockDSLValidator()` - 验证器的 Mock 实现
- `mockTemplateStore()` - 模板存储的 Mock 实现

## 测试最佳实践

### 1. 使用 Fastify 注入进行测试

不启动真实服务器，使用 `app.inject()` 进行 HTTP 请求模拟：

```typescript
const response = await app.inject({
  method: 'POST',
  url: '/api/generate',
  payload: { prompt: '创建一个问答工作流' },
});
```

### 2. 清理测试环境

每个测试后自动清理：

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### 3. 独立的测试应用

每个测试套件创建独立的 Fastify 实例：

```typescript
beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await closeTestApp(app);
});
```

### 4. 环境变量隔离

测试使用专用环境变量，不影响开发环境：

```typescript
process.env.NODE_ENV = 'test';
process.env.LLM_API_KEY = 'test-api-key';
process.env.LOG_LEVEL = 'silent';
```

## 持续集成

测试可以集成到 CI/CD 流程中：

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: pnpm test:run

- name: Generate coverage
  run: pnpm test:coverage
```

## 故障排查

### 测试超时

如果测试超时，可以增加超时时间（在 `vitest.config.ts` 中配置）：

```typescript
testTimeout: 30000, // 30 秒
```

### Mock 不生效

确保 Mock 声明在导入之前：

```typescript
vi.mock('../../services/workflow.service.js', () => ({
  // ...
}));
```

### 端口冲突

测试使用注入模式，不会占用实际端口。如果遇到端口问题，检查是否有服务器实例未关闭。

## 扩展测试

### 添加新的测试文件

1. 在 `src/__tests__/api/` 目录下创建新文件
2. 文件名格式：`<feature>.test.ts`
3. 导入必要的工具和 Mock
4. 编写测试用例

### 添加新的 Mock

在 `helpers/mock-llm.ts` 中添加新的 Mock 函数：

```typescript
export function mockNewService() {
  return {
    method: vi.fn().mockResolvedValue({}),
  };
}
```

## 参考资源

- [Vitest 文档](https://vitest.dev/)
- [Fastify Testing](https://www.fastify.io/docs/latest/Guides/Testing/)
- [Mock 最佳实践](https://vitest.dev/guide/mocking.html)
