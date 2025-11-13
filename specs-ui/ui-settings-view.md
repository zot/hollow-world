# SettingsView

**Source**: `specs/ui.settings.md`

**Route**: `/settings` (see `manifest.md`)

**Purpose**: Application settings, peer configuration, and profile management

---

## Structure

**Overall Layout**:
```
┌────────────────────────────────────────────────────────┐
│ 🔗 Peers: 3            Settings                        │ ← Header + Peer count
│                        {Alice}                         │    (profile if not Default)
├────────────────────────────────────────────────────────┤
│ Player Name: [Alice Smith______________]               │ ← Player name
│                                                        │
│ Peer ID: 12abc3def456789...                            │ ← Peer ID (click to copy)
│                                                        │
│ Pubsub Topic: [hollow-world-v1_________]               │ ← P2P settings
│ Peer Protocol: [/hollow/1.0.0__________]               │
│                                                        │
│ Private Notes:                                         │ ← Milkdown editor
│ ┌────────────────────────────────────────────────────┐ │
│ │ My personal notes...                               │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ [Profiles]  [Log]  [🔔 Events (3)]                     │ ← Action buttons
│                                                        │
│                      [Back]                            │ ← Back button
└────────────────────────────────────────────────────────┘
```

**Main sections** (vertical layout):
1. Header with title (shows profile if not Default)
2. Peer Count Display (upper left)
3. Player Name field
4. Peer ID display
5. P2P Network Settings (Pubsub Topic, Peer Protocol)
6. Private Notes editor
7. Profiles button
8. Log button
9. Events notification button (when events present)
10. Back button

---

## Header

**Structure**:
```html
<header class="settings-header">
  <h1>Settings</h1>
  {{#unless profile === 'Default'}}
    <div class="profile-badge">{{{profile}}}</div>
  {{/unless}}
</header>
```

**Behavior**:
- If profile is not "Default", display profile name in curly braces under title

**CSS Classes**:
- `settings-header` - Header container
- `profile-badge` - Profile name display

---

## Peer Count Display

**Purpose**: Show live count of connected peers

**Structure**:
```html
<div class="peer-count-display">
  🔗 Peers: {{peerCount}}
</div>
```

**Position**: Upper left of screen

**Behavior**:
- Updates automatically every 5 seconds
- Logs new peers as they are found

**Data**:
- `peerCount: number` - From P2PConnection concept

**Events**:
- Auto-refresh every 5s via `sync RefreshPeerCount`

**CSS Classes**:
- `peer-count-display` - Styled with western theme (monospace font, bordered background)

---

## Player Name

**Purpose**: Edit player's display name

**Structure**:
```html
<div class="field-group">
  <label>Player Name:</label>
  <input type="text"
         class="player-name-input"
         value="{{playerName}}"
         data-action="updatePlayerName">
</div>
```

**Behavior**:
- Saves on blur
- Stored in profile-scoped LocalStorage

**Events**:
- `updatePlayerName(name)` - Save player name

**CSS Classes**:
- `field-group` - Field container
- `player-name-input` - Text input

---

## Peer ID Display

**Purpose**: Show user's libp2p peer ID

**Structure**:
```html
<div class="field-group">
  <label>Peer ID:</label>
  <div class="peer-id-display">{{peerId}}</div>
</div>
```

**Behavior**:
- Read-only, selectable/copyable
- Label must not be occluded by value

**Data**:
- `peerId: string` - From P2PConnection concept

**CSS Classes**:
- `peer-id-display` - Monospace, western-themed

---

## P2P Network Settings

**Source**: `specs/ui.settings.md` → P2P Network Settings

**Purpose**: Configure pubsub topic and peer protocol for P2P networking

**Layout**: Collapsible "Advanced" section (collapsed by default)

**Layout (Collapsed)**:
```
┌────────────────────────────────────────────────────────┐
│ ▶ Advanced Settings                                   │
└────────────────────────────────────────────────────────┘
```

