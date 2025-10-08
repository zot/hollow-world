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
          if (req.url && !req.url.includes('.') && !req.url.startsWith('/@') && !req.url.startsWith('/__')) {
            req.url = '/index.html';
          }
          next();
        });
      }
    },
    {
      name: 'p2p-test-servers',
      async configureServer(server) {
        // Import server modules dynamically
        const { startRelayServer } = await import('./test/local-relay-server.js');
        const { startTurnServer } = await import('./test/local-turn-server.js');

        // Get local network IP address (not localhost)
        function getLocalIP() {
          const interfaces = os.networkInterfaces();
          for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
              // Skip internal (loopback) and non-IPv4 addresses
              if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
              }
            }
          }
          return '127.0.0.1'; // Fallback to localhost
        }

        let relayNode = null;
        let relayPeerId = null;
        let networkAddress = null;
        let turnServer = null;
        let wss = null;

        // Start TURN server
        console.log('\n🚀 Starting P2P Test Infrastructure\n');
        console.log('═'.repeat(50) + '\n');

        turnServer = startTurnServer();

        // Start LibP2P relay server
        const relayResult = await startRelayServer();
        relayNode = relayResult.node;
        relayPeerId = relayResult.peerIdStr;

        // Get network address
        networkAddress = getLocalIP();

        // Create HTTPS server for secure WebSocket (WSS) signaling on port 9091
        const httpsSignalingServer = https.createServer({
          key: readFileSync('key.pem'),
          cert: readFileSync('cert.pem'),
        });
        httpsSignalingServer.listen(9091);

        wss = new WebSocketServer({ server: httpsSignalingServer });
        const clients = new Map(); // peerId -> WebSocket

        wss.on('connection', (ws) => {
          let peerId = null;

          ws.on('message', (data) => {
            try {
              const message = JSON.parse(data.toString());

              if (message.type === 'register') {
                // Register peer
                peerId = message.peerId;
                clients.set(peerId, ws);
                console.log(`📡 Signaling: Registered peer ${peerId}`);
                ws.send(JSON.stringify({ type: 'registered', peerId }));
              } else if (message.type === 'signal') {
                // Forward signaling message to target peer
                const targetWs = clients.get(message.targetPeerId);
                if (targetWs && targetWs.readyState === 1) {
                  targetWs.send(JSON.stringify({
                    type: 'signal',
                    fromPeerId: message.fromPeerId,
                    signal: message.signal
                  }));
                  console.log(`📡 Signaling: Forwarded ${message.signal.type} from ${message.fromPeerId} to ${message.targetPeerId}`);
                }
              }
            } catch (err) {
              console.error('❌ Signaling error:', err);
            }
          });

          ws.on('close', () => {
            if (peerId) {
              clients.delete(peerId);
              console.log(`📡 Signaling: Unregistered peer ${peerId}`);
            }
          });
        });

        console.log('✅ WebRTC Signaling Server: wss://localhost:9091');
        console.log('═'.repeat(50) + '\n');

        // Expose P2P configuration to browser via HTTP endpoint
        server.middlewares.use((req, res, next) => {
          if (req.url === '/__p2p_config') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              relayPeerId,
              networkAddress
            }));
            return;
          }
          next();
        });

        // Cleanup on server close
        server.httpServer?.on('close', async () => {
          console.log('\n🛑 Shutting down P2P test servers...\n');

          if (wss) {
            wss.close();
            console.log('  ✅ Signaling server stopped');
          }

          if (relayNode) {
            await relayNode.stop();
            console.log('  ✅ Relay server stopped');
          }

          if (turnServer) {
            turnServer.stop();
            console.log('  ✅ TURN server stopped');
          }
        });
      }
    }
  ]
});