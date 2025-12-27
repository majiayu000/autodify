import { memo } from 'react';

interface StatusBarProps {
  apiConnected: boolean | null;
  nodeCount: number;
  edgeCount: number;
  hasDsl: boolean;
}

const StatusBar = memo(function StatusBar({ apiConnected, nodeCount, edgeCount, hasDsl }: StatusBarProps) {
  const getStatusDotClass = () => {
    if (apiConnected === true) return 'status-dot';
    if (apiConnected === false) return 'status-dot disconnected';
    return 'status-dot warning';
  };

  const getStatusText = () => {
    if (apiConnected === true) return 'API 已连接';
    if (apiConnected === false) return 'API 未连接';
    return '检查连接...';
  };

  return (
    <footer className="status-bar" role="status" aria-live="polite">
      <div className="status-item">
        <span className={getStatusDotClass()} aria-hidden="true" />
        <span className="sr-only">
          {apiConnected === true ? '已连接' : apiConnected === false ? '未连接' : '连接中'}
        </span>
        {getStatusText()}
      </div>
      {hasDsl && (
        <>
          <div className="status-item">
            <span aria-hidden="true">📦</span>
            <span>节点: {nodeCount}</span>
          </div>
          <div className="status-item">
            <span aria-hidden="true">🔗</span>
            <span>连接: {edgeCount}</span>
          </div>
        </>
      )}
    </footer>
  );
});

export default StatusBar;
