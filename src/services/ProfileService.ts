// Profile management service for Hollow World
// Implements profile-based storage isolation as per specs/main.md

export interface IProfile {
    name: string;
}

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

    getCurrentProfile(): IProfile {
        return { ...this.currentProfile };
    }

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

    getAllProfiles(): IProfile[] {
        return this.loadProfiles().map(p => ({ ...p }));
    }

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

    getStorageKey(key: string): string {
        // Add profile prefix to storage key
        return `${this.currentProfile.name}:${key}`;
    }

    getItem(key: string): string | null {
        return localStorage.getItem(this.getStorageKey(key));
    }

    setItem(key: string, value: string): void {
        localStorage.setItem(this.getStorageKey(key), value);
    }

    removeItem(key: string): void {
        localStorage.removeItem(this.getStorageKey(key));
    }

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
