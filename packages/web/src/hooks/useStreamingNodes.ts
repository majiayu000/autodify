/**
 * useStreamingNodes Hook
 *
 * 处理流式节点事件，支持动画效果
 */

import { useState, useCallback, useRef } from 'react'
import type { Node, Edge } from '@xyflow/react'

/**
 * 流式事件类型
 */
export type StreamEventType =
  | 'thinking'
  | 'node_created'
  | 'edges_created'
  | 'complete'
  | 'error'
  | 'done'

/**
 * 思考步骤
 */
export interface ThinkingStep {
  step: string
  message: string
  timestamp: number
}

/**
 * 流式节点信息
 */
export interface StreamNodeInfo {
  id: string
  type: string
  title: string
  position?: { x: number; y: number }
  data?: Record<string, unknown>
}

/**
 * 流式边信息
 */
export interface StreamEdgeInfo {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

/**
 * 流式生成阶段
 */
export type StreamPhase = 'idle' | 'thinking' | 'generating' | 'connecting' | 'complete' | 'error'

/**
 * 流式状态
 */
export interface StreamState {
  /** 当前阶段 */
  phase: StreamPhase
  /** 思考步骤列表 */
  thinkingSteps: ThinkingStep[]
  /** 已接收的节点 */
  nodes: Node[]
  /** 已接收的边 */
  edges: Edge[]
  /** 节点生成进度 */
  nodeProgress: { current: number; total: number }
  /** 最终 DSL */
  dsl: unknown | null
  /** YAML 字符串 */
  yaml: string | null
  /** 错误信息 */
  error: string | null
  /** 是否正在生成 */
  isGenerating: boolean
}

/**
 * 流式事件数据
 */
export interface StreamEvent {
  type: StreamEventType
  thinking?: { step: string; message: string }
  node?: StreamNodeInfo
  nodeProgress?: { current: number; total: number }
  edges?: StreamEdgeInfo[]
  dsl?: unknown
  yaml?: string
  error?: string
  done?: boolean
}

/**
 * 初始状态
 */
const initialState: StreamState = {
  phase: 'idle',
  thinkingSteps: [],
  nodes: [],
  edges: [],
  nodeProgress: { current: 0, total: 0 },
  dsl: null,
  yaml: null,
  error: null,
  isGenerating: false,
}

/**
 * 将 StreamNodeInfo 转换为 ReactFlow Node
 */
function streamNodeToReactFlowNode(streamNode: StreamNodeInfo, index: number): Node {
  return {
    id: streamNode.id,
    type: 'workflowNode',
    position: streamNode.position || { x: 100, y: 100 + index * 150 },
    data: {
      ...streamNode.data,
      type: streamNode.type,
      title: streamNode.title,
      // 动画相关属性
      _animationIndex: index,
      _isNew: true,
    },
  }
}

/**
 * 将 StreamEdgeInfo 转换为 ReactFlow Edge
 */
function streamEdgeToReactFlowEdge(streamEdge: StreamEdgeInfo): Edge {
  return {
    id: streamEdge.id,
    source: streamEdge.source,
    target: streamEdge.target,
    sourceHandle: streamEdge.sourceHandle || 'source',
    targetHandle: streamEdge.targetHandle || 'target',
    type: 'animatedEdge',
    animated: true,
  }
}

/**
 * useStreamingNodes Hook
 */
export function useStreamingNodes() {
  const [state, setState] = useState<StreamState>(initialState)
  const nodeCountRef = useRef(0)

  /**
   * 处理流式事件
   */
  const handleStreamEvent = useCallback((event: StreamEvent) => {
    switch (event.type) {
      case 'thinking':
        if (event.thinking) {
          setState((s) => ({
            ...s,
            phase: 'thinking',
            isGenerating: true,
            thinkingSteps: [
              ...s.thinkingSteps,
              {
                step: event.thinking!.step,
                message: event.thinking!.message,
                timestamp: Date.now(),
              },
            ],
          }))
        }
        break

      case 'node_created':
        if (event.node) {
          const newNode = streamNodeToReactFlowNode(event.node, nodeCountRef.current)
          nodeCountRef.current++

          setState((s) => ({
            ...s,
            phase: 'generating',
            nodes: [...s.nodes, newNode],
            nodeProgress: event.nodeProgress || s.nodeProgress,
          }))
        }
        break

      case 'edges_created':
        if (event.edges) {
          const newEdges = event.edges.map(streamEdgeToReactFlowEdge)
          setState((s) => ({
            ...s,
            phase: 'connecting',
            edges: newEdges,
          }))
        }
        break

      case 'complete':
        setState((s) => ({
          ...s,
          phase: 'complete',
          dsl: event.dsl || null,
          yaml: event.yaml || null,
        }))
        break

      case 'error':
        setState((s) => ({
          ...s,
          phase: 'error',
          error: event.error || 'Unknown error',
          isGenerating: false,
        }))
        break

      case 'done':
        setState((s) => ({
          ...s,
          isGenerating: false,
        }))
        break
    }
  }, [])

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    nodeCountRef.current = 0
    setState(initialState)
  }, [])

  /**
   * 开始生成
   */
  const startGeneration = useCallback(() => {
    nodeCountRef.current = 0
    setState({
      ...initialState,
      isGenerating: true,
    })
  }, [])

  return {
    state,
    handleStreamEvent,
    reset,
    startGeneration,
  }
}

export default useStreamingNodes
