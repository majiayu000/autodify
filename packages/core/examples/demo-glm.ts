/**
 * Autodify Demo - GLM-4 版本
 *
 * 使用智谱 GLM-4 测试 Autodify 功能
 */

import {
  createOrchestrator,
  createWorkflow,
  DependencyAnalyzer,
  DSLValidator,
  stringifyYAML,
} from '../src/index.js';

// GLM-4 配置 (使用 Anthropic 兼容端点)
const GLM_CONFIG = {
  apiKey: process.env.GLM_API_KEY,
  baseUrl: 'https://open.bigmodel.cn/api/anthropic',
  model: 'glm-4.7',
};

console.log('🚀 Autodify 功能演示 (GLM-4)\n');

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
      systemPrompt: '你是一个专业的翻译专家。将用户提供的文本翻译成指定的目标语言，保持原意和语气。',
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
    provider: 'anthropic', // GLM 使用 Anthropic 兼容接口
    apiKey: GLM_CONFIG.apiKey,
    baseUrl: GLM_CONFIG.baseUrl,
    planningModel: GLM_CONFIG.model,
    generationModel: GLM_CONFIG.model,
    verbose: true,
  });

  console.log('\n正在生成工作流...');
  console.log('提示词: "创建一个简单的问答工作流，用户输入问题，AI 回答"');

  const result = await orchestrator.generate({
    prompt: '创建一个简单的问答工作流，用户输入问题，AI 回答',
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
    provider: 'anthropic', // GLM 使用 Anthropic 兼容接口
    apiKey: GLM_CONFIG.apiKey,
    baseUrl: GLM_CONFIG.baseUrl,
    planningModel: GLM_CONFIG.model,
    generationModel: GLM_CONFIG.model,
    verbose: true,
  });

  console.log('\n正在编辑工作流...');
  console.log('指令: "修改 LLM 节点的系统提示词，让它表现得更专业和友好"');

  const editResult = await orchestrator.edit({
    currentDsl: originalDsl,
    instruction: '修改 LLM 节点的系统提示词，让它表现得更专业和友好，回答时要有条理',
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
  try {
    // 演示 1: Builder API (不需要 API 调用)
    await demo1_builderApi();

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

main();
