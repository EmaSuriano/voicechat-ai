import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  esbuild: {
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
  },
  build: {
    rollupOptions: {
      external: ['ollama', '@huggingface/transformers'],
    },
  },
  optimizeDeps: {
    exclude: ['ollama', '@huggingface/transformers'],
  },
});
