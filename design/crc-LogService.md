# LogService

**Source Spec:** logging.md
**Existing Code:** src/services/LogService.ts

## Responsibilities

### Knows
- logData: ILogData - contains nextSerial, totalChars, entries[]
- MAX_LOG_SIZE: 512K characters
- TRIM_TO_SIZE: 256K characters
- STORAGE_KEY: 'hollowWorldLog'

### Does
- log(message): Add new log entry with auto-incrementing serial
- getEntries(): Return copy of all log entries
- clear(): Clear all log entries
- getTotalChars(): Get current log size
- trimLog(): Remove oldest entries when exceeding 512K
- loadFromStorage(): Load log from LocalStorage on initialization
- saveToStorage(): Persist log to LocalStorage

## Collaborators

- **ProfileService**: getItem/setItem for profile-aware storage

## Code Review Notes

✅ **Working well:**
- Serial numbers increment correctly and persist
- Trimming logic matches spec exactly:
  - Trigger: After adding entry, if totalChars > 512K
  - Target: Trim to 256K
  - Exception: Keep at least 1 entry even if > 256K
- Character count tracking is accurate
- Date handling converts to/from JSON correctly
- Returns defensive copies (prevents external modification)

✅ **Matches spec:**
- ✓ Serial numbers never reset
- ✓ Trim after 512K to 256K
- ✓ Single large entry allowed to exceed 256K
- ✓ Uses LocalStorage
- ✓ Persists across sessions

📝 **Implementation details:**
- Uses shift() to remove oldest entries (FIFO)
- Date objects serialized as ISO strings in JSON
- Defensive copying on getEntries() prevents mutation
- Error handling for storage failures

## Sequences

- seq-log-message.md
- seq-trim-log.md
- seq-load-log.md
- seq-clear-log.md
