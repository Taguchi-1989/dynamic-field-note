import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './', // 相対パスでアセット解決（Electron対応）
  root: '.', // プロジェクトルート
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'app/src'),
      '@main': path.resolve(__dirname, 'app/src/main'),
      '@renderer': path.resolve(__dirname, 'app/src/renderer'),
      '@shared': path.resolve(__dirname, 'app/src/shared'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          markdown: ['marked', 'react-markdown'],
          utils: ['axios', 'dexie', 'react-dropzone'],
          modals: [
            './app/src/renderer/components/SettingsModal',
            './app/src/renderer/components/AboutModal', 
            './app/src/renderer/components/DictionaryModal',
            './app/src/renderer/components/ContactModal'
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    target: 'esnext',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios', 'marked', 'dexie'],
  },
  server: {
    port: 5173,
    strictPort: true,
    host: 'localhost'
  },
  preview: {
    port: 4173,
    strictPort: true
  }
});