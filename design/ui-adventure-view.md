# AdventureView

**CRC Card:** crc-AdventureView.md
**Source Spec:** specs/game-worlds.md (lines 75-108)
**Current Implementation:** src/ui/AdventureView.ts

**Route**: `/world/:worldId`

**Purpose**: Adventure gameplay ONLY - text output, command input, and session controls for active MUD world

**Note**: AdventureView handles ONLY adventure gameplay. World management (list, create, edit, delete) is handled by WorldListView (separate class).

---

## Structure

**Overall Layout**:
```
┌──────────────────────────────────────────────────────────┐
│ [Dusty Creek] [🌵 Worlds]  ⟨space⟩  ● Solo  [⬅️ Back]  │ ← Header banner
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Welcome to Dusty Creek!                                 │
│  You stand in the dusty main street...                   │
│  > look around                                           │ ← Output area
│  You see a saloon to your left...                        │
│                                                          │
│  [scrollable output area]                                │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ > [Type a command...                           ] [➤]    │ ← Input area
├──────────────────────────────────────────────────────────┤
│ [🏠 Host Session]  [🚪 Join Session]                    │ ← Session controls
└──────────────────────────────────────────────────────────┘
```

**Main components**:
- Header banner (world info, status, navigation)
- Main content area (output + input)
- Session controls (host/join for multiplayer)
- Join session modal (for guest mode)

**NOT in AdventureView** (separate classes):
- World list overlay → WorldListView
- Create world modal → CreateWorldModal
- World settings modal → WorldSettingsModal
- Delete world modal → DeleteWorldModal

### Header Banner

**Purpose**: Show current world, mode status, and navigation

**Layout**:
```
┌────────────────────────────────────────────────────────────┐
│ [Test Room] [🌵 Worlds]  ⟨flexible space⟩  ● Solo [⬅️ Back] │
│ ↑ world-info            ↑ header-spacer  ↑ status  ↑ back │
└────────────────────────────────────────────────────────────┘
```

**Structure**:
```html
<div class="adventure-header">
  <div class="adventure-world-info">
    <span class="world-name">{{worldName}}</span>
    <button class="worlds-btn">🌵 Worlds</button>
  </div>
  <div class="header-spacer"></div>
  <div class="adventure-status">
    <span class="status-indicator">●</span>
    <span class="status-text">{{mode}}</span>
  </div>
  <button class="adventure-back-btn">⬅️ Back</button>
</div>
```

**Data**:
- `worldName` - Current world name (e.g., "Test Room", "Dusty Creek")
- `mode` - Current session mode: "Solo", "Host", or "Guest"

**Events**:
- `clickWorldsBtn()` - Navigate to `/worlds` (world list overlay via AdventureMode)
- `clickBackBtn()` - Navigate to `/` (splash screen)

**CSS Classes**:
- `adventure-header` - Header container
- `adventure-world-info` - Left section (world name + button)
- `world-name` - World name display
- `worlds-btn` - Button to show world list
- `header-spacer` - Flexible space
- `adventure-status` - Status indicator section
- `status-indicator` - Colored dot (● green=Solo, blue=Host, yellow=Guest)
- `status-text` - Mode text
- `adventure-back-btn` - Back button

