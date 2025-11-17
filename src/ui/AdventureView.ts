/**
 * Adventure View - Text-based MUD adventure gameplay interface
 *
 * CRC: crc-AdventureView.md
 * Spec: game-worlds.md (lines 75-108)
 * Sequences:
 * - seq-select-world.md
 * - seq-send-command.md
 * - seq-host-session.md
 * - seq-join-session.md
 * UI Spec: ui-adventure-view.md
 *
 * This component provides the UI for TextCraft MUD integration,
 * supporting both solo and multiplayer (host/guest) modes.
 * World management is delegated to WorldListView and AdventureMode.
 */

import { TemplateEngine } from '../utils/TemplateEngine.js';
import { HollowIPeer } from '../textcraft/hollow-peer.js';
import { LocalMudSession } from '../textcraft/local-session.js';
import { WorldLoader } from '../textcraft/world-loader.js';
import type { HollowPeer } from '../p2p/HollowPeer.js';
import type { IRouter } from '../utils/Router.js';
import { SessionControls, type SessionMode } from './SessionControls.js';
import { JoinSessionModal } from './JoinSessionModal.js';
import { getProfileService } from '../services/ProfileService.js';

/**
 * OutputEntry interface
 * CRC: crc-AdventureView.md
 * Spec: game-worlds.md (Adventure Output History Persistence)
 */
interface OutputEntry {
    type: 'command' | 'output' | 'system' | 'error';
    text: string;
}

// Storage constants
const OUTPUT_HISTORY_KEY = 'adventureOutputHistory';
const MAX_HISTORY_LINES = 1000;

/**
 * IAdventureViewConfig interface
 * CRC: crc-AdventureView.md
 */
export interface IAdventureViewConfig {
    hollowPeer?: HollowPeer;
    onBack: () => void;
    router?: IRouter;
}

/**
 * AdventureView class - Adventure gameplay view
 * CRC: crc-AdventureView.md
 */
export class AdventureView {
    private container: HTMLElement | null = null;
    private outputElement: HTMLElement | null = null;
    private inputElement: HTMLInputElement | null = null;
    private worldNameElement: HTMLElement | null = null;

    private hollowPeer: HollowPeer | undefined;
    private mudPeer: HollowIPeer | null = null;
    private localSession: LocalMudSession | null = null;
    private onBackCallback: () => void;
    private router: IRouter | undefined;

    // Session controls component
    private sessionControls: SessionControls | null = null;
    private sessionControlsContainer: HTMLElement | null = null;

    // Join session modal component
    private joinSessionModal: JoinSessionModal | null = null;

    // Event handler references for proper cleanup
    private boundHomeClickHandler: (() => void) | null = null;
    private boundBackClickHandler: (() => void) | null = null;
    private boundWorldsButtonClickHandler: (() => void) | null = null;

    private commandHistory: string[] = [];
    private historyIndex: number = -1;
    private sessionMode: SessionMode = 'solo';
    private currentWorldName: string = '';
    private outputHistory: OutputEntry[] = [];

    constructor(config: IAdventureViewConfig) {
        this.hollowPeer = config.hollowPeer;
        this.onBackCallback = config.onBack;
        this.router = config.router;
    }

    /**
     * render implementation - Display adventure UI with banner, output area, command input
     *
     * CRC: crc-AdventureView.md
     * Sequences:
     * - seq-select-world.md
     */
    async render(worldId?: string, skipInitialization: boolean = false): Promise<HTMLElement> {
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
        this.worldNameElement = this.container.querySelector('#world-name');
        this.sessionControlsContainer = this.container.querySelector('#session-controls-container');

        // Setup event listeners
        this.setupEventListeners();

        // Initialize session controls component
        const templateEngineInstance = new TemplateEngine();
        this.sessionControls = new SessionControls(
            templateEngineInstance,
            () => this.handleHostSession(),
            () => this.handleJoinSession(),
            () => this.handleEndSession()
        );

        if (this.sessionControlsContainer) {
            const controlsElement = await this.sessionControls.render();
            this.sessionControlsContainer.appendChild(controlsElement);
        }

        // Initialize join session modal
        this.joinSessionModal = new JoinSessionModal(
            templateEngineInstance,
            (hostPeerId: string, characterId: string) => this.confirmJoin(hostPeerId, characterId)
        );

        // Initialize MUD peer with specific world (unless we're skipping initialization)
        if (!skipInitialization) {
            await this.initializeMudPeer(worldId);
        }

        // Load output history from storage
        this.loadHistory();

        return this.container;
    }

