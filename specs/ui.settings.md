# Settings view

🧪 **Testing**: See [`ui.settings.tests.md`](ui.settings.tests.md) for test requirements

---

## Settings title on page
if the profile is not Default, display it in curly braces under the settings title

## Peer Count Display
- Upper left of the screen shows live peer connection count
- Format: "🔗 Peers: N" where N is the number of connected peers
- Updates automatically every 5 seconds
- Styled with western theme (monospace font, bordered background)
- new peers are logged as they are found

## player name

## peer id
- make sure the "Peer ID" label isn't occluded by the value

## private notes (not shared with other players)
- embedded markdown editor

## Friends

Section heading: "Friends"

### the URL fragment friend=PEERID selects that friend in the friend list, if it exists

Selecting a friend in the list sets the URL fragment

### Friend Cards - Expandable Display

Each friend is shown on an expandable card:

**Collapsed State (default):**
- Show three lines, unlabeled, left-justified, read-only:
  1. Friend name (playerName)
  2. Peer ID (peerId)
  3. First line of notes (if notes exist and are not empty)
  4. kill button for quick removal
- Western theme styling (bordered card, appropriate colors)
- Click anywhere on card to expand

**Expanded State:**
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
- **Remove button:** allows removing the friend from the list
- Click card header or collapse button (in header) to collapse back to summary view

**Re-rendering Behavior:**
- Friend cards MUST fully re-render when collapsing
- This ensures all UI elements (Milkdown editor, text fields) are properly initialized
- Prevents stale DOM elements and state inconsistencies
- Each state transition (collapsed ↔ expanded) should create fresh DOM elements
- **Friend cards MUST update when friend data changes:**
  - When `pending` flag changes (set to true or cleared to false), the friend card MUST update to show/remove the pending badge
  - When `playerName` changes, the friend card MUST update to show the new name
  - Updates must occur in BOTH collapsed and expanded states
  - **Implementation options:**
    1. Full settings view re-render (simple but may lose UI state)
    2. Targeted DOM updates using `updateFriendCard()` method (preserves Milkdown editor state and expanded/collapsed state)
  - **Recommended approach:** Targeted updates via `updateFriendCard()` method that:
    - Finds the friend card by `data-friend-id` attribute
    - Updates pending badges in both collapsed and expanded sections
    - Updates player name displays in both sections
    - Preserves expanded/collapsed state and Milkdown editor content
  - **Triggering mechanism:** FriendsManager should call `notifyUpdateListeners()` when friend data changes, which triggers UI updates

**Pending Friend Status:**
- Friends with `pending: true` flag show a "⏳ Pending..." badge
- Badge appears in both collapsed and expanded states
- **Purpose:** Indicates that friend request was accepted but not yet acknowledged by original requester
- **Behavior:**
  - Badge appears immediately when accepting a friend request or adding a friend by peer ID
  - Badge disappears when `acceptFriend` ack is received (requires friend card re-render)
  - Pending friends are fully functional (can view/edit notes, etc.)
- **Styling:** Use western theme styling (e.g., gold/amber badge with border)

### `Invite friend` button presents modal dialog
- `friend` field where user fills in name of friend (used in friend list)
  - empty invitation field with "copy" icon, hover displays "copy to clipboard" stored in `invitation`
    - copy icon is disabled when field is empty (hover indicates disabled)
- empty friend ID field labeled as optional stored in `invitedFriend`
- notes
  - markdown editor on your notes for the friend
- `Generate` button
  - generate an invite code which is just a random string -> `inviteCode`
  - display `inviteCode-peerID` string in `invitation` field
    - enable copy icon
- `Close` button
  - if there is an invitation
    - store invite code->[friendName,friendId] in `activeInvitations`
  - closes the dialog

### `Accept Invitation` button presents modal dialog
- `Invitation` field lets user paste copied invitation stored in `acceptedInvitation`
  - on paste it
    - extracts invite code and peerID from invitation
    - sends a `requestFriend` resendable message (see p2p.md "Friend Request Flow")
      - message includes sender's player name from settings
      - automatically retries until acknowledged