**Layout (Expanded)**:
```
┌────────────────────────────────────────────────────────┐
│ ▼ Advanced Settings                                    │
├────────────────────────────────────────────────────────┤
│ Pubsub Topic: [hollow-world____________] [🔄]          │
│ Changes require app restart to take effect             │
│                                                        │
│ Peer Messaging Protocol: [/hollow-world/1.0.0___] [🔄] │
│ Changes require app restart to take effect             │
└────────────────────────────────────────────────────────┘
```

**Structure**:
```html
<div class="advanced-section">
  <button class="advanced-toggle" data-action="toggleAdvanced">
    <span class="toggle-icon">▶</span>
    Advanced Settings
  </button>
  <div class="advanced-content" style="display: none;">
    <!-- Pubsub Topic and Peer Protocol fields -->
  </div>
</div>
```

**Behavior**:
- Collapsed by default (advanced-content hidden)
- Click toggle to expand/collapse
- Toggle icon changes: ▶ (collapsed) / ▼ (expanded)

**CSS Classes**:
- `advanced-section` - Container
- `advanced-toggle` - Toggle button
- `toggle-icon` - Arrow icon (▶/▼)
- `advanced-content` - Collapsible content

---

### Pubsub Topic

**Structure**:
```html
<div class="field-group">
  <label>Pubsub Topic:</label>
  <div class="field-with-reset">
    <input type="text"
           class="pubsub-topic-input"
           value="{{pubsubTopic}}"
           data-action="updatePubsubTopic">
    <button class="reset-button" data-action="resetPubsubTopic">🔄</button>
  </div>
  <p class="field-note">Changes require app restart to take effect</p>
</div>
```

**Default value**: `hollow-world`

**Behavior**:
- Saves on blur to profile-scoped LocalStorage
- Reset button restores default value
- Used by p2p-webapp for peer discovery
- Changes require app restart

**Events**:
- `updatePubsubTopic(topic)` - Save topic
- `resetPubsubTopic()` - Reset to default

**CSS Classes**:
- `pubsub-topic-input` - Text input
- `field-with-reset` - Input with reset button
- `reset-button` - Reset button
- `field-note` - Explanatory note

---

### Peer Messaging Protocol

**Structure**:
```html
<div class="field-group">
  <label>Peer Messaging Protocol:</label>
  <div class="field-with-reset">
    <input type="text"
           class="peer-protocol-input"
           value="{{peerProtocol}}"
           data-action="updatePeerProtocol">
    <button class="reset-button" data-action="resetPeerProtocol">🔄</button>
  </div>
  <p class="field-note">Changes require app restart to take effect</p>
</div>
```

**Default value**: `/hollow-world/1.0.0`

**Behavior**:
- Saves on blur to profile-scoped LocalStorage
- Reset button restores default value
- Used by p2p-webapp for protocol-based message routing
- Changes require app restart

**Events**:
- `updatePeerProtocol(protocol)` - Save protocol
- `resetPeerProtocol()` - Reset to default

**CSS Classes**:
- `peer-protocol-input` - Text input

**Storage**: Both settings stored in `hollowWorldSettings` object alongside player name and private notes

**Use Case**: Advanced users can create isolated P2P networks by changing these values (e.g., for testing or private groups)

---

## Private Notes

**Purpose**: Personal notes not shared with other players

**Structure**:
```html
<div class="field-group">
  <label>Private Notes:</label>
  <div class="notes-editor" data-notes="{{privateNotes}}">
    <!-- Milkdown crepe editor -->
  </div>
</div>
```

**Behavior**:
- Embedded Milkdown markdown editor
- Saves automatically to profile-scoped LocalStorage
- Not transmitted to other players

**Events**:
- `updatePrivateNotes(notes)` - Save notes automatically

**CSS Classes**:
- `notes-editor` - Milkdown editor container

---

## Profiles Button

**Purpose**: Open profile picker dialog

**Structure**:
```html
<button class="profiles-button" data-action="clickProfiles">
  Profiles
</button>
```

**Position**: To the right of the settings header

**Events**:
- `clickProfiles()` - Open ProfilePickerDialog

**CSS Classes**:
- `profiles-button` - Western-themed button

