# SettingsView

**Source Spec:** ui.settings.md
**Existing Code:** src/ui/SettingsView.ts
**Test Code:** test/SettingsView.test.ts

## Responsibilities

### Knows
- `config: ISettingsViewConfig` - UI configuration (CSS classes)
- `container: HTMLElement` - DOM container for the view
- `audioManager?: IAudioManager` - Optional audio manager for music controls
- `hollowPeer?: HollowPeer` - P2P system for peer count and ID display
- `settingsData: ISettingsData` - Settings form data (player name, pubsub topic, peer protocol, private notes)
- `logService: LogService` - Logging service for log view
- `playerNameInput: HTMLInputElement` - Player name input field
- `pubsubTopicInput: HTMLInputElement` - Pubsub topic input field
- `peerProtocolInput: HTMLInputElement` - Peer protocol input field
- `privateNotesEditor: IMilkdownEditor` - Milkdown editor for private notes
- `logSortColumn: string` - Current log sort column ('date' or 'message')
- `logSortAscending: boolean` - Log sort direction
- `peerCountInterval: number` - Timer for peer count updates

### Does
- **View Rendering:**
  - `renderSettings()` - Render the main settings view with form inputs
  - `renderLog()` - Render the log view with sortable table
  - `destroy()` - Clean up editors and DOM references

- **Settings Management:**
  - `loadSettings()` - Load settings from LocalStorage
  - `saveSettings()` - Save settings to LocalStorage
  - `showRestartNotification()` - Show notification when protocol/topic changes

- **Element Setup:**
  - `setupElementReferences()` - Cache DOM element references
  - `setupEventHandlers()` - Set up form input and button handlers
  - `setupEventCardHandlers()` - Set up event card interactions
  - `setupLogEventHandlers()` - Set up log view handlers (sort, filter)

- **Profile Management:**
  - `showProfilePicker()` - Display modal for profile selection/creation
  - Handles profile switching and new profile creation

- **P2P Integration:**
  - `updatePeerId()` - Display current peer ID (copy to clipboard)
  - `updatePeerCount()` - Display connected peer count
  - `startPeerCountUpdates()` - Start 5-second peer count polling
  - `updateHollowPeer()` - Update HollowPeer reference and re-render

- **Log View:**
  - `filterLogTable()` - Filter log entries by search text
  - `handleSort()` - Handle column sort clicks
  - `sortLogEntries()` - Sort log entries by column
  - `updateSortIndicators()` - Update sort arrow indicators
  - `formatDate()` - Format timestamps for display

- **Utilities:**
  - `copyToClipboard()` - Copy text to clipboard with feedback
  - `initializeMilkdownEditors()` - Initialize Markdown editor for notes
  - `createSettingsFallback()` - Create fallback UI on error

## Collaborators

- **TemplateEngine** (src/utils/TemplateEngine.ts) - For rendering HTML templates
- **AudioControlUtils** (src/utils/AudioControlUtils.ts) - For music button integration
- **MilkdownUtils** (src/utils/MilkdownUtils.ts) - For Markdown editor (private notes)
- **LogService** (src/services/LogService.ts) - For log entries display
- **ProfileService** (src/services/ProfileService.ts) - For profile management
- **HollowPeer** (src/p2p/HollowPeer.ts) - For peer count and ID display
- **EventService** (src/services/EventService.ts) - For displaying friend request events

## Code Review Notes

### ✅ Working well
- **Clean separation of concerns**: Settings form vs Log view vs Profile picker
- **SOLID principles followed**:
  - Single Responsibility: Manages settings UI only
  - Dependency Injection: AudioManager, HollowPeer injected
  - Interface Segregation: ISettingsView interface
- **Profile-aware storage**: Uses ProfileService for multi-profile support
- **Real-time updates**: Peer count updates every 5 seconds
- **Sortable log table**: Date and Message columns sortable
- **Filter functionality**: Text-based log filtering
- **Milkdown integration**: Rich Markdown editing for private notes
- **Event cards**: Displays friend requests with action buttons
- **Western theme**: Consistent styling throughout

### ✅ Matches spec perfectly
- Player name input
- Peer ID display with copy button
- Pubsub topic and peer protocol inputs with reset buttons
- Private notes with Markdown editor
- Profile picker with create/select functionality
- Log view with sortable table and filter
- Events notification button under Log button
- Peer count display (upper left, updates every 5 seconds)
- Restart notification for protocol/topic changes
- Profile name displayed under Settings title (if not Default)

### 📝 Implementation details
- **Storage key**: `hollowWorldSettings`
- **Profile integration**: Automatic profile switch reconnects to P2P
- **Peer count interval**: 5000ms (5 seconds)
- **Log sort**: Default sort by date descending (newest first)
- **Events placement**: Events button appears under Log button as specified
- **Template file**: `public/templates/settings-view.html`

## Sequences

- seq-view-settings.md (TBD - viewing and editing settings)
- seq-change-profile.md (TBD - switching profiles)
- seq-view-log.md (TBD - viewing and filtering log)

## Related CRC Cards

- crc-ProfileService.md - Profile management backend
- crc-LogService.md - Log storage and retrieval
- crc-AudioManager.md - Audio system integration
- crc-HollowPeer.md - P2P peer count and ID

## Design Patterns

**Single Responsibility**: Manages settings UI only (delegates storage to ProfileService, logging to LogService)
**Template Method**: Uses TemplateEngine for HTML rendering
**Observer Pattern**: Receives updates via HollowPeer peer count polling
**Dependency Injection**: AudioManager and HollowPeer injected via constructor

## Key Design Decisions

1. **Profile-aware**: All settings stored with profile prefix
2. **Tab-scoped profiles**: Profile selection doesn't persist across tabs
3. **Real-time peer count**: Updates every 5 seconds via setInterval
4. **Restart notification**: Protocol/topic changes require app restart
5. **Sortable log**: Date and Message columns independently sortable
6. **Event cards**: Friend requests displayed as cards with actions
7. **Milkdown editor**: Rich Markdown editing for private notes
8. **Copy to clipboard**: Peer ID copyable with visual feedback
