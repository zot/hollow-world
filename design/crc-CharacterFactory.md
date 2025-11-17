# CharacterFactory

**Source Spec:** characters.md (implied by creation workflow)
**Existing Code:** src/character/CharacterUtils.ts (CharacterFactory class)

## Responsibilities

### Knows
- Default character template structure
- Current app version for new characters
- Default attribute values
- Default hollow data

### Does
- createNewCharacter(name, description): Create new character with defaults
- createDefaultAttributes(): Generate starting attributes (all 0)
- createDefaultHollowData(): Generate starting hollow data
- generateUUID(): Create unique character ID

## Collaborators

- **Character**: Creates ICharacter instances
- **CharacterVersioning**: getCurrentVersion() for version stamping
- **crypto.randomUUID()**: Browser API for UUID generation

## Code Review Notes

✅ **Working well:**
- Clean factory pattern
- Consistent default values
- Proper version stamping
- UUID generation for unique IDs

✅ **Matches spec:**
- Version field set to current version ✓
- createdAt/updatedAt timestamps ✓
- Default rank = 1 ✓
- All required fields initialized ✓

📝 **Design pattern:**
- Factory pattern for object creation
- Static methods (no state)
- Single responsibility: Create new characters with valid defaults

📝 **Default values:**
- rank: 1
- damageCapacity: 10 (10 + CON where CON = 0)
- attributes: all 0
- hollow.dust: 0
- empty arrays for skills, fields, benefits, drawbacks, items, companions

## Sequences

- seq-create-character.md
