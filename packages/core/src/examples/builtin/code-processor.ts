/**
 * Code Processor Example
 */

import type { FewShotExample } from '../types.js';
import { codeProcessorTemplate } from '../../templates/index.js';

export const codeProcessorExample: FewShotExample = {
  metadata: {
    id: 'example-code-processor',
    name: '代码数据处理',
    description: '使用代码节点进行数据处理，结合 LLM 分析结果',
    category: 'code',
    keywords: ['代码', 'python', 'javascript', '处理', '计算', '脚本', '转换'],
    nodeTypes: ['start', 'code', 'llm', 'end'],
    complexity: 2,
  },
  prompt: '创建一个工作流，用 Python 代码处理用户输入的数据，然后用 AI 分析处理结果',
  dsl: codeProcessorTemplate.build({
    language: 'python3',
    code: `def main(data: str) -> dict:
    # 处理数据：将每行转为大写
    lines = data.strip().split('\\n')
    processed = [line.upper() for line in lines]
    return {
        "result": '\\n'.join(processed),
        "count": len(lines)
    }`,
  }),
  explanation: '这个工作流展示了代码节点的使用：接收用户输入的原始数据，通过 Python 代码进行预处理（如格式转换、数据清洗、统计计算等），然后将处理结果传给 LLM 进行智能分析。适合需要精确数据处理与智能分析相结合的场景。',
};
