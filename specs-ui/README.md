# UI Layout Specifications for HollowWorld

**Terse, implementation-focused layout specifications for HollowWorld components and views**

---

## Overview

This directory contains **layout-only** specifications that define the HTML structure, CSS classes, and data bindings for HollowWorld UI components. These specs are **terse and easy to interpret** - they capture WHAT the user sees (structure), not HOW it behaves (logic).

**Status**: ✅ **Active - Layout specifications for all major views**

**Format**: Structured markdown - terse lists and code examples, minimal prose

**Key Principle**: **specs-ui captures LAYOUT. CRC cards capture BEHAVIOR.**

---

## Purpose

### What UI Specs Define (YES)

specs-ui files are **layout references only**:

- ✅ **Component hierarchy**: Parent-child relationships
- ✅ **HTML structure**: Tags, classes, semantic markup
- ✅ **Data bindings**: Template variable names (`{{friend.playerName}}`)
- ✅ **Event handler names**: What gets called (`data-action="clickButton"`)
- ✅ **Layout patterns**: Grid, flex, positioning
- ✅ **CSS class naming**: Consistent naming conventions
- ✅ **Visual states**: Collapsed/expanded, visible/hidden

### What UI Specs Don't Define (NO)

These are defined elsewhere:

- ❌ **Behavior implementation** → CRC cards (`specs-crc/crc-*.md`)
- ❌ **Object interactions** → Sequence diagrams (`specs-crc/seq-*.md`)
- ❌ **Visual styling** → CSS files (`src/styles/*.css`)
- ❌ **Business logic** → TypeScript implementation + CRC cards
- ❌ **Data flow** → Sequence diagrams

### Keep It Terse

**Goal**: Easy-to-scan layout reference for developers

**Prefer**: Simple ASCII art for visual layout, terse lists, code examples

**Good (terse with ASCII art)**:
```markdown
## FriendCard Component

**Layout**:
┌─────────────────────────┐
│ Name        [+]         │  ← Header (always visible)
├─────────────────────────┤
│ Peer ID: abc123...      │  ← Details (when expanded)
│ Notes: [___________]    │
│ [Remove]                │
└─────────────────────────┘

**Data**: `friend: IFriend` (see `crc-Friend.md`)

**Events**: See `crc-FriendsView.md`
```

**Bad (verbose)**:
```markdown
## FriendCard Component

The FriendCard component is designed to display information about a single friend
in the friends list. It provides a user-friendly interface for viewing and managing
friend data. When a user first sees the card, it shows a collapsed view...
```

---

## Relationship to Other Specs

### Three-Tier System

```
specs/*.md                      # Human-readable design docs
  (What users see)
  "Friend cards with expand/collapse, editable notes..."
     ↓
     ├─────────────────────┬────────────────────────┐
     │                     │                        │
     ▼                     ▼                        ▼
specs-ui/ui-*.md      specs-crc/crc-*.md     specs-crc/seq-*.md
  (LAYOUT)              (BEHAVIOR)             (INTERACTIONS)
  HTML structure        Classes                Object sequences
  CSS classes           Responsibilities       Method calls
  Data bindings         Methods                Data flow
  Event names           Collaborators          Scenarios
     │                     │                        │
     └─────────────────────┴────────────────────────┘
                           │
                           ▼
              Implementation artifacts
              - public/templates/*.html (from specs-ui)
              - src/**/*.ts (from CRC cards)
              - tests/**/*.test.ts (from sequence diagrams)
```

### Layout (specs-ui) References Behavior (CRC cards)

**Layout files reference CRC cards for data and behavior**:
```markdown
# specs-ui/ui-friends-view.md

## Data

**From CRC cards** (see `crc-Friend.md`, `crc-FriendsManager.md`):
- `friends: IFriend[]` - Friend list
- `bannedPeers: IBannedPeer[]` - Banned peer list

## Events

**Behavior Implementation**: See `crc-FriendsView.md`

- `showAddFriendDialog()` - Implemented by FriendsView class
  - **Flow**: See `seq-add-friend-by-peerid.md`
```

**CRC cards define the actual behavior**:
```markdown
# specs-crc/crc-FriendsView.md

## Does (Responsibilities)

### showAddFriendDialog()
Displays modal dialog for adding a friend by peer ID.

**Collaborators**: TemplateEngine (render dialog), FriendsManager (validate)
```

