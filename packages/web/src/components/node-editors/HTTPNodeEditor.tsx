import { NodeData } from '../../types/nodeData';

interface HTTPNodeEditorProps {
  data: NodeData;
  onChange: (field: keyof NodeData, value: unknown) => void;
}

export default function HTTPNodeEditor({ data, onChange }: HTTPNodeEditorProps) {
  return (
    <div className="editor-section">
      <h4>HTTP 请求配置</h4>

      <div className="form-row">
        <div className="form-group w-[100px]">
          <label>方法</label>
          <select value={data.method || 'GET'} onChange={(e) => onChange('method', e.target.value)}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <div className="form-group flex-1">
          <label>URL</label>
          <input
            type="text"
            value={data.url || ''}
            onChange={(e) => onChange('url', e.target.value)}
            placeholder="https://api.example.com/endpoint"
          />
        </div>
      </div>

      <div className="form-group">
        <label>请求体 (JSON)</label>
        <textarea
          value={data.body || ''}
          onChange={(e) => onChange('body', e.target.value)}
          placeholder='{"key": "value"}'
          rows={4}
        />
      </div>
    </div>
  );
}
