/**
 * Local Storage Provider - Storage abstraction (Dependency Inversion Principle)
 * Supports profile-aware storage keys
 */

import type { IStorageProvider } from './types';

export class LocalStorageProvider implements IStorageProvider {
    private profileService?: any; // IProfileService - avoiding circular dependency

    constructor(profileService?: any) {
        this.profileService = profileService;
    }

    private getKey(key: string): string {
        if (this.profileService) {
            return this.profileService.getStorageKey(key);
        }
        return key;
    }

    async save(key: string, data: any): Promise<void> {
        try {
            const storageKey = this.getKey(key);
            localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (error) {
            console.warn(`Failed to save ${key}:`, error);
            throw new Error(`Storage save failed: ${error}`);
        }
    }

    async load<T>(key: string): Promise<T | null> {
        try {
            const storageKey = this.getKey(key);
            const stored = localStorage.getItem(storageKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.warn(`Failed to load ${key}:`, error);
            return null;
        }
    }
}
