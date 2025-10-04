# Dependency Management

## NPM Package Overrides

The project uses npm's `overrides` field in package.json to force specific versions of critical dependencies.

### Current Overrides

- **`@multiformats/multiaddr@^13.0.1`**
  - Required for LibP2P v3.x compatibility
  - Fixes `ma.stringTuples is not a function` error in relay servers
  - Resolves version conflicts with helia's older dependencies

- **`libp2p@^3.0.6`**
  - Main peer-to-peer networking library
  - Ensures all LibP2P modules use compatible versions

### Why Overrides Are Needed

Helia (IPFS implementation) depends on older LibP2P versions (v2.x) that use incompatible multiaddr versions. The overrides force all packages to use the newer, compatible versions required by our P2P networking implementation.

### Testing the Configuration

To verify the dependency resolution is working:

```bash
npm list @multiformats/multiaddr
```

All instances should show version 13.x. Version conflicts appear as warnings during `npm install`.

### Relay Server Compatibility

The local relay servers (test/local-relay-server.js and test/local-turn-server.js) require these overrides to start successfully. Without them, you'll encounter:

```
❌ Failed to start servers: TypeError: ma.stringTuples is not a function
```

This indicates multiaddr v12 is being used instead of v13.
