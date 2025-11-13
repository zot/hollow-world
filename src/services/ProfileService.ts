/**
 * Profile Service - Profile-based storage isolation
 * Implements profile-based storage isolation for multi-profile support
 *
 * CRC: specs-crc/crc-ProfileService.md
 * Spec: specs/main.md, specs/storage.md
 * Sequences: specs-crc/seq-save-character.md, specs-crc/seq-load-character.md, specs-crc/seq-log-message.md
 */

/**
 * IProfile - Profile data structure
 * CRC: specs-crc/crc-ProfileService.md
 */
export interface IProfile {
    name: string;
}

/**
 * IProfileService - Profile management interface
 * CRC: specs-crc/crc-ProfileService.md
 */
export interface IProfileService {
    getCurrentProfile(): IProfile;
    setCurrentProfile(profileName: string): void;
    getAllProfiles(): IProfile[];
    createProfile(name: string): void;
    deleteProfile(name: string): boolean;
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

const PROFILES_LIST_KEY = '__hollow_profiles__';
const CURRENT_PROFILE_SESSION_KEY = '__hollow_current_profile__';
const DEFAULT_PROFILE_NAME = 'Default';

/**
 * ProfileService - Profile-based storage isolation and management
 * CRC: specs-crc/crc-ProfileService.md
 * Spec: specs/storage.md, specs/main.md
 * Sequences: specs-crc/seq-save-character.md, specs-crc/seq-load-character.md, specs-crc/seq-log-message.md
 */
export class ProfileService implements IProfileService {
    private currentProfile: IProfile;
    private onProfileChangeCallbacks: Array<(profile: IProfile) => void> = [];

    constructor() {
        // Check if we need to migrate old storage (storage without profiles)
        this.migrateOldStorageIfNeeded();

        // Load or create profiles
        const profiles = this.loadProfiles();

        // Get current profile from session storage (not persisted across sessions)
        const sessionProfile = sessionStorage.getItem(CURRENT_PROFILE_SESSION_KEY);
        if (sessionProfile && profiles.some(p => p.name === sessionProfile)) {
            this.currentProfile = { name: sessionProfile };
        } else {
            // Default to first profile or create default
            if (profiles.length === 0) {
                this.createProfile(DEFAULT_PROFILE_NAME);
                this.currentProfile = { name: DEFAULT_PROFILE_NAME };
            } else {
                this.currentProfile = profiles[0];
            }
            sessionStorage.setItem(CURRENT_PROFILE_SESSION_KEY, this.currentProfile.name);
        }
    }

    private migrateOldStorageIfNeeded(): void {
        // Check if there's old storage (storage exists but no profiles list)
        const hasOldStorage = localStorage.length > 0;
        const hasProfiles = localStorage.getItem(PROFILES_LIST_KEY) !== null;

        if (hasOldStorage && !hasProfiles) {
            console.log('🔄 Migrating old storage to profile-based storage...');
            // Remove all old storage
            localStorage.clear();
            console.log('✅ Old storage cleared for profile migration');
        }

        // If storage is empty, create default profile
        if (localStorage.length === 0 || !hasProfiles) {
            const defaultProfiles: IProfile[] = [{ name: DEFAULT_PROFILE_NAME }];
            localStorage.setItem(PROFILES_LIST_KEY, JSON.stringify(defaultProfiles));
            console.log('✅ Default profile created');
        }
    }

    private loadProfiles(): IProfile[] {
        const profilesJson = localStorage.getItem(PROFILES_LIST_KEY);
        if (!profilesJson) {
            return [];
        }
        try {
            return JSON.parse(profilesJson) as IProfile[];
        } catch (error) {
            console.error('Failed to load profiles:', error);
            return [];
        }
    }

    private saveProfiles(profiles: IProfile[]): void {
        localStorage.setItem(PROFILES_LIST_KEY, JSON.stringify(profiles));
    }

    /**
     * Get current active profile
     *
     * CRC: specs-crc/crc-ProfileService.md
     */
    getCurrentProfile(): IProfile {
        return { ...this.currentProfile };
    }

