# Character

**Source Spec:** specs/characters.md
**Existing Code:** src/character/types.ts (ICharacter interface)

## Responsibilities

### Knows
- id: string (UUID) - unique identifier
- name: string - character name
- description: string - character background
- version: string - app version for migrations
- rank: number (1-15) - character level
- attributes: IAttributes - 8 attributes (DEX, STR, CON, CHA, WIS, GRI, INT, PER)
- skills: ISkill[] - learned skills
- fields: IField[] - field specializations
- benefits: IBenefit[] - character benefits
- drawbacks: IDrawback[] - character drawbacks
- hollow: IHollowData - hollow corruption tracking (dust, burned, influence, etc.)
- items: IItem[] - equipment and possessions
- companions: ICompanion[] - animal/person companions
- damageCapacity: number - derived from CON (10 + CON)
- worldId?: string - world association (null = editable, string = read-only)
- createdAt: Date - creation timestamp
- updatedAt: Date - last modification timestamp

### Does
- (No behavior - pure data model)
- All behavior delegated to utility classes (CharacterCalculations, CharacterValidation)

## Collaborators

None - Character is a pure data structure (interface/type, not class)

## Code Review Notes

✅ **Working well:**
- Comprehensive data model covering all spec requirements
- Clear interface definition with TypeScript types
- Includes world association field for Phase 3 (future)
- Version field supports schema evolution

⚠️ **Potential issue:**
- Some fields are marked DEPRECATED in code (totalXP, currentXP) but still in interface
- Spec describes `characterHash` field but it's NOT in the ICharacter interface

❌ **Missing:**
- `characterHash` field (spec says it should be part of ICharacter)
- `isFrozen` field (spec mentions this for locking characters)

📝 **Extra (code has, spec doesn't mention):**
- `attributeChipsSpent` field - appears to be for tracking positive/negative chips

## Sequences

- seq-create-character.md
- seq-load-character.md
- seq-save-character.md
- seq-validate-character.md
- seq-calculate-derived-stats.md