---

## Log Button

**Purpose**: Navigate to log view

**Structure**:
```html
<button class="log-button" data-action="clickLog">
  Log
</button>
```

**Position**: Under the Profiles button

**Events**:
- `clickLog()` - Navigate to `/settings/log`

**CSS Classes**:
- `log-button` - Western-themed button

---

## Events Notification Button

**Purpose**: Open events view when events are present

**Structure**:
```html
{{#if hasEvents}}
<button class="events-button" data-action="clickEvents">
  Events
</button>
{{/if}}
```

**Position**: Under the Log button

**Behavior**:
- Only visible when events exist
- Opens EventsView modal

**Events**:
- `clickEvents()` - Show EventsView modal

**CSS Classes**:
- `events-button` - Western-themed button

**Note**: This is separate from the global EventNotificationButton (see `manifest.md`). The global button appears at upper-right on ALL views. This is a context-specific button on Settings view.

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

## ProfilePickerDialog Component

**Source**: `specs/ui.settings.md` → Profiles button section

**Purpose**: Select or create profiles

**Trigger**: Click "Profiles" button

**Structure**:
```html
<div class="profile-picker-overlay">
  <div class="profile-picker-dialog">
    <h2>Profiles</h2>

    <div class="profiles-list">
      {{#each profiles}}
        <div class="profile-item {{#if isCurrent}}current{{/if}}"
             data-profile-id="{{id}}"
             data-action="selectProfile">
          {{name}}
          {{#if isCurrent}}<span class="current-badge">✓</span>{{/if}}
        </div>
      {{/each}}
    </div>

    <button class="add-profile-button" data-action="showCreateProfile">
      + Create Profile
    </button>

    <button class="close-button" data-action="closeProfilePicker">
      Close
    </button>
  </div>
</div>
```

**Behavior**:
- Lists all profiles by name
- Current profile marked with ✓
- Click profile to switch
- "+ Create Profile" button opens create form

**Events**:
- `selectProfile(profileId)` - Switch profile, restart session
- `showCreateProfile()` - Show create profile form
- `closeProfilePicker()` - Close dialog

**CSS Classes**:
- `profile-picker-overlay` - Modal overlay
- `profile-picker-dialog` - Dialog container
- `profiles-list` - Profile list
- `profile-item` - Individual profile
- `profile-item.current` - Current profile highlight
- `current-badge` - Checkmark indicator
- `add-profile-button` - Create button
- `close-button` - Close button

---

### Create Profile Form

**Purpose**: Create new profile with name

**Structure** (shown in ProfilePickerDialog):
```html
<div class="create-profile-form">
  <h3>Create New Profile</h3>

  <div class="field-group">
    <label>Profile Name:</label>
    <input type="text" class="profile-name-input" required>
  </div>

  <div class="form-actions">
    <button class="accept-button" data-action="submitCreateProfile">
      Accept
    </button>
    <button class="cancel-button" data-action="cancelCreateProfile">
      Cancel
    </button>
  </div>
</div>
```

**Behavior**:
- Name field required
- Accept: Creates profile, selects it, closes dialog
- Cancel: Returns to profile list

**Events**:
- `submitCreateProfile(name)` - Create and select profile
- `cancelCreateProfile()` - Cancel creation

**CSS Classes**:
- `create-profile-form` - Form container
- `profile-name-input` - Name input
- `form-actions` - Button group
- `accept-button`, `cancel-button` - Buttons

---

## LogView Component

**Source**: `specs/ui.settings.md` → Log button section

**Route**: `/settings/log` (see `manifest.md`)

**Purpose**: Display application log with filtering and sorting

