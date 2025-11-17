# Create World Modal

**CRC Card:** crc-CreateWorldModal.md
**Source Spec:** game-worlds.md (lines 126-128)

---

## Purpose

Modal dialog for creating new MUD worlds with name, description, and optional YAML import.

---

## Overall Layout

```
┌──────────────────────────────────────────────────┐
│ Create New World                            [×]  │
├──────────────────────────────────────────────────┤
│                                                  │
│ World Name: [_________________________]          │
│                                                  │
│ Description:                                     │
│ ┌──────────────────────────────────────────────┐ │
│ │                                              │ │
│ │ (multi-line text area)                       │ │
│ │                                              │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ☐ Import from YAML file                         │
│   [Choose File...]  (if checked)                │
│                                                  │
│              [Cancel]  [Create World]            │
└──────────────────────────────────────────────────┘
```

---

## HTML Structure

### Modal Container
```html
<div class="modal-overlay" data-modal="create-world">
  <div class="modal-dialog">
    <div class="modal-header">
      <h2>Create New World</h2>
      <button class="modal-close" data-action="closeCreateWorldModal">×</button>
    </div>

    <div class="modal-body">
      <form id="create-world-form">
        <!-- World name input -->
        <div class="form-group">
          <label for="world-name">World Name:</label>
          <input type="text"
                 id="world-name"
                 name="name"
                 required
                 maxlength="100"
                 placeholder="Enter world name">
        </div>

        <!-- Description textarea -->
        <div class="form-group">
          <label for="world-description">Description:</label>
          <textarea id="world-description"
                    name="description"
                    rows="4"
                    placeholder="Enter world description (optional)"></textarea>
        </div>

        <!-- YAML import option -->
        <div class="form-group">
          <label>
            <input type="checkbox"
                   id="import-yaml-check"
                   data-action="toggleYamlImport">
            Import from YAML file
          </label>
          <input type="file"
                 id="yaml-file-input"
                 accept=".yaml,.yml"
                 style="display: none;">
        </div>
      </form>
    </div>

    <div class="modal-footer">
      <button class="btn-secondary" data-action="closeCreateWorldModal">Cancel</button>
      <button class="btn-primary" data-action="createWorld">Create World</button>
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
- `input[type="checkbox"]` - YAML import toggle
- `input[type="file"]` - File picker (hidden until checkbox checked)

### Buttons
- `.btn-primary` - "Create World" button (western theme)
- `.btn-secondary` - "Cancel" button
- `.modal-close` - × close button in header

---

## Data Bindings

### Actions
- `data-action="closeCreateWorldModal"` - Close modal without creating
- `data-action="createWorld"` - Validate and create world
- `data-action="toggleYamlImport"` - Show/hide file picker

### Form Data
- `name` - World name (required, unique)
- `description` - World description (optional)
- YAML file (optional) - If provided, overrides default blank world

---

## Behavior

### Validation
1. **World name** - Required, must be non-empty, must be unique
2. **YAML file** - If provided, must be valid YAML format
3. Show inline error messages for validation failures

### Creation Process
1. Validate inputs
2. If YAML provided: parse and create world from YAML
3. If no YAML: create blank world with default starter content (single room)
4. Persist to MudStorage
5. Close modal
6. Notify WorldListView via success callback
7. WorldListView refreshes world list

### YAML Import
- Checkbox toggles file picker visibility
- Only `.yaml` or `.yml` files accepted
- Parse errors shown as inline validation messages

### Modal Controls
- Click overlay backdrop → close modal (no creation)
- Click × button → close modal (no creation)
- Click Cancel → close modal (no creation)
- Click Create World → validate and create
- ESC key → close modal (no creation)

---

## Template File

**Location:** `public/templates/create-world-modal.html`

---

## Traceability

**CRC Card:** crc-CreateWorldModal.md
**Sequence:** seq-create-world.md
**Future Implementation:** src/ui/CreateWorldModal.ts (to be created)
