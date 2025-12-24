/**
 * Info Command
 *
 * Display information about available node types and models.
 */

import { Command } from 'commander';
import pc from 'picocolors';
import {
  nodeMetaRegistry,
  modelProviders,
  type NodeMeta,
} from '@autodify/core';

interface InfoOptions {
  nodes?: boolean;
  models?: boolean;
  node?: string;
}

export const infoCommand = new Command('info')
  .description('Display information about available node types and models')
  .option('--nodes', 'List all available node types')
  .option('--models', 'List all available models')
  .option('--node <type>', 'Show details for a specific node type')
  .action((options: InfoOptions) => {
    if (options.node) {
      showNodeDetails(options.node);
    } else if (options.nodes) {
      listNodes();
    } else if (options.models) {
      listModels();
    } else {
      // 默认显示概要
      showSummary();
    }
  });

function showSummary() {
  console.log(pc.bold('\n🤖 Autodify - Dify Workflow Generator\n'));

  console.log(pc.cyan('Available Commands:'));
  console.log('  autodify create <prompt>    Generate a workflow from natural language');
  console.log('  autodify validate <file>    Validate a DSL file');
  console.log('  autodify info               Show this information');
  console.log('');

  console.log(pc.cyan('Quick Start:'));
  console.log(pc.dim('  # Generate a simple workflow'));
  console.log('  autodify create "创建一个翻译工作流" -o workflow.yml');
  console.log('');
  console.log(pc.dim('  # Validate a workflow'));
  console.log('  autodify validate workflow.yml');
  console.log('');

  console.log(pc.cyan('More Info:'));
  console.log('  autodify info --nodes       List available node types');
  console.log('  autodify info --models      List available LLM models');
  console.log('  autodify info --node llm    Show details for LLM node');
}

function listNodes() {
  console.log(pc.bold('\n📦 Available Node Types\n'));

  const categories = ['basic', 'llm', 'logic', 'data', 'tool', 'advanced'];
  const categoryNames: Record<string, string> = {
    basic: '基础节点',
    llm: 'LLM 节点',
    logic: '逻辑节点',
    data: '数据节点',
    tool: '工具节点',
    advanced: '高级节点',
  };

  for (const category of categories) {
    const nodes = Object.values(nodeMetaRegistry).filter(
      (n) => n.category === category
    );

    if (nodes.length > 0) {
      console.log(pc.cyan(`${categoryNames[category] ?? category}:`));
      for (const node of nodes) {
        console.log(`  ${pc.green(node.type.padEnd(25))} ${node.description}`);
      }
      console.log('');
    }
  }

  console.log(pc.dim('Use "autodify info --node <type>" for details.'));
}

function listModels() {
  console.log(pc.bold('\n🧠 Available LLM Models\n'));

  for (const provider of modelProviders) {
    console.log(pc.cyan(`${provider.name} (${provider.id}):`));

    for (const model of provider.models) {
      const features = [];
      if (model.supportsVision) features.push('👁 vision');
      if (model.supportsTools) features.push('🔧 tools');

      console.log(
        `  ${pc.green(model.id.padEnd(35))} ${model.name.padEnd(20)} ${pc.dim(features.join(' '))}`
      );
    }
    console.log('');
  }
}

function showNodeDetails(type: string) {
  const node = nodeMetaRegistry[type];

  if (!node) {
    console.error(pc.red(`Node type "${type}" not found.`));
    console.log(pc.dim('\nAvailable types:'));
    console.log(pc.dim('  ' + Object.keys(nodeMetaRegistry).join(', ')));
    process.exit(1);
  }

  console.log(pc.bold(`\n📋 ${node.displayName} (${node.type})\n`));
  console.log(pc.cyan('Description:'));
  console.log(`  ${node.description}\n`);

  console.log(pc.cyan('Category:'));
  console.log(`  ${node.category}\n`);

  if (node.inputs.length > 0) {
    console.log(pc.cyan('Inputs:'));
    for (const input of node.inputs) {
      console.log(`  - ${pc.green(input.name)} (${input.type}): ${input.description}`);
    }
    console.log('');
  }

  if (node.outputs.length > 0) {
    console.log(pc.cyan('Outputs:'));
    for (const output of node.outputs) {
      console.log(`  - ${pc.green(output.name)} (${output.type}): ${output.description}`);
    }
    console.log('');
  }

  if (node.configFields.length > 0) {
    console.log(pc.cyan('Configuration:'));
    for (const field of node.configFields) {
      const required = field.required ? pc.red('*') : '';
      console.log(`  - ${pc.green(field.name)}${required} (${field.type}): ${field.description}`);
    }
    console.log('');
  }

  if (node.notes && node.notes.length > 0) {
    console.log(pc.cyan('Notes:'));
    for (const note of node.notes) {
      console.log(`  • ${note}`);
    }
    console.log('');
  }

  if (node.examples.length > 0) {
    console.log(pc.cyan('Example:'));
    console.log(pc.dim(JSON.stringify(node.examples[0]?.config, null, 2)));
  }
}
