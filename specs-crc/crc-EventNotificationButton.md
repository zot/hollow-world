# EventNotificationButton

**Source Spec:** specs/friends.md, specs/ui.settings.md
**Existing Code:** src/ui/EventNotificationButton.ts
**Test Code:** (none - Phase 7)

## Responsibilities

### Knows
- `button: HTMLButtonElement | null` - Button element
- `badge: HTMLSpanElement | null` - Badge showing event count
- `eventService: EventService` - Event tracking service
- `onClickHandler: () => void` - Callback to show modal

### Does
- **Rendering:**
  - `render()` - Create and return fixed-position button with badge
  - `updateCount()` - Update badge with pending event count

- **Event Handling:**
  - Subscribe to eventService.onChange()
  - Handle button clicks (invoke onClickHandler)
  - Update badge when events change

- **Lifecycle:**
  - `destroy()` - Clean up event listeners

## Collaborators

- **EventService** (src/services/EventService.ts) - Event tracking
- **EventModal** (src/ui/EventModal.ts) - Shows event details

## Code Review Notes

### ✅ Working well
- **Fixed positioning**: Top-right (below audio control)
- **Real-time updates**: Badge updates via onChange callback
- **Bugle icon**: 📯 emoji for western theme
- **Visual feedback**: Badge shows pending event count
- **Hover effects**: Button highlights on hover
- **SOLID principles**:
  - Single Responsibility: Event notification UI only
  - Dependency Injection: EventService and callback injected
  - Observer Pattern: Listens to EventService changes

### ✅ Matches spec perfectly
- Fixed position (top-right, z-index 1000)
- Bugle icon for western theme
- Badge shows pending event count
- Opens modal on click
- Real-time updates via EventService

### 📝 Implementation details
- **Position**: Fixed at top: 140px, right: 20px
- **Z-index**: 1000 (above content, below modal)
- **Icon**: 📯 (bugle emoji)
- **Badge**: Shows count when > 0
- **Styling**: Brown/saddle brown western theme
- **Updates**: Via EventService.onChange() callback

## Sequences

- (No specific sequences - simple UI component)

## Related CRC Cards

- crc-EventModal.md - Event details modal
- crc-HollowPeer.md - P2P system with EventService

## Design Patterns

**Observer Pattern**: Listens to EventService for updates
**Callback Pattern**: Invokes onClickHandler to show modal
**Badge Pattern**: Visual indicator for pending events

## Key Design Decisions

1. **Fixed Positioning**: Always visible top-right
2. **Observer Pattern**: Automatic updates via EventService.onChange()
3. **Badge Visibility**: Only shows badge when count > 0
4. **Click Handler**: Opens modal (injected as callback)
5. **Western Theme**: Bugle icon and brown styling
6. **Z-index**: 1000 (visible but not blocking)
