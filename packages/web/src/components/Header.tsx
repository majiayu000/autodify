import { memo } from 'react';
import { motion } from 'framer-motion';

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
    <header className="header" role="banner">
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <span>Autodify</span>
        <span className="sr-only">-</span>
        工作流生成器
      </motion.h1>

      <nav className="header-actions" aria-label="主要操作">
        <div className="undo-redo-group" role="group" aria-label="撤销重做">
          <motion.button
            className="btn btn-icon"
            onClick={onUndo}
            disabled={!canUndo}
            title="撤销 (⌘Z)"
            aria-label="撤销"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
          </motion.button>
          <motion.button
            className="btn btn-icon"
            onClick={onRedo}
            disabled={!canRedo}
            title="重做 (⌘⇧Z)"
            aria-label="重做"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 7v6h-6" />
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
            </svg>
          </motion.button>
        </div>

        <motion.button
          className="btn btn-secondary"
          disabled={!hasDsl}
          onClick={onExportYaml}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17,8 12,3 7,8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          导出 YAML
        </motion.button>
      </nav>
    </header>
  );
});

export default Header;
