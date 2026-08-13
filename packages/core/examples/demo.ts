/**
 * Autodify Demo Script
 *
 * 演示如何使用 Autodify 生成和编辑 Dify 工作流
 *
 * 使用方法:
 *   # 设置环境变量
 *   export OPENAI_API_KEY=your-api-key
 *   # 或者使用 Anthropic
 *   export ANTHROPIC_API_KEY=your-api-key
 *
 *   # 运行演示
 *   npx tsx examples/demo.ts
 */

import {
  createOrchestrator,
  createWorkflow,
  DependencyAnalyzer,
  DSLValidator,
  stringifyYAML,
} from '../src/index.js';

// 检查 API 密钥
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const args = process.argv.slice(2);
const skipApi = args.includes('--skip-api');

if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY && !skipApi) {
  console.error('请设置 OPENAI_API_KEY 或 ANTHROPIC_API_KEY 环境变量');
  console.error('');
  console.error('使用方法:');
  console.error('  export OPENAI_API_KEY=sk-...');
  console.error('  npx tsx examples/demo.ts');
  console.error('');
  console.error('或者使用 --skip-api 跳过需要 API 的演示:');
  console.error('  npx tsx examples/demo.ts --skip-api');
  process.exit(1);
}

const provider = OPENAI_API_KEY ? 'openai' : 'anthropic';
const apiKey = OPENAI_API_KEY ?? ANTHROPIC_API_KEY ?? '';

if (apiKey) {
  console.log(`使用 ${provider} 作为 LLM 提供商\n`);
}

// ============================================
// 演示 1: 使用 Builder API 手动创建工作流
// ============================================
async function demo1_builderApi() {
  console.log('='.repeat(50));
  console.log('演示 1: 使用 Builder API 手动创建工作流');
  console.log('='.repeat(50));

  const dsl = createWorkflow({ name: '翻译助手', description: '将文本翻译成目标语言' })
    .addStart({
      variables: [
        { name: 'text', label: '待翻译文本', type: 'paragraph', required: true },
        { name: 'target_lang', label: '目标语言', type: 'text-input', required: true },
      ],
    })
    .addLLM({
      id: 'translator',
      title: '翻译',
      provider: 'openai',
      model: 'gpt-4o',
      systemPrompt:
        '你是一个专业的翻译专家。将用户提供的文本翻译成指定的目标语言，保持原意和语气。',
      userPrompt: '请将以下文本翻译成{{#start.target_lang#}}：\n\n{{#start.text#}}',
    })
    .addEnd({
      id: 'end',
      outputs: [{ name: 'translation', source: ['translator', 'text'] }],
    })
    .connect('start', 'translator')
    .connect('translator', 'end')
    .build();

  // 验证 DSL
  const validator = new DSLValidator();
  const validation = validator.validate(dsl);

  console.log('\n生成的 DSL:');
  console.log(stringifyYAML(dsl));

  console.log('\n验证结果:', validation.valid ? '✅ 有效' : '❌ 无效');
  if (!validation.valid) {
    console.log('错误:', validation.errors);
  }

  // 分析依赖
  const analyzer = new DependencyAnalyzer();
  const analysis = analyzer.analyze(dsl);

  console.log('\n执行顺序:', analysis.dependencies.topologicalOrder.join(' -> '));
  console.log('变量引用数:', analysis.variables.referencedVariables.length);

  return dsl;
}

// ============================================
// 演示 2: 使用自然语言生成工作流
// ============================================
async function demo2_naturalLanguage() {
  console.log('\n' + '='.repeat(50));
  console.log('演示 2: 使用自然语言生成工作流');
  console.log('='.repeat(50));

  const orchestrator = createOrchestrator({
    provider,
    apiKey,
    verbose: true,
  });

  console.log('\n正在生成工作流...');
  console.log('提示词: "创建一个智能客服工作流，根据用户问题自动分类并给出回答"');

  const result = await orchestrator.generate({
    prompt: '创建一个智能客服工作流，根据用户问题自动分类并给出回答',
    preferredProvider: 'openai',
    preferredModel: 'gpt-4o',
  });

  if (result.success) {
    console.log('\n✅ 生成成功！');
    console.log('耗时:', result.metadata?.duration, 'ms');

    if (result.yaml) {
      console.log('\n生成的 DSL (前 50 行):');
      const lines = result.yaml.split('\n');
      console.log(lines.slice(0, 50).join('\n'));
      if (lines.length > 50) {
        console.log(`... (还有 ${lines.length - 50} 行)`);
      }
    }
  } else {
    console.log('\n❌ 生成失败:', result.error);
  }

  return result;
}

// ============================================
// 演示 3: 编辑现有工作流
// ============================================
async function demo3_editWorkflow() {
  console.log('\n' + '='.repeat(50));
  console.log('演示 3: 编辑现有工作流');
  console.log('='.repeat(50));

  // 先创建一个简单的工作流
  const originalDsl = createWorkflow({ name: '简单问答' })
    .addStart({
      variables: [{ name: 'question', label: '问题', type: 'paragraph', required: true }],
    })
    .addLLM({
      id: 'llm',
      title: '回答',
      provider: 'openai',
      model: 'gpt-4o',
      systemPrompt: '你是一个助手',
      userPrompt: '{{#start.question#}}',
    })
    .addEnd({
      id: 'end',
      outputs: [{ name: 'answer', source: ['llm', 'text'] }],
    })
    .connect('start', 'llm')
    .connect('llm', 'end')
    .build();

  console.log('\n原始工作流:');
  console.log(stringifyYAML(originalDsl));

  const orchestrator = createOrchestrator({
    provider,
    apiKey,
    verbose: true,
  });

  console.log('\n正在编辑工作流...');
  console.log('指令: "在 LLM 节点之前添加一个知识检索节点，用于查询相关文档"');

  const editResult = await orchestrator.edit({
    currentDsl: originalDsl,
    instruction: '在 LLM 节点之前添加一个知识检索节点，用于查询相关文档，知识库 ID 为 kb-12345',
  });

  if (editResult.success) {
    console.log('\n✅ 编辑成功！');
    console.log('变更:', editResult.changes);

    if (editResult.yaml) {
      console.log('\n编辑后的 DSL:');
      console.log(editResult.yaml);
    }
  } else {
    console.log('\n❌ 编辑失败:', editResult.error);
  }

  return editResult;
}

// ============================================
// 运行所有演示
// ============================================
async function main() {
  console.log('🚀 Autodify 功能演示\n');

  try {
    // 演示 1: Builder API (不需要 API 调用)
    await demo1_builderApi();

    if (skipApi || !apiKey) {
      console.log('\n跳过需要 API 的演示 (--skip-api 或未设置 API Key)');
      console.log('\n要运行完整演示，请设置环境变量:');
      console.log('  export OPENAI_API_KEY=sk-...');
      console.log('  npx tsx examples/demo.ts');
      return;
    }

    // 演示 2: 自然语言生成 (需要 API)
    await demo2_naturalLanguage();

    // 演示 3: 编辑工作流 (需要 API)
    await demo3_editWorkflow();

    console.log('\n✨ 所有演示完成！');
  } catch (error) {
    console.error('\n发生错误:', error);
    process.exit(1);
  }
}

void main();
