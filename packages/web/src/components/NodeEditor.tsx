import { useState, useEffect } from 'react';
import { NodeData } from '../types/nodeData';
import { NODE_ICONS } from '../constants/nodeConfig';
import StartNodeEditor from './node-editors/StartNodeEditor';
import LLMNodeEditor from './node-editors/LLMNodeEditor';
import ClassifierNodeEditor from './node-editors/ClassifierNodeEditor';
import IfElseNodeEditor from './node-editors/IfElseNodeEditor';
import HTTPNodeEditor from './node-editors/HTTPNodeEditor';
import KnowledgeNodeEditor from './node-editors/KnowledgeNodeEditor';
import CodeNodeEditor from './node-editors/CodeNodeEditor';
import TemplateNodeEditor from './node-editors/TemplateNodeEditor';

interface NodeEditorProps {
  node: {
    id: string;
    data: NodeData;
  };
  onUpdate: (nodeId: string, data: Partial<NodeData>) => void;
  onClose: () => void;
}

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

  const icon = NODE_ICONS[node.data.type] || '⚙️';

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
          <LLMNodeEditor data={localData} onChange={handleChange} />
        )}

        {/* Question Classifier 节点 */}
        {node.data.type === 'question-classifier' && (
          <ClassifierNodeEditor data={localData} onChange={handleChange} />
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
          <HTTPNodeEditor data={localData} onChange={handleChange} />
        )}

        {/* Knowledge Retrieval 节点 */}
        {node.data.type === 'knowledge-retrieval' && (
          <KnowledgeNodeEditor data={localData} onChange={handleChange} />
        )}

        {/* Code 节点 */}
        {node.data.type === 'code' && <CodeNodeEditor data={localData} onChange={handleChange} />}

        {/* Template Transform 节点 */}
        {node.data.type === 'template-transform' && (
          <TemplateNodeEditor data={localData} onChange={handleChange} />
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
