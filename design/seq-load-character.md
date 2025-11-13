# Sequence: Load Character

**Source Spec:** specs/characters.md, specs/storage.md
**Use Case:** User selects a character to edit (includes version migration and hash initialization)

## Participants

- **User**: Person using the application
- **CharacterManagerView**: Character list/selection UI
- **CharacterStorageService**: Character persistence service
- **ProfileService**: Profile-scoped storage wrapper
- **LocalStorage**: Browser localStorage API
- **CharacterVersioning**: Schema migration logic
- **CharacterHash**: Hash calculation utility
- **CharacterEditorView**: Character editing UI

## Sequence

```
     ┌────┐           ┌────────────────────┐           ┌───────────────────────┐          ┌──────────────┐           ┌────────────┐           ┌───────────────────┐                 ┌─────────────┐          ┌───────────────────┐
     │User│           │CharacterManagerView│           │CharacterStorageService│          │ProfileService│           │LocalStorage│           │CharacterVersioning│                 │CharacterHash│          │CharacterEditorView│
     └──┬─┘           └──────────┬─────────┘           └───────────┬───────────┘          └───────┬──────┘           └──────┬─────┘           └─────────┬─────────┘                 └──────┬──────┘          └─────────┬─────────┘
        │   select character     │                                 │                              │                         │                           │                                  │                           │
        │───────────────────────>│                                 │                              │                         │                           │                                  │                           │
        │                        │                                 │                              │                         │                           │                                  │                           │
        │                        │       getAllCharacters()        │                              │                         │                           │                                  │                           │
        │                        │────────────────────────────────>│                              │                         │                           │                                  │                           │
        │                        │                                 │                              │                         │                           │                                  │                           │
        │                        │                                 │    getItem(STORAGE_KEY)      │                         │                           │                                  │                           │
        │                        │                                 │─────────────────────────────>│                         │                           │                                  │                           │
        │                        │                                 │                              │                         │                           │                                  │                           │
        │                        │                                 │                              │      getItem(key)       │                           │                                  │                           │
        │                        │                                 │                              │────────────────────────>│                           │                                  │                           │
        │                        │                                 │                              │                         │                           │                                  │                           │
        │                        │                                 │                              │       JSON data         │                           │                                  │                           │
        │                        │                                 │                              │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                           │                                  │                           │
        │                        │                                 │                              │                         │                           │                                  │                           │
        │                        │                                 │        characters[]          │                         │                           │                                  │                           │
        │                        │                                 │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                         │                           │                                  │                           │
        │                        │                                 │                              │                         │                           │                                  │                           │
        │                        │                                 │────┐                         │                         │                           │                                  │                           │
        │                        │                                 │    │ for each character      │                         │                           │                                  │                           │
        │                        │                                 │<───┘                         │                         │                           │                                  │                           │
        │                        │                                 │                              │                         │                           │                                  │                           │
        │                        │                                 │                        upgradeCharacterToLatest(character)                         │                                  │                           │
        │                        │                                 │───────────────────────────────────────────────────────────────────────────────────>│                                  │                           │
        │                        │                                 │                              │                         │                           │                                  │                           │
        │                        │                                 │                              │                         │                           │                                  │                           │
        │                        │           ╔══════╤══════════════╪══════════════════════════════╪═════════════════════════╪═══════════════════════════╪══════════════════════════════════╪═══╗                       │
        │                        │           ║ ALT  │  needs upgrade                              │                         │                           │                                  │   ║                       │
        │                        │           ╟──────┘              │                              │                         │                           │                                  │   ║                       │
        │                        │           ║                     │                              │                         │                           │────┐                             │   ║                       │
        │                        │           ║                     │                              │                         │                           │    │ findSchemaIndex(version)    │   ║                       │
        │                        │           ║                     │                              │                         │                           │<───┘                             │   ║                       │
        │                        │           ║                     │                              │                         │                           │                                  │   ║                       │
        │                        │           ║                     │                              │                         │                           │────┐                             │   ║                       │
        │                        │           ║                     │                              │                         │                           │    │ apply upgrades sequentially │   ║                       │
        │                        │           ║                     │                              │                         │                           │<───┘                             │   ║                       │
        │                        │           ║                     │                              │                         │                           │                                  │   ║                       │
        │                        │           ║                     │                              │ upgraded character      │                           │                                  │   ║                       │
        │                        │           ║                     │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                                  │   ║                       │
        │                        │           ╠═════════════════════╪══════════════════════════════╪═════════════════════════╪═══════════════════════════╪══════════════════════════════════╪═══╣                       │
        │                        │           ║ [already latest]    │                              │                         │                           │                                  │   ║                       │
        │                        │           ║                     │                              │ character unchanged     │                           │                                  │   ║                       │
        │                        │           ║                     │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                                  │   ║                       │
        │                        │           ╚═════════════════════╪══════════════════════════════╪═════════════════════════╪═══════════════════════════╪══════════════════════════════════╪═══╝                       │
        │                        │                                 │                              │                         │                           │                                  │                           │
        │                        │                                 │                              │           calculateCharacterHash(character)         │                                  │                           │
        │                        │                                 │──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────>│                           │
        │                        │                                 │                              │                         │                           │                                  │                           │
        │                        │                                 │                              │                         │hash                       │                                  │                           │
        │                        │                                 │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                           │
        │                        │                                 │                              │                         │                           │                                  │                           │
        │                        │                                 │────┐                         │                         │                           │                                  │                           │
        │                        │                                 │    │ set characterHash       │                         │                           │                                  │                           │
        │                        │                                 │<───┘                         │                         │                           │                                  │                           │
        │                        │                                 │                              │                         │                           │                                  │                           │
        │                        │          characters[]           │                              │                         │                           │                                  │                           │
        │                        │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                              │                         │                           │                                  │                           │
        │                        │                                 │                              │                         │                           │                                  │                           │
        │                        │                                 │                              │             navigate with character                 │                                  │                           │
        │                        │────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────>│
        │                        │                                 │                              │                         │                           │                                  │                           │
        │                        │                                 │                              │ display character form  │                           │                                  │                           │
        │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
     ┌──┴─┐           ┌──────────┴─────────┐           ┌───────────┴───────────┐          ┌───────┴──────┐           ┌──────┴─────┐           ┌─────────┴─────────┐                 ┌──────┴──────┐          ┌─────────┴─────────┐
     │User│           │CharacterManagerView│           │CharacterStorageService│          │ProfileService│           │LocalStorage│           │CharacterVersioning│                 │CharacterHash│          │CharacterEditorView│
     └────┘           └────────────────────┘           └───────────────────────┘          └──────────────┘           └────────────┘           └───────────────────┘                 └─────────────┘          └───────────────────┘
```

