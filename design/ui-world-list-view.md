# WorldListView

**CRC Card:** crc-WorldListView.md
**Source Spec:** game-worlds.md (lines 110-136)
**Current Implementation:** src/ui/AdventureView.ts (methods: showWorldListView, renderWorldListView, etc.)

**Route**: `/worlds`

**Purpose**: World management ONLY - list, create, edit, delete worlds, manage character-world connections

**Note**: WorldListView should be a separate class. Current implementation embeds this functionality in AdventureView, violating Single Responsibility Principle.

---

## Structure

**Overall Layout**:
```
┌──────────────────────────────────────────────────────────┐
│ [🏠] 🌵 Your Worlds                 [➕ New World]      │ ← Header
├──────────────────────────────────────────────────────────┤
│ [⭐] Test Room ⚡    [📜 Bob]  [⚙️ Edit]  [💀 Delete]   │ ← Active world (⚡ indicator)
│ [⭐] Dusty Creek    [📜 Alice] [⚙️ Edit]  [💀 Delete]   │ ← Inactive world
│ [⭐] Fort Adams     [📜 Choose...] [⚙️ Edit] [💀 Delete] │ ← Inactive world
│                                                          │
│  [scrollable if many worlds]                             │
│                                                          │
└──────────────────────────────────────────────────────────┘
 ↑ Full-screen overlay
```

**Main components**:
- Header (title + create button)
- World list (scrollable)
- Individual world items

### Header

**Purpose**: Navigation, title, and world creation

**Layout**:
```
┌──────────────────────────────────────────────────┐
│ [🏠] 🌵 Your Worlds         [➕ New World]      │
│  ↑    ↑ title               ↑ create button     │
│  home                                            │
└──────────────────────────────────────────────────┘
```

**Structure**:
```html
<div class="world-list-header">
  <button class="home-btn">🏠</button>
  <h2 class="world-list-title">🌵 Your Worlds</h2>
  <button class="world-list-create-btn">➕ New World</button>
</div>
```

**Events**:
- `clickHome()` - Navigate to splash screen
- `clickCreateWorld()` - Show create world modal

**CSS Classes**:
- `world-list-header` - Header container
- `home-btn` - Home button (top-left)
- `world-list-title` - Title text
- `world-list-create-btn` - Create button

---

### World List Container

**Purpose**: Scrollable list of all available worlds

**Structure**:
```html
<div class="world-list-container">
  <!-- World items dynamically populated -->
</div>
```

**Behavior**:
- Scrollable if many worlds
- Worlds sorted alphabetically by name
- Empty state: "No worlds yet. Click '➕ New World' to create one."

**CSS Classes**:
- `world-list-container` - Scrollable container
- `world-list-empty` - Empty state message

---

### World Item

**Purpose**: Single world with action buttons

**Layout (Inactive World)**:
```
┌──────────────────────────────────────────────────────────┐
│ [⭐] Dusty Creek    [📜 Alice]  [⚙️ Edit]  [💀 Delete]   │
│  ↑    ↑              ↑           ↑          ↑            │
│  start world name   character   edit       delete        │
│       (flex-grow)   dropdown                             │
└──────────────────────────────────────────────────────────┘
```

**Layout (Active World)**:
```
┌──────────────────────────────────────────────────────────┐
│ [⭐] Test Room ⚡    [📜 Bob]  [⚙️ Edit]  [💀 Delete]     │
│  ↑    ↑        ↑      ↑         ↑          ↑            │
│  start world  active character edit       delete        │
│       name   indicator                                   │
└──────────────────────────────────────────────────────────┘
```

**Structure**:
```html
<div class="world-list-item {{#isActive}}world-list-item--active{{/isActive}}" data-world-name="{{worldName}}">
  <button class="world-item-start-btn">⭐</button>
  <div class="world-item-name">
    {{worldName}}
    {{#isActive}}<span class="world-item-active-indicator">⚡</span>{{/isActive}}
  </div>
  <button class="world-item-character-btn">📜 {{defaultCharacterName}}</button>
  <button class="world-item-edit-btn">⚙️ Edit</button>
  <button class="world-item-delete-btn">💀 Delete</button>
</div>
```

**Data**:
- `worldName` - World name
- `defaultCharacterName` - Name of default character (or "Choose...")
- `isActive` - Boolean indicating if this is the currently active world

**States**:
- **Inactive**: Default state, clicking ⭐ activates world
- **Active**: Currently running world (⚡ indicator), clicking ⭐ returns to world without reset

