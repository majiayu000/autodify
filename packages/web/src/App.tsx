import React, { useState, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import WorkflowCanvas from './components/WorkflowCanvas';

// Example prompts
const EXAMPLE_PROMPTS = [
  '创建一个简单的问答工作流',
  '创建一个 RAG 知识库问答工作流',
  '创建一个智能客服系统，根据问题类型分类后走不同分支回答',
  '创建一个文档翻译工作流，支持多语言',
];

// Demo DSL for testing (will be replaced with real generation)
const DEMO_DSL_SIMPLE = {
  workflow: {
    graph: {
      nodes: [
        { id: 'start', data: { type: 'start', title: '开始' } },
        { id: 'llm', data: { type: 'llm', title: 'AI 回答' } },
        { id: 'end', data: { type: 'end', title: '结束' } },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'llm' },
        { id: 'e2', source: 'llm', target: 'end' },
      ],
    },
  },
};

const DEMO_DSL_RAG = {
  workflow: {
    graph: {
      nodes: [
        { id: 'start', data: { type: 'start', title: '开始' } },
        { id: 'retrieval', data: { type: 'knowledge-retrieval', title: '知识检索' } },
        { id: 'llm', data: { type: 'llm', title: '生成回答' } },
        { id: 'end', data: { type: 'end', title: '结束' } },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'retrieval' },
        { id: 'e2', source: 'retrieval', target: 'llm' },
        { id: 'e3', source: 'llm', target: 'end' },
      ],
    },
  },
};

const DEMO_DSL_COMPLEX = {
  workflow: {
    graph: {
      nodes: [
        { id: 'start', data: { type: 'start', title: '开始' } },
        { id: 'classifier', data: { type: 'question-classifier', title: '问题分类' } },
        { id: 'retrieval-tech', data: { type: 'knowledge-retrieval', title: '技术文档检索' } },
        { id: 'retrieval-billing', data: { type: 'knowledge-retrieval', title: '账单FAQ检索' } },
        { id: 'llm-tech', data: { type: 'llm', title: '技术支持回答' } },
        { id: 'llm-billing', data: { type: 'llm', title: '账单咨询回答' } },
        { id: 'llm-other', data: { type: 'llm', title: '通用回答' } },
        { id: 'aggregator', data: { type: 'variable-aggregator', title: '结果聚合' } },
        { id: 'end', data: { type: 'end', title: '结束' } },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'classifier' },
        { id: 'e2', source: 'classifier', target: 'retrieval-tech', sourceHandle: 'tech' },
        { id: 'e3', source: 'classifier', target: 'retrieval-billing', sourceHandle: 'billing' },
        { id: 'e4', source: 'classifier', target: 'llm-other', sourceHandle: 'other' },
        { id: 'e5', source: 'retrieval-tech', target: 'llm-tech' },
        { id: 'e6', source: 'retrieval-billing', target: 'llm-billing' },
        { id: 'e7', source: 'llm-tech', target: 'aggregator' },
        { id: 'e8', source: 'llm-billing', target: 'aggregator' },
        { id: 'e9', source: 'llm-other', target: 'aggregator' },
        { id: 'e10', source: 'aggregator', target: 'end' },
      ],
    },
  },
};

const DEMO_DSL_TRANSLATE = {
  workflow: {
    graph: {
      nodes: [
        { id: 'start', data: { type: 'start', title: '开始' } },
        { id: 'llm-detect', data: { type: 'llm', title: '语言检测' } },
        { id: 'llm-translate', data: { type: 'llm', title: '翻译处理' } },
        { id: 'end', data: { type: 'end', title: '结束' } },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'llm-detect' },
        { id: 'e2', source: 'llm-detect', target: 'llm-translate' },
        { id: 'e3', source: 'llm-translate', target: 'end' },
      ],
    },
  },
};

// Simple matching function (will be replaced with real core integration)
function matchDemoDSL(prompt: string) {
  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes('分类') || lowerPrompt.includes('客服') || lowerPrompt.includes('分支')) {
    return DEMO_DSL_COMPLEX;
  }
  if (lowerPrompt.includes('rag') || lowerPrompt.includes('知识库') || lowerPrompt.includes('检索')) {
    return DEMO_DSL_RAG;
  }
  if (lowerPrompt.includes('翻译')) {
    return DEMO_DSL_TRANSLATE;
  }
  return DEMO_DSL_SIMPLE;
}

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [dsl, setDsl] = useState<typeof DEMO_DSL_SIMPLE | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setSelectedNode(null);

    // Simulate generation delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Use demo DSL matching (will be replaced with real API call)
    const result = matchDemoDSL(prompt);
    setDsl(result);
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
          <button className="btn btn-secondary">
            📥 导入 DSL
          </button>
          <button className="btn btn-secondary" disabled={!dsl}>
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

            {/* Selected Node Info */}
            {selectedNode && dsl && (
              <div className="node-info">
                <h3>节点信息</h3>
                {(() => {
                  const node = dsl.workflow?.graph?.nodes?.find(
                    (n) => n.id === selectedNode
                  );
                  if (!node) return null;
                  return (
                    <>
                      <p>
                        <strong>ID:</strong> {node.id}
                      </p>
                      <p>
                        <strong>类型:</strong> {node.data.type}
                      </p>
                      <p>
                        <strong>标题:</strong> {node.data.title}
                      </p>
                    </>
                  );
                })()}
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
          <span className="status-dot" />
          就绪
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
