# CRC Card: FriendsView

**Source Spec:** ui.friends.md
**Existing Code:** src/ui/FriendsView.ts

## Class Responsibilities

### Knows About (Data)
- `config: IFriendsViewConfig` - UI configuration (CSS classes)
- `container: HTMLElement` - DOM container for the view
- `audioManager?: IAudioManager` - Optional audio manager for sound effects
- `hollowPeer?: HollowPeer` - P2P system for friend operations
- `onBackToMenu?: callback` - Navigation callback to return to menu
- `friendsEditors: Map<string, IMilkdownEditor>` - Milkdown editors for friend notes
- `bannedPeerEditors: Map<string, IMilkdownEditor>` - Milkdown editors for banned peer notes
- `newFriendNotesEditor: IMilkdownEditor` - Milkdown editor for new friend modal
- `logService: LogService` - Logging service

### Does (Behavior)

**View Rendering:**
- `render(container)` - Render the friends view with friend cards and banned peers section
- `refreshView()` - Refresh the view (preserves expanded/collapsed state)
- `destroy()` - Clean up editors and DOM references

**Data Preparation:**
- `getFriendsData()` - Transform friend data for template rendering
- `getBannedPeersData()` - Transform banned peer data for template rendering

**Event Handling:**
- `setupElementReferences()` - Cache DOM element references
- `setupEventHandlers()` - Set up back button and add friend modal handlers
- `setupFriendCardHandlers()` - Set up friend card interactions (expand/collapse, remove, ban)
- `setupBannedPeersHandlers()` - Set up banned peer section handlers (unban, send request)

**Friend Card Interactions:**
- `expandFriendCard(card)` - Expand friend card to show full details
- `collapseFriendCard(card)` - Collapse friend card to summary view

**Milkdown Editors:**
- `initializeMilkdownEditors()` - Initialize Milkdown editors for all friend notes
- `saveBannedPeerNotes()` - Save notes from banned peer editors

**Add Friend Modal:**
- `showAddFriendModal()` - Display modal for adding friend by peer ID
- `hideAddFriendModal()` - Hide modal and clear inputs
- `handleAddFriend()` - Process add friend form submission
- `isValidPeerId(peerId)` - Validate peer ID format

**Fallback:**
- `createFriendsFallback()` - Create fallback UI on error

**Integration:**
- `updateHollowPeer(hollowPeer)` - Update HollowPeer reference and re-render

## Collaborators

**Uses:**
- **TemplateEngine** (src/utils/TemplateEngine.ts) - For rendering HTML templates
- **AudioControlUtils** (src/utils/AudioControlUtils.ts) - For button sound effects
- **MilkdownUtils** (src/utils/MilkdownUtils.ts) - For Markdown editor creation
- **LogService** (src/services/LogService.ts) - For user-visible logging
- **HollowPeer** (src/p2p/HollowPeer.ts) - For P2P friend operations
- **FriendsManager** (src/p2p/FriendsManager.ts) - Via HollowPeer for friend data access

**Used By:**
- **main.ts** - Routes to FriendsView via Router
- **EventService** - "View Friend" button in events navigates to FriendsView

## Design Patterns

**Single Responsibility**: Manages friends UI only (delegates P2P operations to HollowPeer)
**Template Method**: Uses TemplateEngine for HTML rendering
**Observer Pattern**: Receives updates via HollowPeer's refreshFriendsViewCallback
**Dependency Injection**: AudioManager and HollowPeer injected via constructor

## Key Design Decisions

1. **Expandable Cards**: Collapsed state shows summary, expanded shows full details with editors
2. **Event Delegation**: Uses event delegation for friend card interactions (efficient for dynamic lists)
3. **Milkdown Editors**: Rich Markdown editing for friend notes (one editor per friend + modal)
4. **State Preservation**: refreshView() preserves expanded/collapsed state during re-renders
5. **Targeted Updates**: Friend cards update when data changes (via FriendsManager update listeners)
6. **Peer ID Validation**: Base58 format validation (alphanumeric only, no special characters)
7. **Ban List Section**: Collapsible section showing banned peers with unban and send request options
8. **Auto-Save**: Friend name and banned peer name inputs auto-save on blur

## Testing

**Test File:** Not yet created (UI component testing pending)

**Key Test Scenarios:**
- Render with friends list
- Render with empty friends list
- Expand/collapse friend cards
- Add friend by peer ID
- Remove friend
- Ban friend
- Unban peer
- Send friend request to banned peer
- Presence indicator updates
- Pending badge updates
- Friend name editing
