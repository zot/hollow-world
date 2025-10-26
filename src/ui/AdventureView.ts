/**
 * AdventureView - Text-based MUD adventure mode interface
 *
 * This component provides the UI for TextCraft MUD integration,
 * supporting both solo and multiplayer (host/guest) modes.
 */

import { TemplateEngine } from '../utils/TemplateEngine';
import { HollowIPeer } from '../textcraft/hollow-peer';
import type { HollowPeer } from '../p2p/HollowPeer';
import type { LibP2PNetworkProvider } from '../p2p/LibP2PNetworkProvider';
import '../styles/AdventureView.css';

export interface IAdventureViewConfig {
    hollowPeer?: HollowPeer;
    onBack: () => void;
}

type SessionMode = 'solo' | 'host' | 'guest';

export class AdventureView {
    private container: HTMLElement | null = null;
    private outputElement: HTMLElement | null = null;
    private inputElement: HTMLInputElement | null = null;
    private statusIndicator: HTMLElement | null = null;
    private statusText: HTMLElement | null = null;
    private sessionInfo: HTMLElement | null = null;
    private connectionString: HTMLElement | null = null;
    private joinModal: HTMLElement | null = null;

    private hollowPeer: HollowPeer | undefined;
    private mudPeer: HollowIPeer | null = null;
    private onBackCallback: () => void;

    private commandHistory: string[] = [];
    private historyIndex: number = -1;
    private sessionMode: SessionMode = 'solo';

    constructor(config: IAdventureViewConfig) {
        this.hollowPeer = config.hollowPeer;
        this.onBackCallback = config.onBack;
    }

    async render(): Promise<HTMLElement> {
        // Load template
        const templateEngine = new TemplateEngine();
        const html = await templateEngine.renderTemplateFromFile('adventure/adventure-view', {});

        // Create container
        const temp = document.createElement('div');
        temp.innerHTML = html;
        this.container = temp.firstElementChild as HTMLElement;

        // Get element references
        this.outputElement = this.container.querySelector('#adventure-output');
        this.inputElement = this.container.querySelector('#adventure-input');
        this.statusIndicator = this.container.querySelector('#status-indicator');
        this.statusText = this.container.querySelector('#status-text');
        this.sessionInfo = this.container.querySelector('#session-info');
        this.connectionString = this.container.querySelector('#connection-string');
        this.joinModal = this.container.querySelector('#join-modal');

        // Setup event listeners
        this.setupEventListeners();

        // Initialize MUD peer
        await this.initializeMudPeer();

        return this.container;
    }

    private async initializeMudPeer(): Promise<void> {
        try {
            console.log('🎮 Initializing MUD peer...');
            
            // Get network provider (may be null for solo mode)
            const networkProvider = this.hollowPeer?.getNetworkProvider() as LibP2PNetworkProvider | null;

            if (!networkProvider) {
                this.addSystemOutput('🎮 Solo Mode');
                this.addSystemOutput('');
                this.addSystemOutput('Welcome to Adventure Mode!');
                this.addSystemOutput('');
                this.addSystemOutput('⚠️  Full MUD functionality requires world initialization (Phase 3).');
                this.addSystemOutput('For now, you can:');
                this.addSystemOutput('  • Type "help" for available commands');
                this.addSystemOutput('  • Use "Host Session" or "Join Session" buttons for multiplayer');
                this.addSystemOutput('');
                this.addSystemOutput('Solo adventures with full MUD worlds coming soon!');
                console.log('🎮 Solo mode - MUD initialization deferred until Phase 3');
                return;
            }

            this.addSystemOutput('🌐 Network available - multiplayer mode enabled');
            console.log('🌐 Multiplayer mode available');

            // Create HollowIPeer with network provider for multiplayer
            this.mudPeer = new HollowIPeer(networkProvider);
            this.mudPeer.init({
                displayOutput: (text: string) => this.addOutput(text),
                updateUser: (peerID: string, name: string, properties: any) => {
                    this.addSystemOutput(`👤 User ${name} updated`);
                }
            });

            await this.mudPeer.start({} as any); // MudStorage will be implemented later

            this.addSystemOutput('✅ Adventure mode ready! Type "help" for commands.');
            console.log('✅ MUD peer initialized for multiplayer');
        } catch (error) {
            console.error('❌ Failed to initialize MUD peer:', error);
            this.addSystemOutput(`❌ Failed to initialize: ${error}`);
        }
    }

