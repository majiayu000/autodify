import { NodeData } from '../../types/nodeData';

interface TemplateNodeEditorProps {
  data: NodeData;
  onChange: (field: keyof NodeData, value: unknown) => void;
}

export default function TemplateNodeEditor({ data, onChange }: TemplateNodeEditorProps) {
  return (
    <div className="editor-section">
      <h4>模板转换配置</h4>

      <div className="form-group">
        <label>Jinja2 模板</label>
        <textarea
          value={data.template || ''}
          onChange={(e) => onChange('template', e.target.value)}
          placeholder="{% for item in items %}\n{{ item }}\n{% endfor %}"
          rows={6}
          className="code-input"
        />
      </div>
    </div>
  );
}
