import type { DragEvent } from 'react';
import { memo } from 'react';

// 节点类型定义
interface NodeTypeInfo {
  type: string;
  title: string;
  icon: string;
  description: string;
  category: 'input' | 'ai' | 'data' | 'logic' | 'external';
}

// 可用节点类型
const NODE_TYPES: NodeTypeInfo[] = [
  // 输入/输出
  { type: 'start', title: '开始', icon: '▶️', description: '工作流入口', category: 'input' },
  { type: 'end', title: '结束', icon: '🏁', description: '工作流出口', category: 'input' },
  { type: 'answer', title: '回答', icon: '💬', description: '输出回答内容', category: 'input' },

  // AI 处理
  { type: 'llm', title: 'LLM', icon: '🤖', description: '大语言模型调用', category: 'ai' },
  {
    type: 'question-classifier',
    title: '问题分类',
    icon: '🏷️',
    description: 'LLM 驱动的分类器',
    category: 'ai',
  },

  // 数据
  {
    type: 'knowledge-retrieval',
    title: '知识检索',
    icon: '📚',
    description: '知识库检索',
    category: 'data',
  },
  {
    type: 'variable-aggregator',
    title: '变量聚合',
    icon: '📦',
    description: '合并多个变量',
    category: 'data',
  },

  // 逻辑
  { type: 'if-else', title: '条件分支', icon: '🔀', description: '条件判断', category: 'logic' },
  { type: 'code', title: '代码执行', icon: '💻', description: 'Python/JS 代码', category: 'logic' },

  // 外部
  {
    type: 'http-request',
    title: 'HTTP 请求',
    icon: '🌐',
    description: '外部 API 调用',
    category: 'external',
  },
  {
    type: 'template-transform',
    title: '模板转换',
    icon: '📝',
    description: 'Jinja2 模板',
    category: 'external',
  },
];

// 分类信息
const CATEGORIES = [
  { key: 'input', title: '输入/输出', icon: '📥' },
  { key: 'ai', title: 'AI 处理', icon: '🧠' },
  { key: 'data', title: '数据', icon: '💾' },
  { key: 'logic', title: '逻辑', icon: '⚡' },
  { key: 'external', title: '外部', icon: '🔌' },
];

interface NodePaletteProps {
  disabled?: boolean;
}

const NodePalette = memo(function NodePalette({ disabled }: NodePaletteProps) {
  const handleDragStart = (e: DragEvent<HTMLDivElement>, nodeType: NodeTypeInfo) => {
    if (disabled) return;

    // 设置拖拽数据
    e.dataTransfer.setData(
      'application/autodify-node',
      JSON.stringify({
        type: nodeType.type,
        title: nodeType.title,
      })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <nav className="node-palette" aria-label="节点库">
      <div className="palette-header">
        <h3>🧩 节点库</h3>
        <span className="palette-hint">拖拽到画布添加</span>
      </div>

      <div className="palette-content" role="list" aria-label="可用节点类型">
        {CATEGORIES.map((category) => {
          const nodes = NODE_TYPES.filter((n) => n.category === category.key);
          if (nodes.length === 0) return null;

          return (
            <div
              key={category.key}
              className="palette-category"
              role="group"
              aria-labelledby={`category-${category.key}`}
            >
              <div className="category-title" id={`category-${category.key}`}>
                <span aria-hidden="true">{category.icon}</span>
                <span>{category.title}</span>
              </div>
              <div className="category-nodes" role="list">
                {nodes.map((node) => (
                  <div
                    key={node.type}
                    className={`palette-node ${disabled ? 'disabled' : ''}`}
                    draggable={!disabled}
                    onDragStart={(e) => handleDragStart(e, node)}
                    role="listitem"
                    aria-label={`${node.title}: ${node.description}`}
                    aria-disabled={disabled}
                    tabIndex={disabled ? -1 : 0}
                  >
                    <span className="node-icon" aria-hidden="true">
                      {node.icon}
                    </span>
                    <div className="node-info">
                      <span className="node-title">{node.title}</span>
                      <span className="node-desc">{node.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
});

export default NodePalette;