**Events**:
- `clickStart(worldName)` - Activate/return to world (see behavior below)
- `clickCharacter(worldName)` - Show character selection dropdown
- `clickEdit(worldName)` - Navigate to `/world/:worldId`, open settings modal
- `clickDelete(worldName)` - Show delete confirmation modal

**Start Button Behavior**:

*Clicking inactive world (no active world):*
- Activate world (load, initialize)
- Navigate to `/world/:worldId`

*Clicking active world:*
- Navigate to `/world/:worldId` (return to gameplay, no reset)

*Clicking different world when one is active:*
1. Show confirmation modal: "Switching worlds will end your current session in [Current World Name]. Continue?"
2. If confirmed:
   - Terminate current world
   - Activate new world
   - Navigate to `/world/:worldId`
3. If canceled:
   - Do nothing, keep current world active

**CSS Classes**:
- `world-list-item` - Item container
- `world-list-item--active` - Modifier for active world (different background/border)
- `world-item-start-btn` - Start button (star icon)
- `world-item-name` - World name display
- `world-item-active-indicator` - Active world indicator (⚡)
- `world-item-character-btn` - Character dropdown trigger
- `world-item-edit-btn` - Edit button
- `world-item-delete-btn` - Delete button

---

### Character Selection Dropdown

**Purpose**: Link/unlink characters to world, set default

**Layout**:
```
      ┌────────────────────────────────────┐
      │ Default Character:                 │
      ├────────────────────────────────────┤
      │ Linked Characters                  │
      │ ◉ Alice Smith      [✖ Unlink]     │ ← Radio selected
      │ ○ Bob Jones        [✖ Unlink]     │
      ├────────────────────────────────────┤
      │ Unlinked Characters                │
      │   Charlie Brown    [➕ Link]       │
      │   Diana Prince     [➕ Link]       │
      └────────────────────────────────────┘
       ↑ Appears below character button
```

**Structure**:
```html
<div class="character-dropdown" style="display: none;">
  <div class="character-dropdown-header">
    <strong>Default Character:</strong>
  </div>
  <div class="character-section">
    <div class="character-section-title">Linked Characters</div>
    <!-- Linked characters -->
    <div class="character-item" data-character-id="{{characterId}}">
      <input type="radio" name="default-character" checked />
      <span class="character-name">{{characterName}}</span>
      <button class="character-unlink-btn">✖ Unlink</button>
    </div>
  </div>
  <div class="character-section">
    <div class="character-section-title">Unlinked Characters</div>
    <!-- Unlinked characters -->
    <div class="character-item" data-character-id="{{characterId}}">
      <span class="character-name">{{characterName}}</span>
      <button class="character-link-btn">➕ Link</button>
    </div>
  </div>
</div>
```

**Behavior**:
- Shows linked characters first (alphabetical)
- Shows unlinked characters second (alphabetical)
- Radio buttons for default character (linked only)
- Link/unlink buttons for each character
- Click outside to close

**Data**:
- Linked characters: Array of IWorldConnection
- Unlinked characters: All characters minus linked ones
- Default character ID (from world connections)

**Events**:
- `selectDefaultCharacter(characterId)` - Update default character in world connection
- `linkCharacter(characterId)` - Create world connection
- `unlinkCharacter(characterId)` - Remove world connection
- `clickOutside()` - Close dropdown

**CSS Classes**:
- `character-dropdown` - Dropdown container (absolute positioned)
- `character-dropdown-header` - Header section
- `character-section` - Linked/Unlinked section
- `character-section-title` - Section title
- `character-item` - Individual character row
- `character-name` - Character name display
- `character-link-btn` - Link button
- `character-unlink-btn` - Unlink button

---

### Switch World Confirmation Modal

**Purpose**: Warn user before terminating active world and switching to another

**Trigger**: User clicks ⭐ Start on a different world when one is already active

**Layout**:
```
┌────────────────────────────────────────────┐
│  Switch Worlds?                            │
│                                            │
│  Switching worlds will end your current    │
│  session in "Test Room".                   │
│                                            │
│  Continue?                                 │
│                                            │
│           [Cancel]  [Continue]             │
└────────────────────────────────────────────┘
```

**Structure**:
```html
<div class="switch-world-modal">
  <div class="switch-world-modal-content">
    <h3 class="switch-world-modal-title">Switch Worlds?</h3>
    <p class="switch-world-modal-message">
      Switching worlds will end your current session in "{{currentWorldName}}".
    </p>
    <p class="switch-world-modal-question">Continue?</p>
    <div class="switch-world-modal-actions">
      <button class="modal-btn modal-btn--cancel">Cancel</button>
      <button class="modal-btn modal-btn--confirm">Continue</button>
    </div>
  </div>
</div>
```

