/**
 * Branching Workflow Planner - Plans workflows with classification and branching
 */

import type {
  WorkflowPlan,
  PlannedNode,
  PlannedEdge,
  WorkflowIntent,
} from './types.js';
import { extractBranches } from './branch-extractor.js';
import { generateWorkflowName, inferInputVariables } from './workflow-helpers.js';

/**
 * Plan a branching workflow with classification
 */
export function planBranchingWorkflow(
  userRequest: string,
  intent: WorkflowIntent,
  nodes: PlannedNode[],
  edges: PlannedEdge[]
): WorkflowPlan {
  // Extract branch info from user request
  const branches = extractBranches(userRequest);

  // Add classifier node
  nodes.push({
    id: 'classifier',
    type: 'question-classifier',
    title: '问题分类',
    description: '对用户问题进行智能分类',
    configHints: {
      classes: branches.map(b => ({ id: b.id, name: b.name })),
    },
  });
  edges.push({ source: 'start', target: 'classifier' });

  // Add branch nodes
  for (const branch of branches) {
    if (branch.needsRetrieval) {
      // Add retrieval node for this branch
      const retrievalId = `retrieval-${branch.id}`;
      nodes.push({
        id: retrievalId,
        type: 'knowledge-retrieval',
        title: `${branch.name}知识检索`,
        description: `从${branch.datasetName ?? '知识库'}检索`,
        configHints: {
          datasetId: branch.datasetId,
        },
      });
      edges.push({
        source: 'classifier',
        target: retrievalId,
        sourceHandle: branch.id,
        condition: branch.name,
      });

      // Add LLM node for this branch
      const llmId = `llm-${branch.id}`;
      nodes.push({
        id: llmId,
        type: 'llm',
        title: `${branch.name}回答`,
        description: `基于检索结果生成${branch.name}回答`,
      });
      edges.push({ source: retrievalId, target: llmId });

      // Connect to aggregator
      edges.push({ source: llmId, target: 'aggregator' });
    } else {
      // Direct LLM branch
      const llmId = `llm-${branch.id}`;
      nodes.push({
        id: llmId,
        type: 'llm',
        title: `${branch.name}回答`,
        description: `直接生成${branch.name}回答`,
      });
      edges.push({
        source: 'classifier',
        target: llmId,
        sourceHandle: branch.id,
        condition: branch.name,
      });
      edges.push({ source: llmId, target: 'aggregator' });
    }
  }

  // Add variable aggregator to merge branches
  nodes.push({
    id: 'aggregator',
    type: 'variable-aggregator',
    title: '结果聚合',
    description: '聚合各分支的输出结果',
  });

  // End node
  nodes.push({
    id: 'end',
    type: 'end',
    title: '结束',
    description: '输出最终结果',
  });
  edges.push({ source: 'aggregator', target: 'end' });

  return {
    name: generateWorkflowName(intent),
    description: userRequest,
    intent,
    nodes,
    edges,
    inputVariables: inferInputVariables(userRequest, intent),
    outputs: [{ name: 'final_answer', source: ['aggregator', 'output'], description: '最终回答' }],
    confidence: 0.75,
  };
}
