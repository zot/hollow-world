# Local P2P Testing Servers

This directory contains local servers for testing P2P connectivity on localhost.

## Available Servers

### 1. LibP2P Circuit Relay Server (Recommended)

**Purpose**: Enables P2P connections between localhost peers by acting as a relay.

**Start Server**:
```bash
node test/local-relay-server.js
```

**What it does**:
- Listens on `ws://127.0.0.1:9090/ws`
- Allows peers to discover and relay messages through it
- Bypasses localhost WebRTC limitations

**Use in application**:
1. Start the relay server
2. Note the relay multiaddr printed (e.g., `/ip4/127.0.0.1/tcp/9090/ws/p2p/12D3Koo...`)
3. Configure HollowWorld to use this relay instead of `relay.libp2p.io`

### 2. TURN Server (Alternative)

**Purpose**: Provides STUN/TURN functionality for WebRTC connections.

**Install dependencies**:
```bash
npm install --save-dev node-turn
```

**Start Server**:
```bash
node test/local-turn-server.js
```

**What it does**:
- Provides STUN discovery on port 3478
- Relays WebRTC traffic when direct connection fails
- Uses credentials: `testuser` / `testpass`

**Use in application**:
1. Start the TURN server
2. Add to STUN servers in `validated-public-servers.json`:
   ```json
   {
     "url": "turn:127.0.0.1:3478",
     "responseTime": 1
   }
   ```

## Testing P2P Connectivity

### Setup

1. **Start a local server** (choose one):
   ```bash
   # Option A: LibP2P Relay (recommended)
   node test/local-relay-server.js

   # Option B: TURN Server
   npm install --save-dev node-turn
   node test/local-turn-server.js
   ```

2. **Run the app**:
   ```bash
   npm run dev
   ```

3. **Open two browser tabs**:
   - Tab A: Navigate to `/settings`, use Default profile
   - Tab B: Navigate to `/settings`, switch to TestProfile

### Test Connectivity

Using the browser console in Tab A:
```javascript
// Get Tab A peer ID
const peerA = window.__HOLLOW_WORLD_TEST__.hollowPeer.getPeerId();
console.log('Peer A:', peerA);

// In Tab B console, get peer B ID
const peerB = window.__HOLLOW_WORLD_TEST__.hollowPeer.getPeerId();
console.log('Peer B:', peerB);

// Back in Tab A, send ping to Peer B
await window.__HOLLOW_WORLD_TEST__.hollowPeer.sendMessage(peerB, {
  method: 'ping',
  timestamp: Date.now(),
  messageId: 'test-1'
});
```

## Troubleshooting

### Relay Server Issues

**"Cannot find module '@libp2p/circuit-relay-v2'"**
- The relay uses ES modules, ensure package.json has `"type": "module"` or rename to `.mjs`

**"Address already in use"**
- Change PORT in the server file
- Or kill the process using the port: `lsof -ti:9090 | xargs kill`

### TURN Server Issues

**"Cannot find module 'node-turn'"**
- Install: `npm install --save-dev node-turn`

**TURN not working**
- Check firewall isn't blocking port 3478
- Verify credentials are correct in client config

### Connection Still Fails

**Both tabs on localhost**
- Localhost WebRTC has browser security restrictions
- Relay should work, but TURN might not
- Try .local addresses if on same network

**Relay not being used**
- Check console for "Trying relay address" logs
- Verify relay server is running and accessible
- Ensure relay multiaddr is correctly configured

## Architecture Notes

### Why Circuit Relay?

LibP2P circuit relay is ideal for this use case because:
- Works with existing LibP2P infrastructure
- Bypasses localhost WebRTC limitations
- Enables testing without network setup

### Why TURN?

TURN server provides:
- Industry-standard NAT traversal
- WebRTC-specific relaying
- Better for production-like testing

### Which to use?

- **Development/Testing**: Circuit Relay (simpler, no credentials needed)
- **Production-like**: TURN Server (more realistic network conditions)
- **Both**: Use together for comprehensive testing
