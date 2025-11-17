# Sequence: TextCraft Character Synchronization

**CRC Cards:** crc-CharacterSync.md, crc-Character.md
**Spec:** integrate-textcraft.md

## Overview

This sequence shows bidirectional synchronization between Hollow World character sheets
and TextCraft Thing properties. Changes in either system propagate to the other.

## Participants

- **Character Sheet** - Hollow World character UI
- **Character Manager** - Hollow World character management
- **CharacterThingAdapter** - Sync adapter (future - currently uses CharacterSync functions)
- **Thing** - TextCraft entity
- **MudConnection** - TextCraft command system

## Flow: Character Sheet → TextCraft

1. User modifies an attribute in the character sheet (e.g., brawn = 12)
2. Character Manager updates the character
3. Adapter syncs the change to the corresponding Thing property
4. Thing fires onPropertyChanged event
5. MudConnection recalculates any derived stats

## Flow: TextCraft → Character Sheet

1. MUD command modifies a Thing property (e.g., hp = 8)
2. Thing fires onPropertyChanged event
3. Adapter catches the event
4. Adapter updates Character Manager with new value
5. Character Manager refreshes the Character Sheet

## Sequence Diagram

```
     ┌───────────────┐            ┌─────────────────┐             ┌─────────────────────┐              ┌─────┐              ┌─────────────┐
     │Character Sheet│            │Character Manager│             │CharacterThingAdapter│              │Thing│              │MudConnection│
     └───────┬───────┘            └────────┬────────┘             └──────────┬──────────┘              └──┬──┘              └──────┬──────┘
             │updateAttribute('brawn', 12) │ ╔═══════════════════════════════╧═══════╗                    │                        │
             │────────────────────────────>│ ║User modifies stat in character sheet ░║                    │                        │
             │                             │ ╚═══════════════════════════════╤═══════╝                    │                        │
             │                             │     syncToThing(character)      │                            │                        │
             │                             │────────────────────────────────>│                            │                        │
             │                             │                                 │                            │                        │
             │                             │                                 │setProperty('strength', 12) │                        │
             │                             │                                 │───────────────────────────>│                        │
             │                             │                                 │                            │                        │
             │                             │                                 │                            │onPropertyChanged event │
             │                             │                                 │                            │───────────────────────>│
             │                             │                                 │                            │                        │
             │                             │                                 │                       ╔════╧══════════════════════╗ │────┐
             │                             │                                 │                       ║MUD command modifies stat ░║ │    │ Recalculate derived stats
             │                             │                                 │                       ╚════╤══════════════════════╝ │<───┘
             │                             │                                 │                            │                        │
             │                             │                                 │                            │ setProperty('hp', 8)   │
             │                             │                                 │                            │<───────────────────────│
             │                             │                                 │                            │                        │
             │                             │                                 │  onPropertyChanged event   │                        │
             │                             │                                 │<───────────────────────────│                        │
             │                             │                                 │                            │                        │
             │                             │updateCharacter(property, value) │                            │                        │
             │                             │<────────────────────────────────│                            │                        │
             │                             │                                 │                            │                        │
             │         refresh()           │                                 │                            │                        │
             │<────────────────────────────│                                 │                            │                        │
     ┌───────┴───────┐            ┌────────┴────────┐             ┌──────────┴──────────┐              ┌──┴──┐              ┌──────┴──────┐
     │Character Sheet│            │Character Manager│             │CharacterThingAdapter│              │Thing│              │MudConnection│
     └───────────────┘            └─────────────────┘             └─────────────────────┘              └─────┘              └─────────────┘
```

## Key Points

- **Bidirectional**: Changes flow both ways (Sheet ↔ TextCraft)
- **Event-driven**: Thing property changes trigger events
- **Reference-only**: Things store characterId, not character data
- **Single source of truth**: Character data stays in world.charactersStore
- **Derived stats**: MudConnection recalculates stats when properties change
- **Future enhancement**: CharacterThingAdapter will be implemented as formal adapter class

## Current Implementation

Currently uses `CharacterSync` module (src/textcraft/character-sync.ts) with functions:
- `getCharacterForThing()` - Retrieve character data for a Thing
- `createThingForCharacter()` - Create Thing for character

Full bidirectional event-driven sync to be implemented in future phase.
