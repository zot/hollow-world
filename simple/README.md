# Simple P2P POC

A minimal peer-to-peer web application using [Helia](https://github.com/ipfs/helia) (IPFS implementation in JavaScript).

## Features

- ✅ Connects to the IPFS network via Helia
- ✅ Uses Helia's built-in libp2p instance (no separate libp2p initialization)
- ✅ Displays real-time peer connection count
- ✅ Shows your peer ID
- ✅ Updates automatically as peers connect/disconnect

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3001`

## Usage

1. Open the app in your browser
2. Wait for Helia to initialize (a few seconds)
3. Your Peer ID will be displayed
4. The peer count will update as you connect to other peers on the IPFS network

## Testing P2P Connectivity

To test peer-to-peer connections:

1. Open the app in multiple browser tabs or windows
2. Each instance will get its own Peer ID
3. They should discover each other through the IPFS DHT and bootstrap nodes
4. Watch the peer count increase as connections are established

## How It Works

- **Helia**: Creates an IPFS node in the browser
- **libp2p**: Helia automatically creates a libp2p instance for peer-to-peer networking
- **Event Listeners**: The app listens for `peer:connect` and `peer:disconnect` events
- **Real-time Updates**: Peer count updates immediately when connections change
