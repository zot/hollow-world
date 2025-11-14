
# UI Template Traceability Rules

**Purpose**: Link HTML templates in `public/templates/` to their layout specifications in `design/`

**Phase**: Phase 8 - UI Template Traceability

---

## Comment Format

### Header Comment (Required)

Every HTML template MUST have a header comment at the top of the file:

```html
<!-- @layout ui-view-name.md -->
<!-- @spec specs/ui.view.md -->
```

**Tags**:
- `@layout` - Reference to layout spec in `design/` (REQUIRED)
- `@spec` - Reference to human-readable spec in `specs/` (OPTIONAL but recommended)

**Placement**: First lines of the file (before `<!DOCTYPE>` or any other content)

### Component/Section Comments (Optional)

For complex templates with multiple sections, add comments for major sections:

```html
<!-- @layout ui-view-name.md → Section Name -->
<div class="section-name">
  ...
</div>
```

---

## Examples

### Main View Template

**File**: `public/templates/splash-screen.html`

```html
<!-- @layout ui-splash-view.md -->
<!-- @spec specs/ui.splash.md -->
<!DOCTYPE html>
<html>
  <body>
    <div class="splash-container">
      <!-- @layout ui-splash-view.md → Title Section -->
      <h1 class="splash-title">
        Don't Go <span class="hollow-glow">Hollow</span>
      </h1>

      <!-- @layout ui-splash-view.md → Peer ID Display -->
      <div class="peer-id-display">
        <button class="peer-id-value" data-action="copyPeerId">
          {{peerId}}
        </button>
      </div>

      <!-- ... rest of template ... -->
    </div>
  </body>
</html>
```

### Component Template

**File**: `public/templates/character-card.html`

```html
<!-- @layout ui-characters-view.md → CharacterCard Component -->
<!-- @spec specs/ui.characters.md -->
<div class="character-card" data-character-id="{{character.id}}">
  <div class="character-card-header">
    <h3>{{character.name}}</h3>
    <span class="character-rank">Rank {{character.rank}}</span>
  </div>
  <!-- ... rest of card ... -->
</div>
```

### Partial/Fragment Template

**File**: `public/templates/attribute-box.html`

```html
<!-- @layout ui-character-editor-view.md → Attribute Box -->
<!-- @spec specs/ui.characters.md -->
<div class="attribute-box">
  <label>{{attributeName}}</label>
  <span class="attribute-value">{{value}}</span>
  <button data-action="incrementAttribute">+</button>
  <button data-action="decrementAttribute">−</button>
</div>
```

### Fallback/Error Template

**File**: `public/templates/character-editor-fallback.html`

```html
<!-- @layout ui-character-editor-view.md → Error Fallback -->
<!-- @spec specs/ui.characters.md -->
<div class="error-fallback">
  <p>Failed to load character editor. Please try again.</p>
  <button onclick="location.reload()">Reload</button>
</div>
```

---

## Mapping Rules

### Main View Templates

Link to the corresponding view spec:

| Template | Layout Spec | Human Spec |
|----------|-------------|------------|
| `splash-screen.html` | `ui-splash-view.md` | `specs/ui.splash.md` |
| `character-list.html` | `ui-characters-view.md` | `specs/ui.characters.md` |
| `character-editor.html` | `ui-character-editor-view.md` | `specs/ui.characters.md` |
| `friends-view.html` | `ui-friends-view.md` | `specs/ui.friends.md` |
| `settings-view.html` | `ui-settings-view.md` | `specs/ui.settings.md` |
| `log-view.html` | `ui-settings-view.md → LogView` | `specs/ui.settings.md` |

### Component Templates

Link to the component section within a view spec:

| Template | Layout Spec | Section |
|----------|-------------|---------|
| `character-card.html` | `ui-characters-view.md` | CharacterCard Component |
| `attribute-box.html` | `ui-character-editor-view.md` | Attribute Box |
| `skill-item.html` | `ui-character-editor-view.md` | Skills Section |
| `event-modal.html` | `design/manifest-ui.md` | EventNotificationButton + EventModal |
| `global-audio-control.html` | `design/manifest-ui.md` | GlobalAudioControl |

### Shared/Utility Templates

Link to the most relevant spec or manifest:

| Template | Layout Spec | Notes |
|----------|-------------|-------|
| `empty-state.html` | `design/manifest-ui.md` | Shared across views |
| `error-fallback.html` | `design/manifest-ui.md` | Global error template |
| `error-notification.html` | `design/manifest-ui.md` | Global notification |
| `validation-warning.html` | `ui-character-editor-view.md` | Character validation |

### Fallback Templates

Fallback templates follow same rules as their main counterparts:

| Template | Layout Spec | Notes |
|----------|-------------|-------|
| `splash-fallback.html` | `ui-splash-view.md` | Fallback for splash |
| `character-editor-fallback.html` | `ui-character-editor-view.md` | Fallback for editor |
| `friends-fallback.html` | `ui-friends-view.md` | Fallback for friends |

---

## Reference Syntax

### Basic Reference

```html
<!-- @layout ui-view-name.md -->
```

