# Test Design: CharacterValidation

**Component:** CharacterValidation
**CRC Reference:** crc-CharacterValidation.md
**Spec Reference:** specs/characters.md, specs/Hollow-summary.md, specs/ui.md
**Implementation Test:** No dedicated test file yet (needs creation)

## Component Overview

CharacterValidation validates character data against Hollow TTRPG rules and application requirements. Returns validation errors without blocking operations (per UI spec: never block saves).

## Test Categories

### Unit Tests

#### validate() Method Tests

**Test Case: Validate Complete Valid Character**
- Purpose: Verify valid character passes validation
- Setup: None
- Input: Complete character with all valid data
- Expected: validate() returns empty error array or { valid: true }
- Related CRC: crc-CharacterValidation.md (validate)

**Test Case: Validate Minimal Valid Character**
- Purpose: Verify minimal character passes validation
- Setup: None
- Input: Character with only required fields (id, version, name, attributes)
- Expected: validate() returns no errors
- Related CRC: crc-CharacterValidation.md

**Test Case: Missing Required Field - Name**
- Purpose: Verify validation catches missing name
- Setup: None
- Input: Character with empty or null name
- Expected: validate() returns error for missing name
- Related CRC: crc-CharacterValidation.md

**Test Case: Missing Required Field - ID**
- Purpose: Verify validation catches missing ID
- Setup: None
- Input: Character with null or undefined id
- Expected: validate() returns error for missing ID
- Related CRC: crc-CharacterValidation.md

**Test Case: Missing Required Field - Version**
- Purpose: Verify validation catches missing version
- Setup: None
- Input: Character with null version
- Expected: validate() returns error for missing version
- Related CRC: crc-CharacterValidation.md, crc-CharacterVersioning.md

**Test Case: Invalid Attribute Range - Too Low**
- Purpose: Verify validation catches out-of-range low attributes
- Setup: None
- Input: Character with attribute = 0 or negative
- Expected: validate() returns error for invalid attribute
- Related CRC: crc-CharacterValidation.md

**Test Case: Invalid Attribute Range - Too High**
- Purpose: Verify validation catches out-of-range high attributes
- Setup: None
- Input: Character with attribute = 15 (above maximum)
- Expected: validate() returns error for invalid attribute
- Related CRC: crc-CharacterValidation.md

**Test Case: Missing Attribute Field**
- Purpose: Verify validation catches missing attributes
- Setup: None
- Input: Character with incomplete attributes object (missing strength)
- Expected: validate() returns error for missing attribute
- Related CRC: crc-CharacterValidation.md

**Test Case: Non-Numeric Attribute**
- Purpose: Verify validation catches non-numeric attributes
- Setup: None
- Input: Character with attribute = "high" (string)
- Expected: validate() returns error for invalid type
- Related CRC: crc-CharacterValidation.md

**Test Case: Invalid Skill Value - Negative**
- Purpose: Verify validation catches negative skill ranks
- Setup: None
- Input: Character with skills: { shooting: -5 }
- Expected: validate() returns error for negative skill
- Related CRC: crc-CharacterValidation.md

**Test Case: Invalid Skill Value - Non-Even**
- Purpose: Verify validation catches non-even skill values (if Hollow rules require)
- Setup: None
- Input: Character with skills: { shooting: 11 } (odd number)
- Expected: validate() returns error if rules require even values
- Related CRC: crc-CharacterValidation.md

**Test Case: Invalid Skill Name**
- Purpose: Verify validation of skill names against allowed skills
- Setup: None
- Input: Character with skills: { invalidSkill: 10 }
- Expected: validate() returns error for unknown skill
- Related CRC: crc-CharacterValidation.md

**Test Case: Non-Numeric Skill Value**
- Purpose: Verify validation catches non-numeric skill values
- Setup: None
- Input: Character with skills: { shooting: "expert" }
- Expected: validate() returns error for invalid type
- Related CRC: crc-CharacterValidation.md

**Test Case: Invalid Wounds - Negative**
- Purpose: Verify validation catches negative wounds
- Setup: None
- Input: Character with wounds = -1
- Expected: validate() returns error for negative wounds
- Related CRC: crc-CharacterValidation.md

**Test Case: Invalid Wounds - Excessive**
- Purpose: Verify validation catches wounds beyond incapacitation
- Setup: None
- Input: Character with wounds = 10 (beyond reasonable limit)
- Expected: validate() returns warning or error
- Related CRC: crc-CharacterValidation.md

**Test Case: Non-Numeric Wounds**
- Purpose: Verify validation catches non-numeric wounds
- Setup: None
- Input: Character with wounds = "injured"
- Expected: validate() returns error for invalid type
- Related CRC: crc-CharacterValidation.md

**Test Case: Invalid Hindrance Type**
- Purpose: Verify validation catches non-string hindrances
- Setup: None
- Input: Character with hindrances = [42, true]
- Expected: validate() returns error for invalid types
- Related CRC: crc-CharacterValidation.md

**Test Case: Empty Hindrance String**
- Purpose: Verify validation catches empty hindrance strings
- Setup: None
- Input: Character with hindrances = ["", "   "]
- Expected: validate() returns error for empty strings
- Related CRC: crc-CharacterValidation.md

**Test Case: Invalid Edge Type**
- Purpose: Verify validation catches non-string edges
- Setup: None
- Input: Character with edges = [null, undefined]
- Expected: validate() returns error for invalid types
- Related CRC: crc-CharacterValidation.md

