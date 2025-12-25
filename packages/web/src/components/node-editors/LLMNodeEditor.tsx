import { NodeData } from '../../types/nodeData';
import { LLM_MODELS } from '../../constants/nodeConfig';

interface LLMNodeEditorProps {
  data: NodeData;
  onChange: (field: keyof NodeData, value: unknown) => void;
}

export default function LLMNodeEditor({ data, onChange }: LLMNodeEditorProps) {
  return (
    <div className="editor-section">
      <h4>LLM 配置</h4>

      <div className="form-group">
        <label>模型</label>
        <select value={data.model || 'gpt-4o'} onChange={(e) => onChange('model', e.target.value)}>
          {LLM_MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Prompt 模板</label>
        <textarea
          value={data.prompt_template || ''}
          onChange={(e) => onChange('prompt_template', e.target.value)}
          placeholder="输入 prompt 模板，使用 {{变量名}} 引用变量"
          rows={6}
        />
      </div>

      <div className="form-row">
        <div className="form-group half">
          <label>Temperature</label>
          <input
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={data.temperature ?? 0.7}
            onChange={(e) => onChange('temperature', parseFloat(e.target.value))}
          />
        </div>
        <div className="form-group half">
          <label>Max Tokens</label>
          <input
            type="number"
            min="1"
            max="128000"
            value={data.max_tokens ?? 4096}
            onChange={(e) => onChange('max_tokens', parseInt(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
