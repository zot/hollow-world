# Test Design: LogService

**Component:** LogService
**CRC Reference:** crc-LogService.md
**Spec Reference:** specs/logging.md
**Implementation Test:** test/LogService.test.ts

## Component Overview

LogService manages application logging with automatic trimming. Maintains serial-numbered log entries in LocalStorage with automatic cleanup when exceeding 512K characters.

## Test Categories

### Unit Tests

#### log() Method Tests

**Test Case: Add Single Log Entry**
- Purpose: Verify basic log entry creation
- Setup: Fresh LogService instance
- Input: Call log('Test message')
- Expected: Entry added with serial=1, correct message and date
- Related CRC: crc-LogService.md (log)
- Related Sequence: seq-log-message.md
- Implementation: test/LogService.test.ts (line 28-36)

**Test Case: Serial Number Increment**
- Purpose: Verify serial numbers auto-increment
- Setup: Fresh LogService instance
- Input: Call log() three times
- Expected: Entries have serial 1, 2, 3
- Related CRC: crc-LogService.md
- Implementation: test/LogService.test.ts (line 38-48)

**Test Case: Date Timestamp**
- Purpose: Verify each entry has timestamp
- Setup: Fresh LogService instance
- Input: Call log('Test')
- Expected: Entry has valid Date object
- Related CRC: crc-LogService.md
- Implementation: test/LogService.test.ts (line 28-36)

**Test Case: Persist to Storage**
- Purpose: Verify log() persists to localStorage
- Setup: Fresh LogService instance
- Input: Call log('Test')
- Expected: Entry exists in localStorage
- Related CRC: crc-LogService.md (saveToStorage)
- Related Sequence: seq-log-message.md
- Implementation: test/LogService.test.ts (line 50-59)

**Test Case: Character Count Tracking**
- Purpose: Verify total character count is maintained
- Setup: Fresh LogService instance
- Input: Call log('Hello'), log('World')
- Expected: getTotalChars() = 10
- Related CRC: crc-LogService.md (getTotalChars)
- Implementation: test/LogService.test.ts (line 61-67)

#### getEntries() Method Tests

**Test Case: Get Empty Entries**
- Purpose: Verify empty log returns empty array
- Setup: Fresh LogService instance
- Input: Call getEntries()
- Expected: Returns empty array
- Related CRC: crc-LogService.md (getEntries)
- Implementation: test/LogService.test.ts (line 71-74)

**Test Case: Get All Entries**
- Purpose: Verify retrieving all log entries
- Setup: Add 3 entries
- Input: Call getEntries()
- Expected: Returns array of 3 entries in order
- Related CRC: crc-LogService.md
- Implementation: test/LogService.test.ts (line 76-84)

**Test Case: Defensive Copy**
- Purpose: Verify getEntries() returns copy not reference
- Setup: Add entry
- Input: Modify returned array
- Expected: Original log unchanged
- Related CRC: crc-LogService.md
- Implementation: test/LogService.test.ts (line 86-95)

#### clear() Method Tests

**Test Case: Clear All Entries**
- Purpose: Verify clear() removes all entries
- Setup: Add 2 entries
- Input: Call clear()
- Expected: getEntries() returns empty array
- Related CRC: crc-LogService.md (clear)
- Implementation: test/LogService.test.ts (line 98-106)

**Test Case: Reset Serial Number**
- Purpose: Verify serial resets after clear
- Setup: Add entries, clear
- Input: Add new entry
- Expected: New entry has serial=1
- Related CRC: crc-LogService.md
- Implementation: test/LogService.test.ts (line 108-117)

**Test Case: Reset Character Count**
- Purpose: Verify totalChars resets to 0
- Setup: Add entries, clear
- Input: Call getTotalChars()
- Expected: Returns 0
- Related CRC: crc-LogService.md
- Implementation: test/LogService.test.ts (line 119-125)

**Test Case: Clear Updates Storage**
- Purpose: Verify clear() persists to localStorage
- Setup: Add entries, clear
- Input: Check localStorage
- Expected: Storage shows empty entries array
- Related CRC: crc-LogService.md (saveToStorage)
- Implementation: test/LogService.test.ts (line 127-136)

#### trimLog() Method Tests

**Test Case: Trim When Exceeding 512K**
- Purpose: Verify trimming triggers at correct threshold
- Setup: Fresh LogService instance
- Input: Add entries totaling >512K characters
- Expected: Log trimmed to <256K, oldest entries removed
- Related CRC: crc-LogService.md (trimLog)
- Related Sequence: seq-trim-log.md (needs creation)
- Implementation: test/LogService.test.ts (line 140-149)

**Test Case: Keep At Least One Entry**
- Purpose: Verify single large entry not deleted
- Setup: Fresh LogService instance
- Input: Add single 300K entry
- Expected: Entry kept even though >256K
- Related CRC: crc-LogService.md
- Implementation: test/LogService.test.ts (line 151-158)

**Test Case: Remove Oldest First**
- Purpose: Verify FIFO trimming (oldest entries removed first)
- Setup: Fresh LogService instance
- Input: Add entries with serials 1, 2, 3 totaling >512K
- Expected: Serial 1 removed first, higher serials kept
- Related CRC: crc-LogService.md
- Implementation: test/LogService.test.ts (line 160-169)

**Test Case: No Trim Below 512K**
- Purpose: Verify no trimming when under threshold
- Setup: Fresh LogService instance
- Input: Add small entries
- Expected: All entries kept, no trimming
- Related CRC: crc-LogService.md
- Implementation: test/LogService.test.ts (line 171-179)

