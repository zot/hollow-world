# Test Design: CharacterManagerView

**Component:** CharacterManagerView
**CRC Reference:** crc-CharacterManagerView.md
**UI Spec Reference:** ui-characters-view.md
**Spec Reference:** specs/ui.characters.md
**Implementation Test:** No dedicated test file yet (needs creation)

## Component Overview

CharacterManagerView displays list of all characters with quick stats overview. Supports character selection, creation, deletion, and navigation. Uses render caching and debounced updates for performance.

## Test Categories

### Unit Tests

#### Initialization Tests

**Test Case: Initialize and Load Characters**
- Purpose: Verify view loads characters on init
- Setup: Characters in storage
- Input: Initialize view
- Expected: loadCharacters() called, characters displayed
- Related CRC: crc-CharacterManagerView.md (loadCharacters)
- Related Sequence: seq-view-character-list.md

**Test Case: Initialize with Empty Storage**
- Purpose: Verify empty state handling
- Setup: No characters in storage
- Input: Initialize view
- Expected: Empty state message shown, Add button visible
- Related CRC: crc-CharacterManagerView.md
- Related UI Spec: ui-characters-view.md (Empty State)

**Test Case: Audio Controls Visible**
- Purpose: Verify audio controls present
- Setup: None
- Input: Render view
- Expected: Audio controls visible
- Related CRC: crc-CharacterManagerView.md (audioManager)
- Related Spec: specs/ui.md (Audio on all views)

#### Rendering Tests

**Test Case: Render Character List**
- Purpose: Verify character cards rendered correctly
- Setup: 3 characters in storage
- Input: Call render()
- Expected: 3 character cards visible
- Related CRC: crc-CharacterManagerView.md (renderCharacterList)
- Related UI Spec: ui-characters-view.md (Character Cards List)

**Test Case: Render Character Card**
- Purpose: Verify individual card layout
- Setup: Character with full data
- Input: Call renderCharacterCard(character)
- Expected: Card shows name, rank, XP, DC, dust, attributes, delete button
- Related CRC: crc-CharacterManagerView.md (renderCharacterCard)
- Related UI Spec: ui-characters-view.md (Card Layout)

**Test Case: Render Attributes by Group**
- Purpose: Verify attribute grouping (Physical, Social, Mental)
- Setup: Character with attributes
- Input: Render character card
- Expected: Attributes grouped with emojis (💪 DEX/STR/CON, 🗣️ CHA/WIS/GRI, 🧠 INT/PER)
- Related CRC: crc-CharacterManagerView.md
- Related UI Spec: ui-characters-view.md (Attributes Row)

**Test Case: Render Delete Button**
- Purpose: Verify delete button (💀) on each card
- Setup: Character in list
- Input: Render card
- Expected: Delete button visible on right side
- Related CRC: crc-CharacterManagerView.md
- Related UI Spec: ui-characters-view.md (Delete Button)

**Test Case: Render Empty State**
- Purpose: Verify empty state UI
- Setup: No characters
- Input: Render view
- Expected: "No characters yet. Create your first character!" message
- Related CRC: crc-CharacterManagerView.md
- Related UI Spec: ui-characters-view.md (Empty State)

**Test Case: Render with Fallback**
- Purpose: Verify fallback UI when main render fails
- Setup: Mock render to throw error
- Input: Call render()
- Expected: Fallback UI shown, app doesn't crash
- Related CRC: crc-CharacterManagerView.md (renderCharacterListFallback)

#### Caching Tests

**Test Case: Cache Character Card HTML**
- Purpose: Verify render caching for performance
- Setup: Character in list
- Input: Render card twice
- Expected: Second render uses cached HTML
- Related CRC: crc-CharacterManagerView.md (renderCache)

**Test Case: Create Cache Key from Character**
- Purpose: Verify cache key generation
- Setup: Character object
- Input: Call createCharacterCacheKey(character)
- Expected: Consistent key for same character, different for modified character
- Related CRC: crc-CharacterManagerView.md (createCharacterCacheKey)

**Test Case: Clear Render Cache**
- Purpose: Verify cache clearing
- Setup: Cached character cards
- Input: Call clearRenderCache()
- Expected: Cache empty, next render re-renders cards
- Related CRC: crc-CharacterManagerView.md (clearRenderCache)

**Test Case: Cache Invalidation on Character Change**
- Purpose: Verify cache invalidates when character modified
- Setup: Cached character card
- Input: Modify character, render
- Expected: New HTML generated (cache miss)
- Related CRC: crc-CharacterManagerView.md

#### Debounced Rendering Tests

