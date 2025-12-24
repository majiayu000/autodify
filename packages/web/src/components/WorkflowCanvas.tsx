import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import WorkflowNode from './WorkflowNode';

interface WorkflowCanvasProps {
  dsl: {
    workflow?: {
      graph: {
        nodes: Array<{
          id: string;
          data: {
            type: string;
            title: string;
          };
        }>;
        edges: Array<{
          id: string;
          source: string;
          target: string;
          sourceHandle?: string;
        }>;
      };
    };
  } | null;
  onNodeSelect?: (nodeId: string | null) => void;
}

// Layout nodes using dagre
function layoutNodes(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): Node[] {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 60 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 100,
        y: nodeWithPosition.y - 30,
      },
    };
  });
}

const nodeTypes = {
  workflowNode: WorkflowNode,
};

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#475569', strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#475569',
  },
};

export default function WorkflowCanvas({ dsl, onNodeSelect }: WorkflowCanvasProps) {
  // Convert DSL to React Flow nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!dsl?.workflow?.graph) {
      return { initialNodes: [], initialEdges: [] };
    }

    const nodes: Node[] = dsl.workflow.graph.nodes.map((node) => ({
      id: node.id,
      type: 'workflowNode',
      data: {
        type: node.data.type,
        title: node.data.title,
      },
      position: { x: 0, y: 0 },
    }));

    const edges: Edge[] = dsl.workflow.graph.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      ...defaultEdgeOptions,
    }));

    // Apply auto layout
    const layoutedNodes = layoutNodes(nodes, edges);

    return { initialNodes: layoutedNodes, initialEdges: edges };
  }, [dsl]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when DSL changes
  React.useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect?.(node.id);
    },
    [onNodeSelect]
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  if (!dsl) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '48px' }}>🎨</div>
        <div style={{ fontSize: '16px' }}>输入描述后生成工作流</div>
        <div style={{ fontSize: '13px', color: '#475569' }}>
          工作流图将在这里显示
        </div>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      nodeTypes={nodeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      proOptions={{ hideAttribution: true }}
    >
      <Controls
        style={{
          background: '#1e293b',
          border: '1px solid #475569',
          borderRadius: '8px',
        }}
      />
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color="#334155"
      />
    </ReactFlow>
  );
}
