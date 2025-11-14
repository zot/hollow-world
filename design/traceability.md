# Traceability Map

This document maintains **bidirectional links** between Level 1 (specs), Level 2 (CRC cards + sequences), and Level 3 (code).

**Purpose:** Ensure every piece of code traces back to requirements, and every requirement is implemented.

---

## Level 1 ↔ Level 2 (Human Specs to Models)

### specs/characters.md

**CRC Cards:**
- crc-Character.md
- crc-CharacterStorageService.md
- crc-CharacterCalculations.md
- crc-CharacterValidation.md
- crc-CharacterFactory.md
- crc-CharacterVersioning.md
- crc-CharacterHash.md

**Sequence Diagrams:**
- seq-save-character.md
- seq-load-character.md
- seq-validate-character.md

---

### specs/storage.md

**CRC Cards:**
- crc-CharacterStorageService.md
- crc-ProfileService.md
- crc-CharacterHash.md

**Sequence Diagrams:**
- seq-save-character.md
- seq-load-character.md

---

### specs/logging.md

**CRC Cards:**
- crc-LogService.md
- crc-ProfileService.md

**Sequence Diagrams:**
- seq-log-message.md

---

### specs/ui.characters.md

**CRC Cards:**
- crc-CharacterEditorView.md
- crc-CharacterManagerView.md
- crc-CharacterSheet.md

**Sequence Diagrams:**
- seq-edit-character.md
- seq-save-character-ui.md
- seq-render-character-list.md
- seq-increment-attribute.md
- seq-revert-character.md

---

### specs/ui.md

**CRC Cards:**
- crc-TemplateEngine.md
- crc-Router.md
- crc-CharacterEditorView.md
- crc-CharacterManagerView.md

**Sequence Diagrams:**
- seq-edit-character.md
- seq-render-character-list.md

---

### specs/routes.md

**CRC Cards:**
- crc-Router.md

**Sequence Diagrams:**
- seq-edit-character.md
- seq-render-character-list.md

---

### specs/ui.splash.md

**CRC Cards:**
- crc-SplashScreen.md
- crc-AudioManager.md
- crc-AudioProvider.md
- crc-AudioControlUtils.md

**Sequence Diagrams:**
- seq-app-startup.md
- seq-navigate-from-splash.md
- seq-play-background-music.md
- seq-play-sound-effect.md

---

### specs/audio.md

**CRC Cards:**
- crc-AudioManager.md
- crc-AudioProvider.md
- crc-AudioControlUtils.md

**Sequence Diagrams:**
- seq-app-startup.md
- seq-play-background-music.md
- seq-play-sound-effect.md

---

### specs/p2p.md

**CRC Cards:**
- crc-HollowPeer.md
- crc-P2PWebAppNetworkProvider.md
- crc-P2PMessage.md

**Sequence Diagrams:**
- seq-establish-p2p-connection.md
- seq-send-receive-p2p-message.md

---

### specs/friends.md

**CRC Cards:**
- crc-FriendsManager.md
- crc-FriendsView.md
- crc-Friend.md

**Sequence Diagrams:**
- seq-friend-presence-update.md
- seq-friend-status-change.md
- seq-add-friend-by-peerid.md

---

### specs/ui.settings.md

**CRC Cards:**
- crc-SettingsView.md

**Sequence Diagrams:**
- seq-friend-status-change.md
- seq-add-friend-by-peerid.md

---

### specs/game-worlds.md

**CRC Cards:**
- crc-AdventureMode.md
- crc-AdventureView.md
- crc-WorldListView.md
- crc-CreateWorldModal.md
- crc-WorldSettingsModal.md
- crc-DeleteWorldModal.md
- crc-JoinSessionModal.md
- crc-SessionControls.md

**Sequence Diagrams:**
- seq-start-adventure-mode.md
- seq-select-world.md
- seq-create-world.md
- seq-edit-world-settings.md
- seq-delete-world.md
- seq-host-session.md
- seq-join-session.md
- seq-send-command.md
- seq-switch-to-world-list.md

**UI Specs:**
- ui-adventure-mode.md
- ui-adventure-view.md (updated)
- ui-world-list-view.md (updated)
- ui-create-world-modal.md
- ui-world-settings-modal.md
- ui-delete-world-modal.md
- ui-join-session-modal.md

---

### specs/integrate-textcraft.md

**CRC Cards:**
- crc-HollowIPeer.md
- crc-CharacterSync.md
- crc-WorldLoader.md
- crc-LocalMudSession.md
- crc-WorldConnections.md

**Sequence Diagrams:**
- seq-textcraft-solo-command.md
- seq-textcraft-multiplayer-command.md
- seq-textcraft-character-sync.md

---

### specs/main.md

**CRC Cards:**
- crc-Application.md
- crc-GlobalAudioControl.md
- crc-EventNotificationButton.md
- crc-EventModal.md

**Sequence Diagrams:**
- seq-app-startup.md
- seq-view-transition.md

---

## Level 2 ↔ Level 3 (CRC Cards to Code)

### crc-Character.md

**Source Spec:** specs/characters.md

**Knows:**
- name, id, version
- attributes (DEX, STR, CON, CHA, WIS, GRI, INT, PER)
- skills, fields, equipment
- hollow data (form, trauma, stigma, etc.)
- characterHash (for save optimization)

**Does:**
- (Interface only - data structure definition)

**Implementation:**
- **src/character/types.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [x] ICharacter interface comment
  - [x] IAttributes interface comment
  - [ ] AttributeType enum comment
  - [x] ISkill interface comment
  - [x] IItem interface comment
  - [x] IHollowData interface comment
  - [x] IField interface comment
  - [x] IFieldSkillEntry interface comment
  - [ ] ATTRIBUTE_DEFINITIONS constant comment
  - [ ] CHARACTER_CREATION_RULES constant comment

**Tests:**
- (Interfaces tested indirectly through usage)

**Appears in Sequences:**
- seq-save-character.md
- seq-load-character.md
- seq-validate-character.md

---

### crc-CharacterStorageService.md

**Source Spec:** specs/characters.md, specs/storage.md

**Knows:**
- STORAGE_KEY constant
- Character array in memory

**Does:**
- getAllCharacters(): Load from ProfileService (async)
- getCharacter(id): Get single character
- saveCharacter(character): Save with hash optimization
- deleteCharacter(id): Remove from array
- validateAndFixCharacter(): Initialize hash on load (async)
- createNewCharacter(name): Factory method

**Implementation:**
- **src/services/CharacterStorageService.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [x] CharacterStorageService class comment → crc-CharacterStorageService.md
  - [x] ICharacterStorageService interface comment → crc-CharacterStorageService.md
  - [ ] getAllCharacters() method comment → seq-load-character.md (lines 26-78)
  - [ ] getCharacter() method comment
  - [ ] saveCharacter() method comment → seq-save-character.md (lines 43-97)
  - [x] deleteCharacter() method comment
  - [ ] validateAndFixCharacter() method comment → seq-load-character.md (lines 68-76)
  - [x] createNewCharacter() method comment

**Tests:**
- **src/services/CharacterStorageService.test.ts** (38 tests passing)
  - [x] File header referencing CRC card

**Appears in Sequences:**
- seq-save-character.md (lines 43-97)
- seq-load-character.md (lines 26-78)

---

### crc-ProfileService.md

**Source Spec:** specs/storage.md, specs/main.md

**Knows:**
- Current profile (from sessionStorage)
- Profile list (from localStorage)
- Key prefix pattern

**Does:**
- getCurrentProfile(): Get active profile
- setCurrentProfile(name): Switch profile
- getAllProfiles(): List all profiles
- createProfile(name): Create new profile
- deleteProfile(name): Remove profile
- getItem(key): Get profile-scoped item
- setItem(key, value): Set profile-scoped item
- removeItem(key): Remove profile-scoped item

**Implementation:**
- **src/services/ProfileService.ts**
  - [x] File header (CRC + Spec + Sequences)

**Interface:**
  - [x] IProfileService interface comment → crc-ProfileService.md
  - [x] IProfile interface comment

**Implementations:**
- **ProfileService class**
  - [x] ProfileService class comment → crc-ProfileService.md
  - [ ] ProfileService.getCurrentProfile() implementation → crc-ProfileService.md
  - [ ] ProfileService.setCurrentProfile() implementation → crc-ProfileService.md
  - [ ] ProfileService.getAllProfiles() implementation → crc-ProfileService.md
  - [ ] ProfileService.createProfile() implementation → crc-ProfileService.md
  - [ ] ProfileService.deleteProfile() implementation → crc-ProfileService.md
  - [ ] ProfileService.getStorageKey() implementation → crc-ProfileService.md
  - [ ] ProfileService.getItem() implementation → crc-ProfileService.md, seq-load-character.md (lines 29-38), seq-save-character.md (lines 68-78)
  - [ ] ProfileService.setItem() implementation → crc-ProfileService.md, seq-save-character.md (lines 84-94), seq-log-message.md (lines 51-61)
  - [ ] ProfileService.removeItem() implementation → crc-ProfileService.md

**Tests:**
- **src/services/ProfileService.test.ts**
  - [x] File header referencing CRC card

**Appears in Sequences:**
- seq-save-character.md (lines 68-94)
- seq-load-character.md (lines 29-38)
- seq-log-message.md (lines 51-61)

---

### crc-LogService.md

**Source Spec:** specs/logging.md

**Knows:**
- LOG_KEY constant
- Current serial number
- Log entries array
- Total character count

**Does:**
- log(level, message): Add entry
- getEntries(): Retrieve all entries
- clear(): Clear log
- getTotalChars(): Get size
- Automatic trimming (512KB→256KB)

**Implementation:**
- **src/services/LogService.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [x] LogService class comment → crc-LogService.md
  - [x] ILogService interface comment → crc-LogService.md
  - [x] ILogEntry interface comment
  - [x] ILogData interface comment
  - [ ] log() method comment → seq-log-message.md (lines 19-64)
  - [ ] getEntries() method comment
  - [ ] clear() method comment
  - [ ] getTotalChars() method comment
  - [ ] loadFromStorage() method comment
  - [ ] saveToStorage() method comment → seq-log-message.md (lines 51-61)
  - [ ] trimIfNeeded() method comment → seq-log-message.md (lines 39-49)

**Tests:**
- **test/LogService.test.ts**
  - [x] File header referencing CRC card

**Appears in Sequences:**
- seq-log-message.md (lines 19-64)

---

### crc-CharacterCalculations.md

**Source Spec:** specs/characters.md (Calculations section)

**Knows:**
- (Pure functions - no state)

**Does:**
- calculateRank(totalXP): Convert XP to rank
- calculateRankFromEarnedXP(earnedXP): Rank from earned XP
- calculateDamageCapacity(constitution): Damage capacity formula
- calculateTotalXPForRank(rank): Inverse rank calculation
- calculateAttributeTotal(attributes): Sum attributes
- calculateAttributeCost(attributes): Chip cost for attributes
- calculateSkillCost(skills): Chip cost for skills
- calculateChipCost(character): Total chip cost
- calculateDerivedStats(character): All derived stats

**Implementation:**
- **src/character/CharacterUtils.ts**
  - [ ] File header (shared - references multiple CRCs)
  - [x] CharacterCalculations class comment → crc-CharacterCalculations.md
  - [ ] calculateRank() method comment
  - [ ] calculateRankFromEarnedXP() method comment
  - [ ] calculateDamageCapacity() method comment
  - [ ] calculateTotalXPForRank() method comment
  - [ ] calculateAttributeTotal() method comment → seq-validate-character.md (lines 33-37)
  - [ ] calculateAttributeCost() method comment
  - [ ] calculateSkillCost() method comment
  - [ ] calculateChipCost() method comment → seq-validate-character.md (lines 47-51)
  - [ ] calculateDerivedStats() method comment