**Test Case: Invalid Gear Type**
- Purpose: Verify validation catches non-string gear
- Setup: None
- Input: Character with gear = [123, false]
- Expected: validate() returns error for invalid types
- Related CRC: crc-CharacterValidation.md

**Test Case: Invalid WorldId Type**
- Purpose: Verify validation catches invalid worldId
- Setup: None
- Input: Character with worldId = 12345 (number instead of string)
- Expected: validate() returns error for invalid type
- Related CRC: crc-CharacterValidation.md

**Test Case: Null WorldId (Valid)**
- Purpose: Verify null worldId is valid
- Setup: None
- Input: Character with worldId = null
- Expected: validate() returns no error
- Related CRC: crc-CharacterValidation.md

#### Multiple Errors Handling

**Test Case: Accumulate Multiple Errors**
- Purpose: Verify validation reports all errors, not just first
- Setup: None
- Input: Character with missing name, invalid attribute, negative skill
- Expected: validate() returns array with all 3 errors
- Related CRC: crc-CharacterValidation.md

**Test Case: Error Messages Are Descriptive**
- Purpose: Verify error messages are clear and actionable
- Setup: None
- Input: Invalid character
- Expected: Error messages identify field and problem clearly
- Related CRC: crc-CharacterValidation.md

#### Edge-Specific Validation

**Test Case: Validate Edge Prerequisites**
- Purpose: Verify edges have required attributes/skills
- Setup: None
- Input: Character with Marksman edge but low shooting skill
- Expected: validate() returns error for missing prerequisite
- Related CRC: crc-CharacterValidation.md

**Test Case: Validate Conflicting Edges**
- Purpose: Verify mutually exclusive edges are caught
- Setup: None
- Input: Character with conflicting edges
- Expected: validate() returns error for conflict
- Related CRC: crc-CharacterValidation.md

#### Hindrance-Specific Validation

**Test Case: Validate Hindrance Limits**
- Purpose: Verify character doesn't exceed hindrance limit
- Setup: None
- Input: Character with 5+ hindrances (if limit exists)
- Expected: validate() returns warning or error
- Related CRC: crc-CharacterValidation.md

**Test Case: Validate Major vs Minor Hindrances**
- Purpose: Verify hindrance balance rules (if applicable)
- Setup: None
- Input: Character with only major hindrances
- Expected: validate() returns warning or error per rules
- Related CRC: crc-CharacterValidation.md

### Integration Tests

**Test Case: Validation in Character Editor**
- Purpose: Verify validation warnings shown in UI
- Setup: Open CharacterEditorView
- Input: Enter invalid data
- Expected: Validation warnings displayed, save not blocked
- Related CRC: crc-CharacterEditorView.md
- Related Sequence: seq-validate-character.md

**Test Case: Validation on Character Load**
- Purpose: Verify loaded characters are validated
- Setup: Save invalid character to storage
- Input: Load character via CharacterStorageService
- Expected: Validation errors identified, character still loads
- Related CRC: crc-CharacterStorageService.md

**Test Case: Validation Before World Entry**
- Purpose: Verify invalid characters cannot enter worlds
- Setup: Character with validation errors
- Input: Attempt to enter world
- Expected: Blocked from world entry, errors shown
- Related CRC: crc-AdventureMode.md

### Edge Cases

**Test Case: Validate Null Character**
- Purpose: Verify handling of null character
- Setup: None
- Input: validate(null)
- Expected: Returns error for null input
- Related CRC: crc-CharacterValidation.md

**Test Case: Validate Undefined Character**
- Purpose: Verify handling of undefined character
- Setup: None
- Input: validate(undefined)
- Expected: Returns error for undefined input
- Related CRC: crc-CharacterValidation.md

**Test Case: Validate Empty Object**
- Purpose: Verify handling of empty character object
- Setup: None
- Input: validate({})
- Expected: Returns errors for all missing required fields
- Related CRC: crc-CharacterValidation.md

**Test Case: Validate Character with Extra Fields**
- Purpose: Verify handling of unknown properties
- Setup: None
- Input: Character with extra properties not in ICharacter
- Expected: Ignores extra properties or returns warning
- Related CRC: crc-CharacterValidation.md

**Test Case: Validate Very Long Name**
- Purpose: Verify handling of excessively long names
- Setup: None
- Input: Character with 10,000 character name
- Expected: Returns error or warning for length
- Related CRC: crc-CharacterValidation.md

**Test Case: Validate Special Characters in Text Fields**
- Purpose: Verify handling of special characters
- Setup: None
- Input: Character with name containing HTML, quotes, emojis
- Expected: Accepts special characters or sanitizes appropriately
- Related CRC: crc-CharacterValidation.md

**Test Case: Validate Unicode in Text Fields**
- Purpose: Verify handling of unicode characters
- Setup: None
- Input: Character with unicode name (中文, العربية, etc.)
- Expected: Accepts unicode characters
- Related CRC: crc-CharacterValidation.md

## Coverage Goals

- Test all required fields validation
- Test all data type validations
- Test all range validations (attributes, skills, wounds)
- Test all array validations (hindrances, edges, gear)
- Test edge/hindrance rule validations
- Verify multiple errors are accumulated
- Verify error messages are clear and actionable
- Test null/undefined handling
- Test edge cases (empty objects, extra fields, special characters)

## Notes

- Validation NEVER blocks saves (per specs/ui.md)
- Validation warnings shown to user but don't prevent operations
- Invalid characters may be blocked from world entry
- Validation should be comprehensive but not overly restrictive
- Error messages should guide user to fix issues
- Validation is separate from data correction/upgrading (CharacterVersioning)
- Consider i18n for error messages in future
