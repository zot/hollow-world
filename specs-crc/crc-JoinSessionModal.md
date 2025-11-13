# JoinSessionModal

**Source Spec:** specs/game-worlds.md (line 138, implicit from multiplayer modes)

## Responsibilities

### Knows
- modalContainer: DOM element for modal overlay
- templateEngine: TemplateEngine instance for rendering
- hostPeerId: Peer ID of session host to join
- worldId: ID of world being joined
- selectedCharacter: Character to use in session

### Does
- show(): Display join session modal dialog
- hide(): Close modal and remove overlay
- render(): Display form with host peer ID input, character selection
- handleJoin(): Validate inputs and initiate guest session connection
- handleCancel(): Close modal without joining session
- validateInputs(): Ensure peer ID is valid format and character is selected
- connectToHost(): Establish P2P connection to host peer

## Collaborators

- **HollowIPeer**: Network adapter for P2P connection to host
- **P2PWebAppNetworkProvider**: Existing P2P infrastructure (via HollowPeer)
- **Character**: Hollow character data for session
- **TemplateEngine**: Renders modal HTML template
- **AdventureView**: Switches to guest mode after successful connection
- **FriendsManager**: Lists known friends as quick-select options for host peer ID

## Sequences

- seq-join-session.md: User joins multiplayer session as guest

## Notes

- **Single Responsibility**: Join multiplayer session dialog ONLY
- **Peer ID Input**: Allows manual entry or selection from friends list
- **Character Selection**: User chooses which character to play with
- **Validation**: Checks peer ID format and character selection before connecting
- **Modal Pattern**: Blocks interaction until user joins or cancels
- **Connection Feedback**: Shows loading state during connection attempt
- **Error Handling**: Displays error message if connection fails
- **Existing P2P**: Uses app's existing P2PWebAppNetworkProvider (no duplicates)