**Tests:**
- **src/character/CharacterUtils.test.ts** (does not exist)
  - [ ] File header referencing CRC cards

**Appears in Sequences:**
- seq-validate-character.md (lines 33-37, 47-51)

---

### crc-CharacterValidation.md

**Source Spec:** specs/characters.md (Validation section)

**Knows:**
- Validation rules (attribute ranges, totals, prerequisites)

**Does:**
- validateCharacterCreation(character): Check all rules
- validateAttributes(attributes): Range checking (0-4 for creation)
- validateSkillPrerequisites(character): Skill dependencies
- Returns string[] of errors (non-throwing)

**Implementation:**
- **src/character/CharacterUtils.ts**
  - [ ] File header (shared - references multiple CRCs)
  - [x] CharacterValidation class comment → crc-CharacterValidation.md
  - [ ] validateCharacterCreation() method comment → seq-validate-character.md (lines 18-58), seq-save-character.md (lines 25-33)
  - [ ] validateAttributes() method comment → seq-validate-character.md (lines 25-27)
  - [ ] validateSkillPrerequisites() method comment → seq-validate-character.md (lines 40-41)
  - [ ] validateFields() method comment → seq-validate-character.md (lines 43-45)
  - [ ] validateChipEconomy() method comment → seq-validate-character.md (lines 53-55)

**Tests:**
- **src/character/CharacterUtils.test.ts** (does not exist)
  - [ ] File header referencing CRC cards

**Appears in Sequences:**
- seq-validate-character.md (lines 18-58)
- seq-save-character.md (lines 25-33)

---

### crc-CharacterFactory.md

**Source Spec:** specs/characters.md (Creation workflow)

**Knows:**
- Default values for new characters

**Does:**
- createNewCharacter(name, description): Create with defaults
- createDefaultAttributes(): All zeros
- createDefaultHollowData(): Starting hollow state
- createDefaultFields(): Empty fields array
- generateUUID(): Unique IDs

**Implementation:**
- **src/character/CharacterUtils.ts**
  - [ ] File header (shared - references multiple CRCs)
  - [x] CharacterFactory class comment → crc-CharacterFactory.md
  - [x] createNewCharacter() method comment
  - [ ] createDefaultAttributes() method comment
  - [ ] createDefaultHollowData() method comment
  - [ ] createDefaultFields() method comment
  - [ ] generateUUID() method comment

**Tests:**
- **src/character/CharacterUtils.test.ts** (does not exist)
  - [ ] File header referencing CRC cards

**Appears in Sequences:**
- (Used in creation flows, not diagrammed in Phase 1)

---

### crc-CharacterVersioning.md

**Source Spec:** specs/characters.md, specs/storage.md (Schema evolution)

**Knows:**
- CHARACTER_SCHEMAS array
- Current app version (from VERSION file)
- Upgrade functions for each version transition

**Does:**
- getCurrentVersion(): Get current version
- getSchemaForVersion(version): Look up schema
- upgradeCharacterToLatest(character): Apply sequential upgrades
- findSchemaIndex(version): Locate in array
- getUpgrader(fromIndex): Get upgrade function
- upgradeToV0_0_17(): v0.0.16 → v0.0.17 (fields.skills → fields.skillEntries)

**Implementation:**
- **src/character/CharacterVersioning.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [x] CharacterVersioning class comment → crc-CharacterVersioning.md
  - [x] ICharacterSchema interface comment
  - [x] ILegacyField interface comment
  - [ ] CHARACTER_SCHEMAS constant comment
  - [ ] getCurrentVersion() method comment
  - [ ] getSchemaForVersion() method comment
  - [ ] upgradeCharacterToLatest() method comment → seq-load-character.md (lines 45-61)
  - [ ] isLatestVersion() method comment
  - [ ] upgradeFromV0_0_16ToV0_0_17() method comment → seq-load-character.md (lines 56-58)
  - [ ] validateCharacterSchema() method comment
  - [ ] getSupportedVersions() method comment

**Tests:**
- **src/character/CharacterVersioning.test.ts** (does not exist)
  - [x] File header referencing CRC card

**Appears in Sequences:**
- seq-load-character.md (lines 45-61)

---

### crc-CharacterHash.md

**Source Spec:** specs/storage.md (Hash-based save optimization)

**Knows:**
- Hash algorithm (SHA-256)
- Sorted JSON serialization

**Does:**
- calculateCharacterHash(character): Generate SHA-256
  - Excludes characterHash field (prevents circular dependency)
  - Uses sortedReplacer for consistent key ordering
- verifyCharacterIntegrity(character, hash): Compare hashes
- sortedReplacer(key, value): Consistent JSON serialization

**Implementation:**
- **src/utils/characterHash.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [ ] calculateCharacterHash() function comment → seq-save-character.md (lines 46-50), seq-load-character.md (lines 68-72)
  - [ ] verifyCharacterIntegrity() function comment
  - [ ] sortedReplacer() function comment

**Tests:**
- **test/characterHash.test.ts**
  - [x] File header referencing CRC card

**Appears in Sequences:**
- seq-save-character.md (lines 46-50)
- seq-load-character.md (lines 68-72)

---

### crc-CharacterEditorView.md

**Source Spec:** specs/ui.characters.md, specs/ui.md

**Knows:**
- character: ICharacter
- originalCharacterHash: string
- hasUnsavedChanges: boolean
- characterSheet: CharacterSheet

**Does:**
- setCharacter(character): Load character
- render(): Render editor
- saveCharacter(): Save to storage
- revertChanges(): Reload from storage
- detectChanges(): Poll for changes (250ms)
- updateButtonStates(): Enable/disable Yep/Nope

**Implementation:**
- **src/ui/CharacterEditorView.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [x] CharacterEditorView class comment → crc-CharacterEditorView.md
  - [x] ICharacterEditor interface comment → crc-CharacterEditorView.md
  - [x] setCharacter() method comment
  - [x] render() method comment → seq-edit-character.md (lines 26-45)
  - [x] saveCharacter() method comment → seq-save-character-ui.md (lines 14-67)
  - [x] revertChanges() method comment → seq-revert-character.md (lines 14-42)
  - [x] detectChanges() method comment
  - [x] updateButtonStates() method comment
  - [x] setupEventListeners() method comment
  - [x] setupChangeTracking() method comment

**Tests:**
- **src/ui/CharacterEditorView.test.ts**
  - [x] File header referencing CRC card

**Appears in Sequences:**
- seq-edit-character.md
- seq-save-character-ui.md
- seq-revert-character.md

---

### crc-CharacterManagerView.md

**Source Spec:** specs/ui.characters.md, specs/ui.md

**Knows:**
- characters: ICharacter[]
- renderCache: Map<string, string>
- isRendering: boolean
- pendingUpdate: boolean

**Does:**
- loadCharacters(): Load all from storage
- render(): Render character list
- renderCharacterCard(character): Render single card
- createNewCharacter(): Create and navigate
- deleteCharacter(id): Remove from storage
- debouncedRender(): Debounced render (250ms)
- clearRenderCache(): Clear cache

**Implementation:**
- **src/ui/CharacterManagerView.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [x] CharacterManagerView class comment → crc-CharacterManagerView.md
  - [x] ICharacterManager interface comment → crc-CharacterManagerView.md
  - [x] loadCharacters() method comment
  - [x] render() method comment → seq-render-character-list.md (lines 18-85)
  - [x] renderCharacterList() method comment → seq-render-character-list.md (lines 45-75)
  - [x] renderCharacterCard() method comment → seq-render-character-list.md (lines 51-71)
  - [x] createNewCharacter() method comment
  - [x] deleteCharacter() method comment
  - [x] debouncedRender() method comment
  - [x] setupListEventListeners() method comment

**Tests:**
- **src/ui/CharacterManagerView.test.ts**
  - [x] File header referencing CRC card

**Appears in Sequences:**
- seq-edit-character.md (lines 7-12)
- seq-render-character-list.md

---

### crc-CharacterSheet.md

**Source Spec:** specs/ui.characters.md, specs/characters.md

**Knows:**
- character: ICharacter
- container: HTMLElement
- callbacks: ICharacterSheetComponent

**Does:**
- render(): Render complete sheet
- updateCharacter(character): Update display
- incrementAttribute(attrType): Increase attribute
- decrementAttribute(attrType): Decrease attribute
- updateResourceDisplays(): Update XP/chips
- updateAttributeButtonStates(): Enable/disable buttons
- exportCharacter(): Download JSON
- importCharacter(): Upload JSON
- validateCharacter(): Check rules

**Implementation:**
- **src/character/CharacterSheet.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [x] CharacterSheet class comment → crc-CharacterSheet.md
  - [x] ICharacterSheet interface comment → crc-CharacterSheet.md
  - [x] render() method comment
  - [x] updateCharacter() method comment
  - [x] incrementAttribute() method comment → seq-increment-attribute.md (lines 14-96)
  - [x] decrementAttribute() method comment
  - [x] updateResourceDisplays() method comment
  - [x] updateAttributeButtonStates() method comment
  - [x] renderAttributes() method comment
  - [x] renderSkills() method comment
  - [x] exportCharacter() method comment
  - [x] importCharacter() method comment
  - [x] validateCharacter() method comment

**Tests:**
- **src/character/CharacterSheet.test.ts** (if exists)
  - [x] File header referencing CRC card

**Appears in Sequences:**
- seq-edit-character.md (lines 33-45)
- seq-increment-attribute.md
- seq-revert-character.md (lines 24-37)

---

### crc-TemplateEngine.md

**Source Spec:** specs/ui.md, specs/coding-standards.md

**Knows:**
- base: string (default: '/templates/')
- templateCache: Map<string, string>

**Does:**
- loadTemplate(filename): Load from server
- renderTemplate(template, data): Replace {{variables}}
- renderTemplateFromFile(filename, data): Load and render
- preloadTemplates(filenames): Preload multiple
- clearCache(): Clear all cached templates

**Implementation:**
- **src/utils/TemplateEngine.ts**
  - [x] File header (CRC + Spec)
  - [x] TemplateEngine class comment → crc-TemplateEngine.md
  - [x] ITemplateEngine interface comment → crc-TemplateEngine.md
  - [x] loadTemplate() method comment
  - [x] renderTemplate() method comment
  - [x] renderTemplateFromFile() method comment
  - [x] preloadTemplates() method comment
  - [x] clearCache() method comment

**Tests:**
- **src/utils/TemplateEngine.test.ts**
  - [x] File header referencing CRC card

**Appears in Sequences:**
- seq-edit-character.md (lines 22-24)
- seq-render-character-list.md (lines 26-31, 54-69)

---

### crc-Router.md

**Source Spec:** specs/ui.md, specs/routes.md

**Knows:**
- routes: IRoute[]
- currentPath: string

**Does:**
- addRoute(pattern, handler): Register route
- navigate(path): Navigate (add to history)
- replace(path): Navigate (replace history)
- initialize(): Start listening
- handleRoute(path): Match and execute
- extractParams(pattern, path): Extract :id parameters

**Implementation:**
- **src/utils/Router.ts**
  - [x] File header (CRC + Spec)
  - [x] Router class comment → crc-Router.md
  - [x] IRouter interface comment → crc-Router.md
  - [x] addRoute() method comment
  - [x] navigate() method comment → seq-edit-character.md (lines 10-13)
  - [x] replace() method comment
  - [x] initialize() method comment
  - [x] handleRoute() method comment
  - [x] extractParams() method comment