    /**
     * initializeMudPeer implementation - Set up MUD connection for specified world
     *
     * CRC: crc-AdventureView.md
     * Sequences:
     * - seq-select-world.md
     */
    private async initializeMudPeer(worldId?: string): Promise<void> {
        // Solo mode by default
        await this.initializeSoloMode(worldId);
    }

    /**
     * initializeSoloMode implementation - Start local solo session
     *
     * CRC: crc-AdventureView.md
     */
    private async initializeSoloMode(worldId?: string): Promise<void> {
        this.addSystemOutput('🎮 Solo Mode');
        console.log('🎮 Initializing solo mode...');

        try {
            // Create LocalMudSession
            this.localSession = new LocalMudSession((output: string) => {
                this.addOutput(output);
            });

            // Load the specified world or create test world
            const worldLoader = new WorldLoader();
            let world;

            if (worldId) {
                // Load specific world from storage
                console.log('🌍 Loading world:', worldId);
                world = await worldLoader.loadWorld(worldId);
            } else {
                // Create default test world
                console.log('🌍 Creating test world');
                world = await worldLoader.createTestWorld();
            }

            // Load world into session
            await this.localSession.loadWorld(world);

            // Set session mode to solo
            this.sessionMode = 'solo';
            this.updateSessionControls();

            // Update world name display
            this.currentWorldName = world.name;
            if (this.worldNameElement) {
                this.worldNameElement.textContent = world.name;
            }

            this.addSystemOutput('✅ Solo mode ready! Type commands to interact.');
            console.log('✅ Solo mode initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize solo mode:', error);
            this.addErrorOutput(`Failed to initialize: ${error}`);
            this.addSystemOutput('⚠️  Initialization failed. Type "help" for available commands.');
        }
    }

    /**
     * setupEventListeners implementation - Attach handlers for adventure controls
     *
     * CRC: crc-AdventureView.md
     */
    private setupEventListeners(): void {
        // Home button
        const homeBtn = this.container?.querySelector('#adventure-home-btn');
        if (homeBtn) {
            // Remove old listener if it exists
            if (this.boundHomeClickHandler) {
                homeBtn.removeEventListener('click', this.boundHomeClickHandler);
            }
            // Create and store new bound handler
            this.boundHomeClickHandler = () => {
                this.router?.navigate('/');
            };
            homeBtn.addEventListener('click', this.boundHomeClickHandler);
        }

        // Back button
        const backBtn = this.container?.querySelector('#adventure-back-btn');
        if (backBtn) {
            // Remove old listener if it exists
            if (this.boundBackClickHandler) {
                backBtn.removeEventListener('click', this.boundBackClickHandler);
            }
            // Create and store new bound handler
            this.boundBackClickHandler = () => {
                this.onBackCallback();
            };
            backBtn.addEventListener('click', this.boundBackClickHandler);
        }

        // Worlds button click - navigate to world list
        const worldsButton = this.container?.querySelector('#worlds-btn');
        if (worldsButton) {
            // Remove old listener if it exists
            if (this.boundWorldsButtonClickHandler) {
                worldsButton.removeEventListener('click', this.boundWorldsButtonClickHandler);
            }
            // Create and store new bound handler
            this.boundWorldsButtonClickHandler = () => {
                this.handleWorldsButton();
            };
            worldsButton.addEventListener('click', this.boundWorldsButtonClickHandler);
        }

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
    }

