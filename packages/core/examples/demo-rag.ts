/**
 * Autodify Demo - RAG 工作流测试
 *
 * 测试生成复杂的 RAG (检索增强生成) 工作流
 */

import {
  createOrchestrator,
  createWorkflow,
  DependencyAnalyzer,
  DSLValidator,
  stringifyYAML,
} from '../src/index.js';

// GLM-4 配置
const GLM_CONFIG = {
  apiKey: process.env.GLM_API_KEY,
  baseUrl: 'https://open.bigmodel.cn/api/anthropic',
  model: 'glm-4.7',
};

console.log('🚀 Autodify RAG 工作流演示\n');

// ============================================
// 方式 1: 使用 Builder API 手动创建 RAG 工作流
// ============================================
async function demo1_builderRAG() {
  console.log('='.repeat(60));
  console.log('方式 1: 使用 Builder API 手动创建 RAG 工作流');
  console.log('='.repeat(60));

  const dsl = createWorkflow({
    name: 'RAG 知识问答',
    description: '基于知识库的智能问答系统，支持多轮对话',
  })
    // 开始节点 - 定义输入
    .addStart({
      variables: [
        { name: 'query', label: '用户问题', type: 'paragraph', required: true },
        { name: 'history', label: '对话历史', type: 'paragraph', required: false },
      ],
    })
    // 知识检索节点
    .addKnowledgeRetrieval({
      id: 'retrieval',
      title: '知识检索',
      queryFrom: ['start', 'query'],
      datasetIds: ['dataset-001', 'dataset-002'], // 实际使用时替换为真实的知识库 ID
      retrievalMode: 'multiple',
      topK: 5,
      scoreThreshold: 0.5,
    })
    // LLM 节点 - 基于检索结果回答
    .addLLM({
      id: 'answer-llm',
      title: '智能回答',
      provider: 'openai',
      model: 'gpt-4o',
      systemPrompt: `你是一个专业的知识助手。请基于提供的参考资料回答用户问题。

规则：
1. 只使用参考资料中的信息回答，不要编造
2. 如果参考资料中没有相关信息，请诚实告知
3. 回答要准确、简洁、有条理
4. 适当引用来源`,
      userPrompt: `参考资料：
{{#retrieval.result#}}

对话历史：
{{#start.history#}}

用户问题：{{#start.query#}}

请基于以上参考资料回答用户问题：`,
    })
    // 结束节点
    .addEnd({
      id: 'end',
      outputs: [{ name: 'answer', source: ['answer-llm', 'text'] }],
    })
    // 连接节点
    .connect('start', 'retrieval')
    .connect('retrieval', 'answer-llm')
    .connect('answer-llm', 'end')
    .build();

  // 验证
  const validator = new DSLValidator();
  const validation = validator.validate(dsl);

  console.log('\n生成的 RAG 工作流 DSL:');
  console.log(stringifyYAML(dsl));

  console.log('\n验证结果:', validation.valid ? '✅ 有效' : '❌ 无效');

  // 分析依赖
  const analyzer = new DependencyAnalyzer();
  const analysis = analyzer.analyze(dsl);

  console.log('\n📊 工作流分析:');
  console.log('  执行顺序:', analysis.dependencies.topologicalOrder.join(' -> '));
  console.log('  节点数:', analysis.dependencies.topologicalOrder.length);
  console.log('  变量引用数:', analysis.variables.referencedVariables.length);

  if (analysis.issues.length > 0) {
    console.log('  问题:', analysis.issues.map((i) => i.message).join(', '));
  }

  return dsl;
}

