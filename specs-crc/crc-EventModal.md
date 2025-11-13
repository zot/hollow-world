# EventModal

**Source Spec:** specs/friends.md, specs/ui.settings.md
**Existing Code:** src/ui/EventModal.ts
**Test Code:** (none - Phase 7)

## Responsibilities

### Knows
- `modal: HTMLDivElement | null` - Modal dialog element
- `eventService: EventService` - Event tracking service
- `hollowPeer: HollowPeer | undefined` - P2P system for actions

### Does
- **Rendering:**
  - `render()` - Create and return modal dialog
  - `updateEventList()` - Update displayed events
  - `renderEventCard(event)` - Render individual event card

- **Modal Control:**
  - `show()` - Display modal
  - `hide()` - Hide modal

- **Event Actions:**
  - Handle "Accept" button for friend requests
  - Handle "Decline" button for friend requests
  - Handle "Dismiss" button for notifications
  - Update event status after actions

- **Lifecycle:**
  - `destroy()` - Clean up event listeners

## Collaborators

- **EventService** (src/services/EventService.ts) - Event tracking and persistence
- **HollowPeer** (src/p2p/HollowPeer.ts) - P2P operations (accept/decline friend)
- **TemplateEngine** (src/utils/TemplateEngine.ts) - Template rendering

## Code Review Notes

### ✅ Working well
- **Modal overlay**: Full-screen with z-index for proper layering
- **Real-time updates**: Updates via EventService.onChange()
- **Action buttons**: Accept, Decline, Dismiss for each event type
- **Event types**: Handles friendRequest, friendAccepted, friendDeclined
- **Close on overlay**: Clicking outside modal closes it
- **SOLID principles**:
  - Single Responsibility: Event modal UI only
  - Dependency Injection: EventService and HollowPeer injected
  - Observer Pattern**: Listens to EventService changes

### ✅ Matches spec perfectly
- Shows event cards as specified
- Action buttons for friend requests
- Dismiss button for notifications
- Real-time updates
- Modal overlay pattern

### 📝 Implementation details
- **Template**: event-modal.html
- **Z-index**: Higher than EventNotificationButton
- **Event types**:
  - friendRequest: Accept/Decline buttons
  - friendAccepted: Dismiss button
  - friendDeclined: Dismiss button
- **Actions**: Via HollowPeer (acceptFriend, declineFriend)
- **Updates**: Via EventService.onChange() callback

## Sequences

- seq-friend-status-change.md (already exists from Phase 4)
- seq-add-friend-by-peerid.md (already exists from Phase 4)

## Related CRC Cards

- crc-EventNotificationButton.md - Event notification button
- crc-HollowPeer.md - P2P system (Phase 4)
- crc-FriendsManager.md - Friend data management (Phase 4)

## Design Patterns

**Modal Dialog Pattern**: Overlay with content and close button
**Observer Pattern**: Listens to EventService for updates
**Command Pattern**: Action buttons execute P2P commands
**Template View**: Uses TemplateEngine for rendering

## Key Design Decisions

1. **Modal Overlay**: Full-screen with backdrop
2. **Observer Pattern**: Automatic updates via EventService.onChange()
3. **Action Buttons**: Event-type-specific actions (Accept/Decline/Dismiss)
4. **Close Methods**: Close button + overlay click + hide()
5. **P2P Integration**: Uses HollowPeer for friend operations
6. **Event Cards**: Renders cards for each event
7. **Real-time**: Updates instantly when events change
