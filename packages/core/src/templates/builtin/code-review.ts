/**
 * Code Review Template
 */

import { createWorkflow } from '../../builder/index.js';
import type { WorkflowTemplate } from '../types.js';

export const codeReviewTemplate: WorkflowTemplate = {
  metadata: {
    id: 'code-review',
    name: '代码审查助手',
    description: '自动化代码审查，包含代码质量检查、安全审计和最佳实践建议',
    category: 'analysis',
    tags: ['代码审查', 'Code Review', '质量检查', '安全'],
    keywords: [
      '代码审查', '代码检查', 'code review', 'review',
      '代码质量', '安全审计', '最佳实践', 'bug',
      '审查代码', '检查代码', '代码优化',
    ],
    nodeTypes: ['start', 'parameter-extractor', 'llm', 'code', 'variable-aggregator', 'end'],
    complexity: 4,
  },

  build: (params = {}) => {
    const model = (params['model'] as string) ?? 'gpt-4o';
    const provider = (params['provider'] as string) ?? 'openai';
    // Review aspects for future use
    // @ts-expect-error - unused for now but part of the API
    const reviewAspects = (params['reviewAspects'] as string[]) ?? [
      '代码质量',
      '安全问题',
      '性能优化',
      '最佳实践',
    ];

    return createWorkflow({
      name: '代码审查助手',
      description: '多维度自动化代码审查系统',
      icon: '🔍',
    })
      .addStart({
        variables: [
          {
            name: 'code',
            label: '代码',
            type: 'paragraph',
            required: true,
            maxLength: 50000,
          },
          {
            name: 'language',
            label: '编程语言',
            type: 'select',
            required: true,
            options: [
              'JavaScript',
              'TypeScript',
              'Python',
              'Java',
              'Go',
              'Rust',
              'C++',
              'Other',
            ],
          },
          {
            name: 'context',
            label: '代码上下文（可选）',
            type: 'paragraph',
            required: false,
            maxLength: 2000,
          },
        ],
      })
      // 代码结构分析
      .addLLM({
        id: 'analyze-structure',
        title: '分析代码结构',
        provider,
        model: 'gpt-4o-mini',
        temperature: 0.2,
        systemPrompt: `分析 {{#start.language#}} 代码的结构组成。

输出格式（JSON）：
{
  "functions": ["函数1", "函数2"],
  "classes": ["类1", "类2"],
  "dependencies": ["依赖1", "依赖2"],
  "complexity": "低/中/高"
}`,
        userPrompt: `代码：
\`\`\`{{#start.language#}}
{{#start.code#}}
\`\`\``,
      })
      // 代码质量检查
      .addLLM({
        id: 'quality-check',
        title: '代码质量检查',
        provider,
        model,
        temperature: 0.3,
        systemPrompt: `你是资深 {{#start.language#}} 工程师。检查代码质量。

检查项：
1. 代码可读性（命名、注释、格式）
2. 代码组织（模块化、耦合度）
3. 错误处理
4. 测试覆盖
5. 文档完整性

输出格式：
## 评分：X/10

## 优点
- 点1
- 点2

## 问题
- 问题1（严重程度：高/中/低）
- 问题2

## 建议
- 建议1
- 建议2`,
        userPrompt: `代码：
\`\`\`{{#start.language#}}
{{#start.code#}}
\`\`\`

上下文：{{#start.context#}}`,
      })
      // 安全审计
      .addLLM({
        id: 'security-audit',
        title: '安全审计',
        provider,
        model,
        temperature: 0.2,
        systemPrompt: `你是安全专家。审查代码的安全问题。

重点检查：
1. 注入漏洞（SQL、XSS、命令注入等）
2. 身份验证和授权
3. 敏感数据处理
4. 加密和哈希
5. 依赖安全
6. 输入验证

对每个问题标注风险等级（严重/高/中/低）。`,
        userPrompt: `语言：{{#start.language#}}

代码：
\`\`\`
{{#start.code#}}
\`\`\`

依赖项：见代码分析结果`,
      })
      // 性能分析
      .addLLM({
        id: 'performance-analysis',
        title: '性能分析',
        provider,
        model,
        temperature: 0.3,
        systemPrompt: `你是性能优化专家。分析代码的性能问题。

检查项：
1. 算法复杂度
2. 不必要的计算
3. 内存使用
4. 数据库查询优化
5. 异步处理
6. 缓存机会

提供具体的优化建议和预期收益。`,
        userPrompt: `代码：
\`\`\`{{#start.language#}}
{{#start.code#}}
\`\`\`

复杂度评估：见结构分析

结构分析：
{{#analyze-structure.text#}}`,
      })
      // 最佳实践检查
      .addLLM({
        id: 'best-practices',
        title: '最佳实践检查',
        provider,
        model,
        temperature: 0.3,
        systemPrompt: `你是 {{#start.language#}} 专家。检查代码是否符合该语言的最佳实践和编码规范。

检查项：
1. 语言特定的惯用法
2. 设计模式应用
3. SOLID 原则
4. DRY 原则
5. 代码异味（Code Smells）

引用具体的最佳实践指南。`,
        userPrompt: `代码：
\`\`\`{{#start.language#}}
{{#start.code#}}
\`\`\``,
      })
      // 生成改进建议代码（可选）
      .addLLM({
        id: 'suggest-improvements',
        title: '生成改进建议',
        provider,
        model,
        temperature: 0.4,
        systemPrompt: `基于审查结果，提供改进后的代码示例。

要求：
1. 只针对关键问题提供改进
2. 保持原有功能不变
3. 添加必要的注释说明改进点
4. 如果改动较大，分步骤说明`,
        userPrompt: `原始代码：
\`\`\`{{#start.language#}}
{{#start.code#}}
\`\`\`

质量问题：
{{#quality-check.text#}}

安全问题：
{{#security-audit.text#}}

性能问题：
{{#performance-analysis.text#}}`,
      })
      // 生成综合报告
      .addTemplate({
        id: 'generate-report',
        title: '生成审查报告',
        template: `# 代码审查报告

## 基本信息
- **语言**: {{#start.language#}}
- **结构分析**: {{#analyze-structure.text#}}

---

## 1. 代码质量
{{#quality-check.text#}}

---

## 2. 安全审计
{{#security-audit.text#}}

---

## 3. 性能分析
{{#performance-analysis.text#}}

---

## 4. 最佳实践
{{#best-practices.text#}}

---

## 5. 改进建议
{{#suggest-improvements.text#}}

---

## 总结

根据以上分析，建议优先处理：
1. 安全问题（如有严重/高风险项）
2. 性能瓶颈
3. 代码质量问题

*本报告由 AI 自动生成，建议结合人工审查*`,
        variables: [
          { name: 'language', source: ['start', 'language'] },
          { name: 'structure', source: ['analyze-structure', 'text'] },
          { name: 'quality', source: ['quality-check', 'text'] },
          { name: 'security', source: ['security-audit', 'text'] },
          { name: 'performance', source: ['performance-analysis', 'text'] },
          { name: 'practices', source: ['best-practices', 'text'] },
          { name: 'improvements', source: ['suggest-improvements', 'text'] },
        ],
      })
      .addEnd({
        id: 'end',
        outputs: [
          { name: 'report', source: ['generate-report', 'output'] },
          { name: 'quality_score', source: ['quality-check', 'text'] },
          { name: 'security_issues', source: ['security-audit', 'text'] },
          { name: 'improved_code', source: ['suggest-improvements', 'text'] },
        ],
      })
      .connect('start', 'analyze-structure')
      .connect('analyze-structure', 'quality-check')
      .connect('analyze-structure', 'security-audit')
      .connect('analyze-structure', 'performance-analysis')
      .connect('start', 'best-practices')
      .connect('quality-check', 'suggest-improvements')
      .connect('security-audit', 'suggest-improvements')
      .connect('performance-analysis', 'suggest-improvements')
      .connect('quality-check', 'generate-report')
      .connect('security-audit', 'generate-report')
      .connect('performance-analysis', 'generate-report')
      .connect('best-practices', 'generate-report')
      .connect('suggest-improvements', 'generate-report')
      .connect('generate-report', 'end')
      .build();
  },
};
