/**
 * 动画配置常量
 * 用于统一管理所有动画参数，确保一致的动画体验
 */

import type { Transition, Variants } from 'framer-motion'

// ============================================
// 基础时间配置
// ============================================
export const TIMING = {
  /** 节点间隔出现延迟 (秒) */
  stagger: 0.15,
  /** 节点动画持续时间 (秒) */
  nodeDuration: 0.5,
  /** 边线绘制持续时间 (秒) */
  edgeDuration: 0.4,
  /** 思考步骤显示间隔 (毫秒) */
  thinkingStepDelay: 300,
  /** 完成特效持续时间 (秒) */
  completeDuration: 0.6,
} as const

// ============================================
// 弹性动画配置
// ============================================
export const SPRING = {
  /** 默认弹性配置 - 平衡的弹性效果 */
  default: {
    type: 'spring',
    stiffness: 300,
    damping: 25,
  } as Transition,

  /** 柔和弹性 - 更慢更柔和的效果 */
  gentle: {
    type: 'spring',
    stiffness: 200,
    damping: 20,
  } as Transition,

  /** 弹跳弹性 - 更明显的弹跳效果 */
  bouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 15,
  } as Transition,

  /** 快速弹性 - 快速响应 */
  snappy: {
    type: 'spring',
    stiffness: 500,
    damping: 30,
  } as Transition,
} as const

// ============================================
// 缓动函数配置
// ============================================
export const EASING = {
  /** 平滑缓出 */
  easeOut: [0.0, 0.0, 0.2, 1],
  /** 平滑缓入 */
  easeIn: [0.4, 0.0, 1, 1],
  /** 平滑缓入缓出 */
  easeInOut: [0.4, 0.0, 0.2, 1],
} as const

// ============================================
// 节点动画配置
// ============================================
export const NODE_ANIMATION = {
  /** 初始状态 - 从上方缩小并透明 */
  initial: {
    opacity: 0,
    scale: 0.3,
    y: -50,
  },

  /** 进入状态 - 正常显示 */
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
  },

  /** 退出状态 - 缩小并透明 */
  exit: {
    opacity: 0,
    scale: 0.5,
    y: 20,
  },

  /** 过渡配置 */
  transition: SPRING.default,

  /** 悬停效果 */
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },

  /** 点击效果 */
  tap: {
    scale: 0.98,
  },
} as const

// ============================================
// 节点 Variants (用于 AnimatePresence)
// ============================================
export const nodeVariants: Variants = {
  initial: NODE_ANIMATION.initial,
  animate: NODE_ANIMATION.animate,
  exit: NODE_ANIMATION.exit,
}

// ============================================
// 边线动画配置
// ============================================
export const EDGE_ANIMATION = {
  /** 初始状态 - 路径长度为0 */
  initial: {
    pathLength: 0,
    opacity: 0,
  },

  /** 进入状态 - 完整路径 */
  animate: {
    pathLength: 1,
    opacity: 1,
  },

  /** 过渡配置 */
  transition: {
    duration: TIMING.edgeDuration,
    ease: EASING.easeOut,
  },
} as const

// ============================================
// 思考展示层动画配置
// ============================================
export const THINKING_ANIMATION = {
  /** 容器动画 */
  container: {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.95 },
  },

  /** 思考步骤动画 */
  step: {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
  },

  /** 加载旋转动画 */
  spinner: {
    animate: { rotate: 360 },
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
} as const

// ============================================
// 完成特效动画配置
// ============================================
export const COMPLETE_ANIMATION = {
  /** 容器动画 */
  container: {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: 20 },
  },

  /** 图标弹出动画 */
  icon: {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0 },
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 15,
      delay: 0.2,
    },
  },

  /** 脉冲效果 */
  pulse: {
    animate: {
      scale: [1, 1.08, 1] as number[],
      boxShadow: [
        '0 0 0 0 rgba(37, 99, 235, 0)',
        '0 0 30px 15px rgba(37, 99, 235, 0.3)',
        '0 0 0 0 rgba(37, 99, 235, 0)',
      ] as string[],
    },
    transition: {
      duration: TIMING.completeDuration,
      repeat: 2,
    },
  },
}

// ============================================
// 进度条动画配置
// ============================================
export const PROGRESS_ANIMATION = {
  /** 进度条宽度动画 */
  bar: {
    transition: {
      duration: 0.3,
      ease: EASING.easeOut,
    },
  },

  /** 进度数字动画 */
  number: {
    transition: {
      duration: 0.5,
    },
  },
} as const

// ============================================
// 侧边栏动画配置
// ============================================
export const SIDEBAR_ANIMATION = {
  /** 面板滑入动画 */
  panel: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.2 },
  },

  /** 内容淡入动画 */
  content: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15 },
  },
} as const

// ============================================
// 画布整体动画配置
// ============================================
export const CANVAS_ANIMATION = {
  /** 工作流完成后的脉冲效果 */
  completePulse: {
    animate: {
      scale: [1, 1.02, 1],
    },
    transition: {
      duration: 0.6,
      repeat: 2,
    },
  },

  /** 画布淡入效果 */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 },
  },
} as const

// ============================================
// 工具函数
// ============================================

/**
 * 生成带延迟的节点动画配置
 * @param index 节点索引
 * @returns 带延迟的动画配置
 */
export function getNodeAnimationWithDelay(index: number) {
  return {
    ...NODE_ANIMATION,
    transition: {
      ...SPRING.default,
      delay: index * TIMING.stagger,
    },
  }
}

/**
 * 生成带延迟的边线动画配置
 * @param index 边线索引
 * @param nodeCount 节点数量 (边线在所有节点后开始动画)
 * @returns 带延迟的动画配置
 */
export function getEdgeAnimationWithDelay(index: number, nodeCount: number) {
  const baseDelay = nodeCount * TIMING.stagger
  return {
    ...EDGE_ANIMATION,
    transition: {
      ...EDGE_ANIMATION.transition,
      delay: baseDelay + index * 0.1,
    },
  }
}
