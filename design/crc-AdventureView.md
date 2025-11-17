# AdventureView

**Source Spec:** game-worlds.md (lines 75-108)

## Responsibilities

### Knows
- world: Current MUD World instance
- mudControl: MudControl engine instance
- outputHistory: Array of text output lines
- commandHistory: Array of previous commands
- historyIndex: Current position in command history
- sessionMode: "solo" | "host" | "guest"
- connectedPeers: Array of connected peer IDs
- hollowIPeer: HollowIPeer network adapter instance
- currentCharacter: Selected Hollow character for this session
- templateEngine: TemplateEngine instance for rendering

### Does
- render(): Display adventure UI with banner, output area, command input
- renderBanner(): Display world name, buttons, connection status
- renderOutput(): Display scrollable text output from MUD engine
- renderCommandInput(): Display command input field with history navigation
- handleCommand(text): Process user command through MUD engine
- handleCommandHistory(direction): Navigate up/down through command history
- displayOutput(text): Add text to output area and scroll to bottom
- handleWorldsButton(): Navigate to world list overlay
- handleBackButton(): Return to splash screen
- startSession(mode): Initialize solo/host/guest session
- cleanup(): Dispose of MUD engine and network connections

## Collaborators

- **MudControl**: TextCraft MUD engine for processing commands and generating output
- **HollowIPeer**: Network adapter for multiplayer sessions (implements TextCraft IPeer interface)
- **P2PWebAppNetworkProvider**: Existing Hollow P2P infrastructure (via HollowPeer.getNetworkProvider())
- **Character**: Hollow character data synced with MUD Thing properties
- **TemplateEngine**: Renders HTML templates for UI
- **Router**: Navigation to world list and splash screen
- **SessionControls**: Session management UI component (host/join buttons)

## Sequences

- seq-select-world.md: Starting a world from world list
- seq-send-command.md: User command → MUD engine → output
- seq-host-session.md: Start hosting multiplayer session
- seq-join-session.md: Join multiplayer session
- seq-switch-to-world-list.md: Navigate to world list overlay

## Notes

- **Single Responsibility**: Adventure gameplay ONLY (text output, command input, session controls)
- **No World Management**: Does NOT handle world CRUD operations (that's WorldListView)
- **No World List**: Does NOT render world list (that's WorldListView)
- **Existing P2P**: MUST use app's existing `P2PWebAppNetworkProvider` instance (no duplicates)
- **Character Integration**: Character stats sync with MUD Thing properties via bidirectional events
- **Future Enhancement**: May include character view toggle (spec lines 77-88, not yet implemented)