**Status Indicator Colors**:
- Solo: Green (#4CAF50)
- Host: Blue (#2196F3)
- Guest: Yellow (#FFC107)

---

### Main Content Area

**Purpose**: Text output and command input for MUD interaction

**Layout**:
```
┌────────────────────────────────────────────────┐
│ adventure-output-container                     │
│ ┌────────────────────────────────────────────┐ │
│ │ Welcome to Dusty Creek!                    │ │
│ │                                            │ │
│ │ You are standing in the dusty main street │ │
│ │ of a frontier town...                      │ │
│ │                                            │ │  ← Output area
│ │ > look around                              │ │    (scrollable)
│ │ You see a weathered saloon to your left... │ │
│ │                                            │ │
│ │ > examine saloon                           │ │
│ │ The saloon has swinging doors...           │ │
│ │                                            │ │
│ └────────────────────────────────────────────┘ │
├────────────────────────────────────────────────┤
│ adventure-input-container                      │
│ > [Type a command...                    ] [➤] │ ← Input area
└────────────────────────────────────────────────┘
```

**Structure**:
```html
<div class="adventure-main">
  <div class="adventure-output-container">
    <div class="adventure-output">
      <!-- Output lines appended here -->
    </div>
  </div>
  <div class="adventure-input-container">
    <div class="adventure-prompt">></div>
    <input type="text" class="adventure-input" placeholder="Type a command..." />
    <button class="adventure-submit-btn">➤</button>
  </div>
</div>
```

**Output Area**:
- Scrollable text display
- Auto-scrolls to bottom on new output
- Western-themed styling (parchment background, brown text)

**Input Area**:
- Command prompt (">")
- Text input field
- Submit button
- Command history (arrow keys)

**Data**:
- Output lines (appended dynamically)
- Command history array
- History index

**Events**:
- `submitCommand()` - Execute command, add to history
- `keyDown(ArrowUp)` - Navigate history backwards
- `keyDown(ArrowDown)` - Navigate history forwards
- `keyDown(Enter)` - Submit command

**CSS Classes**:
- `adventure-main` - Main content container
- `adventure-output-container` - Output area wrapper
- `adventure-output` - Scrollable output area
- `adventure-input-container` - Input area container
- `adventure-prompt` - Command prompt (">")
- `adventure-input` - Command input field
- `adventure-submit-btn` - Submit button

**Output Line Classes** (applied to individual output divs):
- `command` - User command echo (darker, bold)
- `output` - Normal MUD output
- `error` - Error messages (red)
- `system` - System messages (italic, gray)
- `welcome-message` - Welcome text on load

---

### Session Controls

**Purpose**: Host or join multiplayer sessions

**Layout (Initial State)**:
```
┌────────────────────────────────────────┐
│ [🏠 Host Session]  [🚪 Join Session]  │
└────────────────────────────────────────┘
```

**Layout (After Hosting)**:
```
┌─────────────────────────────────────────────────────┐
│ Connection Info: 12abc3def456...        [📋 Copy]  │
└─────────────────────────────────────────────────────┘
```

**Structure**:
```html
<div class="adventure-session-controls">
  <div class="session-control-group">
    <button class="session-btn" id="host-session-btn">🏠 Host Session</button>
    <button class="session-btn" id="join-session-btn">🚪 Join Session</button>
  </div>
  <div class="session-info" style="display: none;">
    <strong>Connection Info:</strong>
    <div class="connection-string">{{connectionString}}</div>
    <button class="copy-btn">📋 Copy</button>
  </div>
</div>
```

**Behavior**:
- Initially shows Host/Join buttons
- After hosting: Shows connection string with copy button
- After joining: Hides session controls

**Data**:
- `connectionString` - Host's peer ID for joining

**Events**:
- `clickHostSession()` - Start hosting, show connection string
- `clickJoinSession()` - Show join modal
- `clickCopyConnection()` - Copy connection string to clipboard

**CSS Classes**:
- `adventure-session-controls` - Container
- `session-control-group` - Button group
- `session-btn` - Host/Join buttons
- `session-info` - Connection info display
- `connection-string` - Connection string text
- `copy-btn` - Copy button

---

**Note**: Join Session Modal is now a separate component. See [`join-session-modal.md`](join-session-modal.md) for complete specifications.

---

## Related Components

**Managed by AdventureMode coordinator:**
- **AdventureMode** (`ui-adventure-mode.md`) - Coordinator managing view switching
- **WorldListView** (`ui-world-list-view.md`) - World management (separate class)

**Modal dialogs** (separate components):
- **JoinSessionModal** (`ui-join-session-modal.md`) - Join multiplayer session
- **CreateWorldModal** (`ui-create-world-modal.md`) - Create new world (used by WorldListView)
- **WorldSettingsModal** (`ui-world-settings-modal.md`) - Edit world settings (used by WorldListView)
- **DeleteWorldModal** (`ui-delete-world-modal.md`) - Delete confirmation (used by WorldListView)

**Networking:**
- **HollowIPeer** (`crc-HollowIPeer.md`) - TextCraft IPeer adapter
- **P2PWebAppNetworkProvider** - Existing Hollow P2P infrastructure (MUST reuse, no duplicates)

---

## Data Bindings

**Template Variables**:
- `{{worldName}}` - Current world name
- `{{mode}}` - Session mode (Solo/Host/Guest)
- `{{connectionString}}` - Host peer ID for joining

**Dynamic Content**:
- Output lines (appended to `.adventure-output`)
- Command history (stored in TypeScript array)
- Session info (shown/hidden based on mode)

---

## Routing

**Routes**:
- `/world/:worldId` - Show adventure view for specific world
- `/world` - Show adventure view for default world

**Navigation**:
- Back button → `/` (splash screen)
- Worlds button → `/worlds` (world list via AdventureMode)
- Browser back/forward supported via router

**Note**: Actual routes differ from original spec (`/adventure`, `/adventure/worlds`). Current implementation uses `/world/:worldId` and `/worlds`.

---

## Templates

**Primary**: `public/templates/adventure-view.html` (or similar path)

**Note**: World list and modal templates are managed by their respective separate components, not by AdventureView.

---

## Western Theme

**Colors**:
- Background: Parchment (#F5E6D3)
- Text: Dark brown (#654321)
- Borders: Saddle brown (#8B4513)
- Accent: Gold (#DAA520)

**Typography**:
- Headers: Rye (old-west serif)
- Body: Courier New (monospace for terminal feel)

**Visual Style**:
- Parchment texture on output area
- Rough borders
- Western emoji (🌵, 🏠, 🚪)

---

## Traceability

**CRC Card:** crc-AdventureView.md

**Sequences:**
- seq-select-world.md (starting a world)
- seq-send-command.md (processing user commands)
- seq-host-session.md (starting host mode)
- seq-join-session.md (joining as guest)
- seq-switch-to-world-list.md (navigating to world list)

**Current Implementation:** src/ui/AdventureView.ts

**Future Refactoring:** Separate world list functionality into WorldListView class to follow Single Responsibility Principle
