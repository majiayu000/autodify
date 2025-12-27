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
    <div className="node-info mt-4">
      <h3 className="flex items-center gap-2">
        {appIcon} {appName}
      </h3>
      <p className="mt-2">{appDescription}</p>
      <div className="mt-3 flex gap-4 text-xs">
        <span>📦 {nodeCount} 节点</span>
        <span>🔗 {edgeCount} 连接</span>
        <span>⏱️ {duration}ms</span>
      </div>
    </div>
  );
});

export default WorkflowInfo;
