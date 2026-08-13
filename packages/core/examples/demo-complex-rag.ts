/**
 * Autodify Demo - 复杂 RAG 工作流测试
 *
 * 测试 LLM 生成带条件分支的复杂工作流（不使用模板）
 */

import { createOrchestrator, DependencyAnalyzer } from '../src/index.js';

// GLM-4 配置
const GLM_CONFIG = {
  apiKey: process.env.GLM_API_KEY,
  baseUrl: 'https://open.bigmodel.cn/api/anthropic',
  model: 'glm-4.7',
};

console.log('🚀 Autodify 复杂 RAG 工作流演示 (使用 LLM 生成)\n');

async function generateComplexWorkflow() {
  console.log('='.repeat(60));
  console.log('使用 GLM-4 生成带条件分支的智能客服工作流');
  console.log('='.repeat(60));

  const orchestrator = createOrchestrator({
    provider: 'anthropic',
    apiKey: GLM_CONFIG.apiKey,
    baseUrl: GLM_CONFIG.baseUrl,
    planningModel: GLM_CONFIG.model,
    generationModel: GLM_CONFIG.model,
    verbose: true,
  });

  // 使用更具体的描述，避免匹配到通用模板
  const prompt = `设计一个多分支的智能客服系统工作流 DSL：

输入变量：
- user_question: 用户的问题（必填，文本类型）
- user_id: 用户ID（选填，用于查询历史）

工作流逻辑：
1. 首先使用"问题分类器"(question-classifier)节点，将问题分为三类：
   - 类别1: "技术支持" - 涉及产品使用、故障排查
   - 类别2: "账单咨询" - 涉及付款、退款、发票
   - 类别3: "其他问题" - 一般性咨询

2. 根据分类结果，走不同分支：
   - 技术支持分支：先用知识检索(knowledge-retrieval)从技术文档库(dataset-id: tech-docs)检索，再用LLM回答
   - 账单咨询分支：先用知识检索从账单FAQ库(dataset-id: billing-faq)检索，再用LLM回答
   - 其他问题分支：直接用LLM通用回答

3. 三个分支最后汇聚到一个变量聚合器(variable-aggregator)节点，统一输出

4. 最后通过结束节点输出 final_answer

请生成完整的 Dify 工作流 YAML DSL。`;

  console.log('\n📝 提示词:');
  console.log(prompt);
  console.log('\n⏳ 正在调用 GLM-4 生成工作流...\n');

  const startTime = Date.now();
  const result = await orchestrator.generate({
    prompt,
    preferredProvider: 'openai',
    preferredModel: 'gpt-4o',
    skipTemplates: true, // 强制使用 LLM 生成，不使用模板
  });
  const duration = Date.now() - startTime;

  if (result.success) {
    console.log('\n✅ 生成成功！');
    console.log(`⏱️  总耗时: ${duration} ms`);

    if (result.metadata?.templateUsed) {
      console.log(`📋 使用模板: ${result.metadata.templateUsed}`);
    } else {
      console.log('🤖 使用 LLM 生成（无模板匹配）');
    }

    if (result.yaml) {
      console.log('\n' + '='.repeat(60));
      console.log('生成的工作流 DSL:');
      console.log('='.repeat(60));
      console.log(result.yaml);
    }

    // 分析生成的工作流
    if (result.dsl) {
      const analyzer = new DependencyAnalyzer();
      const analysis = analyzer.analyze(result.dsl);

      console.log('\n' + '='.repeat(60));
      console.log('📊 工作流分析结果:');
      console.log('='.repeat(60));
      console.log('  节点数:', analysis.dependencies.topologicalOrder.length);
      console.log('  执行顺序:', analysis.dependencies.topologicalOrder.join(' -> '));
      console.log('  变量引用数:', analysis.variables.referencedVariables.length);

      // 显示节点类型统计
      const nodes = result.dsl.workflow?.graph.nodes ?? [];
      const typeCount: Record<string, number> = {};
      nodes.forEach((n) => {
        const type = n.data.type;
        typeCount[type] = (typeCount[type] ?? 0) + 1;
      });
      console.log('\n  节点类型统计:');
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`    - ${type}: ${count}`);
      });

      if (analysis.issues.length > 0) {
        console.log('\n  ⚠️ 分析发现的问题:');
        analysis.issues.forEach((issue) => {
          const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`    ${icon} [${issue.code}] ${issue.message}`);
        });
      } else {
        console.log('\n  ✅ 工作流结构正确，无问题');
      }
    }
  } else {
    console.log('\n❌ 生成失败:', result.error);
  }

  return result;
}

async function main() {
  try {
    await generateComplexWorkflow();
    console.log('\n✨ 演示完成！');
  } catch (error) {
    console.error('\n发生错误:', error);
    process.exit(1);
  }
}

void main();