**Data**:
- `currentWorldName` - Name of currently active world
- `targetWorldName` - Name of world user wants to switch to (stored in click handler)

**Events**:
- `confirmSwitch()` - Terminate current world, activate target world
- `cancelSwitch()` - Close modal, keep current world active

**Behavior**:
- Modal appears over world list
- Semi-transparent backdrop
- Cannot dismiss by clicking outside (must click button)
- Escape key closes modal (same as Cancel)

**CSS Classes**:
- `switch-world-modal` - Modal overlay container
- `switch-world-modal-content` - Modal content box
- `switch-world-modal-title` - Title text
- `switch-world-modal-message` - Warning message
- `switch-world-modal-question` - Confirmation question
- `switch-world-modal-actions` - Button container
- `modal-btn` - Base button style
- `modal-btn--cancel` - Cancel button variant
- `modal-btn--confirm` - Confirm button variant

---

## Overlay Behavior

**Display**:
- Full-screen overlay (z-index: 100)
- Semi-transparent dark background behind
- Centers on screen
- Prevents scrolling of adventure view underneath

**Show Conditions**:
- User navigates to `/adventure/worlds`
- User clicks "🌵 Worlds" button in adventure view
- Direct URL navigation supported

**Hide Conditions**:
- User clicks ⭐ Start on a world (navigates to `/world/:worldId`)
- User clicks browser back button (navigates back)
- User clicks Edit button (opens WorldSettingsModal)

**CSS Classes**:
- `world-list-view` - Main overlay container
- `world-list-backdrop` - Semi-transparent background (optional)

---

## Related Components

**Managed by AdventureMode coordinator:**
- **AdventureMode** (`ui-adventure-mode.md`) - Coordinator managing view switching
- **AdventureView** (`ui-adventure-view.md`) - Adventure gameplay (separate class)

**Modal dialogs** (separate components):
- **CreateWorldModal** (`ui-create-world-modal.md`) - New world creation
- **WorldSettingsModal** (`ui-world-settings-modal.md`) - Edit world settings
- **DeleteWorldModal** (`ui-delete-world-modal.md`) - Delete confirmation

---

## Data Bindings

**Template Variables**:
- `{{worldName}}` - World name for each item
- `{{defaultCharacterName}}` - Default character name (or "Choose...")

**Dynamic Content**:
- World items (loaded from MudStorage)
- Character dropdown items (loaded from connections + character list)
- Empty state message

---

## Routing

**Routes**:
- `/worlds` - Show world list view

**Navigation**:
- Click ⭐ Start → Navigate to `/world/:worldId` (load selected world in AdventureView)
- Click ⚙️ Edit → Open WorldSettingsModal (stay on `/worlds`)
- Click 💀 Delete → Open DeleteWorldModal (stay on `/worlds`)
- Click ➕ New World → Open CreateWorldModal (stay on `/worlds`)
- Browser back → Navigate to previous route

**Integration**:
- Managed by AdventureMode coordinator
- Uses router.navigate() for URL updates
- Handles popstate events for browser back/forward
- Deep linking supported (can navigate directly to `/worlds`)

**Note**: Original spec suggested `/adventure/worlds`, but current implementation uses `/worlds`.

---

## Templates

**Primary**: `public/templates/world-list-view.html`

**Sub-templates**:
- `world-list-item.html` - Individual world item (or inline in main template)
- `switch-world-modal.html` - Switch world confirmation
- `delete-world-modal.html` - Delete confirmation

---

## Western Theme

**Colors**:
- Background: Darker parchment (#E5D5C0)
- Item background: Light parchment (#F5E6D3)
- Hover: Gold highlight (#DAA520)
- Borders: Saddle brown (#8B4513)

**Typography**:
- Title: Rye (old-west serif)
- World names: Rye
- Buttons: Arial/sans-serif

**Visual Style**:
- Rough borders on items
- Western emoji (🌵, ⭐, 📜, ⚙️, 💀)
- Hover effects (gold highlight, slight scale)

---

## Traceability

**CRC Card:** crc-WorldListView.md

**Sequences:**
- seq-start-adventure-mode.md (initial world list display)
- seq-select-world.md (starting a world)
- seq-create-world.md (creating new world)
- seq-edit-world-settings.md (editing world settings)
- seq-delete-world.md (deleting world)
- seq-switch-to-world-list.md (navigating from adventure view)

**Current Implementation:** src/ui/AdventureView.ts (methods: showWorldListView, renderWorldListView, etc.)

**Future Refactoring:** Extract into separate WorldListView class to follow Single Responsibility Principle
