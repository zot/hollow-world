# Friends View

**Route:** See [`routes.md`](routes.md) for the Friends view route

**Access:** Click "👥 Friends" button on Splash Screen

🧪 **Testing**: See [`main.tests.md`](main.tests.md) for Friends view integration tests

---

## Overview

The Friends view is a standalone page for managing P2P friend relationships in Hollow World. It provides a dedicated interface for viewing, adding, and managing friends.

## Navigation

- **Route:** See [`routes.md`](routes.md) for the Friends view route
- **Back button:** Returns to Splash Screen
- **Western frontier theme:** Follows same visual design as other views

## Friend Cards - Expandable Display

Each friend is shown on an expandable card:

### Collapsed State (default)
- Show three lines, unlabeled, left-justified, read-only:
  1. Friend name (playerName)
  2. Peer ID (peerId)
  3. First line of notes (if notes exist and are not empty)
  4. Worlds preview (if friend has shared worlds): "🗺️ Active in N world(s)"
  5. Kill button (💀) for quick removal
- Western theme styling (bordered card, appropriate colors)
- Click anywhere on card to expand

### Expanded State
- **Player Name:** editable textbox with label "Player Name:"
  - Changes save automatically on blur
  - Updates friend data in FriendsManager
- **Peer ID:** read-only text field with label "Peer ID:"
  - Text is selectable/copyable
  - Cannot be edited
- **Private Notes:** full notes editor with label "Private Notes:"
  - Markdown editor (Milkdown crepe)
  - Shows complete notes content
  - Changes save automatically
  - Notes are private and not shared with the friend
- **Worlds Section (if friend has shared worlds):**
  - Shows all worlds where this friend has characters
  - For each world:
    - World name with 🗺️ icon
    - Host indicator: "(Hosted by friend)" or "(Your world)"
    - Character list (if friend has characters in this world):
      - Character name
      - Default badge (⭐) for first/default character
- **Remove button:** Allows removing the friend from the list
- **Ban button:** Allows banning the friend
  - Shows confirmation dialog: "Are you sure you want to ban [PlayerName]? This will remove them from your friends list and prevent future friend requests."
  - If confirmed:
    - Removes friend from friends list
    - Adds peer ID to ban list (persisted)
    - Prevents future friend requests from this peer
  - If cancelled: No action taken
  - Styling: Red button with warning icon
- Click card header or collapse button (⬆️ in header) to collapse back to summary view

### Re-rendering Behavior
- Friend cards MUST fully re-render when collapsing
- This ensures all UI elements (Milkdown editor, text fields) are properly initialized
- Prevents stale DOM elements and state inconsistencies
- Each state transition (collapsed ↔ expanded) should create fresh DOM elements
- **Friend cards MUST update when friend data changes:**
  - When `pending` flag changes (set to true or cleared to false), the friend card MUST update to show/remove the pending badge
  - When `playerName` changes, the friend card MUST update to show the new name
  - Updates must occur in BOTH collapsed and expanded states
  - **Implementation options:**
    1. Full friends view re-render (simple but may lose UI state)
    2. Targeted DOM updates using `updateFriendCard()` method (preserves Milkdown editor state and expanded/collapsed state)
  - **Recommended approach:** Targeted updates via `updateFriendCard()` method that:
    - Finds the friend card by `data-friend-id` attribute
    - Updates pending badges in both collapsed and expanded sections
    - Updates player name displays in both sections
    - Preserves expanded/collapsed state and Milkdown editor content
  - **Triggering mechanism:** FriendsManager should call `notifyUpdateListeners()` when friend data changes, which triggers UI updates

### Pending Friend Status
- Friends with `pending` field show status badges
- Badge appears in both collapsed and expanded states (next to friend name)
- **Two states:**
  - **"📤 Unsent"**: Friend request not yet delivered (peer offline or unreachable)
    - Shows when `pending: 'unsent'`
    - Styling: Gray badge (`background-color: #888`)
    - System automatically retries delivery when peer comes online
  - **"⏳ Pending"**: Friend request delivered, awaiting mutual acceptance
    - Shows when `pending: 'pending'`
    - Styling: Orange badge (`background-color: #ff8c00`)
    - Mutual `requestFriend` will clear this badge
