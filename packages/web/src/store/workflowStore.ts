import { create } from 'zustand';
import type { NodeData } from '../components/NodeEditor';

// DSL 类型定义
export interface DslType {
  version?: string;
  kind?: string;
  app?: {
    name?: string;
    description?: string;
    icon?: string;
    mode?: string;
  };
  workflow?: {
    graph: {
      nodes: Array<{
        id: string;
        type?: string;
        data: NodeData;
      }>;
      edges: Array<{
        id: string;
        source: string;
        target: string;
        sourceHandle?: string;
        targetHandle?: string;
      }>;
    };
  };
}

// Store 状态接口
interface WorkflowState {
  // 状态
  dsl: DslType | null;
  selectedNodeId: string | null;
  isGenerating: boolean;
  yamlOutput: string;
  duration: number;

  // Actions
  setDsl: (dsl: DslType | null) => void;
  setYamlOutput: (yaml: string) => void;
  setDuration: (duration: number) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  selectNode: (nodeId: string | null) => void;
  updateNode: (nodeId: string, data: Partial<NodeData>) => void;
  addNode: (nodeType: string, nodeTitle: string) => string;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: { source: string; target: string; sourceHandle?: string; targetHandle?: string }) => void;
  removeEdge: (edgeId: string) => void;
  reset: () => void;
}

// 创建空的初始 DSL
const createEmptyDsl = (): DslType => ({
  version: '0.5.0',
  kind: 'app',
  app: {
    name: '新工作流',
    description: '通过拖拽创建的工作流',
    icon: '🎨',
    mode: 'workflow',
  },
  workflow: {
    graph: {
      nodes: [],
      edges: [],
    },
  },
});

// 生成唯一 ID
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  // 初始状态
  dsl: null,
  selectedNodeId: null,
  isGenerating: false,
  yamlOutput: '',
  duration: 0,

  // 设置 DSL
  setDsl: (dsl) => set({ dsl }),

  // 设置 YAML 输出
  setYamlOutput: (yamlOutput) => set({ yamlOutput }),

  // 设置生成时间
  setDuration: (duration) => set({ duration }),

  // 设置生成状态
  setIsGenerating: (isGenerating) => set({ isGenerating }),

  // 选择节点
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  // 更新节点
  updateNode: (nodeId, newData) => {
    const { dsl } = get();
    if (!dsl?.workflow?.graph?.nodes) return;

    set({
      dsl: {
        ...dsl,
        workflow: {
          ...dsl.workflow,
          graph: {
            ...dsl.workflow.graph,
            nodes: dsl.workflow.graph.nodes.map((node) =>
              node.id === nodeId
                ? { ...node, data: { ...node.data, ...newData } }
                : node
            ),
          },
        },
      },
    });
  },

  // 添加节点
  addNode: (nodeType, nodeTitle) => {
    const { dsl } = get();
    const newNodeId = generateId(nodeType);

    const newNode = {
      id: newNodeId,
      type: 'custom',
      data: {
        type: nodeType,
        title: nodeTitle,
      } as NodeData,
    };

    if (!dsl) {
      // 创建新的 DSL
      const newDsl = createEmptyDsl();
      newDsl.workflow!.graph.nodes.push(newNode);
      set({ dsl: newDsl, selectedNodeId: newNodeId });
    } else {
      // 添加到现有 DSL
      set({
        dsl: {
          ...dsl,
          workflow: {
            ...dsl.workflow!,
            graph: {
              ...dsl.workflow!.graph,
              nodes: [...dsl.workflow!.graph.nodes, newNode],
            },
          },
        },
        selectedNodeId: newNodeId,
      });
    }

    return newNodeId;
  },

  // 删除节点
  removeNode: (nodeId) => {
    const { dsl, selectedNodeId } = get();
    if (!dsl?.workflow?.graph) return;

    set({
      dsl: {
        ...dsl,
        workflow: {
          ...dsl.workflow,
          graph: {
            nodes: dsl.workflow.graph.nodes.filter((n) => n.id !== nodeId),
            edges: dsl.workflow.graph.edges.filter(
              (e) => e.source !== nodeId && e.target !== nodeId
            ),
          },
        },
      },
      selectedNodeId: selectedNodeId === nodeId ? null : selectedNodeId,
    });
  },

  // 添加边
  addEdge: (edge) => {
    const { dsl } = get();
    if (!dsl?.workflow?.graph) return;

    const newEdge = {
      id: generateId('edge'),
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || 'source',
      targetHandle: edge.targetHandle || 'target',
    };

    set({
      dsl: {
        ...dsl,
        workflow: {
          ...dsl.workflow,
          graph: {
            ...dsl.workflow.graph,
            edges: [...dsl.workflow.graph.edges, newEdge],
          },
        },
      },
    });
  },

  // 删除边
  removeEdge: (edgeId) => {
    const { dsl } = get();
    if (!dsl?.workflow?.graph) return;

    set({
      dsl: {
        ...dsl,
        workflow: {
          ...dsl.workflow,
          graph: {
            ...dsl.workflow.graph,
            edges: dsl.workflow.graph.edges.filter((e) => e.id !== edgeId),
          },
        },
      },
    });
  },

  // 重置状态
  reset: () =>
    set({
      dsl: null,
      selectedNodeId: null,
      isGenerating: false,
      yamlOutput: '',
      duration: 0,
    }),
}));

// 导出类型
export type { NodeData };