**Tests:**
- **src/utils/Router.test.ts** (if exists)
  - [x] File header referencing CRC card

**Appears in Sequences:**
- seq-edit-character.md (lines 10-13)
- seq-render-character-list.md (lines 7-10)

---

### crc-SplashScreen.md

**Source Spec:** specs/ui.splash.md

**Knows:**
- config, currentPeerId, container, DOM elements, audioManager, callbacks

**Does:**
- render(), updatePeerId(), destroy(), initialize()
- setupPeerIdInteraction(), setupButtonInteractions()
- copyPeerIdToClipboard(), showCreditsPopup()

**Implementation:**
- **src/ui/SplashScreen.ts**
  - [ ] File header (CRC + Spec + Sequences)
  - [ ] ISplashScreen interface comment → crc-SplashScreen.md
  - [ ] SplashScreen class comment → crc-SplashScreen.md
  - [ ] render() method comment → seq-app-startup.md
  - [ ] updatePeerId() method comment
  - [ ] setupPeerIdInteraction() method comment
  - [ ] setupButtonInteractions() method comment → seq-navigate-from-splash.md
  - [ ] copyPeerIdToClipboard() method comment
  - [ ] showCreditsPopup() method comment

**Tests:**
- **src/ui/SplashScreen.test.ts**
  - [ ] File header referencing CRC card

**Appears in Sequences:**
- seq-app-startup.md
- seq-navigate-from-splash.md
- seq-play-sound-effect.md

---

### crc-AudioManager.md

**Source Spec:** specs/audio.md

**Knows:**
- musicProviders, gunshotProvider, musicSources, currentTrackIndex
- Volume settings, cycling state, active gunshots, timeouts

**Does:**
- initialize(), playBackgroundMusic(), pauseBackgroundMusic()
- toggleMusic(), playRandomGunshot()
- skipToNextTrack(), skipToPreviousTrack()
- getCurrentTrackInfo(), setCyclingEnabled()

**Implementation:**
- **src/audio/AudioManager.ts**
  - [ ] File header (CRC + Spec + Sequences)
  - [ ] IAudioManager interface comment → crc-AudioManager.md
  - [ ] AudioManager class comment → crc-AudioManager.md
  - [ ] initialize() method comment → seq-app-startup.md
  - [ ] playBackgroundMusic() method comment → seq-play-background-music.md
  - [ ] pauseBackgroundMusic() method comment
  - [ ] toggleMusic() method comment
  - [ ] playRandomGunshot() method comment → seq-play-sound-effect.md
  - [ ] skipToNextTrack() method comment → seq-play-background-music.md
  - [ ] skipToPreviousTrack() method comment
  - [ ] getCurrentTrackInfo() method comment
  - [ ] setCyclingEnabled() method comment
  - [ ] setupAutoAdvance() method comment → seq-play-background-music.md
  - [ ] fadeOutCurrentTrack() method comment

**Tests:**
- **src/audio/AudioManager.test.ts**
  - [ ] File header referencing CRC card

**Appears in Sequences:**
- seq-app-startup.md
- seq-play-background-music.md
- seq-play-sound-effect.md

---

### crc-AudioProvider.md

**Source Spec:** specs/audio.md (implied by AudioManager)

**Knows:**
- audio: HTMLAudioElement, isLoaded: boolean

**Does:**
- load(src), play(), pause(), stop()
- setVolume(), setLoop(), isPlaying()
- getCurrentTime(), getDuration()

**Implementation:**
- **src/audio/AudioManager.ts** (IAudioProvider interface, HTMLAudioProvider class)
  - [ ] File header (CRC + Spec)
  - [ ] IAudioProvider interface comment → crc-AudioProvider.md
  - [ ] HTMLAudioProvider class comment → crc-AudioProvider.md
  - [ ] load() method comment
  - [ ] play() method comment
  - [ ] pause() method comment
  - [ ] stop() method comment
  - [ ] setVolume() method comment
  - [ ] setLoop() method comment
  - [ ] isPlaying() method comment

**Tests:**
- (Tested indirectly through AudioManager tests)

**Appears in Sequences:**
- seq-play-background-music.md (via AudioManager)
- seq-play-sound-effect.md (via AudioManager)

---

### crc-AudioControlUtils.md

**Source Spec:** specs/audio.md (audio control UI)

**Knows:**
- (Stateless utility class)

**Does:**
- toggleMusic(), updateMusicButtonState()
- renderEnhancedAudioControl(), setupEnhancedAudioControls()
- updateEnhancedAudioState(), playButtonSound()

**Implementation:**
- **src/utils/AudioControlUtils.ts**
  - [ ] File header (CRC + Spec + Sequences)
  - [ ] IAudioControlSupport interface comment → crc-AudioControlUtils.md
  - [ ] IEnhancedAudioControlSupport interface comment → crc-AudioControlUtils.md
  - [ ] AudioControlUtils class comment → crc-AudioControlUtils.md
  - [ ] toggleMusic() method comment
  - [ ] updateMusicButtonState() method comment
  - [ ] renderEnhancedAudioControl() method comment → seq-app-startup.md
  - [ ] setupEnhancedAudioControls() method comment
  - [ ] updateEnhancedAudioState() method comment
  - [ ] playButtonSound() method comment → seq-play-sound-effect.md

**Tests:**
- (Tested indirectly through view tests)

**Appears in Sequences:**
- seq-app-startup.md
- seq-play-background-music.md (UI updates)
- seq-navigate-from-splash.md (button sounds)
- seq-play-sound-effect.md

---

### crc-FriendsManager.md

**Source Spec:** specs/friends.md, specs/p2p.md

**Knows:**
- friendsMap: Map<peerId, Friend>
- eventService: EventService
- hollowPeer: HollowPeer

**Does:**
- addFriend(peerId, playerName): Add to friends list
- removeFriend(peerId): Remove from list
- getFriend(peerId): Retrieve friend
- getAllFriends(): Get all friends
- updateFriendStatus(): Update connection state
- loadFriends(): Load from storage
- saveFriends(): Persist to storage

**Implementation:**
- **src/services/FriendsManager.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [x] FriendsManager class comment → crc-FriendsManager.md
  - [x] IFriendsManager interface comment → crc-FriendsManager.md
  - [ ] addFriend() method comment → seq-add-friend-by-peerid.md
  - [ ] removeFriend() method comment
  - [ ] getFriend() method comment
  - [ ] getAllFriends() method comment
  - [ ] updateFriendStatus() method comment → seq-friend-presence-update.md
  - [ ] loadFriends() method comment
  - [ ] saveFriends() method comment

**Tests:**
- **test/FriendsManager.test.ts**
  - [x] File header referencing CRC card

**Appears in Sequences:**
- seq-friend-presence-update.md
- seq-friend-status-change.md
- seq-add-friend-by-peerid.md

---

### crc-FriendsView.md

**Source Spec:** specs/ui.friends.md

**Knows:**
- friendsManager: FriendsManager
- hollowPeer: HollowPeer
- container: HTMLElement

**Does:**
- render(): Render friends list
- renderFriendCard(friend): Render single card
- updateFriendsList(): Refresh display
- handleAddFriend(): Add friend dialog
- handleRemoveFriend(peerId): Remove confirmation
- setupEventListeners(): Wire up UI

**Implementation:**
- **src/ui/FriendsView.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [x] FriendsView class comment → crc-FriendsView.md
  - [x] IFriendsView interface comment → crc-FriendsView.md
  - [ ] render() method comment
  - [ ] renderFriendCard() method comment
  - [ ] updateFriendsList() method comment → seq-friend-presence-update.md
  - [ ] handleAddFriend() method comment → seq-add-friend-by-peerid.md
  - [ ] handleRemoveFriend() method comment
  - [ ] setupEventListeners() method comment

**Tests:**
- (Tested via E2E tests)

**Appears in Sequences:**
- seq-friend-presence-update.md
- seq-add-friend-by-peerid.md

---

### crc-HollowPeer.md

**Source Spec:** specs/p2p.md

**Knows:**
- networkProvider: P2PWebAppNetworkProvider
- peerId: string
- connections: Map<peerId, Connection>
- messageHandlers: Map<protocol, handler>

**Does:**
- initialize(): Start P2P system
- connect(peerId): Establish connection
- disconnect(peerId): Close connection
- send(peerId, protocol, data): Send message
- broadcast(protocol, data): Send to all
- onMessage(protocol, handler): Register handler
- getPeerId(): Get own peer ID

**Implementation:**
- **src/p2p/HollowPeer.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [x] HollowPeer class comment → crc-HollowPeer.md
  - [x] IHollowPeer interface comment → crc-HollowPeer.md
  - [ ] initialize() method comment → seq-establish-p2p-connection.md
  - [ ] connect() method comment → seq-establish-p2p-connection.md
  - [ ] disconnect() method comment
  - [ ] send() method comment → seq-send-receive-p2p-message.md
  - [ ] broadcast() method comment
  - [ ] onMessage() method comment → seq-send-receive-p2p-message.md
  - [ ] getPeerId() method comment

**Tests:**
- (Tested via integration tests)

**Appears in Sequences:**
- seq-establish-p2p-connection.md
- seq-send-receive-p2p-message.md
- seq-friend-presence-update.md

---

### crc-P2PWebAppNetworkProvider.md

**Source Spec:** specs/p2p.md

**Knows:**
- webSocket: WebSocket
- serverUrl: string
- connectionState: ConnectionState

**Does:**
- connect(): Connect to p2p-webapp server
- disconnect(): Close connection
- send(message): Send to server
- onMessage(handler): Register handler
- onConnectionChange(handler): Register handler

**Implementation:**
- **src/p2p/client/client.js** (external p2p-webapp library)
  - [ ] File header (external library)
  - [ ] connect() function
  - [ ] disconnect() function
  - [ ] send() function

**Tests:**
- (External library, tested by p2p-webapp)

**Appears in Sequences:**
- seq-establish-p2p-connection.md
- seq-send-receive-p2p-message.md

---

### crc-P2PMessage.md

**Source Spec:** specs/p2p-messages.md

**Knows:**
- protocol: string
- data: object
- timestamp: number
- senderId: string

**Does:**
- (Interface only - data structure definition)

**Implementation:**
- **src/p2p/types.ts**
  - [x] File header (CRC + Spec)
  - [x] IP2PMessage interface comment
  - [x] IFriendRequestMessage interface comment
  - [x] IFriendResponseMessage interface comment

**Tests:**
- (Interfaces tested indirectly through usage)

**Appears in Sequences:**
- seq-send-receive-p2p-message.md
- seq-friend-status-change.md
- seq-add-friend-by-peerid.md

---

### crc-Friend.md

**Source Spec:** specs/friends.md

**Knows:**
- peerId: string
- playerName: string
- status: FriendStatus
- lastSeen: Date
- connection: Connection

**Does:**
- (Interface only - data structure definition)

**Implementation:**
- **src/services/FriendsManager.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [x] IFriend interface comment
  - [x] FriendStatus enum comment

**Tests:**
- (Interfaces tested indirectly through usage)

**Appears in Sequences:**
- seq-friend-presence-update.md
- seq-friend-status-change.md
- seq-add-friend-by-peerid.md

---

### crc-SettingsView.md

**Source Spec:** specs/ui.settings.md

**Knows:**
- hollowPeer: HollowPeer
- profileService: ProfileService
- logService: LogService
- container: HTMLElement

