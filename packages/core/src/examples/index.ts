/**
 * Few-shot Examples System
 *
 * Provides example management for LLM context building
 */

// Types
export type {
  ExampleCategory,
  ExampleMetadata,
  FewShotExample,
  ExampleMatch,
  SerializedExample,
} from './types.js';

// Built-in examples
export {
  builtinExamples,
  simpleQAExample,
  ragQAExample,
  conditionalExample,
  intentRouterExample,
  apiCallerExample,
  codeProcessorExample,
} from './builtin/index.js';

// Example store
export {
  ExampleStore,
  createExampleStore,
  type ExampleStoreConfig,
} from './example-store.js';