**Implementation bridges both**:
```typescript
// Behavior from CRC card (crc-FriendsView.md)
import { FriendsView } from './ui/FriendsView'
import { IFriend } from './p2p/types'  // Interface from crc-Friend.md

// Layout from specs-ui (ui-friends-view.md)
import { templateEngine } from './utils/TemplateEngine'

const html = await templateEngine.renderTemplateFromFile('friends-view', {
  friends: friendsList
})
```

---

## Key Principle: Layout vs Behavior Separation

**specs-ui captures WHAT the user sees (layout)**:
- HTML elements and their arrangement
- CSS classes for styling hooks
- Template variable names

**CRC cards capture WHAT the code does (behavior)**:
- Method signatures
- Responsibilities
- Collaborations between classes

**Sequence diagrams capture HOW objects interact (flow)**:
- Method call sequences
- Data passing between objects
- Error handling flows

**All three work together** to fully specify a feature, but each has a distinct, focused purpose.

---

## Directory Structure

```
specs-ui/
├── README.md                     # This file
├── MIGRATION-PLAN.md             # Migration from WYSIWID to CRC references
├── manifest.md                   # Master UI spec (routes, view hierarchy, global components)
├── ui-splash-view.md             # SplashView layout specification
├── ui-characters-view.md         # CharactersView layout specification
├── ui-character-editor-view.md   # CharacterEditorView layout specification
├── ui-friends-view.md            # FriendsView + components (FriendCard, etc.)
└── ui-settings-view.md           # SettingsView + dialogs (ProfilePicker, LogView, etc.)
```

**Organization**: One file per view for clarity
- **Token efficiency**: Only load relevant view file when working on a specific view
- **Clear separation**: Each view's layout is self-contained
- **Global coordination**: View relationships and global components defined in `manifest.md`

---

## UI Spec Format

**Approach**: Extract and organize layout-relevant content from human specs (`specs/ui.*.md`) into terse, structured markdown.

**Why markdown (not YAML)?**
- Readable by both humans and LLMs
- Easy to maintain and update
- Supports code examples and formatted text
- Focus on **clarity** and **terseness**, not ceremony

**Key principles**:
1. Extract layout structure from human specs
2. Add source references for traceability (`Source: specs/ui.friends.md`)
3. Reference CRC cards for data types and behavior
4. Keep it terse and scannable

---

## UI Spec Format Examples

### Master Manifest

**File**: `specs-ui/manifest.md`

Defines global UI concerns:

```markdown
## Routes

**Source**: `specs/routes.md`

| Route           | View                | Description           |
|-----------------|---------------------|-----------------------|
| /               | SplashView          | Main menu             |
| /characters     | CharactersView      | Character manager     |
| /characters/:id | CharacterEditorView | Character editor      |
| /friends        | FriendsView         | Friends list          |
| /settings       | SettingsView        | Settings and profiles |
| /adventure      | AdventureView       | TextCraft MUD mode    |

## View Hierarchy

```
SplashView
  → CharactersView
      → CharacterEditorView
  → FriendsView
  → SettingsView
  → AdventureView
```

## Global Components

- GlobalAudioControl (present on all views)
- EventNotificationButton (present on all views)
```

### View/Component Specifications

**Files**: One file per view (`specs-ui/ui-*-view.md`)

Each view specification is self-contained (similar to how WYSIWID concepts are independent).

**Example**: `specs-ui/ui-friends-view.md` (extracted from `specs/ui.friends.md`)

```markdown
# FriendsView

**Source**: `specs/ui.friends.md`

## FriendCard Component

**Source**: `specs/ui.friends.md` → Friend Card section

**Purpose**: Display a single friend in the friends list

**Data**: `friend: IFriend` (see `crc-Friend.md`)

**Layout**:
┌─────────────────────────────────┐
│ Alice Johnson           [+]     │  ← Collapsed state
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Bob Smith                [-]    │  ← Expanded state
├─────────────────────────────────┤
│ Peer ID: 12abc3def...           │
│ Notes: [___________________]    │
│                    [Remove]     │
└─────────────────────────────────┘

**States**:
- Default: Collapsed (details hidden)
- Expanded: Details visible
- Pending: Yellow border when `friend.status === 'pending'`

**Events** (see `crc-FriendsView.md` for implementation):
- `toggleExpand()` - Expand/collapse details
- `removeFriend()` - Remove friend (with confirmation)

**CSS Classes**:
- `friend-card` - Card container (flex column)
- `friend-header` - Header row (flex row, space-between)
- `friend-details` - Details section (conditional visibility)
- `peer-id` - Monospace text for peer ID
```

**Note**: Terse structured markdown. Focus on layout structure, reference CRC cards for behavior.

---

**Example**: Full page layout in `specs-ui/ui-friends-view.md`

