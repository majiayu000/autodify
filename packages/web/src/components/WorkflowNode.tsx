import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '../lib/utils';

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
}

interface WorkflowNodeProps {
  data: WorkflowNodeData;
  selected?: boolean;
}

const WorkflowNode = memo(({ data, selected }: WorkflowNodeProps) => {
  const nodeType = data.type || 'llm';
  const colors = nodeColors[nodeType] || nodeColors.llm;
  const icon = nodeIcons[nodeType] || '⚙️';

  return (
    <div
      className={cn(
        'rounded-lg px-4 py-3 min-w-[180px] transition-shadow',
        selected && 'ring-2 ring-indigo-500/30'
      )}
      style={{
        background: colors.bg,
        border: `2px solid ${selected ? '#6366f1' : colors.border}`,
      }}
    >
      {/* Input Handle */}
      {nodeType !== 'start' && (
        <Handle
          type="target"
          position={Position.Top}
          id="target"
          className="!w-2.5 !h-2.5 !border-2 !border-slate-800"
          style={{ background: colors.border }}
        />
      )}

      {/* Node Content */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <div>
          <div className="font-semibold text-[13px] text-slate-100">
            {data.title}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {nodeType}
          </div>
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
          />
          <Handle
            type="source"
            position={Position.Right}
            id="branch-2"
            className="!w-2 !h-2 !border-2 !border-slate-800 !top-[70%]"
            style={{ background: colors.border }}
          />
        </>
      )}
    </div>
  );
});

WorkflowNode.displayName = 'WorkflowNode';

export default WorkflowNode;
