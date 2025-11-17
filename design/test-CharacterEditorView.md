# Test Design: CharacterEditorView

**Component:** CharacterEditorView
**CRC Reference:** crc-CharacterEditorView.md
**UI Spec Reference:** ui-character-editor-view.md
**Spec Reference:** specs/ui.characters.md, specs/ui.md
**Implementation Test:** No dedicated test file yet (needs creation)

## Component Overview

CharacterEditorView displays and manages editing of a single character. Uses hash-based change detection, 250ms polling for UI updates, and never blocks saves due to validation errors.

## Test Categories

### Unit Tests

#### Initialization Tests

**Test Case: Initialize with Valid Character**
- Purpose: Verify view initializes with character data
- Setup: Create character
- Input: Call setCharacter(character)
- Expected: View displays character name, attributes, skills
- Related CRC: crc-CharacterEditorView.md (setCharacter)
- Related UI Spec: ui-character-editor-view.md (Data Binding)

**Test Case: Initialize Without Character**
- Purpose: Verify view handles missing character
- Setup: None
- Input: Initialize view without setCharacter()
- Expected: Shows error message "No character to edit"
- Related CRC: crc-CharacterEditorView.md (renderNoCharacterError)

**Test Case: Load Character from URL Parameter**
- Purpose: Verify loading character from route param
- Setup: Navigate to /character/:id
- Input: View initialization
- Expected: Character loaded from storage via ID
- Related CRC: crc-CharacterEditorView.md

#### Rendering Tests

**Test Case: Render Complete Character**
- Purpose: Verify full character renders correctly
- Setup: Character with all fields populated
- Input: Call render()
- Expected: All fields visible (name, attributes, skills, edges, hindrances, gear, wounds)
- Related CRC: crc-CharacterEditorView.md (render)
- Related UI Spec: ui-character-editor-view.md (Structure)

**Test Case: Render Character with Empty Fields**
- Purpose: Verify rendering with minimal data
- Setup: Character with only required fields
- Input: Call render()
- Expected: Empty sections handled gracefully
- Related CRC: crc-CharacterEditorView.md

**Test Case: Render Error Fallback**
- Purpose: Verify error UI when main render fails
- Setup: Mock render to throw error
- Input: Call render()
- Expected: Error message displayed, app doesn't crash
- Related CRC: crc-CharacterEditorView.md (renderErrorFallback)

**Test Case: Audio Controls Visible**
- Purpose: Verify audio controls present on editor
- Setup: Render character editor
- Input: Check DOM
- Expected: Audio control buttons visible
- Related CRC: crc-CharacterEditorView.md (audioManager)
- Related Spec: specs/ui.md (Audio controls on all views)

#### Change Detection Tests

**Test Case: Detect Attribute Change**
- Purpose: Verify change detection when attribute modified
- Setup: Load character, start change tracking
- Input: Modify strength from 4 to 6
- Expected: hasUnsavedChanges = true, Yep button enabled
- Related CRC: crc-CharacterEditorView.md (detectChanges)
- Related Spec: specs/ui.md (250ms polling)

**Test Case: Detect Skill Change**
- Purpose: Verify change detection when skill modified
- Setup: Load character
- Input: Add new skill or modify existing
- Expected: hasUnsavedChanges = true
- Related CRC: crc-CharacterEditorView.md

**Test Case: No Change Detection**
- Purpose: Verify unchanged character doesn't trigger save
- Setup: Load character
- Input: No modifications
- Expected: hasUnsavedChanges = false, Yep button disabled
- Related CRC: crc-CharacterEditorView.md

**Test Case: Hash-Based Change Detection**
- Purpose: Verify using character hash instead of deep equality
- Setup: Load character
- Input: Modify character
- Expected: Change detected via hash comparison
- Related CRC: crc-CharacterEditorView.md (originalCharacterHash)
- Related Spec: specs/coding-standards.md (Hash-based change detection)

**Test Case: 250ms Polling Interval**
- Purpose: Verify change detection runs every 250ms
- Setup: Load character, mock timer
- Input: Modify character at various intervals
- Expected: Changes detected within 250ms
- Related CRC: crc-CharacterEditorView.md (setupChangeTracking)
- Related Spec: specs/ui.md (250ms polling)

#### Save Tests

**Test Case: Save Valid Character**
- Purpose: Verify saving character to storage
- Setup: Load character, make changes
- Input: Click Yep button
- Expected: Character saved, hasUnsavedChanges = false
- Related CRC: crc-CharacterEditorView.md (saveCharacter)
- Related Sequence: seq-save-character-ui.md

