import { memo } from 'react';

interface WorkflowInfoProps {
  appName?: string;
  appIcon?: string;
  appDescription?: string;
  nodeCount: number;
  edgeCount: number;
  duration: number;
}

const WorkflowInfo = memo(function WorkflowInfo({
  appName,
  appIcon,
  appDescription,
  nodeCount,
  edgeCount,
  duration,
}: WorkflowInfoProps) {
  return (
    <div className="node-info" style={{ marginTop: '16px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {appIcon} {appName}
      </h3>
      <p style={{ marginTop: '8px' }}>{appDescription}</p>
      <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '12px' }}>
        <span>📦 {nodeCount} 节点</span>
        <span>🔗 {edgeCount} 连接</span>
        <span>⏱️ {duration}ms</span>
      </div>
    </div>
  );
});

export default WorkflowInfo;