**Structure**:
```html
<div class="log-view">
  <header class="log-header">
    <h1>Application Log</h1>
  </header>

  <div class="log-controls">
    <input type="text"
           class="log-filter"
           placeholder="Filter messages..."
           data-action="filterLog">
  </div>

  <table class="log-table">
    <thead>
      <tr>
        <th class="sortable" data-column="date" data-action="sortLog">
          Date
          <span class="sort-indicator">{{sortIndicator 'date'}}</span>
        </th>
        <th class="sortable" data-column="message" data-action="sortLog">
          Message
          <span class="sort-indicator">{{sortIndicator 'message'}}</span>
        </th>
      </tr>
    </thead>
    <tbody>
      {{#each filteredLogEntries}}
        <tr>
          <td class="log-date">{{formatDate date}}</td>
          <td class="log-message">{{message}}</td>
        </tr>
      {{/each}}
    </tbody>
  </table>

  <button class="back-button" data-action="clickBack">
    Back to Settings
  </button>
</div>
```

**Features**:
- **Filter field**: Filter by words in text (searches both date and message)
- **Sortable columns**: Click column headers to sort
  - Date column (ascending/descending)
  - Message column (ascending/descending)
- **Sort indicator**: Shows current sort direction (▲/▼)

**Sorting Behavior**:
- Reorders entire rows, not just columns
- Click header to toggle ascending/descending
- Sort indicator shows current direction

**Data**:
- `logEntries: ILogEntry[]` - From Log concept
  - Each entry: serialNumber, date, message
- `filteredLogEntries: ILogEntry[]` - Filtered and sorted

**Events**:
- `filterLog(query)` - Filter log entries by text
- `sortLog(column)` - Sort by column (toggle direction)
- `clickBack()` - Navigate to `/settings`

**CSS Classes**:
- `log-view` - Main container
- `log-header` - Header section
- `log-controls` - Filter controls
- `log-filter` - Filter input
- `log-table` - Table element
- `sortable` - Sortable column header
- `sort-indicator` - Sort direction indicator
- `log-date`, `log-message` - Table cells

---

## EventsView Component

**Source**: `specs/ui.md` → Events section

**Purpose**: Display persistent events with actions

**Trigger**: Click EventNotificationButton (global upper-right) or Events button (Settings view)

**Structure**:
```html
<div class="events-view-overlay">
  <div class="events-view-dialog">
    <h2>Events</h2>

    <div class="events-list">
      {{#each events}}
        <div class="event-card event-type-{{type}}">
          <!-- Event content varies by type -->
          {{> EventCard event=this}}

          <button class="remove-event" data-action="removeEvent" data-event-id="{{id}}">
            💀
          </button>
        </div>
      {{/each}}

      {{#unless events.length}}
        <div class="empty-state">No events</div>
      {{/unless}}
    </div>

    <div class="events-actions">
      <button class="mark-all-read" data-action="markAllRead">
        Mark All Read
      </button>
      <button class="clear-all" data-action="clearAllEvents">
        Clear All
      </button>
    </div>

    <button class="close-button" data-action="closeEvents">
      Close
    </button>
  </div>
</div>
```

**Event Types** (presented according to type):
- Friend requests (with Accept/Ignore/Ban buttons)
- Peer connections
- P2P errors
- Storage errors
- Other events

**Example: Friend Request Event**:
```html
<div class="event-card event-type-friend-request">
  <div class="event-icon">👥</div>
  <div class="event-content">
    <h4>Friend Request from {{playerName}}</h4>
    <p class="peer-id">{{peerId}}</p>
  </div>

  <div class="event-actions">
    <button class="accept-button" data-action="acceptFriendRequest" data-peer-id="{{peerId}}">
      Accept
    </button>
    <button class="ignore-button" data-action="ignoreFriendRequest" data-event-id="{{id}}">
      Ignore
    </button>
    <button class="ban-button" data-action="banFriendRequest" data-peer-id="{{peerId}}">
      Ban
    </button>
  </div>

  <button class="remove-event">💀</button>
</div>
```

**Friend Request Actions**:
- **Accept**: Add to friends with `pending: 'unsent'`, send `requestFriend`, remove event
- **Ignore**: Remove event only (no friend added, no message sent)
- **Ban**: Add to ban list, remove event (blocks future requests)

**Other Event Actions**:
- **Remove (💀)**: Dismiss individual event
- **Mark All Read**: Mark all events as read (may hide some from view)
- **Clear All**: Remove all events

