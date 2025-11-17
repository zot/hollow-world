# CharacterManagerView

**Source Spec:** ui.characters.md, ui.md
**Existing Code:** src/ui/CharacterManagerView.ts

## Responsibilities

### Knows
- characters: ICharacter[] - List of all characters
- container: HTMLElement - DOM container for this view
- config: ICharacterManagerConfig - View configuration
- audioManager: AudioManager - Audio control reference
- musicButtonElement: HTMLElement - Audio control UI element
- renderCache: Map<string, string> - Cached HTML for character cards
- isRendering: boolean - Prevent concurrent renders
- pendingUpdate: boolean - Flag for queued re-renders

### Does
- loadCharacters(): Load all characters from storage
- getCharacters(): Return current character list
- render(): Render the character list UI
- debouncedRender(): Debounced render (250ms threshold)
- renderCharacterList(): Render list of character cards
- renderCharacterCard(character): Render single character card HTML
- renderCharacterList_Virtual(): Virtual scrolling for large lists
- renderCharacterListWithFallback(): Render with error handling
- renderCharacterListFallback(): Fallback UI when main render fails
- renderFallbackUI(): Error state UI
- createNewCharacter(): Create and navigate to new character
- deleteCharacter(id): Remove character from storage
- setupListEventListeners(): Wire up click handlers for cards/buttons
- setupFallbackEventListeners(): Wire up fallback UI handlers
- clearRenderCache(): Clear cached card HTML
- createCharacterCacheKey(character): Generate cache key from character data
- showErrorMessage(message): Display error notification
- validateUserWorkflows(): Automated UX validation
- runAccessibilityAudit(): Check accessibility compliance
- generateUXReport(): Generate UX quality report
- destroy(): Cleanup view and remove listeners

## Collaborators

- **CharacterStorageService**: getAllCharacters(), saveCharacter(), deleteCharacter()
- **CharacterFactory**: createNewCharacter() for new character defaults
- **TemplateEngine**: renderTemplateFromFile() for HTML templates
- **AudioManager**: Background music control
- **EventService**: Error notifications
- **Navigation**: onCharacterSelected() callback, onNewCharacterCreated() callback, onBackToMenu() callback

## Code Review Notes

✅ **Working well:**
- Render caching for performance (caches character card HTML)
- Debounced updates (250ms) to prevent excessive re-renders
- Virtual scrolling for large character lists
- Comprehensive error handling with fallback UI
- Accessibility features (ARIA labels, keyboard navigation)
- Automated UX validation and reporting
- Responsive design (mobile/tablet breakpoints)
- Clean separation of concerns (Manager orchestrates, delegates rendering)

✅ **Matches spec:**
- Character card layout with stats ✓
- Delete button (💀 skull and crossbones) ✓
- Add Character button at bottom ✓
- Click character to edit ✓
- UUID-based storage ✓
- Browser back button navigation ✓
- Audio controls visible ✓

⚠️ **Potential issues:**
- Render caching might get stale if character updated externally
- Virtual scrolling adds complexity (might not be needed for typical use)
- Many helper methods (validateUserWorkflows, runAccessibilityAudit) seem like test code mixed with production
- Cache key generation based on character data (hash would be better)

📝 **Design pattern:**
- Manager pattern: Orchestrates character list operations
- Template-based UI: Uses TemplateEngine for HTML
- Render caching: Memoization pattern for character cards
- Virtual scrolling: Performance optimization for large lists
- Fallback UI: Graceful degradation on errors

📝 **Extra (code has, spec doesn't mention):**
- Virtual scrolling implementation
- Render caching system
- UX validation and accessibility auditing
- Performance monitoring
- Extensive error fallbacks

## Implementation Notes

**Render Caching Pattern:**
```typescript
// Cache character cards by hash of their data
const cacheKey = createCharacterCacheKey(character);
if (this.renderCache.has(cacheKey)) {
    return this.renderCache.get(cacheKey);
}

const html = await renderCharacterCard(character);
this.renderCache.set(cacheKey, html);
return html;
```

**Debounced Rendering (per ui.md 250ms threshold):**
```typescript
debouncedRender() {
    if (this.isRendering) {
        this.pendingUpdate = true;
        return;
    }

    this.isRendering = true;
    setTimeout(() => {
        this.render();
        this.isRendering = false;
        if (this.pendingUpdate) {
            this.pendingUpdate = false;
            this.debouncedRender();
        }
    }, 250);
}
```

**Character Card Display (per spec):**
- Character name inline with stats
- rank, xp, dc, dust bottom-aligned
- Physical attrs (DEX, STR, CON)
- Social attrs (CHA, WIS, GRI)
- Mental attrs (INT, PER)
- Delete button (💀) on right

## Sequences

- seq-view-character-list.md
- seq-create-new-character.md
- seq-delete-character.md
- seq-navigate-to-character-list.md
- seq-render-character-cards.md

## Type A/B/C Issues

**To be identified during CRC review**

