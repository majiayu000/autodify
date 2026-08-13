import type { Variable } from '../../types/nodeData';

interface StartNodeEditorProps {
  variables: Variable[];
  onChange: (vars: Variable[]) => void;
}

export default function StartNodeEditor({ variables, onChange }: StartNodeEditorProps) {
  const addVariable = () => {
    onChange([
      ...variables,
      { variable: `var_${Date.now()}`, label: '新变量', type: 'text-input', required: false },
    ]);
  };

  const updateVariable = (index: number, field: keyof Variable, value: unknown) => {
    const newVars = [...variables];
    newVars[index] = { ...newVars[index], [field]: value };
    onChange(newVars);
  };

  const removeVariable = (index: number) => {
    onChange(variables.filter((_, i) => i !== index));
  };

  return (
    <div className="editor-section">
      <div className="section-header">
        <h4>输入变量</h4>
        <button className="btn-small" onClick={addVariable}>
          + 添加
        </button>
      </div>
      {variables.length === 0 ? (
        <p className="empty-hint">暂无变量，点击添加</p>
      ) : (
        <div className="variable-list">
          {variables.map((v, index) => (
            <div key={index} className="variable-item">
              <div className="variable-row">
                <input
                  type="text"
                  value={v.variable}
                  onChange={(e) => updateVariable(index, 'variable', e.target.value)}
                  placeholder="变量名"
                  className="input-small"
                />
                <input
                  type="text"
                  value={v.label}
                  onChange={(e) => updateVariable(index, 'label', e.target.value)}
                  placeholder="显示标签"
                  className="input-small"
                />
                <select
                  value={v.type}
                  onChange={(e) => updateVariable(index, 'type', e.target.value)}
                  className="select-small"
                >
                  <option value="text-input">文本</option>
                  <option value="paragraph">段落</option>
                  <option value="number">数字</option>
                  <option value="select">下拉选择</option>
                </select>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={v.required || false}
                    onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                  />
                  必填
                </label>
                <button className="btn-icon" onClick={() => removeVariable(index)}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
