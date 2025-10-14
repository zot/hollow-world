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
    - sends a requestFriend message (see p2p.md "P2P Methods")

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
- **Purpose:** Add a friend directly by their peer ID (uses peer discovery-based invitation)
- **Fields:**
  - **Friend Name:** textbox for the friendly name to display in friend list
  - **Peer ID:** textbox for pasting the peer's ID
  - **Private Notes:** markdown editor for notes about the friend
- **Actions:**
  - **Add Friend button:**
    - Validates that Peer ID is not empty
    - Adds peer ID to `pendingNewInvitations` storage
    - Closes the dialog
    - When the peer is discovered via broadcast, automatically sends `newFriendRequest` message
  - **Cancel button:** closes dialog without saving

### New Friend Request Event UI
When a `newFriendRequest` event is received:
- **Event Card displays:**
  - **Title:** "New Friend Request"
  - **Content:** "Peer [peer ID] wants to add you as a friend"
  - **Three Action Buttons:**
    - **Accept button:**
      - Adds peer to friends list with peer ID as initial name
      - Removes peer ID from `pendingNewFriendRequests`
      - Removes the event from event list
      - Sends acceptance confirmation to peer (if connection still active)
    - **Decline button:**
      - Adds peer ID to `declinedFriendRequests` storage
      - Removes peer ID from `pendingNewFriendRequests`
      - Removes the event from event list
      - Does NOT send any message to peer (silent decline)
    - **Ignore button:**
      - Removes the event from event list
      - Keeps peer ID in `pendingNewFriendRequests` (may reappear)
      - Does NOT modify `declinedFriendRequests`

### Pending New Invitations List
- **Location:** In Friends section, below friend cards
- **Display:** Collapsible section "Pending Invitations" with count badge
- **For each pending invitation:**
  - Shows peer ID (truncated with ellipsis if too long)
  - Shows "Waiting for peer discovery..." status
  - **Remove button:** removes peer ID from `pendingNewInvitations`

## `Log` button (see CLAUDE.md "Log")
- there is a log button under the Profile button that flips to a log view
  - log messages are in tabular format with sortable Date and Message columns
    - sorting reorders the entire rows, not just the columns you're sorting
  - there is a filter field above the table
    - it filters the table to messages that match words in the text

## `Events notification` button
- on the settings page, the Events notification button, when it is present, appears under the Log button
