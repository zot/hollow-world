# World Settings Modal

**CRC Card:** specs-crc/crc-WorldSettingsModal.md
**Source Spec:** specs/game-worlds.md (line 127)

---

## Purpose

Modal dialog for editing world settings: name, description, and user access controls for multiplayer.

---

## Overall Layout

```
┌──────────────────────────────────────────────────┐
│ World Settings                              [×]  │
├──────────────────────────────────────────────────┤
│                                                  │
│ World Name: [Dusty Creek_______________]         │
│                                                  │
│ Description:                                     │
│ ┌──────────────────────────────────────────────┐ │
│ │ A dusty frontier town...                     │ │
│ │                                              │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ Allowed Users (multiplayer):                     │
│ ┌──────────────────────────────────────────────┐ │
│ │ 12abc...def (Alice)                     [×]  │ │
│ │ 34ghi...jkl (Bob)                       [×]  │ │
│ └──────────────────────────────────────────────┘ │
│ [Add Friend...]                                  │
│                                                  │
│              [Cancel]  [Save Changes]            │
└──────────────────────────────────────────────────┘
```

---

## HTML Structure

### Modal Container
```html
<div class="modal-overlay" data-modal="world-settings">
  <div class="modal-dialog">
    <div class="modal-header">
      <h2>World Settings</h2>
      <button class="modal-close" data-action="closeWorldSettingsModal">×</button>
    </div>

    <div class="modal-body">
      <form id="world-settings-form">
        <!-- World name input -->
        <div class="form-group">
          <label for="edit-world-name">World Name:</label>
          <input type="text"
                 id="edit-world-name"
                 name="name"
                 required
                 maxlength="100"
                 value="{{world.name}}">
        </div>

        <!-- Description textarea -->
        <div class="form-group">
          <label for="edit-world-description">Description:</label>
          <textarea id="edit-world-description"
                    name="description"
                    rows="4">{{world.description}}</textarea>
        </div>

        <!-- Allowed users list -->
        <div class="form-group">
          <label>Allowed Users (multiplayer):</label>
          <div class="allowed-users-list">
            {{#each world.allowedUsers}}
            <div class="user-item">
              <span class="peer-id">{{peerId}}</span>
              <span class="user-name">({{userName}})</span>
              <button class="btn-remove"
                      data-action="removeAllowedUser"
                      data-peer-id="{{peerId}}">×</button>
            </div>
            {{/each}}
          </div>
          <button type="button"
                  class="btn-secondary"
                  data-action="showAddUserDialog">Add Friend...</button>
        </div>
      </form>
    </div>

    <div class="modal-footer">
      <button class="btn-secondary" data-action="closeWorldSettingsModal">Cancel</button>
      <button class="btn-primary" data-action="saveWorldSettings">Save Changes</button>
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
- `.modal-body` - Form content
- `.modal-footer` - Action buttons

### Form Elements
- `.form-group` - Individual form field container
- `input[type="text"]` - World name input
- `textarea` - Multi-line description

### Allowed Users List
- `.allowed-users-list` - Container for user items
- `.user-item` - Single user row
- `.peer-id` - Truncated peer ID display
- `.user-name` - Friend name in parentheses
- `.btn-remove` - × button to remove user

### Buttons
- `.btn-primary` - "Save Changes" button (western theme)
- `.btn-secondary` - "Cancel" and "Add Friend..." buttons
- `.modal-close` - × close button in header

---

## Data Bindings

### Template Variables
- `{{world.name}}` - World name
- `{{world.description}}` - World description
- `{{world.allowedUsers}}` - Array of allowed peer IDs with names
  - `{{peerId}}` - Full peer ID
  - `{{userName}}` - Friend name from FriendsManager

### Actions
- `data-action="closeWorldSettingsModal"` - Close modal without saving
- `data-action="saveWorldSettings"` - Validate and save changes
- `data-action="removeAllowedUser"` - Remove peer from allowed list
- `data-action="showAddUserDialog"` - Show friend picker dialog
- `data-peer-id` - Peer ID to remove

---

## Behavior

### Validation
1. **World name** - Required, must be non-empty, must be unique (except for current world)
2. Show inline error messages for validation failures

### Save Process
1. Validate inputs
2. Check if settings actually changed (use hash comparison)
3. If changed: persist to MudStorage
4. Close modal
5. Notify WorldListView via success callback
6. WorldListView refreshes world list
7. If editing active world: AdventureView reflects changes immediately

### User Access Management
- **Add Friend**: Shows dropdown of friends from FriendsManager
- **Remove User**: Removes peer ID from allowed list
- **Empty List**: Anyone can join (no restrictions)
- **Non-Empty List**: Only listed peers can join multiplayer sessions

### Modal Controls
- Click overlay backdrop → close modal (no save)
- Click × button → close modal (no save)
- Click Cancel → close modal (no save)
- Click Save Changes → validate and save
- ESC key → close modal (no save)

---

## Template File

**Location:** `public/templates/world-settings-modal.html`

---

## Traceability

**CRC Card:** specs-crc/crc-WorldSettingsModal.md
**Sequence:** specs-crc/seq-edit-world-settings.md
**Future Implementation:** src/ui/WorldSettingsModal.ts (to be created)
