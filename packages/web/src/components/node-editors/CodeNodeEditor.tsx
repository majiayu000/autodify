import { NodeData } from '../../types/nodeData';

interface CodeNodeEditorProps {
  data: NodeData;
  onChange: (field: keyof NodeData, value: unknown) => void;
}

export default function CodeNodeEditor({ data, onChange }: CodeNodeEditorProps) {
  return (
    <div className="editor-section">
      <h4>代码执行配置</h4>

      <div className="form-group">
        <label>语言</label>
        <select
          value={data.language || 'python'}
          onChange={(e) => onChange('language', e.target.value)}
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </select>
      </div>

      <div className="form-group">
        <label>代码</label>
        <textarea
          value={data.code || ''}
          onChange={(e) => onChange('code', e.target.value)}
          placeholder="def main(inputs):\n    return {'result': inputs}"
          rows={8}
          className="code-input"
        />
      </div>
    </div>
  );
}