    /**
     * handleCommand implementation - Process user command through MUD engine
     *
     * CRC: crc-AdventureView.md
     * Sequences:
     * - seq-send-command.md
     */
    private handleCommand(): void {
        if (!this.inputElement) return;

        const cmd = this.inputElement.value.trim();
        if (!cmd) return;

        // Add to history
        this.commandHistory.push(cmd);
        this.historyIndex = this.commandHistory.length;

        // Display command
        this.addCommandOutput(`> ${cmd}`);

        // Execute command based on session mode
        if (this.sessionMode === 'solo' && this.localSession) {
            // Solo mode - use LocalMudSession
            try {
                this.localSession.executeCommand(cmd);
            } catch (error) {
                this.addErrorOutput(`Error: ${error}`);
            }
        } else if ((this.sessionMode === 'host' || this.sessionMode === 'guest') && this.mudPeer) {
            // Multiplayer mode - use MUD peer
            try {
                this.mudPeer.command(cmd);
            } catch (error) {
                this.addErrorOutput(`Error: ${error}`);
            }
        } else {
            // Fallback - handle basic commands
            this.handleBasicCommand(cmd);
        }

        // Clear input
        this.inputElement.value = '';
    }

    /**
     * handleBasicCommand implementation - Fallback for basic commands without MUD engine
     *
     * CRC: crc-AdventureView.md
     */
    private handleBasicCommand(cmd: string): void {
        const lowerCmd = cmd.toLowerCase();

        if (lowerCmd === 'help') {
            this.addOutput('Available commands: help, clear, status');
        } else if (lowerCmd === 'clear') {
            this.clearOutput();
        } else if (lowerCmd === 'status') {
            this.addOutput(`Session mode: ${this.sessionMode}`);
            this.addOutput(`World: ${this.currentWorldName || 'None'}`);
        } else {
            this.addOutput(`Unknown command: ${cmd}`);
            this.addOutput('Type "help" for available commands.');
        }
    }

    /**
     * navigateHistory implementation - Navigate up/down through command history
     *
     * CRC: crc-AdventureView.md
     */
    private navigateHistory(direction: number): void {
        if (!this.inputElement || this.commandHistory.length === 0) return;

        this.historyIndex += direction;

        // Clamp index
        if (this.historyIndex < 0) {
            this.historyIndex = 0;
        } else if (this.historyIndex >= this.commandHistory.length) {
            this.historyIndex = this.commandHistory.length;
            this.inputElement.value = '';
            return;
        }

        // Set input to history item
        this.inputElement.value = this.commandHistory[this.historyIndex];
    }

    /**
     * handleHostSession implementation - Start hosting multiplayer session
     *
     * CRC: crc-AdventureView.md
     * Sequences:
     * - seq-host-session.md
     */
    private handleHostSession(): void {
        this.startHosting();
    }

    /**
     * startHosting implementation - Initialize host mode
     *
     * CRC: crc-AdventureView.md
     * Sequences:
     * - seq-host-session.md
     */
    private startHosting(): void {
        this.addSystemOutput('🏠 Starting host mode...');

        try {
            if (!this.hollowPeer) {
                this.addErrorOutput('P2P peer not available');
                return;
            }

            // Get network provider from HollowPeer
            const networkProvider = this.hollowPeer.getNetworkProvider();
            if (!networkProvider) {
                this.addErrorOutput('Network provider not available');
                return;
            }

            // Create HollowIPeer using existing network provider
            this.mudPeer = new HollowIPeer(networkProvider);

            // Set session mode to host
            this.sessionMode = 'host';
            this.updateSessionControls();

            this.addSystemOutput('✅ Host mode active! Share your peer ID with friends.');
            this.addSystemOutput(`Peer ID: ${networkProvider.getPeerId()}`);
        } catch (error) {
            console.error('Failed to start hosting:', error);
            this.addErrorOutput(`Failed to start hosting: ${error}`);
        }
    }

    /**
     * handleJoinSession implementation - Open join session modal
     *
     * CRC: crc-AdventureView.md
     * Sequences:
     * - seq-join-session.md
     */
    private handleJoinSession(): void {
        this.showJoinModal();
    }

    /**
     * showJoinModal implementation - Display join session modal
     *
     * CRC: crc-AdventureView.md
     * Sequences:
     * - seq-join-session.md
     */
    private showJoinModal(): void {
        if (this.joinSessionModal) {
            this.joinSessionModal.show();
        }
    }

