/**
 * Linear Workflow Planner - Plans simple linear workflows
 */

import type {
  WorkflowPlan,
  PlannedNode,
  PlannedEdge,
  WorkflowIntent,
} from './types.js';
import { generateWorkflowName, inferInputVariables, inferOutputs } from './workflow-helpers.js';

/**
 * Plan a simple linear workflow
 */
export function planLinearWorkflow(
  userRequest: string,
  intent: WorkflowIntent,
  nodes: PlannedNode[],
  edges: PlannedEdge[]
): WorkflowPlan {
  let prevNodeId = 'start';

  // Add nodes based on detected features
  for (const feature of intent.features) {
    let nodeId: string;
    let node: PlannedNode;

    switch (feature.type) {
      case 'rag':
        nodeId = 'retrieval';
        node = {
          id: nodeId,
          type: 'knowledge-retrieval',
          title: '知识检索',
          description: '从知识库检索相关内容',
        };
        nodes.push(node);
        edges.push({ source: prevNodeId, target: nodeId });
        prevNodeId = nodeId;
        break;

      case 'classification':
        nodeId = 'classifier';
        node = {
          id: nodeId,
          type: 'question-classifier',
          title: '问题分类',
          description: '对用户问题进行分类',
        };
        nodes.push(node);
        edges.push({ source: prevNodeId, target: nodeId });
        prevNodeId = nodeId;
        break;

      case 'code':
        nodeId = 'code';
        node = {
          id: nodeId,
          type: 'code',
          title: '代码处理',
          description: '执行代码进行数据处理',
        };
        nodes.push(node);
        edges.push({ source: prevNodeId, target: nodeId });
        prevNodeId = nodeId;
        break;

      case 'api':
        nodeId = 'http';
        node = {
          id: nodeId,
          type: 'http-request',
          title: 'API 请求',
          description: '调用外部 API',
        };
        nodes.push(node);
        edges.push({ source: prevNodeId, target: nodeId });
        prevNodeId = nodeId;
        break;

      case 'llm':
        nodeId = 'llm';
        node = {
          id: nodeId,
          type: 'llm',
          title: 'AI 处理',
          description: '使用 LLM 进行处理',
        };
        nodes.push(node);
        edges.push({ source: prevNodeId, target: nodeId });
        prevNodeId = nodeId;
        break;
    }
  }

  // Ensure at least one LLM node
  if (!nodes.some((n) => n.type === 'llm')) {
    const llmNode: PlannedNode = {
      id: 'llm',
      type: 'llm',
      title: 'AI 处理',
      description: '使用 LLM 进行处理',
    };
    nodes.push(llmNode);
    edges.push({ source: prevNodeId, target: 'llm' });
    prevNodeId = 'llm';
  }

  // End node
  nodes.push({
    id: 'end',
    type: 'end',
    title: '结束',
    description: '输出结果',
  });
  edges.push({ source: prevNodeId, target: 'end' });

  return {
    name: generateWorkflowName(intent),
    description: userRequest,
    intent,
    nodes,
    edges,
    inputVariables: inferInputVariables(userRequest, intent),
    outputs: inferOutputs(nodes),
    confidence: 0.7,
  };
}
