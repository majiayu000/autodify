/**
 * Intent Router Template
 */

import { createWorkflow } from '../../builder/index.js';
import type { WorkflowTemplate } from '../types.js';

export const intentRouterTemplate: WorkflowTemplate = {
  metadata: {
    id: 'intent-router',
    name: '意图路由',
    description: '根据用户意图分类，路由到不同的处理分支',
    category: 'automation',
    tags: ['分类', '路由', '意图识别', '多分支'],
    keywords: [
      '意图', '分类', '路由', '分支', '判断', 'intent', 'router',
      '智能客服', '多场景', '场景识别',
    ],
    nodeTypes: ['start', 'question-classifier', 'llm', 'variable-aggregator', 'end'],
    complexity: 3,
  },

  build: (params = {}) => {
    const classes = (params['classes'] as Array<{ id: string; name: string }>) ?? [
      { id: 'product', name: '产品咨询' },
      { id: 'tech', name: '技术支持' },
      { id: 'other', name: '其他问题' },
    ];
    const model = (params['model'] as string) ?? 'gpt-4o';
    const provider = (params['provider'] as string) ?? 'openai';

    const builder = createWorkflow({
      name: '意图路由',
      description: '根据用户意图分类，路由到不同处理分支',
      icon: '🔀',
    })
      .addStart({
        variables: [
          {
            name: 'input',
            label: '用户输入',
            type: 'paragraph',
            required: true,
            maxLength: 2000,
          },
        ],
      })
      .addQuestionClassifier({
        id: 'classifier',
        title: '意图分类',
        queryFrom: ['start', 'input'],
        provider,
        model: 'gpt-4o-mini',
        classes,
        instruction: '根据用户输入的内容，判断其意图属于哪个类别。',
      });

    // 为每个分类添加处理节点
    const llmNodeIds: string[] = [];
    for (const cls of classes) {
      const llmId = `llm-${cls.id}`;
      llmNodeIds.push(llmId);

      builder.addLLM({
        id: llmId,
        title: `${cls.name}处理`,
        provider,
        model,
        temperature: 0.7,
        systemPrompt: `你是${cls.name}专家。请针对用户的${cls.name}相关问题提供专业的回答。`,
        userPrompt: '{{#start.input#}}',
      });
    }

    // 添加聚合节点
    builder.addAggregator({
      id: 'aggregator',
      title: '结果聚合',
      variables: llmNodeIds.map((id) => [id, 'text'] as [string, string]),
      outputType: 'string',
    });

    // 添加结束节点
    builder.addEnd({
      id: 'end',
      outputs: [{ name: 'result', source: ['aggregator', 'output'] }],
    });

    // 连接节点
    builder.connect('start', 'classifier');

    for (let i = 0; i < classes.length; i++) {
      builder.connect('classifier', llmNodeIds[i]!, { sourceHandle: classes[i]!.id });
      builder.connect(llmNodeIds[i]!, 'aggregator');
    }

    builder.connect('aggregator', 'end');

    return builder.build();
  },
};
