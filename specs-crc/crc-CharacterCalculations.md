# CharacterCalculations

**Source Spec:** specs/characters.md
**Existing Code:** src/character/CharacterUtils.ts (CharacterCalculations class)

## Responsibilities

### Knows
- Calculation formulas for character progression
- Attribute cost multipliers (1, 3, 4)
- Chip economy rules (15 + rank total chips)
- XP pool rules (10 * rank total XP)

### Does
- calculateTotalXPForRank(rank): Calculate total XP available (10 + (rank-1) * 10)
- calculateTotalAttributeChipsForRank(rank): Calculate total chips (16 + (rank-1))
- calculateTotalAttributeCosts(attributes): Sum all attribute costs
- calculateAttributeXPSpent(character): XP spent beyond attribute chips
- calculateSpentXP(character): Total XP spent (attributes + fields + benefits)
- calculateAvailableXP(character): Unspent XP (can be negative)
- calculateAvailableAttributeChips(character): Unused attribute chips
- calculateDamageCapacity(con): Damage capacity (10 + CON)
- calculateHollowInfluence(burned): Hollow influence (1 per 100 burned)
- calculatePhysicalDamageReduction(con): Physical DR (1 per 5 CON)
- calculateSocialDamageReduction(gri): Social DR (1 per 5 GRI)
- calculateSkillLevel(skillId, fields): Skill level from field occurrences
- calculateFieldXPCostNew(field, skills): XP cost for field
- getAttributeCost(attrType): Get cost multiplier for attribute

## Collaborators

- **Character**: Reads character data to perform calculations
- **ATTRIBUTE_DEFINITIONS**: Constant data for attribute costs

## Code Review Notes

✅ **Working well:**
- Pure static methods (no state)
- Comprehensive calculation coverage
- Matches spec formulas exactly:
  - Total XP = 10 + (rank-1) * 10 ✓
  - Total chips = 16 + (rank-1) ✓ (spec says 15 + rank, same result)
  - Damage capacity = 10 + CON ✓
- Handles negative XP (overspending) correctly
- Field XP calculations support both old and new formats

✅ **Matches spec:**
- Chip economy: ✓
- XP pools: ✓
- Derived stats: ✓

📝 **Design pattern:**
- Static utility class (no instances)
- Single Responsibility: All character calculations in one place
- No side effects: Pure functions

## Sequences

- seq-calculate-available-xp.md
- seq-calculate-available-chips.md
- seq-validate-character.md (uses these calculations)
