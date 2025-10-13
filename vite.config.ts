import { defineConfig } from 'vite';
import { copyFileSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { WebSocketServer } from 'ws';
import os from 'os';
import https from 'https';
import { goP2PServerDetector } from './vite-plugins/go-p2p-server-detector';

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
    goP2PServerDetector({ autoStart: false }),
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
    },
    // DEPRECATED: Old Node.js P2P test servers
    // Now using Go server at test/go-p2p-servers/
    // Start Go server separately with: cd test/go-p2p-servers && ./start.sh
    // {
    //   name: 'p2p-test-servers',
    //   async configureServer(server) {
    //     // ... old Node.js server code disabled ...
    //   }
    // }
  ]
});