import { NodeData } from '../../types/nodeData';

interface KnowledgeNodeEditorProps {
  data: NodeData;
  onChange: (field: keyof NodeData, value: unknown) => void;
}

export default function KnowledgeNodeEditor({ data, onChange }: KnowledgeNodeEditorProps) {
  return (
    <div className="editor-section">
      <h4>知识库检索配置</h4>

      <div className="form-group">
        <label>知识库 ID</label>
        <input
          type="text"
          value={data.dataset_id || ''}
          onChange={(e) => onChange('dataset_id', e.target.value)}
          placeholder="输入知识库 ID"
        />
      </div>

      <div className="form-group">
        <label>检索数量 (Top K)</label>
        <input
          type="number"
          min="1"
          max="20"
          value={data.top_k ?? 5}
          onChange={(e) => onChange('top_k', parseInt(e.target.value))}
        />
      </div>
    </div>
  );
}
