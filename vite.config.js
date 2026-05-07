import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 10000,
    rollupOptions: {
      external: ['playcanvas', 'gsplat'],
    },
  },
  optimizeDeps: {
    include: ['three'],
    exclude: ['playcanvas', 'gsplat'],
  },
});
