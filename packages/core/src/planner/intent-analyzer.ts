/**
 * Intent Analyzer - Extract intent from natural language
 */

import type { WorkflowIntent, WorkflowFeature, FeatureType } from './types.js';

/**
 * Feature detection rules
 */
interface FeatureRule {
  type: FeatureType;
  keywords: string[];
  description: string;
}

/**
 * Feature detection rules database
 */
const FEATURE_RULES: FeatureRule[] = [
  {
    type: 'llm',
    keywords: [
      '回答', '生成', '对话', '聊天', '问答', 'qa', 'chat',
      '分析', '总结', '翻译', '写', '创作', 'ai', 'gpt',
    ],
    description: 'LLM 对话/生成',
  },
  {
    type: 'rag',
    keywords: [
      '知识库', '检索', '文档', 'rag', '向量', '搜索文档',
      '知识', '资料', '数据库查询', '文献',
    ],
    description: '知识库检索',
  },
  {
    type: 'classification',
    keywords: [
      '分类', '识别', '判断类型', '意图', '路由', 'classify',
      '归类', '分辨', '区分',
    ],
    description: '意图/问题分类',
  },
  {
    type: 'conditional',
    keywords: [
      '条件', '如果', '否则', 'if', 'else', '分支',
      '判断', '选择', '根据',
    ],
    description: '条件分支',
  },
  {
    type: 'iteration',
    keywords: [
      '循环', '迭代', '遍历', '批量', 'loop', 'iterate',
      '逐个', '每个', '列表处理',
    ],
    description: '循环迭代',
  },
  {
    type: 'code',
    keywords: [
      '代码', 'python', 'javascript', '脚本', '计算',
      '处理', '转换', '格式化', '解析',
    ],
    description: '代码执行',
  },
  {
    type: 'api',
    keywords: [
      'api', 'http', '接口', '请求', 'webhook', 'rest',
      '调用', '获取数据', '外部服务',
    ],
    description: 'API 调用',
  },
  {
    type: 'agent',
    keywords: [
      '智能体', 'agent', '工具', '自主', '规划',
      '多步骤', '自动执行',
    ],
    description: '智能体',
  },
  {
    type: 'multi-model',
    keywords: [
      '多模型', '并行', '对比', '多个ai', '多个llm',
      '同时', '比较结果',
    ],
    description: '多模型并行',
  },
  {
    type: 'streaming',
    keywords: [
      '流式', 'streaming', '实时', '逐字', '打字效果',
    ],
    description: '流式输出',
  },
];

/**
 * Complexity indicators with weights
 */
const COMPLEXITY_INDICATORS: Array<{ keywords: string[]; weight: number }> = [
  {
    keywords: ['简单', '基础', '基本', '单一', 'simple'],
    weight: -1,
  },
  {
    keywords: ['条件', '分支', 'if', 'else'],
    weight: 1,
  },
  {
    keywords: ['循环', '迭代', '批量'],
    weight: 1,
  },
  {
    keywords: ['知识库', 'rag', '检索'],
    weight: 1,
  },
  {
    keywords: ['多个', '并行', '复杂', '高级'],
    weight: 1,
  },
  {
    keywords: ['智能体', 'agent', '自主'],
    weight: 2,
  },
];

/**
 * Analyze user input to extract workflow intent
 */
export function analyzeIntent(input: string): WorkflowIntent {
  const normalizedInput = normalizeText(input);

  // Extract features
  const features = detectFeatures(normalizedInput);

  // Estimate complexity
  const complexity = estimateComplexity(normalizedInput, features);

  // Extract action and domain
  const { action, domain } = extractActionDomain(normalizedInput);

  // Extract requirements
  const requirements = extractRequirements(normalizedInput);

  return {
    action,
    domain,
    requirements,
    features,
    complexity,
  };
}

/**
 * Detect features needed based on keywords
 */
