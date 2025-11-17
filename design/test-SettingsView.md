# Test Design: SettingsView

**Component:** SettingsView
**CRC Reference:** crc-SettingsView.md
**UI Spec Reference:** ui-settings-view.md
**Spec Reference:** specs/ui.settings.md, specs/logging.md
**Implementation Test:** test/SettingsView.test.ts (partial - log sorting)

## Component Overview

SettingsView displays application settings including peer ID, profile management, and application log with sorting. Provides access to configuration and debugging information.

## Test Categories

### Unit Tests

#### Rendering Tests

**Test Case: Render Peer ID Section**
- Purpose: Verify peer ID displayed and copyable
- Setup: Peer ID set
- Input: Render view
- Expected: Peer ID shown with copy button
- Related CRC: crc-SettingsView.md (renderPeerIdSection)
- Related UI Spec: ui-settings-view.md (Peer ID Section)

**Test Case: Render Profile Section**
- Purpose: Verify current profile and profile list
- Setup: Multiple profiles exist
- Input: Render view
- Expected: Current profile shown, profile list dropdown visible
- Related CRC: crc-SettingsView.md (renderProfileSection)
- Related UI Spec: ui-settings-view.md (Profile Section)

**Test Case: Render Log Section**
- Purpose: Verify log entries displayed
- Setup: Log entries exist
- Input: Render view
- Expected: Log entries shown with serial, date, message
- Related CRC: crc-SettingsView.md (renderLogSection)
- Related UI Spec: ui-settings-view.md (Log Section)
- Implementation: test/SettingsView.test.ts (implicit)

**Test Case: Render Empty Log**
- Purpose: Verify empty log state
- Setup: No log entries
- Input: Render view
- Expected: "No log entries" message or empty log area
- Related CRC: crc-SettingsView.md

**Test Case: Render Audio Controls**
- Purpose: Verify audio controls visible
- Setup: None
- Input: Render view
- Expected: Audio controls present
- Related CRC: crc-SettingsView.md (audioManager)
- Related Spec: specs/ui.md (Audio on all views)

#### Peer ID Tests

**Test Case: Copy Peer ID**
- Purpose: Verify copy to clipboard
- Setup: Peer ID displayed
- Input: Click copy button
- Expected: Peer ID copied to clipboard, feedback shown
- Related CRC: crc-SettingsView.md (copyPeerId)

**Test Case: Display Peer ID**
- Purpose: Verify peer ID format
- Setup: P2P network initialized
- Input: Render view
- Expected: Peer ID shown in correct format
- Related CRC: crc-SettingsView.md

#### Profile Management Tests

**Test Case: Display Current Profile**
- Purpose: Verify current profile shown
- Setup: Profile set to "Profile A"
- Input: Render view
- Expected: "Profile A" displayed as current
- Related CRC: crc-SettingsView.md (getCurrentProfile)

**Test Case: List All Profiles**
- Purpose: Verify profile dropdown
- Setup: Profiles A, B, C exist
- Input: Open profile dropdown
- Expected: All profiles listed
- Related CRC: crc-SettingsView.md (listProfiles)

**Test Case: Switch Profile**
- Purpose: Verify profile switching
- Setup: Multiple profiles
- Input: Select different profile from dropdown
- Expected: Profile switched, view refreshes
- Related CRC: crc-SettingsView.md (switchProfile)

**Test Case: Create New Profile**
- Purpose: Verify profile creation
- Setup: Profile creation form
- Input: Enter name, click Create
- Expected: New profile created, switched to
- Related CRC: crc-SettingsView.md (createProfile)

**Test Case: Delete Profile**
- Purpose: Verify profile deletion
- Setup: Multiple profiles
- Input: Click delete on profile
- Expected: Confirmation shown, profile deleted on confirm
- Related CRC: crc-SettingsView.md (deleteProfile)

#### Log Display Tests

**Test Case: Display Log Entries**
- Purpose: Verify log entry format
- Setup: Log entries exist
- Input: Render log
- Expected: Each entry shows serial, timestamp, message
- Related CRC: crc-SettingsView.md (renderLogEntries)

**Test Case: Sort Log Ascending**
- Purpose: Verify ascending sort by serial
- Setup: Log entries with serials 3, 1, 2
- Input: Click sort ascending
- Expected: Entries displayed as 1, 2, 3
- Related CRC: crc-SettingsView.md (sortLogEntries)

**Test Case: Sort Log Descending**
- Purpose: Verify descending sort by serial
- Setup: Log entries with serials 1, 2, 3
- Input: Click sort descending
- Expected: Entries displayed as 3, 2, 1
- Related CRC: crc-SettingsView.md

**Test Case: Sorting Doesn't Create Log Entries**
- Purpose: Verify sort is read-only operation
- Setup: Log with 3 entries
- Input: Sort multiple times
- Expected: Entry count unchanged (no new log entries created)
- Related CRC: crc-SettingsView.md
- Related Spec: specs/logging.md
- Implementation: test/SettingsView.test.ts (line 20-65)