**Does:**
- render(): Render settings page
- displayPeerId(): Show peer ID
- displayProfiles(): Show profile list
- displayLog(): Show log entries
- handleCreateProfile(): Create new profile
- handleSwitchProfile(): Change profile
- setupEventListeners(): Wire up UI

**Implementation:**
- **src/ui/SettingsView.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [x] SettingsView class comment → crc-SettingsView.md
  - [x] ISettingsView interface comment → crc-SettingsView.md
  - [ ] render() method comment
  - [ ] displayPeerId() method comment
  - [ ] displayProfiles() method comment
  - [ ] displayLog() method comment
  - [ ] handleCreateProfile() method comment
  - [ ] handleSwitchProfile() method comment
  - [ ] setupEventListeners() method comment

**Tests:**
- **test/SettingsView.test.ts**
  - [x] File header referencing CRC card

**Appears in Sequences:**
- seq-friend-status-change.md
- seq-add-friend-by-peerid.md

---

### crc-HollowIPeer.md

**Source Spec:** specs/integrate-textcraft.md

**Knows:**
- hollowPeer: HollowPeer (shared instance)
- messageHandlers: Map<string, handler>

**Does:**
- send(peerId, protocol, data): Send via HollowPeer
- broadcast(protocol, data): Broadcast via HollowPeer
- onMessage(protocol, handler): Register handler
- getPeerId(): Get peer ID from HollowPeer
- connect(peerId): Connect via HollowPeer
- disconnect(peerId): Disconnect via HollowPeer

**Implementation:**
- **src/textcraft/hollow-peer.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [x] HollowIPeer class comment → crc-HollowIPeer.md
  - [ ] send() method comment → seq-textcraft-multiplayer-command.md
  - [ ] broadcast() method comment
  - [ ] onMessage() method comment → seq-textcraft-multiplayer-command.md
  - [ ] getPeerId() method comment
  - [ ] connect() method comment
  - [ ] disconnect() method comment

**Tests:**
- (Tested via TextCraft integration tests)

**Appears in Sequences:**
- seq-textcraft-multiplayer-command.md

---

### crc-CharacterSync.md

**Source Spec:** specs/integrate-textcraft.md

**Knows:**
- characterStorageService: CharacterStorageService
- mudConnection: MudConnection

**Does:**
- syncCharacterToThing(character, thing): Update Thing from Character
- syncThingToCharacter(thing): Update Character from Thing
- getCharacterId(thing): Get reference from Thing
- setCharacterId(thing, id): Store reference in Thing

**Implementation:**
- **src/textcraft/character-sync.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [x] CharacterSync class comment → crc-CharacterSync.md
  - [ ] syncCharacterToThing() method comment → seq-textcraft-character-sync.md
  - [ ] syncThingToCharacter() method comment → seq-textcraft-character-sync.md
  - [ ] getCharacterId() method comment
  - [ ] setCharacterId() method comment

**Tests:**
- (Tested via TextCraft integration tests)

**Appears in Sequences:**
- seq-textcraft-character-sync.md

---

### crc-WorldLoader.md

**Source Spec:** specs/integrate-textcraft.md

**Knows:**
- worldConnections: WorldConnections

**Does:**
- loadWorld(connectionId): Load MUD world
- createWorld(name, description): Create new world
- getAvailableWorlds(): List worlds

**Implementation:**
- **src/textcraft/world-loader.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [x] WorldLoader class comment → crc-WorldLoader.md
  - [ ] loadWorld() method comment → seq-textcraft-solo-command.md
  - [ ] createWorld() method comment
  - [ ] getAvailableWorlds() method comment

**Tests:**
- (Tested via TextCraft integration tests)

**Appears in Sequences:**
- seq-textcraft-solo-command.md
- seq-textcraft-multiplayer-command.md

---

### crc-LocalMudSession.md

**Source Spec:** specs/integrate-textcraft.md

**Knows:**
- mudConnection: MudConnection
- world: World
- player: Thing

**Does:**
- executeCommand(command): Execute in local world
- getOutput(): Get command output
- initialize(): Set up session
- destroy(): Clean up session

**Implementation:**
- **src/textcraft/local-session.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [x] LocalMudSession class comment → crc-LocalMudSession.md
  - [ ] executeCommand() method comment → seq-textcraft-solo-command.md
  - [ ] getOutput() method comment
  - [ ] initialize() method comment
  - [ ] destroy() method comment

**Tests:**
- (Tested via TextCraft integration tests)

**Appears in Sequences:**
- seq-textcraft-solo-command.md

---

### crc-WorldConnections.md

**Source Spec:** specs/integrate-textcraft.md

**Knows:**
- storage: MudStorage (IndexedDB)
- connections: WorldConnection[]

**Does:**
- getConnection(id): Get single connection
- getAllConnections(): Get all connections
- saveConnection(connection): Save to IndexedDB
- deleteConnection(id): Remove from IndexedDB
- getCharactersForWorld(worldId): Get characters

**Implementation:**
- **src/textcraft/world-connections.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [x] WorldConnections class comment → crc-WorldConnections.md
  - [ ] getConnection() method comment
  - [ ] getAllConnections() method comment
  - [ ] saveConnection() method comment
  - [ ] deleteConnection() method comment
  - [ ] getCharactersForWorld() method comment

**Tests:**
- (Tested via TextCraft integration tests)

**Appears in Sequences:**
- seq-textcraft-solo-command.md
- seq-textcraft-multiplayer-command.md

---

### crc-Application.md

**Source Spec:** specs/main.md

**Knows:**
- router: Router
- audioManager: AudioManager
- hollowPeer: HollowPeer
- views: Map<string, View>
- globalAudioControl: GlobalAudioControl
- eventNotificationButton: EventNotificationButton

**Does:**
- initialize(): Bootstrap app
- initializeAudio(): Set up audio (non-blocking)
- initializeP2P(): Set up P2P (non-blocking)
- setupRoutes(): Register all routes
- navigateToView(path): Switch views
- destroy(): Clean up resources

**Implementation:**
- **src/main.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [ ] initialize() function comment → seq-app-startup.md
  - [ ] initializeAudio() function comment → seq-app-startup.md
  - [ ] initializeP2P() function comment → seq-app-startup.md
  - [ ] setupRoutes() function comment → seq-view-transition.md
  - [ ] navigateToView() function comment → seq-view-transition.md

**Tests:**
- (Tested via E2E tests)

**Appears in Sequences:**
- seq-app-startup.md
- seq-view-transition.md

---

### crc-GlobalAudioControl.md

**Source Spec:** specs/audio.md, specs/ui.md

**Knows:**
- audioManager: IAudioManager
- container: HTMLElement
- updateInterval: number

**Does:**
- render(): Render audio controls
- update(): Update display state
- updateContent(): Refresh template
- setupEventListeners(): Wire up controls
- destroy(): Clean up resources

**Implementation:**
- **src/ui/GlobalAudioControl.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [x] GlobalAudioControl class comment → crc-GlobalAudioControl.md
  - [x] IGlobalAudioControl interface comment → crc-GlobalAudioControl.md
  - [ ] render() method comment
  - [ ] update() method comment
  - [ ] updateContent() method comment
  - [ ] setupEventListeners() method comment
  - [ ] destroy() method comment

**Tests:**
- (Tested via E2E tests)

**Appears in Sequences:**
- seq-play-background-music.md

---

### crc-EventNotificationButton.md

**Source Spec:** specs/ui.settings.md, specs/friends.md

**Knows:**
- eventService: EventService
- button: HTMLButtonElement
- badge: HTMLSpanElement

**Does:**
- render(): Render button with badge
- updateCount(): Update badge count
- destroy(): Clean up resources

**Implementation:**
- **src/ui/EventNotificationButton.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [x] EventNotificationButton class comment → crc-EventNotificationButton.md
  - [x] IEventNotificationButton interface comment → crc-EventNotificationButton.md
  - [ ] render() method comment
  - [ ] updateCount() method comment
  - [ ] destroy() method comment

**Tests:**
- (Tested via E2E tests)

**Appears in Sequences:**
- seq-friend-status-change.md
- seq-add-friend-by-peerid.md

---

### crc-EventModal.md

**Source Spec:** specs/ui.settings.md, specs/friends.md

**Knows:**
- eventService: EventService
- hollowPeer: HollowPeer
- modal: HTMLDivElement

**Does:**
- render(): Render modal
- show(): Display modal
- hide(): Hide modal
- updateEventList(): Refresh events
- renderEventCard(event): Render single card
- attachEventCardListeners(): Wire up handlers
- destroy(): Clean up resources

**Implementation:**
- **src/ui/EventModal.ts**
  - [x] File header (CRC + Spec + Sequences)
  - [x] EventModal class comment → crc-EventModal.md
  - [x] IEventModal interface comment → crc-EventModal.md
  - [ ] render() method comment
  - [ ] show() method comment
  - [ ] hide() method comment
  - [ ] updateEventList() method comment
  - [ ] renderEventCard() method comment → seq-friend-status-change.md
  - [ ] attachEventCardListeners() method comment
  - [ ] destroy() method comment

**Tests:**
- (Tested via E2E tests)

**Appears in Sequences:**
- seq-friend-status-change.md
- seq-add-friend-by-peerid.md

---

## Level 2 ↔ Level 3 (Sequence Diagrams to Code)

### seq-save-character.md

**Source Spec:** specs/characters.md, specs/storage.md

**Participants and Line Numbers:**

- **User** (lines 22-23, 100-101)
  - External actor

- **CharacterEditorView** (lines 22-101)
  - Implementation: `src/ui/CharacterEditorView.ts`
  - [x] saveCharacter() method references seq-save-character.md (lines 22-101)

- **CharacterValidation** (lines 25-33)
  - Implementation: `src/character/CharacterUtils.ts` (CharacterValidation class)
  - [x] validateCharacterCreation() method references seq-save-character.md (lines 25-33)

- **CharacterStorageService** (lines 43-97)
  - Implementation: `src/services/CharacterStorageService.ts`
  - [x] saveCharacter() method references seq-save-character.md (lines 43-97)

- **CharacterHash** (lines 46-50)
  - Implementation: `src/utils/characterHash.ts`
  - [x] calculateCharacterHash() function references seq-save-character.md (via file header)

- **ProfileService** (lines 68-94)
  - Implementation: `src/services/ProfileService.ts`
  - [ ] getItem() method may reference save/load sequences (lines 68-78)
  - [ ] setItem() method may reference save/log sequences (lines 84-94)

- **LocalStorage** (lines 72-91)
  - Browser API (no implementation)

**Key Flow:**
- Lines 25-33: Validation
- Lines 46-50: Hash calculation
- Lines 54-57: Hash comparison (early return if unchanged)
- Lines 60-66: Update hash and timestamp (when changed)
- Lines 68-94: Persist to storage

---

### seq-load-character.md

**Source Spec:** specs/characters.md, specs/storage.md

**Participants and Line Numbers:**

- **User** (lines 23-24, 84-85)
  - External actor

- **CharacterManagerView** (lines 23-82)
  - Implementation: `src/ui/CharacterManagerView.ts`
  - [ ] loadCharacters() or similar method references seq-load-character.md

- **CharacterStorageService** (lines 26-78)
  - Implementation: `src/services/CharacterStorageService.ts`
  - [x] getAllCharacters() method references seq-load-character.md (lines 26-78)
  - [x] validateAndFixCharacter() method references seq-load-character.md (lines 68-76)

- **ProfileService** (lines 29-38)
  - Implementation: `src/services/ProfileService.ts`
  - [ ] getItem() method may reference load sequences (lines 29-38)