    private setupEventListeners(): void {
        // Back button
        const backBtn = this.container?.querySelector('#adventure-back-btn');
        backBtn?.addEventListener('click', () => {
            this.onBackCallback();
        });

        // Input handling
        this.inputElement?.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                this.handleCommand();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory(-1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory(1);
            }
        });

        // Submit button
        const submitBtn = this.container?.querySelector('#adventure-submit-btn');
        submitBtn?.addEventListener('click', () => {
            this.handleCommand();
        });

        // Host session button
        const hostBtn = this.container?.querySelector('#host-session-btn');
        hostBtn?.addEventListener('click', () => {
            this.startHosting();
        });

        // Join session button
        const joinBtn = this.container?.querySelector('#join-session-btn');
        joinBtn?.addEventListener('click', () => {
            this.showJoinModal();
        });

        // Join modal buttons
        const joinConfirmBtn = this.container?.querySelector('#join-confirm-btn');
        joinConfirmBtn?.addEventListener('click', () => {
            this.confirmJoin();
        });

        const joinCancelBtn = this.container?.querySelector('#join-cancel-btn');
        joinCancelBtn?.addEventListener('click', () => {
            this.hideJoinModal();
        });

        // Copy connection button
        const copyBtn = this.container?.querySelector('#copy-connection-btn');
        copyBtn?.addEventListener('click', () => {
            this.copyConnectionString();
        });
    }

    private handleCommand(): void {
        if (!this.inputElement) return;

        const cmd = this.inputElement.value.trim();
        if (!cmd) return;

        // Add to history
        this.commandHistory.push(cmd);
        this.historyIndex = this.commandHistory.length;

        // Display command
        this.addCommandOutput(`> ${cmd}`);

        // Execute command
        if (this.mudPeer) {
            try {
                this.mudPeer.command(cmd);
            } catch (error) {
                this.addErrorOutput(`Error: ${error}`);
            }
        } else {
            // Handle basic commands without MUD peer
            this.handleBasicCommand(cmd);
        }

        // Clear input
        this.inputElement.value = '';
    }

    private handleBasicCommand(cmd: string): void {
        const lower = cmd.toLowerCase();

        if (lower === 'help') {
            this.addOutput(`
<strong>Available Commands:</strong>
• help - Show this help message
• clear - Clear the output
• status - Show current session status

<strong>Session Commands:</strong>
• Host a session using the "Host Session" button
• Join a session using the "Join Session" button
            `.trim());
        } else if (lower === 'clear') {
            this.clearOutput();
        } else if (lower === 'status') {
            this.addOutput(`Session Mode: ${this.sessionMode}`);
            if (this.mudPeer) {
                this.addOutput(`Peer ID: ${this.mudPeer.connectString()}`);
            }
        } else {
            this.addOutput('Command not recognized. Type "help" for available commands.');
        }
    }

    private navigateHistory(direction: number): void {
        if (!this.inputElement || this.commandHistory.length === 0) return;

        const newIndex = this.historyIndex + direction;

        if (newIndex >= 0 && newIndex < this.commandHistory.length) {
            this.historyIndex = newIndex;
            this.inputElement.value = this.commandHistory[this.historyIndex];
        } else if (newIndex === this.commandHistory.length) {
            this.historyIndex = newIndex;
            this.inputElement.value = '';
        }
    }

    private startHosting(): void {
        if (!this.mudPeer) {
            this.addErrorOutput('MUD peer not initialized');
            return;
        }
        
        if (!this.hollowPeer) {
            this.addErrorOutput('Cannot host in solo mode - network connection required');
            return;
        }

        try {
            this.mudPeer.startHosting();
            this.sessionMode = 'host';
            this.updateStatus();

            const connectStr = this.mudPeer.connectString();
            this.addSystemOutput('🏠 Now hosting a session!');
            this.addSystemOutput(`Share this ID with guests: ${connectStr}`);

            // Show connection info
            if (this.sessionInfo && this.connectionString) {
                this.connectionString.textContent = connectStr;
                this.sessionInfo.style.display = 'block';
            }
        } catch (error) {
            this.addErrorOutput(`Failed to start hosting: ${error}`);
        }
    }

    private showJoinModal(): void {
        if (!this.hollowPeer) {
            this.addErrorOutput('Cannot join session in solo mode - network connection required');
            return;
        }
        
        if (this.joinModal) {
            this.joinModal.style.display = 'flex';
            const input = this.joinModal.querySelector('#join-peer-id') as HTMLInputElement;
            input?.focus();
        }
    }

    private hideJoinModal(): void {
        if (this.joinModal) {
            this.joinModal.style.display = 'none';
            const input = this.joinModal.querySelector('#join-peer-id') as HTMLInputElement;
            if (input) input.value = '';
        }
    }

    private async confirmJoin(): Promise<void> {
        const input = this.joinModal?.querySelector('#join-peer-id') as HTMLInputElement;
        const peerID = input?.value.trim();

        if (!peerID) {
            this.addErrorOutput('Please enter a host peer ID');
            return;
        }

        if (!this.mudPeer) {
            this.addErrorOutput('MUD peer not initialized');
            return;
        }

        try {
            await this.mudPeer.joinSession(peerID);
            this.sessionMode = 'guest';
            this.updateStatus();

            this.addSystemOutput(`🚪 Joining session hosted by ${peerID}...`);
            this.hideJoinModal();
        } catch (error) {
            this.addErrorOutput(`Failed to join session: ${error}`);
        }
    }

    private copyConnectionString(): void {
        if (!this.connectionString) return;

        const text = this.connectionString.textContent || '';
        navigator.clipboard.writeText(text).then(() => {
            this.addSystemOutput('📋 Connection ID copied to clipboard!');
        }).catch((error) => {
            this.addErrorOutput(`Failed to copy: ${error}`);
        });
    }

    private updateStatus(): void {
        if (!this.statusIndicator || !this.statusText) return;

        // Update status indicator class
        this.statusIndicator.className = `status-indicator ${this.sessionMode}`;

        // Update status text
        const statusMap: Record<SessionMode, string> = {
            solo: 'Solo',
            host: 'Hosting',
            guest: 'Guest'
        };
        this.statusText.textContent = statusMap[this.sessionMode];
    }

    private addOutput(text: string, className?: string): void {
        if (!this.outputElement) return;

        const div = document.createElement('div');
        if (className) div.className = className;
        div.innerHTML = text;
        this.outputElement.appendChild(div);

        // Auto-scroll to bottom
        const container = this.outputElement.parentElement;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    private addCommandOutput(text: string): void {
        this.addOutput(text, 'command');
    }

    private addErrorOutput(text: string): void {
        this.addOutput(text, 'error');
    }

    private addSystemOutput(text: string): void {
        this.addOutput(text, 'system');
    }

    private clearOutput(): void {
        if (this.outputElement) {
            this.outputElement.innerHTML = '';
            this.addSystemOutput('Output cleared.');
        }
    }

    show(): void {
        if (this.container) {
            this.container.style.display = 'flex';
        }
    }

    hide(): void {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    destroy(): void {
        if (this.mudPeer) {
            this.mudPeer.reset();
        }
        this.container?.remove();
    }
}