**Test Case: Debounce Render Updates**
- Purpose: Verify 250ms debouncing
- Setup: View initialized
- Input: Call render() multiple times rapidly
- Expected: Only one render after 250ms
- Related CRC: crc-CharacterManagerView.md (debouncedRender)
- Related Spec: specs/ui.md (250ms polling)

**Test Case: Queue Pending Updates**
- Purpose: Verify pending updates queued during render
- Setup: Render in progress
- Input: Call debouncedRender() again
- Expected: Second render queued, executes after first completes
- Related CRC: crc-CharacterManagerView.md (pendingUpdate, isRendering)

**Test Case: Prevent Concurrent Renders**
- Purpose: Verify only one render at a time
- Setup: View initialized
- Input: Call render() while already rendering
- Expected: Second render queued, not executed concurrently
- Related CRC: crc-CharacterManagerView.md (isRendering)

#### Character Operations Tests

**Test Case: Create New Character**
- Purpose: Verify character creation
- Setup: View initialized
- Input: Click Add Character button
- Expected: New character created, navigate to editor
- Related CRC: crc-CharacterManagerView.md (createNewCharacter)
- Related Sequence: seq-create-new-character.md

**Test Case: Delete Character with Confirmation**
- Purpose: Verify delete confirmation dialog
- Setup: Character in list
- Input: Click delete button (💀)
- Expected: Confirmation dialog shown
- Related CRC: crc-CharacterManagerView.md (deleteCharacter)
- Related Sequence: seq-delete-character.md

**Test Case: Delete Character Confirmed**
- Purpose: Verify character deleted on confirmation
- Setup: Character in list, show confirmation
- Input: Click Confirm
- Expected: Character removed, list refreshed
- Related CRC: crc-CharacterManagerView.md
- Related UI Spec: ui-characters-view.md (Delete Confirmation)

**Test Case: Delete Character Cancelled**
- Purpose: Verify delete cancelled
- Setup: Character in list, show confirmation
- Input: Click Cancel
- Expected: Character not deleted, dialog dismissed
- Related CRC: crc-CharacterManagerView.md

**Test Case: Select Character**
- Purpose: Verify character selection navigates to editor
- Setup: Character in list
- Input: Click character card
- Expected: Navigate to /character/:id
- Related CRC: crc-CharacterManagerView.md
- Related UI Spec: ui-characters-view.md (Events)

#### Event Listener Tests

**Test Case: Click Character Card**
- Purpose: Verify card click event
- Setup: Character in list
- Input: Click card (not delete button)
- Expected: onCharacterSelected(id) callback fired
- Related CRC: crc-CharacterManagerView.md (setupListEventListeners)

