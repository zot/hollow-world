# FriendsView

**Source**: `specs/ui.friends.md`

**Route**: `/friends` (see `manifest-ui.md`)

**Purpose**: Manage P2P friend relationships and view friend status

---

## Structure

**Overall Layout**:
```
┌────────────────────────────────────────────────────────┐
│ Friends                                                │ ← Header
├────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐ │
│ │ Alice Smith  📤 Unsent                        [💀] │ │ ← FriendCard (collapsed)
│ │ 12abc3def456...                                    │ │
│ │ Met at the saloon                                  │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Bob Jones  [⬆️]                                    │ │ ← FriendCard (expanded)
│ ├────────────────────────────────────────────────────┤ │
│ │ Player Name: [Bob Jones_____________]              │ │
│ │ Peer ID: 98xyz7uvw321...                           │ │
│ │ Private Notes: [Milkdown editor]                   │ │
│ │ Shared Worlds:                                     │ │
│ │   🗺️ Dusty Creek (Hosted by friend)               │ │
│ │   • Charlie (my character) ⭐                      │ │
│ │ [Approve] [Decline] [Ignore] [Remove]              │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│                 [Add Friend]                           │
│         [⬇ Banned Peers (2)]                          │
│                 [Back]                                 │
└────────────────────────────────────────────────────────┘
```

**Main sections** (vertical layout):
1. Header with title
2. Friends list (FriendCard components)
3. Add Friend button
4. Banned Peers section (collapsible)
5. Back button

---

## Header

**Structure**:
```html
<header class="friends-header">
  <h1>Friends</h1>
</header>
```

**CSS Classes**:
- `friends-header` - Header container

---

## Friends List

**Purpose**: Display all friends with expandable cards

**Structure**:
```html
<div class="friends-list">
  {{#each friends}}
    {{> FriendCard friend=this}}
  {{/each}}
</div>

<!-- Empty state -->
{{#unless friends.length}}
<div class="empty-state">
  <p>No friends yet. Add a friend to get started!</p>
</div>
{{/unless}}
```

**Data**:
- `friends: IFriend[]` - From Friend concept (FriendStorage)

**CSS Classes**:
- `friends-list` - Friends container
- `empty-state` - Empty state message

---

## FriendCard Component

**Source**: `specs/ui.friends.md` → Friend Cards section

**Purpose**: Display single friend with expand/collapse functionality

### Collapsed State (Default)

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│ Alice Smith  📤 Unsent                            [💀] │ ← Name + status + remove
│ 12abc3def456789abcdef...                              │ ← Peer ID
│ Met at the saloon last week...                        │ ← Notes preview (if exists)
│ 🗺️ Active in 2 world(s)                               │ ← Worlds preview (if any)
└────────────────────────────────────────────────────────┘
 ↑ Click anywhere to expand