**Test Case: Clear Log**
- Purpose: Verify log clearing
- Setup: Log entries exist
- Input: Click Clear Log button
- Expected: Confirmation shown, log cleared on confirm
- Related CRC: crc-SettingsView.md (clearLog)

**Test Case: Log Auto-Scroll**
- Purpose: Verify newest entries visible
- Setup: Many log entries
- Input: Render log
- Expected: Log scrolled to show recent entries
- Related CRC: crc-SettingsView.md

### Integration Tests

**Test Case: LogService Integration**
- Purpose: Verify log loaded from LogService
- Setup: Log entries in storage
- Input: Render view
- Expected: Entries displayed correctly
- Related CRC: crc-SettingsView.md, crc-LogService.md

**Test Case: ProfileService Integration**
- Purpose: Verify profile operations via ProfileService
- Setup: Profiles in storage
- Input: List, switch, create, delete profiles
- Expected: ProfileService methods called correctly
- Related CRC: crc-SettingsView.md, crc-ProfileService.md

**Test Case: P2P Network Integration**
- Purpose: Verify peer ID from network provider
- Setup: P2P network initialized
- Input: Render view
- Expected: Peer ID retrieved from network provider
- Related CRC: crc-SettingsView.md, crc-P2PWebAppNetworkProvider.md

**Test Case: Profile Switch Refreshes View**
- Purpose: Verify view updates after profile switch
- Setup: View rendered
- Input: Switch profile
- Expected: View re-renders with new profile's data
- Related CRC: crc-SettingsView.md

### E2E Tests

**Test Case: Navigate to Settings**
- Purpose: Verify navigation to settings view
- Setup: Splash screen
- Input: Click Settings button
- Expected: Settings view displayed
- Test Type: Playwright E2E

**Test Case: View Peer ID**
- Purpose: Verify peer ID visible
- Setup: P2P server running
- Input: Navigate to settings
- Expected: Peer ID displayed
- Test Type: Playwright E2E

**Test Case: View Log Entries**
- Purpose: Verify log visible and sortable
- Setup: Log entries exist
- Input: Navigate to settings, click sort
- Expected: Log displayed and sorted
- Test Type: Playwright E2E

### Edge Cases

**Test Case: P2P Not Initialized**
- Purpose: Verify handling when P2P unavailable
- Setup: P2P network not started
- Input: Render view
- Expected: "Peer ID unavailable" or similar message
- Related CRC: crc-SettingsView.md

**Test Case: Very Long Log**
- Purpose: Verify performance with large log
- Setup: 1000+ log entries
- Input: Render log
- Expected: Renders efficiently (virtualization or pagination)
- Related CRC: crc-SettingsView.md

**Test Case: Log with Special Characters**
- Purpose: Verify HTML/special chars in log
- Setup: Log entries with <script>, quotes
- Input: Render log
- Expected: Characters escaped, displayed safely
- Related CRC: crc-SettingsView.md

**Test Case: Long Log Messages**
- Purpose: Verify UI handles long messages
- Setup: Log entry with 10,000 character message
- Input: Render log
- Expected: Message truncated or wrapped
- Related CRC: crc-SettingsView.md

**Test Case: Rapid Log Updates**
- Purpose: Verify view updates with new log entries
- Setup: View open
- Input: New log entries added rapidly
- Expected: View updates (polling or events)
- Related CRC: crc-SettingsView.md

**Test Case: Delete Current Profile**
- Purpose: Verify cannot delete active profile
- Setup: On Profile A
- Input: Attempt to delete Profile A
- Expected: Error or prevented
- Related CRC: crc-SettingsView.md

**Test Case: Profile Name Validation**
- Purpose: Verify profile name requirements
- Setup: Create profile form
- Input: Enter invalid name (empty, special chars)
- Expected: Error message shown
- Related CRC: crc-SettingsView.md

**Test Case: Log Timestamp Format**
- Purpose: Verify timestamp display
- Setup: Log entries with timestamps
- Input: Render log
- Expected: Timestamps in readable format (locale-aware)
- Related CRC: crc-SettingsView.md

**Test Case: Copy Peer ID Without Clipboard API**
- Purpose: Verify fallback when clipboard unavailable
- Setup: Browser without clipboard API
- Input: Click copy peer ID
- Expected: Fallback method (select text, prompt)
- Related CRC: crc-SettingsView.md

## Coverage Goals

- Test all settings sections (peer ID, profiles, log)
- Test peer ID display and copy
- Test profile management (list, switch, create, delete)
- Test log display (entries, sorting, clearing)
- Test integration with LogService, ProfileService, P2P network
- Test sorting doesn't create log entries (per spec)
- Test edge cases (long logs, special characters, missing P2P)
- E2E tests for navigation and interactions

## Notes

- SettingsView provides access to debugging and configuration
- Log sorting is read-only (no new entries created)
- Peer ID from P2P network provider (may be unavailable)
- Profile switching affects all app data (characters, friends, log)
- Audio controls must be visible (per UI spec)
- Log may need virtualization for large entries
- Consider export log feature in future
- Implementation test exists for log sorting: test/SettingsView.test.ts