    /**
     * confirmJoin implementation - Connect to host peer
     *
     * CRC: crc-AdventureView.md
     * Sequences:
     * - seq-join-session.md
     */
    private confirmJoin(hostPeerId: string, characterId: string): void {
        this.addSystemOutput(`🚪 Joining session: ${hostPeerId}`);
        this.addSystemOutput(`Character: ${characterId}`);

        try {
            if (!this.hollowPeer) {
                this.addErrorOutput('P2P peer not available');
                return;
            }

            // Get network provider from HollowPeer
            const networkProvider = this.hollowPeer.getNetworkProvider();
            if (!networkProvider) {
                this.addErrorOutput('Network provider not available');
                return;
            }

            // Create HollowIPeer using existing network provider
            this.mudPeer = new HollowIPeer(networkProvider);

            // TODO: Implement actual P2P connection to host
            // This would involve:
            // 1. Connect to host peer via network provider
            // 2. Initialize guest MudConnection
            // 3. Set up bidirectional message handling

            // Set session mode to guest
            this.sessionMode = 'guest';
            this.updateSessionControls();

            this.addSystemOutput('✅ Joined session!');
        } catch (error) {
            console.error('Failed to join session:', error);
            this.addErrorOutput(`Failed to join: ${error}`);
        }
    }

    /**
     * handleEndSession implementation - End current session and return to solo mode
     *
     * CRC: crc-AdventureView.md
     */
    private handleEndSession(): void {
        this.addSystemOutput('🛑 Ending session...');

        // Clean up multiplayer peer
        if (this.mudPeer) {
            this.mudPeer = null;
        }

        // Return to solo mode
        this.sessionMode = 'solo';
        this.updateSessionControls();

        this.addSystemOutput('✅ Returned to solo mode');
    }

    /**
     * updateSessionControls implementation - Update session controls display
     *
     * CRC: crc-AdventureView.md
     */
    private updateSessionControls(): void {
        if (this.sessionControls) {
            this.sessionControls.setSessionMode(this.sessionMode);
        }
    }

    /**
     * handleWorldsButton implementation - Navigate to world list
     *
     * CRC: crc-AdventureView.md
     * Sequences:
     * - seq-switch-to-world-list.md
     */
    private handleWorldsButton(): void {
        if (this.router) {
            this.router.navigate('/worlds');
        }
    }

