# Settings view

🧪 **Testing**: See [`ui.settings.tests.md`](ui.settings.tests.md) for test requirements

---

## Settings title on page
if the profile is not Default, display it in curly braces after the settings title

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

## list of friends and their information

### the URL fragment friend=PEERID selects that friend in the friend list, if it exists

Selecting a friend in the list sets the URL fragment

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

### Show a card for each friend
- player name -- editable field
- peer id -- labeled read-only text
- private notes editor
  - markdown editor

## `Log` button (see CLAUDE.md "Log")
- there is a log button at the screen top-right that flips to a log view
  - log messages are in tabular format with sortable Date and Message columns
    - sorting reorders the entire rows, not just the columns you're sorting
  - there is a filter field above the table
    - it filters the table to messages that match words in the text

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