### Section Reference

```html
<!-- @layout ui-view-name.md → Section Name -->
```

### Component Reference

```html
<!-- @layout ui-view-name.md → ComponentName Component -->
```

### Multiple Sources

If a template combines multiple specs (rare), list all:

```html
<!-- @layout ui-view-1.md → Section A -->
<!-- @layout ui-view-2.md → Section B -->
<!-- @spec specs/ui.combined.md -->
```

---

## Verification

### Grep Pattern

All templates should be greppable:

```bash
# Find all templates with layout references
grep -r "@layout" public/templates/

# Find templates without layout references
find public/templates -name "*.html" -exec grep -L "@layout" {} \;

# Count templates with traceability
grep -r "@layout" public/templates/*.html | wc -l
```

### Validation Script

Check that all referenced specs exist:

```bash
# Extract layout references and verify files exist
grep -rh "@layout" public/templates/ | \
  sed 's/.*@layout \(design\/[^ ]*\).*/\1/' | \
  sort -u | \
  while read spec; do
    if [ ! -f "$spec" ]; then
      echo "Missing: $spec"
    fi
  done
```

---

## Best Practices

### DO

✅ **Add header comment to every template**
```html
<!-- @layout ui-view-name.md -->
```

✅ **Reference the section for component templates**
```html
<!-- @layout ui-view-name.md → ComponentName -->
```

✅ **Use arrow notation for sections**
```html
<!-- @layout ui-view-name.md → Section Name -->
```

✅ **Keep references terse and accurate**
```html
<!-- @layout ui-splash-view.md -->
<!-- @spec specs/ui.splash.md -->
```

### DON'T

❌ **Don't skip header comments**
```html
<!-- Missing @layout comment! -->
<div class="character-card">...</div>
```

❌ **Don't use relative paths**
```html
<!-- @layout ../ui-view.md -->  <!-- WRONG -->
<!-- @layout ui-view.md -->     <!-- CORRECT -->
```

❌ **Don't add excessive comments throughout template**
```html
<!-- @layout everywhere -->  <!-- Too verbose! -->
```

❌ **Don't reference non-existent specs**
```html
<!-- @layout ui-nonexistent.md -->  <!-- Verify file exists! -->
```

---

## Phase 8 Checklist

### Template Traceability
- [ ] All main view templates have `@layout` comments
- [ ] All component templates have `@layout` comments with section references
- [ ] All fallback templates have `@layout` comments
- [ ] All utility/shared templates have `@layout` comments

### Verification
- [ ] Can grep `@layout` and find all templates
- [ ] All referenced `ui-*.md` files exist
- [ ] All referenced `specs/*.md` files exist
- [ ] No templates missing header comments

### Documentation
- [ ] Phase 8 section added to `traceability.md`
- [ ] Template mapping table complete
- [ ] Examples provided for all template types

---

## Template Checklist

### Main View Templates (6 total)

- [x] `splash-screen.html` → `ui-splash-view.md`
- [x] `character-list.html` → `ui-characters-view.md`
- [x] `character-editor.html` → `ui-character-editor-view.md`
- [x] `friends-view.html` → `ui-friends-view.md`
- [x] `settings-view.html` → `ui-settings-view.md`
- [x] `log-view.html` → `ui-settings-view.md` (LogView section)

### Fallback Templates (7 total)

- [x] `splash-fallback.html` → `ui-splash-view.md`
- [x] `splash-minimal.html` → `ui-splash-view.md`
- [x] `character-list-fallback.html` → `ui-characters-view.md`
- [x] `character-editor-fallback.html` → `ui-character-editor-view.md`
- [x] `friends-fallback.html` → `ui-friends-view.md`
- [x] `settings-view-fallback.html` → `ui-settings-view.md`
- [x] `game-view-fallback.html` → (future/deprecated)

### Character Sheet Components (16 total)

- [x] `character-sheet.html` → `ui-character-editor-view.md`
- [x] `character-card.html` → `ui-characters-view.md` (CharacterCard)
- [x] `character-card-fallback.html` → `ui-characters-view.md` (CharacterCard)
- [x] `character-header.html` → `ui-character-editor-view.md` (Header)
- [x] `character-header-section.html` → `ui-character-editor-view.md` (Header)
- [x] `character-attributes.html` → `ui-character-editor-view.md` (Attributes)
- [x] `attribute-box.html` → `ui-character-editor-view.md` (Attribute Box)
- [x] `attribute-category-row.html` → `ui-character-editor-view.md` (Attributes)
- [x] `attributes-section.html` → `ui-character-editor-view.md` (Attributes)
- [x] `skills-section.html` → `ui-character-editor-view.md` (Skills)
- [x] `skills-fields-section.html` → `ui-character-editor-view.md` (Skills & Fields)
- [x] `skill-item.html` → `ui-character-editor-view.md` (Skill Item)
- [x] `field-item.html` → `ui-character-editor-view.md` (Field Item)
- [x] `hollow-tracker.html` → `ui-character-editor-view.md` (Hollow Tracker)
- [x] `hollow-tracker-section.html` → `ui-character-editor-view.md` (Hollow Tracker)
- [x] `item-level-span.html` → `ui-character-editor-view.md` (Level Display)

