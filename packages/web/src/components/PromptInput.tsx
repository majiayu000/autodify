import React, { memo } from 'react';

interface PromptInputProps {
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
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const PromptInput = memo(function PromptInput({
  prompt,
  isGenerating,
  apiConnected,
  error,
  progress,
  onPromptChange,
  onGenerate,
  onCancelGeneration,
  onKeyDown,
}: PromptInputProps) {
  return (
    <div className="input-area">
      <textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        onKeyDown={onKeyDown}
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

      {/* Progress indicator */}
      {progress && isGenerating && (
        <div
          style={{
            padding: '12px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid #3b82f6',
            borderRadius: '6px',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 500 }}>
              {progress.message}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {progress.percentage}%
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '4px',
              background: 'rgba(59, 130, 246, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress.percentage}%`,
                height: '100%',
                background: '#3b82f6',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {isGenerating ? (
        <button
          className="btn btn-secondary"
          onClick={onCancelGeneration}
          style={{ width: '100%' }}
        >
          ⏹ 取消生成
        </button>
      ) : (
        <button
          className="btn btn-primary"
          onClick={onGenerate}
          disabled={!prompt.trim() || apiConnected === false}
          style={{ width: '100%' }}
        >
          ✨ 生成工作流
        </button>
      )}

      <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
        ⌘ + Enter 快速生成
      </div>
    </div>
  );
});

export default PromptInput;