**Test Case: Save Invalid Character**
- Purpose: Verify save NOT blocked by validation errors
- Setup: Character with validation errors
- Input: Click Yep button
- Expected: Save completes, validation warning shown
- Related CRC: crc-CharacterEditorView.md (showValidationWarning)
- Related Spec: specs/ui.md (Never block saves)

**Test Case: Save Updates Hash**
- Purpose: Verify hash updates after save
- Setup: Load character, modify, save
- Input: Check originalCharacterHash
- Expected: originalCharacterHash updated to current hash
- Related CRC: crc-CharacterEditorView.md

**Test Case: Save Disables Yep Button**
- Purpose: Verify button state after save
- Setup: Character with changes
- Input: Save character
- Expected: Yep button disabled (no unsaved changes)
- Related CRC: crc-CharacterEditorView.md (updateButtonStates)

**Test Case: Save to World Character**
- Purpose: Verify character synced to TextCraft world if in world
- Setup: Character with worldId set
- Input: Save character
- Expected: updateWorldCharacter() called
- Related CRC: crc-CharacterEditorView.md (updateWorldCharacter)
- Related Sequence: seq-textcraft-character-sync.md

#### Revert Tests

**Test Case: Revert Unsaved Changes**
- Purpose: Verify revert reloads original character
- Setup: Load character, make changes
- Input: Click Nope button
- Expected: Character reverted to original state
- Related CRC: crc-CharacterEditorView.md (revertChanges)
- Related Sequence: seq-revert-character.md

**Test Case: Revert Clears Unsaved Flag**
- Purpose: Verify revert disables Yep/Nope buttons
- Setup: Character with unsaved changes
- Input: Revert changes
- Expected: hasUnsavedChanges = false, buttons disabled
- Related CRC: crc-CharacterEditorView.md

**Test Case: Revert Reloads from Storage**
- Purpose: Verify revert fetches fresh data
- Setup: Character modified in editor
- Input: Revert
- Expected: Character reloaded from CharacterStorageService
- Related CRC: crc-CharacterEditorView.md, crc-CharacterStorageService.md

#### Validation Tests

**Test Case: Show Validation Warnings**
- Purpose: Verify validation errors displayed as warnings
- Setup: Character with invalid attribute
- Input: Trigger validation
- Expected: Warning message shown, save not blocked
- Related CRC: crc-CharacterEditorView.md (showValidationWarning)
- Related Sequence: seq-validate-character.md

**Test Case: Multiple Validation Errors**
- Purpose: Verify all validation errors shown
- Setup: Character with multiple errors
- Input: Trigger validation
- Expected: All errors listed in warning
- Related CRC: crc-CharacterEditorView.md, crc-CharacterValidation.md

**Test Case: Clear Validation on Fix**
- Purpose: Verify warnings clear when errors fixed
- Setup: Character with validation errors
- Input: Fix errors
- Expected: Validation warnings disappear
- Related CRC: crc-CharacterEditorView.md

#### Event Listener Tests

**Test Case: Click Yep Button**
- Purpose: Verify Yep button triggers save
- Setup: Character with unsaved changes
- Input: Click Yep button
- Expected: saveCharacter() called
- Related CRC: crc-CharacterEditorView.md (setupEventListeners)

**Test Case: Click Nope Button**
- Purpose: Verify Nope button triggers revert
- Setup: Character with unsaved changes
- Input: Click Nope button
- Expected: revertChanges() called
- Related CRC: crc-CharacterEditorView.md

**Test Case: Click Back Button**
- Purpose: Verify back navigation
- Setup: None
- Input: Click Back to Characters button
- Expected: Navigate to /characters
- Related CRC: crc-CharacterEditorView.md

**Test Case: Browser Back Button**
- Purpose: Verify browser back button navigation
- Setup: On character editor
- Input: Click browser back
- Expected: Navigate to previous view (character list)
- Related CRC: crc-CharacterEditorView.md
- Related Spec: specs/main.md (Browser history integration)

### Integration Tests

**Test Case: Load-Edit-Save-Reload Cycle**
- Purpose: Verify complete character editing workflow
- Setup: Character in storage
- Input: Load → modify → save → reload editor
- Expected: Changes persisted and reload shows saved data
- Related CRC: crc-CharacterEditorView.md, crc-CharacterStorageService.md
- Related Sequence: seq-edit-character.md

**Test Case: Character Sheet Integration**
- Purpose: Verify CharacterSheet embedded correctly
- Setup: Load character
- Input: Render editor
- Expected: CharacterSheet component visible and functional
- Related CRC: crc-CharacterEditorView.md, crc-CharacterSheet.md