**Test Case: Click Delete Button**
- Purpose: Verify delete button event (doesn't trigger card click)
- Setup: Character in list
- Input: Click delete button
- Expected: Delete confirmation shown, card click not triggered
- Related CRC: crc-CharacterManagerView.md

**Test Case: Click Add Character Button**
- Purpose: Verify add button event
- Setup: View rendered
- Input: Click Add Character button
- Expected: createNewCharacter() called
- Related CRC: crc-CharacterManagerView.md

**Test Case: Click Back Button**
- Purpose: Verify back to menu navigation
- Setup: View rendered
- Input: Click Back to Menu button
- Expected: onBackToMenu() callback fired, navigate to /
- Related CRC: crc-CharacterManagerView.md

**Test Case: Click Home Button**
- Purpose: Verify home button navigation
- Setup: View rendered
- Input: Click home button (🏠)
- Expected: Navigate to splash screen
- Related CRC: crc-CharacterManagerView.md
- Related UI Spec: ui-characters-view.md (Header)

### Integration Tests

**Test Case: Load Characters from Storage**
- Purpose: Verify CharacterStorageService integration
- Setup: Characters in storage
- Input: Load view
- Expected: Characters loaded and displayed
- Related CRC: crc-CharacterManagerView.md, crc-CharacterStorageService.md
- Related Sequence: seq-render-character-list.md

**Test Case: Create Character via Factory**
- Purpose: Verify CharacterFactory integration
- Setup: None
- Input: Click Add Character
- Expected: New character created with defaults, navigate to editor
- Related CRC: crc-CharacterManagerView.md, crc-CharacterFactory.md

**Test Case: Refresh After Character Edit**
- Purpose: Verify list refreshes after returning from editor
- Setup: Edit character
- Input: Return to character list
- Expected: Updated character shown in list
- Related CRC: crc-CharacterManagerView.md, crc-CharacterEditorView.md

**Test Case: Delete Character from Storage**
- Purpose: Verify CharacterStorageService delete integration
- Setup: Character in storage
- Input: Delete character
- Expected: Character removed from storage and list
- Related CRC: crc-CharacterManagerView.md, crc-CharacterStorageService.md

**Test Case: Template Engine Integration**
- Purpose: Verify TemplateEngine used for rendering
- Setup: Characters in storage
- Input: Render view
- Expected: Templates loaded and rendered correctly
- Related CRC: crc-CharacterManagerView.md, crc-TemplateEngine.md

### E2E Tests

**Test Case: Navigate to Character List**
- Purpose: Verify navigation to character list
- Setup: Splash screen
- Input: Click Characters button
- Expected: Character list view displayed
- Test Type: Playwright E2E

**Test Case: View Character Cards**
- Purpose: Verify character cards displayed
- Setup: Characters exist
- Input: Navigate to /characters
- Expected: Character cards visible with correct data
- Test Type: Playwright E2E

**Test Case: Create and View New Character**
- Purpose: Verify complete create workflow
- Setup: Character list open
- Input: Click Add Character, edit in editor, return to list
- Expected: New character appears in list
- Test Type: Playwright E2E

**Test Case: Delete Character Flow**
- Purpose: Verify complete delete workflow
- Setup: Character in list
- Input: Click 💀, confirm deletion
- Expected: Character removed from list
- Test Type: Playwright E2E

### Edge Cases

**Test Case: Large Character List**
- Purpose: Verify performance with many characters
- Setup: 100 characters in storage
- Input: Render list
- Expected: Virtual scrolling active, renders smoothly
- Related CRC: crc-CharacterManagerView.md (renderCharacterList_Virtual)

**Test Case: Render Cache with Large List**
- Purpose: Verify caching improves performance
- Setup: 50 characters in storage
- Input: Render list twice
- Expected: Second render significantly faster
- Related CRC: crc-CharacterManagerView.md (renderCache)

**Test Case: Character with Missing Attributes**
- Purpose: Verify graceful handling of incomplete data
- Setup: Character missing some attributes
- Input: Render card
- Expected: Missing attributes shown as default or N/A
- Related CRC: crc-CharacterManagerView.md

**Test Case: Character with Invalid Data**
- Purpose: Verify handling of corrupted character
- Setup: Character with invalid attribute values
- Input: Render card
- Expected: Card renders, invalid data shown (validation is separate)
- Related CRC: crc-CharacterManagerView.md

**Test Case: Delete Last Character**
- Purpose: Verify empty state after deleting all
- Setup: Single character in list
- Input: Delete character
- Expected: Empty state message shown
- Related CRC: crc-CharacterManagerView.md

**Test Case: Rapid Character Creation**
- Purpose: Verify handling of rapid create clicks
- Setup: Character list
- Input: Click Add Character multiple times rapidly
- Expected: Multiple characters created, no duplicate IDs
- Related CRC: crc-CharacterManagerView.md, crc-CharacterFactory.md

**Test Case: Storage Failure on Load**
- Purpose: Verify handling when storage load fails
- Setup: Mock storage error
- Input: Load characters
- Expected: Error message shown, fallback UI
- Related CRC: crc-CharacterManagerView.md

**Test Case: Unicode Character Names**
- Purpose: Verify handling of unicode in character names
- Setup: Characters with unicode names
- Input: Render list
- Expected: Unicode displays correctly
- Related CRC: crc-CharacterManagerView.md

**Test Case: Very Long Character Name**
- Purpose: Verify UI handles long names
- Setup: Character with 200 character name
- Input: Render card
- Expected: Name truncated or wrapped gracefully
- Related CRC: crc-CharacterManagerView.md

**Test Case: Concurrent List Updates**
- Purpose: Verify handling of list changes in multiple tabs
- Setup: List open in two tabs
- Input: Delete character in tab 1
- Expected: Tab 2 updates or shows stale data gracefully
- Related CRC: crc-CharacterManagerView.md

## Coverage Goals

- Test all view lifecycle methods (loadCharacters, render, destroy)
- Test character card rendering (layout, attributes, delete button)
- Test render caching and debouncing
- Test character operations (create, delete, select)
- Test event listeners (cards, buttons, navigation)
- Test integration with CharacterStorageService, CharacterFactory, TemplateEngine
- Test empty state and fallback UI
- Test edge cases (large lists, invalid data, storage failures)
- E2E tests for complete workflows

## Notes

- Render caching improves performance for repeated renders
- Debounced rendering (250ms) prevents excessive updates
- Virtual scrolling for large lists (may not be needed for typical use)
- Delete button positioned on right, doesn't trigger card click
- Character attributes grouped by category (Physical, Social, Mental)
- Empty state shows helpful message and Add button
- Browser history integration for navigation
- UX validation and accessibility auditing methods seem like test code (may need refactoring)
