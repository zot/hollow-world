# Sequence: Validate Character

**Source Spec:** specs/characters.md
**Use Case:** Validate character data before saving (called from editor)

## Participants

- **CharacterEditorView**: Character editing UI
- **CharacterValidation**: Validation logic utility
- **CharacterCalculations**: Calculation utility (for totals and costs)

## Sequence

```
     ┌───────────────────┐                 ┌───────────────────┐                 ┌─────────────────────┐
     │CharacterEditorView│                 │CharacterValidation│                 │CharacterCalculations│
     └─────────┬─────────┘                 └─────────┬─────────┘                 └──────────┬──────────┘
               │validateCharacterCreation(character) │                                      │
               │────────────────────────────────────>│                                      │
               │                                     │                                      │
               │                                     │────┐                                 │
               │                                     │    │ check name not empty            │
               │                                     │<───┘                                 │
               │                                     │                                      │
               │                                     │────┐                                 │
               │                                     │    │ validate attributes (range 0-4) │
               │                                     │<───┘                                 │
               │                                     │                                      │
               │                                     │────┐                                 │
               │                                     │    │ check attribute total           │
               │                                     │<───┘                                 │
               │                                     │                                      │
               │                                     │ calculateAttributeTotal(attributes)  │
               │                                     │─────────────────────────────────────>│
               │                                     │                                      │
               │                                     │                total                 │
               │                                     │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
               │                                     │                                      │
               │                                     │────┐                                 │
               │                                     │    │ check skills prerequisites      │
               │                                     │<───┘                                 │
               │                                     │                                      │
               │                                     │────┐                                 │
               │                                     │    │ validate fields structure       │
               │                                     │<───┘                                 │
               │                                     │                                      │
               │                                     │     calculateChipCost(character)     │
               │                                     │─────────────────────────────────────>│
               │                                     │                                      │
               │                                     │                cost                  │
               │                                     │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
               │                                     │                                      │
               │                                     │────┐                                 │
               │                                     │    │ check cost <= available chips   │
               │                                     │<───┘                                 │
               │                                     │                                      │
               │     errors[] (empty if valid)       │                                      │
               │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                                      │
     ┌─────────┴─────────┐                 ┌─────────┴─────────┐                 ┌──────────┴──────────┐
     │CharacterEditorView│                 │CharacterValidation│                 │CharacterCalculations│
     └───────────────────┘                 └───────────────────┘                 └─────────────────────┘
```

## Validation Rules

**Checked by CharacterValidation:**

1. **Name**: Must not be empty
2. **Attributes**: Must be in range 0-4 (for creation)
   - Note: Storage allows -2 to 15 (for effects/modifications)
3. **Attribute Total**: Sum must equal expected value (per character creation rules)
4. **Skills**: All prerequisites must be met
5. **Fields**: Structure must match schema
6. **Chip Economy**: Total cost must not exceed available chips

## Return Value

Returns `string[]` array:
- **Empty array** = character is valid
- **Non-empty array** = contains error messages

Example errors:
```typescript
[
  "Character name is required",
  "Attribute STR must be between 0 and 4",
  "Attribute total must equal 50",
  "Skill 'Advanced Combat' requires 'Basic Combat'",
  "Not enough chips for selected options"
]
```

## Implementation Notes

**✅ Correctly implemented:**
- Non-throwing validation (returns errors, doesn't throw)
- Comprehensive rule checking
- Delegates calculations to CharacterCalculations
- Static utility methods (no state)

**⚠️ Spec clarity needed:**
- Attribute range: Creation uses 0-4, storage allows -2 to 15
- Should validation enforce creation range or storage range?
- Current code: Different ranges for different contexts

## UI Integration

Per spec: **Validation NEVER blocks saves**
- Errors are displayed to user
- User can choose to save anyway
- This allows saving "work in progress" characters
- Final validation happens at gameplay time

## Notes

- Validation is pure function (no side effects)
- Can be called multiple times safely
- Used by both UI and storage service
- Chip economy calculations ensure game balance

## Related CRC Cards

- crc-CharacterEditorView.md
- crc-CharacterValidation.md
- crc-CharacterCalculations.md
