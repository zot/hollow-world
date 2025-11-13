# CharacterHash (Utilities)

**Source Spec:** specs/characters.md, specs/storage.md
**Existing Code:** src/utils/characterHash.ts

## Responsibilities

### Knows
- SHA-256 hashing algorithm
- Sorted key normalization for consistent hashing

### Does
- calculateCharacterHash(character): Generate SHA-256 hash of character
- verifyCharacterIntegrity(character, expectedHash): Compare hashes
- sortedReplacer(key, value): Recursively sort object keys for JSON.stringify

## Collaborators

- **Character**: Hashes ICharacter data
- **crypto.subtle.digest**: Browser Web Crypto API for SHA-256

## Code Review Notes

✅ **Working well:**
- Recursive key sorting ensures consistent hashes
- Uses Web Crypto API (standard, secure)
- Async hash calculation (non-blocking)
- Hex encoding for string representation

✅ **Implementation quality:**
- sortedReplacer handles nested objects correctly
- Hash is deterministic (same character → same hash)
- Integrity verification function provided

⚠️ **Spec vs Implementation gap:**
- Spec says: calculateCharacterHash should exclude `characterHash` field
- Code: Hashes entire character (doesn't exclude characterHash)
- **Issue**: If characterHash is in character object, hash would be different every time
- **Current state**: Works because characterHash NOT in ICharacter interface

❌ **Missing (not used in CharacterStorageService):**
- Hash-based save optimization NOT implemented
- characterHash field not tracked in Character
- No hash comparison before save
- Type A issue: Spec feature not implemented

📝 **Correct spec implementation:**
```typescript
function calculateCharacterHash(character: ICharacter): string {
    const { characterHash, ...dataToHash } = character;
    const normalized = JSON.stringify(dataToHash, sortedReplacer);
    return sha256(normalized);
}
```

## Sequences

- seq-save-character.md (should use hash optimization, currently doesn't)
- seq-calculate-character-hash.md
- seq-verify-character-integrity.md
