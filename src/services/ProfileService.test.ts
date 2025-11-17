/**
 * ProfileService Tests
 * Test Design: test-ProfileService.md
 * CRC: crc-ProfileService.md
 * Spec: main.md, storage.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProfileService, IProfile } from './ProfileService.js';

// Mock localStorage and sessionStorage
class MockStorage implements Storage {
    private store: Record<string, string> = {};

    get length(): number {
        return Object.keys(this.store).length;
    }

    clear(): void {
        this.store = {};
    }

    getItem(key: string): string | null {
        return this.store[key] || null;
    }

    setItem(key: string, value: string): void {
        this.store[key] = value;
    }

    removeItem(key: string): void {
        delete this.store[key];
    }

    key(index: number): string | null {
        const keys = Object.keys(this.store);
        return keys[index] || null;
    }
}

describe('ProfileService', () => {
    let profileService: ProfileService;
    let mockLocalStorage: MockStorage;
    let mockSessionStorage: MockStorage;
    let originalLocalStorage: Storage;
    let originalSessionStorage: Storage;

    beforeEach(() => {
        // Create fresh mock storage
        mockLocalStorage = new MockStorage();
        mockSessionStorage = new MockStorage();

        // Save original storage
        originalLocalStorage = globalThis.localStorage;
        originalSessionStorage = globalThis.sessionStorage;

        // Replace with mocks
        Object.defineProperty(globalThis, 'localStorage', {
            value: mockLocalStorage,
            writable: true,
            configurable: true
        });
        Object.defineProperty(globalThis, 'sessionStorage', {
            value: mockSessionStorage,
            writable: true,
            configurable: true
        });

        // Create service (will initialize with default profile)
        profileService = new ProfileService();
    });

    afterEach(() => {
        // Restore original storage
        Object.defineProperty(globalThis, 'localStorage', {
            value: originalLocalStorage,
            writable: true,
            configurable: true
        });
        Object.defineProperty(globalThis, 'sessionStorage', {
            value: originalSessionStorage,
            writable: true,
            configurable: true
        });
    });

    describe('Profile Management', () => {
        it('should create default profile on first initialization', () => {
            const profile = profileService.getCurrentProfile();
            expect(profile.name).toBe('Default');
        });

        it('should get current profile', () => {
            const profile = profileService.getCurrentProfile();
            expect(profile).toBeDefined();
            expect(profile.name).toBe('Default');
        });

        it('should list all profiles', () => {
            const profiles = profileService.getAllProfiles();
            expect(profiles).toHaveLength(1);
            expect(profiles[0].name).toBe('Default');
        });

        it('should create new profile', () => {
            profileService.createProfile('TestProfile');
            const profiles = profileService.getAllProfiles();
            expect(profiles).toHaveLength(2);
            expect(profiles.some(p => p.name === 'TestProfile')).toBe(true);
        });

        it('should switch to different profile', () => {
            profileService.createProfile('ProfileB');
            profileService.setCurrentProfile('ProfileB');
            const current = profileService.getCurrentProfile();
            expect(current.name).toBe('ProfileB');
        });

        it('should delete profile', () => {
            profileService.createProfile('TempProfile');
            const beforeDelete = profileService.getAllProfiles();
            expect(beforeDelete.some(p => p.name === 'TempProfile')).toBe(true);

            const deleted = profileService.deleteProfile('TempProfile');
            expect(deleted).toBe(true);

            const afterDelete = profileService.getAllProfiles();
            expect(afterDelete.some(p => p.name === 'TempProfile')).toBe(false);
        });

        it('should prevent deletion of default profile', () => {
            expect(() => {
                profileService.deleteProfile('Default');
            }).toThrow('Cannot delete default profile');
        });

        it('should switch to default when deleting current profile', () => {
            profileService.createProfile('ActiveProfile');
            profileService.setCurrentProfile('ActiveProfile');
            expect(profileService.getCurrentProfile().name).toBe('ActiveProfile');

            profileService.deleteProfile('ActiveProfile');
            expect(profileService.getCurrentProfile().name).toBe('Default');
        });

        it('should return false when deleting nonexistent profile', () => {
            const deleted = profileService.deleteProfile('NonexistentProfile');
            expect(deleted).toBe(false);
        });

        it('should throw error when switching to nonexistent profile', () => {
            expect(() => {
                profileService.setCurrentProfile('NonexistentProfile');
            }).toThrow('Profile "NonexistentProfile" not found');
        });
    });

    describe('Profile-Scoped Storage', () => {
        it('should store item in current profile', () => {
            profileService.setItem('testKey', 'testValue');
            const value = profileService.getItem('testKey');
            expect(value).toBe('testValue');
        });

        it('should retrieve item from current profile', () => {
            profileService.setItem('key1', 'value1');
            profileService.setItem('key2', 'value2');

            expect(profileService.getItem('key1')).toBe('value1');
            expect(profileService.getItem('key2')).toBe('value2');
        });

        it('should remove item from current profile', () => {
            profileService.setItem('keyToRemove', 'tempValue');
            expect(profileService.getItem('keyToRemove')).toBe('tempValue');

            profileService.removeItem('keyToRemove');
            expect(profileService.getItem('keyToRemove')).toBeNull();
        });

        it('should isolate data between profiles', () => {
            // Store in default profile
            profileService.setItem('sharedKey', 'valueFromDefault');

            // Switch to new profile
            profileService.createProfile('ProfileA');
            profileService.setCurrentProfile('ProfileA');

            // Should not see default profile's data
            expect(profileService.getItem('sharedKey')).toBeNull();
        });

        it('should allow same key with different values in different profiles', () => {
            // Store in default profile
            profileService.setItem('username', 'Alice');

            // Create and switch to ProfileB
            profileService.createProfile('ProfileB');
            profileService.setCurrentProfile('ProfileB');
            profileService.setItem('username', 'Bob');

            // Verify ProfileB value
            expect(profileService.getItem('username')).toBe('Bob');

            // Switch back to default
            profileService.setCurrentProfile('Default');
            expect(profileService.getItem('username')).toBe('Alice');
        });

        it('should not affect other profiles when removing item', () => {
            // Store in default profile
            profileService.setItem('sharedKey', 'valueDefault');

            // Store in ProfileA
            profileService.createProfile('ProfileA');
            profileService.setCurrentProfile('ProfileA');
            profileService.setItem('sharedKey', 'valueA');

            // Remove from ProfileA
            profileService.removeItem('sharedKey');
            expect(profileService.getItem('sharedKey')).toBeNull();

            // Switch back to default, should still have value
            profileService.setCurrentProfile('Default');
            expect(profileService.getItem('sharedKey')).toBe('valueDefault');
        });

        it('should namespace keys with profile prefix', () => {
            profileService.setItem('myKey', 'myValue');

            // Check actual localStorage key
            const namespacedKey = 'Default:myKey';
            expect(mockLocalStorage.getItem(namespacedKey)).toBe('myValue');
        });

        it('should clear all profile data when deleting profile', () => {
            // Create profile and add data
            profileService.createProfile('DataProfile');
            profileService.setCurrentProfile('DataProfile');
            profileService.setItem('key1', 'value1');
            profileService.setItem('key2', 'value2');
            profileService.setItem('key3', 'value3');

            // Verify data exists
            expect(mockLocalStorage.getItem('DataProfile:key1')).toBe('value1');
            expect(mockLocalStorage.getItem('DataProfile:key2')).toBe('value2');

            // Delete profile
            profileService.deleteProfile('DataProfile');

            // Verify all data cleared
            expect(mockLocalStorage.getItem('DataProfile:key1')).toBeNull();
            expect(mockLocalStorage.getItem('DataProfile:key2')).toBeNull();
            expect(mockLocalStorage.getItem('DataProfile:key3')).toBeNull();
        });
    });

    describe('Profile Change Callbacks', () => {
        it('should notify listeners when profile changes', () => {
            const callback = vi.fn();
            profileService.onProfileChange(callback);

            profileService.createProfile('NewProfile');
            profileService.setCurrentProfile('NewProfile');

            expect(callback).toHaveBeenCalledWith({ name: 'NewProfile' });
        });

        it('should notify multiple listeners', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            profileService.onProfileChange(callback1);
            profileService.onProfileChange(callback2);

            profileService.createProfile('ProfileX');
            profileService.setCurrentProfile('ProfileX');

            expect(callback1).toHaveBeenCalled();
            expect(callback2).toHaveBeenCalled();
        });

        it('should handle callback errors gracefully', () => {
            const errorCallback = vi.fn(() => {
                throw new Error('Callback error');
            });
            const successCallback = vi.fn();

            profileService.onProfileChange(errorCallback);
            profileService.onProfileChange(successCallback);

            // Should not throw despite error in first callback
            expect(() => {
                profileService.createProfile('ProfileY');
                profileService.setCurrentProfile('ProfileY');
            }).not.toThrow();

            // Second callback should still execute
            expect(successCallback).toHaveBeenCalled();
        });
    });

    describe('Persistence', () => {
        it('should persist current profile in session storage', () => {
            profileService.createProfile('SessionProfile');
            profileService.setCurrentProfile('SessionProfile');

            // Check session storage
            expect(mockSessionStorage.getItem('__hollow_current_profile__')).toBe('SessionProfile');
        });

        it('should persist profile list in local storage', () => {
            profileService.createProfile('ProfileA');
            profileService.createProfile('ProfileB');

            // Create new instance (simulates page reload)
            const newService = new ProfileService();
            const profiles = newService.getAllProfiles();

            expect(profiles).toHaveLength(3); // Default + A + B
            expect(profiles.some(p => p.name === 'ProfileA')).toBe(true);
            expect(profiles.some(p => p.name === 'ProfileB')).toBe(true);
        });

        it('should restore current profile from session storage on initialization', () => {
            profileService.createProfile('RestoredProfile');
            profileService.setCurrentProfile('RestoredProfile');

            // Create new instance (simulates page reload)
            const newService = new ProfileService();
            expect(newService.getCurrentProfile().name).toBe('RestoredProfile');
        });

        it('should restore data from profile after reload', () => {
            profileService.setItem('persistedKey', 'persistedValue');

            // Create new instance (simulates page reload)
            const newService = new ProfileService();
            expect(newService.getItem('persistedKey')).toBe('persistedValue');
        });
    });

    describe('Migration', () => {
        it('should clear old storage when migrating', () => {
            // Simulate old storage format (data without profile system)
            mockLocalStorage.clear();
            mockLocalStorage.setItem('oldKey1', 'oldValue1');
            mockLocalStorage.setItem('oldKey2', 'oldValue2');

            // Create new service (should trigger migration)
            const migratedService = new ProfileService();

            // Old keys should be cleared, only profile list should exist
            expect(mockLocalStorage.getItem('oldKey1')).toBeNull();
            expect(mockLocalStorage.getItem('oldKey2')).toBeNull();
            expect(mockLocalStorage.getItem('__hollow_profiles__')).toBeDefined();
        });

        it('should create default profile during migration', () => {
            // Clear storage to simulate fresh start
            mockLocalStorage.clear();
            mockSessionStorage.clear();

            // Create service
            const migratedService = new ProfileService();
            const profiles = migratedService.getAllProfiles();

            expect(profiles).toHaveLength(1);
            expect(profiles[0].name).toBe('Default');
        });

        it('should not migrate if profiles already exist', () => {
            // Setup existing profile system
            const existingProfiles = [{ name: 'Default' }, { name: 'ExistingProfile' }];
            mockLocalStorage.setItem('__hollow_profiles__', JSON.stringify(existingProfiles));
            mockLocalStorage.setItem('Default:key1', 'value1');

            // Create service (should not trigger migration)
            const service = new ProfileService();

            // Data should be preserved
            expect(service.getItem('key1')).toBe('value1');
            expect(service.getAllProfiles()).toHaveLength(2);
        });
    });

    describe('Edge Cases', () => {
        it('should reject empty profile name', () => {
            expect(() => {
                profileService.createProfile('');
            }).toThrow('Profile name cannot be empty');

            expect(() => {
                profileService.createProfile('   ');
            }).toThrow('Profile name cannot be empty');
        });

        it('should reject duplicate profile name', () => {
            profileService.createProfile('UniqueProfile');

            expect(() => {
                profileService.createProfile('UniqueProfile');
            }).toThrow('Profile "UniqueProfile" already exists');
        });

        it('should handle special characters in profile name', () => {
            // Service doesn't sanitize, so special chars should work
            profileService.createProfile('Test:Profile');
            const profiles = profileService.getAllProfiles();
            expect(profiles.some(p => p.name === 'Test:Profile')).toBe(true);
        });

        it('should handle unicode in profile name', () => {
            profileService.createProfile('プロファイル'); // Japanese
            profileService.createProfile('프로필'); // Korean

            const profiles = profileService.getAllProfiles();
            expect(profiles.some(p => p.name === 'プロファイル')).toBe(true);
            expect(profiles.some(p => p.name === '프로필')).toBe(true);
        });

        it('should handle very long profile name', () => {
            const longName = 'A'.repeat(1000);
            profileService.createProfile(longName);

            const profiles = profileService.getAllProfiles();
            expect(profiles.some(p => p.name === longName)).toBe(true);
        });

        it('should handle rapid profile switching', () => {
            profileService.createProfile('ProfileA');
            profileService.createProfile('ProfileB');
            profileService.createProfile('ProfileC');

            // Store different values
            profileService.setCurrentProfile('ProfileA');
            profileService.setItem('value', 'A');

            profileService.setCurrentProfile('ProfileB');
            profileService.setItem('value', 'B');

            profileService.setCurrentProfile('ProfileC');
            profileService.setItem('value', 'C');

            // Rapid switching
            profileService.setCurrentProfile('ProfileA');
            expect(profileService.getItem('value')).toBe('A');

            profileService.setCurrentProfile('ProfileB');
            expect(profileService.getItem('value')).toBe('B');

            profileService.setCurrentProfile('ProfileC');
            expect(profileService.getItem('value')).toBe('C');

            profileService.setCurrentProfile('ProfileA');
            expect(profileService.getItem('value')).toBe('A');
        });

        it('should return null for nonexistent key', () => {
            expect(profileService.getItem('nonexistentKey')).toBeNull();
        });

        it('should handle removing nonexistent key', () => {
            // Should not throw
            expect(() => {
                profileService.removeItem('nonexistentKey');
            }).not.toThrow();
        });

        it('should handle JSON parse errors in profile list', () => {
            // Corrupt profile list
            mockLocalStorage.setItem('__hollow_profiles__', 'invalid json');

            // Create new service (should handle gracefully)
            const service = new ProfileService();
            const profiles = service.getAllProfiles();

            // Should create default profile despite corruption
            expect(profiles).toHaveLength(1);
            expect(profiles[0].name).toBe('Default');
        });

        it('should return copy of profile (immutability)', () => {
            const profile1 = profileService.getCurrentProfile();
            const profile2 = profileService.getCurrentProfile();

            expect(profile1).not.toBe(profile2); // Different object instances
            expect(profile1.name).toBe(profile2.name); // Same data
        });

        it('should return copy of profile list (immutability)', () => {
            const profiles1 = profileService.getAllProfiles();
            const profiles2 = profileService.getAllProfiles();

            expect(profiles1).not.toBe(profiles2); // Different arrays
            expect(profiles1[0]).not.toBe(profiles2[0]); // Different objects
            expect(profiles1.length).toBe(profiles2.length);
        });

        it('should fall back to default profile if session profile invalid', () => {
            // Set invalid session profile
            mockSessionStorage.setItem('__hollow_current_profile__', 'InvalidProfile');

            // Create new service
            const service = new ProfileService();

            // Should fall back to default (first profile)
            expect(service.getCurrentProfile().name).toBe('Default');
        });
    });

    describe('Integration Scenarios', () => {
        it('should support complete profile workflow', () => {
            // Create two profiles with different data
            profileService.setItem('character', 'Warrior');

            profileService.createProfile('AltProfile');
            profileService.setCurrentProfile('AltProfile');
            profileService.setItem('character', 'Mage');

            // Verify isolation
            expect(profileService.getItem('character')).toBe('Mage');

            profileService.setCurrentProfile('Default');
            expect(profileService.getItem('character')).toBe('Warrior');

            // Delete alt profile
            profileService.deleteProfile('AltProfile');

            // Verify only default remains
            const profiles = profileService.getAllProfiles();
            expect(profiles).toHaveLength(1);
            expect(profiles[0].name).toBe('Default');
        });

        it('should handle empty storage initialization', () => {
            // Clear everything
            mockLocalStorage.clear();
            mockSessionStorage.clear();

            // Create service from scratch
            const freshService = new ProfileService();

            // Should have default profile
            expect(freshService.getCurrentProfile().name).toBe('Default');
            expect(freshService.getAllProfiles()).toHaveLength(1);
        });

        it('should maintain data consistency across multiple operations', () => {
            // Complex scenario
            profileService.createProfile('P1');
            profileService.createProfile('P2');
            profileService.createProfile('P3');

            // Add data to each
            profileService.setCurrentProfile('P1');
            profileService.setItem('key1', 'P1-value1');
            profileService.setItem('key2', 'P1-value2');

            profileService.setCurrentProfile('P2');
            profileService.setItem('key1', 'P2-value1');
            profileService.setItem('key3', 'P2-value3');

            profileService.setCurrentProfile('P3');
            profileService.setItem('key2', 'P3-value2');
            profileService.setItem('key3', 'P3-value3');

            // Delete P2
            profileService.deleteProfile('P2');

            // Verify P1 and P3 data intact
            profileService.setCurrentProfile('P1');
            expect(profileService.getItem('key1')).toBe('P1-value1');
            expect(profileService.getItem('key2')).toBe('P1-value2');
            expect(profileService.getItem('key3')).toBeNull();

            profileService.setCurrentProfile('P3');
            expect(profileService.getItem('key1')).toBeNull();
            expect(profileService.getItem('key2')).toBe('P3-value2');
            expect(profileService.getItem('key3')).toBe('P3-value3');
        });
    });
});
