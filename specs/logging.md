# Application Logging

**Persistent logging system specification for HollowWorld**

---

## Overview

HollowWorld maintains a persistent log in LocalStorage for debugging, audit trail, and user-visible event history.

---

## Storage

### Location

- **Storage backend**: LocalStorage
- **Key**: Application-specific log key (e.g., `hollow-world-log`)
- **Format**: JSON array of log entries

---

## Log Entry Structure

### Entry Format

```typescript
interface ILogEntry {
    serial: number;      // Incrementing serial number
    date: Date;          // Timestamp of log entry
    message: string;     // Log message
}
```

### Example

```json
{
    "serial": 1234,
    "date": "2024-11-08T10:30:45.123Z",
    "message": "Peer connected: abc123"
}
```

---

## Log Management

### Serial Numbers

- Keep a running serial number for log lines
- Increment with each log entry
- Never reset serial numbers (provides unique ID)
- Serial number persists across sessions

### Size Tracking

- Keep a running total of log message characters
- Update total when adding entries
- Use for triggering trimming

### Trimming Strategy

**When to trim:**
- After storing a log message
- If total characters exceeds 512K

**How to trim:**
1. Start with the oldest messages
2. Remove entries until total is below 256K characters
3. **Exception**: If only one message remains, it's allowed to exceed 256K

**Rationale:**
- Keeps log size manageable
- Preserves recent history (most relevant)
- Prevents single large message from causing issues

---

## Implementation

### Adding Log Entries

```typescript
function logMessage(message: string): void {
    // 1. Get current log
    const log = getLog();

    // 2. Create new entry
    const entry: ILogEntry = {
        serial: getNextSerial(),
        date: new Date(),
        message: message
    };

    // 3. Add to log
    log.push(entry);

    // 4. Update character count
    updateCharacterCount(message.length);

    // 5. Save log
    saveLog(log);

    // 6. Trim if needed
    if (getCharacterCount() > 512000) {
        trimLog();
    }
}
```

### Trimming Log

```typescript
function trimLog(): void {
    const log = getLog();

    // Don't trim if only one entry
    if (log.length <= 1) {
        return;
    }

    let totalChars = getCharacterCount();

    // Remove oldest entries until below 256K
    while (totalChars > 256000 && log.length > 1) {
        const removed = log.shift();  // Remove first (oldest)
        if (removed) {
            totalChars -= removed.message.length;
        }
    }

    // Update count and save
    updateCharacterCount(totalChars);
    saveLog(log);
}
```

---

## Log Viewing

### UI Access

Log is accessible from:
- Settings view (Log button)
- Dedicated log view with filtering and sorting

See [`ui.settings.md`](ui.settings.md) for UI specification.

### Log View Features

- **Display**: Scrollable table of log entries
- **Filtering**: Filter by message text
- **Sorting**: Sort by date or message
- **Columns**: Serial, Date, Message
- **Export**: Copy log contents (future feature)

---

## What to Log

### User Actions

- Profile creation/switching
- Character creation/deletion
- Friend add/remove
- Settings changes
- Route navigation (major views)

### P2P Events

- Peer connections/disconnections
- Friend requests sent/received
- P2P messages (summary, not full content)
- WebSocket connection status

### System Events

- Application startup
- Storage operations (save/load)
- Errors and exceptions
- Build/version information

### Error Conditions

- Storage failures
- Network errors
- Validation failures
- Unexpected states

---

## Log Levels

Consider implementing log levels (future enhancement):

```typescript
enum LogLevel {
    DEBUG = 0,   // Verbose debugging
    INFO = 1,    // Informational
    WARN = 2,    // Warnings
    ERROR = 3    // Errors
}
```

Filter log by level in UI (show only WARN and ERROR, etc.)

---

## Privacy Considerations

### What NOT to Log

- **Passwords or credentials**: Never log sensitive data
- **Full peer IDs**: Use shortened versions (first 8 chars)
- **Personal data**: Avoid logging private notes, messages
- **Excessive detail**: Don't log every keystroke or minor event

### What to Sanitize

- **Peer IDs**: Shorten to `abc123...` format
- **Character names**: Use character IDs instead of full data
- **Error messages**: Remove stack traces with file paths

---

## Testing

### Test Cases

1. **Add entry**: Verify serial increments, date set correctly
2. **Trim small log**: Log under 512K should not trim
3. **Trim large log**: Log over 512K should trim to under 256K
4. **Single entry**: Single large entry should not be trimmed
5. **Character count**: Count should match actual log size
6. **Persistence**: Log should survive page refresh

### Performance

- Logging should not block UI (< 10ms per entry)
- Trimming should be fast (< 100ms even for large logs)
- Log size should stay under 512K under normal use

---

## Future Enhancements

### Log Levels

Implement DEBUG, INFO, WARN, ERROR levels with filtering.

### Log Export

Allow users to download log file for sharing or debugging.

### Remote Logging

Send error logs to remote server for debugging (opt-in).

### Log Rotation

Archive old logs instead of deleting (keep last N archives).

### Structured Logging

Use structured format (JSON fields) for better filtering:

```typescript
interface IStructuredLogEntry {
    serial: number;
    date: Date;
    level: LogLevel;
    category: string;  // e.g., "p2p", "storage", "ui"
    message: string;
    metadata?: Record<string, any>;
}
```

---

## References

- **UI Spec**: [`ui.settings.md`](ui.settings.md) - Log view UI
- **Testing**: [`testing.md`](testing.md) - Log testing requirements
- **Storage**: [`storage.md`](storage.md) - Storage system details
- **Main Spec**: [`main.md`](main.md) - Overall architecture
