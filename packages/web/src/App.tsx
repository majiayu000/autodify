import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import WorkflowCanvas from './components/WorkflowCanvas';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import StatusBar from './components/StatusBar';
import { useWorkflowStore, useTemporalStore, type DslType } from './store/workflowStore';
import { generateWorkflow, generateWorkflowStream, checkHealth, type StreamChunk } from './api/generate';
import yaml from 'js-yaml';

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
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useStreaming, _setUseStreaming] = useState(true);
  void _setUseStreaming; // Reserved for future UI toggle
  const [progress, setProgress] = useState<{
    stage: string;
    percentage: number;
    message: string;
  } | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

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
    setProgress(null);
    selectNode(null);

    // Create abort controller for cancellation
    const controller = new AbortController();
    setAbortController(controller);

    try {
      if (useStreaming) {
        // Use streaming API
        const result = await generateWorkflowStream(
          { prompt },
          (chunk: StreamChunk) => {
            // Handle progress updates
            if (chunk.type === 'progress' && chunk.progress) {
              setProgress({
                stage: chunk.progress.stage,
                percentage: chunk.progress.percentage || 0,
                message: chunk.progress.message || '',
              });
            } else if (chunk.type === 'error') {
              setError(chunk.error || 'Generation failed');
            } else if (chunk.type === 'done') {
              setProgress(null);
            }
          },
          controller.signal
        );

        if (result.success && result.dsl) {
          setDsl(result.dsl as DslType);
          setDuration(result.metadata?.duration || 0);
          setError(null);
        } else {
          setError(result.error || '生成失败');
          console.error('Generation failed:', result.error);
        }
      } else {
        // Use non-streaming API
        const result = await generateWorkflow({ prompt });

        if (result.success && result.dsl) {
          setDsl(result.dsl as DslType);
          setDuration(result.metadata?.duration || 0);
          setError(null);
        } else {
          setError(result.error || '生成失败');
          console.error('Generation failed:', result.error);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('生成已取消');
      } else {
        const message = err instanceof Error ? err.message : '网络错误';
        setError(message);
        console.error('Generation error:', err);
      }
    } finally {
      setIsGenerating(false);
      setProgress(null);
      setAbortController(null);
    }
  }, [prompt, useStreaming, setIsGenerating, selectNode, setDsl, setDuration]);

  const handleCancelGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsGenerating(false);
      setProgress(null);
      setError('生成已取消');
    }
  }, [abortController, setIsGenerating]);

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

  const selectedNodeData = useMemo(() =>
    selectedNodeId && dsl?.workflow?.graph?.nodes
      ? dsl.workflow.graph.nodes.find((n) => n.id === selectedNodeId)
      : null
  , [selectedNodeId, dsl?.workflow?.graph?.nodes]);

  const nodeCount = useMemo(() => dsl?.workflow?.graph?.nodes?.length || 0, [dsl?.workflow?.graph?.nodes]);
  const edgeCount = useMemo(() => dsl?.workflow?.graph?.edges?.length || 0, [dsl?.workflow?.graph?.edges]);

  return (
    <ReactFlowProvider>
      <Header
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onExportYaml={handleExportYaml}
        hasDsl={!!dsl}
      />

      <div className="main-container">
        <Sidebar
          prompt={prompt}
          isGenerating={isGenerating}
          apiConnected={apiConnected}
          error={error}
          progress={progress}
          onPromptChange={setPrompt}
          onGenerate={handleGenerate}
          onCancelGeneration={handleCancelGeneration}
          onPromptKeyDown={handleKeyDown}
          onExampleClick={handleExampleClick}
          dsl={dsl}
          yamlOutput={yamlOutput}
          duration={duration}
          nodeCount={nodeCount}
          edgeCount={edgeCount}
          selectedNodeId={selectedNodeId}
          selectedNodeData={
            selectedNodeData ? { id: selectedNodeId!, data: selectedNodeData.data } : null
          }
          onNodeUpdate={updateNode}
          onNodeEditorClose={() => selectNode(null)}
          onCopyYaml={handleCopyYaml}
        />

        <main className="canvas-container">
          <WorkflowCanvas dsl={dsl} onNodeSelect={selectNode} onAddNode={handleAddNode} />
        </main>
      </div>

      <StatusBar
        apiConnected={apiConnected}
        nodeCount={nodeCount}
        edgeCount={edgeCount}
        hasDsl={!!dsl}
      />
    </ReactFlowProvider>
  );
}
