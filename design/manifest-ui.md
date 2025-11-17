# UI Manifest - Global UI Concerns

**Global UI structure, routes, view relationships, and shared components for HollowWorld**

**Sources**:
- `routes.md` - Route definitions
- `ui.md` - Global UI principles
- `audio.md` - Audio control specifications

---

## Routes

**Source**: `routes.md`

All application routes and their corresponding views:

| Route             | View                | Description                               | Handler                  |
|-------------------|---------------------|-------------------------------------------|--------------------------|
| `/`               | SplashView          | Main menu with navigation buttons         | `renderSplashScreen()`   |
| `/characters`     | CharactersView      | List of all characters                    | `renderCharactersView()` |
| `/character/:id`  | CharacterEditorView | Edit specific character by UUID           | `renderEditorView()`     |
| `/friends`        | FriendsView         | Manage P2P friends                        | `renderFriendsView()`    |
| `/settings`       | SettingsView        | Application settings, peer ID, profiles   | `renderSettingsView()`   |
| `/settings/log`   | LogView             | System log viewer with filtering          | `renderLogView()`        |
| `/game`           | GameView            | Legacy game view (may be deprecated)      | `renderGameView()`       |
| `/worlds`         | WorldSelectorView   | Select which world to enter               | `renderWorldSelector()`  |
| `/world/:worldId` | AdventureModeView   | TextCraft MUD adventure in specific world | `renderAdventureMode()`  |
| `/world`          | AdventureModeView   | TextCraft MUD adventure (fallback)        | `renderAdventureMode()`  |

### Route Parameters

- `:id` - Character UUID (used in `/character/:id`)
- `:worldId` - TextCraft world ID (used in `/world/:worldId`)

### Route Requirements

All routes MUST support:
1. Direct navigation (via `router.navigate()`)
2. Page refresh (F5 on any route)
3. Browser back/forward buttons (history managed automatically)

---

## View Hierarchy

**Source**: `routes.md` + navigation patterns

```
SplashView (/)
  ├─→ CharactersView (/characters)
  │     └─→ CharacterEditorView (/character/:id)
  ├─→ FriendsView (/friends)
  ├─→ SettingsView (/settings)
  │     ├─→ LogView (/settings/log)
  │     └─→ ProfilePickerDialog (modal)
  ├─→ GameView (/game) [deprecated]
  ├─→ WorldSelectorView (/worlds)
  └─→ AdventureModeView (/world/:worldId)
```

### Navigation Entry Points

**From SplashView**:
- "Characters" button → CharactersView
- "Friends" button → FriendsView
- "Settings" button → SettingsView
- "Join Game" button → WorldSelectorView (future)
- "Start Game" button → AdventureModeView (future)

**From CharactersView**:
- Click character card → CharacterEditorView
- "Add Character" button → CharacterEditorView (new character)

**From SettingsView**:
- "View Log" button → LogView
- "Profiles" button → ProfilePickerDialog

**From anywhere**:
- Browser back button → Previous view in history
- Browser forward button → Next view in history (if available)

---

## Global Components

**Components present on all views**

### 1. GlobalAudioControl

**Source**: `audio.md` - Audio Control UI Requirements

**Purpose**: Background music playback and control, persistent across all views

**Position**:
- Fixed at bottom-right corner of viewport
- z-index: 9999+ (above all page content)
- Visible on all routes

**Structure**:
- **Collapsed state**: Compact play/pause indicator
- **Expanded state**: Full controls (track info, navigation, cycling)
- **Header**: Clickable to toggle collapse/expand

**Expanded Layout**:
```
┌─────────────────────────────┐
│ 🎵 Music Control      [▼]  │ ← Header (clickable)
├─────────────────────────────┤
│ Now Playing:                │
│ western-adventure-loop      │
│                             │
│ Track 3 of 8                │
│                             │
│ [◀] [⏸] [▶]              │ ← Prev, Play/Pause, Next
│                             │
│ [🔁] Auto-cycle: On        │ ← Cycling toggle
└─────────────────────────────┘
```

**Collapsed Layout**:
```
┌─────────────────────────────┐
│ 🎵 [⏸]              [▲]   │
└─────────────────────────────┘
```

**Controls**:
- Play/Pause toggle (reflects current playback state)
- Next track button
- Previous track button
- Current track name display
- Track position indicator (e.g., "Track 3 of 8")
- Auto-cycle toggle

