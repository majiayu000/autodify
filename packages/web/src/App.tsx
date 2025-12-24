import React, { useState, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import WorkflowCanvas from './components/WorkflowCanvas';
import NodeEditor, { type NodeData } from './components/NodeEditor';
import { generateWorkflow, saveApiConfig, getApiConfig, clearApiConfig } from './api/generate';
import yaml from 'js-yaml';

// Example prompts
const EXAMPLE_PROMPTS = [
  '创建一个简单的问答工作流',
  '创建一个 RAG 知识库问答工作流',
  '创建一个智能客服系统，根据问题类型分类后走不同分支回答',
  '创建一个文档翻译工作流，支持多语言',
];

interface DslType {
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

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [dsl, setDsl] = useState<DslType | null>(null);
  const [yamlOutput, setYamlOutput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showYaml, setShowYaml] = useState(false);
  const [duration, setDuration] = useState<number>(0);

  // API settings
  const [apiConfig, setApiConfigState] = useState(() => getApiConfig());

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setSelectedNode(null);

    try {
      const result = await generateWorkflow({ prompt });

      if (result.success && result.dsl) {
        setDsl(result.dsl as DslType);
        setDuration(result.duration || 0);

        // Generate YAML
        try {
          const yamlStr = yaml.dump(result.dsl, {
            indent: 2,
            lineWidth: -1,
            quotingType: "'",
            forceQuotes: true,
          });
          setYamlOutput(yamlStr);
        } catch {
          setYamlOutput('');
        }
      } else {
        console.error('Generation failed:', result.error);
      }
    } catch (error) {
      console.error('Generation error:', error);
    }

    setIsGenerating(false);
  }, [prompt]);

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

  // 更新节点数据
  const handleNodeUpdate = useCallback((nodeId: string, newData: Partial<NodeData>) => {
    if (!dsl?.workflow?.graph?.nodes) return;

    const updatedDsl = {
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
    };

    setDsl(updatedDsl);

    // 同步更新 YAML
    try {
      const yamlStr = yaml.dump(updatedDsl, {
        indent: 2,
        lineWidth: -1,
        quotingType: "'",
        forceQuotes: true,
      });
      setYamlOutput(yamlStr);
    } catch {
      // 忽略 YAML 生成错误
    }
  }, [dsl]);

  // 获取选中的节点
  const selectedNodeData = selectedNode && dsl?.workflow?.graph?.nodes
    ? dsl.workflow.graph.nodes.find((n) => n.id === selectedNode)
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
        <div style={{ display: 'flex', gap: '8px' }}>
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
                  node={{ id: selectedNode!, data: selectedNodeData.data }}
                  onUpdate={handleNodeUpdate}
                  onClose={() => setSelectedNode(null)}
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
          <WorkflowCanvas dsl={dsl} onNodeSelect={setSelectedNode} />
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