- **LocalStorage** (lines 32-36)
  - Browser API (no implementation)

- **CharacterVersioning** (lines 45-61)
  - Implementation: `src/character/CharacterVersioning.ts`
  - [x] upgradeCharacterToLatest() method references seq-load-character.md (lines 45-61)
  - [ ] findSchemaIndex() method references seq-load-character.md (lines 52-54)
  - [x] upgradeFromV0_0_16ToV0_0_17() method references seq-load-character.md (lines 56-58)

- **CharacterHash** (lines 68-72)
  - Implementation: `src/utils/characterHash.ts`
  - [x] calculateCharacterHash() function references seq-load-character.md (via file header)

- **CharacterEditorView** (lines 82-85)
  - Implementation: `src/ui/CharacterEditorView.ts`
  - [ ] Navigation/display method may reference load sequence

**Key Flow:**
- Lines 26-38: Load from storage
- Lines 45-61: Version migration
- Lines 68-76: Hash initialization
- Lines 82-85: Navigate to editor

---

### seq-validate-character.md

**Source Spec:** specs/characters.md

**Participants and Line Numbers:**

- **CharacterEditorView** (lines 18-58)
  - Implementation: `src/ui/CharacterEditorView.ts`
  - [ ] Some validation trigger method references seq-validate-character.md

- **CharacterValidation** (lines 18-58)
  - Implementation: `src/character/CharacterUtils.ts` (CharacterValidation class)
  - [x] validateCharacterCreation() method references seq-validate-character.md (lines 18-58)
  - [ ] Attribute validation logic references lines 25-27
  - [x] validateSkillPrerequisites() method references lines 40-41
  - [x] validateFields() method references lines 43-45
  - [ ] Chip economy validation logic references lines 53-55

- **CharacterCalculations** (lines 33-51)
  - Implementation: `src/character/CharacterUtils.ts` (CharacterCalculations class)
  - [ ] calculateAttributeTotal() method references seq-validate-character.md (lines 33-37)
  - [ ] calculateChipCost() method references seq-validate-character.md (lines 47-51)

**Key Flow:**
- Lines 18-27: Attribute validation
- Lines 33-37: Attribute total calculation
- Lines 40-41: Skill prerequisites
- Lines 43-45: Fields structure
- Lines 47-55: Chip economy

---

### seq-log-message.md

**Source Spec:** specs/logging.md

**Participants and Line Numbers:**

- **Application** (lines 19-64)
  - Any component that logs (no specific implementation)

- **LogService** (lines 19-64)
  - Implementation: `src/services/LogService.ts`
  - [ ] log() method references seq-log-message.md (lines 19-64)
  - [ ] Serial increment logic references lines 22-24
  - [ ] Entry creation logic references lines 26-28
  - [ ] Append logic references lines 30-32
  - [ ] Size calculation logic references lines 34-36
  - [ ] Trimming logic references lines 39-49
  - [ ] Persistence logic references lines 51-61

- **ProfileService** (lines 51-61)
  - Implementation: `src/services/ProfileService.ts`
  - [ ] setItem() method references log sequence (lines 51-61)

- **LocalStorage** (lines 54-58)
  - Browser API (no implementation)

**Key Flow:**
- Lines 19-36: Add entry with serial number
- Lines 39-49: Trim if > 512KB
- Lines 51-61: Persist to storage

---

### seq-edit-character.md

**Source Spec:** specs/ui.characters.md

**Participants and Line Numbers:**

- **User** (lines 1-53)
  - Interaction: Clicks character card

- **CharacterManagerView** (lines 7-12)
  - Implementation: `src/ui/CharacterManagerView.ts`
  - [ ] setupListEventListeners() references seq-edit-character.md (lines 7-12)
  - [ ] onCharacterSelected() callback

- **Router** (lines 10-13)
  - Implementation: `src/utils/Router.ts`
  - [ ] navigate() method references seq-edit-character.md (lines 10-13)

- **CharacterEditorView** (lines 16-53)
  - Implementation: `src/ui/CharacterEditorView.ts`
  - [ ] constructor references lines 16-20
  - [ ] render() method references lines 22-24
  - [ ] setCharacter() method references lines 28-32
  - [ ] setupEventListeners() method references lines 41-44
  - [ ] setupChangeTracking() method references lines 46-53

- **CharacterStorageService** (lines 26-27)
  - Implementation: `src/services/CharacterStorageService.ts`
  - [ ] getCharacter() method references seq-edit-character.md (lines 26-27)

- **CharacterSheet** (lines 33-45)
  - Implementation: `src/character/CharacterSheet.ts`
  - [ ] constructor references lines 33-40
  - [ ] render() method references lines 35-40

**Key Flow:**
- Lines 7-13: Navigation from character list to editor
- Lines 16-32: Editor initialization and character loading
- Lines 33-45: CharacterSheet embedded rendering
- Lines 46-53: Change tracking setup (250ms polling)

---

### seq-save-character-ui.md

**Source Spec:** specs/ui.characters.md, specs/ui.md

**Participants and Line Numbers:**

- **User** (lines 1-67)
  - Interaction: Clicks "Yep" button

- **CharacterEditorView** (lines 9-67)
  - Implementation: `src/ui/CharacterEditorView.ts`
  - [ ] setupEventListeners() references button handler (lines 9-11)
  - [ ] saveCharacter() method references seq-save-character-ui.md (lines 14-67)
  - [ ] showValidationWarning() method references lines 27-32
  - [ ] updateButtonStates() method references lines 48-50
  - [ ] updateWorldCharacter() method references lines 55-58

- **CharacterSheet** (lines 16-17)
  - Implementation: `src/character/CharacterSheet.ts`
  - [ ] getCharacter() method retrieves current state

- **CharacterValidation** (lines 19-25)
  - Implementation: `src/character/CharacterUtils.ts`
  - [ ] validateCharacterCreation() method references seq-save-character-ui.md (lines 19-25)

- **EventService** (lines 27-32)
  - Implementation: `src/services/EventService.ts`
  - [ ] addEvent() method for validation warnings

- **CharacterStorageService** (lines 36-40)
  - Implementation: `src/services/CharacterStorageService.ts`
  - [ ] saveCharacter() method references seq-save-character-ui.md (lines 36-40)

**Key Flow:**
- Lines 14-25: Validation (non-blocking)
- Lines 27-34: Show warnings but allow save
- Lines 36-46: Save to storage and update hash
- Lines 48-50: Update button states
- Lines 55-58: Sync to MUD world (optional)

---

### seq-render-character-list.md

**Source Spec:** specs/ui.characters.md

**Participants and Line Numbers:**

- **User** (lines 1-92)
  - Interaction: Navigates to /characters

- **Router** (lines 7-10)
  - Implementation: `src/utils/Router.ts`
  - [ ] navigate() method references seq-render-character-list.md (lines 7-10)

- **CharacterManagerView** (lines 12-92)
  - Implementation: `src/ui/CharacterManagerView.ts`
  - [ ] constructor references lines 12-15
  - [ ] loadCharacters() method references lines 18-25
  - [ ] render() method references lines 29-85
  - [ ] renderCharacterList() method references lines 45-75
  - [ ] renderCharacterCard() method references lines 51-71
  - [ ] setupListEventListeners() method references lines 79-85

- **CharacterStorageService** (lines 19-24)
  - Implementation: `src/services/CharacterStorageService.ts`
  - [ ] getAllCharacters() method references seq-render-character-list.md (lines 19-24)

- **TemplateEngine** (lines 26-31, 54-69)
  - Implementation: `src/utils/TemplateEngine.ts`
  - [ ] renderTemplateFromFile() method references lines 26-31
  - [ ] renderTemplate() method references lines 54-69

- **CharacterCalculations** (lines 55-58)
  - Implementation: `src/character/CharacterUtils.ts`
  - [ ] calculateAvailableXP() method references lines 55-56
  - [ ] calculateDamageCapacity() method references lines 57-58

**Key Flow:**
- Lines 7-10: Router navigation
- Lines 12-25: Load all characters
- Lines 29-45: Render list structure
- Lines 51-75: Render each card with caching
- Lines 79-85: Setup event listeners

---

### seq-increment-attribute.md

**Source Spec:** specs/ui.characters.md

**Participants and Line Numbers:**

- **User** (lines 1-96)
  - Interaction: Clicks + button or scrolls mouse wheel

- **CharacterSheet** (lines 7-96)
  - Implementation: `src/character/CharacterSheet.ts`
  - [ ] renderAttributes() sets up listeners (lines 7-9)
  - [ ] incrementAttribute() method references seq-increment-attribute.md (lines 14-96)
  - [ ] updateResourceDisplays() method references lines 71-83
  - [ ] updateAttributeButtonStates() method references lines 85-93

- **ATTRIBUTE_DEFINITIONS** (lines 21-23)
  - Implementation: `src/character/types.ts`
  - Constant data for costs

- **CharacterCalculations** (lines 28-48)
  - Implementation: `src/character/CharacterUtils.ts`
  - [ ] calculateTotalAttributeChipsForRank() method references lines 28-29
  - [ ] calculateTotalAttributeCosts() method references lines 31-33
  - [ ] calculateAvailableXP() method references lines 40-45

**Key Flow:**
- Lines 14-19: Get current value and check range
- Lines 21-23: Get attribute cost (1, 3, or 4)
- Lines 28-48: Calculate available resources
- Lines 50-55: Check resource availability
- Lines 57-60: Increment attribute
- Lines 62-93: Update displays and button states

---

### seq-revert-character.md

**Source Spec:** specs/ui.characters.md, specs/storage.md

**Participants and Line Numbers:**

- **User** (lines 1-51)
  - Interaction: Clicks "Nope" button

- **CharacterEditorView** (lines 7-51)
  - Implementation: `src/ui/CharacterEditorView.ts`
  - [ ] setupEventListeners() references button handler (lines 7-9)
  - [ ] revertChanges() method references seq-revert-character.md (lines 14-51)
  - [ ] updateButtonStates() method references lines 37-41

- **CharacterStorageService** (lines 16-22)
  - Implementation: `src/services/CharacterStorageService.ts`
  - [ ] getCharacter() method references seq-revert-character.md (lines 16-22)

- **calculateCharacterHash** (lines 25-27)
  - Implementation: `src/utils/characterHash.ts`
  - [ ] calculateCharacterHash() function references seq-revert-character.md (lines 25-27)

- **CharacterSheet** (lines 32-37)
  - Implementation: `src/character/CharacterSheet.ts`
  - [ ] updateCharacter() method references seq-revert-character.md (lines 32-37)

**Key Flow:**
- Lines 14-22: Load original from storage
- Lines 25-30: Update hash and state
- Lines 32-37: Refresh all displays
- Lines 39-41: Disable buttons

---

### seq-app-startup.md

**Source Spec:** specs/ui.splash.md, specs/audio.md

**Participants and Line Numbers:**

- **main.ts** (entire sequence)
  - Implementation: `src/main.ts`
  - [ ] initializeAudio() function references seq-app-startup.md
  - [ ] AudioManager initialization references seq-app-startup.md

- **SplashScreen** (rendering phase)
  - Implementation: `src/ui/SplashScreen.ts`
  - [ ] render() method references seq-app-startup.md

- **AudioManager** (initialization phase)
  - Implementation: `src/audio/AudioManager.ts`
  - [ ] initialize() method references seq-app-startup.md
  - [ ] playBackgroundMusic() method references seq-app-startup.md

- **AudioControlUtils** (control setup)
  - Implementation: `src/utils/AudioControlUtils.ts`
  - [ ] renderEnhancedAudioControl() references seq-app-startup.md
  - [ ] setupEnhancedAudioControls() references seq-app-startup.md

