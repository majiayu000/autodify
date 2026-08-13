/**
 * Data Analysis Template
 */

import { createWorkflow } from '../../builder/index.js';
import type { WorkflowTemplate } from '../types.js';

export const dataAnalysisTemplate: WorkflowTemplate = {
  metadata: {
    id: 'data-analysis',
    name: '数据分析助手',
    description: '使用 Python 代码进行数据分析，包含数据预处理、分析和可视化',
    category: 'analysis',
    tags: ['数据分析', 'Python', '可视化', '统计'],
    keywords: [
      '数据分析',
      '数据处理',
      '统计',
      '可视化',
      'python',
      'data analysis',
      'statistics',
      'visualization',
      'pandas',
      '分析数据',
      '数据统计',
      '图表',
    ],
    nodeTypes: ['start', 'code', 'llm', 'if-else', 'end'],
    complexity: 3,
  },

  build: (params = {}) => {
    const model = (params['model'] as string) ?? 'gpt-4o';
    const provider = (params['provider'] as string) ?? 'openai';
    const allowedLibraries = (params['allowedLibraries'] as string[]) ?? [
      'pandas',
      'numpy',
      'matplotlib',
      'seaborn',
      'scipy',
      'sklearn',
    ];

    return (
      createWorkflow({
        name: '数据分析助手',
        description: '自动化数据分析和可视化工作流',
        icon: '📊',
      })
        .addStart({
          variables: [
            {
              name: 'analysis_request',
              label: '分析需求',
              type: 'paragraph',
              required: true,
              maxLength: 2000,
            },
            {
              name: 'data',
              label: '数据（CSV/JSON 格式）',
              type: 'paragraph',
              required: true,
              maxLength: 50000,
            },
          ],
        })
        // 分析需求理解
        .addLLM({
          id: 'understand-request',
          title: '理解分析需求',
          provider,
          model,
          temperature: 0.3,
          systemPrompt: `你是数据分析专家。分析用户的需求，输出结构化的分析计划。

输出格式（JSON）：
{
  "analysis_type": "描述性统计/相关性分析/趋势分析/分类预测等",
  "key_metrics": ["指标1", "指标2"],
  "visualization_needed": true/false,
  "steps": ["步骤1", "步骤2"]
}`,
          userPrompt: '分析需求：{{#start.analysis_request#}}',
        })
        // 生成分析代码
        .addLLM({
          id: 'generate-code',
          title: '生成分析代码',
          provider,
          model,
          temperature: 0.2,
          systemPrompt: `你是 Python 数据分析专家。根据分析计划生成完整的 Python 代码。

要求：
1. 使用 pandas, numpy 等标准库
2. 包含数据预处理（缺失值处理、异常值检测）
3. 进行所需的统计分析
4. 如需可视化，使用 matplotlib 或 seaborn
5. 代码要有详细注释
6. 最后打印分析结果

可用库：${allowedLibraries.join(', ')}

只输出 Python 代码，不要其他解释。`,
          userPrompt: `分析计划：{{#understand-request.text#}}

数据预览：
{{#start.data#}}`,
        })
        // 执行代码
        .addCode({
          id: 'execute-analysis',
          title: '执行数据分析',
          language: 'python3',
          code: '{{#generate-code.text#}}',
          inputs: [{ name: 'data', source: ['start', 'data'] }],
          outputs: [{ name: 'result', type: 'object' }],
        })
        // 检查执行结果
        .addIfElse({
          id: 'check-result',
          title: '检查执行结果',
          conditions: [
            {
              id: 'success',
              logicalOperator: 'and',
              rules: [
                {
                  variableSelector: ['execute-analysis', 'result'],
                  operator: 'is not empty',
                  value: '',
                },
              ],
            },
          ],
        })
        // 成功：生成分析报告
        .addLLM({
          id: 'generate-report',
          title: '生成分析报告',
          provider,
          model,
          temperature: 0.5,
          systemPrompt: `你是数据分析师。根据代码执行结果，生成易懂的分析报告。

报告应包括：
1. 数据概况
2. 关键发现
3. 统计结果解读
4. 建议和洞察

使用 Markdown 格式，结构清晰。`,
          userPrompt: `原始需求：{{#start.analysis_request#}}

分析计划：{{#understand-request.text#}}

执行结果：
{{#execute-analysis.result#}}`,
        })
        // 失败：错误分析
        .addLLM({
          id: 'analyze-error',
          title: '错误分析',
          provider,
          model,
          temperature: 0.3,
          systemPrompt: '你是 Python 专家。分析代码执行错误，提供解决建议。',
          userPrompt: `代码：
{{#generate-code.text#}}

错误信息：代码执行失败

请说明可能的问题原因和解决方案。`,
        })
        // 聚合结果
        .addAggregator({
          id: 'result-aggregator',
          title: '结果聚合',
          variables: [
            ['generate-report', 'text'],
            ['analyze-error', 'text'],
          ],
          outputType: 'string',
        })
        .addEnd({
          id: 'end',
          outputs: [
            { name: 'report', source: ['result-aggregator', 'output'] },
            { name: 'code', source: ['generate-code', 'text'] },
            { name: 'execution_result', source: ['execute-analysis', 'result'] },
          ],
        })
        .connect('start', 'understand-request')
        .connect('understand-request', 'generate-code')
        .connect('generate-code', 'execute-analysis')
        .connect('execute-analysis', 'check-result')
        .connect('check-result', 'generate-report', { sourceHandle: 'true' })
        .connect('check-result', 'analyze-error', { sourceHandle: 'false' })
        .connect('generate-report', 'result-aggregator')
        .connect('analyze-error', 'result-aggregator')
        .connect('result-aggregator', 'end')
        .build()
    );
  },
};
