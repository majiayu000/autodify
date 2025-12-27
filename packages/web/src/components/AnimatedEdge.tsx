/**
 * AnimatedEdge Component
 *
 * 带路径绘制动画的边线组件
 */

import { memo, useMemo } from 'react';
import { getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { EDGE_ANIMATION } from '../constants/animations';

/**
 * AnimatedEdge - 带路径绘制动画的边线
 */
const AnimatedEdge = memo(
  ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
  }: EdgeProps) => {
    // 计算路径
    const [edgePath] = getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      borderRadius: 8,
    });

    // 计算动画延迟（基于边的索引）
    const animationIndex = (data?._animationIndex as number) ?? 0;
    const animationDelay = animationIndex * 0.1;

    // 边线颜色
    const strokeColor = (style?.stroke as string) || '#3b82f6';

    // 动画变体
    const pathVariants = useMemo(
      () => ({
        initial: {
          pathLength: 0,
          opacity: 0,
        },
        animate: {
          pathLength: 1,
          opacity: 1,
          transition: {
            ...EDGE_ANIMATION.transition,
            delay: animationDelay,
          },
        },
      }),
      [animationDelay]
    );

    return (
      <g>
        {/* 背景路径（用于显示完整路径轮廓） */}
        <path
          d={edgePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeOpacity={0.2}
          style={style}
        />

        {/* 动画路径 */}
        <motion.path
          d={edgePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinecap="round"
          markerEnd={markerEnd}
          variants={pathVariants}
          initial="initial"
          animate="animate"
          style={style}
        />

        {/* 流动动画效果 */}
        <motion.path
          d={edgePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="5 5"
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: -20 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            ...style,
            opacity: 0.5,
          }}
        />
      </g>
    );
  }
);

AnimatedEdge.displayName = 'AnimatedEdge';

export default AnimatedEdge;
