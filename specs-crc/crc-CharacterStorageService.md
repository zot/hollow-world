# CharacterStorageService

**Source Spec:** specs/characters.md, specs/storage.md
**Existing Code:** src/services/CharacterStorageService.ts

## Responsibilities

### Knows
- STORAGE_KEY: 'hollow-world-characters' - LocalStorage key for character array

### Does
- getAllCharacters(): Load all characters from storage
- getCharacter(id): Load specific character by ID
- saveCharacter(character): Persist character to storage
- deleteCharacter(id): Remove character from storage
- createNewCharacter(name): Create new character with defaults
- validateAndFixCharacter(char): Upgrade and validate loaded character
- getDefaultCharacters(): Provide example characters for empty storage

## Collaborators

- **ProfileService**: getItem/setItem for profile-aware storage access
- **Character**: Works with ICharacter data structure
- **CharacterVersioning**: upgradeCharacterToLatest() for schema migrations
- **CharacterFactory**: createNewCharacter() for character creation

## Code Review Notes

✅ **Working well:**
- Clean separation of storage concerns
- Error handling with try/catch blocks
- Storage quota exceeded detection
- Character validation and upgrading on load
- Default characters provided for new users

⚠️ **Potential issue:**
- **MAJOR DEVIATION**: Spec says use individual keys (`hollow-character-{uuid}`) but code uses single array
- **MISSING**: Spec's hash-based save optimization NOT implemented
  - Spec: Compare characterHash, skip save if unchanged
  - Code: Always saves on saveCharacter() call

❌ **Missing (from spec):**
- Hash-based save optimization (calculateCharacterHash, compare before save)
- Individual character storage keys (spec uses `hollow-character-{uuid}` pattern)
- characterHash field tracking in Character interface

📝 **Extra (code has, spec doesn't mention):**
- Default character examples (Jack "Dead-Eye" Malone, Sarah "Doc" Winchester)
- Comprehensive data validation and normalization on load

## Implementation Notes

**Current approach:**
```typescript
// Code stores all characters in single array
const characters = await getAllCharacters();  // Load entire array
characters[existingIndex] = updatedCharacter;
setItem(STORAGE_KEY, JSON.stringify(characters)); // Save entire array
```

**Spec approach:**
```typescript
// Spec wants individual keys per character
const currentHash = calculateCharacterHash(character);
if (currentHash === character.characterHash) return; // Skip save

character.characterHash = currentHash;
setItem(`hollow-character-${character.id}`, character);
```

**Analysis:**
- Array approach is simpler for getAllCharacters()
- Individual keys would be more efficient for single character saves
- Hash optimization would reduce unnecessary writes
- Type A change needed: Implement hash-based optimization

## Sequences

- seq-load-character.md
- seq-save-character.md (needs hash optimization sequence)
- seq-load-all-characters.md
- seq-delete-character.md
- seq-create-character.md
