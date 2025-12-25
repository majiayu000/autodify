/**
 * Workflow Helper Functions - Common utilities for workflow planning
 */

import type {
  PlannedNode,
  InputVariable,
  OutputDefinition,
  WorkflowIntent,
} from './types.js';

/**
 * Generate workflow name from intent
 */
export function generateWorkflowName(intent: WorkflowIntent): string {
  const domain = intent.domain ?? '';
  const action = intent.action;
  return domain ? `${domain}${action}` : `智能${action}`;
}

/**
 * Infer input variables from request and intent
 */
export function inferInputVariables(
  userRequest: string,
  _intent: WorkflowIntent
): InputVariable[] {
  const variables: InputVariable[] = [];

  // Default text input
  variables.push({
    name: 'input',
    label: '用户输入',
    type: 'paragraph',
    required: true,
    description: '用户的输入内容',
  });

  // Add file input if document-related
  if (userRequest.includes('文档') || userRequest.includes('文件')) {
    variables.push({
      name: 'file',
      label: '上传文件',
      type: 'file',
      required: false,
      description: '可选的文件上传',
    });
  }

  return variables;
}

/**
 * Infer outputs from nodes
 */
export function inferOutputs(nodes: PlannedNode[]): OutputDefinition[] {
  // Find the last non-end node to get output from
  const outputNode = [...nodes].reverse().find((n) => n.type !== 'end' && n.type !== 'start');

  if (outputNode) {
    const outputVar = outputNode.type === 'llm' ? 'text' : 'output';
    return [
      {
        name: 'result',
        source: [outputNode.id, outputVar],
        description: '处理结果',
      },
    ];
  }

  return [];
}
