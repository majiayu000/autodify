import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
  },
  optimizeDeps: {
    include: ['@autodify/core'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心库
          'react-vendor': ['react', 'react-dom'],
          // React Flow 及其依赖
          'react-flow': ['@xyflow/react', 'dagre'],
          // Zustand 状态管理
          'zustand': ['zustand'],
          // YAML 处理
          'yaml': ['js-yaml'],
        },
      },
    },
    // 优化 chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
  },
});
