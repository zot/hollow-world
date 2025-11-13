# CharactersView

**Source**: `specs/ui.characters.md` → Character List Display section

**Route**: `/characters` (see `manifest.md`)

**Purpose**: Display list of all characters with quick stats overview

---

## Structure

**Overall Layout**:
```
┌────────────────────────────────────────────────────────┐
│ Characters                                             │ ← Header
├────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐ │
│ │ Bob Smith          Rank: 3 XP: 150 DC: 15 Dust: 25 │ │
│ │ 💪 DEX 4 STR 5 CON 4                          [💀] │ │ ← Character card
│ │ 🗣️ CHA 3 WIS 4 GRI 5                               │ │
│ │ 🧠 INT 3 PER 4                                     │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Alice Jones        Rank: 2 XP: 80 DC: 12 Dust: 15  │ │
│ │ 💪 DEX 5 STR 3 CON 3                          [💀] │ │
│ │ 🗣️ CHA 5 WIS 3 GRI 4                               │ │
│ │ 🧠 INT 4 PER 5                                     │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│                 [Add Character]                        │ ← Add button
│                 [Back to Menu]                         │ ← Back button
└────────────────────────────────────────────────────────┘
```

**Main components**:
- Header with title
- Character cards list (or empty state)
- "Add Character" button at bottom
- Back button to return to splash

### Header

**Structure**:
```html
<header class="characters-header">
  <h1>Characters</h1>
</header>
```

**CSS Classes**:
- `characters-header` - Header container
- Western-themed title styling

---

### Character Cards List

**Purpose**: Display all saved characters with key stats

**Layout (Single Card)**:
```
┌────────────────────────────────────────────────────────┐
│ Bob Smith          Rank: 3 XP: 150 DC: 15 Dust: 25     │ ← Name + primary stats
│ 💪 DEX 4 STR 5 CON 4                          [💀]    │ ← Physical + delete
│ 🗣️ CHA 3 WIS 4 GRI 5                                  │ ← Social
│ 🧠 INT 3 PER 4                                         │ ← Mental
└────────────────────────────────────────────────────────┘
```

**Structure**: List of character cards
```html
<div class="characters-list">
  {{#each characters}}
    <div class="character-card" data-character-id="{{id}}" data-action="clickCharacter">
      <!-- Character content -->
      <button class="delete-button" data-action="deleteCharacter" data-character-id="{{id}}">
        💀
      </button>
    </div>
  {{/each}}
</div>
```

**Each character card shows**:
- Character name (inline badge with primary stats)
- Rank, XP, DC (Damage Capacity), Dust (aligned to flex-end)
- **Physical attributes**: DEX, STR, CON (grouped with 💪 emoji)
- **Social attributes**: CHA, WIS, GRI (grouped with 🗣️ emoji)
- **Mental attributes**: INT, PER (grouped with 🧠 emoji)
- Delete button (💀 skull emoji) on right side

**Card Layout**:
```html
<div class="character-card">
  <div class="character-name-row">
    <span class="character-name">{{name}}</span>
    <div class="primary-stats">
      <span class="stat">Rank: {{rank}}</span>
      <span class="stat">XP: {{xp}}</span>
      <span class="stat">DC: {{damageCapacity}}</span>
      <span class="stat">Dust: {{dust}}</span>
    </div>
  </div>

  <div class="attributes-row">
    <div class="attribute-group">
      <span class="emoji">💪</span>
      <span>DEX {{dex}}</span>
      <span>STR {{str}}</span>
      <span>CON {{con}}</span>
    </div>
    <div class="attribute-group">
      <span class="emoji">🗣️</span>
      <span>CHA {{cha}}</span>
      <span>WIS {{wis}}</span>
      <span>GRI {{gri}}</span>
    </div>
    <div class="attribute-group">
      <span class="emoji">🧠</span>
      <span>INT {{int}}</span>
      <span>PER {{per}}</span>
    </div>
  </div>

  <button class="delete-button">💀</button>
</div>
```

**Alignment**:
- Character name: flex-start
- Primary stats (rank/xp/dc/dust): flex-end
- Attributes: Grouped by category with emojis

**Data**:
- `characters: ICharacter[]` - Array from CharacterStorage concept

**Events**:
- `clickCharacter(characterId)` - Navigate to CharacterEditorView for this character
- `deleteCharacter(characterId)` - Delete character with confirmation

