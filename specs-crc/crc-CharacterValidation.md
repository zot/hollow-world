# CharacterValidation

**Source Spec:** specs/characters.md
**Existing Code:** src/character/CharacterUtils.ts (CharacterValidation class)

## Responsibilities

### Knows
- Validation rules for character creation
- Attribute range constraints (min/max)
- Skill prerequisite rules
- Field validation rules

### Does
- validateCharacterCreation(character): Check name, attributes, chip economy
- validateAttributes(attributes): Ensure attributes in valid range
- validateSkillPrerequisites(character): Check skill requirements met
- validateFields(character): Validate field structure and frozen status
- (Returns string[] of error messages)

## Collaborators

- **Character**: Validates character data
- **CharacterCalculations**: Uses calculations to validate resources
- **CHARACTER_CREATION_RULES**: Constant validation rules

## Code Review Notes

✅ **Working well:**
- Pure static methods (no state)
- Returns error arrays (not exceptions)
- Comprehensive validation coverage
- Checks defined in spec implemented

✅ **Matches spec:**
- Name required ✓
- Attributes 0-4 range ✓ (spec says -2 to 15 in some places, need to clarify)
- Chip economy validation ✓
- Skill prerequisites ✓

⚠️ **Potential issue:**
- Attribute range inconsistency:
  - Spec says: -2 to 15 (specs/characters.md line 510)
  - Code validates: 0-4 in creation, -2 to 15 in storage
  - Need clarification on actual range

📝 **Design pattern:**
- Static utility class
- Non-throwing: Returns errors instead of exceptions
- Allows UI to display multiple errors at once

## Sequences

- seq-validate-character.md
- seq-save-character.md (includes validation step)
