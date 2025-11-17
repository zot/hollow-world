# SplashView

**Source**: `ui.splash.md`

**Route**: `/` (see `manifest-ui.md`)

**Purpose**: Main menu and navigation hub for Hollow World

---

## Structure

**Overall Layout**:
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              Don't Go Hollow                             │  ← Title (Hollow glows green)
│                                                          │
│          [12abc3def456789...]                            │  ← Peer ID (click to copy)
│                                                          │
│   [Join Game] [Start Game] [Characters]                 │  ← Navigation buttons
│   [Friends] [Credits]                                    │     (flow left-to-right, wrap)
│                                                          │
│                                                          │
│ [⚙️]                          v0.0.13                    │  ← Settings gear (lower left), Version (lower right)
└──────────────────────────────────────────────────────────┘
```

**Main components**:
- Title section
- Peer ID display (clickable to copy)
- Navigation buttons (flow left-to-right)
- Settings gear (lower left corner)
- Version display (bottom right)

### Title Section

**Structure**:
```html
<h1 class="splash-title">
  Don't Go <span class="hollow-glow">Hollow</span>
</h1>
```

**Typography**:
- Font: Sancreek (old-west style)
- Text color: Medium-light brown
- Special effect: The word "Hollow" has green glow

**CSS Classes**:
- `splash-title` - Main title container
- `hollow-glow` - Green glow effect on "Hollow" word

---

### Peer ID Display ("Outlaw Code")

**Purpose**: Show user's libp2p peer ID with copy-to-clipboard functionality

**Structure**:
```html
<div class="peer-id-display">
  <button class="peer-id-value" data-action="copyPeerId">
    {{peerId}}
  </button>
</div>
```

**Behavior**:
- Clickable to copy peer ID to clipboard
- Visual feedback on copy (brief color change or message)
- No "Peer:" label shown (value only)

**Data**:
- `peerId` - String from P2PConnection concept

**Events**:
- `copyPeerId()` - Copy peer ID to clipboard and show notification

**CSS Classes**:
- `peer-id-display` - Container for peer ID
- `peer-id-value` - Clickable peer ID button (not selectable text)

---

### Navigation Buttons

**Layout**: Horizontal flow, wrapping across two rows (Settings separate as gear icon in lower left)

**Buttons**:
1. **Join Game** (placeholder)
2. **Start Game** (placeholder)
3. **Characters** (active)
4. **Friends** (active)
5. **Settings** (active)
6. **Credits** (opens dialog)

**Button Structure**:
```html
<button class="nav-button" data-action="clickCharacters">
  Characters
</button>
```

**Events**:
- `clickJoinGame()` - Navigate to world selector (future)
- `clickStartGame()` - Navigate to adventure mode (future)
- `clickCharacters()` - Navigate to CharactersView
- `clickFriends()` - Navigate to FriendsView
- `clickSettings()` - Navigate to SettingsView
- `clickCredits()` - Show credits dialog

**CSS Classes**:
- `nav-button` - Individual navigation button
- `nav-button-placeholder` - Placeholder buttons (Join/Start Game)

---

### Credits Dialog

**Purpose**: Display licenses and attribution for audio assets

**Structure**:
```html
<div class="credits-dialog-overlay">
  <div class="credits-dialog">
    <h2>Credits</h2>
    <div class="credits-content">
      <!-- Western-themed thank you message -->
      <!-- Audio file licenses from README.md -->
      <!-- Each audio file title links to project URL -->
    </div>
    <button class="close-button" data-action="closeCredits">
      Close
    </button>
  </div>
</div>
```

**Behavior**:
- Modal overlay (semi-transparent black background)
- Click close button or overlay to dismiss
- Audio file titles are clickable links

**Events**:
- `closeCredits()` - Dismiss credits dialog

**CSS Classes**:
- `credits-dialog-overlay` - Semi-transparent background
- `credits-dialog` - Modal content container
- `credits-content` - Scrollable content area
- `close-button` - Dismiss button

---

### Version Display

**Purpose**: Show current application version

**Structure**:
```html
<div class="version-display">
  v{{version}}
</div>
```

**Data**:
- `version` - String from VERSION file (e.g., "0.0.13")

**Behavior**:
- Displayed at bottom of splash screen
- Also printed to console on load

**CSS Classes**:
- `version-display` - Version text container

---

## Data

**From CRC cards**:
- `peerId: string` - See `crc-HollowPeer.md`, `crc-P2PWebAppNetworkProvider.md`
- `version: string` - Read from VERSION file (application state)

**Local state**: None required

---

## States

### Default
- All navigation buttons visible
- Placeholder buttons (Join/Start Game) may be disabled or styled differently
- Credits dialog hidden

### Credits Dialog Open
- Modal overlay visible
- Background content dimmed
- Focus trapped in dialog

---

## Events

**Behavior Implementation**: See `crc-SplashScreen.md` and `seq-navigate-from-splash.md`

**Navigation**:
- `clickJoinGame()` → Navigate to `/worlds` (future)
- `clickStartGame()` → Navigate to `/world` (future)
- `clickCharacters()` → Navigate to `/characters`
- `clickFriends()` → Navigate to `/friends`
- `clickSettings()` → Navigate to `/settings`

**Actions**:
- `copyPeerId()` → Copy peer ID to clipboard, show notification
- `clickCredits()` → Show credits dialog
- `closeCredits()` → Hide credits dialog

---

## CSS Classes

**Layout**:
- `splash-container` - Main container (min-height: 100vh)
- `splash-title` - Title text
- `hollow-glow` - Green glow effect
- `peer-id-display` - Peer ID container
- `peer-id-value` - Clickable peer ID
- `nav-buttons` - Button group container
- `nav-button` - Individual button
- `nav-button-placeholder` - Placeholder button variant
- `version-display` - Version text

**Credits Dialog**:
- `credits-dialog-overlay` - Modal overlay
- `credits-dialog` - Dialog container
- `credits-content` - Scrollable content
- `close-button` - Dismiss button

---

## Theme Requirements

**Typography**:
- Title: Sancreek font (old-west style)
- Green glow effect on "Hollow" word

**Layout**:
- Minimum height: 100vh on desktop
- Non-selectable elements (except peer ID when showing copy feedback)
- Medium-light brown text color throughout

**Western Frontier Styling** (from `manifest-ui.md`):
- Background: Dark brown/wood grain
- Buttons: Dark brown background with gold text
- Hover effects: Lighten background, gold border, subtle lift
- Consistent with global theme

---

*Last updated: 2025-11-08*
