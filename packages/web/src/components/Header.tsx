import { memo } from 'react';

interface HeaderProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExportYaml: () => void;
  hasDsl: boolean;
}

const Header = memo(function Header({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExportYaml,
  hasDsl,
}: HeaderProps) {
  return (
    <header className="header">
      <h1>
        <span>Autodify</span> 工作流生成器
      </h1>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div className="undo-redo-group">
          <button
            className="btn btn-icon"
            onClick={onUndo}
            disabled={!canUndo}
            title="撤销 (⌘Z)"
          >
            ↩️
          </button>
          <button
            className="btn btn-icon"
            onClick={onRedo}
            disabled={!canRedo}
            title="重做 (⌘⇧Z)"
          >
            ↪️
          </button>
        </div>
        <button className="btn btn-secondary" disabled={!hasDsl} onClick={onExportYaml}>
          📤 导出 YAML
        </button>
      </div>
    </header>
  );
});

export default Header;
