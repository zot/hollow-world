/**
 * Unit tests for LogService - Application logging with automatic trimming
 *
 * CRC: specs-crc/crc-LogService.md
 * Spec: specs/logging.md
 * Sequences: specs-crc/seq-log-message.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LogService } from '../src/services/LogService.js';
import { getProfileService } from '../src/services/ProfileService.js';

describe('LogService', () => {
    let logService: LogService;
    const STORAGE_KEY = 'hollowWorldLog';

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        logService = new LogService();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('log()', () => {
        it('should add a log entry', () => {
            logService.log('Test message');

            const entries = logService.getEntries();
            expect(entries).toHaveLength(1);
            expect(entries[0].message).toBe('Test message');
            expect(entries[0].serial).toBe(1);
            expect(entries[0].date).toBeInstanceOf(Date);
        });

        it('should increment serial numbers', () => {
            logService.log('Message 1');
            logService.log('Message 2');
            logService.log('Message 3');

            const entries = logService.getEntries();
            expect(entries).toHaveLength(3);
            expect(entries[0].serial).toBe(1);
            expect(entries[1].serial).toBe(2);
            expect(entries[2].serial).toBe(3);
        });

        it('should persist to localStorage', () => {
            logService.log('Test message');

            const stored = getProfileService().getItem(STORAGE_KEY);
            expect(stored).toBeTruthy();

            const parsed = JSON.parse(stored!);
            expect(parsed.entries).toHaveLength(1);
            expect(parsed.entries[0].message).toBe('Test message');
        });

        it('should track total character count', () => {
            logService.log('Hello');
            expect(logService.getTotalChars()).toBe(5);

            logService.log('World');
            expect(logService.getTotalChars()).toBe(10);
        });
    });

    describe('getEntries()', () => {
        it('should return empty array when no entries', () => {
            const entries = logService.getEntries();
            expect(entries).toHaveLength(0);
        });

        it('should return all log entries', () => {
            logService.log('Entry 1');
            logService.log('Entry 2');

            const entries = logService.getEntries();
            expect(entries).toHaveLength(2);
            expect(entries[0].message).toBe('Entry 1');
            expect(entries[1].message).toBe('Entry 2');
        });

        it('should return a copy of entries', () => {
            logService.log('Original');

            const entries = logService.getEntries();
            entries[0].message = 'Modified';

            const newEntries = logService.getEntries();
            expect(newEntries[0].message).toBe('Original');
        });
    });

    describe('clear()', () => {
        it('should remove all entries', () => {
            logService.log('Entry 1');
            logService.log('Entry 2');

            logService.clear();

            const entries = logService.getEntries();
            expect(entries).toHaveLength(0);
        });

        it('should reset serial number', () => {
            logService.log('Entry 1');
            logService.log('Entry 2');

            logService.clear();
            logService.log('New entry');

            const entries = logService.getEntries();
            expect(entries[0].serial).toBe(1);
        });

        it('should reset total character count', () => {
            logService.log('Some message');
            expect(logService.getTotalChars()).toBeGreaterThan(0);

            logService.clear();
            expect(logService.getTotalChars()).toBe(0);
        });

        it('should clear localStorage', () => {
            logService.log('Test');
            expect(getProfileService().getItem(STORAGE_KEY)).toBeTruthy();

            logService.clear();

            const stored = getProfileService().getItem(STORAGE_KEY);
            const parsed = JSON.parse(stored!);
            expect(parsed.entries).toHaveLength(0);
        });
    });

    describe('trimLog()', () => {
        it('should trim log when exceeding 512K characters', () => {
            // Create messages that exceed 512K
            const largeMessage = 'x'.repeat(200 * 1024); // 200K each
            logService.log(largeMessage);
            logService.log(largeMessage);
            logService.log(largeMessage); // 600K total

            // Should have trimmed to below 256K
            expect(logService.getTotalChars()).toBeLessThan(256 * 1024);
        });

        it('should keep at least one message even if larger than 256K', () => {
            const veryLargeMessage = 'x'.repeat(300 * 1024); // 300K
            logService.log(veryLargeMessage);

            const entries = logService.getEntries();
            expect(entries).toHaveLength(1);
            expect(logService.getTotalChars()).toBeGreaterThan(256 * 1024);
        });

        it('should remove oldest entries first', () => {
            const message = 'x'.repeat(200 * 1024); // 200K each
            logService.log(message); // Serial 1
            logService.log(message); // Serial 2
            logService.log(message); // Serial 3 - triggers trim

            const entries = logService.getEntries();
            // Should have removed serial 1 (oldest)
            expect(entries[0].serial).toBeGreaterThan(1);
        });

        it('should not trim if below 512K', () => {
            const message = 'Small message';
            logService.log(message);
            logService.log(message);

            const entries = logService.getEntries();
            expect(entries).toHaveLength(2);
            expect(logService.getTotalChars()).toBeLessThan(512 * 1024);
        });
    });

    describe('persistence', () => {
        it('should load entries from localStorage', () => {
            logService.log('Message 1');
            logService.log('Message 2');

            // Create new instance to test loading
            const newLogService = new LogService();
            const entries = newLogService.getEntries();

            expect(entries).toHaveLength(2);
            expect(entries[0].message).toBe('Message 1');
            expect(entries[1].message).toBe('Message 2');
        });

        it('should restore Date objects correctly', () => {
            logService.log('Test');

            const newLogService = new LogService();
            const entries = newLogService.getEntries();

            expect(entries[0].date).toBeInstanceOf(Date);
        });

        it('should handle corrupted localStorage data', () => {
            getProfileService().setItem(STORAGE_KEY, 'invalid json');

            const newLogService = new LogService();
            const entries = newLogService.getEntries();

            expect(entries).toHaveLength(0);
        });

        it('should handle missing localStorage data', () => {
            const newLogService = new LogService();
            const entries = newLogService.getEntries();

            expect(entries).toHaveLength(0);
            expect(newLogService.getTotalChars()).toBe(0);
        });
    });
});
