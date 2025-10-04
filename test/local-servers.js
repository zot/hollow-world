#!/usr/bin/env node
/**
 * Combined Local Test Servers for P2P Testing
 *
 * Runs both LibP2P Circuit Relay and TURN servers in a single process.
 *
 * Usage:
 *   node test/local-servers.js
 *
 * Servers started:
 *   - LibP2P Circuit Relay: localhost:9090/ws
 *   - TURN/STUN: localhost:3478
 *
 * Press Ctrl+C to stop both servers.
 */

import { startRelayServer } from './local-relay-server.js';
import { startTurnServer } from './local-turn-server.js';

async function main() {
  console.log('🚀 Starting Local P2P Test Servers\n');
  console.log('═'.repeat(50) + '\n');

  let relayNode = null;
  let turnServer = null;
  let shuttingDown = false;

  try {
    // Start TURN server
    turnServer = startTurnServer();

    // Start LibP2P relay server
    relayNode = await startRelayServer();

    console.log('═'.repeat(50));
    console.log('✅ All servers running');
    console.log('Press Ctrl+C to stop\n');

  } catch (err) {
    console.error('❌ Failed to start servers:', err);
    process.exit(1);
  }

  // Graceful shutdown handler
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log('\n🛑 Shutting down servers...\n');

    try {
      if (relayNode) {
        console.log('  Stopping relay server...');
        await relayNode.stop();
        console.log('  ✅ Relay server stopped');
      }

      if (turnServer) {
        console.log('  Stopping TURN server...');
        turnServer.stop();
        console.log('  ✅ TURN server stopped');
      }

      console.log('\n✅ All servers stopped');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during shutdown:', err);
      process.exit(1);
    }
  };

  // Handle shutdown signals
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Handle uncaught errors - but don't shut down for known non-critical errors
  process.on('uncaughtException', (err) => {
    // Ignore known non-critical libp2p address manager warnings
    if (err.message && err.message.includes('ma.stringTuples is not a function')) {
      console.warn('⚠️ Non-critical libp2p warning (ignored):', err.message);
      return;
    }
    console.error('❌ Uncaught Exception:', err);
    shutdown();
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown();
  });
}

main();
