# Test Design: Character

**Component:** Character (ICharacter interface and related types)
**CRC Reference:** crc-Character.md
**Spec Reference:** specs/characters.md
**Implementation Test:** test/character-sync.test.ts (partial), test/characterHash.test.ts (related)

## Component Overview

The Character component defines the core data structure for Hollow TTRPG characters, including attributes (strength, agility, vigor, smarts, spirit), skills, hindrances, edges, gear, and wounds.

## Test Categories

### Unit Tests

#### Data Structure Tests
Tests for the ICharacter interface and Character type definition.

**Test Case: Valid Character Structure**
- Purpose: Verify complete character object matches ICharacter interface
- Setup: None
- Input: Complete character object with all required fields
- Expected: TypeScript compilation succeeds, all properties accessible
- Related CRC: crc-Character.md (Knows section)

**Test Case: Character Versioning**
- Purpose: Verify version field is present and tracked
- Setup: Create character with version 1
- Input: Character object
- Expected: version property exists and equals 1
- Related CRC: crc-CharacterVersioning.md

**Test Case: Character ID Uniqueness**
- Purpose: Verify each character has unique UUID
- Setup: Create multiple characters
- Input: Array of characters
- Expected: All character IDs are unique UUIDs
- Related CRC: crc-CharacterFactory.md

**Test Case: Attribute Structure**
- Purpose: Verify attributes object contains all required fields
- Setup: None
- Input: Character with attributes
- Expected: attributes contains strength, agility, vigor, smarts, spirit
- Related CRC: crc-Character.md

**Test Case: Skills Map**
- Purpose: Verify skills can be added/removed dynamically
- Setup: Create character with initial skills
- Input: Add/remove skill entries
- Expected: Skills object is mutable dictionary
- Related CRC: crc-Character.md

**Test Case: Hindrances Array**
- Purpose: Verify hindrances array accepts string values
- Setup: Create character
- Input: Add hindrance strings
- Expected: Hindrances array contains strings
- Related CRC: crc-Character.md

**Test Case: Edges Array**
- Purpose: Verify edges array accepts string values
- Setup: Create character
- Input: Add edge strings
- Expected: Edges array contains strings
- Related CRC: crc-Character.md

**Test Case: Gear Array**
- Purpose: Verify gear array accepts string values
- Setup: Create character
- Input: Add gear strings
- Expected: Gear array contains strings
- Related CRC: crc-Character.md

**Test Case: Wounds Tracking**
- Purpose: Verify wounds field is numeric
- Setup: Create character
- Input: Set wounds to various numeric values
- Expected: Wounds accepts numeric values (0, 1, 2, 3+)
- Related CRC: crc-Character.md

**Test Case: WorldId Optional**
- Purpose: Verify worldId can be null or string
- Setup: Create character
- Input: Set worldId to null, then to UUID string
- Expected: Both null and UUID string accepted
- Related CRC: crc-Character.md

### Edge Cases

**Test Case: Minimum Valid Character**
- Purpose: Verify minimal character with only required fields
- Setup: None
- Input: Character with id, version, name, attributes, empty arrays
- Expected: Character is valid
- Related CRC: crc-CharacterFactory.md

**Test Case: Empty Skills Map**
- Purpose: Verify character with no skills is valid
- Setup: Create character
- Input: Empty skills object
- Expected: Character is valid with skills = {}
- Related CRC: crc-Character.md

**Test Case: Empty Arrays**
- Purpose: Verify character with empty hindrances/edges/gear
- Setup: Create character
- Input: Empty arrays for hindrances, edges, gear
- Expected: Character is valid
- Related CRC: crc-Character.md

**Test Case: Negative Attributes**
- Purpose: Verify handling of negative attribute values
- Setup: Create character
- Input: Negative attribute values
- Expected: Should be validated elsewhere (CharacterValidation), but data structure allows it
- Related CRC: crc-CharacterValidation.md

**Test Case: Negative Wounds**
- Purpose: Verify handling of negative wounds
- Setup: Create character
- Input: wounds = -1
- Expected: Should be validated elsewhere, but data structure allows it
- Related CRC: crc-CharacterValidation.md

**Test Case: Very Long Character Name**
- Purpose: Verify handling of long names
- Setup: Create character
- Input: name = 1000 character string
- Expected: Character accepts long names (validation is separate)
- Related CRC: crc-CharacterValidation.md

## Coverage Goals

- 100% coverage of ICharacter interface properties
- Verify all required fields are present
- Verify all optional fields (worldId) work correctly
- Verify data structure accepts valid values
- Verify TypeScript type checking works correctly
- Validation logic tested separately in CharacterValidation tests

## Notes

- Character is a data structure (interface), not a class
- Validation is handled by CharacterValidation component
- Creation logic is in CharacterFactory component
- This test design focuses on data structure integrity
- TypeScript provides compile-time guarantees, runtime tests verify behavior
