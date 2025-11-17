# CharacterEditorView

**Source Spec:** ui.characters.md, ui.md
**Existing Code:** src/ui/CharacterEditorView.ts

## Responsibilities

### Knows
- character: ICharacter - Current character being edited
- originalCharacterHash: string - Hash of character when editing started
- hasUnsavedChanges: boolean - Whether character has unsaved edits
- characterSheet: CharacterSheet - Embedded sheet component
- container: HTMLElement - DOM container for this view
- config: ICharacterEditorConfig - View configuration
- audioManager: AudioManager - Audio control reference
- musicButtonElement: HTMLElement - Audio control UI element

### Does
- setCharacter(character): Load character into editor
- getCharacter(): Return current character state
- render(): Render the editor UI
- renderEditor(): Render main editor interface
- renderNoCharacterError(): Show error when no character available
- renderErrorFallback(message): Display error state
- saveCharacter(): Persist character to storage
- revertChanges(): Reload original character from storage
- detectChanges(): Poll for character modifications (250ms)
- updateButtonStates(): Enable/disable Yep/Nope buttons
- setupEventListeners(): Wire up button clicks and navigation
- setupChangeTracking(): Start polling for changes
- setupErrorEventListeners(): Handle error notifications
- showValidationWarning(errors): Display validation errors without blocking save
- showErrorMessage(message): Display error notification
- updateWorldCharacter(): Sync character to TextCraft MUD world
- destroy(): Cleanup view and remove listeners

## Collaborators

- **CharacterSheet**: Embedded component for rendering/editing character
- **CharacterStorageService**: saveCharacter(), getCharacter() for persistence
- **CharacterValidation**: validate() to check character rules
- **calculateCharacterHash**: Hash-based change detection
- **TemplateEngine**: renderTemplateFromFile() for HTML templates
- **AudioManager**: Background music control
- **EventService**: Error notifications and validation warnings
- **Navigation**: Browser back button integration, URL params

## Code Review Notes

✅ **Working well:**
- Hash-based change detection (saves originalCharacterHash on load)
- Non-blocking validation (shows warnings, allows save)
- 250ms polling for UI updates (per spec)
- Clean separation: EditorView orchestrates, CharacterSheet renders
- Proper cleanup in destroy()
- Browser history integration

✅ **Matches spec:**
- Yep/Nope buttons ✓
- Save workflow (load original → save new → update history) ✓
- Revert workflow (reload from storage) ✓
- Never blocks saves due to validation ✓
- Audio controls visible ✓

⚠️ **Potential issues:**
- No clear separation between UI state and character data
- Change tracking uses polling (could use observers/events)
- Direct DOM manipulation mixed with template rendering
- Error handling could be more comprehensive

📝 **Design pattern:**
- Orchestrator pattern: EditorView coordinates, delegates rendering to CharacterSheet
- Observer pattern: 250ms polling for change detection
- Template-based UI: Uses TemplateEngine for HTML
- Event-driven navigation

## Implementation Notes

**Change Detection Pattern:**
```typescript
// Hash-based change detection (per coding-standards.md)
this.originalCharacterHash = await calculateCharacterHash(character);

// 250ms polling (per ui.md)
setInterval(() => {
    const currentHash = await calculateCharacterHash(this.character);
    this.hasUnsavedChanges = (currentHash !== this.originalCharacterHash);
    this.updateButtonStates();
}, 250);
```

**Save Workflow (per storage.md):**
```typescript
async saveCharacter() {
    // 1. Load original from storage
    const original = await CharacterStorageService.getCharacter(id);

    // 2. Save current to storage
    await CharacterStorageService.saveCharacter(this.character);

    // 3. Replace history with original
    // 4. Remove future history
    // 5. Add saved character to history
    // 6. Advance history pointer
}
```

**Validation (per ui.md):**
- Never block saves
- Show validation warnings but allow save to complete
- Invalid data prevented from use (e.g., entering worlds) but not from saving

## Sequences

- seq-edit-character.md
- seq-save-character.md (UI side, calls CharacterStorageService)
- seq-revert-character.md
- seq-navigate-to-editor.md
- seq-change-detection.md

## Type A/B/C Issues

**To be identified during CRC review**

