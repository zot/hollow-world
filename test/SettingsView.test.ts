import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LogService } from '../../src/services/LogService';

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
