import React from 'react';
import PromptInput from './PromptInput';
import ExamplePrompts from './ExamplePrompts';
import NodePalette from './NodePalette';
import WorkflowInfo from './WorkflowInfo';
import NodeEditor from './NodeEditor';
import YamlPreview from './YamlPreview';
import { type DslType } from '../store/workflowStore';
import { NodeData } from '../types/nodeData';

interface SidebarProps {
  // Prompt 输入相关
  prompt: string;
  isGenerating: boolean;
  apiConnected: boolean | null;
  error: string | null;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
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

export default function Sidebar({
  prompt,
  isGenerating,
  apiConnected,
  error,
  onPromptChange,
  onGenerate,
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
    <aside className="sidebar">
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
          onPromptChange={onPromptChange}
          onGenerate={onGenerate}
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
          <div style={{ marginTop: '16px' }}>
            <NodeEditor
              node={{ id: selectedNodeId!, data: selectedNodeData.data }}
              onUpdate={onNodeUpdate}
              onClose={onNodeEditorClose}
            />
          </div>
        )}

        {/* YAML 预览 */}
        {dsl && <YamlPreview yamlOutput={yamlOutput} onCopy={onCopyYaml} />}
      </div>
    </aside>
  );
}
