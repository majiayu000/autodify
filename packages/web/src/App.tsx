import React, { useState, useCallback, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import WorkflowCanvas from './components/WorkflowCanvas';
import NodeEditor from './components/NodeEditor';
import NodePalette from './components/NodePalette';
import { useWorkflowStore, useTemporalStore, type DslType } from './store/workflowStore';
import { generateWorkflow, saveApiConfig, getApiConfig, clearApiConfig } from './api/generate';
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
  const [showSettings, setShowSettings] = useState(false);
  const [showYaml, setShowYaml] = useState(false);
  const [apiConfig, setApiConfigState] = useState(() => getApiConfig());

  // 同步 DSL 变化到 YAML
  useEffect(() => {
    if (dsl) {
      try {
        const yamlStr = yaml.dump(dsl, {
          indent: 2,
          lineWidth: -1,
          quotingType: "'",
          forceQuotes: true,
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
      // 如果在输入框中，不处理
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      // Cmd/Ctrl + Z: 撤销
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
      // Cmd/Ctrl + Shift + Z: 重做
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (canRedo) redo();
      }
      // Cmd/Ctrl + Y: 重做（Windows 习惯）
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
    selectNode(null);

    try {
      const result = await generateWorkflow({ prompt });

      if (result.success && result.dsl) {
        setDsl(result.dsl as DslType);
        setDuration(result.duration || 0);
      } else {
        console.error('Generation failed:', result.error);
      }
    } catch (error) {
      console.error('Generation error:', error);
    }

    setIsGenerating(false);
  }, [prompt, setIsGenerating, selectNode, setDsl, setDuration]);

  const handleExampleClick = useCallback((example: string) => {
    setPrompt(example);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && e.metaKey) {
        handleGenerate();
      }
    },
    [handleGenerate]
  );

  const handleSaveConfig = useCallback((config: typeof apiConfig) => {
    if (config) {
      saveApiConfig(config);
      setApiConfigState(config);
    } else {
      clearApiConfig();
      setApiConfigState(null);
    }
    setShowSettings(false);
  }, []);

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

  // 添加新节点
  const handleAddNode = useCallback((_nodeType: string, _nodeTitle: string, _position: { x: number; y: number }) => {
    addNode(_nodeType, _nodeTitle);
  }, [addNode]);

  // 获取选中的节点数据
  const selectedNodeData = selectedNodeId && dsl?.workflow?.graph?.nodes
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
          {/* 撤销/重做按钮 */}
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
          <button
            className="btn btn-secondary"
            onClick={() => setShowSettings(true)}
          >
            ⚙️ 设置
          </button>
          <button
            className="btn btn-secondary"
            disabled={!dsl}
            onClick={handleExportYaml}
          >
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
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                style={{ width: '100%' }}
              >
                {isGenerating ? (
                  <>
                    <span className="loading-spinner" />
                    生成中...
                  </>
                ) : (
                  <>
                    ✨ 生成工作流
                  </>
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
                <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '12px' }}>
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
          <span className="status-dot" style={{ background: apiConfig ? '#22c55e' : '#f59e0b' }} />
          {apiConfig ? `已连接 ${apiConfig.provider}` : '演示模式'}
        </div>
        {dsl && (
          <>
            <div className="status-item">📦 节点: {nodeCount}</div>
            <div className="status-item">🔗 连接: {edgeCount}</div>
          </>
        )}
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          config={apiConfig}
          onSave={handleSaveConfig}
          onClose={() => setShowSettings(false)}
        />
      )}
    </ReactFlowProvider>
  );
}

// Settings Modal Component
function SettingsModal({
  config,
  onSave,
  onClose,
}: {
  config: ReturnType<typeof getApiConfig>;
  onSave: (config: ReturnType<typeof getApiConfig>) => void;
  onClose: () => void;
}) {
  const [provider, setProvider] = useState(config?.provider || 'anthropic');
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl || '');
  const [model, setModel] = useState(config?.model || '');

  const handleSave = () => {
    if (apiKey) {
      onSave({ provider, apiKey, baseUrl: baseUrl || undefined, model: model || undefined });
    } else {
      onSave(null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1e293b',
          borderRadius: '12px',
          padding: '24px',
          width: '400px',
          maxWidth: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '20px', fontSize: '18px' }}>⚙️ API 设置</h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#94a3b8' }}>
            Provider
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              background: '#0f172a',
              border: '1px solid #475569',
              borderRadius: '6px',
              color: '#f1f5f9',
              fontSize: '14px',
            }}
          >
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="openai">OpenAI</option>
            <option value="deepseek">DeepSeek</option>
            <option value="custom">自定义</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#94a3b8' }}>
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            style={{
              width: '100%',
              padding: '10px',
              background: '#0f172a',
              border: '1px solid #475569',
              borderRadius: '6px',
              color: '#f1f5f9',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#94a3b8' }}>
            Base URL (可选)
          </label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.example.com"
            style={{
              width: '100%',
              padding: '10px',
              background: '#0f172a',
              border: '1px solid #475569',
              borderRadius: '6px',
              color: '#f1f5f9',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#94a3b8' }}>
            Model (可选)
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gpt-4o / claude-3-5-sonnet / glm-4"
            style={{
              width: '100%',
              padding: '10px',
              background: '#0f172a',
              border: '1px solid #475569',
              borderRadius: '6px',
              color: '#f1f5f9',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            保存
          </button>
        </div>

        <p style={{ marginTop: '16px', fontSize: '11px', color: '#64748b' }}>
          💡 不配置 API Key 将使用演示模式，只能生成预设的工作流模板。
        </p>
      </div>
    </div>
  );
}
