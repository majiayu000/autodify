import { useState, memo } from 'react';

interface YamlPreviewProps {
  yamlOutput: string;
  onCopy: () => void;
}

const YamlPreview = memo(function YamlPreview({ yamlOutput, onCopy }: YamlPreviewProps) {
  const [showYaml, setShowYaml] = useState(false);

  return (
    <section className="yaml-preview" aria-labelledby="yaml-preview-title">
      <h3 id="yaml-preview-title">
        <span>📄 YAML 预览</span>
        <div className="flex gap-2">
          <button
            className="btn btn-secondary px-2 py-1 text-[11px]"
            onClick={onCopy}
            aria-label="复制 YAML 代码到剪贴板"
          >
            复制
          </button>
          <button
            className="btn btn-secondary px-2 py-1 text-[11px]"
            onClick={() => setShowYaml(!showYaml)}
            aria-expanded={showYaml}
            aria-controls="yaml-content"
          >
            {showYaml ? '收起' : '展开'}
          </button>
        </div>
      </h3>
      {showYaml && (
        <div className="yaml-content" id="yaml-content" role="region" aria-label="YAML 代码内容">
          <pre><code>{yamlOutput}</code></pre>
        </div>
      )}
    </section>
  );
});

export default YamlPreview;
