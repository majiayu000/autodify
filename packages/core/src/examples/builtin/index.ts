/**
 * Built-in Few-shot Examples
 */

export { simpleQAExample } from './simple-qa.js';
export { ragQAExample } from './rag-qa.js';
export { conditionalExample } from './conditional.js';
export { intentRouterExample } from './intent-router.js';
export { apiCallerExample } from './api-caller.js';
export { codeProcessorExample } from './code-processor.js';

import { simpleQAExample } from './simple-qa.js';
import { ragQAExample } from './rag-qa.js';
import { conditionalExample } from './conditional.js';
import { intentRouterExample } from './intent-router.js';
import { apiCallerExample } from './api-caller.js';
import { codeProcessorExample } from './code-processor.js';
import type { FewShotExample } from '../types.js';

/**
 * All built-in examples
 */
export const builtinExamples: FewShotExample[] = [
  simpleQAExample,
  ragQAExample,
  conditionalExample,
  intentRouterExample,
  apiCallerExample,
  codeProcessorExample,
];
