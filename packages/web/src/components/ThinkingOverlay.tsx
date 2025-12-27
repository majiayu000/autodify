/**
 * ThinkingOverlay Component
 *
 * 显示 AI 思考过程的覆盖层
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { THINKING_ANIMATION } from '../constants/animations';
import type { ThinkingStep } from '../hooks/useStreamingNodes';

interface ThinkingOverlayProps {
  /** 思考步骤列表 */
  steps: ThinkingStep[];
  /** 是否可见 */
  isVisible: boolean;
  /** 节点生成进度 */
  nodeProgress?: { current: number; total: number };
}

/**
 * ThinkingOverlay - AI 思考展示层
 */
const ThinkingOverlay = memo(function ThinkingOverlay({
  steps,
  isVisible,
  nodeProgress,
}: ThinkingOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          {...THINKING_ANIMATION.container}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-slate-800/95 backdrop-blur-sm rounded-xl p-5 border border-slate-600/50 shadow-2xl min-w-[320px] max-w-[400px]">
            {/* Header with spinner */}
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={THINKING_ANIMATION.spinner.animate}
                transition={THINKING_ANIMATION.spinner.transition}
                className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
              />
              <span className="text-slate-100 font-medium text-sm">
                AI 正在思考...
              </span>
            </div>

            {/* Thinking steps */}
            <div className="space-y-2.5">
              {steps.map((step, index) => (
                <motion.div
                  key={`${step.step}-${index}`}
                  initial={THINKING_ANIMATION.step.initial}
                  animate={THINKING_ANIMATION.step.animate}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2.5"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.1, type: 'spring' }}
                    className="text-green-400 text-sm mt-0.5 flex-shrink-0"
                  >
                    ✓
                  </motion.span>
                  <span className="text-slate-300 text-sm leading-relaxed">
                    {step.message}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Node progress bar */}
            {nodeProgress && nodeProgress.total > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>生成节点</span>
                  <span>
                    {nodeProgress.current} / {nodeProgress.total}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(nodeProgress.current / nodeProgress.total) * 100}%`,
                    }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default ThinkingOverlay;
