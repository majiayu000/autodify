/**
 * Customer Support Template
 */

import { createWorkflow } from '../../builder/index.js';
import type { WorkflowTemplate } from '../types.js';

export const customerSupportTemplate: WorkflowTemplate = {
  metadata: {
    id: 'customer-support',
    name: '智能客服对话',
    description: '多轮对话的智能客服系统，包含意图识别、知识库检索和情感分析',
    category: 'agent',
    tags: ['客服', '对话', '多轮', '情感分析'],
    keywords: [
      '客服', '客户服务', '对话', '聊天', '咨询', '支持',
      'customer service', 'support', 'chat', '智能客服',
      '售后', '在线客服',
    ],
    nodeTypes: ['start', 'question-classifier', 'knowledge-retrieval', 'llm', 'if-else', 'variable-aggregator', 'end'],
    complexity: 4,
  },

  build: (params = {}) => {
    const datasetIds = (params['datasetIds'] as string[]) ?? ['customer-support-kb'];
    const model = (params['model'] as string) ?? 'gpt-4o';
    const provider = (params['provider'] as string) ?? 'openai';
    const categories = (params['categories'] as Array<{ id: string; name: string }>) ?? [
      { id: 'product', name: '产品咨询' },
      { id: 'technical', name: '技术问题' },
      { id: 'order', name: '订单问题' },
      { id: 'complaint', name: '投诉建议' },
    ];

    const builder = createWorkflow({
      name: '智能客服对话',
      description: '包含意图识别和知识库检索的智能客服系统',
      icon: '🎧',
    })
      .addStart({
        variables: [
          {
            name: 'user_message',
            label: '用户消息',
            type: 'paragraph',
            required: true,
            maxLength: 2000,
          },
          {
            name: 'conversation_history',
            label: '对话历史（可选）',
            type: 'paragraph',
            required: false,
            maxLength: 10000,
          },
        ],
      })
      // 意图分类
      .addQuestionClassifier({
        id: 'intent-classifier',
        title: '意图识别',
        queryFrom: ['start', 'user_message'],
        provider,
        model: 'gpt-4o-mini',
        classes: categories,
        instruction: '分析客户消息，判断其咨询类型。考虑对话历史上下文。',
      })
      // 知识库检索
      .addKnowledgeRetrieval({
        id: 'kb-retrieval',
        title: '知识库检索',
        queryFrom: ['start', 'user_message'],
        datasetIds,
        topK: 3,
        scoreThreshold: 0.6,
        rerankingEnabled: true,
        rerankingModel: {
          provider: 'cohere',
          model: 'rerank-multilingual-v2.0',
        },
      })
      // 情感分析（通过 LLM 实现）
      .addLLM({
        id: 'sentiment-analysis',
        title: '情感分析',
        provider,
        model: 'gpt-4o-mini',
        temperature: 0.3,
        systemPrompt: `分析客户消息的情感倾向，返回以下之一：
- positive（正面）
- neutral（中性）
- negative（负面）
- urgent（紧急/愤怒）

只返回一个词，不要其他解释。`,
        userPrompt: '{{#start.user_message#}}',
      });

    // 为每个类别添加专业回复节点
    const responseNodeIds: string[] = [];
    for (const category of categories) {
      const nodeId = `response-${category.id}`;
      responseNodeIds.push(nodeId);

      const systemPrompts: Record<string, string> = {
        product: '你是产品咨询专家。请基于知识库内容，清晰准确地回答客户关于产品的问题。如果知识库中没有相关信息，请礼貌地说明。',
        technical: '你是技术支持专家。请基于知识库内容，提供详细的技术解决方案。必要时提供分步指导。',
        order: '你是订单处理专家。请基于知识库内容，帮助客户处理订单相关问题。注意保护客户隐私。',
        complaint: '你是客户关系专家。请以同理心回应客户的投诉或建议，表达理解并提供解决方案。',
      };

      builder.addLLM({
        id: nodeId,
        title: `${category.name}回复`,
        provider,
        model,
        temperature: 0.7,
        systemPrompt: systemPrompts[category.id] ?? '你是一个专业的客服助手。',
        userPrompt: `客户消息：{{#start.user_message#}}

对话历史：{{#start.conversation_history#}}

情感状态：{{#sentiment-analysis.text#}}

请提供专业、友好的回复。`,
        context: {
          enabled: true,
          variableSelector: ['kb-retrieval', 'result'],
        },
      });
    }

    // 添加聚合节点
    builder.addAggregator({
      id: 'response-aggregator',
      title: '回复聚合',
      variables: responseNodeIds.map((id) => [id, 'text'] as [string, string]),
      outputType: 'string',
    });

    // 添加结束节点
    builder.addEnd({
      id: 'end',
      outputs: [
        { name: 'reply', source: ['response-aggregator', 'output'] },
        { name: 'intent', source: ['intent-classifier', 'class_name'] },
        { name: 'sentiment', source: ['sentiment-analysis', 'text'] },
      ],
    });

    // 连接节点
    builder
      .connect('start', 'intent-classifier')
      .connect('start', 'kb-retrieval')
      .connect('start', 'sentiment-analysis');

    for (let i = 0; i < categories.length; i++) {
      builder.connect('intent-classifier', responseNodeIds[i]!, { sourceHandle: categories[i]!.id });
      builder.connect('kb-retrieval', responseNodeIds[i]!);
      builder.connect('sentiment-analysis', responseNodeIds[i]!);
      builder.connect(responseNodeIds[i]!, 'response-aggregator');
    }

    builder.connect('response-aggregator', 'end');

    return builder.build();
  },
};
