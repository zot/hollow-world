/**
 * Log Service - Application logging with profile-scoped persistence
 * Handles log entries with serial numbers and automatic trimming
 *
 * CRC: crc-LogService.md
 * Spec: logging.md
 * Sequences: seq-log-message.md
 */

import { getProfileService } from './ProfileService.js';

/**
 * ILogEntry - Single log entry with serial number and timestamp
 * CRC: crc-LogService.md
 */
export interface ILogEntry {
    serial: number;
    date: Date;
    message: string;
}

/**
 * ILogData - Log storage structure with metadata
 * CRC: crc-LogService.md
 */
export interface ILogData {
    nextSerial: number;
    totalChars: number;
    entries: ILogEntry[];
}

/**
 * ILogService - Logging service interface
 * CRC: crc-LogService.md
 */
export interface ILogService {
    log(message: string): void;
    getEntries(): ILogEntry[];
    clear(): void;
    getTotalChars(): number;
}

const MAX_LOG_SIZE = 512 * 1024; // 512K characters
const TRIM_TO_SIZE = 256 * 1024; // 256K characters
const STORAGE_KEY = 'hollowWorldLog';

/**
 * LogService - Application logging with automatic trimming and persistence
 * CRC: crc-LogService.md
 * Spec: logging.md
 * Sequences: seq-log-message.md
 */
export class LogService implements ILogService {
    private logData: ILogData;

    constructor() {
        this.logData = this.loadFromStorage();
    }

    /**
     * Load log data from profile-scoped storage
     */
    private loadFromStorage(): ILogData {
        try {
            const stored = getProfileService().getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Convert date strings back to Date objects
                parsed.entries = parsed.entries.map((entry: ILogEntry) => ({
                    ...entry,
                    date: new Date(entry.date)
                }));
                return parsed;
            }
        } catch (error) {
            console.error('Failed to load log from localStorage:', error);
        }

        return {
            nextSerial: 1,
            totalChars: 0,
            entries: []
        };
    }

    /**
     * Persist log data to profile-scoped storage
     * Sequence: seq-log-message.md (lines 51-61)
     */
    private saveToStorage(): void {
        try {
            getProfileService().setItem(STORAGE_KEY, JSON.stringify(this.logData));
        } catch (error) {
            console.error('Failed to save log to localStorage:', error);
        }
    }

    /**
     * Trim log to 256KB when exceeding 512KB (keeps at least one entry)
     * Sequence: seq-log-message.md (lines 39-49)
     */
    private trimLog(): void {
        // Only trim if we exceed MAX_LOG_SIZE
        if (this.logData.totalChars <= MAX_LOG_SIZE) {
            return;
        }

        // If there's only one message, allow it to be larger than 256K
        if (this.logData.entries.length <= 1) {
            return;
        }

        console.log(`Trimming log from ${this.logData.totalChars} characters...`);

        // Remove oldest entries until we're below TRIM_TO_SIZE
        while (this.logData.totalChars > TRIM_TO_SIZE && this.logData.entries.length > 1) {
            const removed = this.logData.entries.shift();
            if (removed) {
                this.logData.totalChars -= removed.message.length;
            }
        }

        console.log(`Log trimmed to ${this.logData.totalChars} characters`);
    }

    /**
     * Add log entry with serial number and automatic trimming
     * Sequence: seq-log-message.md (lines 19-64)
     */
    log(message: string): void {
        const entry: ILogEntry = {
            serial: this.logData.nextSerial++,
            date: new Date(),
            message
        };

        this.logData.entries.push(entry);
        this.logData.totalChars += message.length;

        // Trim if necessary after adding
        this.trimLog();

        this.saveToStorage();
    }

    /**
     * Retrieve all log entries
     */
    getEntries(): ILogEntry[] {
        // Return a deep copy to prevent external modifications
        return this.logData.entries.map(entry => ({
            serial: entry.serial,
            date: new Date(entry.date),
            message: entry.message
        }));
    }

    /**
     * Clear all log entries
     */
    clear(): void {
        this.logData = {
            nextSerial: 1,
            totalChars: 0,
            entries: []
        };
        this.saveToStorage();
    }

    /**
     * Get total character count of all log entries
     */
    getTotalChars(): number {
        return this.logData.totalChars;
    }
}
