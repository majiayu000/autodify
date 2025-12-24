/**
 * Validate Command
 *
 * Validate a Dify workflow DSL file.
 */

import { Command } from 'commander';
import { readFileSync, existsSync } from 'node:fs';
import pc from 'picocolors';
import { parseYAML, validateDSL } from '@autodify/core';

interface ValidateOptions {
  strict?: boolean;
  json?: boolean;
}

export const validateCommand = new Command('validate')
  .description('Validate a Dify workflow DSL file')
  .argument('<file>', 'Path to the YAML/YML file')
  .option('--strict', 'Enable strict validation mode')
  .option('--json', 'Output result as JSON')
  .action((file: string, options: ValidateOptions) => {
    // 检查文件是否存在
    if (!existsSync(file)) {
      console.error(pc.red(`File not found: ${file}`));
      process.exit(1);
    }

    // 读取文件
    let content: string;
    try {
      content = readFileSync(file, 'utf-8');
    } catch (error) {
      console.error(pc.red(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }

    // 解析 YAML
    const parseResult = parseYAML(content);
    if (!parseResult.success) {
      if (options.json) {
        console.log(JSON.stringify({
          valid: false,
          stage: 'parse',
          error: parseResult.error,
        }, null, 2));
      } else {
        console.error(pc.red(`✗ YAML Parse Error: ${parseResult.error}`));
      }
      process.exit(1);
    }

    // 验证 DSL
    const validationResult = validateDSL(parseResult.data!, {
      strict: options.strict,
    });

    if (options.json) {
      console.log(JSON.stringify({
        valid: validationResult.valid,
        stage: 'validate',
        errors: validationResult.errors,
        warnings: validationResult.warnings,
      }, null, 2));
    } else {
      if (validationResult.valid) {
        console.log(pc.green(`✓ ${file} is valid`));

        // 显示警告
        if (validationResult.warnings.length > 0) {
          console.log(pc.yellow(`\n⚠ ${validationResult.warnings.length} warning(s):`));
          for (const warning of validationResult.warnings) {
            console.log(pc.yellow(`  - [${warning.path}] ${warning.message}`));
          }
        }

        // 显示统计
        const dsl = parseResult.data!;
        const nodeCount = dsl.workflow?.graph.nodes.length ?? 0;
        const edgeCount = dsl.workflow?.graph.edges.length ?? 0;
        const nodeTypes = new Set(
          dsl.workflow?.graph.nodes.map((n) => n.data.type) ?? []
        );

        console.log(pc.dim(`\n📊 Statistics:`));
        console.log(pc.dim(`   Nodes: ${nodeCount}`));
        console.log(pc.dim(`   Edges: ${edgeCount}`));
        console.log(pc.dim(`   Node types: ${Array.from(nodeTypes).join(', ')}`));
      } else {
        console.log(pc.red(`✗ ${file} has ${validationResult.errors.length} error(s)`));

        console.log(pc.red('\nErrors:'));
        for (const error of validationResult.errors) {
          console.log(pc.red(`  - [${error.path}] ${error.message}`));
        }

        if (validationResult.warnings.length > 0) {
          console.log(pc.yellow(`\nWarnings:`));
          for (const warning of validationResult.warnings) {
            console.log(pc.yellow(`  - [${warning.path}] ${warning.message}`));
          }
        }

        process.exit(1);
      }
    }
  });
