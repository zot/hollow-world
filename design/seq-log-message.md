# Sequence: Log Message

**Source Spec:** specs/logging.md
**Use Case:** Application logs a message (with automatic trimming)

## Participants

- **Application**: Any part of the application that logs
- **LogService**: Logging service
- **ProfileService**: Profile-scoped storage wrapper
- **LocalStorage**: Browser localStorage API

## Sequence

```
     ┌───────────┐          ┌──────────┐                         ┌──────────────┐           ┌────────────┐
     │Application│          │LogService│                         │ProfileService│           │LocalStorage│
     └─────┬─────┘          └─────┬────┘                         └───────┬──────┘           └──────┬─────┘
           │ log(level, message)  │                                      │                         │
           │─────────────────────>│                                      │                         │
           │                      │                                      │                         │
           │                      │────┐                                 │                         │
           │                      │    │ increment serial number         │                         │
           │                      │<───┘                                 │                         │
           │                      │                                      │                         │
           │                      │────┐                                 │                         │
           │                      │    │ create log entry with timestamp │                         │
           │                      │<───┘                                 │                         │
           │                      │                                      │                         │
           │                      │────┐                                 │                         │
           │                      │    │ append to log array             │                         │
           │                      │<───┘                                 │                         │
           │                      │                                      │                         │
           │                      │────┐                                 │                         │
           │                      │    │ calculate total size            │                         │
           │                      │<───┘                                 │                         │
           │                      │                                      │                         │
           │                      │                                      │                         │
           │      ╔══════╤════════╪═════════════════════════════════╗    │                         │
           │      ║ ALT  │  size > 512KB                            ║    │                         │
           │      ╟──────┘        │                                 ║    │                         │
           │      ║               │────┐                            ║    │                         │
           │      ║               │    │ trim to 256KB              ║    │                         │
           │      ║               │<───┘                            ║    │                         │
           │      ║               │                                 ║    │                         │
           │      ║               │ ╔═════════════════════════╗     ║    │                         │
           │      ║               │ ║Keep at least one entry ░║     ║    │                         │
           │      ║               │ ║even if > 256KB          ║     ║    │                         │
           │      ╚═══════════════╪═╚═════════════════════════╝═════╝    │                         │
           │                      │                                      │                         │
           │                      │setItem(LOG_KEY, JSON.stringify(log)) │                         │
           │                      │─────────────────────────────────────>│                         │
           │                      │                                      │                         │
           │                      │                                      │   setItem(key, data)    │
           │                      │                                      │────────────────────────>│
           │                      │                                      │                         │
           │                      │                                      │        success          │
           │                      │                                      │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
           │                      │                                      │                         │
           │                      │               success                │                         │
           │                      │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                         │
           │                      │                                      │                         │
           │       logged         │                                      │                         │
           │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                                      │                         │
     ┌─────┴─────┐          ┌─────┴────┐                         ┌───────┴──────┐           ┌──────┴─────┐
     │Application│          │LogService│                         │ProfileService│           │LocalStorage│
     └───────────┘          └──────────┘                         └──────────────┘           └────────────┘
```

## Log Entry Structure

```typescript
interface LogEntry {
  serial: number;        // Incrementing number (unique per profile)
  timestamp: string;     // ISO 8601 timestamp
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
}
```

## Trimming Logic

**Trigger**: When total log size exceeds 512KB

**Action**: Trim to 256KB
1. Calculate total size (JSON.stringify length)
2. Remove oldest entries until size ≤ 256KB
3. **Exception**: If single entry > 256KB, keep it (don't lose data)

**Why trim to 256KB not 512KB?**
- Provides headroom before next trim
- Reduces frequency of trimming operations
- Still leaves plenty of log history

## Implementation Notes

**✅ Correctly implemented:**
- Serial number incrementing (per spec)
- 512KB→256KB trimming logic
- Exception for single large entry
- Profile-scoped storage (logs per profile)
- Persistence on every log call

**📝 Design decisions:**
- Log persisted synchronously (could be async)
- All log levels stored (no filtering)
- No log rotation files (single array)
- Oldest entries trimmed first (FIFO)

## Usage Examples

```typescript
// Simple logging
LogService.log('info', 'Character created');
LogService.log('error', 'Failed to connect to peer');

// From any component
class CharacterEditorView {
  save() {
    LogService.log('debug', 'Saving character...');
    // ... save logic
    LogService.log('info', 'Character saved successfully');
  }
}
```

## Notes

- Logs are profile-isolated (each profile has separate log)
- Serial numbers ensure ordering even with same timestamp
- Trimming prevents unbounded growth
- Always persisted (survives browser restart)
- Viewable in Settings view

## Related CRC Cards

- crc-LogService.md
- crc-ProfileService.md
