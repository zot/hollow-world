# SessionControls

**Source Spec:** game-worlds.md (lines 138-142, implicit from session management)

## Responsibilities

### Knows
- sessionMode: Current mode ("solo", "host", "guest")
- templateEngine: TemplateEngine instance for rendering
- adventureView: Reference to parent AdventureView

### Does
- render(): Display session control buttons based on current mode
- handleHostSession(): Switch from solo to host mode
- handleJoinSession(): Open JoinSessionModal for guest mode
- handleEndSession(): Return to solo mode from host/guest
- updateDisplay(): Refresh buttons when session mode changes

## Collaborators

- **AdventureView**: Parent view that manages session state
- **JoinSessionModal**: Opens dialog for joining sessions as guest
- **HollowIPeer**: Network adapter for starting/stopping P2P sessions
- **TemplateEngine**: Renders control buttons HTML

## Sequences

- seq-host-session.md: Start hosting multiplayer session
- seq-join-session.md: Join multiplayer session as guest

## Notes

- **Single Responsibility**: Session mode controls ONLY (host/join/end buttons)
- **Mode-Dependent Display**: Different buttons shown for solo/host/guest modes
- **No Business Logic**: Delegates actual session management to AdventureView
- **Existing P2P**: Uses app's existing P2PWebAppNetworkProvider via AdventureView
- **UI Component**: Rendered within AdventureView's adventure interface
- **State Reflection**: Display updates automatically when session mode changes