**Data**:
- `events: IEvent[]` - From EventQueue concept
  - Each event: id, type, timestamp, data

**Events**:
- `acceptFriendRequest(peerId)` - Accept request, add friend
- `ignoreFriendRequest(eventId)` - Dismiss event
- `banFriendRequest(peerId)` - Ban peer, dismiss event
- `removeEvent(eventId)` - Dismiss specific event
- `markAllRead()` - Mark all as read
- `clearAllEvents()` - Remove all events
- `closeEvents()` - Close dialog

**CSS Classes**:
- `events-view-overlay` - Modal overlay
- `events-view-dialog` - Dialog container
- `events-list` - Events container
- `event-card` - Individual event
- `event-type-{type}` - Event type modifier
- `event-icon`, `event-content` - Event parts
- `event-actions` - Event-specific actions
- `accept-button`, `ignore-button`, `ban-button` - Friend request buttons
- `remove-event` - Dismiss button (💀)
- `events-actions` - Global actions
- `mark-all-read`, `clear-all` - Global action buttons

---

## Data

**From CRC cards** (see `crc-SettingsView.md`, `crc-ProfileService.md`, `crc-LogService.md`):
- `profile: string` - Current profile name (see `crc-ProfileService.md`)
- `playerName: string` - From current profile (see `crc-ProfileService.md`)
- `peerId: string` - From P2P system (see `crc-HollowPeer.md`)
- `peerCount: number` - From P2P system (see `crc-P2PWebAppNetworkProvider.md`)
- `pubsubTopic: string` - From LocalStorage settings
- `peerProtocol: string` - From LocalStorage settings
- `privateNotes: string` - From LocalStorage settings (profile-specific)
- `profiles: IProfile[]` - Profile list (see `crc-ProfileService.md`)
- `logEntries: ILogEntry[]` - Log entries (see `crc-LogService.md`)
- `events: IEvent[]` - Event queue (see `crc-EventModal.md`)

**Local state**:
- `isProfilePickerOpen: boolean`
- `isEventsViewOpen: boolean`
- `logFilter: string` - Current filter text
- `logSortColumn: string` - Current sort column
- `logSortDirection: 'asc' | 'desc'` - Sort direction

---

## States

### Default
- All settings fields editable
- Profiles button visible
- Log button visible
- Events button visible only if events exist
- ProfilePickerDialog closed
- EventsView closed

### Profile Picker Open
- Modal overlay visible
- Profile list displayed
- Can select profile or create new

### Create Profile Mode
- Create profile form shown in dialog
- Name field editable
- Accept/Cancel buttons visible

### Log View
- Navigated to `/settings/log`
- Log table displayed with filter
- Sortable columns

### Events View Open
- Modal overlay visible
- Events list displayed
- Event-specific actions available

---

## Events

**Settings**:
- `updatePlayerName(name)` - Save player name
- `updatePubsubTopic(topic)` - Save pubsub topic
- `resetPubsubTopic()` - Reset to default
- `updatePeerProtocol(protocol)` - Save peer protocol
- `resetPeerProtocol()` - Reset to default
- `updatePrivateNotes(notes)` - Save notes

**Profile Management**:
- `clickProfiles()` - Open ProfilePickerDialog
- `selectProfile(profileId)` - Switch profile, restart session
- `showCreateProfile()` - Show create form
- `submitCreateProfile(name)` - Create and select profile
- `cancelCreateProfile()` - Cancel creation
- `closeProfilePicker()` - Close dialog

**Navigation**:
- `clickLog()` - Navigate to `/settings/log`
- `clickEvents()` - Open EventsView
- `clickBack()` - Navigate to `/`

**Log View**:
- `filterLog(query)` - Filter log
- `sortLog(column)` - Sort by column

**Events View**:
- `acceptFriendRequest(peerId)` - Accept and add friend
- `ignoreFriendRequest(eventId)` - Dismiss event
- `banFriendRequest(peerId)` - Ban peer
- `removeEvent(eventId)` - Dismiss event
- `markAllRead()` - Mark all as read
- `clearAllEvents()` - Clear all
- `closeEvents()` - Close dialog