**Key Flow:**
- Audio initialization in background (non-blocking)
- SplashScreen renders with audio controls injected
- P2P initialization in background (non-blocking)

---

### seq-navigate-from-splash.md

**Source Spec:** specs/ui.splash.md, specs/routes.md

**Participants and Line Numbers:**

- **SplashScreen** (button click handling)
  - Implementation: `src/ui/SplashScreen.ts`
  - [ ] setupButtonInteractions() method references seq-navigate-from-splash.md

- **AudioControlUtils** (button sounds)
  - Implementation: `src/utils/AudioControlUtils.ts`
  - [ ] playButtonSound() method references seq-navigate-from-splash.md

- **Router** (navigation)
  - Implementation: `src/utils/Router.ts`
  - [ ] navigate() method references seq-navigate-from-splash.md

**Key Flow:**
- Button click → play sound → callback → Router.navigate()
- Old view destroyed, new view rendered
- Audio controls persist across navigation

---

### seq-play-background-music.md

**Source Spec:** specs/audio.md

**Participants and Line Numbers:**

- **AudioManager** (playback control)
  - Implementation: `src/audio/AudioManager.ts`
  - [ ] playBackgroundMusic() method references seq-play-background-music.md
  - [ ] setupAutoAdvance() method references seq-play-background-music.md
  - [ ] skipToNextTrack() method references seq-play-background-music.md
  - [ ] fadeOutCurrentTrack() method references seq-play-background-music.md

- **HTMLAudioProvider** (audio playback)
  - Implementation: `src/audio/AudioManager.ts` (HTMLAudioProvider class)
  - [ ] play() method references seq-play-background-music.md
  - [ ] pause() method references seq-play-background-music.md

- **AudioControlUtils** (UI updates)
  - Implementation: `src/utils/AudioControlUtils.ts`
  - [ ] updateEnhancedAudioState() method references seq-play-background-music.md

**Key Flow:**
- Play → setup auto-advance → track ends → fade out → next track
- Manual next/previous with same fade behavior
- Cycling can be toggled on/off

---

### seq-play-sound-effect.md

**Source Spec:** specs/audio.md

**Participants and Line Numbers:**

- **AudioControlUtils** (button sound trigger)
  - Implementation: `src/utils/AudioControlUtils.ts`
  - [ ] playButtonSound() method references seq-play-sound-effect.md

- **AudioManager** (gunshot playback)
  - Implementation: `src/audio/AudioManager.ts`
  - [ ] playRandomGunshot() method references seq-play-sound-effect.md

**Key Flow:**
- Button click → playButtonSound() → playRandomGunshot()
- Generate random variations (pitch, volume, duration, delay)
- 30% chance of reverb effect
- Interrupt previous gunshot

---

### seq-establish-p2p-connection.md

**Source Spec:** specs/p2p.md

**Participants and Line Numbers:**

- **User** (interaction start)
  - External actor

- **Application** (main.ts initialization)
  - Implementation: `src/main.ts`
  - [ ] initializeP2P() function references seq-establish-p2p-connection.md

- **HollowPeer** (P2P coordination)
  - Implementation: `src/p2p/HollowPeer.ts`
  - [ ] initialize() method references seq-establish-p2p-connection.md
  - [ ] connect() method references seq-establish-p2p-connection.md

- **P2PWebAppNetworkProvider** (WebSocket connection)
  - Implementation: `src/p2p/client/client.js` (external)
  - [ ] connect() function references seq-establish-p2p-connection.md

**Key Flow:**
- Non-blocking P2P initialization during app startup
- Connect to p2p-webapp server via WebSocket
- Obtain peer ID from server
- Register message handlers

---

### seq-send-receive-p2p-message.md

**Source Spec:** specs/p2p.md, specs/p2p-messages.md

**Participants and Line Numbers:**

- **Sender** (user/app sending message)
  - Any component using HollowPeer

- **HollowPeer** (sender side)
  - Implementation: `src/p2p/HollowPeer.ts`
  - [ ] send() method references seq-send-receive-p2p-message.md

- **P2PWebAppNetworkProvider** (network transport)
  - Implementation: `src/p2p/client/client.js` (external)
  - [ ] send() function references seq-send-receive-p2p-message.md

- **P2PWebAppServer** (relay server)
  - External server (p2p-webapp)

- **HollowPeer** (receiver side)
  - Implementation: `src/p2p/HollowPeer.ts`
  - [ ] onMessage() method references seq-send-receive-p2p-message.md

- **MessageHandler** (application logic)
  - Various handlers registered via onMessage()

**Key Flow:**
- Send message via protocol handler
- Relay through p2p-webapp server
- Deliver to target peer
- Invoke registered message handler

---

### seq-friend-presence-update.md

**Source Spec:** specs/friends.md

**Participants and Line Numbers:**

- **P2PWebAppServer** (connection events)
  - External server

- **HollowPeer** (connection monitoring)
  - Implementation: `src/p2p/HollowPeer.ts`
  - [ ] Connection event handlers reference seq-friend-presence-update.md

- **FriendsManager** (status updates)
  - Implementation: `src/services/FriendsManager.ts`
  - [ ] updateFriendStatus() method references seq-friend-presence-update.md

- **FriendsView** (UI updates)
  - Implementation: `src/ui/FriendsView.ts`
  - [ ] updateFriendsList() method references seq-friend-presence-update.md

**Key Flow:**
- Peer connects/disconnects from server
- Connection event received via HollowPeer
- FriendsManager updates friend status
- FriendsView refreshes display

---

### seq-friend-status-change.md

**Source Spec:** specs/friends.md

**Participants and Line Numbers:**

- **HollowPeer** (message receiver)
  - Implementation: `src/p2p/HollowPeer.ts`
  - [ ] onMessage() handler for friend protocol

- **FriendsManager** (state updates)
  - Implementation: `src/services/FriendsManager.ts`
  - [ ] Friend request/response handlers

- **EventService** (event creation)
  - Implementation: `src/services/EventService.ts`
  - [ ] addEvent() method for friend events

- **EventNotificationButton** (badge update)
  - Implementation: `src/ui/EventNotificationButton.ts`
  - [ ] updateCount() method references seq-friend-status-change.md

- **EventModal** (event display)
  - Implementation: `src/ui/EventModal.ts`
  - [ ] renderEventCard() method references seq-friend-status-change.md

- **SettingsView** (event handlers)
  - Implementation: `src/ui/SettingsView.ts`
  - [ ] Event action handlers reference seq-friend-status-change.md

**Key Flow:**
- Receive friend request/accepted/declined message
- Create event in EventService
- Update notification button badge
- Display event card in modal
- User accepts/declines via event card actions

---

### seq-add-friend-by-peerid.md

**Source Spec:** specs/friends.md

**Participants and Line Numbers:**

- **User** (initiates friend request)
  - External actor

- **FriendsView** (UI interaction)
  - Implementation: `src/ui/FriendsView.ts`
  - [ ] handleAddFriend() method references seq-add-friend-by-peerid.md

- **HollowPeer** (send request)
  - Implementation: `src/p2p/HollowPeer.ts`
  - [ ] send() method for friend request protocol

- **Remote HollowPeer** (receive request)
  - Remote peer instance

- **Remote FriendsManager** (process request)
  - Remote FriendsManager instance

- **Remote EventService** (create event)
  - Remote EventService instance

- **Remote EventModal** (display event)
  - Implementation: `src/ui/EventModal.ts`
  - [ ] renderEventCard() method for friend request

- **Remote User** (accepts request)
  - External actor on remote peer

- **SettingsView** (event action handler)
  - Implementation: `src/ui/SettingsView.ts`
  - [ ] Accept friend action handler

- **FriendsManager** (local, add friend)
  - Implementation: `src/services/FriendsManager.ts`
  - [ ] addFriend() method references seq-add-friend-by-peerid.md

- **EventService** (local, create accepted event)
  - Implementation: `src/services/EventService.ts`
  - [ ] addEvent() for friend accepted

- **EventNotificationButton** (local, update badge)
  - Implementation: `src/ui/EventNotificationButton.ts`
  - [ ] updateCount() method

**Key Flow:**
- User enters peer ID and sends friend request
- Request sent via P2P to remote peer
- Remote peer creates event and displays in modal
- Remote user accepts via event card
- Acceptance message sent back
- Local peer adds friend and creates "accepted" event
- Both peers update UI

---

### seq-textcraft-solo-command.md

**Source Spec:** specs/integrate-textcraft.md

**Participants and Line Numbers:**

- **User** (types command)
  - External actor

- **AdventureView** (command input)
  - Implementation: `src/ui/AdventureView.ts` (if exists)
  - [ ] Command input handler

- **LocalMudSession** (execute command)
  - Implementation: `src/textcraft/local-session.ts`
  - [ ] executeCommand() method references seq-textcraft-solo-command.md

- **MudConnection** (world interface)
  - TextCraft library component

- **World** (game world)
  - TextCraft library component

- **WorldLoader** (world access)
  - Implementation: `src/textcraft/world-loader.ts`
  - [ ] loadWorld() method references seq-textcraft-solo-command.md

- **WorldConnections** (persistence)
  - Implementation: `src/textcraft/world-connections.ts`
  - [ ] World retrieval methods

**Key Flow:**
- User types command in solo mode
- LocalMudSession executes in local world
- No network communication required
- Output returned to UI

---

### seq-textcraft-multiplayer-command.md

**Source Spec:** specs/integrate-textcraft.md

**Participants and Line Numbers:**

- **User** (types command)
  - External actor

- **AdventureView** (command input)
  - Implementation: `src/ui/AdventureView.ts` (if exists)
  - [ ] Command input handler

- **HostMudSession** (host execution)
  - Implementation: `src/textcraft/host-session.ts` (if exists)
  - [ ] Execute and broadcast

- **HollowIPeer** (P2P adapter)
  - Implementation: `src/textcraft/hollow-peer.ts`
  - [ ] send() method references seq-textcraft-multiplayer-command.md
  - [ ] onMessage() method references seq-textcraft-multiplayer-command.md

- **HollowPeer** (P2P infrastructure)
  - Implementation: `src/p2p/HollowPeer.ts`
  - [ ] P2P message routing for /hollow-mud/1.0.0 protocol

- **GuestMudSession** (guest execution)
  - Implementation: `src/textcraft/guest-session.ts` (if exists)
  - [ ] Apply command effects

**Key Flow:**
- Host executes command locally in world
- Command broadcast to guests via /hollow-mud/1.0.0 protocol
- Guests receive and apply command effects
- All peers see synchronized world state

---

### seq-textcraft-character-sync.md

**Source Spec:** specs/integrate-textcraft.md

**Participants and Line Numbers:**

- **CharacterEditorView** (save trigger)
  - Implementation: `src/ui/CharacterEditorView.ts`
  - [ ] saveCharacter() may trigger sync

- **CharacterStorageService** (save character)
  - Implementation: `src/services/CharacterStorageService.ts`
  - [ ] saveCharacter() method

- **CharacterSync** (synchronization)
  - Implementation: `src/textcraft/character-sync.ts`
  - [ ] syncCharacterToThing() method references seq-textcraft-character-sync.md
  - [ ] syncThingToCharacter() method references seq-textcraft-character-sync.md

- **CharacterManager** (lookup Thing)
  - TextCraft library component

- **Thing** (player object)
  - TextCraft library component

- **MudConnection** (world access)
  - TextCraft library component

