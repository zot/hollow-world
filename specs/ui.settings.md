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

## P2P Network Settings

### Pubsub Topic
- Text input field for the IPFS pubsub topic used for peer discovery
- Default value: `hollow-world`
- Used by p2p-webapp to discover and communicate with peers on the same topic
- Persisted to LocalStorage (profile-aware)
- Reset button (🔄) to restore default value
- Changes require app restart to take effect (notify user)

### Peer Messaging Protocol
- Text input field for the libp2p protocol string used for direct peer messaging
- Default value: `/hollow-world/1.0.0`
- Used by p2p-webapp for protocol-based message routing
- Persisted to LocalStorage (profile-aware)
- Reset button (🔄) to restore default value
- Changes require app restart to take effect (notify user)

**Storage:** Both settings stored in `hollowWorldSettings` object alongside player name and private notes

**Use Case:** Advanced users can create isolated P2P networks by changing these values (e.g., for testing or private groups)

## private notes (not shared with other players)
- embedded markdown editor

## Friends

**Friends have been relocated to a dedicated Friends view** (see [`routes.md`](routes.md) for route).

See [`ui.friends.md`](ui.friends.md) for complete Friends view specifications.

**Quick access:** Click "👥 Friends" button on Splash Screen to navigate to Friends view.

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


## `Log` button (see CLAUDE.md "Log")
- there is a log button under the Profile button that flips to a log view
  - log messages are in tabular format with sortable Date and Message columns
    - sorting reorders the entire rows, not just the columns you're sorting
  - there is a filter field above the table
    - it filters the table to messages that match words in the text

## `Events notification` button
- on the settings page, the Events notification button, when it is present, appears under the Log button
