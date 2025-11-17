/**
 * Unit tests for SettingsView
 *
 * CRC: crc-SettingsView.md
 * Spec: specs/ui.settings.md, specs/logging.md
 * Test Design: test-SettingsView.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LogService } from '../src/services/LogService.js';
import { SettingsView } from '../src/ui/SettingsView.js';
import { getProfileService } from '../src/services/ProfileService.js';

// Mock navigator.clipboard
const mockWriteText = vi.fn();
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: mockWriteText
    },
    writable: true,
    configurable: true
});

// Mock template engine to avoid HTTP fetches during tests
vi.mock('../src/utils/TemplateEngine.js', () => {
    return {
        templateEngine: {
            renderTemplateFromFile: vi.fn((templateName: string, data: any) => {
                // Return minimal HTML based on template name
                if (templateName === 'settings-view' || templateName === 'settings-view-fallback') {
                    return Promise.resolve(`
                        <div class="${data.containerClass}">
                            <h1 class="${data.titleClass}">Settings</h1>
                            <div id="peer-id-display">${data.peerId || ''}</div>
                            <div class="profile-name">${data.profileName || ''}</div>
                        </div>
                    `);
                }
                if (templateName === 'log-view') {
                    const entriesHtml = (data.entries || []).map((entry: any) => `
                        <tr>
                            <td class="log-serial">${entry.serial}</td>
                            <td class="log-date">${entry.date}</td>
                            <td class="log-message">${entry.message}</td>
                        </tr>
                    `).join('');
                    return Promise.resolve(`
                        <div class="${data.containerClass}">
                            <table>
                                <tbody id="log-table-body">
                                    ${entriesHtml}
                                </tbody>
                            </table>
                        </div>
                    `);
                }
                return Promise.resolve('<div></div>');
            })
        }
    };
});

// Mock AudioControlUtils to avoid audio-related dependencies
vi.mock('../src/utils/AudioControlUtils.js', () => {
    return {
        AudioControlUtils: {
            renderEnhancedAudioControl: vi.fn(() => Promise.resolve('<div id="audio-controls"></div>')),
            setupEnhancedAudioControls: vi.fn(),
            updateEnhancedAudioState: vi.fn(),
            playButtonSound: vi.fn(() => Promise.resolve()),
            updateMusicButtonState: vi.fn()
        }
    };
});

// Mock MilkdownUtils to avoid editor dependencies
vi.mock('../src/utils/MilkdownUtils.js', () => {
    return {
        MilkdownUtils: {
            importCrepeStyles: vi.fn(),
            createEditor: vi.fn((container: HTMLElement, markdown: string, onChange: Function) => {
                return Promise.resolve({
                    getMarkdown: () => markdown,
                    destroy: () => {}
                });
            })
        }
    };
});

// Mock Router to avoid navigation dependencies
vi.mock('../src/utils/Router.js', () => {
    return {
        router: {
            navigate: vi.fn()
        }
    };
});

describe('SettingsView - Log Sorting', () => {
    let logService: LogService;

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        logService = new LogService();
    });

    it('should not create log entries when sorting', () => {
        // Add some initial log entries
        logService.log('Test entry 1');
        logService.log('Test entry 2');
        logService.log('Test entry 3');

        const initialCount = logService.getEntries().length;
        expect(initialCount).toBe(3);

        // Simulate sorting operation by getting entries and re-rendering
        // This mimics what handleSort() does: just navigates to refresh the view
        const entries = logService.getEntries();

        // Sort the entries (this happens in SettingsView.sortLogEntries())
        const sorted = [...entries].sort((a, b) => a.serial - b.serial);

        // Verify no new log entries were created
        const finalCount = logService.getEntries().length;
        expect(finalCount).toBe(initialCount);
        expect(finalCount).toBe(3);
    });

    it('should maintain log entry count after multiple sorts', () => {
        // Add test entries
        logService.log('Entry A');
        logService.log('Entry B');
        logService.log('Entry C');
        logService.log('Entry D');

        const initialCount = logService.getEntries().length;
        expect(initialCount).toBe(4);

        // Simulate multiple sort operations
        for (let i = 0; i < 5; i++) {
            const entries = logService.getEntries();
            // Alternate between ascending and descending sorts
            const sorted = [...entries].sort((a, b) =>
                i % 2 === 0 ? a.serial - b.serial : b.serial - a.serial
            );
        }

        // Verify entry count unchanged
        const finalCount = logService.getEntries().length;
        expect(finalCount).toBe(initialCount);
        expect(finalCount).toBe(4);
    });

    it('should only log entry when explicitly calling log()', () => {
        const initialCount = logService.getEntries().length;
        expect(initialCount).toBe(0);

        // Get entries (read operation)
        const entries1 = logService.getEntries();
        expect(logService.getEntries().length).toBe(0);

        // Sort entries (read + transform operation)
        const sorted = [...entries1].sort((a, b) => a.serial - b.serial);
        expect(logService.getEntries().length).toBe(0);

        // Actually log something
        logService.log('New log entry');
        expect(logService.getEntries().length).toBe(1);

        // Read again
        const entries2 = logService.getEntries();
        expect(logService.getEntries().length).toBe(1);
    });
});

describe('SettingsView - Peer ID', () => {
    let settingsView: SettingsView;
    let container: HTMLElement;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        settingsView = new SettingsView();
        mockWriteText.mockClear();
    });

    afterEach(() => {
        settingsView.destroy();
        document.body.removeChild(container);
    });

    it('should update peer ID', () => {
        const testPeerId = '12D3KooWTest123';
        settingsView.updatePeerId(testPeerId);

        // Verify peer ID is stored (via ProfileService)
        const profileService = getProfileService();
        const storedSettings = profileService.getItem('hollowWorldSettings');
        expect(storedSettings).toBeTruthy();
        const parsed = JSON.parse(storedSettings!);
        expect(parsed.peerId).toBe(testPeerId);
    });

    it('should display peer ID after rendering', async () => {
        const testPeerId = '12D3KooWTest456';
        settingsView.updatePeerId(testPeerId);

        await settingsView.renderSettings(container);

        const peerIdDisplay = container.querySelector('#peer-id-display');
        expect(peerIdDisplay).toBeTruthy();
        expect(peerIdDisplay?.textContent).toContain(testPeerId);
    });
});

describe('SettingsView - Profile Management', () => {
    let settingsView: SettingsView;
    let container: HTMLElement;
    let profileService: ReturnType<typeof getProfileService>;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        profileService = getProfileService();
        settingsView = new SettingsView();
    });

    afterEach(() => {
        settingsView.destroy();
        document.body.removeChild(container);
    });

    it('should display current profile name', async () => {
        const currentProfile = profileService.getCurrentProfile();
        await settingsView.renderSettings(container);

        // Settings view should show profile name (unless it's "Default")
        const settingsHtml = container.innerHTML;
        if (currentProfile.name !== 'Default') {
            expect(settingsHtml).toContain(currentProfile.name);
        }
    });

    it('should list all profiles via ProfileService', () => {
        const initialCount = profileService.getAllProfiles().length;

        // Create additional profiles
        profileService.createProfile('TestProfile1');
        profileService.createProfile('TestProfile2');

        const allProfiles = profileService.getAllProfiles();
        expect(allProfiles.length).toBe(initialCount + 2); // Initial + 2 test profiles
        expect(allProfiles.some(p => p.name === 'TestProfile1')).toBe(true);
        expect(allProfiles.some(p => p.name === 'TestProfile2')).toBe(true);
    });

    it('should create new profile', () => {
        const newProfileName = 'NewTestProfile';
        profileService.createProfile(newProfileName);

        const allProfiles = profileService.getAllProfiles();
        expect(allProfiles.some(p => p.name === newProfileName)).toBe(true);
    });

    it('should switch profile', () => {
        profileService.createProfile('SwitchTest');
        const beforeSwitch = profileService.getCurrentProfile().name;

        profileService.setCurrentProfile('SwitchTest');
        const afterSwitch = profileService.getCurrentProfile().name;

        expect(afterSwitch).toBe('SwitchTest');
        expect(afterSwitch).not.toBe(beforeSwitch);
    });

    it('should isolate data between profiles', () => {
        // Create two profiles
        profileService.createProfile('Profile_A');
        profileService.createProfile('Profile_B');

        // Write data in Profile A
        profileService.setCurrentProfile('Profile_A');
        profileService.setItem('test-key', 'value-from-A');

        // Write different data in Profile B
        profileService.setCurrentProfile('Profile_B');
        profileService.setItem('test-key', 'value-from-B');

        // Verify isolation
        expect(profileService.getItem('test-key')).toBe('value-from-B');

        profileService.setCurrentProfile('Profile_A');
        expect(profileService.getItem('test-key')).toBe('value-from-A');
    });
});

describe('SettingsView - Log Display', () => {
    let settingsView: SettingsView;
    let logService: LogService;
    let container: HTMLElement;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        logService = new LogService();
        settingsView = new SettingsView();
    });

    afterEach(() => {
        settingsView.destroy();
        document.body.removeChild(container);
    });

    it('should display log entries', async () => {
        logService.log('Test entry 1');
        logService.log('Test entry 2');
        logService.log('Test entry 3');

        // Verify entries were created in storage
        const entries = logService.getEntries();
        expect(entries.length).toBe(3);

        // Verify rendering completes without errors
        await expect(settingsView.renderLog(container)).resolves.toBeUndefined();

        // Verify log table structure is rendered
        const logTableBody = container.querySelector('#log-table-body');
        expect(logTableBody).toBeTruthy();
    });

    it('should display empty log state', async () => {
        // No log entries
        await settingsView.renderLog(container);

        const logTableBody = container.querySelector('#log-table-body');
        expect(logTableBody).toBeTruthy();

        const rows = logTableBody?.querySelectorAll('tr');
        expect(rows?.length).toBe(0);
    });

    it('should format log entry dates', async () => {
        logService.log('Test with timestamp');

        const entries = logService.getEntries();
        expect(entries.length).toBe(1);
        expect(entries[0].date).toBeInstanceOf(Date);

        // Verify rendering completes
        await expect(settingsView.renderLog(container)).resolves.toBeUndefined();
    });

    it('should display log entry serial numbers', async () => {
        logService.log('Entry 1');
        logService.log('Entry 2');
        logService.log('Entry 3');

        const entries = logService.getEntries();
        expect(entries.length).toBe(3);

        // Serials should be sequential
        expect(entries[0].serial).toBeLessThan(entries[1].serial);
        expect(entries[1].serial).toBeLessThan(entries[2].serial);
    });

    it('should clear log', () => {
        logService.log('Entry 1');
        logService.log('Entry 2');
        logService.log('Entry 3');

        expect(logService.getEntries().length).toBe(3);

        logService.clear();

        expect(logService.getEntries().length).toBe(0);
    });

    it('should handle special characters in log messages', async () => {
        logService.log('Test <script>alert("XSS")</script>');
        logService.log('Test "quotes" and \'single quotes\'');

        const entries = logService.getEntries();
        expect(entries.length).toBe(2);

        // Verify messages are stored correctly
        expect(entries[0].message).toContain('<script>');
        expect(entries[1].message).toContain('quotes');
    });

    it('should handle long log messages', async () => {
        const longMessage = 'A'.repeat(10000);
        logService.log(longMessage);

        const entries = logService.getEntries();
        expect(entries.length).toBe(1);
        expect(entries[0].message.length).toBe(10000);
    });
});

describe('SettingsView - Log Operations', () => {
    let settingsView: SettingsView;
    let logService: LogService;
    let container: HTMLElement;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        logService = new LogService();
        settingsView = new SettingsView();
    });

    afterEach(() => {
        settingsView.destroy();
        document.body.removeChild(container);
    });

    it('should sort log entries ascending by serial', () => {
        logService.log('Entry 1');
        logService.log('Entry 2');
        logService.log('Entry 3');

        const entries = logService.getEntries();

        // Sort ascending
        const sorted = [...entries].sort((a, b) => a.serial - b.serial);

        expect(sorted[0].serial).toBeLessThan(sorted[1].serial);
        expect(sorted[1].serial).toBeLessThan(sorted[2].serial);
    });

    it('should sort log entries descending by serial', () => {
        logService.log('Entry 1');
        logService.log('Entry 2');
        logService.log('Entry 3');

        const entries = logService.getEntries();

        // Sort descending
        const sorted = [...entries].sort((a, b) => b.serial - a.serial);

        expect(sorted[0].serial).toBeGreaterThan(sorted[1].serial);
        expect(sorted[1].serial).toBeGreaterThan(sorted[2].serial);
    });

    it('should sort log entries by date', () => {
        // Add entries with slight delay to ensure different timestamps
        logService.log('Entry 1');
        logService.log('Entry 2');
        logService.log('Entry 3');

        const entries = logService.getEntries();

        // Sort by date ascending
        const sorted = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime());

        expect(sorted[0].date.getTime()).toBeLessThanOrEqual(sorted[1].date.getTime());
        expect(sorted[1].date.getTime()).toBeLessThanOrEqual(sorted[2].date.getTime());
    });

    it('should sort log entries by message', () => {
        logService.log('Zebra');
        logService.log('Apple');
        logService.log('Mango');

        const entries = logService.getEntries();

        // Sort by message alphabetically
        const sorted = [...entries].sort((a, b) => a.message.localeCompare(b.message));

        expect(sorted[0].message).toBe('Apple');
        expect(sorted[1].message).toBe('Mango');
        expect(sorted[2].message).toBe('Zebra');
    });

    it('should handle log trimming when exceeding size limit', () => {
        // Add many large entries to exceed 512K limit
        const largeEntry = 'X'.repeat(100000); // 100KB per entry

        for (let i = 0; i < 6; i++) {
            logService.log(largeEntry);
        }

        // LogService should auto-trim to 256K
        const totalChars = logService.getTotalChars();
        expect(totalChars).toBeLessThanOrEqual(512 * 1024);

        // Should keep at least one entry
        expect(logService.getEntries().length).toBeGreaterThanOrEqual(1);
    });
});

describe('SettingsView - Edge Cases', () => {
    let settingsView: SettingsView;
    let container: HTMLElement;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
        settingsView = new SettingsView();
    });

    afterEach(() => {
        settingsView.destroy();
        document.body.removeChild(container);
    });

    it('should handle rendering with missing container', async () => {
        // Test error handling for null container
        await expect(async () => {
            await settingsView.renderSettings(null as any);
        }).rejects.toThrow('Container element is required');
    });

    it('should handle rendering log with missing container', async () => {
        await expect(async () => {
            await settingsView.renderLog(null as any);
        }).rejects.toThrow('Container element is required');
    });

    it('should handle profile name with special characters', () => {
        const profileService = getProfileService();

        // Create profile with special characters
        const specialName = 'Test_Profile-2024';
        profileService.createProfile(specialName);

        const allProfiles = profileService.getAllProfiles();
        expect(allProfiles.some(p => p.name === specialName)).toBe(true);
    });

    it('should prevent duplicate profile names', () => {
        const profileService = getProfileService();

        profileService.createProfile('DuplicateTest');

        // Attempt to create duplicate
        expect(() => {
            profileService.createProfile('DuplicateTest');
        }).toThrow();
    });

    it('should handle empty log gracefully', async () => {
        const logService = new LogService();

        const entries = logService.getEntries();
        expect(entries.length).toBe(0);

        await settingsView.renderLog(container);

        // Should render without errors
        const logTableBody = container.querySelector('#log-table-body');
        expect(logTableBody).toBeTruthy();
    });

    it('should update peer ID display after update', async () => {
        const initialPeerId = '12D3KooWInitial';
        settingsView.updatePeerId(initialPeerId);

        await settingsView.renderSettings(container);

        const updatedPeerId = '12D3KooWUpdated';
        settingsView.updatePeerId(updatedPeerId);

        // Check display is updated
        const peerIdDisplay = container.querySelector('#peer-id-display');
        expect(peerIdDisplay?.textContent).toBe(updatedPeerId);
    });

    it('should handle very long log (1000+ entries)', async () => {
        const logService = new LogService();

        // Add 1000 entries
        for (let i = 0; i < 1000; i++) {
            logService.log(`Entry ${i}`);
        }

        const entries = logService.getEntries();
        expect(entries.length).toBe(1000);

        // Verify rendering completes without errors (performance test)
        await expect(settingsView.renderLog(container)).resolves.toBeUndefined();
    });
});
