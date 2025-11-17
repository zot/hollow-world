# Adventure Mode UI

**CRC Card:** crc-AdventureMode.md
**Source Spec:** game-worlds.md (lines 66-73)

---

## Purpose

AdventureMode is a coordinator that manages the transition between WorldListView and AdventureView. It does NOT contain UI elements itself - it only coordinates which view is displayed.

---

## Responsibilities

- Initialize and manage world list view
- Initialize and manage adventure view
- Handle navigation between the two views
- Integrate with Router for `/worlds` and `/world/:worldId` routes

---

## Views Managed

### WorldListView
- Route: `/worlds`
- Purpose: World management (list, create, edit, delete)
- See: [`world-list-view.md`](world-list-view.md)

### AdventureView
- Route: `/world/:worldId`
- Purpose: Adventure gameplay (text output, command input)
- See: [`ui-adventure-view.md`](ui-adventure-view.md)

---

## Routes

| Route | Handler | View Displayed |
|-------|---------|----------------|
| `/worlds` | `showWorldList()` | WorldListView |
| `/world/:worldId` | `showAdventure(worldId)` | AdventureView with specified world |
| `/world` | `showAdventure(defaultWorldId)` | AdventureView with default world |

---

## Implementation Notes

**Current Status:** AdventureMode class does NOT exist in current implementation

The current implementation violates Single Responsibility Principle:
- All functionality is embedded in `AdventureView` class
- World list management, adventure gameplay, and coordination all in one class
- This makes the class harder to test, maintain, and extend

**Refactoring Plan:**
1. Create `AdventureMode` class as coordinator
2. Extract world list functionality → `WorldListView` class
3. Slim down `AdventureView` to handle ONLY adventure gameplay
4. AdventureMode manages view transitions and router integration

---

## Traceability

**CRC Card:** crc-AdventureMode.md
**Sequences:**
- seq-start-adventure-mode.md
- seq-select-world.md
- seq-switch-to-world-list.md

**Future Implementation:** src/ui/AdventureMode.ts (to be created)