- **Purpose:** Indicates friend request status and delivery state
- **Behavior:**
  - Badge appears immediately when accepting a friend request or adding a friend by peer ID (starts as "Unsent")
  - Changes to "Pending" when message is acknowledged by peer's p2p-webapp server
  - Badge disappears when mutual `requestFriend` is received (requires friend card re-render)
  - Pending friends are fully functional (can view/edit notes, etc.)
  - System automatically resends unsent requests when peer comes online

## Add Friend by Peer ID

**Button:** "Add Friend by Peer ID" appears below the friends list

**Modal Dialog:**
- **Purpose:** Send a friend request directly to a peer by their peer ID
- **Fields:**
  - **Friend Name:** textbox for the friendly name to display in friend list (required)
  - **Peer ID:** textbox for pasting the peer's ID (required)
  - **Private Notes:** markdown editor (Milkdown crepe) for notes about the friend (optional)
- **Actions:**
  - **Add Friend button:**
    - Validates that Name and Peer ID are not empty
    - Adds friend to friends list immediately with `pending: true`
    - Sends `requestFriend` message to the peer (see [`friends.md`](friends.md) "Friend Request Flow")
      - Message includes sender's player name from their profile
      - p2p-webapp server handles delivery and retries
    - Closes the dialog
    - Shows temporary notification (via log): "Added friend: [name] ([peer ID])"
  - **Cancel button:** closes dialog without saving

## No Friends State

When friends list is empty:
- Shows centered message: "No friends yet. Add a friend to get started!"
- "Add Friend by Peer ID" button still visible and accessible

## Banned Peers Section

Below the friends list and "Add Friend by Peer ID" button, show a collapsible "Banned Peers" section:

### Collapsed State (default)
- Header: "🚫 Banned Peers (N)" where N is the count of banned peers
- Click to expand

### Expanded State
- Shows list of banned peers
- Each banned peer entry shows:
  - **Player Name** (editable textbox)
    - Changes save automatically on blur
    - Updates banned peer data in storage
  - **Peer ID** (read-only, truncated, selectable/copyable)
  - **Banned Date** (formatted timestamp, e.g., "Jan 15, 2025")
  - **Private Notes** (editable markdown field, collapsible)
    - Full Milkdown editor (same as friend cards)
    - Changes save automatically
    - Notes are preserved when banning (important for context about why banned)
  - **Send Friend Request button** (📨 or "Request") for sending friend request
  - **Unban button** (❌ or "Unban") for removing from ban list
- Click header or collapse button to collapse back

### Send Friend Request Action
- Click "Send Friend Request" button (📨)
- Automatically unban the peer (no confirmation needed)
- Add peer to friends list with `pending: true` (preserving playerName and notes from ban list)
- Send `requestFriend` message to the peer
- Remove peer from banned peers list
- Update UI to show in friends list with "⏳ Pending" badge
- Show temporary notification: "Friend request sent to [PlayerName]"
- **Note**: Player name and notes are preserved from banned peer data

### Unban Action
- Click "Unban" button (❌)
- Show confirmation dialog: "Unban [PlayerName]? They will be able to send you friend requests again."
- If confirmed:
  - Remove peer from ban list (persisted)
  - Update UI to remove from banned peers list
  - Decrement count badge
  - **Does NOT** add to friends list or send friend request
- If cancelled: No action taken

### Empty Banned Peers
- If no banned peers, section header shows "🚫 Banned Peers (0)"
- When expanded: "No banned peers"

**Note:** Banned peers silently block ALL future friend requests. Unbanning allows the peer to send friend requests again. Sending a friend request automatically unbans the peer and adds them as a pending friend.

## Back Button

- Located below the friends section
- Text: "Back to Menu"
- Returns to Splash Screen
- Western frontier button styling

## Event Integration

Friends view does NOT directly handle friend request events. Events are managed globally and appear via the event notification button (📯) at top-right of all views.

When "View Friend" button is clicked in an event (e.g., friend approved event):
- Navigates to friends view (see [`routes.md`](routes.md) for route)
- Friend should be visible in the friends list

See [`p2p-messages.md`](p2p-messages.md) for friend request message flow details.

## Audio Controls

The global audio control MUST be visible at bottom-right corner of Friends view, consistent with all other views.
