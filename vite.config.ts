import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});