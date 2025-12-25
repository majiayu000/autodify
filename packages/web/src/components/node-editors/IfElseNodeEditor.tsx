import { Condition } from '../../types/nodeData';

interface IfElseNodeEditorProps {
  conditions: Condition[];
  onChange: (conds: Condition[]) => void;
}

export default function IfElseNodeEditor({ conditions, onChange }: IfElseNodeEditorProps) {
  const addCondition = () => {
    onChange([...conditions, { variable: '', operator: 'eq', value: '' }]);
  };

  const updateCondition = (index: number, field: keyof Condition, value: string) => {
    const newConds = [...conditions];
    newConds[index] = { ...newConds[index], [field]: value };
    onChange(newConds);
  };

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  return (
    <div className="editor-section">
      <div className="section-header">
        <h4>条件分支</h4>
        <button className="btn-small" onClick={addCondition}>
          + 添加
        </button>
      </div>
      {conditions.length === 0 ? (
        <p className="empty-hint">暂无条件，点击添加</p>
      ) : (
        <div className="condition-list">
          {conditions.map((c, index) => (
            <div key={index} className="condition-item">
              <span className="condition-label">IF</span>
              <input
                type="text"
                value={c.variable}
                onChange={(e) => updateCondition(index, 'variable', e.target.value)}
                placeholder="变量名"
                className="input-small"
              />
              <select
                value={c.operator}
                onChange={(e) =>
                  updateCondition(index, 'operator', e.target.value as Condition['operator'])
                }
                className="select-small"
              >
                <option value="eq">等于</option>
                <option value="ne">不等于</option>
                <option value="gt">大于</option>
                <option value="lt">小于</option>
                <option value="contains">包含</option>
                <option value="not_contains">不包含</option>
              </select>
              <input
                type="text"
                value={c.value}
                onChange={(e) => updateCondition(index, 'value', e.target.value)}
                placeholder="值"
                className="input-small"
              />
              <button className="btn-icon" onClick={() => removeCondition(index)}>
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