```markdown
# FriendsView

**Source**: `specs/ui.friends.md`
**Route**: `/friends` (see `manifest.md`)

**Purpose**: Display and manage P2P friends list

**Data** (see `crc-Friend.md`, `crc-FriendsManager.md`):
- `friends: IFriend[]` - Friend list
- `searchQuery: string` (local UI state)

**Layout**:
┌─────────────────────────────────────────┐
│ Friends                  [Add Friend]   │  ← Header
├─────────────────────────────────────────┤
│ Search: [_______________________]       │  ← Search bar
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Alice Johnson            [+]        │ │  ← FriendCard (collapsed)
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Bob Smith                 [-]       │ │  ← FriendCard (expanded)
│ ├─────────────────────────────────────┤ │
│ │ Peer ID: 12abc3def...               │ │
│ │ Notes: [________________________]   │ │
│ │                         [Remove]    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│           [🔊] [🔔3]                    │  ← Global components
└─────────────────────────────────────────┘

**Events** (see `crc-FriendsView.md`):
- `showAddFriendDialog()` - Open add friend dialog
- `filterFriends(query)` - Filter friends list by search query

**CSS Classes**:
- `friends-view` - Main container
- `friends-header` - Header with title and button
- `friends-search` - Search bar container
- `friends-list` - List of friend cards
- `empty-state` - Shown when no friends
```

---

## Design Principles

### 1. Separation of Concerns

**Layout (specs-ui)** ≠ **Style (CSS)** ≠ **Behavior (CRC cards/TypeScript)**

```markdown
# specs-ui/ui-button-component.md
## Structure
- `<button>` element
- CSS class: `primary-btn`
- Data binding: `{{label}}`
- Event: `data-action="handleClick"`

**Behavior**: See `crc-ButtonComponent.md`
```

```css
/* src/styles/buttons.css */
.primary-btn {
  /* All styling here */
  background: var(--color-primary);
  padding: 0.5rem 1rem;
}
```

```typescript
// src/components/Button.ts
// @crc crc-ButtonComponent.md
class Button {
  // @crc crc-ButtonComponent.md:handleClick
  handleClick(): void {
    /* Behavior from CRC card */
  }
}
```

### 2. Data Binding Clarity

Always reference CRC cards for data types:

```markdown
# ✅ GOOD: Clear CRC reference
**Data**: `character: ICharacter` (see `crc-Character.md`)

# ❌ BAD: Ambiguous type
**Data**: `character: object`
```

### 3. Component Composition

Favor composition over duplication:

```markdown
# specs-ui/ui-friends-view.md

## Friends List

**Layout**:
┌─────────────────────────────┐
│ ┌─────────────────────────┐ │  ← FriendCard component
│ │ Alice Johnson    [+]    │ │     (rendered for each friend)
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Bob Smith        [+]    │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘

**Composition**:
- For each friend in `friends`:
  - Render FriendCard component (see friends-view.md → FriendCard)
  - Pass `friend` data to component
```

### 4. Event Naming

Use descriptive, action-oriented names:

```markdown
# ✅ GOOD
**Events** (see `crc-FriendsView.md`):
- `submitAddFriend()` - Add friend with validation
- `cancelEdit()` - Discard changes
- `confirmDelete()` - Delete with confirmation

# ❌ BAD
**Events**:
- `onClick()` - Vague, unclear purpose
- `handleSubmit()` - Generic, not descriptive
- `doThing()` - Meaningless name
```

### 5. Label-Value Layout

Labels should precede their values on the same line (inline), not above:

```markdown
# ✅ GOOD: Inline label-value
<span class="damage-capacity">Damage Capacity: {{damageCapacity}}</span>
<div class="stat-group">
  <label>Rank</label>
  <input type="number" value="{{rank}}">
</div>

# ❌ BAD: Label above value
<div class="stat-group">
  <label>Damage Capacity</label>
  <span>{{damageCapacity}}</span>
</div>
```

**Rationale**: Inline labels create more compact, scannable displays. Exception: Form inputs with `<label>` elements may use vertical layout for accessibility when appropriate.

### 6. Visual Layout with ASCII Art

Prefer simple ASCII art to show component hierarchy and spatial relationships:

```markdown
# ✅ GOOD: ASCII art visualization
## FriendsView Layout

┌─────────────────────────────────┐
│ Header: "Friends" [Add Friend]  │
├─────────────────────────────────┤
│ [Search: ___________________]   │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Friend Card (collapsed)     │ │
│ │ Name: Alice        [+]      │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Friend Card (expanded)      │ │
│ │ Name: Bob          [-]      │ │
│ │ Peer ID: 12abc...           │ │
│ │ Notes: [___________]        │ │
│ │ [Remove]                    │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘

# ❌ BAD: Only text description
The view has a header with title and button, then a search bar,
then friend cards that can be expanded or collapsed...
```

**Rationale**: ASCII art provides instant visual understanding of layout structure and spatial relationships. Keep it simple - boxes, lines, and basic hierarchy are enough.

---

## Migration from Current Templates

### Current State

Templates are hand-written in `public/templates/`:
- Mix of structure and presentation
- Inconsistent naming
- No formal specification
- Manual synchronization with TypeScript

### Target State

Templates generated from `specs-ui/`:
- Structure defined formally
- Consistent patterns
- Automated generation
- Clear contract with TypeScript

### Migration Process

1. **Document existing templates** as UI specs
2. **Validate specs** against current implementation
3. **Generate templates** from specs
4. **Compare** generated vs hand-written
5. **Refine specs** based on differences
6. **Switch** to generated templates

---

## Current State & Next Steps

### Status

- ✅ Directory created (`specs-ui/`)
- ✅ README documentation updated (WYSIWID → CRC migration)
- ✅ Layout specifications for all major views
- ✅ Format defined (terse structured markdown)
- 🚧 Migration of individual files from WYSIWID to CRC references (see MIGRATION-PLAN.md)

### Immediate Next Steps

1. **Execute migration** - Update individual view files per MIGRATION-PLAN.md
2. **Remove WYSIWID references** - Replace with CRC card references
3. **Validate terseness** - Ensure files remain scannable and implementation-focused
4. **Update manifest.md** - Remove WYSIWID references from global spec

### Future Work

- Consider template generation tooling (low priority)
- Add more inline examples as patterns emerge
- Document common layout patterns across views

---

## Relationship to Human-Readable Specs

### specs/ui.*.md (Human-Readable)

Focus on **what users see and experience**:

```markdown
## Friend Card

Each friend appears as a card with:
- **Name** in large, bold text at top
- **Peer ID** in small monospace font
- **Expand button** (+ icon) to show details
- **Remove button** in expanded state

Visual design:
- Cards have subtle shadow
- Pending friends shown with yellow border
- Offline friends appear grayed out
```

### specs-ui/*.md (Layout)

Focus on **how it's structured** (terse, scannable with ASCII art):

```markdown
# specs-ui/ui-friends-view.md

## FriendCard Component

**Data**: `friend: IFriend` (see `crc-Friend.md`)

**Layout**:
┌─────────────────────────────┐
│ Alice Johnson       [+]     │  ← friend-header
├─────────────────────────────┤
│ Peer ID: 12abc3def...       │  ← friend-details (when expanded)
│ Notes: [________________]   │
│                  [Remove]   │
└─────────────────────────────┘

**Events** (see `crc-FriendsView.md`):
- `toggleExpand()`
- `removeFriend()`

**CSS Classes**:
- `friend-card`, `friend-header`, `friend-details`
```

### specs-crc/crc-*.md (Behavior)

Focus on **what it does**:

```markdown
# specs-crc/crc-FriendsView.md

## Does (Responsibilities)

### toggleExpand(peerId: string)
Toggles expanded state for a friend card.

**Collaborators**: None (local state only)

### removeFriend(peerId: string)
Removes friend from list with confirmation.

**Collaborators**: FriendsManager (delete friend)
```

**All three are maintained** - they serve different purposes:
- Human specs (`specs/ui.*.md`): Design intent, user experience, visual design
- Layout specs (`specs-ui/*.md`): HTML structure, CSS classes, data bindings
- Behavior specs (`specs-crc/*.md`): Classes, methods, responsibilities, collaborations

---

## Related Documentation

- **[`traceability-templates.md`](traceability-templates.md)** - Template traceability rules and checklist
- **[`MIGRATION-PLAN.md`](MIGRATION-PLAN.md)** - Migration from WYSIWID to CRC references
- **[`specs-crc/README.md`](../specs-crc/README.md)** - CRC modeling process and traceability
- **[`specs-crc/traceability.md`](../specs-crc/traceability.md)** - Master traceability map
- **[`specs/ui.md`](../specs/ui.md)** - General UI principles and western theme
- **[`specs/coding-standards.md`](../specs/coding-standards.md)** - TypeScript and HTML standards
- **[`CLAUDE.md`](../CLAUDE.md)** - Development guidelines

---

*Last updated: 2025-11-11*