**Auto-refresh**:
- Peer count refreshes every 5 seconds (see `crc-SettingsView.md`)

## Behavior Implementation

**CRC Card**: `specs-crc/crc-SettingsView.md`

**Related CRC Cards**:
- `crc-ProfileService.md` - Profile management
- `crc-LogService.md` - Log viewing and filtering
- `crc-EventModal.md` - Event management

**Key Interactions** (see CRC cards for implementation):
- **Load settings**: SettingsView → ProfileService, LocalStorage (see `crc-SettingsView.md`)
- **Update player name**: SettingsView → ProfileService (see `crc-ProfileService.md`)
- **Update private notes**: SettingsView → LocalStorage (profile-specific)
- **Update P2P settings**: SettingsView → LocalStorage (pubsub topic, peer protocol)
- **Refresh peer count**: SettingsView → HollowPeer/P2PWebAppNetworkProvider (5s interval)
- **Show profile picker**: SettingsView → ProfilePickerDialog (modal)
- **Switch profile**: SettingsView → ProfileService → Restart session (see `crc-ProfileService.md`)
- **Create profile**: SettingsView → ProfileService (see `crc-ProfileService.md`)
- **Show log**: SettingsView → Router (navigate to `/settings/log`)
- **Show events**: SettingsView → EventModal (modal)
- **Mark event as read**: SettingsView → EventModal (see `crc-EventModal.md`)
- **Update events badge**: SettingsView updates badge count based on unread events

---

## CSS Classes

**Settings Layout**:
- `settings-container` - Main container
- `settings-header` - Header section
- `profile-badge` - Profile name display
- `peer-count-display` - Peer count (upper left)
- `field-group` - Field container
- `player-name-input`, `peer-id-display` - Player fields
- `pubsub-topic-input`, `peer-protocol-input` - P2P settings
- `field-with-reset` - Input with reset button
- `reset-button` - Reset button
- `field-note` - Explanatory note
- `notes-editor` - Milkdown editor
- `profiles-button`, `log-button`, `events-button` - Navigation buttons
- `back-button` - Back to menu

**ProfilePickerDialog**:
- `profile-picker-overlay`, `profile-picker-dialog` - Modal
- `profiles-list`, `profile-item`, `profile-item.current` - Profiles
- `current-badge` - Current profile indicator
- `add-profile-button` - Create button
- `create-profile-form` - Create form
- `profile-name-input` - Name input
- `form-actions`, `accept-button`, `cancel-button` - Form buttons

**LogView**:
- `log-view` - Main container
- `log-header` - Header section
- `log-controls`, `log-filter` - Filter controls
- `log-table` - Table
- `sortable`, `sort-indicator` - Sortable columns
- `log-date`, `log-message` - Table cells

**EventsView**:
- `events-view-overlay`, `events-view-dialog` - Modal
- `events-list`, `event-card` - Events
- `event-type-{type}` - Event type modifier
- `event-icon`, `event-content`, `event-actions` - Event parts
- `accept-button`, `ignore-button`, `ban-button` - Friend request actions
- `remove-event` - Dismiss button
- `events-actions`, `mark-all-read`, `clear-all` - Global actions

---

## Theme Requirements

**Western Frontier Styling** (from `manifest.md`):
- Settings fields: Parchment-style boxes
- Buttons: Dark brown background, gold text
- Modals: Dark brown background with gold accents
- Monospace: For peer ID, pubsub topic, peer protocol
- Milkdown editor: Western-themed, no padding

**Markdown Editing** (from `manifest.md`):
- Use Milkdown crepe for private notes
- No padding around editor content
- Use `crepe.on` for events
- Support all Crepe features

**Table Styling** (LogView):
- Western-themed table borders
- Sortable column indicators (▲/▼)
- Hover effects on rows

**Modal Behavior**:
- Semi-transparent black overlay (rgba(0,0,0,0.7))
- Click overlay or close button to dismiss
- Focus trap in dialog

---

*Last updated: 2025-11-08*
