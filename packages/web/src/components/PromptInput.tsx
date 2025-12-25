import React from 'react';

interface PromptInputProps {
  prompt: string;
  isGenerating: boolean;
  apiConnected: boolean | null;
  error: string | null;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export default function PromptInput({
  prompt,
  isGenerating,
  apiConnected,
  error,
  onPromptChange,
  onGenerate,
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

      <button
        className="btn btn-primary"
        onClick={onGenerate}
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
  );
}
