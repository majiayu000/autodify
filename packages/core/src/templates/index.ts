/**
 * Template System
 *
 * Provides workflow templates and matching functionality
 */

// Types
export type {
  TemplateCategory,
  TemplateMetadata,
  WorkflowTemplate,
  TemplateMatch,
} from './types.js';

// Built-in templates
export {
  builtinTemplates,
  simpleQATemplate,
  translationTemplate,
  ragQATemplate,
  intentRouterTemplate,
  summarizerTemplate,
  apiCallerTemplate,
  codeProcessorTemplate,
  conditionalTemplate,
} from './builtin/index.js';

// Template store
export {
  TemplateStore,
  defaultTemplateStore,
  createTemplateStore,
  type TemplateStoreConfig,
} from './template-store.js';