## `Profiles` button
- opens the Profile Picker
  - to the right of the settings header
  - lists profiles by name
  - selecting a profile
    - sets it as the selected profile (see main.md "Profiles")
    - updates the current view
    - updates any cached views that need updating
      - or removes them if appropriate
  - has a `+` button to create a new profile
    - asks the user for a name for the new profile
      - name field
      - Accept button
      - Cancel button
    - creates the profile
    - selects the new profile

### `Add Friend by Peer ID` button presents modal dialog
- **Purpose:** Send a friend request directly to a peer by their peer ID
- **Fields:**
  - **Friend Name:** textbox for the friendly name to display in friend list (optional, can use peer ID initially)
  - **Peer ID:** textbox for pasting the peer's ID
  - **Private Notes:** markdown editor for notes about the friend
- **Actions:**
  - **Send Friend Request button:**
    - Validates that Peer ID is not empty
    - adds friend to friends list with `pending` set to true
    - Sends `requestFriend` resendable message to the peer (see p2p.md "Friend Request Flow")
      - Message includes sender's player name from settings
      - Automatically retries until acknowledged or timeout
    - Closes the dialog
    - Shows temporary notification: "Friend request sent to [peer ID]"
  - **Cancel button:** closes dialog without saving

### Friend Request Event UI
When a `requestFriend` message is received:
- **Event Card displays:**
  - **Title:** "Friend Request"
  - **Content:** "[Player Name] (Peer ID: [peer ID]) wants to add you as a friend"
  - **Three Action Buttons:**
    - **Ignore button:**
      - Removes the event from event list
      - Adds sender's peer name and ID to `ignoredPeers` storage (user-editable)
      - Future `requestFriend` messages from this peer are silently ignored
      - Does NOT send any message to sender (silent ignore)
    - **Decline button:**
      - Removes the event from event list
      - Sends `declineFriend` resendable message to sender
      - Sender receives notification: "Friend request declined"
    - **Accept button:**
      - Sends `acceptFriend` resendable message to sender
      - Adds friend to friends list with `pending: true` flag
      - Friend entry shows "Pending..." badge until acknowledged
      - Removes the event from event list
      - When `acceptFriend` ack is received: clears `pending` flag

### Ignored Peers List
- **Location:** In Friends section, collapsible section below friend cards
- **Display:** "Ignored Peers" heading with count badge (e.g., "Ignored Peers (3)")
- **Purpose:** User-editable list of peers whose friend requests are automatically ignored
- **For each ignored peer:**
  - Shows peer name (if available) and peer ID
  - **Remove button:** Removes peer from `ignoredPeers` storage
    - Once removed, future friend requests from this peer will be processed normally
- **Empty state:** "No ignored peers" message when list is empty
- **Storage:** `ignoredPeers` object keyed by peer ID, value is `{ peerId: string, peerName: string }`

### Receiving Friend Response Messages

**When `acceptFriend` message is received:**
- If friend exists in friends list with `pending: true`:
  - Clear the `pending` flag
  - Friend card updates to remove "Pending..." badge
  - No event notification needed (silent acknowledgment)
- If friend not in list:
  - Log warning (unexpected acceptFriend)

**When `declineFriend` message is received:**
- If friend exists in friends list:
  - Remove friend from friends list
  - Create event notification: "Friend request declined by [Player Name]"
  - Event card has single "Dismiss" button to remove the event
- If friend not in list:
  - Log warning (unexpected declineFriend)

## `Log` button (see CLAUDE.md "Log")
- there is a log button under the Profile button that flips to a log view
  - log messages are in tabular format with sortable Date and Message columns
    - sorting reorders the entire rows, not just the columns you're sorting
  - there is a filter field above the table
    - it filters the table to messages that match words in the text

## `Events notification` button
- on the settings page, the Events notification button, when it is present, appears under the Log button
