# CharacterVersioning

**Source Spec:** characters.md, storage.md
**Existing Code:** src/character/CharacterVersioning.ts

## Responsibilities

### Knows
- CHARACTER_SCHEMAS: Array of schema versions with descriptions
- Current app version (from VERSION file)
- Schema upgrade functions between versions

### Does
- getCurrentVersion(): Get current app version
- upgradeCharacterToLatest(character): Upgrade character through all schema versions
- findSchemaIndex(version): Find position in schema array
- getUpgrader(fromIndex): Get function to upgrade to next version
- Schema-specific upgrade functions (e.g., upgradeToV02)

## Collaborators

- **Character**: Transforms character data between schema versions
- **VERSION file**: Source of current version string

## Code Review Notes

✅ **Working well:**
- Supports schema evolution as per spec
- Sequential upgrade path (v0.1 → v0.2 → v0.3, etc.)
- Each upgrade function handles one version transition
- Character always upgraded to latest on load

✅ **Matches spec:**
- Version field in character ✓
- Upgrade function per spec algorithm ✓
- Handles field format changes (legacy → skillEntries) ✓

📝 **Design pattern:**
- Chain of Responsibility for upgrades
- Each upgrader handles one version step
- Version-agnostic upgradeToLatest wrapper

📝 **Schema evolution example:**
```typescript
v0.1.0: fields.skills = [string, string]  // legacy
v0.2.0: fields.skillEntries = [{skillId, hasExperience}]  // new
```

## Sequences

- seq-load-character.md (includes upgrade step)
- seq-upgrade-character-schema.md
