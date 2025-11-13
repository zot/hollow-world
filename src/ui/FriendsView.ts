/**
 * FriendsView - P2P Friend Management Interface
 *
 * CRC: specs-crc/crc-FriendsView.md
 * Spec: specs/ui.friends.md
 * Sequences: specs-crc/seq-add-friend-by-peerid.md
 * Template: public/templates/friends-view.html
 */

import { IUIComponent } from './SplashScreen.js';
import { templateEngine } from '../utils/TemplateEngine.js';
import { AudioControlUtils, IEnhancedAudioControlSupport } from '../utils/AudioControlUtils.js';
import { IAudioManager } from '../audio/AudioManager.js';
import { MilkdownUtils, IMilkdownEditor } from '../utils/MilkdownUtils.js';
import { LogService } from '../services/LogService.js';
import { HollowPeer } from '../p2p/index.js';
import type { IFriend } from '../p2p/types.js';

export interface IFriendsView extends IUIComponent {
    onBackToMenu?: () => void;
    container: HTMLElement | null;
    render(container: HTMLElement): Promise<void>;
    refreshView(): Promise<void>;
    destroy(): void;
}

export interface IFriendsViewConfig {
    containerClass: string;
    titleClass: string;
    sectionClass: string;
    buttonClass: string;
    backButtonClass: string;
}

const DEFAULT_CONFIG: IFriendsViewConfig = {
    containerClass: 'friends-container',
    titleClass: 'friends-title',
    sectionClass: 'friends-section',
    buttonClass: 'friends-button',
    backButtonClass: 'friends-back-button'
};

/**
 * Extended friend data for view rendering
 */
interface IFriendViewData {
    peerId: string;
    playerName: string;
    notes: string;
    pending?: 'unsent' | 'pending';
    pendingUnsent?: boolean;  // For template: true if pending === 'unsent'
    pendingDelivered?: boolean;  // For template: true if pending === 'pending'
    presenceOnline?: boolean;  // For template: true if presence === true
    presenceOffline?: boolean;  // For template: true if presence === false
    hasWorlds: boolean;
    worldCount: number;
    worlds?: IWorldViewData[];
}

/**
 * World data for view rendering
 */
interface IWorldViewData {
    worldId: string;
    worldName: string;
    hostPeerId: string;
    isHostedByFriend: boolean;
    hasCharacters: boolean;
    characters: ICharacterViewData[];
}

/**
 * Character data for view rendering
 */
interface ICharacterViewData {
    name: string;
    isDefault: boolean;
}

/**
 * FriendsView - Manage P2P friend relationships and view friend status
 *
 * Purpose: Display friends list with expandable cards, manage friend requests,
 * handle banned peers, and coordinate P2P friendship operations.
 *
 * Specifications:
 * - UI Structure: specs-ui/ui-friends-view.md
 * - UI Concept: specs-wysiwid/concepts-ui.md → FriendsView
 * - Coordination: specs-wysiwid/synchronizations-friends.md → Friend operations
 * - UI Sync: specs-wysiwid/synchronizations-ui.md → UI-to-domain coordination
 *
 * Template: public/templates/friends-view.html
 *
 * Key Features:
 * - Expandable friend cards with Milkdown editor for notes
 * - Status badges (unsent/pending friend requests)
 * - Banned peers management section
 * - Add friend by peer ID modal
 * - Presence indicators (online/offline)
 * - Shared worlds display
 */
export class FriendsView implements IFriendsView, IEnhancedAudioControlSupport {
    private config: IFriendsViewConfig;
    public container: HTMLElement | null = null;
    public onBackToMenu?: () => void;
    public audioManager?: IAudioManager;
    private hollowPeer?: HollowPeer;
    private backButtonElement: HTMLElement | null = null;
    private friendsEditors: Map<string, IMilkdownEditor> = new Map();
    private bannedPeerEditors: Map<string, IMilkdownEditor> = new Map();
    private newFriendNotesEditor: IMilkdownEditor | null = null;
    public musicButtonElement: HTMLElement | null = null;
    private logService: LogService;

