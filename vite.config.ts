import { defineConfig } from 'vite';
import { copyFileSync } from 'fs';
import { resolve } from 'path';

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
  publicDir: 'public',
  plugins: [
    {
      name: 'copy-version-file',
      buildEnd() {
        // Copy VERSION file to dist during build
        copyFileSync('VERSION', 'dist/VERSION');
      }
    }
  ]
});