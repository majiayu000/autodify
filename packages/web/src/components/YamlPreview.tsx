import { useState, memo } from 'react';

interface YamlPreviewProps {
  yamlOutput: string;
  onCopy: () => void;
}

const YamlPreview = memo(function YamlPreview({ yamlOutput, onCopy }: YamlPreviewProps) {
  const [showYaml, setShowYaml] = useState(false);

  return (
    <div className="yaml-preview">
      <h3>
        <span>📄 YAML 预览</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={onCopy}
          >
            复制
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={() => setShowYaml(!showYaml)}
          >
            {showYaml ? '收起' : '展开'}
          </button>
        </div>
      </h3>
      {showYaml && (
        <div className="yaml-content">
          <pre>{yamlOutput}</pre>
        </div>
      )}
    </div>
  );
});

export default YamlPreview;
