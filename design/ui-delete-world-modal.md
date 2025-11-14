# Delete World Modal

**CRC Card:** crc-DeleteWorldModal.md
**Source Spec:** specs/game-worlds.md (line 127)

---

## Purpose

Simple confirmation modal for deleting a world with clear warning.

---

## Overall Layout

```
┌──────────────────────────────────────────────────┐
│ Delete World                                [×]  │
├──────────────────────────────────────────────────┤
│                                                  │
│  ⚠️  Warning: This action cannot be undone       │
│                                                  │
│  Are you sure you want to delete the world:      │
│                                                  │
│            "Dusty Creek"                         │
│                                                  │
│  All world data, rooms, and objects will be      │
│  permanently removed.                            │
│                                                  │
│              [Cancel]  [Delete World]            │
└──────────────────────────────────────────────────┘
```

---

## HTML Structure

### Modal Container
```html
<div class="modal-overlay" data-modal="delete-world">
  <div class="modal-dialog modal-danger">
    <div class="modal-header">
      <h2>Delete World</h2>
      <button class="modal-close" data-action="closeDeleteWorldModal">×</button>
    </div>

    <div class="modal-body">
      <div class="warning-message">
        <span class="warning-icon">⚠️</span>
        <strong>Warning: This action cannot be undone</strong>
      </div>

      <p>Are you sure you want to delete the world:</p>

      <p class="world-name-display">"{{worldName}}"</p>

      <p class="warning-text">
        All world data, rooms, and objects will be permanently removed.
      </p>
    </div>

    <div class="modal-footer">
      <button class="btn-secondary" data-action="closeDeleteWorldModal">Cancel</button>
      <button class="btn-danger"
              data-action="confirmDeleteWorld"
              data-world-id="{{worldId}}">Delete World</button>
    </div>
  </div>
</div>
```

---

## CSS Classes

### Modal Structure
- `.modal-overlay` - Full-screen semi-transparent backdrop
- `.modal-dialog` - Centered modal box
- `.modal-danger` - Red/warning styling variant
- `.modal-header` - Title and close button
- `.modal-body` - Confirmation message
- `.modal-footer` - Action buttons

### Content Elements
- `.warning-message` - Warning banner at top
- `.warning-icon` - ⚠️ emoji/icon
- `.world-name-display` - Emphasized world name in quotes
- `.warning-text` - Consequence description

### Buttons
- `.btn-danger` - "Delete World" button (red, destructive action)
- `.btn-secondary` - "Cancel" button
- `.modal-close` - × close button in header

---

## Data Bindings

### Template Variables
- `{{worldName}}` - Name of world being deleted
- `{{worldId}}` - ID of world being deleted

### Actions
- `data-action="closeDeleteWorldModal"` - Close modal without deleting
- `data-action="confirmDeleteWorld"` - Delete world
- `data-world-id` - World ID to delete

---

## Behavior

### Deletion Process
1. User confirms deletion
2. Delete world from MudStorage
3. Close modal
4. Notify WorldListView via success callback
5. WorldListView refreshes world list
6. If deleted world was active: Router navigates to another world

### Modal Controls
- Click overlay backdrop → close modal (no deletion)
- Click × button → close modal (no deletion)
- Click Cancel → close modal (no deletion)
- Click Delete World → permanently delete
- ESC key → close modal (no deletion)

### Visual Emphasis
- Red/warning color scheme for destructive action
- World name displayed prominently in quotes
- Clear warning message about consequences
- "Delete World" button styled as dangerous action

---

## Template File

**Location:** `public/templates/delete-world-modal.html`

---

## Traceability

**CRC Card:** crc-DeleteWorldModal.md
**Sequence:** seq-delete-world.md
**Future Implementation:** src/ui/DeleteWorldModal.ts (to be created)
