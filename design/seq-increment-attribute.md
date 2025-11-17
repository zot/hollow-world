# Sequence: Increment Attribute

**Source Spec:** ui.characters.md
**Use Case:** User clicks increment button or scrolls mouse wheel up on attribute

## Participants

- **User**: Person using the application
- **CharacterSheet**: Character sheet renderer
- **Character**: ICharacter data
- **CharacterCalculations**: Calculation utilities
- **ATTRIBUTE_DEFINITIONS**: Attribute cost constants

## Sequence

```
               ┌─┐
               ║"│
               └┬┘
               ┌┼┐
                │             ┌──────────────┐                             ┌─────────────────────┐          ┌─────────────────────┐
               ┌┴┐            │CharacterSheet│                             │CharacterCalculations│          │ATTRIBUTE_DEFINITIONS│
              User            └───────┬──────┘                             └──────────┬──────────┘          └──────────┬──────────┘
                │  click + button    ┌┴┐                                              │                                │
                │──────────────────> │ │                                              │                                │
                │                    │ │                                              │                                │
                │                    │ │ ────┐                                        │                                │
                │                    │ │     │ handleIncrementAttribute(attrType)     │                                │
                │                    │ │ <───┘                                        │                                │
                │                    │ │                                              │                                │
                │                    │ │ ────┐                                        │                                │
                │                    │ │     │ get current value                      │                                │
                │                    │ │ <───┘                                        │                                │
                │                    │ │                                              │                                │
                │                    │ │                                              │                                │
          ╔═════╪╤═══════════════════╪═╪══════════════════════════════════════════════╪════════════════════════════════╪════════════════════╗
          ║ ALT  │  value >= 15      │ │                                              │                                │                    ║
          ╟──────┘                   │ │                                              │                                │                    ║
          ║     │                    │ │ ────┐                                        │                                │                    ║
          ║     │                    │ │     │ return (max reached)                   │                                │                    ║
          ║     │                    │ │ <───┘                                        │                                │                    ║
          ╠═════╪════════════════════╪═╪══════════════════════════════════════════════╪════════════════════════════════╪════════════════════╣
          ║ [value < 15]             │ │                                              │                                │                    ║
          ║     │                    │ │                                   get cost   │                                │                    ║
          ║     │                    │ │ ─────────────────────────────────────────────────────────────────────────────>│                    ║
          ║     │                    │ │                                              │                                │                    ║
          ║     │                    │ │  calculateTotalAttributeChipsForRank(rank)   │                                │                    ║
          ║     │                    │ │ ────────────────────────────────────────────>│                                │                    ║
          ║     │                    │ │                                              │                                │                    ║
          ║     │                    │ │          totalChips = 16 + (rank-1)          │                                │                    ║
          ║     │                    │ │ <─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                                │                    ║
          ║     │                    │ │                                              │                                │                    ║
          ║     │                    │ │ ────┐                                        │                                │                    ║
          ║     │                    │ │     │ calculate availableChips               │                                │                    ║
          ║     │                    │ │ <───┘                                        │                                │                    ║
          ║     │                    │ │                                              │                                │                    ║
          ║     │                    │ │       calculateAvailableXP(character)        │                                │                    ║
          ║     │                    │ │ ────────────────────────────────────────────>│                                │                    ║
          ║     │                    │ │                                              │                                │                    ║
          ║     │                    │ │                 availableXP                  │                                │                    ║
          ║     │                    │ │ <─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                                │                    ║
          ║     │                    │ │                                              │                                │                    ║
          ║     │                    │ │                                              │                                │                    ║
          ║     │   ╔══════╤═════════╪═╪══════════════════════════════════════════════╪════════════════════════════╗   │                    ║
          ║     │   ║ ALT  │  availableChips >= cost                                  │                            ║   │                    ║
          ║     │   ╟──────┘         │ │                                              │                            ║   │                    ║
          ║     │   ║                │ │ ────┐                          ╔═════════════╧═════╗                      ║   │                    ║
          ║     │   ║                │ │     │ increment attribute      ║Spend chips first ░║                      ║   │                    ║
          ║     │   ║                │ │ <───┘                          ╚═════════════╤═════╝                      ║   │                    ║
          ║     │   ╠════════════════╪═╪══════════════════════════════════════════════╪════════════════════════════╣   │                    ║
          ║     │   ║ [availableXP >= cost]                                           │                            ║   │                    ║
          ║     │   ║                │ │ ────┐                          ╔═════════════╧════════════════╗           ║   │                    ║
          ║     │   ║                │ │     │ increment attribute      ║Spend XP if not enough chips ░║           ║   │                    ║
          ║     │   ║                │ │ <───┘                          ╚═════════════╤════════════════╝           ║   │                    ║
          ║     │   ╠════════════════╪═╪══════════════════════════════════════════════╪════════════════════════════╣   │                    ║
          ║     │   ║ [not enough resources]                                          │                            ║   │                    ║
          ║     │   ║                │ │ ────┐                                        │                            ║   │                    ║
          ║     │   ║                │ │     │ return (insufficient resources)        │                            ║   │                    ║
          ║     │   ║                │ │ <───┘                                        │                            ║   │                    ║
          ║     │   ╚════════════════╪═╪══════════════════════════════════════════════╪════════════════════════════╝   │                    ║
          ║     │                    │ │                                              │                                │                    ║
          ║     │                    │ │ ────┐                                        │                                │                    ║
          ║     │                    │ │     │ updateResourceDisplays()               │                                │                    ║
          ║     │                    │ │ <───┘                                        │                                │                    ║
          ║     │                    │ │                                              │                                │                    ║
          ║     │                    │ │ ────┐                                        │                                │                    ║
          ║     │                    │ │     │ updateAttributeButtonStates()          │                                │                    ║
          ║     │                    │ │ <───┘                                        │                                │                    ║
          ║     │                    │ │                                              │                                │                    ║
          ║     │                    │ │ ────┐                                        │                                │                    ║
          ║     │                    │ │     │ triggerChangeCallback()                │                                │                    ║
          ║     │                    │ │ <───┘                                        │                                │                    ║
          ╚═════╪════════════════════╪═╪══════════════════════════════════════════════╪════════════════════════════════╪════════════════════╝
              User            ┌──────└┬┘─────┐                             ┌──────────┴──────────┐          ┌──────────┴──────────┐
               ┌─┐            │CharacterSheet│                             │CharacterCalculations│          │ATTRIBUTE_DEFINITIONS│
               ║"│            └──────────────┘                             └─────────────────────┘          └─────────────────────┘
               └┬┘
               ┌┼┐
                │
               ┌┴┐
```

