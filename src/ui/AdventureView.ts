/**
 * AdventureView - Text-based MUD adventure mode interface
 *
 * This component provides the UI for TextCraft MUD integration,
 * supporting both solo and multiplayer (host/guest) modes.
 */

import { TemplateEngine } from '../utils/TemplateEngine';
import { HollowIPeer } from '../textcraft/hollow-peer';
import { LocalMudSession } from '../textcraft/local-session';
import { WorldLoader } from '../textcraft/world-loader';
import { getStorage, World } from '../textcraft/model';
import type { HollowPeer } from '../p2p/HollowPeer';
import type { LibP2PNetworkProvider } from '../p2p/LibP2PNetworkProvider';
import type { IRouter } from '../utils/Router';
import '../styles/AdventureView.css';

export interface IAdventureViewConfig {
    hollowPeer?: HollowPeer;
    onBack: () => void;
    router?: IRouter;
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
    private worldNameElement: HTMLElement | null = null;
    private createWorldModal: HTMLElement | null = null;
    private worldSettingsModal: HTMLElement | null = null;
    private worldSettingsContainer: HTMLElement | null = null;
    private deleteWorldModal: HTMLElement | null = null;
    private worldListView: HTMLElement | null = null;
    private worldListViewContainer: HTMLElement | null = null;
    private worldListContainer: HTMLElement | null = null;
    private currentWorldName: string = '';
    private isWorldListVisible: boolean = false;

    private hollowPeer: HollowPeer | undefined;
    private mudPeer: HollowIPeer | null = null;
    private localSession: LocalMudSession | null = null;
    private onBackCallback: () => void;
    private router: IRouter | undefined;

    private commandHistory: string[] = [];
    private historyIndex: number = -1;
    private sessionMode: SessionMode = 'solo';

    constructor(config: IAdventureViewConfig) {
        this.hollowPeer = config.hollowPeer;
        this.onBackCallback = config.onBack;
        this.router = config.router;
    }

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
        this.statusIndicator = this.container.querySelector('#status-indicator');
        this.statusText = this.container.querySelector('#status-text');
        this.sessionInfo = this.container.querySelector('#session-info');
        this.connectionString = this.container.querySelector('#connection-string');
        this.joinModal = this.container.querySelector('#join-modal');
        this.worldNameElement = this.container.querySelector('#world-name');
        this.createWorldModal = this.container.querySelector('#create-world-modal');
        this.worldSettingsContainer = this.container.querySelector('#world-settings-modal-container');
        this.worldListViewContainer = this.container.querySelector('#world-list-view-container');

        // Clear world list view references since we have a new container
        this.worldListView = null;
        this.worldListContainer = null;

        // Setup event listeners
        this.setupEventListeners();

        // Initialize MUD peer with specific world (unless we're skipping initialization)
        if (!skipInitialization) {
            await this.initializeMudPeer(worldId);
        }

