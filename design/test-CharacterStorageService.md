# Test Design: CharacterStorageService

**Component:** CharacterStorageService
**CRC Reference:** crc-CharacterStorageService.md
**Spec Reference:** specs/characters.md, specs/storage.md
**Implementation Test:** No dedicated test file yet (needs creation)

## Component Overview

CharacterStorageService manages persistence of character data to LocalStorage, including loading, saving, creating, and deleting characters. Uses profile-aware storage and handles character validation/upgrading.

## Test Categories

### Unit Tests

#### getAllCharacters() Tests

**Test Case: Load Empty Storage**
- Purpose: Verify behavior when no characters exist in storage
- Setup: Clear localStorage
- Input: Call getAllCharacters()
- Expected: Returns default example characters
- Related CRC: crc-CharacterStorageService.md (getDefaultCharacters)

**Test Case: Load Multiple Characters**
- Purpose: Verify loading all characters from storage
- Setup: Save 3 characters to storage
- Input: Call getAllCharacters()
- Expected: Returns array of 3 characters
- Related CRC: crc-CharacterStorageService.md (getAllCharacters)

**Test Case: Character Validation on Load**
- Purpose: Verify characters are validated when loaded
- Setup: Save character with missing fields to storage
- Input: Call getAllCharacters()
- Expected: Character is upgraded/fixed before return
- Related CRC: crc-CharacterVersioning.md (upgradeCharacterToLatest)

**Test Case: Corrupted Storage Data**
- Purpose: Verify handling of invalid JSON in storage
- Setup: Set storage key to invalid JSON string
- Input: Call getAllCharacters()
- Expected: Returns empty array or default characters
- Related CRC: crc-CharacterStorageService.md

**Test Case: Storage Quota Exceeded on Load**
- Purpose: Verify handling when storage is full
- Setup: Fill localStorage to quota
- Input: Call getAllCharacters()
- Expected: Handles gracefully, logs error
- Related CRC: crc-CharacterStorageService.md

#### getCharacter(id) Tests

**Test Case: Load Existing Character**
- Purpose: Verify loading specific character by ID
- Setup: Save character with known ID
- Input: Call getCharacter(knownId)
- Expected: Returns matching character
- Related CRC: crc-CharacterStorageService.md (getCharacter)

**Test Case: Load Nonexistent Character**
- Purpose: Verify behavior when character ID not found
- Setup: Empty storage
- Input: Call getCharacter('nonexistent-id')
- Expected: Returns undefined or null
- Related CRC: crc-CharacterStorageService.md

**Test Case: Character Validation on Single Load**
- Purpose: Verify single character is validated on load
- Setup: Save outdated character version
- Input: Call getCharacter(id)
- Expected: Character is upgraded to latest version
- Related CRC: crc-CharacterVersioning.md

#### saveCharacter() Tests

**Test Case: Save New Character**
- Purpose: Verify saving character creates new entry
- Setup: Empty storage
- Input: Call saveCharacter(newCharacter)
- Expected: Character saved, appears in getAllCharacters()
- Related CRC: crc-CharacterStorageService.md (saveCharacter)

**Test Case: Update Existing Character**
- Purpose: Verify saving character with existing ID updates it
- Setup: Save character, modify it
- Input: Call saveCharacter(modifiedCharacter)
- Expected: Character updated in storage, no duplicate
- Related CRC: crc-CharacterStorageService.md

**Test Case: Save Persists to LocalStorage**
- Purpose: Verify save actually writes to storage
- Setup: None
- Input: Save character, create new service instance
- Expected: New instance loads the saved character
- Related CRC: crc-CharacterStorageService.md, crc-ProfileService.md

**Test Case: Storage Quota Exceeded on Save**
- Purpose: Verify handling when storage is full during save
- Setup: Fill localStorage to near quota
- Input: Save large character
- Expected: Throws or returns error, logs issue
- Related CRC: crc-CharacterStorageService.md

**Test Case: Profile-Aware Storage**
- Purpose: Verify saves go to current profile's storage
- Setup: Switch profile
- Input: Save character
- Expected: Character saved to correct profile namespace
- Related CRC: crc-ProfileService.md

#### deleteCharacter(id) Tests

**Test Case: Delete Existing Character**
- Purpose: Verify deleting character removes it
- Setup: Save character
- Input: Call deleteCharacter(id)
- Expected: Character removed, not in getAllCharacters()
- Related CRC: crc-CharacterStorageService.md (deleteCharacter)

