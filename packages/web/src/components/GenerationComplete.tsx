/**
 * GenerationComplete Component
 *
 * 工作流生成完成的特效展示
 */

import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COMPLETE_ANIMATION } from '../constants/animations';

interface GenerationCompleteProps {
  /** 是否显示 */
  isVisible: boolean;
  /** 导出到 Dify 回调 */
  onExport?: () => void;
  /** 自动隐藏延迟（毫秒），0 表示不自动隐藏 */
  autoHideDelay?: number;
  /** 隐藏回调 */
  onHide?: () => void;
}

/**
 * GenerationComplete - 生成完成特效
 */
const GenerationComplete = memo(function GenerationComplete({
  isVisible,
  onExport,
  autoHideDelay = 5000,
  onHide,
}: GenerationCompleteProps) {
  const [show, setShow] = useState(isVisible);

  // 同步外部 isVisible 状态
  useEffect(() => {
    if (isVisible) {
      setShow(true);
    }
  }, [isVisible]);

  // 自动隐藏
  useEffect(() => {
    if (show && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setShow(false);
        onHide?.();
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [show, autoHideDelay, onHide]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          {...COMPLETE_ANIMATION.container}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          {/* Pulse effect behind */}
          <motion.div
            className="absolute inset-0 rounded-full bg-blue-500/20"
            animate={COMPLETE_ANIMATION.pulse.animate}
            transition={COMPLETE_ANIMATION.pulse.transition}
          />

          {/* Main content */}
          <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 rounded-full px-6 py-3 shadow-lg shadow-blue-500/30 flex items-center gap-4">
            {/* Success icon */}
            <motion.span
              initial={COMPLETE_ANIMATION.icon.initial}
              animate={COMPLETE_ANIMATION.icon.animate}
              transition={COMPLETE_ANIMATION.icon.transition}
              className="text-xl"
            >
              ✨
            </motion.span>

            {/* Text */}
            <span className="text-white font-semibold text-sm">
              工作流生成完成
            </span>

            {/* Export button */}
            {onExport && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onExport}
                className="bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-full text-white text-sm font-medium transition-colors flex items-center gap-2"
              >
                <span>复制到 Dify</span>
                <span>→</span>
              </motion.button>
            )}

            {/* Close button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setShow(false);
                onHide?.();
              }}
              className="text-white/70 hover:text-white transition-colors ml-1"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 4L12 12M4 12L12 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default GenerationComplete;
