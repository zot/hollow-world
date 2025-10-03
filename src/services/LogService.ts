export interface ILogEntry {
    serial: number;
    date: Date;
    message: string;
}

export interface ILogData {
    nextSerial: number;
    totalChars: number;
    entries: ILogEntry[];
}

export interface ILogService {
    log(message: string): void;
    getEntries(): ILogEntry[];
    clear(): void;
    getTotalChars(): number;
}

const MAX_LOG_SIZE = 512 * 1024; // 512K characters
const TRIM_TO_SIZE = 256 * 1024; // 256K characters
const STORAGE_KEY = 'hollowWorldLog';

export class LogService implements ILogService {
    private logData: ILogData;

    constructor() {
        this.logData = this.loadFromStorage();
    }

    private loadFromStorage(): ILogData {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
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

    private saveToStorage(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logData));
        } catch (error) {
            console.error('Failed to save log to localStorage:', error);
        }
    }

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

    getEntries(): ILogEntry[] {
        // Return a deep copy to prevent external modifications
        return this.logData.entries.map(entry => ({
            serial: entry.serial,
            date: new Date(entry.date),
            message: entry.message
        }));
    }

    clear(): void {
        this.logData = {
            nextSerial: 1,
            totalChars: 0,
            entries: []
        };
        this.saveToStorage();
    }

    getTotalChars(): number {
        return this.logData.totalChars;
    }
}
