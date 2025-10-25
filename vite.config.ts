import { defineConfig } from 'vite';
import { copyFileSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { WebSocketServer } from 'ws';
import os from 'os';
import https from 'https';

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
    https: {
      key: readFileSync('key.pem'),
      cert: readFileSync('cert.pem'),
    },
    cors: {
      origin: [
        'https://localhost:3000',
        'http://localhost:3000',
        'https://zotimer.itch.io',
        /^https?:\/\/localhost(:\d+)?$/, // localhost with any port
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/, // 127.0.0.1 with any port
        /^https?:\/\/[^/]+$/, // current host (any origin)
      ],
      credentials: true,
    },
  },
  preview: {
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
    },
    {
      name: 'spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Serve index.html for all non-file requests (SPA routing)
          // Exclude: files with extensions, Vite internals, and API endpoints
          if (req.url && !req.url.includes('.') && !req.url.startsWith('/@') && !req.url.startsWith('/__') && !req.url.startsWith('/_api')) {
            req.url = '/index.html';
          }
          next();
        });
      }
    }
  ]
});
