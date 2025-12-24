import { useState, useEffect } from 'react';

// 节点数据类型定义
export interface Variable {
  variable: string;
  label: string;
  type: 'text-input' | 'paragraph' | 'select' | 'number';
  required?: boolean;
  options?: string[];
  default?: string;
}

export interface Condition {
  variable: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'not_contains';
  value: string;
}

export interface NodeData {
  type: string;
  title: string;
  description?: string;
  // Start 节点
  variables?: Variable[];
  // LLM 节点
  model?: string;
  prompt_template?: string;
  temperature?: number;
  max_tokens?: number;
  // If-Else 节点
  conditions?: Condition[];
  // HTTP 节点
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  // Knowledge Retrieval 节点
  dataset_id?: string;
  top_k?: number;
  // Code 节点
  code?: string;
  language?: 'python' | 'javascript';
  // Template Transform 节点
  template?: string;
}

interface NodeEditorProps {
  node: {
    id: string;
    data: NodeData;
  };
  onUpdate: (nodeId: string, data: Partial<NodeData>) => void;
  onClose: () => void;
}

// 可用的 LLM 模型列表
const LLM_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'deepseek-chat', label: 'DeepSeek Chat' },
  { value: 'glm-4', label: 'GLM-4' },
];

// 节点类型图标
const nodeIcons: Record<string, string> = {
  start: '▶️',
  end: '🏁',
  llm: '🤖',
  'knowledge-retrieval': '📚',
  'question-classifier': '🏷️',
  'if-else': '🔀',
  code: '💻',
  'http-request': '🌐',
  'variable-aggregator': '📦',
  'template-transform': '📝',
  answer: '💬',
};

export default function NodeEditor({ node, onUpdate, onClose }: NodeEditorProps) {
  const [localData, setLocalData] = useState<NodeData>(node.data);

  // 当 node 变化时重置本地数据
  useEffect(() => {
    setLocalData(node.data);
  }, [node.id, node.data]);

  const handleChange = (field: keyof NodeData, value: unknown) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    onUpdate(node.id, { [field]: value });
  };

  const icon = nodeIcons[node.data.type] || '⚙️';

  return (
    <div className="node-editor">
      {/* Header */}
      <div className="node-editor-header">
        <div className="node-editor-title">
          <span className="node-editor-icon">{icon}</span>
          <div>
            <input
              type="text"
              value={localData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="node-title-input"
            />
            <div className="node-type-badge">{node.data.type}</div>
          </div>
        </div>
        <button className="node-editor-close" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="node-editor-content">
        {/* 通用: 描述 */}
        <div className="form-group">
          <label>描述</label>
          <textarea
            value={localData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="节点描述（可选）"
            rows={2}
          />
        </div>

        {/* Start 节点: 变量配置 */}
        {node.data.type === 'start' && (
          <StartNodeEditor
            variables={localData.variables || []}
            onChange={(vars) => handleChange('variables', vars)}
          />
        )}

        {/* LLM 节点: 模型和 Prompt */}
        {(node.data.type === 'llm' || node.data.type === 'answer') && (
          <LLMNodeEditor
            data={localData}
            onChange={handleChange}
          />
        )}

        {/* Question Classifier 节点 */}
        {node.data.type === 'question-classifier' && (
          <ClassifierNodeEditor
            data={localData}
            onChange={handleChange}
          />
        )}

        {/* If-Else 节点 */}
        {node.data.type === 'if-else' && (
          <IfElseNodeEditor
            conditions={localData.conditions || []}
            onChange={(conds) => handleChange('conditions', conds)}
          />
        )}

        {/* HTTP 节点 */}
        {node.data.type === 'http-request' && (
          <HTTPNodeEditor
            data={localData}
            onChange={handleChange}
          />
        )}

        {/* Knowledge Retrieval 节点 */}
        {node.data.type === 'knowledge-retrieval' && (
          <KnowledgeNodeEditor
            data={localData}
            onChange={handleChange}
          />
        )}

        {/* Code 节点 */}
        {node.data.type === 'code' && (
          <CodeNodeEditor
            data={localData}
            onChange={handleChange}
          />
        )}

        {/* Template Transform 节点 */}
        {node.data.type === 'template-transform' && (
          <TemplateNodeEditor
            data={localData}
            onChange={handleChange}
          />
        )}

        {/* End 节点: 无额外配置 */}
        {node.data.type === 'end' && (
          <div className="empty-config">
            <p>结束节点无需额外配置</p>
          </div>
        )}

        {/* Variable Aggregator 节点 */}
        {node.data.type === 'variable-aggregator' && (
          <div className="empty-config">
            <p>变量聚合节点会自动收集所有输入分支的变量</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="node-editor-footer">
        <span className="node-id">ID: {node.id}</span>
      </div>
    </div>
  );
}

// Start 节点编辑器
function StartNodeEditor({
  variables,
  onChange,
}: {
  variables: Variable[];
  onChange: (vars: Variable[]) => void;
}) {
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
        <button className="btn-small" onClick={addVariable}>+ 添加</button>
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
                <button className="btn-icon" onClick={() => removeVariable(index)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// LLM 节点编辑器
function LLMNodeEditor({
  data,
  onChange,
}: {
  data: NodeData;
  onChange: (field: keyof NodeData, value: unknown) => void;
}) {
  return (
    <div className="editor-section">
      <h4>LLM 配置</h4>

      <div className="form-group">
        <label>模型</label>
        <select
          value={data.model || 'gpt-4o'}
          onChange={(e) => onChange('model', e.target.value)}
        >
          {LLM_MODELS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
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

// Question Classifier 节点编辑器
function ClassifierNodeEditor({
  data,
  onChange,
}: {
  data: NodeData;
  onChange: (field: keyof NodeData, value: unknown) => void;
}) {
  return (
    <div className="editor-section">
      <h4>分类器配置</h4>

      <div className="form-group">
        <label>模型</label>
        <select
          value={data.model || 'gpt-4o'}
          onChange={(e) => onChange('model', e.target.value)}
        >
          {LLM_MODELS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
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

// If-Else 节点编辑器
function IfElseNodeEditor({
  conditions,
  onChange,
}: {
  conditions: Condition[];
  onChange: (conds: Condition[]) => void;
}) {
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
        <button className="btn-small" onClick={addCondition}>+ 添加</button>
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
                onChange={(e) => updateCondition(index, 'operator', e.target.value as Condition['operator'])}
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
              <button className="btn-icon" onClick={() => removeCondition(index)}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// HTTP 节点编辑器
function HTTPNodeEditor({
  data,
  onChange,
}: {
  data: NodeData;
  onChange: (field: keyof NodeData, value: unknown) => void;
}) {
  return (
    <div className="editor-section">
      <h4>HTTP 请求配置</h4>

      <div className="form-row">
        <div className="form-group" style={{ width: '100px' }}>
          <label>方法</label>
          <select
            value={data.method || 'GET'}
            onChange={(e) => onChange('method', e.target.value)}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
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

// Knowledge Retrieval 节点编辑器
function KnowledgeNodeEditor({
  data,
  onChange,
}: {
  data: NodeData;
  onChange: (field: keyof NodeData, value: unknown) => void;
}) {
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

// Code 节点编辑器
function CodeNodeEditor({
  data,
  onChange,
}: {
  data: NodeData;
  onChange: (field: keyof NodeData, value: unknown) => void;
}) {
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

// Template Transform 节点编辑器
function TemplateNodeEditor({
  data,
  onChange,
}: {
  data: NodeData;
  onChange: (field: keyof NodeData, value: unknown) => void;
}) {
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
