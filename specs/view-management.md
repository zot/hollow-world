# View Management Architecture

**Centralized view visibility control for single-active-view pattern**

---

## Overview

The application uses a **single active view** pattern where only one view is visible at a time. This pattern provides:
- Clear visual state (no overlapping views)
- Predictable user experience
- Clean view lifecycle management
- Simplified state coordination

**Key Principle**: At any moment, exactly one view is visible to the user.

---

## Problem Statement

Multiple view containers without centralized coordination can lead to:
- Visual artifacts (multiple views visible simultaneously)
- Z-index conflicts and layout issues
- Inconsistent view lifecycle patterns
- Difficult-to-debug visibility bugs

**Solution**: ViewManager coordinates view visibility across the entire application.

---

## Architecture

### View Interface

**All views implement a common interface** with three core responsibilities:
1. **Container Access**: Provide reference to root DOM element
2. **Show**: Make the view visible
3. **Hide**: Make the view invisible (but preserve state)
4. **Cleanup** (optional): Dispose of resources when destroyed

### ViewManager Component

**Centralized coordinator** that manages application-wide view visibility.

**Responsibilities**:
- Maintain registry of all application views
- Track currently active view
- Coordinate view transitions (hide current, show next)
- Enforce single-active-view invariant

**Key Operations**:
- **Register**: Add view to registry
- **Show**: Switch to specified view (hides all others)
- **Get Active**: Query current active view
- **Hide All**: Clear all views (e.g., during shutdown)

### Integration Points

**Router Integration**:
- Route handlers trigger view switches via ViewManager
- ViewManager ensures only requested view is visible
- Previous view automatically hidden

**View Lifecycle**:
1. View created and initialized
2. View registered with ViewManager
3. ViewManager coordinates show/hide throughout app lifetime
4. View destroyed during cleanup

---

## Container Strategies

### Single Container Pattern

**Approach**: All views render into shared container (e.g., `#app`)

**Characteristics**:
- Views replace each other in DOM
- Simple lifecycle (render on show)
- Minimal memory footprint

**Best For**: Lightweight views (splash, settings, character lists)

### Multiple Container Pattern

**Approach**: Each view maintains its own persistent container

**Characteristics**:
- Views hidden/shown with CSS display property
- State preserved when hidden
- Fast view switching (no re-render)

**Best For**: Complex views with expensive state (adventure mode, active sessions)

### Hybrid Approach (Recommended)

Use appropriate strategy per view:
- **Simple views**: Single container (re-render on show)
- **Complex views**: Persistent containers (preserve state)

ViewManager abstracts the difference - views manage their own containers, ViewManager manages visibility.

---

## Coordinator Views

Some views act as **coordinators** managing multiple child views (e.g., AdventureMode managing WorldListView and AdventureView).

**Pattern**:
- Coordinator registered with ViewManager as single logical view
- Coordinator internally manages child view visibility
- ViewManager sees only top-level coordinator

**Benefits**:
- Clean abstraction layers
- Child view coordination encapsulated
- ViewManager doesn't need to know internal structure

---

## View Visibility Invariants

**Required Invariants**:
1. Exactly one view visible at any time (or none during transitions)
2. Hidden views preserve state unless explicitly destroyed
3. View transitions are atomic (no intermediate multi-view states)
4. Container cleanup responsibility belongs to view, not ViewManager

**ViewManager Guarantees**:
- Before showing view A, all other views are hidden
- Active view tracking always accurate
- View show/hide methods called in correct order

---

## Design Rationale

### Why Centralized Management?

**Without ViewManager**:
- Each view responsible for hiding others (tight coupling)
- Easy to miss a view (visibility bugs)
- Difficult to debug state (who's visible?)

**With ViewManager**:
- Single source of truth for visibility
- Views only manage themselves
- Easy to debug (query activeView)

### Why Common Interface?

**Consistent contract** enables:
- ViewManager works with any view
- Predictable behavior across all views
- Easy to add new views
- Testable visibility logic

### Why Not Destroy on Hide?

**Preserving hidden views** enables:
- Fast view switching
- State preservation (form inputs, scroll positions)
- Better user experience (no data loss)

Views destroyed only when:
- User explicitly closes/deletes
- Application shutting down
- View no longer needed

---

## Testing Requirements

### Functional Tests

**Verify**:
- Only one view visible at startup
- View transitions hide previous view
- Active view tracking accurate
- Hidden views preserve state
- Coordinator views manage children correctly

### Visual Tests

**Verify**:
- No overlapping views
- Clean transitions
- No z-index conflicts
- Proper cleanup on navigation

---

## Related Documentation

- **[`main.md`](main.md)** - Main project specification
- **[`ui.md`](ui.md)** - UI principles and patterns
- **[`game-worlds.md`](game-worlds.md)** - Adventure mode coordination
- **CRC Cards**: `design/crc-ViewManager.md`, `design/crc-IView.md`
- **Sequences**: View transition flows in `design/seq-*.md`
- **UI Specs**: View-specific implementations in `design/*.md`

---

*Note: This specification defines the architecture and requirements. Implementation details (method signatures, data structures, concrete patterns) are documented in CRC cards and UI specifications.*