## Implementation Notes

**✅ Correctly implemented:**
- Profile-scoped storage retrieval
- Version migration on load
- Sequential upgrade path (v0.1 → v0.2 → v0.3, etc.)
- Character array storage pattern

**⚠️ Partially implemented:**
- **Hash calculation on load:** Function exists but may not be called for all loads
- **characterHash initialization:** Should be set on load if missing

## Version Migration

The sequence shows the version migration process:
1. Load character from storage
2. Check version against current app version
3. If old version: apply sequential upgrades
4. If current version: skip migration
5. Always calculate and set characterHash (for save optimization)

Example migration:
- Old character at v0.1.0 with `fields.skills = ["skill1", "skill2"]`
- Upgrade to v0.2.0 transforms to `fields.skillEntries = [{skillId: "skill1", hasExperience: true}, ...]`
- Character version updated to v0.2.0

## Notes

- Version migration happens EVERY time characters are loaded
- Upgrades are sequential (can't skip versions)
- Each upgrade function handles one version transition
- Hash calculation ensures save optimization works on first save
- Profile isolation maintained throughout

## Related CRC Cards

- crc-CharacterManagerView.md
- crc-CharacterStorageService.md
- crc-ProfileService.md
- crc-CharacterVersioning.md
- crc-CharacterHash.md
- crc-CharacterEditorView.md
