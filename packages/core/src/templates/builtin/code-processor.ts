/**
 * Code Processor Template
 */

import { createWorkflow } from '../../builder/index.js';
import type { WorkflowTemplate } from '../types.js';

export const codeProcessorTemplate: WorkflowTemplate = {
  metadata: {
    id: 'code-processor',
    name: '代码数据处理',
    description: '使用代码节点处理数据，结合 LLM 进行分析',
    category: 'automation',
    tags: ['代码', '数据处理', 'Python', 'JavaScript'],
    keywords: [
      '代码',
      'Python',
      'JavaScript',
      '数据处理',
      '计算',
      '脚本',
      '自动化',
      '转换',
      '格式化',
    ],
    nodeTypes: ['start', 'code', 'llm', 'end'],
    complexity: 2,
  },

  build: (params = {}) => {
    const language = (params['language'] as 'python3' | 'javascript') ?? 'python3';
    const model = (params['model'] as string) ?? 'gpt-4o';
    const provider = (params['provider'] as string) ?? 'openai';

    const defaultCode =
      language === 'python3'
        ? `def main(data: str) -> dict:
    # 在这里处理数据
    lines = data.strip().split('\\n')
    processed = [line.upper() for line in lines]
    return {
        "result": '\\n'.join(processed),
        "count": len(lines)
    }`
        : `function main(data) {
    // 在这里处理数据
    const lines = data.trim().split('\\n');
    const processed = lines.map(line => line.toUpperCase());
    return {
        result: processed.join('\\n'),
        count: lines.length
    };
}`;

    const code = (params['code'] as string) ?? defaultCode;

    return createWorkflow({
      name: '代码数据处理',
      description: '使用代码节点处理数据',
      icon: '💻',
    })
      .addStart({
        variables: [
          {
            name: 'data',
            label: '输入数据',
            type: 'paragraph',
            required: true,
            maxLength: 50000,
          },
        ],
      })
      .addCode({
        id: 'code',
        title: '数据处理',
        language,
        code,
        inputs: [{ name: 'data', source: ['start', 'data'] }],
        outputs: [
          { name: 'result', type: 'string' },
          { name: 'count', type: 'number' },
        ],
      })
      .addLLM({
        id: 'llm',
        title: '结果分析',
        provider,
        model,
        temperature: 0.5,
        systemPrompt: '请分析以下处理后的数据，并提供简要说明。',
        userPrompt: '处理结果：{{#code.result#}}\n\n数量：{{#code.count#}}',
      })
      .addEnd({
        id: 'end',
        outputs: [
          { name: 'processed_data', source: ['code', 'result'] },
          { name: 'analysis', source: ['llm', 'text'] },
        ],
      })
      .connect('start', 'code')
      .connect('code', 'llm')
      .connect('llm', 'end')
      .build();
  },
};
