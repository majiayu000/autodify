/**
 * Content Generation Template
 */

import { createWorkflow } from '../../builder/index.js';
import type { WorkflowTemplate } from '../types.js';

export const contentGenerationTemplate: WorkflowTemplate = {
  metadata: {
    id: 'content-generation',
    name: '内容创作助手',
    description: '多步骤内容生成工作流，包含大纲规划、内容撰写和质量检查',
    category: 'writing',
    tags: ['写作', '内容创作', '文章', 'SEO'],
    keywords: [
      '写作', '创作', '文章', '博客', '内容生成',
      'content', 'writing', 'blog', 'article', 'copywriting',
      '写文章', '生成内容', 'SEO', '营销文案',
    ],
    nodeTypes: ['start', 'llm', 'parameter-extractor', 'iteration', 'template-transform', 'end'],
    complexity: 3,
  },

  build: (params = {}) => {
    const model = (params['model'] as string) ?? 'gpt-4o';
    const provider = (params['provider'] as string) ?? 'openai';
    const contentTypes = (params['contentTypes'] as string[]) ?? [
      '博客文章',
      '营销文案',
      '产品描述',
      '社交媒体',
    ];

    return createWorkflow({
      name: '内容创作助手',
      description: '从大纲到成稿的完整内容创作流程',
      icon: '✍️',
    })
      .addStart({
        variables: [
          {
            name: 'topic',
            label: '主题',
            type: 'text-input',
            required: true,
            maxLength: 200,
          },
          {
            name: 'content_type',
            label: '内容类型',
            type: 'select',
            required: true,
            options: contentTypes,
          },
          {
            name: 'target_audience',
            label: '目标受众',
            type: 'text-input',
            required: false,
            maxLength: 200,
          },
          {
            name: 'keywords',
            label: 'SEO 关键词（可选）',
            type: 'text-input',
            required: false,
            maxLength: 200,
          },
          {
            name: 'tone',
            label: '语气风格',
            type: 'select',
            required: false,
            options: ['专业', '友好', '幽默', '正式', '随性'],
            default: '专业',
          },
        ],
      })
      // 生成内容大纲
      .addLLM({
        id: 'create-outline',
        title: '创建内容大纲',
        provider,
        model,
        temperature: 0.7,
        systemPrompt: `你是专业的内容策划师。根据主题和要求，创建详细的内容大纲。

输出格式：
1. 标题建议（3 个选项）
2. 核心观点
3. 章节大纲（3-5 个章节，每个章节包含 2-3 个要点）
4. 建议字数
5. SEO 优化建议`,
        userPrompt: `主题：{{#start.topic#}}
内容类型：{{#start.content_type#}}
目标受众：{{#start.target_audience#}}
关键词：{{#start.keywords#}}
语气风格：{{#start.tone#}}`,
      })
      // 撰写主要内容
      .addLLM({
        id: 'write-main-content',
        title: '撰写主要内容',
        provider,
        model,
        temperature: 0.8,
        systemPrompt: `你是专业的内容撰写者。根据大纲，撰写完整的高质量内容。

要求：
1. 严格按照大纲结构撰写
2. 内容充实、论点清晰
3. 适当使用案例和数据支撑
4. 保持指定的语气风格
5. 自然融入 SEO 关键词
6. 段落层次分明`,
        userPrompt: `主题：{{#start.topic#}}
语气风格：{{#start.tone#}}
目标受众：{{#start.target_audience#}}
SEO关键词：{{#start.keywords#}}

大纲：
{{#create-outline.text#}}

请根据大纲撰写完整的文章内容。`,
      })
      // 组装完整文章
      .addTemplate({
        id: 'assemble-article',
        title: '组装文章',
        template: `# {{#start.topic#}}

{{#write-main-content.text#}}

---
*关键词: {{#start.keywords#}}*
*目标受众: {{#start.target_audience#}}*`,
        variables: [
          { name: 'topic', source: ['start', 'topic'] },
          { name: 'main_content', source: ['write-main-content', 'text'] },
          { name: 'keywords', source: ['start', 'keywords'] },
          { name: 'target_audience', source: ['start', 'target_audience'] },
        ],
      })
      // 质量检查和优化
      .addLLM({
        id: 'quality-check',
        title: '质量检查',
        provider,
        model,
        temperature: 0.3,
        systemPrompt: `你是资深编辑。审阅文章并提供优化建议。

检查要点：
1. 内容完整性和逻辑性
2. 语法和表达
3. SEO 优化程度
4. 可读性
5. 目标受众契合度

输出格式：
- 评分（1-10）
- 优点（3 条）
- 改进建议（3 条）
- 是否需要重写（是/否）`,
        userPrompt: `文章内容：
{{#assemble-article.output#}}

原始要求：
- 主题：{{#start.topic#}}
- 类型：{{#start.content_type#}}
- 受众：{{#start.target_audience#}}`,
      })
      // 最终优化（可选）
      .addLLM({
        id: 'final-polish',
        title: '最终润色',
        provider,
        model,
        temperature: 0.5,
        systemPrompt: '你是专业编辑。根据质量检查建议，对文章进行最终润色。保持原有结构，优化表达和细节。',
        userPrompt: `文章：
{{#assemble-article.output#}}

优化建议：
{{#quality-check.text#}}`,
      })
      .addEnd({
        id: 'end',
        outputs: [
          { name: 'final_content', source: ['final-polish', 'text'] },
          { name: 'outline', source: ['create-outline', 'text'] },
          { name: 'quality_report', source: ['quality-check', 'text'] },
        ],
      })
      .connect('start', 'create-outline')
      .connect('create-outline', 'write-main-content')
      .connect('write-main-content', 'assemble-article')
      .connect('assemble-article', 'quality-check')
      .connect('quality-check', 'final-polish')
      .connect('final-polish', 'end')
      .build();
  },
};