**Key Flow:**
- Bidirectional synchronization between CharacterSheet and Thing
- Thing stores characterId reference, not full data
- Character changes update Thing attributes
- Thing changes can update Character (future enhancement)

---

### seq-view-transition.md

**Source Spec:** specs/main.md, specs/routes.md

**Participants and Line Numbers:**

- **User** (navigation trigger)
  - External actor (clicks button, enters URL, etc.)

- **Browser** (URL change)
  - Browser navigation API

- **Router** (route matching)
  - Implementation: `src/utils/Router.ts`
  - [ ] handleRoute() method references seq-view-transition.md
  - [ ] navigate() method references seq-view-transition.md

- **Application** (view orchestration)
  - Implementation: `src/main.ts`
  - [ ] navigateToView() function references seq-view-transition.md
  - [ ] setupRoutes() function references seq-view-transition.md

- **OldView** (cleanup)
  - Any View implementation
  - [ ] destroy() method

- **NewView** (render)
  - Any View implementation
  - [ ] render() method

- **TemplateEngine** (template loading)
  - Implementation: `src/utils/TemplateEngine.ts`
  - [ ] renderTemplateFromFile() method

- **DOM** (display)
  - Browser DOM API

**Key Flow:**
- User triggers navigation (button click, URL change)
- Router matches route pattern
- Application destroys old view
- Application creates and renders new view
- TemplateEngine loads and renders template
- New view displayed in DOM
- Audio controls and event button persist across views

---

### crc-AdventureMode.md

**Source Spec:** specs/game-worlds.md (lines 66-73)

**Knows:**
- currentView: which view is active (world list or adventure)
- selectedWorld: currently selected MUD world instance
- router: Router instance for navigation
- worldListView: WorldListView instance
- adventureView: AdventureView instance

**Does:**
- initialize(): Set up router integration and create child views
- showWorldList(): Display world list overlay
- showAdventure(worldId): Display adventure view for specified world
- handleWorldSelection(worldId): Switch from world list to adventure view
- handleBackToList(): Switch from adventure view to world list
- cleanup(): Dispose of resources when leaving adventure mode

**Implementation:**
- **src/ui/AdventureMode.ts** (to be created)
  - [ ] File header (CRC + Spec + Sequences)
  - [ ] AdventureMode class comment → crc-AdventureMode.md
  - [ ] initialize() method comment → seq-start-adventure-mode.md
  - [ ] showWorldList() method comment → seq-start-adventure-mode.md, seq-switch-to-world-list.md
  - [ ] showAdventure() method comment → seq-select-world.md
  - [ ] handleWorldSelection() method comment → seq-select-world.md
  - [ ] handleBackToList() method comment → seq-switch-to-world-list.md
  - [ ] cleanup() method comment

**Tests:**
- **src/ui/AdventureMode.test.ts** (to be created)
  - [ ] File header referencing CRC card

**Appears in Sequences:**
- seq-start-adventure-mode.md
- seq-select-world.md
- seq-switch-to-world-list.md

**UI Spec:** ui-adventure-mode.md

---

### crc-AdventureView.md

**Source Spec:** specs/game-worlds.md (lines 75-108)

**Knows:**
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

**Does:**
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

**Implementation:**
- **src/ui/AdventureView.ts** (exists - needs refactoring to extract world list)
  - [ ] File header (CRC + Spec + Sequences)
  - [ ] AdventureView class comment → crc-AdventureView.md
  - [ ] render() method comment → seq-select-world.md
  - [ ] renderBanner() method comment
  - [ ] renderOutput() method comment
  - [ ] renderCommandInput() method comment
  - [ ] handleCommand() method comment → seq-send-command.md
  - [ ] handleCommandHistory() method comment
  - [ ] displayOutput() method comment → seq-send-command.md
  - [ ] handleWorldsButton() method comment → seq-switch-to-world-list.md
  - [ ] handleBackButton() method comment
  - [ ] startSession() method comment → seq-host-session.md, seq-join-session.md
  - [ ] cleanup() method comment

**Tests:**
- **src/ui/AdventureView.test.ts** (may exist - needs update)
  - [ ] File header referencing CRC card

**Appears in Sequences:**
- seq-select-world.md
- seq-send-command.md
- seq-host-session.md
- seq-join-session.md
- seq-switch-to-world-list.md

**UI Spec:** ui-adventure-view.md

---

### crc-WorldListView.md

**Source Spec:** specs/game-worlds.md (lines 110-136)

**Knows:**
- worlds: Array of available MUD worlds
- selectedWorldId: ID of world user has selected
- templateEngine: TemplateEngine instance for rendering
- mudStorage: MudStorage instance for persistence

**Does:**
- render(): Display world list overlay with header and world items
- renderWorldItem(world): Display single world row with controls
- renderCharacterDropdown(world): Display character selection dropdown for world
- handleStartWorld(worldId): Load world and navigate to adventure view
- handleNewWorld(): Open create world modal
- handleEditWorld(worldId): Open world settings modal
- handleDeleteWorld(worldId): Open delete confirmation modal
- handleCharacterSelection(worldId, characterId): Link character to world connection
- handleUnlinkCharacter(worldId, characterId): Remove character from world connection
- loadWorlds(): Fetch all worlds from MudStorage
- cleanup(): Dispose of resources

**Implementation:**
- **src/ui/WorldListView.ts** (to be created - extract from AdventureView)
  - [ ] File header (CRC + Spec + Sequences)
  - [ ] WorldListView class comment → crc-WorldListView.md
  - [ ] render() method comment → seq-start-adventure-mode.md, seq-switch-to-world-list.md
  - [ ] renderWorldItem() method comment
  - [ ] renderCharacterDropdown() method comment
  - [ ] handleStartWorld() method comment → seq-select-world.md
  - [ ] handleNewWorld() method comment → seq-create-world.md
  - [ ] handleEditWorld() method comment → seq-edit-world-settings.md
  - [ ] handleDeleteWorld() method comment → seq-delete-world.md
  - [ ] handleCharacterSelection() method comment
  - [ ] handleUnlinkCharacter() method comment
  - [ ] loadWorlds() method comment → seq-start-adventure-mode.md
  - [ ] cleanup() method comment

**Tests:**
- **src/ui/WorldListView.test.ts** (to be created)
  - [ ] File header referencing CRC card

**Appears in Sequences:**
- seq-start-adventure-mode.md
- seq-select-world.md
- seq-create-world.md
- seq-edit-world-settings.md
- seq-delete-world.md
- seq-switch-to-world-list.md

**UI Spec:** ui-world-list-view.md

---

### crc-CreateWorldModal.md

**Source Spec:** specs/game-worlds.md (lines 126-128)

**Knows:**
- modalContainer: DOM element for modal overlay
- templateEngine: TemplateEngine instance for rendering
- worldName: User-entered name for new world
- worldDescription: User-entered description
- isYamlImport: Whether creating from YAML or blank template

**Does:**
- show(): Display create world modal dialog
- hide(): Close modal and remove overlay
- render(): Display form with name, description, YAML option
- handleCreate(): Validate input and create new world with default settings
- handleCancel(): Close modal without creating world
- handleYamlSelect(): Allow user to select YAML file for import
- createDefaultWorld(): Create blank world with minimal starter content
- importYamlWorld(file): Parse YAML and create world from file

**Implementation:**
- **src/ui/CreateWorldModal.ts** (to be created)
  - [ ] File header (CRC + Spec + Sequences)
  - [ ] CreateWorldModal class comment → crc-CreateWorldModal.md
  - [ ] show() method comment → seq-create-world.md
  - [ ] hide() method comment → seq-create-world.md
  - [ ] render() method comment → seq-create-world.md
  - [ ] handleCreate() method comment → seq-create-world.md
  - [ ] handleCancel() method comment → seq-create-world.md
  - [ ] handleYamlSelect() method comment
  - [ ] createDefaultWorld() method comment
  - [ ] importYamlWorld() method comment

**Tests:**
- **src/ui/CreateWorldModal.test.ts** (to be created)
  - [ ] File header referencing CRC card

**Appears in Sequences:**
- seq-create-world.md

**UI Spec:** ui-create-world-modal.md

---

### crc-WorldSettingsModal.md

**Source Spec:** specs/game-worlds.md (line 127)

**Knows:**
- worldId: ID of world being edited
- world: World instance being edited
- modalContainer: DOM element for modal overlay
- templateEngine: TemplateEngine instance for rendering
- editedName: Modified world name
- editedDescription: Modified world description
- allowedUsers: List of peer IDs allowed to join (for multiplayer)

**Does:**
- show(worldId): Display settings modal for specified world
- hide(): Close modal and remove overlay
- render(): Display form with name, description, user access controls
- loadWorld(worldId): Fetch world data from storage
- handleSave(): Validate and persist changes to world
- handleCancel(): Close modal without saving changes
- handleAddUser(peerId): Add peer to allowed users list
- handleRemoveUser(peerId): Remove peer from allowed users list
- validateSettings(): Ensure name is non-empty and unique

**Implementation:**
- **src/ui/WorldSettingsModal.ts** (to be created)
  - [ ] File header (CRC + Spec + Sequences)
  - [ ] WorldSettingsModal class comment → crc-WorldSettingsModal.md
  - [ ] show() method comment → seq-edit-world-settings.md
  - [ ] hide() method comment → seq-edit-world-settings.md
  - [ ] render() method comment → seq-edit-world-settings.md
  - [ ] loadWorld() method comment → seq-edit-world-settings.md
  - [ ] handleSave() method comment → seq-edit-world-settings.md
  - [ ] handleCancel() method comment → seq-edit-world-settings.md
  - [ ] handleAddUser() method comment
  - [ ] handleRemoveUser() method comment
  - [ ] validateSettings() method comment → seq-edit-world-settings.md

**Tests:**
- **src/ui/WorldSettingsModal.test.ts** (to be created)
  - [ ] File header referencing CRC card

**Appears in Sequences:**
- seq-edit-world-settings.md

**UI Spec:** ui-world-settings-modal.md

---

### crc-DeleteWorldModal.md

**Source Spec:** specs/game-worlds.md (line 127)

**Knows:**
- worldId: ID of world being deleted
- worldName: Name of world (for confirmation message)
- modalContainer: DOM element for modal overlay
- templateEngine: TemplateEngine instance for rendering

**Does:**
- show(worldId, worldName): Display delete confirmation modal
- hide(): Close modal and remove overlay
- render(): Display confirmation message with world name
- handleConfirmDelete(): Delete world from storage
- handleCancel(): Close modal without deleting world

**Implementation:**
- **src/ui/DeleteWorldModal.ts** (to be created)
  - [ ] File header (CRC + Spec + Sequences)
  - [ ] DeleteWorldModal class comment → crc-DeleteWorldModal.md
  - [ ] show() method comment → seq-delete-world.md
  - [ ] hide() method comment → seq-delete-world.md
  - [ ] render() method comment → seq-delete-world.md
  - [ ] handleConfirmDelete() method comment → seq-delete-world.md
  - [ ] handleCancel() method comment → seq-delete-world.md

**Tests:**
- **src/ui/DeleteWorldModal.ts** (to be created)
  - [ ] File header referencing CRC card

**Appears in Sequences:**
- seq-delete-world.md

**UI Spec:** ui-delete-world-modal.md

---

### crc-JoinSessionModal.md

**Source Spec:** specs/game-worlds.md (line 138)

**Knows:**
- modalContainer: DOM element for modal overlay
- templateEngine: TemplateEngine instance for rendering
- hostPeerId: Peer ID of session host to join
- worldId: ID of world being joined
- selectedCharacter: Character to use in session