### Character Equipment & Benefits (6 total)

- [x] `benefits-drawbacks-section.html` → `ui-character-editor-view.md` (Benefits/Drawbacks)
- [x] `benefit-item.html` → `ui-character-editor-view.md` (Benefit Item)
- [x] `drawback-item.html` → `ui-character-editor-view.md` (Drawback Item)
- [x] `equipment-section.html` → `ui-character-editor-view.md` (Equipment)
- [x] `item-entry.html` → `ui-character-editor-view.md` (Item Entry)
- [x] `companion-entry.html` → `ui-character-editor-view.md` (Companion Entry)

### Audio Control Templates (5 total)

- [x] `audio-control.html` → `manifest-ui.md` (GlobalAudioControl)
- [x] `enhanced-audio-control.html` → `manifest-ui.md` (GlobalAudioControl)
- [x] `global-audio-control.html` → `manifest-ui.md` (GlobalAudioControl)
- [x] `global-audio-control-unavailable.html` → `manifest-ui.md` (GlobalAudioControl)
- [x] `music-button-fallback.html` → `manifest-ui.md` (GlobalAudioControl)

### Event & Notification Templates (8 total)

- [x] `event-notification-button.html` → `manifest-ui.md` (EventNotificationButton)
- [x] `event-modal.html` → `manifest-ui.md` (EventModal)
- [x] `event-card-friend-request.html` → `manifest-ui.md` (EventModal - Friend Request)
- [x] `event-card-friend-accepted.html` → `manifest-ui.md` (EventModal - Friend Accepted)
- [x] `event-card-friend-approved.html` → `manifest-ui.md` (EventModal - Friend Approved)
- [x] `event-card-friend-declined.html` → `manifest-ui.md` (EventModal - Friend Declined)
- [x] `error-notification.html` → `manifest-ui.md` (Global Notification)
- [x] `validation-warning.html` → `ui-character-editor-view.md` (Validation)

### Friends View Components (4 total)

- [x] `pending-invitation-item.html` → `ui-friends-view.md` (Friend Card - Pending)
- [x] `ignored-peer-item.html` → `ui-friends-view.md` (Banned Peers)
- [x] `no-pending-invitations.html` → `ui-friends-view.md` (Empty State)
- [x] `no-ignored-peers.html` → `ui-friends-view.md` (Empty State)

### Settings & Profile Templates (3 total)

- [x] `profile-picker.html` → `ui-settings-view.md` (ProfilePickerDialog)
- [x] `credits-popup.html` → `ui-splash-view.md` (Credits Dialog)
- [x] `credits-popup-fallback.html` → `ui-splash-view.md` (Credits Dialog)

### Error & Utility Templates (10 total)

- [x] `error-fallback.html` → `manifest-ui.md` (Global Error)
- [x] `error-content.html` → `manifest-ui.md` (Error Content)
- [x] `main-error-container.html` → `manifest-ui.md` (Main Error Container)
- [x] `character-render-error.html` → `ui-character-editor-view.md` (Render Error)
- [x] `character-editor-no-character-error.html` → `ui-character-editor-view.md` (No Character)
- [x] `character-manager-error.html` → `ui-characters-view.md` (Manager Error)
- [x] `character-manager-templates-error.html` → `ui-characters-view.md` (Templates Error)
- [x] `editor-load-error.html` → `ui-character-editor-view.md` (Load Error)
- [x] `splash-interface-error.html` → `ui-splash-view.md` (Interface Error)
- [x] `no-character-fallback.html` → `ui-character-editor-view.md` (No Character)

### Utility Templates (3 total)

- [x] `empty-state.html` → `manifest-ui.md` (Shared Empty State)
- [x] `load-more-button.html` → `manifest-ui.md` (Pagination)
- [x] `game-view.html` → (future/deprecated)

---

## Progress Summary

**Total Templates**: 71

**By Category**:
- Main Views: 6/6 (100%) ✅
- Fallbacks: 7/7 (100%) ✅
- Character Sheet: 16/16 (100%) ✅
- Equipment/Benefits: 6/6 (100%) ✅
- Audio Controls: 5/5 (100%) ✅
- Events/Notifications: 8/8 (100%) ✅
- Friends Components: 4/4 (100%) ✅
- Settings/Profile: 3/3 (100%) ✅
- Errors/Utility: 10/10 (100%) ✅
- General Utility: 3/3 (100%) ✅

**Overall Progress**: 71/71 (100%) ✅

---

## Related Documentation

- **[`design/README.md`](../design/README.md)** - CRC modeling process
- **[`design/traceability-guide.md`](../design/traceability-guide.md)** - Traceability for TypeScript code
- **[`design/traceability.md`](../design/traceability.md)** - Master traceability map
- **[`design/README.md`](README.md)** - Layout spec overview
- **[`design/MIGRATION-PLAN.md`](MIGRATION-PLAN.md)** - WYSIWID to CRC migration

---

*Created: 2025-11-11 - Phase 8: UI Template Traceability*
