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
- **Remove button:** allows removing the friend from the list
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
- Friends with `pending: true` flag show a "⏳ Pending" badge
- Badge appears in both collapsed and expanded states (next to friend name)
- **Purpose:** Indicates that friend request was accepted but not yet acknowledged by original requester
- **Behavior:**
  - Badge appears immediately when accepting a friend request or adding a friend by peer ID
  - Badge disappears when `acceptFriend` ack is received (requires friend card re-render)
  - Pending friends are fully functional (can view/edit notes, etc.)
- **Styling:** Orange badge with white text (`background-color: #ff8c00`)

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
    - Adds friend to friends list immediately
    - Sends `requestFriend` resendable message to the peer (see p2p.md "Friend Request Flow")
      - Message includes sender's player name from their profile
      - Automatically retries until acknowledged or max retries
    - Closes the dialog
    - Shows temporary notification (via log): "Added friend: [name] ([peer ID])"
  - **Cancel button:** closes dialog without saving

## No Friends State

When friends list is empty:
- Shows centered message: "No friends yet. Add a friend to get started!"
- "Add Friend by Peer ID" button still visible and accessible

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