// ============================================
// 方式 2: 使用自然语言生成 RAG 工作流
// ============================================
async function demo2_naturalLanguageRAG() {
  console.log('\n' + '='.repeat(60));
  console.log('方式 2: 使用自然语言生成 RAG 工作流');
  console.log('='.repeat(60));

  const orchestrator = createOrchestrator({
    provider: 'anthropic',
    apiKey: GLM_CONFIG.apiKey,
    baseUrl: GLM_CONFIG.baseUrl,
    planningModel: GLM_CONFIG.model,
    generationModel: GLM_CONFIG.model,
    verbose: true,
  });

  const prompt = `创建一个企业知识库问答系统工作流：
1. 用户输入问题
2. 从知识库检索相关文档（知识库ID: kb-enterprise-docs）
3. 使用 LLM 基于检索到的文档生成回答
4. 如果检索结果为空，返回"抱歉，未找到相关信息"的提示`;

  console.log('\n提示词:');
  console.log(prompt);
  console.log('\n正在生成...');

  const result = await orchestrator.generate({
    prompt,
    preferredProvider: 'openai',
    preferredModel: 'gpt-4o',
    datasetIds: ['kb-enterprise-docs'],
  });

  if (result.success) {
    console.log('\n✅ 生成成功！');
    console.log('耗时:', result.metadata?.duration, 'ms');

    if (result.yaml) {
      console.log('\n生成的 DSL:');
      console.log(result.yaml);
    }

    // 分析生成的工作流
    if (result.dsl) {
      const analyzer = new DependencyAnalyzer();
      const analysis = analyzer.analyze(result.dsl);
      console.log('\n📊 工作流分析:');
      console.log('  执行顺序:', analysis.dependencies.topologicalOrder.join(' -> '));
      console.log('  节点数:', analysis.dependencies.topologicalOrder.length);
    }
  } else {
    console.log('\n❌ 生成失败:', result.error);
  }

  return result;
}

// ============================================
// 方式 3: 生成带条件分支的复杂 RAG 工作流
// ============================================
async function demo3_complexRAG() {
  console.log('\n' + '='.repeat(60));
  console.log('方式 3: 使用自然语言生成带条件分支的复杂 RAG 工作流');
  console.log('='.repeat(60));

  const orchestrator = createOrchestrator({
    provider: 'anthropic',
    apiKey: GLM_CONFIG.apiKey,
    baseUrl: GLM_CONFIG.baseUrl,
    planningModel: GLM_CONFIG.model,
    generationModel: GLM_CONFIG.model,
    verbose: true,
  });

  const prompt = `创建一个智能客服工作流，包含以下功能：
1. 用户输入问题
2. 先用问题分类器判断问题类型（技术问题、账单问题、其他）
3. 根据不同类型：
   - 技术问题：从技术文档知识库检索后用 LLM 回答
   - 账单问题：从账单FAQ知识库检索后用 LLM 回答
   - 其他：直接用 LLM 回答
4. 最后统一输出回答`;

  console.log('\n提示词:');
  console.log(prompt);
  console.log('\n正在生成...');

  const result = await orchestrator.generate({
    prompt,
    preferredProvider: 'openai',
    preferredModel: 'gpt-4o',
  });

  if (result.success) {
    console.log('\n✅ 生成成功！');
    console.log('耗时:', result.metadata?.duration, 'ms');

    if (result.yaml) {
      console.log('\n生成的 DSL:');
      console.log(result.yaml);
    }

    if (result.dsl) {
      const analyzer = new DependencyAnalyzer();
      const analysis = analyzer.analyze(result.dsl);
      console.log('\n📊 工作流分析:');
      console.log('  执行顺序:', analysis.dependencies.topologicalOrder.join(' -> '));
      console.log('  节点数:', analysis.dependencies.topologicalOrder.length);

      if (analysis.issues.length > 0) {
        console.log('  ⚠️ 潜在问题:');
        analysis.issues.forEach((issue) => {
          console.log(`    - [${issue.type}] ${issue.message}`);
        });
      }
    }
  } else {
    console.log('\n❌ 生成失败:', result.error);
  }

  return result;
}

// ============================================
// 运行所有演示
// ============================================
async function main() {
  try {
    // 方式 1: Builder API (不需要 LLM)
    await demo1_builderRAG();

    // 方式 2: 自然语言生成简单 RAG
    await demo2_naturalLanguageRAG();

    // 方式 3: 自然语言生成复杂 RAG
    await demo3_complexRAG();

    console.log('\n' + '='.repeat(60));
    console.log('✨ 所有 RAG 工作流演示完成！');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n发生错误:', error);
    process.exit(1);
  }
}

void main();