    /**
     * addOutput implementation - Add text to output area and scroll to bottom
     *
     * CRC: crc-AdventureView.md
     * Spec: game-worlds.md (Adventure Output History Persistence)
     */
    private addOutput(text: string, className?: string): void {
        if (!this.outputElement) return;

        const div = document.createElement('div');
        if (className) div.className = className;
        div.innerHTML = text;
        this.outputElement.appendChild(div);

        // Determine output type from className
        let type: OutputEntry['type'] = 'output';
        if (className === 'command-output') type = 'command';
        else if (className === 'error-output') type = 'error';
        else if (className === 'system-output') type = 'system';

        // Add to history and persist
        this.outputHistory.push({ type, text });
        this.saveHistory();

        // Auto-scroll to bottom
        const container = this.outputElement.parentElement;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    /**
     * addCommandOutput implementation - Add command text to output
     *
     * CRC: crc-AdventureView.md
     */
    private addCommandOutput(text: string): void {
        this.addOutput(text, 'command-output');
    }

    /**
     * addErrorOutput implementation - Add error text to output
     *
     * CRC: crc-AdventureView.md
     */
    private addErrorOutput(text: string): void {
        this.addOutput(text, 'error-output');
    }

    /**
     * addSystemOutput implementation - Add system message to output
     *
     * CRC: crc-AdventureView.md
     */
    private addSystemOutput(text: string): void {
        this.addOutput(text, 'system-output');
    }

    /**
     * clearOutput implementation - Clear all output text
     *
     * CRC: crc-AdventureView.md
     */
    private clearOutput(): void {
        if (this.outputElement) {
            this.outputElement.innerHTML = '';
        }
    }

    /**
     * show implementation - Display adventure view
     *
     * CRC: crc-AdventureView.md
     */
    show(): void {
        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    /**
     * hide implementation - Hide adventure view
     *
     * CRC: crc-AdventureView.md
     */
    hide(): void {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    /**
     * saveHistory implementation - Persist output history to localStorage
     *
     * CRC: crc-AdventureView.md
     * Spec: game-worlds.md (Adventure Output History Persistence)
     */
    private saveHistory(): void {
        try {
            // Trim to max lines (FIFO)
            if (this.outputHistory.length > MAX_HISTORY_LINES) {
                this.outputHistory = this.outputHistory.slice(-MAX_HISTORY_LINES);
            }

            const profileService = getProfileService();
            profileService.setItem(OUTPUT_HISTORY_KEY, JSON.stringify(this.outputHistory));
        } catch (error) {
            console.error('Failed to save output history:', error);
        }
    }

    /**
     * loadHistory implementation - Load output history from localStorage and populate output area
     *
     * CRC: crc-AdventureView.md
     * Spec: game-worlds.md (Adventure Output History Persistence)
     */
    private loadHistory(): void {
        try {
            const profileService = getProfileService();
            const historyJson = profileService.getItem(OUTPUT_HISTORY_KEY);

            if (!historyJson) {
                this.outputHistory = [];
                return;
            }

            this.outputHistory = JSON.parse(historyJson) as OutputEntry[];

            // Restore output to DOM
            if (this.outputElement) {
                this.outputElement.innerHTML = '';

                for (const entry of this.outputHistory) {
                    const div = document.createElement('div');

                    // Map type to className
                    if (entry.type === 'command') div.className = 'command-output';
                    else if (entry.type === 'error') div.className = 'error-output';
                    else if (entry.type === 'system') div.className = 'system-output';

                    div.innerHTML = entry.text;
                    this.outputElement.appendChild(div);
                }

                // Auto-scroll to bottom
                const container = this.outputElement.parentElement;
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            }
        } catch (error) {
            console.error('Failed to load output history:', error);
            this.outputHistory = [];
        }
    }

    /**
     * clearHistory implementation - Clear output history from memory and storage
     *
     * CRC: crc-AdventureView.md
     * Spec: game-worlds.md (Adventure Output History Persistence)
     */
    clearHistory(): void {
        this.outputHistory = [];

        try {
            const profileService = getProfileService();
            profileService.removeItem(OUTPUT_HISTORY_KEY);
        } catch (error) {
            console.error('Failed to clear output history:', error);
        }

        // Clear output element
        if (this.outputElement) {
            this.outputElement.innerHTML = '';
        }
    }

    /**
     * destroy implementation - Dispose of MUD engine and network connections
     *
     * CRC: crc-AdventureView.md
     */
    destroy(): void {
        // Clean up event listeners
        const homeBtn = this.container?.querySelector('#adventure-home-btn');
        if (homeBtn && this.boundHomeClickHandler) {
            homeBtn.removeEventListener('click', this.boundHomeClickHandler);
        }

        const backBtn = this.container?.querySelector('#adventure-back-btn');
        if (backBtn && this.boundBackClickHandler) {
            backBtn.removeEventListener('click', this.boundBackClickHandler);
        }

        const worldsButton = this.container?.querySelector('#worlds-btn');
        if (worldsButton && this.boundWorldsButtonClickHandler) {
            worldsButton.removeEventListener('click', this.boundWorldsButtonClickHandler);
        }

        // Clean up components
        if (this.sessionControls) {
            this.sessionControls.destroy();
            this.sessionControls = null;
        }

        if (this.joinSessionModal) {
            this.joinSessionModal.destroy();
            this.joinSessionModal = null;
        }

        // Clean up MUD peer
        if (this.mudPeer) {
            this.mudPeer = null;
        }

        // Clean up local session
        if (this.localSession) {
            this.localSession = null;
        }

        // Remove container
        if (this.container) {
            this.container.remove();
            this.container = null;
        }

        this.boundBackClickHandler = null;
        this.boundWorldsButtonClickHandler = null;
    }
}
