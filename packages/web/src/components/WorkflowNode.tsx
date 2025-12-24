import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

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
      style={{
        background: colors.bg,
        border: `2px solid ${selected ? '#6366f1' : colors.border}`,
        borderRadius: '8px',
        padding: '12px 16px',
        minWidth: '180px',
        boxShadow: selected ? '0 0 0 2px rgba(99, 102, 241, 0.3)' : 'none',
      }}
    >
      {/* Input Handle */}
      {nodeType !== 'start' && (
        <Handle
          type="target"
          position={Position.Top}
          id="target"
          style={{
            background: colors.border,
            width: 10,
            height: 10,
            border: '2px solid #1e293b',
          }}
        />
      )}

      {/* Node Content */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#f1f5f9' }}>
            {data.title}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
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
          style={{
            background: colors.border,
            width: 10,
            height: 10,
            border: '2px solid #1e293b',
          }}
        />
      )}

      {/* Branch Handles for classifier/if-else */}
      {(nodeType === 'question-classifier' || nodeType === 'if-else') && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="branch-1"
            style={{
              background: colors.border,
              width: 8,
              height: 8,
              border: '2px solid #1e293b',
              top: '30%',
            }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="branch-2"
            style={{
              background: colors.border,
              width: 8,
              height: 8,
              border: '2px solid #1e293b',
              top: '70%',
            }}
          />
        </>
      )}
    </div>
  );
});

WorkflowNode.displayName = 'WorkflowNode';

export default WorkflowNode;
