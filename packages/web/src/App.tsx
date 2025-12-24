import React, { useState, useCallback, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import WorkflowCanvas from './components/WorkflowCanvas';
import NodeEditor from './components/NodeEditor';
import NodePalette from './components/NodePalette';
import { useWorkflowStore, useTemporalStore, type DslType } from './store/workflowStore';
import { generateWorkflow, checkHealth } from './api/generate';
import yaml from 'js-yaml';

// Example prompts
const EXAMPLE_PROMPTS = [
  '创建一个简单的问答工作流',
  '创建一个 RAG 知识库问答工作流',
  '创建一个智能客服系统，根据问题类型分类后走不同分支回答',
  '创建一个文档翻译工作流，支持多语言',
];

export default function App() {
  // Store 状态
  const {
    dsl,
    selectedNodeId,
    isGenerating,
    yamlOutput,
    duration,
    setDsl,
    setYamlOutput,
    setDuration,
    setIsGenerating,
    selectNode,
    updateNode,
    addNode,
  } = useWorkflowStore();

  // 时间旅行（撤销/重做）
  const { undo, redo, pastStates, futureStates } = useTemporalStore(
    useShallow((state) => ({
      undo: state.undo,
      redo: state.redo,
      pastStates: state.pastStates,
      futureStates: state.futureStates,
    }))
  );

  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  // 本地 UI 状态
  const [prompt, setPrompt] = useState('');
  const [showYaml, setShowYaml] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 检查 API 连接状态
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkHealth();
      setApiConnected(connected);
    };

    checkConnection();
    // 每 30 秒检查一次
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // 同步 DSL 变化到 YAML
  useEffect(() => {
    if (dsl) {
      try {
        const yamlStr = yaml.dump(dsl, {
          indent: 2,
          lineWidth: -1,
          quotingType: "'",
          forceQuotes: false,
        });
        setYamlOutput(yamlStr);
      } catch {
        // 忽略 YAML 生成错误
      }
    } else {
      setYamlOutput('');
    }
  }, [dsl, setYamlOutput]);

  // 全局键盘快捷键：撤销/重做
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (canRedo) redo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    selectNode(null);

    try {
      const result = await generateWorkflow({ prompt });

      if (result.success && result.dsl) {
        setDsl(result.dsl as DslType);
        setDuration(result.metadata?.duration || 0);
        setError(null);
      } else {
        setError(result.error || '生成失败');
        console.error('Generation failed:', result.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '网络错误';
      setError(message);
      console.error('Generation error:', err);
    }

    setIsGenerating(false);
  }, [prompt, setIsGenerating, selectNode, setDsl, setDuration]);

  const handleExampleClick = useCallback((example: string) => {
    setPrompt(example);
    setError(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && e.metaKey) {
        handleGenerate();
      }
    },
    [handleGenerate]
  );

  const handleExportYaml = useCallback(() => {
    if (!yamlOutput) return;

    const blob = new Blob([yamlOutput], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dsl?.app?.name || 'workflow'}.yml`;
    a.click();
    URL.revokeObjectURL(url);
  }, [yamlOutput, dsl]);

  const handleCopyYaml = useCallback(() => {
    if (!yamlOutput) return;
    navigator.clipboard.writeText(yamlOutput);
  }, [yamlOutput]);

  const handleAddNode = useCallback(
    (_nodeType: string, _nodeTitle: string, _position: { x: number; y: number }) => {
      addNode(_nodeType, _nodeTitle);
    },
    [addNode]
  );

  const selectedNodeData =
    selectedNodeId && dsl?.workflow?.graph?.nodes
      ? dsl.workflow.graph.nodes.find((n) => n.id === selectedNodeId)
      : null;

  const nodeCount = dsl?.workflow?.graph?.nodes?.length || 0;
  const edgeCount = dsl?.workflow?.graph?.edges?.length || 0;

  return (
    <ReactFlowProvider>
      {/* Header */}
      <header className="header">
        <h1>
          <span>Autodify</span> 工作流生成器
        </h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="undo-redo-group">
            <button
              className="btn btn-icon"
              onClick={() => undo()}
              disabled={!canUndo}
              title="撤销 (⌘Z)"
            >
              ↩️
            </button>
            <button
              className="btn btn-icon"
              onClick={() => redo()}
              disabled={!canRedo}
              title="重做 (⌘⇧Z)"
            >
              ↪️
            </button>
          </div>
          <button className="btn btn-secondary" disabled={!dsl} onClick={handleExportYaml}>
            📤 导出 YAML
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>工作流描述</h2>
          </div>
          <div className="sidebar-content">
            <div className="input-area">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="用自然语言描述你想要的工作流...&#10;&#10;例如：创建一个智能客服工作流，根据用户问题类型分类后，分别从不同知识库检索并回答"
              />

              {/* Error message */}
              {error && (
                <div
                  style={{
                    padding: '10px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    color: '#ef4444',
                    fontSize: '12px',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating || apiConnected === false}
                style={{ width: '100%' }}
              >
                {isGenerating ? (
                  <>
                    <span className="loading-spinner" />
                    AI 生成中...
                  </>
                ) : (
                  <>✨ 生成工作流</>
                )}
              </button>
              <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
                ⌘ + Enter 快速生成
              </div>
            </div>

            {/* Examples */}
            <div className="examples">
              <h3>💡 示例</h3>
              {EXAMPLE_PROMPTS.map((example, index) => (
                <button
                  key={index}
                  className="example-btn"
                  onClick={() => handleExampleClick(example)}
                >
                  {example}
                </button>
              ))}
            </div>

            {/* Node Palette */}
            <NodePalette />

            {/* Workflow Info */}
            {dsl && (
              <div className="node-info" style={{ marginTop: '16px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {dsl.app?.icon} {dsl.app?.name}
                </h3>
                <p style={{ marginTop: '8px' }}>{dsl.app?.description}</p>
                <div
                  style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '12px' }}
                >
                  <span>📦 {nodeCount} 节点</span>
                  <span>🔗 {edgeCount} 连接</span>
                  <span>⏱️ {duration}ms</span>
                </div>
              </div>
            )}

            {/* Node Editor */}
            {selectedNodeData && (
              <div style={{ marginTop: '16px' }}>
                <NodeEditor
                  node={{ id: selectedNodeId!, data: selectedNodeData.data }}
                  onUpdate={updateNode}
                  onClose={() => selectNode(null)}
                />
              </div>
            )}

            {/* YAML Preview */}
            {dsl && (
              <div className="yaml-preview">
                <h3>
                  <span>📄 YAML 预览</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={handleCopyYaml}
                    >
                      复制
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={() => setShowYaml(!showYaml)}
                    >
                      {showYaml ? '收起' : '展开'}
                    </button>
                  </div>
                </h3>
                {showYaml && (
                  <div className="yaml-content">
                    <pre>{yamlOutput}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Canvas */}
        <main className="canvas-container">
          <WorkflowCanvas dsl={dsl} onNodeSelect={selectNode} onAddNode={handleAddNode} />
        </main>
      </div>

      {/* Status Bar */}
      <footer className="status-bar">
        <div className="status-item">
          <span
            className="status-dot"
            style={{
              background:
                apiConnected === true
                  ? '#22c55e'
                  : apiConnected === false
                    ? '#ef4444'
                    : '#f59e0b',
            }}
          />
          {apiConnected === true
            ? 'API 已连接'
            : apiConnected === false
              ? 'API 未连接'
              : '检查连接...'}
        </div>
        {dsl && (
          <>
            <div className="status-item">📦 节点: {nodeCount}</div>
            <div className="status-item">🔗 连接: {edgeCount}</div>
          </>
        )}
      </footer>
    </ReactFlowProvider>
  );
}