    /**
     * Switch to a different profile
     *
     * CRC: specs-crc/crc-ProfileService.md
     */
    setCurrentProfile(profileName: string): void {
        const profiles = this.loadProfiles();
        const profile = profiles.find(p => p.name === profileName);

        if (!profile) {
            throw new Error(`Profile "${profileName}" not found`);
        }

        this.currentProfile = profile;
        sessionStorage.setItem(CURRENT_PROFILE_SESSION_KEY, profileName);

        // Notify all listeners
        this.notifyProfileChange(profile);

        console.log(`🔄 Switched to profile: ${profileName}`);
    }

    /**
     * Get list of all profiles
     *
     * CRC: specs-crc/crc-ProfileService.md
     */
    getAllProfiles(): IProfile[] {
        return this.loadProfiles().map(p => ({ ...p }));
    }

    /**
     * Create a new profile
     *
     * CRC: specs-crc/crc-ProfileService.md
     */
    createProfile(name: string): void {
        if (!name.trim()) {
            throw new Error('Profile name cannot be empty');
        }

        const profiles = this.loadProfiles();

        if (profiles.some(p => p.name === name)) {
            throw new Error(`Profile "${name}" already exists`);
        }

        profiles.push({ name });
        this.saveProfiles(profiles);

        console.log(`✅ Profile created: ${name}`);
    }

    /**
     * Delete a profile and all its data
     *
     * CRC: specs-crc/crc-ProfileService.md
     */
    deleteProfile(name: string): boolean {
        if (name === DEFAULT_PROFILE_NAME) {
            throw new Error('Cannot delete default profile');
        }

        const profiles = this.loadProfiles();
        const index = profiles.findIndex(p => p.name === name);

        if (index === -1) {
            return false;
        }

        // If deleting current profile, switch to default
        if (this.currentProfile.name === name) {
            this.setCurrentProfile(DEFAULT_PROFILE_NAME);
        }

        // Remove profile
        profiles.splice(index, 1);
        this.saveProfiles(profiles);

        // Clear all storage for this profile
        this.clearProfileStorage(name);

        console.log(`✅ Profile deleted: ${name}`);
        return true;
    }

    private clearProfileStorage(profileName: string): void {
        const prefix = `${profileName}:`;
        const keysToRemove: string[] = [];

        // Find all keys for this profile
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keysToRemove.push(key);
            }
        }

        // Remove them
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    /**
     * getStorageKey implementation
     *
     * CRC: specs-crc/crc-ProfileService.md
     */
    getStorageKey(key: string): string {
        // Add profile prefix to storage key
        return `${this.currentProfile.name}:${key}`;
    }

    /**
     * Get item from profile-scoped storage
     *
     * CRC: specs-crc/crc-ProfileService.md
     * Sequences:
     * - specs-crc/seq-load-character.md (lines 29-38)
     * - specs-crc/seq-save-character.md (lines 68-78)
     */
    getItem(key: string): string | null {
        return localStorage.getItem(this.getStorageKey(key));
    }

    /**
     * Set item in profile-scoped storage
     *
     * CRC: specs-crc/crc-ProfileService.md
     * Sequences:
     * - specs-crc/seq-save-character.md (lines 84-94)
     * - specs-crc/seq-log-message.md (lines 51-61)
     */
    setItem(key: string, value: string): void {
        localStorage.setItem(this.getStorageKey(key), value);
    }

    /**
     * Remove item from profile-scoped storage
     *
     * CRC: specs-crc/crc-ProfileService.md
     */
    removeItem(key: string): void {
        localStorage.removeItem(this.getStorageKey(key));
    }

    /**
     * Register callback for profile changes
     */
    onProfileChange(callback: (profile: IProfile) => void): void {
        this.onProfileChangeCallbacks.push(callback);
    }

    private notifyProfileChange(profile: IProfile): void {
        this.onProfileChangeCallbacks.forEach(callback => {
            try {
                callback(profile);
            } catch (error) {
                console.error('Error in profile change callback:', error);
            }
        });
    }
}

// Singleton instance
let profileServiceInstance: ProfileService | null = null;

export function getProfileService(): ProfileService {
    if (!profileServiceInstance) {
        profileServiceInstance = new ProfileService();
    }
    return profileServiceInstance;
}
