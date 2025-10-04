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
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { circuitRelayServer } from '@libp2p/circuit-relay-v2';
import { identify } from '@libp2p/identify';
import { peerIdFromPrivateKey } from '@libp2p/peer-id';
import { privateKeyFromProtobuf } from '@libp2p/crypto/keys';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import os from 'os';

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

// Fixed private key for consistent peer ID: 12D3KooWDe4PMnvGqvk8vmCAC99NuybEUcPzHpv8WRcHM4txBBqm
const FIXED_PRIVATE_KEY = 'CAESQLw4qhR+cKKmZ3xKqKqh0nY8K8kKYpFQWQhMcA6Wx2Q7OMrVN0gPxaLlqKCRxqzJJQ9PKMmGiThCNxIHMxN+7BQ=';

export async function startRelayServer() {
  console.log('🔄 Starting Local LibP2P Circuit Relay Server...\n');

  const localIPs = getLocalIPs();

  // Create peer ID from fixed private key for consistency (same approach as p2p.ts)
  const privateKeyBytes = uint8ArrayFromString(FIXED_PRIVATE_KEY, 'base64');
  const privateKey = await privateKeyFromProtobuf(privateKeyBytes);
  const peerId = await peerIdFromPrivateKey(privateKey);

  const node = await createLibp2p({
    peerId,
    addresses: {
      listen: [
        `/ip4/0.0.0.0/tcp/${PORT}/ws`  // Listen on all interfaces for LAN access
      ]
    },
    transports: [
      webSockets()
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

  const peerIdStr = peerId.toString();

  console.log('✅ Relay Server Started\n');
  console.log('Peer ID:', peerIdStr);
  console.log('\nAvailable interfaces:');
  localIPs.forEach(ip => console.log(`  /ip4/${ip}/tcp/${PORT}/ws`));
  console.log('\nRelay Addresses (use any in client):');
  localIPs.forEach(ip => console.log(`  /ip4/${ip}/tcp/${PORT}/ws/p2p/${peerIdStr}`));
  console.log('');

  // Log connections
  node.addEventListener('peer:connect', (evt) => {
    console.log(`📥 Relay: Peer connected: ${evt.detail.toString()}`);
  });

  node.addEventListener('peer:disconnect', (evt) => {
    console.log(`📤 Relay: Peer disconnected: ${evt.detail.toString()}`);
  });

  return node;
}
