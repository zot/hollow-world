# simple p2p POC

## peer-to-peer web app in the `simple` directory
- do not look into any other `src` or `spec` files
- connect to helia
  - examples:
    - https://medium.com/coinmonks/building-a-debate-app-part-15-71349e9b1083
    - https://github.com/ipfs-examples/helia-101/blob/main/401-providing.js
  - the app should not create a separate libp2p instance
    - use the one createHelia makes
    - send any libp2p configuration opts into createHelia with the `libp2p` property
- display peer connections on the page
  - update the number as connections change

## Implementation Details

### Default Helia Configuration (RECOMMENDED)
- **Use `createHelia()` with no parameters** - Default configuration works best in browsers
- **Tested**: Connects to 80-100+ peers on global IPFS network via circuit relay
- **Simple and reliable**: No custom transport configuration needed

### Browser WebSocket Certificate Handling
**CRITICAL**: Browser WebSocket behavior differs from Node.js
- **Browser**: Certificate validation handled automatically by browser
  - When user accepts self-signed certificate for HTTPS page, browser automatically trusts WSS connections to same domain
  - DO NOT use `rejectUnauthorized` option in browser context
  - Custom WebSocket options cause "Transport must have a valid tag" errors
- **Node.js**: Server-side code needs `rejectUnauthorized: false` for self-signed certificates
- **Local Development**:
  - LibP2P relay on WSS port 9090 with self-signed certificates
  - WebRTC signaling on WSS port 9091
  - Certificate files: `key.pem`, `cert.pem`

### Manual Peer Dialing
The POC exposes a `dialPeer(multiaddrString)` function for testing:
```javascript
// Example usage in browser console
await window.dialPeer('/ip4/192.168.1.100/tcp/9090/ws/p2p/12D3KooW...')
```

### Removed Dependencies
Previous implementation incorrectly imported:
- `libp2pDefaults` - Not needed, use Helia defaults
- `webSockets` - Browser handles WebSocket transport automatically
- `circuitRelayTransport` - Included in Helia defaults
- `webRTC`, `webRTCDirect` - Included in Helia defaults
