# Join Session Modal

**CRC Card:** crc-JoinSessionModal.md
**Source Spec:** game-worlds.md (line 138, implicit from multiplayer modes)

---

## Purpose

Modal dialog for joining a multiplayer MUD session hosted by another peer.

---

## Overall Layout

```
┌──────────────────────────────────────────────────┐
│ Join Multiplayer Session                    [×]  │
├──────────────────────────────────────────────────┤
│                                                  │
│ Host Peer ID:                                    │
│ [12abc3def456789...____________] or              │
│ [Select Friend ▼]                                │
│                                                  │
│ Your Character:                                  │
│ [Select Character ▼]                             │
│   - Alice (Rank 3)                               │
│   - Bob (Rank 2)                                 │
│   - Charlie (Rank 1)                             │
│                                                  │
│              [Cancel]  [Join Session]            │
└──────────────────────────────────────────────────┘

(Loading state when connecting)
┌──────────────────────────────────────────────────┐
│ Join Multiplayer Session                    [×]  │
├──────────────────────────────────────────────────┤
│                                                  │
│          Connecting to host...                   │
│                                                  │
│              [●●●●●]                             │
│                                                  │
└──────────────────────────────────────────────────┘

(Error state)
┌──────────────────────────────────────────────────┐
│ Join Multiplayer Session                    [×]  │
├──────────────────────────────────────────────────┤
│                                                  │
│  ❌ Connection failed                            │
│                                                  │
│  Could not connect to host peer.                 │
│  Please check the peer ID and try again.         │
│                                                  │
│              [Cancel]  [Retry]                   │
└──────────────────────────────────────────────────┘
```

---

## HTML Structure

### Modal Container
```html
<div class="modal-overlay" data-modal="join-session">
  <div class="modal-dialog">
    <div class="modal-header">
      <h2>Join Multiplayer Session</h2>
      <button class="modal-close" data-action="closeJoinSessionModal">×</button>
    </div>

    <div class="modal-body">
      <!-- Form state -->
      <div class="join-form-state" data-state="form">
        <form id="join-session-form">
          <!-- Host peer ID input -->
          <div class="form-group">
            <label for="host-peer-id">Host Peer ID:</label>
            <input type="text"
                   id="host-peer-id"
                   name="hostPeerId"
                   required
                   placeholder="Enter host peer ID">
            <span class="form-hint">or</span>
            <select id="friend-selector" data-action="selectFriend">
              <option value="">Select Friend</option>
              {{#each friends}}
              <option value="{{peerId}}">{{name}} ({{peerId}})</option>
              {{/each}}
            </select>
          </div>

          <!-- Character selection -->
          <div class="form-group">
            <label for="character-select">Your Character:</label>
            <select id="character-select" name="characterId" required>
              <option value="">Select Character</option>
              {{#each characters}}
              <option value="{{id}}">{{name}} (Rank {{rank}})</option>
              {{/each}}
            </select>
          </div>
        </form>
      </div>

      <!-- Loading state -->
      <div class="join-form-state" data-state="loading" style="display: none;">
        <div class="loading-message">
          <p>Connecting to host...</p>
          <div class="loading-spinner"></div>
        </div>
      </div>

      <!-- Error state -->
      <div class="join-form-state" data-state="error" style="display: none;">
        <div class="error-message">
          <span class="error-icon">❌</span>
          <p><strong>Connection failed</strong></p>
          <p class="error-details">Could not connect to host peer. Please check the peer ID and try again.</p>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn-secondary" data-action="closeJoinSessionModal">Cancel</button>
      <button class="btn-primary"
              data-action="joinSession"
              data-state="form">Join Session</button>
      <button class="btn-primary"
              data-action="retryJoinSession"
              data-state="error"
              style="display: none;">Retry</button>
    </div>
  </div>
</div>
```

---

## CSS Classes

### Modal Structure
- `.modal-overlay` - Full-screen semi-transparent backdrop
- `.modal-dialog` - Centered modal box
- `.modal-header` - Title and close button
- `.modal-body` - Form/loading/error content
- `.modal-footer` - Action buttons

### Form Elements
- `.form-group` - Individual form field container
- `input[type="text"]` - Peer ID input
- `select` - Friend selector and character selector dropdowns
- `.form-hint` - "or" text between peer ID and friend selector

### States
- `.join-form-state` - Container for each state (form/loading/error)
- `data-state="form"` - Initial form state
- `data-state="loading"` - Connecting state
- `data-state="error"` - Connection failed state

### Loading State
- `.loading-message` - Centered loading text
- `.loading-spinner` - Animated spinner

### Error State
- `.error-message` - Error display container
- `.error-icon` - ❌ emoji
- `.error-details` - Detailed error description

### Buttons
- `.btn-primary` - "Join Session" / "Retry" button (western theme)
- `.btn-secondary` - "Cancel" button
- `.modal-close` - × close button in header

---

## Data Bindings

### Template Variables
- `{{friends}}` - Array of friends from FriendsManager
  - `{{peerId}}` - Friend's peer ID
  - `{{name}}` - Friend's name
- `{{characters}}` - Array of user's characters
  - `{{id}}` - Character ID
  - `{{name}}` - Character name
  - `{{rank}}` - Character rank

### Actions
- `data-action="closeJoinSessionModal"` - Close modal without joining
- `data-action="joinSession"` - Validate and connect to host
- `data-action="retryJoinSession"` - Retry connection after error
- `data-action="selectFriend"` - Auto-fill peer ID from friend selection

### Form Data
- `hostPeerId` - Peer ID of session host (required)
- `characterId` - Character to use in session (required)

---

## Behavior

### Form Validation
1. **Host Peer ID** - Required, must be valid peer ID format
2. **Character** - Required, must select a character
3. Show inline error messages for validation failures

### Connection Process
1. Validate inputs
2. Switch to loading state, show spinner
3. Call `HollowIPeer.connectToHost(peerId)`
4. If success:
   - Close modal
   - Notify AdventureView via callback
   - AdventureView switches to guest mode
5. If failure:
   - Switch to error state
   - Show error message
   - Enable Retry button

### Friend Selection
- Selecting friend from dropdown auto-fills peer ID input
- User can still manually edit peer ID
- Friend list populated from FriendsManager

### Character Selection
- Shows all user's characters alphabetically
- Displays character name and rank
- Selected character used in MUD session

### Modal Controls
- Click overlay backdrop → close modal (no join)
- Click × button → close modal (no join)
- Click Cancel → close modal (no join)
- Click Join Session → validate and connect
- Click Retry → retry connection with same inputs
- ESC key → close modal (no join)

### State Management
- Show/hide different content sections based on state
- Show/hide different buttons based on state
- Loading state disables close button (force wait or connection timeout)

---

## Template File

**Location:** `public/templates/join-session-modal.html`

---

## Traceability

**CRC Card:** crc-JoinSessionModal.md
**Sequence:** seq-join-session.md
**Future Implementation:** src/ui/JoinSessionModal.ts (to be created)
