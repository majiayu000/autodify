# 新增工作流模板

本次更新为 `packages/core` 添加了 5 个实用的内置工作流模板。

## 新增模板列表

### 1. 智能客服对话 (customer-support.ts)
- **分类**: agent
- **复杂度**: 4/5
- **节点数**: 10 个
- **功能**: 多轮对话的智能客服系统，包含意图识别、知识库检索和情感分析
- **特点**:
  - 意图分类（产品咨询、技术问题、订单问题、投诉建议）
  - 知识库检索与重排序
  - 情感分析（positive/neutral/negative/urgent）
  - 针对不同类别的专业回复
  - 结果聚合输出

### 2. 数据分析助手 (data-analysis.ts)
- **分类**: analysis
- **复杂度**: 3/5
- **节点数**: 9 个
- **功能**: 使用 Python 代码进行数据分析，包含数据预处理、分析和可视化
- **特点**:
  - 分析需求理解
  - 自动生成 Python 分析代码
  - 代码执行（支持 pandas, numpy, matplotlib 等）
  - 执行结果检查和分支处理
  - 成功时生成分析报告
  - 失败时提供错误分析和建议

### 3. 内容创作助手 (content-generation.ts)
- **分类**: writing
- **复杂度**: 3/5
- **节点数**: 7 个
- **功能**: 多步骤内容生成工作流，包含大纲规划、内容撰写和质量检查
- **特点**:
  - 支持多种内容类型（博客文章、营销文案、产品描述、社交媒体）
  - 自动生成内容大纲
  - 根据大纲撰写完整内容
  - 文章组装和格式化
  - 质量检查（评分 + 优缺点分析）
  - 最终润色优化
  - SEO 关键词整合

### 4. 代码审查助手 (code-review.ts)
- **分类**: analysis
- **复杂度**: 4/5
- **节点数**: 9 个
- **功能**: 自动化代码审查，包含代码质量检查、安全审计和最佳实践建议
- **特点**:
  - 支持多种编程语言（JavaScript/TypeScript/Python/Java/Go/Rust/C++等）
  - 代码结构分析
  - 代码质量检查（可读性、组织、错误处理等）
  - 安全审计（注入漏洞、身份验证、数据安全等）
  - 性能分析（算法复杂度、优化建议）
  - 最佳实践检查（语言惯用法、设计模式、SOLID 原则）
  - 生成改进建议代码
  - 综合报告输出

### 5. 文档问答系统 (document-qa.ts)
- **分类**: rag
- **复杂度**: 3/5
- **节点数**: 11 个
- **功能**: 针对长文档的智能问答，支持文档摘要、关键信息提取和多轮对话
- **特点**:
  - 文档预处理和结构分析
  - 条件分支：根据问题类型决定是否生成摘要
  - 文档摘要生成
  - 提取相关段落
  - 问题意图分析
  - 生成精准答案（带引用）
  - 答案质量评估
  - 后续问题建议

## 技术亮点

1. **完整的 DSL 定义**: 所有模板都使用 WorkflowBuilder API 生成完整的 Dify DSL
2. **合理的节点配置**: 每个节点都有适当的参数配置和提示词
3. **正确的变量引用**: 使用 `{{#node.field#}}` 格式正确引用变量
4. **丰富的元数据**: 包含描述、标签、关键词，便于模板匹配和搜索
5. **类型安全**: 所有代码都通过 TypeScript 类型检查

## 使用方式

```typescript
import {
  customerSupportTemplate,
  dataAnalysisTemplate,
  contentGenerationTemplate,
  codeReviewTemplate,
  documentQATemplate,
} from '@autodify/core';

// 使用默认参数生成 DSL
const dsl = customerSupportTemplate.build();

// 或使用自定义参数
const customDSL = customerSupportTemplate.build({
  model: 'gpt-4o',
  provider: 'openai',
  datasetIds: ['my-kb-id'],
});
```

## 模板注册

所有新模板已自动注册到 `builtinTemplates` 数组中，可通过 `TemplateStore` 进行匹配和检索：

```typescript
import { defaultTemplateStore } from '@autodify/core';

// 根据自然语言查询匹配模板
const matches = defaultTemplateStore.match('我想做代码审查');
console.log(matches[0].template.metadata.name); // 代码审查助手

// 按分类获取
const analysisTemplates = defaultTemplateStore.getByCategory('analysis');
// 返回: [dataAnalysisTemplate, codeReviewTemplate]
```

## 文件变更

### 新增文件
- `src/templates/builtin/customer-support.ts`
- `src/templates/builtin/data-analysis.ts`
- `src/templates/builtin/content-generation.ts`
- `src/templates/builtin/code-review.ts`
- `src/templates/builtin/document-qa.ts`

### 修改文件
- `src/templates/builtin/index.ts` - 导出新模板并添加到 builtinTemplates 数组
- `src/utils/cache.ts` - 修复 TypeScript 类型错误

## 测试结果

✓ 所有模板都成功通过 TypeScript 类型检查
✓ 所有模板都能正确生成 Dify DSL
✓ 节点数量和结构符合预期

| 模板 | 节点数 | 状态 |
|-----|-------|------|
| 智能客服对话 | 10 | ✓ |
| 数据分析助手 | 9 | ✓ |
| 内容创作助手 | 7 | ✓ |
| 代码审查助手 | 9 | ✓ |
| 文档问答系统 | 11 | ✓ |
