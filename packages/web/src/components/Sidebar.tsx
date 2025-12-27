import React, { memo, lazy, Suspense } from 'react';
import PromptInput from './PromptInput';
import ExamplePrompts from './ExamplePrompts';
import NodePalette from './NodePalette';
import WorkflowInfo from './WorkflowInfo';
import { type DslType } from '../store/workflowStore';
import { NodeData } from '../types/nodeData';

// 懒加载不常用的组件
const NodeEditor = lazy(() => import('./NodeEditor'));
const YamlPreview = lazy(() => import('./YamlPreview'));

interface SidebarProps {
  // Prompt 输入相关
  prompt: string;
  isGenerating: boolean;
  apiConnected: boolean | null;
  error: string | null;
  progress?: {
    stage: string;
    percentage: number;
    message: string;
  } | null;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onCancelGeneration?: () => void;
  onPromptKeyDown: (e: React.KeyboardEvent) => void;
  onExampleClick: (example: string) => void;

  // DSL 相关
  dsl: DslType | null;
  yamlOutput: string;
  duration: number;
  nodeCount: number;
  edgeCount: number;

  // 节点编辑相关
  selectedNodeId: string | null;
  selectedNodeData: { id: string; data: NodeData } | null;
  onNodeUpdate: (nodeId: string, data: Partial<NodeData>) => void;
  onNodeEditorClose: () => void;

  // YAML 操作
  onCopyYaml: () => void;
}

const Sidebar = memo(function Sidebar({
  prompt,
  isGenerating,
  apiConnected,
  error,
  progress,
  onPromptChange,
  onGenerate,
  onCancelGeneration,
  onPromptKeyDown,
  onExampleClick,
  dsl,
  yamlOutput,
  duration,
  nodeCount,
  edgeCount,
  selectedNodeId,
  selectedNodeData,
  onNodeUpdate,
  onNodeEditorClose,
  onCopyYaml,
}: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="工作流编辑器侧边栏" role="complementary">
      <div className="sidebar-header">
        <h2>工作流描述</h2>
      </div>
      <div className="sidebar-content">
        {/* Prompt 输入区 */}
        <PromptInput
          prompt={prompt}
          isGenerating={isGenerating}
          apiConnected={apiConnected}
          error={error}
          progress={progress}
          onPromptChange={onPromptChange}
          onGenerate={onGenerate}
          onCancelGeneration={onCancelGeneration}
          onKeyDown={onPromptKeyDown}
        />

        {/* 示例提示词 */}
        <ExamplePrompts onExampleClick={onExampleClick} />

        {/* 节点面板 */}
        <NodePalette />

        {/* 工作流信息 */}
        {dsl && (
          <WorkflowInfo
            appName={dsl.app?.name}
            appIcon={dsl.app?.icon}
            appDescription={dsl.app?.description}
            nodeCount={nodeCount}
            edgeCount={edgeCount}
            duration={duration}
          />
        )}

        {/* 节点编辑器 */}
        {selectedNodeData && (
          <div className="mt-4">
            <Suspense fallback={<div className="p-4 text-center text-slate-500">加载中...</div>}>
              <NodeEditor
                node={{ id: selectedNodeId!, data: selectedNodeData.data }}
                onUpdate={onNodeUpdate}
                onClose={onNodeEditorClose}
              />
            </Suspense>
          </div>
        )}

        {/* YAML 预览 */}
        {dsl && (
          <Suspense fallback={<div className="p-4 text-center text-slate-500">加载中...</div>}>
            <YamlPreview yamlOutput={yamlOutput} onCopy={onCopyYaml} />
          </Suspense>
        )}
      </div>
    </aside>
  );
});

export default Sidebar;