**Does:**
- show(): Display join session modal dialog
- hide(): Close modal and remove overlay
- render(): Display form with host peer ID input, character selection
- handleJoin(): Validate inputs and initiate guest session connection
- handleCancel(): Close modal without joining session
- validateInputs(): Ensure peer ID is valid format and character is selected
- connectToHost(): Establish P2P connection to host peer

**Implementation:**
- **src/ui/JoinSessionModal.ts** (to be created)
  - [ ] File header (CRC + Spec + Sequences)
  - [ ] JoinSessionModal class comment → crc-JoinSessionModal.md
  - [ ] show() method comment → seq-join-session.md
  - [ ] hide() method comment → seq-join-session.md
  - [ ] render() method comment → seq-join-session.md
  - [ ] handleJoin() method comment → seq-join-session.md
  - [ ] handleCancel() method comment → seq-join-session.md
  - [ ] validateInputs() method comment → seq-join-session.md
  - [ ] connectToHost() method comment → seq-join-session.md

**Tests:**
- **src/ui/JoinSessionModal.test.ts** (to be created)
  - [ ] File header referencing CRC card

**Appears in Sequences:**
- seq-join-session.md

**UI Spec:** ui-join-session-modal.md

---

### crc-SessionControls.md

**Source Spec:** specs/game-worlds.md (lines 138-142)

**Knows:**
- sessionMode: Current mode ("solo", "host", "guest")
- templateEngine: TemplateEngine instance for rendering
- adventureView: Reference to parent AdventureView

**Does:**
- render(): Display session control buttons based on current mode
- handleHostSession(): Switch from solo to host mode
- handleJoinSession(): Open JoinSessionModal for guest mode
- handleEndSession(): Return to solo mode from host/guest
- updateDisplay(): Refresh buttons when session mode changes

**Implementation:**
- **src/ui/SessionControls.ts** (to be created)
  - [ ] File header (CRC + Spec + Sequences)
  - [ ] SessionControls class comment → crc-SessionControls.md
  - [ ] render() method comment
  - [ ] handleHostSession() method comment → seq-host-session.md
  - [ ] handleJoinSession() method comment → seq-join-session.md
  - [ ] handleEndSession() method comment
  - [ ] updateDisplay() method comment

**Tests:**
- **src/ui/SessionControls.test.ts** (to be created)
  - [ ] File header referencing CRC card

**Appears in Sequences:**
- seq-host-session.md
- seq-join-session.md

**UI Spec:** (Embedded in ui-adventure-view.md)

---

## Phase 1 Completion Checklist

**Level 1 ↔ Level 2:**
- [x] All specs mapped to CRC cards
- [x] All specs mapped to sequence diagrams

**Level 2 ↔ Level 3:**
- [ ] All CRC cards mapped to implementation files
- [ ] All CRC "Does" methods mapped to code methods
- [ ] All sequence participants mapped to code files
- [ ] All checkboxes in Level 2 ↔ Level 3 sections checked
- [ ] All implementation files have header comments
- [ ] All classes have comments linking to CRC cards
- [ ] All interfaces have comments linking to CRC cards
- [ ] All key methods have comments linking to sequences

**Verification:**
- [ ] Can grep "CRC:" in all implementation files and find matches
- [ ] Each file has N+1 "CRC:" matches (N classes/interfaces + 1 file header)
- [ ] Spot-check 2 files confirms all required comments present
- [ ] All links are valid (files exist)

**Status:** Phase 1 traceability structure complete, comments added

---

## Phase 2 Completion Checklist

**Level 1 ↔ Level 2:**
- [x] All specs mapped to CRC cards
- [x] All specs mapped to sequence diagrams

**Level 2 ↔ Level 3:**
- [ ] All CRC cards mapped to implementation files
- [ ] All CRC "Does" methods mapped to code methods
- [ ] All sequence participants mapped to code files
- [ ] All checkboxes in Level 2 ↔ Level 3 sections checked
- [ ] All implementation files have header comments
- [ ] All classes have comments linking to CRC cards
- [ ] All interfaces have comments linking to CRC cards
- [ ] All key methods have comments linking to sequences

**Verification:**
- [ ] Can grep "CRC:" in all implementation files and find matches
- [ ] Each file has N+1 "CRC:" matches (N classes/interfaces + 1 file header)
- [ ] Spot-check 2 files confirms all required comments present
- [ ] All links are valid (files exist)

**Status:** Phase 2 traceability structure complete, comments pending

---

## Phase 3 Completion Checklist

**Level 1 ↔ Level 2:**
- [x] All specs mapped to CRC cards
- [x] All specs mapped to sequence diagrams

**Level 2 ↔ Level 3:**
- [ ] All CRC cards mapped to implementation files
- [ ] All CRC "Does" methods mapped to code methods
- [ ] All sequence participants mapped to code files
- [ ] All checkboxes in Level 2 ↔ Level 3 sections checked
- [ ] All implementation files have header comments
- [ ] All classes have comments linking to CRC cards
- [ ] All interfaces have comments linking to CRC cards
- [ ] All key methods have comments linking to sequences

**Verification:**
- [ ] Can grep "CRC:" in all implementation files and find matches
- [ ] Each file has N+1 "CRC:" matches (N classes/interfaces + 1 file header)
- [ ] Spot-check 2 files confirms all required comments present
- [ ] All links are valid (files exist)

**Status:** Phase 3 traceability structure complete, comments pending

---

## Phase 4 Completion Checklist

**Level 1 ↔ Level 2:**
- [x] All specs mapped to CRC cards
- [x] All specs mapped to sequence diagrams

**Level 2 ↔ Level 3:**
- [x] All CRC cards mapped to implementation files
- [ ] All CRC "Does" methods mapped to code methods
- [ ] All sequence participants mapped to code files
- [ ] All checkboxes in Level 2 ↔ Level 3 sections checked
- [x] All implementation files have header comments
- [x] All classes have comments linking to CRC cards
- [x] All interfaces have comments linking to CRC cards
- [ ] All key methods have comments linking to sequences

**Verification:**
- [x] Can grep "CRC:" in all implementation files and find matches
- [ ] Each file has N+1 "CRC:" matches (N classes/interfaces + 1 file header)
- [ ] Spot-check 2 files confirms all required comments present
- [ ] All links are valid (files exist)

**Status:** Phase 4 traceability structure complete (Level 1 ↔ Level 2 and Level 2 ↔ Level 3 documented), method-level comments pending

---

## Phase 6 Completion Checklist

**Level 1 ↔ Level 2:**
- [x] All specs mapped to CRC cards
- [x] All specs mapped to sequence diagrams

**Level 2 ↔ Level 3:**
- [x] All CRC cards mapped to implementation files
- [ ] All CRC "Does" methods mapped to code methods
- [ ] All sequence participants mapped to code files
- [ ] All checkboxes in Level 2 ↔ Level 3 sections checked
- [x] All implementation files have header comments
- [x] All classes have comments linking to CRC cards
- [x] All interfaces have comments linking to CRC cards
- [ ] All key methods have comments linking to sequences

**Verification:**
- [x] Can grep "CRC:" in all implementation files and find matches
- [ ] Each file has N+1 "CRC:" matches (N classes/interfaces + 1 file header)
- [ ] Spot-check 2 files confirms all required comments present
- [ ] All links are valid (files exist)

**Status:** Phase 6 traceability structure complete (Level 1 ↔ Level 2 and Level 2 ↔ Level 3 documented), method-level comments pending

---

## Phase 7 Completion Checklist

**Level 1 ↔ Level 2:**
- [x] All specs mapped to CRC cards
- [x] All specs mapped to sequence diagrams

**Level 2 ↔ Level 3:**
- [x] All CRC cards mapped to implementation files
- [ ] All CRC "Does" methods mapped to code methods
- [ ] All sequence participants mapped to code files
- [ ] All checkboxes in Level 2 ↔ Level 3 sections checked
- [x] All implementation files have header comments
- [x] All classes have comments linking to CRC cards
- [x] All interfaces have comments linking to CRC cards
- [ ] All key methods have comments linking to sequences

**Verification:**
- [x] Can grep "CRC:" in all implementation files and find matches
- [ ] Each file has N+1 "CRC:" matches (N classes/interfaces + 1 file header)
- [ ] Spot-check 2 files confirms all required comments present
- [ ] All links are valid (files exist)

**Status:** Phase 7 traceability structure complete (Level 1 ↔ Level 2 and Level 2 ↔ Level 3 documented), method-level comments pending

---

## Phase 8 Completion Checklist

**Layout Specs ↔ UI Templates:**
- [ ] All main view templates have `@layout` comments (6 templates)
- [ ] All component templates have `@layout` comments (30+ templates)
- [ ] All fallback templates have `@layout` comments (7 templates)
- [ ] All utility templates have `@layout` comments (27 templates)

**Verification:**
- [ ] Can grep `@layout` in all templates and find matches
- [ ] All referenced `design/*.md` files exist
- [ ] No templates missing header comments
- [ ] Template checklist in `design/traceability-templates.md` complete

**Documentation:**
- [x] `design/traceability-templates.md` created with rules and checklist
- [x] Phase 8 section added to `traceability.md`
- [ ] All 70 templates updated with traceability comments

**Status:** Phase 8 template traceability rules defined, implementation pending

---

## Statistics

**Phase 1:**
- Specs analyzed: 3 (characters.md, storage.md, logging.md)
- CRC cards created: 9
- Sequence diagrams created: 4
- Implementation files: 8
- Test files: 5
- Total checkboxes: ~120
- Checkboxes completed: ~92 (66% = 100% critical path)

**Phase 2:**
- Specs analyzed: 3 (ui.characters.md, ui.md, routes.md)
- CRC cards created: 5
- Sequence diagrams created: 5
- Implementation files: 5
- Test files: 3
- Total checkboxes: ~70
- Checkboxes completed: 0 (pending Step 9 execution)

**Phase 3:**
- Specs analyzed: 2 (ui.splash.md, audio.md)
- CRC cards created: 3
- Sequence diagrams created: 4
- Implementation files: 5
- Test files: 2

**Phase 4:**
- Specs analyzed: 3 (p2p.md, friends.md, ui.settings.md)
- CRC cards created: 7
- Sequence diagrams created: 5
- Implementation files: 6
- Test files: 2

**Phase 6:**
- Specs analyzed: 1 (integrate-textcraft.md)
- CRC cards created: 5
- Sequence diagrams created: 3
- Implementation files: 5
- Test files: 0 (integration tests)

**Phase 7:**
- Specs analyzed: 1 (main.md)
- CRC cards created: 4
- Sequence diagrams created: 2 (app-startup reused from Phase 3, view-transition new)
- Implementation files: 4
- Test files: 0 (E2E tests)

**Phase 8:**
- Layout specs: 6 (design/*.md)
- UI templates: 71 (public/templates/*.html)
- Template-to-layout mappings: 71
- Focus: UI template → layout spec traceability

**Combined All Phases (0-8):**
- Total specs: 11
- Total layout specs: 6 (design/*.md)
- Total CRC cards: 34
- Total sequence diagrams: 22 unique (33 total with reuse)
- Total implementation files: ~35
- Total UI templates: 71
- Total test files: ~12
- Total checkboxes: ~570+
- Checkboxes completed: ~150 (26% - file headers and class/interface comments mostly complete)

**Next Steps:**
1. Use /trace command to add method-level traceability comments
2. Run trace-verify.sh to sync checkboxes with code reality
3. Add missing comments for unchecked items
4. Re-run trace-verify.sh until all items are in sync
5. Verify all CRC/Spec references are valid (files exist)
