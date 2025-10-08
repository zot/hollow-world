import { defineConfig } from 'vite';
import fs from 'fs';

export default defineConfig({
  server: {
    port: 3001,
    host: true,
    https: {
      key: fs.readFileSync('key.pem'),
      cert: fs.readFileSync('cert.pem'),
    },
  },
  build: {
    target: 'esnext',
  },
});