function detectFeatures(input: string): WorkflowFeature[] {
  const features: WorkflowFeature[] = [];

  for (const rule of FEATURE_RULES) {
    const matched = rule.keywords.some((kw) => input.includes(kw));
    if (matched) {
      // Determine if required based on context
      const isRequired = determineRequired(input, rule.keywords);
      features.push({
        type: rule.type,
        description: rule.description,
        required: isRequired,
      });
    }
  }

  // Always add LLM if no specific features detected
  if (features.length === 0) {
    features.push({
      type: 'llm',
      description: 'LLM 对话/生成',
      required: true,
    });
  }

  return features;
}

/**
 * Determine if a feature is required vs optional
 */
function determineRequired(input: string, keywords: string[]): boolean {
  const optionalIndicators = ['可选', '可以', '或者', '如果需要', '可能'];

  // Check if any keyword appears near optional indicators
  for (const indicator of optionalIndicators) {
    const indicatorPos = input.indexOf(indicator);
    if (indicatorPos !== -1) {
      for (const kw of keywords) {
        const kwPos = input.indexOf(kw);
        if (kwPos !== -1 && Math.abs(kwPos - indicatorPos) < 10) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Estimate complexity based on input and features
 */
function estimateComplexity(input: string, features: WorkflowFeature[]): number {
  let complexity = 1;

  // Base complexity from features
  complexity += features.length * 0.5;

  // Adjust based on complexity indicators
  for (const indicator of COMPLEXITY_INDICATORS) {
    if (indicator.keywords.some((kw) => input.includes(kw))) {
      complexity += indicator.weight;
    }
  }

  // Clamp to 1-5 range
  return Math.max(1, Math.min(5, Math.round(complexity)));
}

/**
 * Extract action and domain from input
 */
function extractActionDomain(input: string): { action: string; domain?: string } {
  // Common action patterns
  const actionPatterns: Array<{ pattern: RegExp; action: string }> = [
    { pattern: /创建.*(问答|qa|对话)/i, action: '问答' },
    { pattern: /创建.*(翻译)/i, action: '翻译' },
    { pattern: /创建.*(摘要|总结|概括)/i, action: '摘要' },
    { pattern: /创建.*(分类|识别)/i, action: '分类' },
    { pattern: /创建.*(分析)/i, action: '分析' },
    { pattern: /创建.*(生成|写|创作)/i, action: '生成' },
    { pattern: /创建.*(检索|搜索)/i, action: '检索' },
    { pattern: /创建.*(处理)/i, action: '处理' },
  ];

  // Domain patterns
  const domainPatterns: Array<{ pattern: RegExp; domain: string }> = [
    { pattern: /知识库/, domain: '知识库' },
    { pattern: /客服/, domain: '客服' },
    { pattern: /文档/, domain: '文档' },
    { pattern: /代码/, domain: '代码' },
    { pattern: /数据/, domain: '数据' },
    { pattern: /api|接口/i, domain: 'API' },
  ];

  let action = '处理';
  let domain: string | undefined;

  for (const { pattern, action: a } of actionPatterns) {
    if (pattern.test(input)) {
      action = a;
      break;
    }
  }

  for (const { pattern, domain: d } of domainPatterns) {
    if (pattern.test(input)) {
      domain = d;
      break;
    }
  }

  return { action, domain };
}

/**
 * Extract specific requirements from input
 */
function extractRequirements(input: string): string[] {
  const requirements: string[] = [];

  // Look for requirement patterns
  const patterns = [
    /需要(.+?)(?:，|。|$)/g,
    /要求(.+?)(?:，|。|$)/g,
    /必须(.+?)(?:，|。|$)/g,
    /支持(.+?)(?:，|。|$)/g,
    /能够(.+?)(?:，|。|$)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(input)) !== null) {
      const req = match[1]?.trim();
      if (req && req.length > 2 && req.length < 50) {
        requirements.push(req);
      }
    }
  }

  // Deduplicate
  return [...new Set(requirements)];
}

/**
 * Normalize text for analysis
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
