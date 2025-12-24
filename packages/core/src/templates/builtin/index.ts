/**
 * Built-in Workflow Templates
 */

export { simpleQATemplate } from './simple-qa.js';
export { translationTemplate } from './translation.js';
export { ragQATemplate } from './rag-qa.js';
export { intentRouterTemplate } from './intent-router.js';
export { summarizerTemplate } from './summarizer.js';
export { apiCallerTemplate } from './api-caller.js';
export { codeProcessorTemplate } from './code-processor.js';
export { conditionalTemplate } from './conditional.js';

import { simpleQATemplate } from './simple-qa.js';
import { translationTemplate } from './translation.js';
import { ragQATemplate } from './rag-qa.js';
import { intentRouterTemplate } from './intent-router.js';
import { summarizerTemplate } from './summarizer.js';
import { apiCallerTemplate } from './api-caller.js';
import { codeProcessorTemplate } from './code-processor.js';
import { conditionalTemplate } from './conditional.js';
import type { WorkflowTemplate } from '../types.js';

/**
 * All built-in templates
 */
export const builtinTemplates: WorkflowTemplate[] = [
  simpleQATemplate,
  translationTemplate,
  ragQATemplate,
  intentRouterTemplate,
  summarizerTemplate,
  apiCallerTemplate,
  codeProcessorTemplate,
  conditionalTemplate,
];
