import { createHelia } from 'helia';
import { multiaddr } from '@multiformats/multiaddr';

// DOM elements
const statusEl = document.getElementById('status') as HTMLDivElement;
const peerIdEl = document.getElementById('peerId') as HTMLDivElement;
const peerIdContainer = document.getElementById('peerIdContainer') as HTMLDivElement;
const peerCountEl = document.getElementById('peerCount') as HTMLDivElement;

// Update peer count display
function updatePeerCount(count: number): void {
  peerCountEl.textContent = count.toString();
}

// Update status message
function updateStatus(message: string): void {
  statusEl.textContent = message;
  statusEl.classList.remove('loading');
}

// Main initialization
async function init(): Promise<void> {
  try {
    updateStatus('Creating Helia node...');

    // Create Helia instance with default configuration
    // Note: In browser, WebSocket certificate validation is handled by the browser itself
    // The rejectUnauthorized option is Node.js-specific and causes "Transport must have a valid tag" errors
    const helia = await createHelia();

    // Get peer ID
    const peerId = helia.libp2p.peerId.toString();
    peerIdEl.textContent = peerId;
    peerIdContainer.style.display = 'block';

    updateStatus('Connected! Waiting for peers...');

    // Get initial peer count
    const initialPeers = helia.libp2p.getPeers();
    updatePeerCount(initialPeers.length);

    // Listen for peer connection events
    helia.libp2p.addEventListener('peer:connect', () => {
      const peers = helia.libp2p.getPeers();
      updatePeerCount(peers.length);
    });

    // Listen for peer disconnection events
    helia.libp2p.addEventListener('peer:disconnect', () => {
      const peers = helia.libp2p.getPeers();
      updatePeerCount(peers.length);
    });

    // Expose helia instance for testing
    (window as any).helia = helia;

    // Add dial function for manual peer connections
    (window as any).dialPeer = async (multiaddrString: string) => {
      try {
        console.log(`Attempting to dial: ${multiaddrString}`);
        const addr = multiaddr(multiaddrString);
        const connection = await helia.libp2p.dial(addr);
        console.log('✅ Successfully connected to peer:', connection.remotePeer.toString());
        return connection;
      } catch (error) {
        console.error('❌ Failed to dial peer:', error);
        throw error;
      }
    };

  } catch (error) {
    console.error('Failed to initialize Helia:', error);
    updateStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Start the app
init();