```

**Structure**:
```html
<div class="friend-card" data-friend-id="{{friend.peerId}}" data-action="toggleExpand">
  <div class="friend-collapsed">
    <div class="friend-summary">
      <div class="friend-name">
        {{friend.playerName}}
        {{#if friend.pending}}
          <span class="status-badge status-{{friend.pending}}">
            {{#if friend.pending === 'unsent'}}📤 Unsent{{else}}⏳ Pending{{/if}}
          </span>
        {{/if}}
      </div>
      <div class="peer-id-preview">{{friend.peerId}}</div>
      {{#if friend.notes}}
        <div class="notes-preview">{{truncate friend.notes 50}}</div>
      {{/if}}
      {{#if friend.worlds.length}}
        <div class="worlds-preview">🗺️ Active in {{friend.worlds.length}} world(s)</div>
      {{/if}}
    </div>
    <button class="quick-remove" data-action="removeFriend" data-friend-id="{{friend.peerId}}">
      💀
    </button>
  </div>
</div>
```

**Status Badges**:
- **"📤 Unsent"**: `friend.pending === 'unsent'` (gray background)
- **"⏳ Pending"**: `friend.pending === 'pending'` (orange background)

**Behavior**:
- Click anywhere on card to expand
- Click 💀 button to quick-remove (with confirmation)

**CSS Classes**:
- `friend-card` - Card container
- `friend-collapsed` - Collapsed state container
- `friend-summary` - Summary content
- `friend-name` - Player name
- `status-badge` - Status indicator
- `status-unsent`, `status-pending` - Badge variants
- `peer-id-preview` - Peer ID display
- `notes-preview` - First line of notes
- `worlds-preview` - Worlds count
- `quick-remove` - Delete button

---

### Expanded State

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│ Bob Jones  ⏳ Pending                             [⬆️] │ ← Header (click to collapse)
├────────────────────────────────────────────────────────┤
│ Player Name: [Bob Jones_____________________]          │ ← Editable name
│                                                        │
│ Peer ID: 98xyz7uvw321abcdef...                        │ ← Read-only peer ID
│                                                        │
│ Private Notes:                                         │ ← Milkdown editor
│ ┌────────────────────────────────────────────────────┐ │
│ │ Met at the trading post...                         │ │
│ │ Good at hunting.                                   │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ Shared Worlds:                                         │ ← Worlds section
│   🗺️ Dusty Creek (Hosted by friend)                   │
│     • Charlie (my character) ⭐                        │
│     • Alice (my character)                             │
│                                                        │
│ [Remove] [Ban]                                         │ ← Action buttons
└────────────────────────────────────────────────────────┘
```

**Structure**:
```html
<div class="friend-card expanded" data-friend-id="{{friend.peerId}}">
  <div class="friend-expanded">
    <div class="friend-header" data-action="toggleExpand">
      <span class="friend-name">
        {{friend.playerName}}
        {{#if friend.pending}}
          <span class="status-badge status-{{friend.pending}}">
            {{#if friend.pending === 'unsent'}}📤 Unsent{{else}}⏳ Pending{{/if}}
          </span>
        {{/if}}
      </span>
      <button class="collapse-button">⬆️</button>
    </div>

    <div class="friend-details">
      <!-- Player Name (editable) -->
      <div class="field-group">
        <label>Player Name:</label>
        <input type="text"
               class="player-name-input"
               value="{{friend.playerName}}"
               data-friend-id="{{friend.peerId}}"
               data-action="updatePlayerName">
      </div>

      <!-- Peer ID (read-only) -->
      <div class="field-group">
        <label>Peer ID:</label>
        <div class="peer-id-display">{{friend.peerId}}</div>
      </div>

      <!-- Private Notes (Milkdown editor) -->
      <div class="field-group">
        <label>Private Notes:</label>
        <div class="notes-editor"
             data-friend-id="{{friend.peerId}}"
             data-notes="{{friend.notes}}">
          <!-- Milkdown crepe editor initialized here -->
        </div>
      </div>

      <!-- Worlds Section (if friend has shared worlds) -->
      {{#if friend.worlds.length}}
      <div class="worlds-section">
        <h4>Shared Worlds</h4>
        {{#each friend.worlds}}
          <div class="world-item">
            <div class="world-header">
              🗺️ {{worldName}}
              <span class="world-host">
                {{#if isHostedByFriend}}(Hosted by friend){{else}}(Your world){{/if}}
              </span>
            </div>
            {{#if characters.length}}
            <ul class="world-characters">
              {{#each characters}}
                <li>
                  {{character.name}}
                  {{#if @index === 0}}<span class="default-badge">⭐</span>{{/if}}
                </li>
              {{/each}}
            </ul>
            {{/if}}
          </div>
        {{/each}}
      </div>
      {{/if}}

      <!-- Action Buttons -->
      <div class="friend-actions">
        <button class="remove-button" data-action="removeFriend" data-friend-id="{{friend.peerId}}">
          Remove
        </button>
        <button class="ban-button" data-action="banFriend" data-friend-id="{{friend.peerId}}">
          Ban
        </button>
      </div>
    </div>
  </div>
</div>
```

**Editable Fields**:
- **Player Name**: Text input, saves on blur
- **Private Notes**: Milkdown crepe editor, saves automatically

**Read-Only Fields**:
- **Peer ID**: Selectable/copyable text, not editable

**Worlds Display**:
- Only shown if `friend.worlds.length > 0`
- Each world shows:
  - World name with 🗺️ icon
  - Host indicator: "(Hosted by friend)" or "(Your world)"
  - Character list with ⭐ for first/default character

**Action Buttons**:
- **Remove**: Delete friend (with confirmation)
- **Ban**: Ban friend (with confirmation, removes from friends, adds to ban list)

**Events**:
- `toggleExpand()` - Collapse back to summary (click header or ⬆️ button)
- `updatePlayerName(friendId, name)` - Save player name on blur
- `updateNotes(friendId, notes)` - Save notes automatically (Milkdown change)
- `removeFriend(friendId)` - Confirm and remove
- `banFriend(friendId)` - Confirm and ban

**CSS Classes**:
- `friend-card.expanded` - Expanded state modifier
- `friend-expanded` - Expanded state container
- `friend-header` - Header with name and collapse button
- `collapse-button` - Collapse button (⬆️)
- `friend-details` - Details content
- `field-group` - Field container
- `player-name-input` - Editable name field
- `peer-id-display` - Read-only peer ID
- `notes-editor` - Milkdown editor container
- `worlds-section` - Worlds container
- `world-item` - Individual world
- `world-header`, `world-host`, `world-characters` - World details
- `default-badge` - Star for default character
- `friend-actions` - Action buttons container
- `remove-button`, `ban-button` - Action buttons

---

### Re-rendering Behavior

**Critical**: Friend cards MUST fully re-render when state changes

**Triggers for re-render**:
- Collapse/expand transition
- Friend data changes (pending status, player name)
- Notes update (preserves Milkdown editor state with targeted updates)

**Implementation**:
- **Option 1**: Full friends view re-render (simple but may lose UI state)
- **Option 2**: Targeted DOM updates via `updateFriendCard()` method
  - Recommended approach
  - Finds card by `data-friend-id` attribute
  - Updates badges, names in both collapsed/expanded sections
  - Preserves expanded/collapsed state and Milkdown editor

**Why re-rendering matters**:
- Ensures Milkdown editor properly initialized
- Prevents stale DOM elements and state inconsistencies
- Each state transition creates fresh DOM elements

---

## Add Friend Dialog

**Purpose**: Send friend request by peer ID

**Trigger**: Click "Add Friend by Peer ID" button below friends list

**Structure**:
```html
<button class="add-friend-button" data-action="showAddFriendDialog">
  Add Friend by Peer ID
</button>

<!-- Modal Dialog -->
<div class="add-friend-dialog-overlay">
  <div class="add-friend-dialog">
    <h2>Add Friend by Peer ID</h2>

    <div class="dialog-content">
      <div class="field-group">
        <label>Friend Name: *</label>
        <input type="text" class="friend-name-input" required>
      </div>

      <div class="field-group">
        <label>Peer ID: *</label>
        <input type="text" class="peer-id-input" required>
      </div>

      <div class="field-group">
        <label>Private Notes: (optional)</label>
        <div class="notes-editor">
          <!-- Milkdown crepe editor -->
        </div>
      </div>
    </div>

    <div class="dialog-actions">
      <button class="add-button" data-action="submitAddFriend">Add Friend</button>
      <button class="cancel-button" data-action="cancelAddFriend">Cancel</button>
    </div>
  </div>
</div>
```

**Validation**:
- Friend Name: Required
- Peer ID: Required
- Private Notes: Optional

**Behavior**:
- Click "Add Friend": Validates, adds friend with `pending: 'unsent'`, sends `requestFriend` message, closes dialog
- Click "Cancel": Closes dialog without saving
- Shows notification: "Added friend: [name] ([peer ID])"

**Events**:
- `showAddFriendDialog()` - Open dialog
- `submitAddFriend(name, peerId, notes)` - Add friend and send request
- `cancelAddFriend()` - Close dialog

**CSS Classes**:
- `add-friend-button` - Trigger button
- `add-friend-dialog-overlay` - Modal overlay
- `add-friend-dialog` - Dialog container
- `dialog-content` - Form fields
- `dialog-actions` - Action buttons
- `add-button`, `cancel-button` - Buttons

---

## Banned Peers Section

**Source**: `specs/ui.friends.md` → Banned Peers Section

**Purpose**: Manage banned peers list

**Position**: Below friends list and "Add Friend" button

### Collapsed State (Default)

**Structure**:
```html
<div class="banned-peers-section">
  <div class="banned-peers-header" data-action="toggleBannedSection">
    <h3>🚫 Banned Peers ({{bannedPeers.length}})</h3>
    <button class="expand-button">▼</button>
  </div>
</div>
```

**Behavior**:
- Click header to expand
- Shows count of banned peers

**CSS Classes**:
- `banned-peers-section` - Section container
- `banned-peers-header` - Clickable header
- `expand-button` - Expand indicator

---

### Expanded State

**Structure**:
```html
<div class="banned-peers-section expanded">
  <div class="banned-peers-header" data-action="toggleBannedSection">
    <h3>🚫 Banned Peers ({{bannedPeers.length}})</h3>
    <button class="collapse-button">▲</button>
  </div>

  <div class="banned-peers-list">
    {{#each bannedPeers}}
      <div class="banned-peer-card" data-peer-id="{{peerId}}">
        <!-- Player Name (editable) -->
        <div class="field-group">
          <label>Player Name:</label>
          <input type="text"
                 value="{{friend.playerName}}"
                 data-peer-id="{{peerId}}"
                 data-action="updateBannedPlayerName">
        </div>

        <!-- Peer ID (read-only, truncated) -->
        <div class="field-group">
          <label>Peer ID:</label>
          <div class="peer-id-display">{{truncate peerId 20}}</div>
        </div>

        <!-- Banned Date -->
        <div class="field-group">
          <label>Banned:</label>
          <span class="banned-date">{{formatDate bannedAt}}</span>
        </div>

        <!-- Private Notes (collapsible Milkdown editor) -->
        <div class="field-group">
          <label>Private Notes:</label>
          <div class="notes-editor" data-peer-id="{{peerId}}">
            <!-- Milkdown crepe editor -->
          </div>
        </div>

        <!-- Actions -->
        <div class="banned-peer-actions">
          <button class="send-request-button"
                  data-action="sendFriendRequestToBanned"
                  data-peer-id="{{peerId}}">
            📨 Send Friend Request
          </button>
          <button class="unban-button"
                  data-action="unbanPeer"
                  data-peer-id="{{peerId}}">
            ❌ Unban
          </button>
        </div>
      </div>
    {{/each}}

    <!-- Empty state -->
    {{#unless bannedPeers.length}}
    <div class="empty-state">No banned peers</div>
    {{/unless}}
  </div>
</div>
```

**Editable Fields**:
- **Player Name**: Saves on blur
- **Private Notes**: Milkdown editor, saves automatically

**Read-Only Fields**:
- **Peer ID**: Truncated, selectable/copyable
- **Banned Date**: Formatted timestamp (e.g., "Jan 15, 2025")

**Action Buttons**:
- **Send Friend Request** (📨): Unban automatically, add to friends with `pending: 'unsent'`, send request, preserve name/notes
- **Unban** (❌): Show confirmation, remove from ban list only (does NOT add to friends)

**Events**:
- `toggleBannedSection()` - Expand/collapse section
- `updateBannedPlayerName(peerId, name)` - Save name on blur
- `updateBannedNotes(peerId, notes)` - Save notes automatically
- `sendFriendRequestToBanned(peerId)` - Unban, add friend, send request
- `unbanPeer(peerId)` - Confirm and remove from ban list

**CSS Classes**:
- `banned-peers-section.expanded` - Expanded state
- `banned-peers-list` - List container
- `banned-peer-card` - Individual banned peer
- `banned-date` - Formatted date
- `banned-peer-actions` - Action buttons
- `send-request-button`, `unban-button` - Action buttons

---

## Back Button

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

**From CRC cards** (see `crc-Friend.md`, `crc-FriendsManager.md`):
- `friends: IFriend[]` - Friend list from FriendsManager
  - Each friend: peerId, playerName, notes, pending?, worlds[]
- `bannedPeers: IBannedPeer[]` - Banned peer list from FriendsManager
  - Each banned peer: peerId, friend (IFriend), bannedAt (Date)

**Local state**:
- `expandedCards: Set<string>` - Peer IDs of expanded friend cards
- `isBannedSectionExpanded: boolean` - Banned section state

---

## States

### Default
- Friends list displayed with all cards collapsed
- Banned peers section collapsed
- Add Friend button visible

### Friend Card Expanded
- Specific card shows full details
- Milkdown editor initialized
- Other cards remain collapsed

### Add Friend Dialog Open
- Modal overlay visible
- Form fields editable
- Background dimmed

### Banned Section Expanded
- Shows list of banned peers
- Each peer editable
- Collapse button visible

---

## Events

**Friend Management**:
- `toggleExpand(friendId)` - Expand/collapse friend card
- `updatePlayerName(friendId, name)` - Save friend name
- `updateNotes(friendId, notes)` - Save friend notes
- `removeFriend(friendId)` - Confirm and delete
- `banFriend(friendId)` - Confirm and ban

**Add Friend**:
- `showAddFriendDialog()` - Open dialog
- `submitAddFriend(name, peerId, notes)` - Add friend, send request
- `cancelAddFriend()` - Close dialog

**Banned Peers**:
- `toggleBannedSection()` - Expand/collapse
- `updateBannedPlayerName(peerId, name)` - Save name
- `updateBannedNotes(peerId, notes)` - Save notes
- `sendFriendRequestToBanned(peerId)` - Unban and send request
- `unbanPeer(peerId)` - Confirm and unban

**Navigation**:
- `clickBack()` - Navigate to `/`

## Behavior Implementation

**CRC Card**: `crc-FriendsView.md`

**Sequence Diagrams**:
- `seq-add-friend-by-peerid.md` - Add friend by peer ID flow
- `seq-friend-presence-update.md` - Friend presence updates
- `seq-friend-status-change.md` - Friend status changes

**Key Interactions** (see CRC cards for implementation):
- **Load friends list**: FriendsView → FriendsManager (see `crc-FriendsView.md`)
- **Update player name**: FriendsView → FriendsManager (see `crc-FriendsManager.md`)
- **Update notes**: FriendsView → FriendsManager (see `crc-FriendsManager.md`)
- **Add friend**: FriendsView → FriendsManager → HollowPeer (see `seq-add-friend-by-peerid.md`)
- **Send friend request**: FriendsView → FriendsManager → HollowPeer (see `seq-add-friend-by-peerid.md`)
- **Remove friend**: FriendsView → FriendsManager (with confirmation, see `crc-FriendsManager.md`)
- **Ban peer**: FriendsView → FriendsManager (with confirmation, see `crc-FriendsManager.md`)
- **Update status badge**: FriendsView updates UI based on friend.pending field (see `crc-Friend.md`)
- **Unban peer**: FriendsView → FriendsManager (with confirmation, see `crc-FriendsManager.md`)
- **Send request to banned**: FriendsView → FriendsManager (unban + add friend + send request, see `crc-FriendsManager.md`)

---

## CSS Classes

**Layout**:
- `friends-container` - Main container
- `friends-header` - Header section
- `friends-list` - Friends container
- `empty-state` - Empty state message
- `add-friend-button` - Add friend trigger
- `back-button` - Back to menu

**Friend Cards**:
- `friend-card` - Card container
- `friend-card.expanded` - Expanded state
- `friend-collapsed`, `friend-expanded` - State containers
- `friend-summary` - Collapsed summary
- `friend-name`, `peer-id-preview`, `notes-preview`, `worlds-preview` - Summary fields
- `status-badge`, `status-unsent`, `status-pending` - Status indicators
- `quick-remove` - Quick delete button
- `friend-header` - Expanded header
- `collapse-button` - Collapse button
- `friend-details` - Expanded details
- `field-group` - Field container
- `player-name-input`, `peer-id-display`, `notes-editor` - Fields
- `worlds-section`, `world-item`, `world-header`, `world-characters` - Worlds display
- `default-badge` - Default character star
- `friend-actions`, `remove-button`, `ban-button` - Actions

**Add Friend Dialog**:
- `add-friend-dialog-overlay`, `add-friend-dialog` - Dialog
- `dialog-content`, `dialog-actions` - Dialog sections
- `add-button`, `cancel-button` - Dialog buttons

**Banned Peers**:
- `banned-peers-section`, `banned-peers-section.expanded` - Section
- `banned-peers-header`, `expand-button`, `collapse-button` - Header
- `banned-peers-list` - List container
- `banned-peer-card` - Individual card
- `banned-date` - Date display
- `banned-peer-actions`, `send-request-button`, `unban-button` - Actions

---

## Theme Requirements

**Western Frontier Styling** (from `manifest-ui.md`):
- Friend cards: Parchment-style with brown borders
- Expanded cards: Slightly darker background for contrast
- Status badges:
  - Unsent: Gray background (#888)
  - Pending: Orange background (#ff8c00)
- Ban button: Red with warning styling
- Milkdown editor: Western-themed, no padding around content
- Modal overlays: Semi-transparent black (rgba(0,0,0,0.7))

**Markdown Editing** (from `manifest-ui.md`):
- Use Milkdown crepe for all notes fields
- No padding around editor content
- Use `crepe.on` for events
- Support all Crepe features

**P2P UX** (from `manifest-ui.md`):
- NO DIALOGS for P2P status updates
- Use visual badges for status
- Status badges show current state
- Non-intrusive and seamless

---

*Last updated: 2025-11-08*
