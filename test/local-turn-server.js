/**
 * Local TURN Server for P2P Testing
 *
 * This server provides STUN/TURN functionality for local WebRTC testing.
 * TURN (Traversal Using Relays around NAT) includes STUN functionality
 * and can relay traffic when direct connections fail.
 *
 * The server will start on:
 *   - UDP/TCP port 3478 (STUN/TURN)
 *   - Port 3479 (Admin API)
 */

import turn from 'node-turn';
import os from 'os';

const PORT = 3478;
const ADMIN_PORT = 3479;

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

export function startTurnServer() {
  console.log('🔄 Starting Local TURN Server...\n');

  const localIPs = getLocalIPs();

  // Create TURN server with authentication
  const server = new turn({
    // Enable both STUN and TURN
    authMech: 'long-term',
    credentials: {
      username: 'testuser',
      password: 'testpass'
    },

    // Bind to all interfaces for LAN access
    listeningIps: ['0.0.0.0'],
    listeningPort: PORT,

    // Relay configuration - use all available LAN IPs
    relayIps: localIPs,
    relayPortRangeStart: 49152,
    relayPortRangeEnd: 65535,

    // Logging
    debugLevel: 'INFO',

    // Max allocations
    max_allocate_lifetime: 3600,
    default_allocate_lifetime: 600
  });

  server.start();

  console.log('✅ TURN Server Started\n');
  console.log(`Available interfaces:`);
  localIPs.forEach(ip => console.log(`  ${ip}:${PORT}`));
  console.log(`Admin API: localhost:${ADMIN_PORT}`);
  console.log('');
  console.log('Server URLs (use any):');
  localIPs.forEach(ip => {
    console.log(`  STUN: stun:${ip}:${PORT}`);
    console.log(`  TURN: turn:${ip}:${PORT}`);
  });
  console.log('');
  console.log('Credentials:');
  console.log('  Username: testuser');
  console.log('  Password: testpass\n');

  // Error handling
  server.on('error', (err) => {
    console.error('❌ TURN Server Error:', err);
  });

  return server;
}
