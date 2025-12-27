import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
        aria-label="工作流描述"
        aria-describedby={error ? 'prompt-error' : undefined}
      />

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            id="prompt-error"
            role="alert"
            className="alert alert-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress indicator */}
      <AnimatePresence>
        {progress && isGenerating && (
          <motion.div
            className="progress-container"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="progress-header">
              <span className="progress-message">
                {progress.message}
              </span>
              <span className="progress-percentage">
                {progress.percentage}%
              </span>
            </div>
            <div className="progress-bar">
              <motion.div
                className="progress-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isGenerating ? (
        <motion.button
          className="btn btn-secondary w-full"
          onClick={onCancelGeneration}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <span className="loading-spinner w-3.5 h-3.5 border-2" />
          取消生成
        </motion.button>
      ) : (
        <motion.button
          className="btn btn-primary w-full"
          onClick={onGenerate}
          disabled={!prompt.trim() || apiConnected === false}
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.99 }}
        >
          ✨ 生成工作流
        </motion.button>
      )}

      <div className="keyboard-hint">
        <kbd className="kbd">⌘</kbd>
        <span>+</span>
        <kbd className="kbd">Enter</kbd>
        <span>快速生成</span>
      </div>
    </div>
  );
});

export default PromptInput;
