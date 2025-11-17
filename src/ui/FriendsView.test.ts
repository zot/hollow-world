/**
 * Unit tests for FriendsView
 *
 * CRC: crc-FriendsView.md
 * Spec: specs/ui.friends.md, specs/friends.md, specs/p2p.md
 * Test Design: test-FriendsView.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FriendsView } from './FriendsView.js';
import type { IFriend } from '../p2p/types.js';

// Mock template engine to avoid HTTP fetches during tests
vi.mock('../utils/TemplateEngine.js', () => {
    return {
        templateEngine: {
            renderTemplateFromFile: vi.fn((templateName: string, data: any) => {
                if (templateName === 'friends-view') {
                    const friendsHtml = (data.friends || []).map((friend: any) => `
                        <div class="friend-card" data-peer-id="${friend.peerId}">
                            <div class="friend-card-collapsed" style="display: block;">
                                <span class="friend-name">${friend.playerName}</span>
                                <button class="friend-kill-btn" data-friend-id="${friend.peerId}">💀</button>
                            </div>
                            <div class="friend-card-expanded" style="display: none;">
                                <div class="friend-card-header">
                                    <input class="friend-name-input" data-friend-id="${friend.peerId}" value="${friend.playerName}" />
                                    <button class="friend-collapse-btn">▼</button>
                                </div>
                                <div class="friend-notes" id="friend-notes-${friend.peerId}"></div>
                                <button class="remove-friend-btn" data-friend-id="${friend.peerId}">Remove</button>
                                <button class="ban-friend-btn" data-friend-id="${friend.peerId}" data-friend-name="${friend.playerName}">Ban</button>
                            </div>
                        </div>
                    `).join('');

                    return Promise.resolve(`
                        <div class="${data.containerClass}">
                            <button id="friends-home-btn">Home</button>
                            <button id="add-friend-by-peerid-btn">Add Friend</button>
                            <div id="friends-list">${friendsHtml}</div>
                            ${data.noFriends ? '<div class="no-friends">No friends yet</div>' : ''}
                            <div id="add-friend-peerid-modal" style="display: none;">
                                <input id="new-friend-name" />
                                <input id="new-friend-peerid" />
                                <div id="new-friend-notes"></div>
                                <button id="add-friend-peerid-submit-btn">Add</button>
                                <button id="close-add-friend-peerid-modal-btn">Cancel</button>
                            </div>
                            <div id="banned-peers-section">
                                <button id="banned-peers-toggle-btn" data-expanded="false">▼</button>
                                <div id="banned-peers-list" style="display: none;"></div>
                            </div>
                        </div>
                    `);
                }
                return Promise.resolve('<div></div>');
            })
        }
    };
});

// Mock AudioControlUtils
vi.mock('../utils/AudioControlUtils.js', () => {
    return {
        AudioControlUtils: {
            playButtonSound: vi.fn(() => Promise.resolve()),
            renderEnhancedAudioControl: vi.fn(() => Promise.resolve('<div></div>')),
            setupEnhancedAudioControls: vi.fn(),
            updateEnhancedAudioState: vi.fn()
        }
    };
});

// Mock MilkdownUtils
vi.mock('../utils/MilkdownUtils.js', () => {
    return {
        MilkdownUtils: {
            createEditor: vi.fn((container: HTMLElement, markdown: string) => {
                return Promise.resolve({
                    getMarkdown: () => markdown,
                    setMarkdown: (md: string) => {},
                    destroy: () => {}
                });
            }),
            getMarkdown: vi.fn((editor: any) => Promise.resolve(editor.getMarkdown()))
        }
    };
});

// Mock Router
vi.mock('../utils/Router.js', () => {
    return {
        router: {
            navigate: vi.fn()
        }
    };
});

// Mock HollowPeer
class MockFriendsManager {
    private friends: Map<string, IFriend> = new Map();
    private bannedPeers: Record<string, any> = {};

    getAllFriends(): Map<string, IFriend> {
        return this.friends;
    }

    getFriend(peerId: string): IFriend | undefined {
        return this.friends.get(peerId);
    }

    addFriend(friend: IFriend): void {
        this.friends.set(friend.peerId, friend);
    }

    updateFriend(peerId: string, friend: IFriend): void {
        this.friends.set(peerId, friend);
    }

    removeFriend(peerId: string): void {
        this.friends.delete(peerId);
    }

    banPeer(peerId: string, friend: IFriend): void {
        this.bannedPeers[peerId] = {
            friend,
            bannedAt: new Date().toISOString()
        };
        this.friends.delete(peerId);
    }

    unbanPeer(peerId: string): void {
        delete this.bannedPeers[peerId];
    }

    getBannedPeer(peerId: string): any {
        return this.bannedPeers[peerId];
    }

    getAllBannedPeers(): Record<string, any> {
        return this.bannedPeers;
    }

    updateBannedPeer(peerId: string, friend: IFriend): void {
        if (this.bannedPeers[peerId]) {
            this.bannedPeers[peerId].friend = friend;
        }
    }
}

class MockHollowPeer {
    private friendsManager: MockFriendsManager;
    private peerId: string;
    private playerName: string;

    constructor(peerId: string = '12D3KooWTestPeer', playerName: string = 'Test Player') {
        this.friendsManager = new MockFriendsManager();
        this.peerId = peerId;
        this.playerName = playerName;
    }

    getFriendsManager(): MockFriendsManager {
        return this.friendsManager;
    }

    getPeerId(): string {
        return this.peerId;
    }

    getPlayerName(): string {
        return this.playerName;
    }

    async addFriend(name: string, peerId: string, notes: string = '', pending?: 'unsent' | 'pending', sendRequest: boolean = true): Promise<void> {
        const friend: IFriend = {
            peerId,
            playerName: name,
            notes,
            worlds: [],
            pending,
            presence: false
        };
        this.friendsManager.addFriend(friend);
    }

    removeFriend(peerId: string): void {
        this.friendsManager.removeFriend(peerId);
    }

    async sendRequestFriend(peerId: string, playerName: string): Promise<void> {
        // Mock implementation
    }
}

describe('FriendsView - Friend List Rendering', () => {
    let friendsView: FriendsView;
    let container: HTMLElement;
    let mockHollowPeer: MockHollowPeer;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        mockHollowPeer = new MockHollowPeer();
        friendsView = new FriendsView(undefined, undefined, mockHollowPeer as any);
    });

    afterEach(() => {
        friendsView.destroy();
        document.body.removeChild(container);
    });

    it('should render empty friends list', async () => {
        await friendsView.render(container);

        const friendsList = container.querySelector('#friends-list');
        expect(friendsList).toBeTruthy();

        const noFriendsMessage = container.querySelector('.no-friends');
        expect(noFriendsMessage).toBeTruthy();
        expect(noFriendsMessage?.textContent).toContain('No friends yet');
    });

    it('should render friends list with friends', async () => {
        // Add test friends
        await mockHollowPeer.addFriend('Alice', '12D3KooWAlice', 'Friend notes');
        await mockHollowPeer.addFriend('Bob', '12D3KooWBob', '');

        await friendsView.render(container);

        const friendCards = container.querySelectorAll('.friend-card');
        expect(friendCards.length).toBe(2);
    });

    it('should display friend names correctly', async () => {
        await mockHollowPeer.addFriend('Charlie', '12D3KooWCharlie', '');

        await friendsView.render(container);

        const friendName = container.querySelector('.friend-name');
        expect(friendName?.textContent).toBe('Charlie');
    });

    it('should render friend card in collapsed state initially', async () => {
        await mockHollowPeer.addFriend('David', '12D3KooWDavid', '');

        await friendsView.render(container);

        const collapsed = container.querySelector('.friend-card-collapsed') as HTMLElement;
        const expanded = container.querySelector('.friend-card-expanded') as HTMLElement;

        expect(collapsed?.style.display).toBe('block');
        expect(expanded?.style.display).toBe('none');
    });

    it('should render add friend button', async () => {
        await friendsView.render(container);

        const addFriendBtn = container.querySelector('#add-friend-by-peerid-btn');
        expect(addFriendBtn).toBeTruthy();
        expect(addFriendBtn?.textContent).toBe('Add Friend');
    });
});

describe('FriendsView - Friend Management', () => {
    let friendsView: FriendsView;
    let container: HTMLElement;
    let mockHollowPeer: MockHollowPeer;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        mockHollowPeer = new MockHollowPeer();
        friendsView = new FriendsView(undefined, undefined, mockHollowPeer as any);
    });

    afterEach(() => {
        friendsView.destroy();
        document.body.removeChild(container);
    });

    it('should add friend via HollowPeer', async () => {
        await mockHollowPeer.addFriend('Eve', '12D3KooWEve', 'Test notes');

        const friendsManager = mockHollowPeer.getFriendsManager();
        const friend = friendsManager.getFriend('12D3KooWEve');

        expect(friend).toBeTruthy();
        expect(friend?.playerName).toBe('Eve');
        expect(friend?.notes).toBe('Test notes');
    });

    it('should remove friend', async () => {
        await mockHollowPeer.addFriend('Frank', '12D3KooWFrank', '');

        let friendsManager = mockHollowPeer.getFriendsManager();
        expect(friendsManager.getFriend('12D3KooWFrank')).toBeTruthy();

        mockHollowPeer.removeFriend('12D3KooWFrank');

        expect(friendsManager.getFriend('12D3KooWFrank')).toBeUndefined();
    });

    it('should update friend name', async () => {
        await mockHollowPeer.addFriend('Grace', '12D3KooWGrace', '');

        const friendsManager = mockHollowPeer.getFriendsManager();
        const friend = friendsManager.getFriend('12D3KooWGrace');

        if (friend) {
            friend.playerName = 'Grace Updated';
            friendsManager.updateFriend('12D3KooWGrace', friend);
        }

        const updated = friendsManager.getFriend('12D3KooWGrace');
        expect(updated?.playerName).toBe('Grace Updated');
    });

    it('should ban peer', async () => {
        await mockHollowPeer.addFriend('Henry', '12D3KooWHenry', 'Notes');

        const friendsManager = mockHollowPeer.getFriendsManager();
        const friend = friendsManager.getFriend('12D3KooWHenry');

        if (friend) {
            friendsManager.banPeer('12D3KooWHenry', friend);
        }

        // Should be removed from friends
        expect(friendsManager.getFriend('12D3KooWHenry')).toBeUndefined();

        // Should be in banned list
        const bannedPeer = friendsManager.getBannedPeer('12D3KooWHenry');
        expect(bannedPeer).toBeTruthy();
        expect(bannedPeer.friend.playerName).toBe('Henry');
    });

    it('should unban peer', async () => {
        await mockHollowPeer.addFriend('Ivy', '12D3KooWIvy', '');

        const friendsManager = mockHollowPeer.getFriendsManager();
        const friend = friendsManager.getFriend('12D3KooWIvy');

        if (friend) {
            friendsManager.banPeer('12D3KooWIvy', friend);
        }

        expect(friendsManager.getBannedPeer('12D3KooWIvy')).toBeTruthy();

        friendsManager.unbanPeer('12D3KooWIvy');

        expect(friendsManager.getBannedPeer('12D3KooWIvy')).toBeUndefined();
    });
});

describe('FriendsView - Add Friend Modal', () => {
    let friendsView: FriendsView;
    let container: HTMLElement;
    let mockHollowPeer: MockHollowPeer;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        mockHollowPeer = new MockHollowPeer();
        friendsView = new FriendsView(undefined, undefined, mockHollowPeer as any);
    });

    afterEach(() => {
        friendsView.destroy();
        document.body.removeChild(container);
    });

    it('should render add friend modal', async () => {
        await friendsView.render(container);

        const modal = container.querySelector('#add-friend-peerid-modal');
        expect(modal).toBeTruthy();
    });

    it('should have modal hidden initially', async () => {
        await friendsView.render(container);

        const modal = container.querySelector('#add-friend-peerid-modal') as HTMLElement;
        expect(modal?.style.display).toBe('none');
    });

    it('should have name and peer ID inputs in modal', async () => {
        await friendsView.render(container);

        const nameInput = container.querySelector('#new-friend-name');
        const peerIdInput = container.querySelector('#new-friend-peerid');

        expect(nameInput).toBeTruthy();
        expect(peerIdInput).toBeTruthy();
    });

    it('should have submit and cancel buttons', async () => {
        await friendsView.render(container);

        const submitBtn = container.querySelector('#add-friend-peerid-submit-btn');
        const cancelBtn = container.querySelector('#close-add-friend-peerid-modal-btn');

        expect(submitBtn).toBeTruthy();
        expect(cancelBtn).toBeTruthy();
    });
});

describe('FriendsView - Peer ID Validation', () => {
    let friendsView: FriendsView;
    let mockHollowPeer: MockHollowPeer;

    beforeEach(() => {
        mockHollowPeer = new MockHollowPeer();
        friendsView = new FriendsView(undefined, undefined, mockHollowPeer as any);
    });

    afterEach(() => {
        friendsView.destroy();
    });

    it('should accept valid peer IDs (alphanumeric)', () => {
        // Access private method via reflection for testing
        const isValid = (friendsView as any).isValidPeerId('12D3KooWTestValidPeer123');
        expect(isValid).toBe(true);
    });

    it('should reject peer IDs with spaces', () => {
        const isValid = (friendsView as any).isValidPeerId('12D3KooW Test Peer');
        expect(isValid).toBe(false);
    });

    it('should reject peer IDs with special characters', () => {
        const isValid = (friendsView as any).isValidPeerId('12D3KooW:TestPeer');
        expect(isValid).toBe(false);
    });

    it('should reject peer IDs with colons', () => {
        const isValid = (friendsView as any).isValidPeerId('/ip4/127.0.0.1/tcp/4001/p2p/12D3KooW...');
        expect(isValid).toBe(false);
    });

    it('should accept base58 characters', () => {
        // Base58 uses: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
        const isValid = (friendsView as any).isValidPeerId('QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N');
        expect(isValid).toBe(true);
    });
});

describe('FriendsView - Friend Data', () => {
    let friendsView: FriendsView;
    let container: HTMLElement;
    let mockHollowPeer: MockHollowPeer;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        mockHollowPeer = new MockHollowPeer();
        friendsView = new FriendsView(undefined, undefined, mockHollowPeer as any);
    });

    afterEach(() => {
        friendsView.destroy();
        document.body.removeChild(container);
    });

    it('should retrieve friends data', async () => {
        await mockHollowPeer.addFriend('Jack', '12D3KooWJack', 'Jack notes');
        await mockHollowPeer.addFriend('Kate', '12D3KooWKate', 'Kate notes');

        const friendsData = (friendsView as any).getFriendsData();

        expect(friendsData.length).toBe(2);
        expect(friendsData[0].playerName).toBe('Jack');
        expect(friendsData[1].playerName).toBe('Kate');
    });

    it('should include peer ID in friends data', async () => {
        await mockHollowPeer.addFriend('Leo', '12D3KooWLeo', '');

        const friendsData = (friendsView as any).getFriendsData();

        expect(friendsData[0].peerId).toBe('12D3KooWLeo');
    });

    it('should include notes in friends data', async () => {
        await mockHollowPeer.addFriend('Maya', '12D3KooWMaya', 'Important friend');

        const friendsData = (friendsView as any).getFriendsData();

        expect(friendsData[0].notes).toBe('Important friend');
    });

    it('should handle friends with pending status', async () => {
        await mockHollowPeer.addFriend('Nina', '12D3KooWNina', '', 'unsent');

        const friendsData = (friendsView as any).getFriendsData();

        expect(friendsData[0].pending).toBe('unsent');
        expect(friendsData[0].pendingUnsent).toBe(true);
    });

    it('should handle friends with presence', async () => {
        const friendsManager = mockHollowPeer.getFriendsManager();
        const friend: IFriend = {
            peerId: '12D3KooWOliver',
            playerName: 'Oliver',
            notes: '',
            worlds: [],
            presence: true
        };
        friendsManager.addFriend(friend);

        const friendsData = (friendsView as any).getFriendsData();

        expect(friendsData[0].presenceOnline).toBe(true);
        expect(friendsData[0].presenceOffline).toBe(false);
    });
});

describe('FriendsView - Banned Peers', () => {
    let friendsView: FriendsView;
    let container: HTMLElement;
    let mockHollowPeer: MockHollowPeer;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        mockHollowPeer = new MockHollowPeer();
        friendsView = new FriendsView(undefined, undefined, mockHollowPeer as any);
    });

    afterEach(() => {
        friendsView.destroy();
        document.body.removeChild(container);
    });

    it('should retrieve banned peers data', async () => {
        await mockHollowPeer.addFriend('Paula', '12D3KooWPaula', 'Banned peer');

        const friendsManager = mockHollowPeer.getFriendsManager();
        const friend = friendsManager.getFriend('12D3KooWPaula');

        if (friend) {
            friendsManager.banPeer('12D3KooWPaula', friend);
        }

        const bannedData = (friendsView as any).getBannedPeersData();

        expect(bannedData.length).toBe(1);
        expect(bannedData[0].playerName).toBe('Paula');
        expect(bannedData[0].peerId).toBe('12D3KooWPaula');
    });

    it('should include ban timestamp', async () => {
        await mockHollowPeer.addFriend('Quinn', '12D3KooWQuinn', '');

        const friendsManager = mockHollowPeer.getFriendsManager();
        const friend = friendsManager.getFriend('12D3KooWQuinn');

        if (friend) {
            friendsManager.banPeer('12D3KooWQuinn', friend);
        }

        const bannedData = (friendsView as any).getBannedPeersData();

        expect(bannedData[0].bannedAt).toBeTruthy();
        expect(bannedData[0].bannedDate).toBeTruthy();
    });

    it('should render banned peers section', async () => {
        await friendsView.render(container);

        const bannedSection = container.querySelector('#banned-peers-section');
        expect(bannedSection).toBeTruthy();
    });

    it('should have banned peers toggle button', async () => {
        await friendsView.render(container);

        const toggleBtn = container.querySelector('#banned-peers-toggle-btn');
        expect(toggleBtn).toBeTruthy();
        expect(toggleBtn?.getAttribute('data-expanded')).toBe('false');
    });
});

describe('FriendsView - Edge Cases', () => {
    let friendsView: FriendsView;
    let container: HTMLElement;
    let mockHollowPeer: MockHollowPeer;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        mockHollowPeer = new MockHollowPeer();
        friendsView = new FriendsView(undefined, undefined, mockHollowPeer as any);
    });

    afterEach(() => {
        friendsView.destroy();
        document.body.removeChild(container);
    });

    it('should handle rendering with no HollowPeer', async () => {
        const viewWithoutPeer = new FriendsView();

        await expect(viewWithoutPeer.render(container)).resolves.toBeUndefined();

        const noFriendsMessage = container.querySelector('.no-friends');
        expect(noFriendsMessage).toBeTruthy();

        viewWithoutPeer.destroy();
    });

    it('should handle empty friends list', async () => {
        const friendsData = (friendsView as any).getFriendsData();

        expect(friendsData.length).toBe(0);
    });

    it('should handle empty banned peers list', async () => {
        const bannedData = (friendsView as any).getBannedPeersData();

        expect(bannedData.length).toBe(0);
    });

    it('should update HollowPeer reference', async () => {
        await friendsView.render(container);

        const newMockPeer = new MockHollowPeer('12D3KooWNewPeer', 'New Player');
        await friendsView.updateHollowPeer(newMockPeer as any);

        // Verify the view updated
        expect(friendsView['hollowPeer']).toBe(newMockPeer);
    });

    it('should handle special characters in friend names', async () => {
        await mockHollowPeer.addFriend('Test <script>alert("XSS")</script>', '12D3KooWTest', '');

        const friendsData = (friendsView as any).getFriendsData();

        expect(friendsData[0].playerName).toContain('<script>');
    });

    it('should handle very long peer IDs', async () => {
        const longPeerId = 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5NVeryLongPeerIDForTesting';
        await mockHollowPeer.addFriend('Long ID', longPeerId, '');

        const friendsData = (friendsView as any).getFriendsData();

        expect(friendsData[0].peerId).toBe(longPeerId);
    });

    it('should handle friends with empty notes', async () => {
        await mockHollowPeer.addFriend('Ryan', '12D3KooWRyan', '');

        const friendsData = (friendsView as any).getFriendsData();

        expect(friendsData[0].notes).toBe('');
    });

    it('should refresh view without errors', async () => {
        await mockHollowPeer.addFriend('Sara', '12D3KooWSara', '');
        await friendsView.render(container);

        await expect(friendsView.refreshView()).resolves.toBeUndefined();
    });

    it('should handle destroy without errors', () => {
        expect(() => friendsView.destroy()).not.toThrow();
    });
});

describe('FriendsView - Interface Compliance', () => {
    let friendsView: FriendsView;
    let container: HTMLElement;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        friendsView = new FriendsView();
    });

    afterEach(() => {
        friendsView.destroy();
        document.body.removeChild(container);
    });

    it('should implement getContainer()', async () => {
        expect(friendsView.getContainer()).toBeNull();

        await friendsView.render(container);

        expect(friendsView.getContainer()).toBe(container);
    });

    it('should implement show()', async () => {
        await friendsView.render(container);

        container.style.display = 'none';
        friendsView.show();

        expect(container.style.display).toBe('block');
    });

    it('should implement hide()', async () => {
        await friendsView.render(container);

        friendsView.hide();

        expect(container.style.display).toBe('none');
    });

    it('should implement refreshMusicButtonState()', () => {
        // Should not throw
        expect(() => friendsView.refreshMusicButtonState()).not.toThrow();
    });
});