**Test Case: Validation Integration**
- Purpose: Verify CharacterValidation integration
- Setup: Invalid character
- Input: Attempt save
- Expected: Validation warnings shown, save completes
- Related CRC: crc-CharacterEditorView.md, crc-CharacterValidation.md

**Test Case: Storage Integration**
- Purpose: Verify CharacterStorageService integration
- Setup: None
- Input: Save character
- Expected: Character persists to storage
- Related CRC: crc-CharacterEditorView.md, crc-CharacterStorageService.md

**Test Case: World Sync Integration**
- Purpose: Verify TextCraft world character sync
- Setup: Character in world
- Input: Edit and save character
- Expected: World character updated
- Related CRC: crc-CharacterEditorView.md, crc-CharacterSync.md
- Related Sequence: seq-textcraft-character-sync.md

### E2E Tests

**Test Case: Open Character Editor**
- Purpose: Verify navigation to editor
- Setup: Character exists
- Input: Click character in list
- Expected: Editor opens with character data
- Test Type: Playwright E2E

**Test Case: Edit and Save Character**
- Purpose: Verify end-to-end save workflow
- Setup: Character in storage
- Input: Open editor, modify name, click Yep
- Expected: Changes saved and persisted
- Test Type: Playwright E2E

**Test Case: Edit and Revert Character**
- Purpose: Verify end-to-end revert workflow
- Setup: Character in storage
- Input: Open editor, modify name, click Nope
- Expected: Changes discarded, original shown
- Test Type: Playwright E2E

### Edge Cases

**Test Case: Rapid Attribute Changes**
- Purpose: Verify change detection with rapid input
- Setup: Character loaded
- Input: Modify attributes quickly in succession
- Expected: All changes detected, final state correct
- Related CRC: crc-CharacterEditorView.md

**Test Case: Save During Change Detection Cycle**
- Purpose: Verify no race condition between polling and save
- Setup: Character with changes
- Input: Click Yep during 250ms polling cycle
- Expected: Save completes correctly
- Related CRC: crc-CharacterEditorView.md

**Test Case: Navigate Away with Unsaved Changes**
- Purpose: Verify handling of navigation with unsaved changes
- Setup: Character with unsaved changes
- Input: Click browser back or navigate away
- Expected: Warning prompt or changes auto-saved
- Related CRC: crc-CharacterEditorView.md

**Test Case: Concurrent Edits in Multiple Tabs**
- Purpose: Verify handling of same character edited in multiple tabs
- Setup: Open character in two tabs
- Input: Edit in tab 1, save, then save in tab 2
- Expected: Last save wins, no corruption
- Related CRC: crc-CharacterEditorView.md, crc-CharacterStorageService.md

**Test Case: Storage Failure During Save**
- Purpose: Verify handling when save fails
- Setup: Mock storage quota exceeded
- Input: Attempt save
- Expected: Error message shown, changes not lost
- Related CRC: crc-CharacterEditorView.md (showErrorMessage)

**Test Case: Missing Character in Storage**
- Purpose: Verify handling when character deleted externally
- Setup: Load character, delete from storage externally
- Input: Attempt save
- Expected: Error message, graceful handling
- Related CRC: crc-CharacterEditorView.md

**Test Case: Very Long Character Name**
- Purpose: Verify UI handles long names
- Setup: Character loaded
- Input: Enter 500 character name
- Expected: UI doesn't break, name accepted
- Related CRC: crc-CharacterEditorView.md

**Test Case: Special Characters in Fields**
- Purpose: Verify handling of HTML/special characters
- Setup: Character loaded
- Input: Enter name with <script>, quotes, emojis
- Expected: Characters escaped in UI, stored correctly
- Related CRC: crc-CharacterEditorView.md

## Coverage Goals

- Test all view lifecycle methods (setCharacter, render, destroy)
- Test change detection (polling, hash comparison, button states)
- Test save/revert workflows
- Test validation integration (warnings shown, saves not blocked)
- Test event listeners (buttons, navigation)
- Test CharacterSheet integration
- Test storage integration
- Test world sync integration
- Test edge cases (rapid changes, storage failures, concurrent edits)
- E2E tests for complete workflows

## Notes

- CharacterEditorView orchestrates, CharacterSheet handles rendering
- Hash-based change detection preferred over deep equality
- 250ms polling interval per UI spec
- Validation warnings never block saves (per UI spec)
- Audio controls must be visible (per UI spec)
- Browser history integration required
- TextCraft world sync happens on save if character in world
- Yep/Nope button convention (western theme)
