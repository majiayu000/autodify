/**
 * Create Command
 *
 * Generate a new Dify workflow from natural language.
 */

import { Command } from 'commander';
import { writeFileSync } from 'node:fs';
import pc from 'picocolors';
import ora from 'ora';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import {
  DSLGenerator,
  validateDSL,
  stringifyYAML,
  createSimpleDSL,
  type LLMClient,
} from '@autodify/core';

interface CreateOptions {
  output?: string;
  model?: string;
  provider?: string;
  dryRun?: boolean;
  simple?: boolean;
}

/**
 * 创建 LLM 客户端
 */
function createLLMClient(provider: string, model: string): LLMClient {
  return {
    async generate(prompt: string): Promise<string> {
      let llmModel;

      if (provider === 'anthropic') {
        llmModel = anthropic(model);
      } else {
        llmModel = openai(model);
      }

      const { text } = await generateText({
        model: llmModel,
        prompt,
        temperature: 0.7,
        maxTokens: 4096,
      });

      return text;
    },
  };
}

export const createCommand = new Command('create')
  .description('Generate a new Dify workflow from natural language')
  .argument('<prompt>', 'Natural language description of the workflow')
  .option('-o, --output <file>', 'Output file path (default: stdout)')
  .option('-m, --model <model>', 'LLM model to use', 'gpt-4o')
  .option('-p, --provider <provider>', 'LLM provider (openai/anthropic)', 'openai')
  .option('--dry-run', 'Only generate and validate, do not save')
  .option('--simple', 'Generate a simple 3-node workflow directly')
  .action(async (prompt: string, options: CreateOptions) => {
    const spinner = ora('Generating workflow...').start();

    try {
      let yaml: string;
      let dsl;

      if (options.simple) {
        // 简单模式：直接创建基础工作流
        spinner.text = 'Creating simple workflow...';
        dsl = createSimpleDSL(prompt, `基于"${prompt}"创建的工作流`);
        yaml = stringifyYAML(dsl);
      } else {
        // LLM 生成模式
        const provider = options.provider ?? 'openai';
        const model = options.model ?? 'gpt-4o';

        // 检查 API Key
        if (provider === 'openai' && !process.env['OPENAI_API_KEY']) {
          spinner.fail(pc.red('Missing OPENAI_API_KEY environment variable'));
          process.exit(1);
        }

        if (provider === 'anthropic' && !process.env['ANTHROPIC_API_KEY']) {
          spinner.fail(pc.red('Missing ANTHROPIC_API_KEY environment variable'));
          process.exit(1);
        }

        spinner.text = `Generating with ${provider}/${model}...`;

        const llmClient = createLLMClient(provider, model);
        const generator = new DSLGenerator(llmClient, {
          modelProvider: provider,
          modelName: model,
          maxRetries: 3,
        });

        const result = await generator.generate(prompt);

        if (!result.success) {
          spinner.fail(pc.red(`Generation failed: ${result.error}`));
          process.exit(1);
        }

        yaml = result.yaml!;
        dsl = result.dsl;
      }

      // 验证
      spinner.text = 'Validating...';
      const validation = validateDSL(dsl!);

      if (!validation.valid) {
        spinner.fail(pc.red('Validation failed'));
        for (const error of validation.errors) {
          console.error(pc.red(`  - [${error.path}] ${error.message}`));
        }
        process.exit(1);
      }

      if (validation.warnings.length > 0) {
        for (const warning of validation.warnings) {
          console.warn(pc.yellow(`  ⚠ [${warning.path}] ${warning.message}`));
        }
      }

      spinner.succeed(pc.green('Workflow generated successfully!'));

      // 输出
      if (options.dryRun) {
        console.log(pc.dim('\n--- Generated YAML (dry run) ---'));
        console.log(yaml);
      } else if (options.output) {
        writeFileSync(options.output, yaml, 'utf-8');
        console.log(pc.green(`\n✓ Saved to ${options.output}`));
      } else {
        console.log('\n' + yaml);
      }

      // 显示统计
      const nodeCount = dsl!.workflow?.graph.nodes.length ?? 0;
      const edgeCount = dsl!.workflow?.graph.edges.length ?? 0;
      console.log(pc.dim(`\n📊 Nodes: ${nodeCount}, Edges: ${edgeCount}`));
    } catch (error) {
      spinner.fail(pc.red('Generation failed'));
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });
