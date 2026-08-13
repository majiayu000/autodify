import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { NODE_ANIMATION, TIMING } from '../constants/animations';

// Node type icons
const nodeIcons: Record<string, string> = {
  start: '▶️',
  end: '🏁',
  llm: '🤖',
  'knowledge-retrieval': '📚',
  'question-classifier': '🏷️',
  'if-else': '🔀',
  code: '💻',
  'http-request': '🌐',
  'variable-aggregator': '📦',
  'template-transform': '📝',
  answer: '💬',
};

// Node type colors
const nodeColors: Record<string, { bg: string; border: string }> = {
  start: { bg: '#065f46', border: '#10b981' },
  end: { bg: '#7c2d12', border: '#f97316' },
  llm: { bg: '#1e3a5f', border: '#3b82f6' },
  'knowledge-retrieval': { bg: '#4c1d95', border: '#8b5cf6' },
  'question-classifier': { bg: '#831843', border: '#ec4899' },
  'if-else': { bg: '#713f12', border: '#eab308' },
  code: { bg: '#164e63', border: '#06b6d4' },
  'http-request': { bg: '#134e4a', border: '#14b8a6' },
  'variable-aggregator': { bg: '#3f3f46', border: '#71717a' },
  'template-transform': { bg: '#44403c', border: '#a8a29e' },
  answer: { bg: '#1e3a5f', border: '#3b82f6' },
};

export interface WorkflowNodeData {
  type: string;
  title: string;
  description?: string;
  /** Animation index for stagger effect */
  _animationIndex?: number;
  /** Whether this is a newly added node */
  _isNew?: boolean;
}

interface WorkflowNodeProps {
  data: WorkflowNodeData;
  selected?: boolean;
}

const WorkflowNode = memo(({ data, selected }: WorkflowNodeProps) => {
  const nodeType = data.type || 'llm';
  const colors = nodeColors[nodeType] || nodeColors.llm;
  const icon = nodeIcons[nodeType] || '⚙️';

  // Calculate animation delay based on index
  const animationIndex = data._animationIndex ?? 0;
  const animationDelay = animationIndex * TIMING.stagger;

  return (
    <motion.div
      initial={NODE_ANIMATION.initial}
      animate={NODE_ANIMATION.animate}
      transition={{
        ...NODE_ANIMATION.transition,
        delay: animationDelay,
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: `0 0 20px ${colors.border}40`,
      }}
      whileTap={NODE_ANIMATION.tap}
      className={cn(
        'rounded-lg px-4 py-3 min-w-[180px] cursor-pointer shadow-md',
        selected && 'ring-2 ring-blue-500/40'
      )}
      style={{
        background: colors.bg,
        border: `2px solid ${selected ? '#2563eb' : colors.border}`,
      }}
      role="button"
      aria-label={`${data.title} (${nodeType} 节点)`}
      aria-selected={selected}
      tabIndex={0}
    >
      {/* Input Handle */}
      {nodeType !== 'start' && (
        <Handle
          type="target"
          position={Position.Top}
          id="target"
          className="!w-2.5 !h-2.5 !border-2 !border-slate-800"
          style={{ background: colors.border }}
          aria-label="输入连接点"
        />
      )}

      {/* Node Content */}
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">
          {icon}
        </span>
        <div>
          <div className="font-semibold text-[13px] text-slate-100">{data.title}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{nodeType}</div>
        </div>
      </div>

      {/* Output Handle */}
      {nodeType !== 'end' && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="source"
          className="!w-2.5 !h-2.5 !border-2 !border-slate-800"
          style={{ background: colors.border }}
          aria-label="输出连接点"
        />
      )}

      {/* Branch Handles for classifier/if-else */}
      {(nodeType === 'question-classifier' || nodeType === 'if-else') && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="branch-1"
            className="!w-2 !h-2 !border-2 !border-slate-800 !top-[30%]"
            style={{ background: colors.border }}
            aria-label="分支 1 连接点"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="branch-2"
            className="!w-2 !h-2 !border-2 !border-slate-800 !top-[70%]"
            style={{ background: colors.border }}
            aria-label="分支 2 连接点"
          />
        </>
      )}
    </motion.div>
  );
});

WorkflowNode.displayName = 'WorkflowNode';

export default WorkflowNode;
