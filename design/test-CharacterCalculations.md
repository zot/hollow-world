# Test Design: CharacterCalculations

**Component:** CharacterCalculations
**CRC Reference:** crc-CharacterCalculations.md
**Spec Reference:** specs/characters.md, specs/Hollow-summary.md
**Implementation Test:** No dedicated test file yet (needs creation)

## Component Overview

CharacterCalculations provides utility functions for calculating derived character statistics based on Hollow TTRPG rules, including attribute modifiers, skill totals, and combat values.

## Test Categories

### Unit Tests

#### Attribute Modifier Calculations

**Test Case: Calculate Modifier for Attribute 4**
- Purpose: Verify modifier calculation for average attribute
- Setup: None
- Input: attribute value = 4
- Expected: modifier = 0 (or per Hollow rules)
- Related CRC: crc-CharacterCalculations.md (calculateAttributeModifier)

**Test Case: Calculate Modifier for Low Attribute**
- Purpose: Verify modifier for below-average attributes
- Setup: None
- Input: attribute values 1, 2, 3
- Expected: Correct negative modifiers per Hollow rules
- Related CRC: crc-CharacterCalculations.md

**Test Case: Calculate Modifier for High Attribute**
- Purpose: Verify modifier for above-average attributes
- Setup: None
- Input: attribute values 6, 8, 10, 12
- Expected: Correct positive modifiers per Hollow rules
- Related CRC: crc-CharacterCalculations.md

**Test Case: Calculate Modifier for Edge Values**
- Purpose: Verify modifier for minimum/maximum attributes
- Setup: None
- Input: attribute values 1, 12 (typical range)
- Expected: Correct modifiers for extremes
- Related CRC: crc-CharacterCalculations.md

**Test Case: Calculate Modifier for Invalid Values**
- Purpose: Verify handling of out-of-range attributes
- Setup: None
- Input: attribute values 0, -1, 15, 100
- Expected: Returns error, clamps to valid range, or handles gracefully
- Related CRC: crc-CharacterCalculations.md, crc-CharacterValidation.md

#### Skill Total Calculations

**Test Case: Calculate Skill Total (Attribute Only)**
- Purpose: Verify skill total when character has no ranks
- Setup: Character with strength=6, shooting skill not in skills map
- Input: Calculate shooting skill total
- Expected: Total equals strength modifier only
- Related CRC: crc-CharacterCalculations.md (calculateSkillTotal)

**Test Case: Calculate Skill Total (Attribute + Ranks)**
- Purpose: Verify skill total with attribute and skill ranks
- Setup: Character with agility=8, shooting=12 in skills map
- Input: Calculate shooting skill total
- Expected: Total = agility modifier + 12
- Related CRC: crc-CharacterCalculations.md

**Test Case: Calculate Multiple Skill Totals**
- Purpose: Verify calculating totals for multiple skills
- Setup: Character with various attributes and skills
- Input: Calculate totals for shooting, fighting, persuasion
- Expected: Correct totals for each skill
- Related CRC: crc-CharacterCalculations.md

**Test Case: Skill Total with Zero Ranks**
- Purpose: Verify skill with explicit 0 ranks
- Setup: Character with skills: { shooting: 0 }
- Input: Calculate shooting total
- Expected: Total = attribute modifier + 0
- Related CRC: crc-CharacterCalculations.md

**Test Case: Skill Total with Negative Ranks**
- Purpose: Verify handling of invalid negative skill ranks
- Setup: Character with skills: { shooting: -5 }
- Input: Calculate shooting total
- Expected: Error or clamps to 0
- Related CRC: crc-CharacterCalculations.md, crc-CharacterValidation.md

#### Toughness Calculation

**Test Case: Calculate Toughness (Base)**
- Purpose: Verify toughness calculation from vigor
- Setup: Character with vigor=6
- Input: Calculate toughness
- Expected: Toughness = 2 + vigor/2 (or per Hollow rules)
- Related CRC: crc-CharacterCalculations.md (calculateToughness)

**Test Case: Calculate Toughness with Armor**
- Purpose: Verify toughness includes armor bonus
- Setup: Character with vigor=6, gear includes armor
- Input: Calculate toughness
- Expected: Toughness = base + armor value
- Related CRC: crc-CharacterCalculations.md

**Test Case: Calculate Toughness with Edge Bonus**
- Purpose: Verify toughness modified by edges
- Setup: Character with vigor=6, edges include Brawny
- Input: Calculate toughness
- Expected: Toughness includes edge bonus
- Related CRC: crc-CharacterCalculations.md

**Test Case: Toughness with Low Vigor**
- Purpose: Verify toughness at minimum vigor
- Setup: Character with vigor=1
- Input: Calculate toughness
- Expected: Correct toughness for low vigor
- Related CRC: crc-CharacterCalculations.md

**Test Case: Toughness with High Vigor**
- Purpose: Verify toughness at maximum vigor
- Setup: Character with vigor=12
- Input: Calculate toughness
- Expected: Correct toughness for high vigor
- Related CRC: crc-CharacterCalculations.md

#### Parry Calculation

**Test Case: Calculate Parry (Base)**
- Purpose: Verify parry calculation from fighting skill
- Setup: Character with agility=6, no fighting skill
- Input: Calculate parry
- Expected: Parry = 2 + fighting skill/2 (or per Hollow rules)
- Related CRC: crc-CharacterCalculations.md (calculateParry)