    constructor(
        config: IFriendsViewConfig = DEFAULT_CONFIG,
        audioManager?: IAudioManager,
        hollowPeer?: HollowPeer
    ) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.audioManager = audioManager;
        this.hollowPeer = hollowPeer;
        this.logService = new LogService();
    }

    async render(container: HTMLElement): Promise<void> {
        if (!container) {
            console.error('Container is required for FriendsView');
            return;
        }

        this.container = container;

        try {
            // Get friends data
            const friendsData = this.getFriendsData();

            // Get banned peers data
            const bannedPeersData = this.getBannedPeersData();

            // Prepare template data
            const templateData = {
                containerClass: this.config.containerClass,
                titleClass: this.config.titleClass,
                sectionClass: this.config.sectionClass,
                buttonClass: this.config.buttonClass,
                backButtonClass: this.config.backButtonClass,
                friends: friendsData,
                hasFriends: friendsData.length > 0,
                noFriends: friendsData.length === 0,
                bannedPeers: bannedPeersData,
                bannedPeerCount: bannedPeersData.length,
                hasBannedPeers: bannedPeersData.length > 0
            };

            // Render template
            const html = await templateEngine.renderTemplateFromFile('friends-view', templateData);
            container.innerHTML = html;

            // Set up element references and event handlers
            this.setupElementReferences();
            this.setupEventHandlers();
            this.setupFriendCardHandlers();
            this.setupBannedPeersHandlers();

            // Initialize Milkdown editors for friend notes and banned peer notes
            await this.initializeMilkdownEditors();

        } catch (error) {
            console.error('Error rendering FriendsView:', error);
            container.innerHTML = await this.createFriendsFallback();
        }
    }

    /**
     * Refresh the friends view if it's currently visible
     * Preserves collapsed/expanded state of friend cards
     */
    async refreshView(): Promise<void> {
        if (!this.container) {
            return; // View not currently rendered
        }

        // Save expanded state of all friend cards
        const expandedStates = new Map<string, boolean>();
        this.container.querySelectorAll('[data-peer-id]').forEach(card => {
            const peerId = (card as HTMLElement).dataset.peerId;
            const isExpanded = card.classList.contains('friend-card-expanded');
            if (peerId) {
                expandedStates.set(peerId, isExpanded);
            }
        });

        // Re-render the view
        await this.render(this.container);

        // Restore expanded state
        expandedStates.forEach((isExpanded, peerId) => {
            if (isExpanded) {
                const card = this.container?.querySelector(`[data-peer-id="${peerId}"]`);
                if (card) {
                    card.classList.add('friend-card-expanded');
                }
            }
        });
    }

    private getFriendsData(): IFriendViewData[] {
        if (!this.hollowPeer) {
            return [];
        }

        const friendsManager = this.hollowPeer.getFriendsManager();
        const allFriends = friendsManager.getAllFriends();
        const myPeerId = this.hollowPeer.getPeerId();

        const friendsArray: IFriendViewData[] = [];

        allFriends.forEach((friend, peerId) => {
            const worlds: IWorldViewData[] = [];

            // Process worlds if available
            if (friend.worlds && friend.worlds.length > 0) {
                for (const world of friend.worlds) {
                    const characters: ICharacterViewData[] = [];

                    // Process characters if available
                    if (world.characters && world.characters.length > 0) {
                        for (let i = 0; i < world.characters.length; i++) {
                            const char = world.characters[i];
                            characters.push({
                                name: char.character.name || 'Unnamed Character',
                                isDefault: i === 0 // First character is default
                            });
                        }
                    }

                    worlds.push({
                        worldId: world.worldId,
                        worldName: world.worldName,
                        hostPeerId: world.hostPeerId,
                        isHostedByFriend: world.hostPeerId === friend.peerId,
                        hasCharacters: characters.length > 0,
                        characters
                    });
                }
            }

            friendsArray.push({
                ...friend,
                pendingUnsent: friend.pending === 'unsent',
                pendingDelivered: friend.pending === 'pending',
                presenceOnline: friend.presence === true,
                presenceOffline: friend.presence === false,
                hasWorlds: worlds.length > 0,
                worldCount: worlds.length,
                worlds
            });
        });

        return friendsArray;
    }

    private getBannedPeersData(): any[] {
        if (!this.hollowPeer) {
            return [];
        }

        const friendsManager = this.hollowPeer.getFriendsManager();
        const banList = friendsManager.getAllBannedPeers();

        return Object.keys(banList).map(peerId => {
            const entry = banList[peerId];
            const bannedDate = new Date(entry.bannedAt).toLocaleDateString();
            return {
                peerId: entry.friend.peerId,
                playerName: entry.friend.playerName,
                notes: entry.friend.notes || '',
                bannedAt: entry.bannedAt,
                bannedDate: bannedDate
            };
        });
    }

    private setupElementReferences(): void {
        if (!this.container) return;

        this.backButtonElement = this.container.querySelector(`.${this.config.backButtonClass}`);
    }

    private setupEventHandlers(): void {
        if (!this.container) return;

        // Back button
        if (this.backButtonElement) {
            this.backButtonElement.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                if (this.onBackToMenu) {
                    this.onBackToMenu();
                }
            });
        }

        // Add friend button
        const addFriendBtn = this.container.querySelector('#add-friend-by-peerid-btn');
        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                this.showAddFriendModal();
            });
        }

        // Modal handlers
        const submitBtn = this.container.querySelector('#add-friend-peerid-submit-btn');
        const cancelBtn = this.container.querySelector('#close-add-friend-peerid-modal-btn');

        if (submitBtn) {
            submitBtn.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                await this.handleAddFriend();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                this.hideAddFriendModal();
            });
        }
    }

    private setupFriendCardHandlers(): void {
        if (!this.container) return;

        const friendsList = this.container.querySelector('#friends-list');
        if (!friendsList) return;

        // Use event delegation for friend card interactions
        friendsList.addEventListener('click', async (e: Event) => {
            const target = e.target as HTMLElement;

            // Handle clicking on collapsed card to expand
            const collapsedCard = target.closest('.friend-card-collapsed');
            if (collapsedCard && !target.classList.contains('friend-kill-btn')) {
                await AudioControlUtils.playButtonSound(this.audioManager);
                const friendCard = collapsedCard.closest('.friend-card') as HTMLElement;
                if (friendCard) {
                    this.expandFriendCard(friendCard);
                }
                return;
            }

            // Handle clicking on header to collapse
            const cardHeader = target.closest('.friend-card-header');
            if (cardHeader && !target.classList.contains('friend-collapse-btn')) {
                await AudioControlUtils.playButtonSound(this.audioManager);
                const friendCard = cardHeader.closest('.friend-card') as HTMLElement;
                if (friendCard) {
                    this.collapseFriendCard(friendCard);
                }
                return;
            }

            // Handle collapse button
            if (target.classList.contains('friend-collapse-btn')) {
                await AudioControlUtils.playButtonSound(this.audioManager);
                const friendCard = target.closest('.friend-card') as HTMLElement;
                if (friendCard) {
                    this.collapseFriendCard(friendCard);
                }
                return;
            }

            // Handle kill button (quick remove)
            if (target.classList.contains('friend-kill-btn')) {
                await AudioControlUtils.playButtonSound(this.audioManager);
                const peerId = target.getAttribute('data-friend-id');
                if (peerId && this.hollowPeer) {
                    if (confirm('Remove this friend?')) {
                        this.hollowPeer.removeFriend(peerId);
                        this.logService.log(`Removed friend: ${peerId}`);
                        // Re-render to update the list
                        if (this.container) {
                            await this.render(this.container);
                        }
                    }
                }
                return;
            }

            // Handle remove button in expanded state
            if (target.classList.contains('remove-friend-btn')) {
                await AudioControlUtils.playButtonSound(this.audioManager);
                const peerId = target.getAttribute('data-friend-id');
                if (peerId && this.hollowPeer) {
                    if (confirm('Remove this friend?')) {
                        this.hollowPeer.removeFriend(peerId);
                        this.logService.log(`Removed friend: ${peerId}`);
                        // Re-render to update the list
                        if (this.container) {
                            await this.render(this.container);
                        }
                    }
                }
                return;
            }

            // Handle ban button in expanded state
            if (target.classList.contains('ban-friend-btn')) {
                await AudioControlUtils.playButtonSound(this.audioManager);
                const peerId = target.getAttribute('data-friend-id');
                const friendName = target.getAttribute('data-friend-name');
                if (peerId && friendName && this.hollowPeer) {
                    const confirmMessage = `Are you sure you want to ban ${friendName}? This will remove them from your friends list and prevent future friend requests.`;
                    if (confirm(confirmMessage)) {
                        const friendsManager = this.hollowPeer.getFriendsManager();
                        const friend = friendsManager.getFriend(peerId);
                        if (friend) {
                            friendsManager.banPeer(peerId, friend);
                            this.logService.log(`Banned ${friendName} (${peerId.substring(0, 20)}...)`);
                            // Re-render to update the list
                            if (this.container) {
                                await this.render(this.container);
                            }
                        }
                    }
                }
                return;
            }
        });

        // Handle friend name input changes (blur event for auto-save)
        friendsList.addEventListener('blur', (e: Event) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('friend-name-input')) {
                const input = target as HTMLInputElement;
                const peerId = input.getAttribute('data-friend-id');
                const newName = input.value.trim();

                if (peerId && newName && this.hollowPeer) {
                    // Update friend name in FriendsManager
                    const friendsManager = this.hollowPeer.getFriendsManager();
                    const friend = friendsManager.getAllFriends().get(peerId);
                    if (friend) {
                        friend.playerName = newName;
                        friendsManager.updateFriend(peerId, friend);
                        this.logService.log(`Updated friend name: ${newName}`);
                    }
                }
            }
        }, true); // Use capture phase for blur events
    }

    private setupBannedPeersHandlers(): void {
        if (!this.container) return;

        // Toggle button for expanding/collapsing banned peers section
        const toggleBtn = this.container.querySelector('#banned-peers-toggle-btn');
        const bannedPeersList = this.container.querySelector('#banned-peers-list');

        if (toggleBtn && bannedPeersList) {
            toggleBtn.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                const isExpanded = toggleBtn.getAttribute('data-expanded') === 'true';

                if (isExpanded) {
                    // Collapse - save notes first
                    await this.saveBannedPeerNotes();
                    bannedPeersList.setAttribute('style', 'display: none;');
                    toggleBtn.setAttribute('data-expanded', 'false');
                    toggleBtn.textContent = '▼';
                } else {
                    // Expand
                    bannedPeersList.setAttribute('style', 'display: block;');
                    toggleBtn.setAttribute('data-expanded', 'true');
                    toggleBtn.textContent = '▲';
                }
            });
        }

        // Handle unban button
        const unbanButtons = this.container.querySelectorAll('.unban-peer-btn');
        unbanButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                const peerId = btn.getAttribute('data-peer-id');
                const peerName = btn.getAttribute('data-peer-name');

                if (peerId && peerName && this.hollowPeer) {
                    const confirmMessage = `Unban ${peerName}? They will be able to send you friend requests again.`;
                    if (confirm(confirmMessage)) {
                        const friendsManager = this.hollowPeer.getFriendsManager();
                        friendsManager.unbanPeer(peerId);
                        this.logService.log(`Unbanned ${peerName} (${peerId.substring(0, 20)}...)`);

                        // Re-render to update the list
                        if (this.container) {
                            await this.render(this.container);
                        }
                    }
                }
            });
        });

        // Handle send friend request button
        const sendRequestButtons = this.container.querySelectorAll('.send-friend-request-btn');
        sendRequestButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                const peerId = btn.getAttribute('data-peer-id');
                const peerName = btn.getAttribute('data-peer-name');

                if (peerId && peerName && this.hollowPeer) {
                    const friendsManager = this.hollowPeer.getFriendsManager();
                    const bannedEntry = friendsManager.getBannedPeer(peerId);

                    if (bannedEntry) {
                        // Unban and add as friend with pending flag, preserving notes
                        const friend = { ...bannedEntry.friend, pending: 'unsent' as const };
                        friendsManager.unbanPeer(peerId);
                        friendsManager.addFriend(friend);

                        // Send friend request
                        const myPlayerName = this.hollowPeer.getPlayerName();
                        await this.hollowPeer.sendRequestFriend(peerId, myPlayerName);

                        this.logService.log(`Friend request sent to ${peerName} (${peerId.substring(0, 20)}...)`);

                        // Re-render to update the list
                        if (this.container) {
                            await this.render(this.container);
                        }
                    }
                }
            });
        });

        // Handle banned peer name input changes (blur event for auto-save)
        const nameInputs = this.container.querySelectorAll('.banned-peer-name-input');
        nameInputs.forEach(input => {
            input.addEventListener('blur', () => {
                const inputEl = input as HTMLInputElement;
                const peerId = inputEl.getAttribute('data-peer-id');
                const newName = inputEl.value.trim();

                if (peerId && newName && this.hollowPeer) {
                    const friendsManager = this.hollowPeer.getFriendsManager();
                    const bannedEntry = friendsManager.getBannedPeer(peerId);

                    if (bannedEntry) {
                        bannedEntry.friend.playerName = newName;
                        friendsManager.updateBannedPeer(peerId, bannedEntry.friend);
                        this.logService.log(`Updated banned peer name: ${newName}`);
                    }
                }
            });
        });
    }

    private expandFriendCard(friendCard: HTMLElement): void {
        const collapsed = friendCard.querySelector('.friend-card-collapsed') as HTMLElement;
        const expanded = friendCard.querySelector('.friend-card-expanded') as HTMLElement;
        if (collapsed && expanded) {
            collapsed.style.display = 'none';
            expanded.style.display = 'block';
            friendCard.setAttribute('data-expanded', 'true');
        }
    }

    private collapseFriendCard(friendCard: HTMLElement): void {
        const collapsed = friendCard.querySelector('.friend-card-collapsed') as HTMLElement;
        const expanded = friendCard.querySelector('.friend-card-expanded') as HTMLElement;
        if (collapsed && expanded) {
            collapsed.style.display = 'block';
            expanded.style.display = 'none';
            friendCard.setAttribute('data-expanded', 'false');
        }
    }

    private async initializeMilkdownEditors(): Promise<void> {
        if (!this.container || !this.hollowPeer) return;

        const friendsManager = this.hollowPeer.getFriendsManager();
        const allFriends = friendsManager.getAllFriends();

        // Initialize editor for each friend's notes
        for (const [peerId, friend] of allFriends) {
            const editorContainer = this.container.querySelector(`#friend-notes-${peerId}`) as HTMLElement;
            if (editorContainer) {
                try {
                    const editor = await MilkdownUtils.createEditor(editorContainer, friend.notes || '');
                    this.friendsEditors.set(peerId, editor);

                    // Save notes periodically (Milkdown Crepe doesn't have a blur event)
                    // We'll rely on manual save when the view is destroyed or navigated away
                    // For now, notes auto-save when leaving the expanded card
                } catch (error) {
                    console.error(`Failed to initialize editor for friend ${peerId}:`, error);
                }
            }
        }

        // Initialize editor for each banned peer's notes
        const banList = friendsManager.getAllBannedPeers();
        for (const peerId in banList) {
            const entry = banList[peerId];
            const editorContainer = this.container.querySelector(`#banned-peer-notes-${peerId}`) as HTMLElement;
            if (editorContainer) {
                try {
                    const editor = await MilkdownUtils.createEditor(editorContainer, entry.friend.notes || '');
                    this.bannedPeerEditors.set(peerId, editor);

                    // Auto-save banned peer notes on content change
                    // Note: We'll save when the section is collapsed or on navigation
                } catch (error) {
                    console.error(`Failed to initialize editor for banned peer ${peerId}:`, error);
                }
            }
        }

        // Initialize editor for new friend modal
        const newFriendNotesContainer = this.container.querySelector('#new-friend-notes') as HTMLElement;
        if (newFriendNotesContainer) {
            try {
                this.newFriendNotesEditor = await MilkdownUtils.createEditor(newFriendNotesContainer, '');
            } catch (error) {
                console.error('Failed to initialize new friend notes editor:', error);
            }
        }
    }

    private async saveBannedPeerNotes(): Promise<void> {
        if (!this.hollowPeer) return;

        const friendsManager = this.hollowPeer.getFriendsManager();

        // Save notes from all banned peer editors
        for (const [peerId, editor] of this.bannedPeerEditors) {
            try {
                const markdown = await MilkdownUtils.getMarkdown(editor);
                const bannedEntry = friendsManager.getBannedPeer(peerId);
                if (bannedEntry) {
                    bannedEntry.friend.notes = markdown;
                    friendsManager.updateBannedPeer(peerId, bannedEntry.friend);
                }
            } catch (error) {
                console.error(`Failed to save notes for banned peer ${peerId}:`, error);
            }
        }
    }

    private showAddFriendModal(): void {
        if (!this.container) return;
        const modal = this.container.querySelector('#add-friend-peerid-modal') as HTMLElement;
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    private hideAddFriendModal(): void {
        if (!this.container) return;
        const modal = this.container.querySelector('#add-friend-peerid-modal') as HTMLElement;
        if (modal) {
            modal.style.display = 'none';
            // Clear inputs
            const nameInput = this.container.querySelector('#new-friend-name') as HTMLInputElement;
            const peerIdInput = this.container.querySelector('#new-friend-peerid') as HTMLInputElement;
            if (nameInput) nameInput.value = '';
            if (peerIdInput) peerIdInput.value = '';
            if (this.newFriendNotesEditor) {
                this.newFriendNotesEditor.setMarkdown('');
            }
        }
    }

    /**
     * Validate peer ID format
     * Peer IDs should be base58-encoded strings containing only alphanumeric characters
     */
    private isValidPeerId(peerId: string): boolean {
        // Peer IDs are base58-encoded multihashes
        // They should only contain alphanumeric characters (a-z, A-Z, 0-9)
        // No spaces, colons, or other special characters
        const peerIdRegex = /^[A-Za-z0-9]+$/;
        return peerIdRegex.test(peerId);
    }

    private async handleAddFriend(): Promise<void> {
        if (!this.container || !this.hollowPeer) return;

        const nameInput = this.container.querySelector('#new-friend-name') as HTMLInputElement;
        const peerIdInput = this.container.querySelector('#new-friend-peerid') as HTMLInputElement;

        const friendName = nameInput?.value.trim();
        const friendPeerId = peerIdInput?.value.trim();

        if (!friendName || !friendPeerId) {
            alert('Please enter both name and peer ID');
            return;
        }

        // Validate peer ID format
        if (!this.isValidPeerId(friendPeerId)) {
            alert('Invalid peer ID format. Peer IDs must contain only alphanumeric characters (no spaces or special characters).');
            return;
        }

        // Get notes from editor
        const notes = this.newFriendNotesEditor
            ? this.newFriendNotesEditor.getMarkdown()
            : '';

        // Add friend (sends requestFriend message)
        try {
            await this.hollowPeer.addFriend(friendName, friendPeerId, notes);
            this.logService.log(`Added friend: ${friendName} (${friendPeerId})`);

            // Hide modal and re-render
            this.hideAddFriendModal();
            if (this.container) {
                await this.render(this.container);
            }
        } catch (error) {
            console.error('Error adding friend:', error);
            alert(`Failed to add friend: ${error}`);
        }
    }

    private async createFriendsFallback(): Promise<string> {
        return await templateEngine.renderTemplateFromFile('friends-fallback', {
            errorMessage: 'Failed to load friends view'
        });
    }

    async updateHollowPeer(hollowPeer: HollowPeer): Promise<void> {
        this.hollowPeer = hollowPeer;

        // Re-render the view if it's already rendered
        if (this.container) {
            await this.render(this.container);
        }
    }

    destroy(): void {
        // Destroy all Milkdown editors
        this.friendsEditors.forEach(editor => {
            try {
                editor.destroy();
            } catch (error) {
                console.error('Error destroying friend editor:', error);
            }
        });
        this.friendsEditors.clear();

        this.bannedPeerEditors.forEach(editor => {
            try {
                editor.destroy();
            } catch (error) {
                console.error('Error destroying banned peer editor:', error);
            }
        });
        this.bannedPeerEditors.clear();

        if (this.newFriendNotesEditor) {
            try {
                this.newFriendNotesEditor.destroy();
            } catch (error) {
                console.error('Error destroying new friend editor:', error);
            }
            this.newFriendNotesEditor = null;
        }

        this.backButtonElement = null;
        this.container = null;
    }

    /**
     * getContainer implementation - IView interface
     *
     * Spec: specs/view-management.md
     */
    getContainer(): HTMLElement | null {
        return this.container;
    }

    /**
     * show implementation - IView interface
     *
     * Spec: specs/view-management.md
     */
    show(): void {
        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    /**
     * hide implementation - IView interface
     *
     * Spec: specs/view-management.md
     */
    hide(): void {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    // IEnhancedAudioControlSupport implementation
    public refreshMusicButtonState(): void {
        // Friends view doesn't have a music button, but implement for interface compliance
    }
}
