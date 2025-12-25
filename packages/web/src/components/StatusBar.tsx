import { memo } from 'react';

interface StatusBarProps {
  apiConnected: boolean | null;
  nodeCount: number;
  edgeCount: number;
  hasDsl: boolean;
}

const StatusBar = memo(function StatusBar({ apiConnected, nodeCount, edgeCount, hasDsl }: StatusBarProps) {
  return (
    <footer className="status-bar">
      <div className="status-item">
        <span
          className="status-dot"
          style={{
            background:
              apiConnected === true ? '#22c55e' : apiConnected === false ? '#ef4444' : '#f59e0b',
          }}
        />
        {apiConnected === true ? 'API 已连接' : apiConnected === false ? 'API 未连接' : '检查连接...'}
      </div>
      {hasDsl && (
        <>
          <div className="status-item">📦 节点: {nodeCount}</div>
          <div className="status-item">🔗 连接: {edgeCount}</div>
        </>
      )}
    </footer>
  );
});

export default StatusBar;