## Current Implementation vs Spec

**✅ Correctly implemented:**
- Range validation (-2 to 15)
- Resource checking (chips + XP)
- Priority spending (chips first, then XP)
- Live resource display updates
- Button state management
- Change detection triggers

**✅ Matches spec:**
- Priority spending: Attribute Chips first, then XP ✓
- Live validation: Prevent increment if insufficient resources ✓
- Don't allow increment unless:
  - New value is in range ✓
  - There's enough XP and Attribute Chips to pay ✓
- Update displayed available XP and Attribute Chips ✓

**📝 Resource spending priority (per spec):**
1. Take from Attribute Chips first
2. When chips depleted (0), take from XP
3. Negative chips displayed as 0 (excess auto-deducted from XP)

**📝 Button state logic:**
- Increment disabled when:
  - Attribute at max (15), OR
  - Insufficient resources (chips + XP < cost)
- Decrement disabled when:
  - Attribute at min (-2)

## Implementation Notes

**Attribute Costs:**
```typescript
// Cost multiplier by attribute type
DEX: 4 chips/XP
STR: 3 chips/XP
CON: 1 chip/XP
CHA: 4 chips/XP
WIS: 3 chips/XP
GRI: 1 chip/XP
INT: 4 chips/XP
PER: 4 chips/XP
```

**Resource Calculation:**
```typescript
// Total chips = 16 + (rank - 1)
// Rank 1: 16 chips
// Rank 5: 20 chips

// Total XP = 10 + (rank - 1) * 10
// Rank 1: 10 XP
// Rank 5: 50 XP

// Available chips = total chips - sum of attribute costs
// If negative, show as 0 (excess deducted from XP automatically)

// Available XP = total XP - (spent on fields + spent on overages)
// Show in RED if negative
```

**Mouse Wheel Support:**
- Scroll up → increment
- Scroll down → decrement
- Same validation as button clicks
- Respects range and resource limits

## Notes

- Chips spent before XP (priority spending)
- Negative available chips shown as 0 (per spec)
- Negative available XP shown in red (per spec)
- Button states update immediately after any attribute change
- All attribute changes trigger change detection
- Change detection uses 250ms polling (per ui.md)

## Related CRC Cards

- crc-CharacterSheet.md
- crc-CharacterCalculations.md (Phase 1)
- crc-Character.md (Phase 1)

