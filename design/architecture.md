# Architecture

**Entry point to the design - shows how design elements are organized into logical systems**

**Sources**: All CRC cards, sequences, UI specs, and manifest created from Level 1 specs

---

## Systems

### Application Framework

**Purpose**: Core application lifecycle, routing, and view coordination

**Design Elements**:
- crc-Application.md
- crc-Router.md
- crc-TemplateEngine.md
- seq-app-startup.md
- seq-view-transition.md
- seq-navigate-from-splash.md

### UI Views

**Purpose**: User interface views for navigation and feature access

**Design Elements**:
- crc-SplashScreen.md
- crc-CharacterManagerView.md
- crc-CharacterEditorView.md
- crc-FriendsView.md
- crc-SettingsView.md
- ui-splash-view.md
- ui-characters-view.md
- ui-character-editor-view.md
- ui-friends-view.md
- ui-settings-view.md

### Character Management System

**Purpose**: Character creation, storage, validation, and synchronization

**Design Elements**:
- crc-Character.md
- crc-CharacterFactory.md
- crc-CharacterStorageService.md
- crc-CharacterValidation.md
- crc-CharacterCalculations.md
- crc-CharacterHash.md
- crc-CharacterVersioning.md
- crc-CharacterSync.md
- crc-CharacterSheet.md
- seq-edit-character.md
- seq-save-character.md
- seq-save-character-ui.md
- seq-load-character.md
- seq-validate-character.md
- seq-increment-attribute.md
- seq-revert-character.md
- seq-render-character-list.md
- seq-textcraft-character-sync.md

### Audio System

**Purpose**: Background music, sound effects, and audio controls

**Design Elements**:
- crc-AudioManager.md
- crc-AudioProvider.md
- crc-AudioControlUtils.md
- crc-GlobalAudioControl.md
- seq-play-background-music.md
- seq-play-sound-effect.md

### P2P Networking System

**Purpose**: Peer-to-peer networking, friend management, and presence tracking

**Design Elements**:
- crc-HollowPeer.md
- crc-HollowIPeer.md
- crc-P2PWebAppNetworkProvider.md
- crc-P2PMessage.md
- crc-FriendsManager.md
- crc-Friend.md
- seq-establish-p2p-connection.md
- seq-send-receive-p2p-message.md
- seq-add-friend-by-peerid.md
- seq-friend-presence-update.md
- seq-friend-status-change.md

### TextCraft Integration

**Purpose**: TextCraft MUD world management and adventure mode

**Design Elements**:
- crc-AdventureMode.md
- crc-AdventureView.md
- crc-WorldListView.md
- crc-WorldLoader.md
- crc-WorldConnections.md
- crc-LocalMudSession.md
- crc-SessionControls.md
- ui-adventure-mode.md
- ui-adventure-view.md
- ui-world-list-view.md
- seq-start-adventure-mode.md
- seq-select-world.md
- seq-switch-to-world-list.md
- seq-host-session.md
- seq-join-session.md
- seq-send-command.md
- seq-textcraft-solo-command.md
- seq-textcraft-multiplayer-command.md

### World Management System

**Purpose**: TextCraft world CRUD operations and modal dialogs

**Design Elements**:
- crc-CreateWorldModal.md
- crc-DeleteWorldModal.md
- crc-WorldSettingsModal.md
- crc-JoinSessionModal.md
- ui-create-world-modal.md
- ui-delete-world-modal.md
- ui-world-settings-modal.md
- ui-join-session-modal.md
- seq-create-world.md
- seq-delete-world.md
- seq-edit-world-settings.md

### Event System

**Purpose**: Event notification, event display, and user alerts

**Design Elements**:
- crc-EventNotificationButton.md
- crc-EventModal.md

---

## Cross-Cutting Concerns

**Design elements that span multiple systems**

**Design Elements**:
- crc-ProfileService.md
- crc-LogService.md
- manifest-ui.md
- seq-log-message.md

---

*This file serves as the architectural "main program" - start here to understand the design structure*