**Test Case: Delete Nonexistent Character**
- Purpose: Verify deleting nonexistent character is safe
- Setup: Empty storage
- Input: Call deleteCharacter('nonexistent-id')
- Expected: No error, no side effects
- Related CRC: crc-CharacterStorageService.md

**Test Case: Delete Persists to Storage**
- Purpose: Verify delete actually updates storage
- Setup: Save character
- Input: Delete character, create new service instance
- Expected: New instance does not load deleted character
- Related CRC: crc-CharacterStorageService.md

#### createNewCharacter(name) Tests

**Test Case: Create Character with Name**
- Purpose: Verify creating new character with name
- Setup: None
- Input: Call createNewCharacter('Billy the Kid')
- Expected: Returns character with name, default values, unique ID
- Related CRC: crc-CharacterFactory.md (createNewCharacter)

**Test Case: Character Has Unique ID**
- Purpose: Verify each created character has unique UUID
- Setup: None
- Input: Create multiple characters
- Expected: All characters have unique IDs
- Related CRC: crc-CharacterFactory.md

**Test Case: Character Has Default Attributes**
- Purpose: Verify new character has default attribute values
- Setup: None
- Input: Create character
- Expected: All attributes set to default (4 or spec default)
- Related CRC: crc-CharacterFactory.md

**Test Case: Character Has Empty Collections**
- Purpose: Verify new character has empty skills/hindrances/edges/gear
- Setup: None
- Input: Create character
- Expected: skills={}, hindrances=[], edges=[], gear=[]
- Related CRC: crc-CharacterFactory.md

**Test Case: Character Version Set**
- Purpose: Verify new character has correct version
- Setup: None
- Input: Create character
- Expected: version = latest version number
- Related CRC: crc-CharacterVersioning.md

### Integration Tests

**Test Case: Save-Load-Delete Cycle**
- Purpose: Verify complete lifecycle works correctly
- Setup: None
- Input: Create, save, load, modify, save, delete character
- Expected: All operations succeed, storage consistent
- Related CRC: crc-CharacterStorageService.md
- Related Sequence: seq-save-character.md, seq-load-character.md

**Test Case: Multiple Characters Management**
- Purpose: Verify managing multiple characters concurrently
- Setup: None
- Input: Create 10 characters, save all, load all, delete 5, verify 5 remain
- Expected: Correct characters remain after operations
- Related CRC: crc-CharacterStorageService.md

**Test Case: Profile Isolation**
- Purpose: Verify characters are isolated per profile
- Setup: Create profiles "Profile A" and "Profile B"
- Input: Save character to Profile A, switch to Profile B
- Expected: Profile B does not see Profile A's characters
- Related CRC: crc-ProfileService.md

### Edge Cases

**Test Case: Save Character with Null ID**
- Purpose: Verify handling of character without ID
- Setup: None
- Input: Save character with id = null or undefined
- Expected: Error or ID auto-generated
- Related CRC: crc-CharacterStorageService.md

**Test Case: Very Large Character**
- Purpose: Verify handling of character with large data
- Setup: None
- Input: Save character with 1000 skills, 1000 gear items
- Expected: Saves successfully or fails gracefully
- Related CRC: crc-CharacterStorageService.md

**Test Case: Concurrent Saves**
- Purpose: Verify rapid sequential saves don't corrupt data
- Setup: Save same character
- Input: Call saveCharacter() 10 times rapidly
- Expected: Last save wins, no corruption
- Related CRC: crc-CharacterStorageService.md

**Test Case: Special Characters in Name**
- Purpose: Verify handling of special characters
- Setup: None
- Input: Create character with name containing quotes, HTML, emojis
- Expected: Name saved and loaded correctly
- Related CRC: crc-CharacterFactory.md

**Test Case: Storage Recovery**
- Purpose: Verify recovery from partial storage failure
- Setup: Corrupt storage partially
- Input: Call getAllCharacters()
- Expected: Valid characters loaded, invalid ones skipped or fixed
- Related CRC: crc-CharacterStorageService.md

## Coverage Goals

- 100% method coverage (getAllCharacters, getCharacter, saveCharacter, deleteCharacter, createNewCharacter)
- Test all error paths (storage quota, corrupted data, missing data)
- Verify persistence across service instances
- Verify profile isolation
- Test complete character lifecycle (create → save → load → update → delete)
- Verify character validation/upgrading on load

## Notes

- CharacterStorageService uses ProfileService for storage access
- Current implementation uses single array in storage (not individual keys per spec)
- Hash-based save optimization NOT implemented (per CRC review notes)
- Tests should use mock ProfileService to avoid actual localStorage pollution
- Default characters are provided for new users
- Storage quota handling is critical for good UX
