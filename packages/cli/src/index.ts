/**
 * Autodify CLI
 *
 * Generate and validate Dify workflows with natural language.
 */

import { Command } from 'commander';
import { createCommand } from './commands/create.js';
import { validateCommand } from './commands/validate.js';
import { infoCommand } from './commands/info.js';

const program = new Command();

program
  .name('autodify')
  .description('Generate and edit Dify workflows using natural language')
  .version('0.1.0');

// Add commands
program.addCommand(createCommand);
program.addCommand(validateCommand);
program.addCommand(infoCommand);

// Parse arguments
program.parse();