#### Persistence Tests

**Test Case: Load from Storage on Init**
- Purpose: Verify existing log loads from localStorage
- Setup: Add entries, create new LogService instance
- Input: Call getEntries() on new instance
- Expected: Entries loaded from storage
- Related CRC: crc-LogService.md (loadFromStorage)
- Related Sequence: seq-load-log.md (needs creation)
- Implementation: test/LogService.test.ts (line 183-194)

**Test Case: Restore Date Objects**
- Purpose: Verify Date objects deserialized correctly
- Setup: Add entry, create new instance
- Input: Get entries, check date type
- Expected: date field is Date object, not string
- Related CRC: crc-LogService.md
- Implementation: test/LogService.test.ts (line 196-203)

**Test Case: Handle Corrupted Storage**
- Purpose: Verify graceful handling of invalid JSON
- Setup: Set storage to invalid JSON
- Input: Create new LogService instance
- Expected: Returns empty log, no crash
- Related CRC: crc-LogService.md
- Implementation: test/LogService.test.ts (line 205-212)

**Test Case: Handle Missing Storage**
- Purpose: Verify handling of empty storage
- Setup: Clear localStorage
- Input: Create new LogService instance
- Expected: Empty log, totalChars=0
- Related CRC: crc-LogService.md
- Implementation: test/LogService.test.ts (line 214-221)

### Integration Tests

**Test Case: Log Display in Settings View**
- Purpose: Verify logs render in UI
- Setup: Add log entries
- Input: Navigate to Settings view
- Expected: Log entries visible in correct order
- Related CRC: crc-SettingsView.md
- Related Sequence: seq-view-log.md (needs creation)

**Test Case: Log Sorting in UI**
- Purpose: Verify sorting logs doesn't create new entries
- Setup: Add log entries
- Input: Sort ascending/descending in UI
- Expected: Entry count unchanged
- Related CRC: crc-SettingsView.md
- Implementation: test/SettingsView.test.ts (line 20-40)

**Test Case: Profile-Aware Logging**
- Purpose: Verify logs are isolated per profile
- Setup: Add logs in Profile A, switch to Profile B
- Input: Get log entries in Profile B
- Expected: Profile B has separate log
- Related CRC: crc-ProfileService.md, crc-LogService.md

### Edge Cases

**Test Case: Empty Message**
- Purpose: Verify handling of empty log message
- Setup: Fresh LogService instance
- Input: Call log('')
- Expected: Entry created with empty string or error
- Related CRC: crc-LogService.md

**Test Case: Very Long Message**
- Purpose: Verify handling of extremely long messages
- Setup: Fresh LogService instance
- Input: Call log() with 1MB message
- Expected: Entry created, may trigger immediate trim
- Related CRC: crc-LogService.md

**Test Case: Null Message**
- Purpose: Verify handling of null message
- Setup: Fresh LogService instance
- Input: Call log(null)
- Expected: Converts to string or throws error
- Related CRC: crc-LogService.md

**Test Case: Object Message**
- Purpose: Verify handling of non-string messages
- Setup: Fresh LogService instance
- Input: Call log({ key: 'value' })
- Expected: Converts to string representation
- Related CRC: crc-LogService.md

**Test Case: Unicode Messages**
- Purpose: Verify handling of unicode characters
- Setup: Fresh LogService instance
- Input: Call log('Test 中文 العربية 🎉')
- Expected: Unicode preserved in storage and retrieval
- Related CRC: crc-LogService.md

**Test Case: HTML in Messages**
- Purpose: Verify handling of HTML content
- Setup: Fresh LogService instance
- Input: Call log('<script>alert("xss")</script>')
- Expected: HTML stored as-is (sanitization happens in UI)
- Related CRC: crc-LogService.md

**Test Case: Serial Number Overflow**
- Purpose: Verify handling of very large serial numbers
- Setup: Log with nextSerial near Number.MAX_SAFE_INTEGER
- Input: Add entry
- Expected: Serial increments correctly or wraps
- Related CRC: crc-LogService.md

**Test Case: Concurrent Logging**
- Purpose: Verify rapid sequential log calls
- Setup: Fresh LogService instance
- Input: Call log() 100 times in loop
- Expected: All entries created with sequential serials
- Related CRC: crc-LogService.md

**Test Case: Storage Write Failure**
- Purpose: Verify handling when localStorage write fails
- Setup: Mock localStorage.setItem to throw
- Input: Call log()
- Expected: Error logged but app doesn't crash
- Related CRC: crc-LogService.md

## Coverage Goals

- 100% method coverage (log, getEntries, clear, getTotalChars, trimLog)
- Test all storage operations (save, load, corrupted data)
- Verify trimming logic (threshold, FIFO, minimum 1 entry)
- Test persistence across service instances
- Test profile isolation
- Test edge cases (empty messages, large messages, unicode)
- Verify character count tracking accuracy
- Test error handling (storage failures, corrupted data)

## Notes

- Implementation test already exists: test/LogService.test.ts
- Test coverage is comprehensive (see implementation references above)
- Trimming constants: MAX_LOG_SIZE=512K, TRIM_TO_SIZE=256K
- Serial numbers never reset (except on clear())
- Uses ProfileService for profile-aware storage
- Date objects serialized as ISO strings in JSON
- Defensive copying prevents external mutation
- Consider adding performance tests for large logs
