/**
 * Local LibP2P Circuit Relay Server for P2P Testing
 *
 * This server acts as a circuit relay for LibP2P peers that cannot
 * connect directly (e.g., localhost WebRTC limitations).
 *
 * The relay will:
 *   - Listen on WebSocket (localhost:9090/ws)
 *   - Allow peers to discover and relay through it
 *   - Enable testing P2P connectivity on localhost
 */

import { createLibp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { webTransport } from '@libp2p/webtransport';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { circuitRelayServer } from '@libp2p/circuit-relay-v2';
import { identify } from '@libp2p/identify';
import os from 'os';
import https from 'https';
import { readFileSync } from 'fs';

const PORT = 9090;

// Get all local LAN IP addresses
function getLocalIPs() {
  const addresses = [];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses.length > 0 ? addresses : ['127.0.0.1']; // Fallback to localhost
}

export async function startRelayServer() {
  console.log('🔄 Starting Local LibP2P Circuit Relay Server...\n');

  const localIPs = getLocalIPs();

  // Create HTTPS server for secure WebSocket (WSS)
  const httpsServer = https.createServer({
    key: readFileSync('key.pem'),
    cert: readFileSync('cert.pem'),
  });
  // Don't call listen() here - let libp2p handle it

  // Let libp2p generate a fresh peer ID on each startup
  const node = await createLibp2p({
    addresses: {
      listen: [
        `/ip4/0.0.0.0/tcp/${PORT}/wss`  // WebSocket Secure only (WebTransport not supported in Node.js server)
      ]
    },
    transports: [
      webSockets({
        server: httpsServer,
        websocket: {
          rejectUnauthorized: false  // Accept self-signed certificates
        }
      })
    ],
    connectionEncryption: [noise()],
    streamMuxers: [yamux()],
    services: {
      identify: identify(),
      relay: circuitRelayServer({
        reservations: {
          maxReservations: 100,
          defaultDurationLimit: 60 * 60 * 1000 // 1 hour
        }
      })
    }
  });

  await node.start();

  const peerIdStr = node.peerId.toString();

  console.log('✅ Relay Server Started\n');
  console.log('Peer ID:', peerIdStr);
  console.log('\nAvailable interfaces:');
  localIPs.forEach(ip => console.log(`  /ip4/${ip}/tcp/${PORT}/wss`));
  console.log('\nRelay Addresses (use any in client):');
  localIPs.forEach(ip => console.log(`  /ip4/${ip}/tcp/${PORT}/wss/p2p/${peerIdStr}`));
  console.log('');

  // Log connections
  node.addEventListener('peer:connect', (evt) => {
    console.log(`📥 Relay: Peer connected: ${evt.detail.toString()}`);
  });

  node.addEventListener('peer:disconnect', (evt) => {
    console.log(`📤 Relay: Peer disconnected: ${evt.detail.toString()}`);
  });

  return { node, peerIdStr };
}