        return this.container;
    }

    private async initializeMudPeer(worldId?: string): Promise<void> {
        try {
            console.log('🎮 Initializing adventure mode...');

            // Always start in solo mode (Phase 2.5)
            await this.initializeSoloMode(worldId);

            // Check if multiplayer is available (but don't auto-enable)
            const networkProvider = this.hollowPeer?.getNetworkProvider() as LibP2PNetworkProvider | null;

            if (networkProvider) {
                // Network available - prepare multiplayer capability
                console.log('🌐 Multiplayer available (use Host/Join buttons to enable)');

                // Create HollowIPeer for multiplayer (ready but not active)
                this.mudPeer = new HollowIPeer(networkProvider);
                this.mudPeer.init({
                    displayOutput: (text: string) => this.addOutput(text),
                    updateUser: (peerID: string, name: string, properties: any) => {
                        this.addSystemOutput(`👤 User ${name} updated`);
                    }
                });

                await this.mudPeer.start({} as any); // MudStorage will be implemented later

                this.addSystemOutput('💡 Multiplayer available - use Host/Join buttons to connect with others.');
                console.log('✅ Multiplayer peer ready (inactive)');
            } else {
                console.log('📴 Network unavailable - solo mode only');
            }
        } catch (error) {
            console.error('❌ Failed to initialize adventure mode:', error);
            this.addSystemOutput(`❌ Failed to initialize: ${error}`);
        }
    }

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
            this.updateStatus();

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

        // World name click - toggle world list view
        this.worldNameElement?.addEventListener('click', () => {
            this.toggleWorldListView();
        });

        // Create world modal buttons
        const createWorldConfirmBtn = this.container?.querySelector('#create-world-confirm-btn');
        createWorldConfirmBtn?.addEventListener('click', () => {
            this.confirmCreateWorld();
        });

        const createWorldCancelBtn = this.container?.querySelector('#create-world-cancel-btn');
        createWorldCancelBtn?.addEventListener('click', () => {
            this.hideCreateWorldModal();
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
            // Close solo session before switching to multiplayer
            if (this.localSession) {
                console.log('🔄 Switching from solo mode to hosting...');
                this.localSession.close();
                this.localSession = null;
            }

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
            // Close solo session before switching to multiplayer
            if (this.localSession) {
                console.log('🔄 Switching from solo mode to joining session...');
                this.localSession.close();
                this.localSession = null;
            }

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

    private showCreateWorldModal(): void {
        if (this.createWorldModal) {
            this.createWorldModal.style.display = 'flex';
            const input = this.createWorldModal.querySelector('#new-world-name') as HTMLInputElement;
            input?.focus();
        }
    }

    private hideCreateWorldModal(): void {
        if (this.createWorldModal) {
            this.createWorldModal.style.display = 'none';
            const nameInput = this.createWorldModal.querySelector('#new-world-name') as HTMLInputElement;
            const descInput = this.createWorldModal.querySelector('#new-world-desc') as HTMLTextAreaElement;
            if (nameInput) nameInput.value = '';
            if (descInput) descInput.value = '';
        }
    }

    /**
     * Toggle world list view visibility
     */
    private async toggleWorldListView(): Promise<void> {
        if (this.router) {
            // Use routing to navigate
            if (this.isWorldListVisible) {
                // Navigate back to current world
                if (this.currentWorldName) {
                    this.router.navigate(`/world/${encodeURIComponent(this.currentWorldName)}`);
                } else {
                    // No current world - go to default handler
                    this.router.navigate('/world');
                }
            } else {
                this.router.navigate('/worlds');
            }
        } else {
            // Fallback to direct toggle if no router
            if (this.isWorldListVisible) {
                await this.hideWorldListView();
            } else {
                await this.showWorldListView();
            }
        }
    }

    /**
     * Show world list view from route
     * This is called by the router when navigating to /adventure/worlds
     */
    /**
     * Shows the world list view when navigating via router.
     * This is called by the router when navigating to /worlds
     */
    /**
     * Shows the world list view when navigating via router.
     * This is called by the router when navigating to /worlds
     */
    public async showWorldListViewFromRoute(): Promise<void> {
        await this.showWorldListView();
    }

    /**
     * Show world list view
     */
    private async showWorldListView(): Promise<void> {
        try {
            // Load world list view template if not already loaded
            if (!this.worldListView && this.worldListViewContainer) {
                const templateEngine = new TemplateEngine();
                const worldListHtml = await templateEngine.renderTemplateFromFile('adventure/world-list-view', {});
                this.worldListViewContainer.innerHTML = worldListHtml;
                this.worldListView = this.worldListViewContainer.querySelector('#world-list-view');
                this.worldListContainer = this.worldListView?.querySelector('#world-list-container') || null;

                // Setup event listener for create world button in world list
                const createBtn = this.worldListView?.querySelector('#world-list-create-btn');
                createBtn?.addEventListener('click', () => {
                    this.showCreateWorldModal();
                });
            }

            // Clear world name display when showing world list (not in any specific world)
            if (this.worldNameElement) {
                this.worldNameElement.textContent = '🌵 Select World';
            }

            // Render world list items
            await this.renderWorldListView();

            // Show the world list view
            if (this.worldListView) {
                this.worldListView.classList.add('active');
                this.isWorldListVisible = true;
            }
        } catch (error) {
            console.error('Failed to show world list view:', error);
            this.addErrorOutput(`Failed to show world list: ${error}`);
        }
    }

    /**
     * Hide world list view
     */
    private async hideWorldListView(): Promise<void> {
        if (this.worldListView) {
            this.worldListView.classList.remove('active');
            this.isWorldListVisible = false;
        }

        // Restore current world name display
        if (this.worldNameElement && this.currentWorldName) {
            this.worldNameElement.textContent = this.currentWorldName;
        }
    }

    /**
     * Render world list view with all worlds
     */
    private async renderWorldListView(): Promise<void> {
        if (!this.worldListContainer) return;

        try {
            // Get storage to list available worlds
            const storage = await getStorage();

            // Clear existing world items
            this.worldListContainer.innerHTML = '';

            // Render each world
            for (const worldName of storage.worlds) {
                await this.renderWorldListItem(worldName);
            }
        } catch (error) {
            console.error('Failed to render world list:', error);
            this.addErrorOutput(`Failed to render world list: ${error}`);
        }
    }

    /**
     * Render a single world list item
     */
    private async renderWorldListItem(worldName: string): Promise<void> {
        if (!this.worldListContainer) return;

        const templateEngine = new TemplateEngine();
        const itemHtml = await templateEngine.renderTemplateFromFile('adventure/world-list-item', {
            worldName: worldName
        });

        const temp = document.createElement('div');
        temp.innerHTML = itemHtml;
        const worldItem = temp.firstElementChild;

        if (worldItem) {
            // Add event listeners for world item buttons
            const startBtn = worldItem.querySelector('.world-item-start-btn');
            startBtn?.addEventListener('click', async () => {
                await this.startWorld(worldName);
            });

            const editBtn = worldItem.querySelector('.world-item-edit-btn');
            editBtn?.addEventListener('click', async () => {
                await this.editWorld(worldName);
            });

            const deleteBtn = worldItem.querySelector('.world-item-delete-btn');
            deleteBtn?.addEventListener('click', async () => {
                await this.deleteWorldFromList(worldName);
            });

            this.worldListContainer.appendChild(worldItem);
        }
    }

    /**
     * Start/switch to a world from the world list
     */
    private async startWorld(worldName: string): Promise<void> {
        try {
            // Navigate to the world using the new URL format
            if (this.router) {
                this.router.navigate(`/world/${encodeURIComponent(worldName)}`);
            } else {
                // Fallback: switch world and hide world list
                await this.switchWorld(worldName);
                await this.hideWorldListView();
            }
        } catch (error) {
            console.error('Failed to start world:', error);
            this.addErrorOutput(`Failed to start world: ${error}`);
        }
    }

    /**
     * Edit a world from the world list
     */
    private async editWorld(worldName: string): Promise<void> {
        try {
            // Navigate to the world using the new URL format
            if (this.router) {
                this.router.navigate(`/world/${encodeURIComponent(worldName)}`);
                // Wait a moment for navigation to complete
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                // Fallback: switch world and hide world list
                if (worldName !== this.currentWorldName) {
                    await this.switchWorld(worldName);
                }
                await this.hideWorldListView();
            }

            // Show world settings modal
            await this.showWorldSettingsModal();
        } catch (error) {
            console.error('Failed to edit world:', error);
            this.addErrorOutput(`Failed to edit world: ${error}`);
        }
    }

    /**
     * Delete a world from the world list
     */
    private async deleteWorldFromList(worldName: string): Promise<void> {
        try {
            // Switch to the world first if not already current (required for delete modal)
            if (worldName !== this.currentWorldName) {
                await this.switchWorld(worldName);
            }

            // Show delete confirmation modal
            await this.showDeleteConfirmationModal();
        } catch (error) {
            console.error('Failed to delete world:', error);
            this.addErrorOutput(`Failed to delete world: ${error}`);
        }
    }

    /**
     * Show world settings modal
     */
    private async showWorldSettingsModal(): Promise<void> {
        try {
            // Load modal template if not already loaded
            if (!this.worldSettingsModal) {
                const templateEngine = new TemplateEngine();
                const modalHtml = await templateEngine.renderTemplateFromFile('adventure/world-settings-modal', {});
                
                if (this.worldSettingsContainer) {
                    this.worldSettingsContainer.innerHTML = modalHtml;
                    this.worldSettingsModal = this.worldSettingsContainer.querySelector('#world-settings-modal');
                    
                    // Set up event listeners for modal
                    this.setupWorldSettingsListeners();
                }
            }

            // Load current world settings
            await this.loadWorldSettings();

            // Show modal
            if (this.worldSettingsModal) {
                this.worldSettingsModal.style.display = 'flex';
            }
        } catch (error) {
            console.error('Failed to show world settings modal:', error);
            this.addErrorOutput(`Failed to open world settings: ${error}`);
        }
    }

    /**
     * Hide world settings modal
     */
    private hideWorldSettingsModal(): void {
        if (this.worldSettingsModal) {
            this.worldSettingsModal.style.display = 'none';
        }
    }

    /**
     * Setup event listeners for world settings modal
     */
    private setupWorldSettingsListeners(): void {
        const saveBtn = this.worldSettingsModal?.querySelector('#save-world-settings-btn');
        saveBtn?.addEventListener('click', () => {
            this.saveWorldSettings();
        });

        const cancelBtn = this.worldSettingsModal?.querySelector('#cancel-world-settings-btn');
        cancelBtn?.addEventListener('click', () => {
            this.hideWorldSettingsModal();
        });

        const deleteBtn = this.worldSettingsModal?.querySelector('#delete-world-btn');
        deleteBtn?.addEventListener('click', () => {
            this.showDeleteConfirmationModal();
        });

        const addUserBtn = this.worldSettingsModal?.querySelector('#add-user-btn');
        addUserBtn?.addEventListener('click', () => {
            this.addUser();
        });
    }

    /**
     * Load current world settings into modal
     */
    private async loadWorldSettings(): Promise<void> {
        if (!this.localSession || !this.worldSettingsModal) return;

        try {
            // Get world from local session
            const { getStorage } = await import('../textcraft/model.js');
            const storage = await getStorage();
            const world = storage.openWorlds.get(this.currentWorldName);

            if (!world) {
                throw new Error('World not found');
            }

            // Populate world name and description
            const worldNameInput = this.worldSettingsModal.querySelector('#settings-world-name') as HTMLInputElement;
            const worldDescInput = this.worldSettingsModal.querySelector('#settings-world-desc') as HTMLTextAreaElement;

            if (worldNameInput) worldNameInput.value = world.name || '';
            if (worldDescInput) worldDescInput.value = world.description || '';

            // Load users
            await this.loadUsers(world);
        } catch (error) {
            console.error('Failed to load world settings:', error);
            this.addErrorOutput(`Failed to load settings: ${error}`);
        }
    }

    /**
     * Load users into the users list
     */
    private async loadUsers(world: any): Promise<void> {
        const usersList = this.worldSettingsModal?.querySelector('#users-list');
        if (!usersList) return;

        // Clear existing users
        usersList.innerHTML = '';

        // Get all users from world
        const users = await this.getWorldUsers(world);

        // Render each user
        for (const user of users) {
            await this.renderUserItem(user, usersList);
        }
    }

    /**
     * Get all users from a world
     */
    private async getWorldUsers(world: any): Promise<any[]> {
        const users: any[] = [];
        
        // Iterate through world.userCache
        if (world.userCache) {
            for (const [_userName, user] of world.userCache) {
                users.push(user);
            }
        }

        return users;
    }

    /**
     * Render a single user item
     */
    private async renderUserItem(user: any, container: Element): Promise<void> {
        const templateEngine = new TemplateEngine();
        const userHtml = await templateEngine.renderTemplateFromFile('adventure/user-item', {
            userId: user.name || '',
            userName: user.name || '',
            userPassword: user.password || '',
            userAdminChecked: user.admin ? 'checked' : ''
        });

        const temp = document.createElement('div');
        temp.innerHTML = userHtml;
        const userItem = temp.firstElementChild;

        if (userItem) {
            // Add remove button listener
            const removeBtn = userItem.querySelector('.remove-user-btn');
            removeBtn?.addEventListener('click', () => {
                userItem.remove();
            });

            container.appendChild(userItem);
        }
    }

    /**
     * Add a new user to the list
     */
    private async addUser(): Promise<void> {
        const usersList = this.worldSettingsModal?.querySelector('#users-list');
        if (!usersList) return;

        // Create a new user with default values
        const newUser = {
            name: '',
            password: '',
            admin: false
        };

        await this.renderUserItem(newUser, usersList);
    }

    /**
     * Save world settings
     */
    private async saveWorldSettings(): Promise<void> {
        if (!this.localSession || !this.worldSettingsModal) return;

        try {
            // Get world name and description
            const worldNameInput = this.worldSettingsModal.querySelector('#settings-world-name') as HTMLInputElement;
            const worldDescInput = this.worldSettingsModal.querySelector('#settings-world-desc') as HTMLTextAreaElement;

            const newWorldName = worldNameInput?.value.trim();
            const newWorldDesc = worldDescInput?.value.trim();

            if (!newWorldName) {
                this.addErrorOutput('World name cannot be empty');
                return;
            }

            // Get all users from the form
            const users = this.collectUsersFromForm();

            // Validate users
            if (users.length === 0) {
                this.addErrorOutput('At least one user is required');
                return;
            }

            // Get world from storage
            const { getStorage } = await import('../textcraft/model.js');
            const storage = await getStorage();
            const world = storage.openWorlds.get(this.currentWorldName);

            if (!world) {
                throw new Error('World not found');
            }

            // Update world name and description
            world.name = newWorldName;
            world.description = newWorldDesc;

            // Update users
            await world.replaceUsers(users);

            // Store world info within a transaction
            await world.doTransaction(async (_store, _users, _txn) => {
                await world.store();
            });

            this.addSystemOutput(`✅ World settings saved successfully!`);
            this.hideWorldSettingsModal();

            // Update world name display if changed
            if (newWorldName !== this.currentWorldName) {
                this.currentWorldName = newWorldName;
                if (this.worldNameElement) {
                    this.worldNameElement.textContent = newWorldName;
                }
            }
        } catch (error) {
            console.error('Failed to save world settings:', error);
            this.addErrorOutput(`Failed to save settings: ${error}`);
        }
    }

    /**
     * Collect users from the form
     */
    private collectUsersFromForm(): any[] {
        if (!this.worldSettingsModal) return [];

        const users: any[] = [];
        const userItems = this.worldSettingsModal.querySelectorAll('.user-item');

        userItems.forEach((item) => {
            const nameInput = item.querySelector('.user-name-input') as HTMLInputElement;
            const passwordInput = item.querySelector('.user-password-input') as HTMLInputElement;
            const adminCheckbox = item.querySelector('.user-admin-checkbox') as HTMLInputElement;

            const name = nameInput?.value.trim();
            const password = passwordInput?.value.trim();
            const admin = adminCheckbox?.checked || false;

            if (name && password) {
                users.push({ name, password, admin });
            }
        });

        return users;
    }

    /**
     * Show delete confirmation modal
     */
    private async showDeleteConfirmationModal(): Promise<void> {
        // Load the delete confirmation modal template if not already loaded
        if (!this.deleteWorldModal && this.worldSettingsContainer) {
            const templateEngine = new TemplateEngine();
            const templateHtml = await templateEngine.renderTemplateFromFile('adventure/delete-world-modal', {});
            this.worldSettingsContainer.insertAdjacentHTML('beforeend', templateHtml);
            this.deleteWorldModal = this.worldSettingsContainer.querySelector('#delete-world-confirmation-modal');

            // Setup event listeners for delete confirmation modal
            const confirmBtn = this.deleteWorldModal?.querySelector('#delete-world-confirm-btn');
            confirmBtn?.addEventListener('click', () => {
                this.deleteWorld();
            });

            const cancelBtn = this.deleteWorldModal?.querySelector('#delete-world-cancel-btn');
            cancelBtn?.addEventListener('click', () => {
                this.hideDeleteConfirmationModal();
            });
        }

        // Set the world name in the confirmation message
        const worldNameDisplay = this.deleteWorldModal?.querySelector('#delete-world-name-display');
        if (worldNameDisplay) {
            worldNameDisplay.textContent = this.currentWorldName;
        }

        // Show the delete confirmation modal
        if (this.deleteWorldModal) {
            this.deleteWorldModal.style.display = 'flex';
        }
    }

    /**
     * Hide delete confirmation modal
     */
    private hideDeleteConfirmationModal(): void {
        if (this.deleteWorldModal) {
            this.deleteWorldModal.style.display = 'none';
        }
    }

    /**
     * Delete the current world
     */
    private async deleteWorld(): Promise<void> {
        try {
            const worldToDelete = this.currentWorldName;

            // Hide the delete confirmation modal
            this.hideDeleteConfirmationModal();

            // Close the world settings modal
            this.hideWorldSettingsModal();

            // Get the MudStorage instance
            const storage = await getStorage();

            // Delete the world from storage
            await storage.deleteWorld(worldToDelete);

            // Get list of remaining worlds
            const worldNames = storage.worlds;

            if (worldNames.length === 0) {
                // No worlds left - create a new default world
                this.addSystemOutput(`World "${worldToDelete}" deleted.`);
                this.addSystemOutput('No worlds remaining. Creating new default world...');

                const defaultWorld = new World();
                await defaultWorld.initDb();
                defaultWorld.name = 'New World';
                defaultWorld.description = 'A fresh frontier awaits...';

                await defaultWorld.doTransaction(async (_store, _users, _txn) => {
                    await defaultWorld.store();
                });

                this.currentWorldName = 'New World';
                this.addSystemOutput('Default world created.');

                // Navigate to the new world
                if (this.router) {
                    this.router.navigate(`/world/${encodeURIComponent('New World')}`);
                } else {
                    await this.switchWorld('New World');
                }
            } else {
                // Switch to the first available world
                const newWorldName = worldNames[0];
                this.addSystemOutput(`World "${worldToDelete}" deleted. Switching to "${newWorldName}"...`);
                this.currentWorldName = newWorldName;

                // Navigate to the new world or stay on world list
                if (this.router) {
                    if (this.isWorldListVisible) {
                        // Stay on world list and refresh it
                        await this.renderWorldListView();
                    } else {
                        // Navigate to the first available world
                        this.router.navigate(`/world/${encodeURIComponent(newWorldName)}`);
                    }
                } else {
                    await this.switchWorld(newWorldName);
                    if (this.isWorldListVisible) {
                        await this.renderWorldListView();
                    }
                }
            }

        } catch (error) {
            console.error('Failed to delete world:', error);
            this.addErrorOutput(`Failed to delete world: ${error}`);
        }
    }

    private async confirmCreateWorld(): Promise<void> {
        const nameInput = this.createWorldModal?.querySelector('#new-world-name') as HTMLInputElement;
        const descInput = this.createWorldModal?.querySelector('#new-world-desc') as HTMLTextAreaElement;

        const worldName = nameInput?.value.trim();

        if (!worldName) {
            this.addErrorOutput('Please enter a world name');
            return;
        }

        try {
            this.addSystemOutput(`🌍 Creating new world "${worldName}"...`);

            // Close current session
            if (this.localSession) {
                this.localSession.close();
                this.localSession = null;
            }

            // Create new local session
            this.localSession = new LocalMudSession((output: string) => {
                this.addOutput(output);
            });

            // Create new world using WorldLoader
            const worldLoader = new WorldLoader();
            const world = await worldLoader.createWorld(worldName);

            // Load the new world
            await this.localSession.loadWorld(world);

            // Update UI
            this.currentWorldName = worldName;
            if (this.worldNameElement) {
                this.worldNameElement.textContent = worldName;
            }

            this.addSystemOutput(`✅ World "${worldName}" created successfully!`);
            this.hideCreateWorldModal();
        } catch (error) {
            console.error('❌ Failed to create world:', error);
            this.addErrorOutput(`Failed to create world: ${error}`);
        }
    }

    private async switchWorld(worldName?: string): Promise<void> {
        const selectedWorld = worldName;
        if (!selectedWorld) return;

        try {
            this.addSystemOutput(`🌍 Switching to world "${selectedWorld}"...`);

            // Close current session
            if (this.localSession) {
                this.localSession.close();
                this.localSession = null;
            }

            // Create new session
            this.localSession = new LocalMudSession((output: string) => {
                this.addOutput(output);
            });

            // Load the selected world
            const worldLoader = new WorldLoader();
            const world = await worldLoader.loadWorld(selectedWorld);
            await this.localSession.loadWorld(world);

            // Update world name display
            this.currentWorldName = selectedWorld;
            if (this.worldNameElement) {
                this.worldNameElement.textContent = selectedWorld;
            }

            this.addSystemOutput(`✅ Switched to world "${selectedWorld}"`);
        } catch (error) {
            console.error('❌ Failed to switch world:', error);
            this.addErrorOutput(`Failed to switch world: ${error}`);
        }
    }

    destroy(): void {
        if (this.localSession) {
            this.localSession.close();
            this.localSession = null;
        }
        if (this.mudPeer) {
            this.mudPeer.reset();
        }
        this.container?.remove();
    }
}
