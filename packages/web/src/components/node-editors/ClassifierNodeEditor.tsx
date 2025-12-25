import { NodeData } from '../../types/nodeData';
import { LLM_MODELS } from '../../constants/nodeConfig';

interface ClassifierNodeEditorProps {
  data: NodeData;
  onChange: (field: keyof NodeData, value: unknown) => void;
}

export default function ClassifierNodeEditor({ data, onChange }: ClassifierNodeEditorProps) {
  return (
    <div className="editor-section">
      <h4>分类器配置</h4>

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
        <label>分类指令</label>
        <textarea
          value={data.prompt_template || ''}
          onChange={(e) => onChange('prompt_template', e.target.value)}
          placeholder="描述如何对输入进行分类..."
          rows={4}
        />
      </div>
    </div>
  );
}