**Test Case: Calculate Parry with Fighting Skill**
- Purpose: Verify parry with fighting skill ranks
- Setup: Character with agility=6, fighting=10
- Input: Calculate parry
- Expected: Parry includes fighting skill bonus
- Related CRC: crc-CharacterCalculations.md

**Test Case: Calculate Parry with Shield**
- Purpose: Verify parry bonus from shield
- Setup: Character with fighting skill, gear includes shield
- Input: Calculate parry
- Expected: Parry includes shield bonus
- Related CRC: crc-CharacterCalculations.md

**Test Case: Parry with Edge Bonus**
- Purpose: Verify parry modified by edges
- Setup: Character with First Strike or similar edge
- Input: Calculate parry
- Expected: Parry includes edge bonus
- Related CRC: crc-CharacterCalculations.md

**Test Case: Parry with No Fighting Skill**
- Purpose: Verify parry for untrained character
- Setup: Character with no fighting in skills map
- Input: Calculate parry
- Expected: Minimum parry value (2 or per rules)
- Related CRC: crc-CharacterCalculations.md

#### Pace Calculation

**Test Case: Calculate Pace (Normal)**
- Purpose: Verify base pace calculation
- Setup: Character with normal attributes
- Input: Calculate pace
- Expected: Pace = 6 (standard) or per Hollow rules
- Related CRC: crc-CharacterCalculations.md (calculatePace)

**Test Case: Calculate Pace with Fleet-Footed Edge**
- Purpose: Verify pace bonus from edge
- Setup: Character with Fleet-Footed edge
- Input: Calculate pace
- Expected: Pace = base + edge bonus
- Related CRC: crc-CharacterCalculations.md

**Test Case: Calculate Pace with Hindrance**
- Purpose: Verify pace penalty from hindrance
- Setup: Character with Lame hindrance
- Input: Calculate pace
- Expected: Pace = base - hindrance penalty
- Related CRC: crc-CharacterCalculations.md

**Test Case: Running Distance Calculation**
- Purpose: Verify running distance from pace
- Setup: Character with pace=6
- Input: Calculate running distance
- Expected: Running = pace + d6 roll (or pace modifier)
- Related CRC: crc-CharacterCalculations.md

### Integration Tests

**Test Case: Full Character Stats Calculation**
- Purpose: Verify calculating all derived stats for complete character
- Setup: Full character with attributes, skills, edges, hindrances, gear
- Input: Calculate all derived stats (modifiers, skills, toughness, parry, pace)
- Expected: All stats calculated correctly and consistently
- Related CRC: crc-CharacterCalculations.md
- Related Sequence: seq-render-character-list.md

**Test Case: Stats Update After Attribute Change**
- Purpose: Verify recalculation when attributes change
- Setup: Character with calculated stats
- Input: Increase strength from 4 to 6
- Expected: Strength modifier and related skills update
- Related CRC: crc-CharacterCalculations.md

**Test Case: Stats Update After Skill Change**
- Purpose: Verify recalculation when skills change
- Setup: Character with calculated stats
- Input: Increase shooting skill from 8 to 10
- Expected: Shooting total updates
- Related CRC: crc-CharacterCalculations.md

**Test Case: Stats Update After Edge Addition**
- Purpose: Verify recalculation when edges added
- Setup: Character with calculated stats
- Input: Add Marksman edge
- Expected: Related stats (shooting) update
- Related CRC: crc-CharacterCalculations.md

### Edge Cases

**Test Case: Calculate Stats for Invalid Character**
- Purpose: Verify handling of character with missing data
- Setup: Character with missing attributes
- Input: Calculate derived stats
- Expected: Returns error or uses defaults
- Related CRC: crc-CharacterCalculations.md, crc-CharacterValidation.md

**Test Case: Calculate Stats with Null Values**
- Purpose: Verify handling of null/undefined values
- Setup: Character with null attributes
- Input: Calculate modifiers
- Expected: Handles gracefully, returns error or default
- Related CRC: crc-CharacterCalculations.md

**Test Case: Calculate Stats with Extreme Values**
- Purpose: Verify handling of out-of-range values
- Setup: Character with attribute=999, skill=1000
- Input: Calculate stats
- Expected: Clamps to valid range or returns error
- Related CRC: crc-CharacterCalculations.md

**Test Case: Cumulative Bonuses**
- Purpose: Verify multiple bonuses stack correctly
- Setup: Character with edge bonus + gear bonus + skill ranks
- Input: Calculate total
- Expected: All bonuses applied correctly (stack or don't per rules)
- Related CRC: crc-CharacterCalculations.md

**Test Case: Negative Total After Penalties**
- Purpose: Verify handling of excessive penalties
- Setup: Character with low attribute + multiple hindrances
- Input: Calculate stat
- Expected: Handles negative totals per Hollow rules
- Related CRC: crc-CharacterCalculations.md

## Coverage Goals

- Test all calculation methods (attribute modifiers, skill totals, toughness, parry, pace)
- Verify calculations match Hollow TTRPG rules exactly
- Test edge cases (min/max values, null values, invalid data)
- Verify bonuses and penalties apply correctly
- Test integration with Character data structure
- Verify calculations are stateless (pure functions)

## Notes

- Calculations must match Hollow TTRPG rules precisely
- Functions should be pure (no side effects, same input → same output)
- See specs/Hollow-summary.md for official rules
- Validation is separate (CharacterValidation), calculations assume valid input
- Consider edge/hindrance effects on all stats
- May need lookup tables for edge/hindrance effects
