import React, { useCallback, useMemo, useRef, useState, DragEvent } from 'react';
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
import AnimatedEdge from './AnimatedEdge';

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
  onAddNode?: (nodeType: string, nodeTitle: string, position: { x: number; y: number }) => void;
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

// Memoize nodeTypes to prevent recreation on every render
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: any = {
  workflowNode: WorkflowNode,
};

// Edge types with animated edge
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const edgeTypes: any = {
  animatedEdge: AnimatedEdge,
};

const defaultEdgeOptions = {
  type: 'animatedEdge',
  animated: true,
  style: { stroke: '#3b82f6', strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#3b82f6',
  },
};

const WorkflowCanvas = React.memo(function WorkflowCanvas({ dsl, onNodeSelect, onAddNode }: WorkflowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

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
      // 只使用标准的 source/target handle，忽略自定义的 handle id
      sourceHandle: 'source',
      targetHandle: 'target',
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

  // 拖放处理
  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);

      const nodeData = event.dataTransfer.getData('application/autodify-node');
      if (!nodeData || !onAddNode || !reactFlowWrapper.current) return;

      try {
        const { type, title } = JSON.parse(nodeData);

        // 获取画布边界
        const bounds = reactFlowWrapper.current.getBoundingClientRect();

        // 计算放置位置（相对于画布）
        const position = {
          x: event.clientX - bounds.left - 100, // 偏移节点宽度的一半
          y: event.clientY - bounds.top - 30,   // 偏移节点高度的一半
        };

        onAddNode(type, title, position);
      } catch {
        console.error('Failed to parse dropped node data');
      }
    },
    [onAddNode]
  );

  if (!dsl) {
    return (
      <div
        ref={reactFlowWrapper}
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          flexDirection: 'column',
          gap: '16px',
        }}
        className={isDragOver ? 'drag-over' : ''}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div style={{ fontSize: '48px' }}>🎨</div>
        <div style={{ fontSize: '16px' }}>
          {isDragOver ? '释放以添加节点' : '输入描述后生成工作流'}
        </div>
        <div style={{ fontSize: '13px', color: '#475569' }}>
          {isDragOver ? '' : '或从左侧节点库拖拽节点到此处'}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={reactFlowWrapper}
      style={{ width: '100%', height: '100%' }}
      className={isDragOver ? 'drag-over' : ''}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={true}
      nodesConnectable={true}
      nodesFocusable={true}
      edgesFocusable={true}
      elementsSelectable={true}
      minZoom={0.2}
      maxZoom={4}
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
    </div>
  );
});

export default WorkflowCanvas;