**CSS Classes**:
- `characters-list` - List container
- `character-card` - Individual character card
- `character-name-row` - Name and primary stats row
- `character-name` - Character name
- `primary-stats` - Rank, XP, DC, Dust container
- `stat` - Individual stat display
- `attributes-row` - Attributes container
- `attribute-group` - Grouped attributes (Physical/Social/Mental)
- `emoji` - Emoji icon for attribute group
- `delete-button` - Skull emoji delete button (positioned on right)

---

### Empty State

**When no characters exist**:

**Structure**:
```html
<div class="empty-state">
  <p>No characters yet. Create your first character!</p>
</div>
```

**CSS Classes**:
- `empty-state` - Centered message container

---

### Add Character Button

**Purpose**: Create new character

**Structure**:
```html
<button class="add-character-button" data-action="clickAddCharacter">
  Add Character
</button>
```

**Behavior**:
- Positioned at bottom of characters list
- Creates new character with UUID
- Navigates to CharacterEditorView with new character ID

**Events**:
- `clickAddCharacter()` - Create character, navigate to `/character/:newId`

**CSS Classes**:
- `add-character-button` - Western-themed button

---

### Back Button

**Purpose**: Return to splash screen

**Structure**:
```html
<button class="back-button" data-action="clickBack">
  Back to Menu
</button>
```

**Events**:
- `clickBack()` - Navigate to `/`

**CSS Classes**:
- `back-button` - Western-themed button

---

## Data

**From CRC cards** (see `crc-Character.md`, `crc-CharacterStorageService.md`):
- `characters: ICharacter[]` - Character list loaded from storage
  - Each character has: id, name, rank, xp, damageCapacity, dust, attributes
  - Attributes: dex, str, con, cha, wis, gri, int, per

**Local state**: None required (list is loaded from storage)

---

## States

### Loading
- May show loading indicator while characters load from storage

### Default (with characters)
- Character cards displayed in list
- Add Character button visible at bottom
- Delete buttons visible on each card

### Empty State
- No characters message displayed
- Add Character button still visible

### Delete Confirmation
- Modal dialog: "Are you sure you want to delete [CharacterName]?"
- Confirm/Cancel buttons
- On confirm: Delete character, refresh list
- On cancel: Dismiss dialog

---

## Events

**Behavior Implementation**: See `crc-CharacterManagerView.md` and `seq-render-character-list.md`

**Navigation**:
- `clickCharacter(characterId)` → Navigate to `/character/:id`
- `clickAddCharacter()` → Create new character, navigate to `/character/:newId`
- `clickBack()` → Navigate to `/`

**Actions**:
- `deleteCharacter(characterId)` → Show confirmation, delete if confirmed, refresh list

**Key Interactions** (see CRC cards for implementation):
- **Load list**: CharacterManagerView → CharacterStorageService (see `seq-render-character-list.md`)
- **Navigate to editor**: CharacterManagerView → Router (see CRC card)
- **Create character**: CharacterManagerView → CharacterFactory → CharacterStorageService (see CRC cards)
- **Delete character**: CharacterManagerView → CharacterStorageService (see CRC card)

---

## CSS Classes

**Layout**:
- `characters-container` - Main container
- `characters-header` - Header section
- `characters-list` - Character cards container
- `character-card` - Individual card (clickable except delete button)
- `character-name-row` - Name and stats row
- `character-name` - Character name
- `primary-stats` - Primary stats container
- `stat` - Individual stat
- `attributes-row` - Attributes section
- `attribute-group` - Grouped attributes
- `emoji` - Category emoji
- `delete-button` - Delete button (💀)
- `empty-state` - Empty state message
- `add-character-button` - Add button
- `back-button` - Back to menu button

**Responsive**:
- Mobile breakpoints (480px): Stack attributes vertically
- Tablet breakpoints (768px): 2-column character grid

---

## Theme Requirements

**Western Frontier Styling** (from `manifest.md`):
- Character cards: Parchment-style boxes with brown borders
- Hover effects: Gold border, subtle glow
- Buttons: Dark brown background, gold text
- Delete button: Positioned on right side, red hover effect
- Consistent with global theme

**Typography**:
- Character name: Bold, larger text
- Stats: Monospace for numbers
- Emojis: Standard size for visual grouping

---

*Last updated: 2025-11-08*
