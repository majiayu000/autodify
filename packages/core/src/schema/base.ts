/**
 * Base Zod schemas for Dify DSL validation
 */

import { z } from 'zod';

// ============================================================================
// Base Enums
// ============================================================================

export const DSLVersionSchema = z.enum(['0.5.0', '0.1.0', '0.1.1', '0.1.2', '0.1.3', '0.1.4', '0.1.5']);

export const AppModeSchema = z.enum(['workflow', 'advanced-chat', 'chat', 'agent-chat', 'completion']);

export const IconTypeSchema = z.enum(['emoji', 'image', 'link']);

export const VariableTypeSchema = z.enum([
  'text-input',
  'paragraph',
  'select',
  'number',
  'file',
  'file-list',
]);

export const OutputTypeSchema = z.enum([
  'string',
  'number',
  'boolean',
  'object',
  'array[string]',
  'array[number]',
  'array[object]',
]);

export const CodeLanguageSchema = z.enum(['python3', 'javascript']);

export const HttpMethodSchema = z.enum(['get', 'post', 'put', 'patch', 'delete', 'head']);

export const BodyTypeSchema = z.enum(['none', 'form-data', 'x-www-form-urlencoded', 'raw-text', 'json']);

export const ComparisonOperatorSchema = z.enum([
  '=',
  '≠',
  'contains',
  'not contains',
  'start with',
  'end with',
  'is empty',
  'is not empty',
  '>',
  '<',
  '≥',
  '≤',
  'in',
  'not in',
]);

export const LogicalOperatorSchema = z.enum(['and', 'or']);

export const RetrievalModeSchema = z.enum(['single', 'multiple']);

export const ErrorHandleModeSchema = z.enum(['terminated', 'continue-on-error', 'remove-abnormal-output']);

export const AuthorizationTypeSchema = z.enum(['no-auth', 'api-key', 'basic']);

export const ApiKeyTypeSchema = z.enum(['bearer', 'basic', 'custom']);

export const ProviderTypeSchema = z.enum(['builtin', 'api', 'workflow']);

export const ReasoningModeSchema = z.enum(['prompt', 'function_call']);

export const ExtractorParamTypeSchema = z.enum([
  'string',
  'number',
  'bool',
  'select',
  'array[string]',
  'array[number]',
  'array[object]',
]);

export const TransferMethodSchema = z.enum(['remote_url', 'local_file']);

export const AllowedFileTypeSchema = z.enum(['image', 'document', 'audio', 'video', 'custom']);

export const VariableValueTypeSchema = z.enum(['string', 'number', 'object', 'secret', 'array[string]']);

export const EditionTypeSchema = z.enum(['basic', 'jinja2']);

export const LLMModeSchema = z.enum(['chat', 'completion']);

export const VisionDetailSchema = z.enum(['low', 'high']);

export const NodeTypeSchema = z.enum([
  'start',
  'end',
  'answer',
  'llm',
  'knowledge-retrieval',
  'question-classifier',
  'if-else',
  'code',
  'template-transform',
  'variable-aggregator',
  'variable-assigner',
  'iteration',
  'loop',
  'parameter-extractor',
  'http-request',
  'tool',
  'agent',
  'document-extractor',
  'list-operator',
]);

// ============================================================================
// Common Schemas
// ============================================================================

/** 变量选择器 */
export const VariableSelectorSchema = z.tuple([z.string(), z.string()]);

/** 节点位置 */
export const NodePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

/** 键值对 */
export const KeyValueSchema = z.object({
  key: z.string(),
  value: z.string(),
});