**Behavior**:
- Music persists across route navigation
- Sequential cycling through 8 western-themed tracks
- 1-second fade-out when manually switching tracks
- Volume set to 0.3 for background ambiance

**Theme**: Western frontier styling
- Background: Dark brown/wood texture (#2C1810 with transparency)
- Border: Saddle brown (#8B4513), 2-3px solid
- Text: Gold (#D4AF37) for headers, Wheat (#F5DEB3) for content
- Buttons: Western-style brown/tan color scheme

---

### 2. EventNotificationButton

**Source**: `ui.md` - Events section

**Purpose**: Display count of pending events and provide access to event list

**Position**:
- Fixed at upper-right corner of screen
- Only visible when event list is not empty

**Structure**:
- Bugle icon (🎺 or similar)
- Red badge with count of pending events

**Behavior**:
- Click opens modal dialog with EventsView
- Badge count updates automatically when events are added/removed

**Events System**:
- Persisted list of events (stored in LocalStorage)
- Event types: Friend requests, peer connections, P2P errors, etc.
- Each event has type-specific presentation
- Events can be dismissed individually (skull button)

---

## Global UI Patterns

**Source**: `ui.md` - General Principles

### Save Behavior

**CRITICAL**: Never block saves due to validation errors

- Users must not lose their work
- Always save data, even if invalid
- Show validation warnings but allow save to complete
- Invalid data can be prevented from being used (e.g., entering worlds) but never from being saved
- Example: CharacterEditorView saves invalid characters and shows validation warning notification
- Rationale: Preventing saves risks data loss during intermediate work states

### Change Detection

**Pattern**: Hash-based change detection with 250ms polling

- **Polling interval**: 250ms for UI interaction polling (responsive without excessive CPU)
- **Hash-based comparison**: Use SHA-256 hashes instead of object copies
  - Calculate hash of original state on load
  - Recalculate hash of current state every 250ms
  - Compare hashes to detect changes
  - More efficient than deep object comparison
  - Avoids shallow copy issues with nested objects
- **Example**: CharacterEditorView uses 250ms intervals to detect character changes for enabling save/cancel buttons

### P2P User Experience

**NO DIALOGS for P2P operations**

- Never use `alert()` or modal dialogs for P2P status updates
- Friend requests, peer discovery, connection status use visual badges and event system
- Errors requiring user action can use dialogs, but informational updates must not
- Use EventService to notify users of P2P events (friend requests, connections, etc.)
- Use status badges (e.g., "⏳ Pending") in UI to show current state
- Keep P2P operations non-intrusive and seamless

### Markdown Editing

**Pattern**: Milkdown crepe for all markdown editing

- Use `crepe.on` for events (as per Crepe documentation)
- No padding around editor content
- Support all available Crepe features
- Used in: FriendsView (friend notes), SettingsView (private notes)

---

## View Relationships

**How independent views coordinate and share data**

### Shared Data Flows

**Profile-scoped data** (isolated per profile):
- Characters (CharactersView, CharacterEditorView)
- Friends (FriendsView)
- Settings (SettingsView)
- Private notes (SettingsView)

**Session-scoped data** (persists across profile switches):
- Current profile (SettingsView, SplashView)
- Peer ID (SettingsView, SplashView, FriendsView)
- Audio state (GlobalAudioControl, all views)
- Event queue (EventNotificationButton, all views)

**World-scoped data** (isolated per world):
- World characters (AdventureModeView)
- World state (AdventureModeView)
- World connections (AdventureModeView)

### Navigation Flows

**Character Management Flow**:
```
SplashView → CharactersView → CharacterEditorView
                                    ↓
                        (save/cancel) → CharactersView
```

**Friend Management Flow**:
```
SplashView → FriendsView
               ↓
          (add/edit/remove friends)
               ↓
          FriendsView (refreshes)
```

**Settings Flow**:
```
SplashView → SettingsView → LogView
                  ↓
            ProfilePickerDialog (modal)
                  ↓
        (switch profile) → SplashView (restart)
```

**World/Adventure Flow** (future):
```
SplashView → WorldSelectorView → AdventureModeView
                                         ↓
                                  (exit world)
                                         ↓
                                   SplashView
```

### View Lifecycle Coordination

**On Profile Switch**:
1. Save current profile state
2. Clear profile-scoped data
3. Load new profile data
4. Restart session → SplashView
5. Global components persist (AudioControl, EventNotificationButton)

**On Route Navigation**:
1. Save current view state (scroll position, form data)
2. Push to browser history
3. Render new view
4. Global components remain visible
5. Audio playback continues

**On Page Refresh**:
1. Read route from URL
2. Load profile from LocalStorage
3. Initialize global components (AudioControl, EventNotificationButton)
4. Render appropriate view for route
5. Restore session state

---

## Asset URL Management

**Source**: `routes.md` - Asset Loading

**CRITICAL**: All asset paths MUST be absolute from origin

**Pattern**:
```typescript
// Correct: Use Base URL for all assets
const assetUrl = new URL('assets/audio/track.mp3', window.Base).toString();

// Works from all routes: /, /settings, /settings/log, /character/:id, etc.
```

**Initialization**:
```html
<!-- In <body> script element at top -->
<script>
window.Base = new URL('', document.location);
</script>
```

**Asset types using Base URL**:
- Audio files: `assets/audio/*.mp3`
- Templates: `templates/*.html`
- Images: `assets/images/*`
- Other static assets

**Why this matters**:
- Nested routes (e.g., `/settings/log`, `/character/:id`) resolve relative URLs incorrectly
- Absolute URLs from origin work consistently across all routes

---

## Western Frontier Theme

**Source**: `ui.md` - Visual Design & Western Frontier Theme

**Global theme requirements for all views**

### Color Palette

**Primary browns**:
- #8b4513 (saddle brown)
- #deb887 (burlywood)
- #f4a460 (sandy brown)
- #654321 (dark brown)

**Gold accent**: #d4af37 (metallic gold) for titles, labels, highlights

**Parchment**: rgba(255,248,220,0.9) for content boxes

**Dark backgrounds**: #2a1810, #3a2418, #4a3228 for contrast elements

**Muted text**: #a0826d, #b8946f, #c8a882 for secondary text

### Content Box Pattern

**All major content sections use parchment-style boxes**:

```css
.content-section {
    background: rgba(255,248,220,0.9);
    border: 3px solid #8b4513;
    border-radius: 8px;
    padding: 20px;
    margin: 15px auto;
    max-width: 600px;
    width: 100%;
    box-shadow:
        inset 0 0 15px rgba(139,69,19,0.2),
        3px 3px 0px #654321,
        6px 6px 15px rgba(0,0,0,0.4);
    z-index: 10;
    position: relative;
}
```

### Typography

**Fonts**: Western-themed fonts from Google Fonts
```css
@import url('https://fonts.googleapis.com/css2?family=Rye&family=Creepster&family=Sancreek&display=swap');
```

**Monospace**: 'Courier New', monospace for technical data (peer IDs, code)

**Text shadows**: Subtle shadows for depth: `2px 2px 4px rgba(0, 0, 0, 0.7)`

### Button Style

**Base style**:
```css
background-color: #6a4f3a;
color: #d4af37;
border: 2px solid #8b4513;
border-radius: 6px;
padding: 0.75rem 1.5rem;
```

**Hover effects**:
- Lighten background: #8b6a4f
- Change border to gold: #d4af37
- Subtle lift: `transform: translateY(-2px)`
- Shadow: `box-shadow: 0 4px 8px rgba(212, 175, 55, 0.3)`

### Consistency Requirements

All views must follow:
- Western frontier theme
- Parchment boxes for main content sections
- Wood grain and decorative borders on container backgrounds
- Gold and brown color palette throughout
- Consistent button styling
- Monospace fonts for technical/system data only

---

## Browser History Integration

**Source**: `ui.md` - Navigation

**Pattern**: URL-based navigation with browser history

**History Management**:
- History array of objects for browser back/forward navigation
- Forward/back buttons enabled only when history objects are available
- Self-rendering objects: Each history object knows what view to display

**Navigation Behavior**:
- **Going back**: User can navigate backward through history
- **Forward navigation**: Can advance through existing history
- **New navigation**: Can navigate to different view
  - Removes "future" history objects
  - Pushes new object to history array

**Implementation**:
- Single-page app location represented by browser URL
- Each view gets its own URL path
- Router manages history automatically

---

## Development Server

**Source**: `routes.md`

**Base URL**: `https://localhost:3000` (NOT port 5173)

**Important**: p2p-webapp server uses random port, check terminal for actual URL

---

*Last updated: 2025-11-08*
