# Sequence: Save Character

**Source Spec:** characters.md, storage.md
**Use Case:** User saves character from editor (with hash-based save optimization)

## Participants

- **User**: Person using the application
- **CharacterEditorView**: Character editing UI component
- **CharacterValidation**: Validation logic utility
- **CharacterStorageService**: Character persistence service
- **CharacterHash**: Hash calculation utility
- **ProfileService**: Profile-scoped storage wrapper
- **LocalStorage**: Browser localStorage API

## Sequence

```
                    ┌────┐           ┌───────────────────┐          ┌───────────────────┐          ┌───────────────────────┐               ┌─────────────┐          ┌──────────────┐           ┌────────────┐
                    │User│           │CharacterEditorView│          │CharacterValidation│          │CharacterStorageService│               │CharacterHash│          │ProfileService│           │LocalStorage│
                    └──┬─┘           └─────────┬─────────┘          └─────────┬─────────┘          └───────────┬───────────┘               └──────┬──────┘          └───────┬──────┘           └──────┬─────┘
                       │     click "Save"      │                              │                                │                                  │                         │                         │
                       │──────────────────────>│                              │                                │                                  │                         │                         │
                       │                       │                              │                                │                                  │                         │                         │
                       │                       │     validate(character)      │                                │                                  │                         │                         │
                       │                       │─────────────────────────────>│                                │                                  │                         │                         │
                       │                       │                              │                                │                                  │                         │                         │
                       │                       │                              │────┐                           │                                  │                         │                         │
                       │                       │                              │    │ checkRules()              │                                  │                         │                         │
                       │                       │                              │<───┘                           │                                  │                         │                         │
                       │                       │                              │                                │                                  │                         │                         │
                       │                       │          errors[]            │                                │                                  │                         │                         │
                       │                       │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                                │                                  │                         │                         │
                       │                       │                              │                                │                                  │                         │                         │
                       │                       │                              │                                │                                  │                         │                         │
          ╔══════╤═════╪═══════════════════════╪══════════════════════════════╪════════════════════════════════╪══════════════════════════════════╪═════════════════════════╪═════════════════════════╪══════════════════════════╗
          ║ ALT  │  has errors                 │                              │                                │                                  │                         │                         │                          ║
          ╟──────┘     │                       │                              │                                │                                  │                         │                         │                          ║
          ║            │     show errors       │                              │                                │                                  │                         │                         │                          ║
          ║            │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                              │                                │                                  │                         │                         │                          ║
          ╠════════════╪═══════════════════════╪══════════════════════════════╪════════════════════════════════╪══════════════════════════════════╪═════════════════════════╪═════════════════════════╪══════════════════════════╣
          ║ [no errors]│                       │                              │                                │                                  │                         │                         │                          ║
          ║            │                       │                   saveCharacter(character)                    │                                  │                         │                         │                          ║
          ║            │                       │──────────────────────────────────────────────────────────────>│                                  │                         │                         │                          ║
          ║            │                       │                              │                                │                                  │                         │                         │                          ║
          ║            │                       │                              │                                │calculateCharacterHash(character) │                         │                         │                          ║
          ║            │                       │                              │                                │─────────────────────────────────>│                         │                         │                          ║
          ║            │                       │                              │                                │                                  │                         │                         │                          ║
          ║            │                       │                              │                                │             newHash              │                         │                         │                          ║
          ║            │                       │                              │                                │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                         │                         │                          ║
          ║            │                       │                              │                                │                                  │                         │                         │                          ║
          ║            │                       │                              │                                │                                  │                         │                         │                          ║
          ║            │   ╔══════╤════════════╪══════════════════════════════╪════════════════════════════════╪══════════════════════════════════╪═════════════════════════╪═════════════════════════╪════════════════╗         ║
          ║            │   ║ ALT  │  hash unchanged                           │                                │                                  │                         │                         │                ║         ║
          ║            │   ╟──────┘            │                              │                                │                                  │                         │                         │                ║         ║
          ║            │   ║                   │                      return (skip save)                       │                                  │                         │                         │                ║         ║
          ║            │   ║                   │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                                  │                         │                         │                ║         ║
          ║            │   ╠═══════════════════╪══════════════════════════════╪════════════════════════════════╪══════════════════════════════════╪═════════════════════════╪═════════════════════════╪════════════════╣         ║
          ║            │   ║ [hash changed]    │                              │                                │                                  │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │────┐                             │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │    │ update hash                 │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │<───┘                             │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │                                  │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │────┐                             │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │    │ update timestamp            │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │<───┘                             │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │                                  │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │                   getItem(STORAGE_KEY)                     │                         │                ║         ║
          ║            │   ║                   │                              │                                │───────────────────────────────────────────────────────────>│                         │                ║         ║
          ║            │   ║                   │                              │                                │                                  │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │                                  │                         │      getItem(key)       │                ║         ║
          ║            │   ║                   │                              │                                │                                  │                         │────────────────────────>│                ║         ║
          ║            │   ║                   │                              │                                │                                  │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │                                  │                         │       JSON data         │                ║         ║
          ║            │   ║                   │                              │                                │                                  │                         │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                ║         ║
          ║            │   ║                   │                              │                                │                                  │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │                       characters[]                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                         │                ║         ║
          ║            │   ║                   │                              │                                │                                  │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │────┐                             │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │    │ update character in array   │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │<───┘                             │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │                                  │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │                setItem(STORAGE_KEY, data)                  │                         │                ║         ║
          ║            │   ║                   │                              │                                │───────────────────────────────────────────────────────────>│                         │                ║         ║
          ║            │   ║                   │                              │                                │                                  │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │                                  │                         │   setItem(key, data)    │                ║         ║
          ║            │   ║                   │                              │                                │                                  │                         │────────────────────────>│                ║         ║
          ║            │   ║                   │                              │                                │                                  │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │                                  │                         │        success          │                ║         ║
          ║            │   ║                   │                              │                                │                                  │                         │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                ║         ║
          ║            │   ║                   │                              │                                │                                  │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │                          success │                         │                         │                ║         ║
          ║            │   ║                   │                              │                                │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                         │                ║         ║
          ║            │   ║                   │                              │                                │                                  │                         │                         │                ║         ║
          ║            │   ║                   │                            saved                              │                                  │                         │                         │                ║         ║
          ║            │   ║                   │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                                  │                         │                         │                ║         ║
          ║            │   ╚═══════════════════╪══════════════════════════════╪════════════════════════════════╪══════════════════════════════════╪═════════════════════════╪═════════════════════════╪════════════════╝         ║
          ║            │                       │                              │                                │                                  │                         │                         │                          ║
          ║            │     show "saved"      │                              │                                │                                  │                         │                         │                          ║
          ║            │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                              │                                │                                  │                         │                         │                          ║
          ╚════════════╪═══════════════════════╪══════════════════════════════╪════════════════════════════════╪══════════════════════════════════╪═════════════════════════╪═════════════════════════╪══════════════════════════╝
                    ┌──┴─┐           ┌─────────┴─────────┐          ┌─────────┴─────────┐          ┌───────────┴───────────┐               ┌──────┴──────┐          ┌───────┴──────┐           ┌──────┴─────┐
                    │User│           │CharacterEditorView│          │CharacterValidation│          │CharacterStorageService│               │CharacterHash│          │ProfileService│           │LocalStorage│
                    └────┘           └───────────────────┘          └───────────────────┘          └───────────────────────┘               └─────────────┘          └──────────────┘           └────────────┘
```

## Current Implementation vs Spec

**✅ Correctly implemented:**
- Validation before save
- Profile-scoped storage
- Character array in single storage key
- Timestamp update on save

**❌ Missing (Type A issue):**
- **Hash-based save optimization NOT implemented in current code**
  - Spec requires hash comparison to skip unnecessary saves
  - `characterHash` field missing from ICharacter interface
  - `calculateCharacterHash` exists but unused in save flow
  - Current code always writes to storage

**Spec requirement (shown in diagram, not yet in code):**
- Calculate hash before save
- Compare with existing characterHash
- Skip storage write if unchanged
- Only persist when character data actually changed

## Notes

- Hash optimization reduces storage writes (faster, less SSD wear)
- Character hash excludes the `characterHash` field itself (prevents infinite loop)
- Hash uses sorted JSON keys for consistency
- Validation errors do NOT block saves (per UI spec: "never block saves")
- All saves go through ProfileService for profile isolation
- Single storage key pattern (simpler than per-character keys)

## Related CRC Cards

- crc-CharacterEditorView.md
- crc-CharacterValidation.md
- crc-CharacterStorageService.md
- crc-CharacterHash.md
- crc-ProfileService.md
