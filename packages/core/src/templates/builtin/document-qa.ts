/**
 * Document Q&A Template
 */

import { createWorkflow } from '../../builder/index.js';
import type { WorkflowTemplate } from '../types.js';

export const documentQATemplate: WorkflowTemplate = {
  metadata: {
    id: 'document-qa',
    name: '文档问答系统',
    description: '针对长文档的智能问答，支持文档摘要、关键信息提取和多轮对话',
    category: 'rag',
    tags: ['文档', '问答', 'RAG', '摘要'],
    keywords: [
      '文档问答', '文档分析', '问文档', 'document qa',
      'PDF', '长文本', '文档摘要', '信息提取',
      '读文档', '文档理解', '合同分析',
    ],
    nodeTypes: ['start', 'document-extractor', 'knowledge-retrieval', 'llm', 'if-else', 'variable-aggregator', 'end'],
    complexity: 3,
  },

  build: (params = {}) => {
    const model = (params['model'] as string) ?? 'gpt-4o';
    const provider = (params['provider'] as string) ?? 'openai';
    const enableSummary = (params['enableSummary'] as boolean) ?? true;

    const builder = createWorkflow({
      name: '文档问答系统',
      description: '智能文档分析和问答系统',
      icon: '📄',
    })
      .addStart({
        variables: [
          {
            name: 'document',
            label: '文档内容',
            type: 'paragraph',
            required: true,
            maxLength: 100000,
          },
          {
            name: 'question',
            label: '问题',
            type: 'paragraph',
            required: true,
            maxLength: 2000,
          },
          {
            name: 'question_type',
            label: '问题类型（可选）',
            type: 'select',
            required: false,
            options: [
              '事实查询',
              '信息提取',
              '文档摘要',
              '对比分析',
              '推理判断',
            ],
          },
        ],
      })
      // 文档预处理和分段
      .addLLM({
        id: 'preprocess-document',
        title: '文档预处理',
        provider,
        model: 'gpt-4o-mini',
        temperature: 0.2,
        systemPrompt: `你是文档处理专家。分析文档结构并提取关键信息。

输出格式（JSON）：
{
  "document_type": "技术文档/合同/报告/文章/其他",
  "key_sections": ["章节1", "章节2"],
  "entities": ["实体1", "实体2"],
  "summary": "文档简要概述（50字内）"
}`,
        userPrompt: `文档内容：
{{#start.document#}}`,
      })
      // 判断是否需要文档摘要
      .addIfElse({
        id: 'check-need-summary',
        title: '检查是否需要摘要',
        conditions: [
          {
            id: 'need-summary',
            logicalOperator: 'or',
            rules: [
              {
                variableSelector: ['start', 'question_type'],
                operator: 'contains',
                value: '摘要',
              },
            ],
          },
        ],
      })
      // 生成文档摘要
      .addLLM({
        id: 'generate-summary',
        title: '生成文档摘要',
        provider,
        model,
        temperature: 0.5,
        systemPrompt: `你是专业的文档摘要专家。生成结构化的文档摘要。

摘要应包括：
1. 核心主题
2. 关键要点（3-5 条）
3. 重要数据和结论
4. 文档价值和适用场景

使用 Markdown 格式，层次清晰。`,
        userPrompt: `文档类型：{{#preprocess-document.text#}}

完整文档：
{{#start.document#}}`,
      });

    // 智能检索相关段落
    if (enableSummary) {
      builder.addLLM({
        id: 'extract-relevant-sections',
        title: '提取相关段落',
        provider,
        model: 'gpt-4o-mini',
        temperature: 0.2,
        systemPrompt: `你是信息检索专家。从文档中提取与问题最相关的段落。

要求：
1. 提取 2-5 个最相关的段落
2. 保持原文，不要改写
3. 如果整个文档都相关，说明原因
4. 如果找不到相关内容，明确指出`,
        userPrompt: `文档：
{{#start.document#}}

问题：{{#start.question#}}

文档结构信息：{{#preprocess-document.text#}}`,
      });
    }

    builder
      // 分析问题类型和意图
      .addLLM({
        id: 'analyze-question',
        title: '分析问题意图',
        provider,
        model: 'gpt-4o-mini',
        temperature: 0.3,
        systemPrompt: `分析用户问题的类型和意图。

输出格式（JSON）：
{
  "question_type": "事实查询/信息提取/对比分析/推理判断/开放讨论",
  "key_focuses": ["焦点1", "焦点2"],
  "needs_reasoning": true/false,
  "expected_answer_format": "描述"
}`,
        userPrompt: `问题：{{#start.question#}}
文档类型：{{#preprocess-document.text#}}`,
      })
      // 生成精准答案
      .addLLM({
        id: 'generate-answer',
        title: '生成答案',
        provider,
        model,
        temperature: 0.5,
        systemPrompt: `你是专业的文档分析师。基于文档内容回答问题。

回答原则：
1. 只基于文档内容，不要编造
2. 明确区分事实和推断
3. 引用具体段落或位置
4. 如果文档中没有相关信息，诚实说明
5. 对于复杂问题，分步骤解释
6. 必要时使用表格或列表

引用格式：根据文档第X部分，"原文引用"...`,
        userPrompt: `文档内容：
{{#start.document#}}

相关段落：
{{#extract-relevant-sections.text#}}

问题：{{#start.question#}}

问题分析：{{#analyze-question.text#}}

请提供准确、有据的回答。`,
      })
      // 答案质量评估
      .addLLM({
        id: 'evaluate-answer',
        title: '答案质量评估',
        provider,
        model: 'gpt-4o-mini',
        temperature: 0.2,
        systemPrompt: `评估答案的质量和完整性。

评估维度：
1. 准确性（是否基于文档事实）
2. 完整性（是否充分回答问题）
3. 清晰度（表达是否清楚）
4. 引用质量（是否有效引用）

输出格式：
- 评分：X/10
- 优点：...
- 不足：...
- 是否建议补充信息：是/否`,
        userPrompt: `原始问题：{{#start.question#}}

生成的答案：
{{#generate-answer.text#}}

文档内容：
{{#start.document#}}`,
      })
      // 可选：生成后续问题建议
      .addLLM({
        id: 'suggest-followup',
        title: '建议后续问题',
        provider,
        model: 'gpt-4o-mini',
        temperature: 0.7,
        systemPrompt: `基于当前问答，建议 3-5 个有价值的后续问题。

这些问题应该：
1. 深入挖掘相关主题
2. 探索文档的其他重要方面
3. 帮助用户更全面理解文档

直接输出问题列表，每行一个问题。`,
        userPrompt: `文档类型：{{#preprocess-document.text#}}

已回答问题：{{#start.question#}}

答案：{{#generate-answer.text#}}`,
      })
      // 聚合最终结果
      .addAggregator({
        id: 'final-result',
        title: '结果聚合',
        variables: [
          ['generate-summary', 'text'],
          ['generate-answer', 'text'],
        ],
        outputType: 'string',
      })
      .addEnd({
        id: 'end',
        outputs: [
          { name: 'answer', source: ['generate-answer', 'text'] },
          { name: 'document_summary', source: ['generate-summary', 'text'] },
          { name: 'quality_assessment', source: ['evaluate-answer', 'text'] },
          { name: 'followup_questions', source: ['suggest-followup', 'text'] },
          { name: 'relevant_sections', source: ['extract-relevant-sections', 'text'] },
        ],
      });

    // 连接节点
    builder
      .connect('start', 'preprocess-document')
      .connect('preprocess-document', 'check-need-summary')
      .connect('check-need-summary', 'generate-summary', { sourceHandle: 'true' })
      .connect('preprocess-document', 'extract-relevant-sections')
      .connect('preprocess-document', 'analyze-question')
      .connect('extract-relevant-sections', 'generate-answer')
      .connect('analyze-question', 'generate-answer')
      .connect('generate-answer', 'evaluate-answer')
      .connect('generate-answer', 'suggest-followup')
      .connect('generate-summary', 'final-result')
      .connect('generate-answer', 'final-result')
      .connect('final-result', 'end');

    return builder.build();
  },
};
