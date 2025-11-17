# Sequence: Navigate from Splash Screen

**Source Spec:** ui.splash.md, routes.md
**Existing Code:** src/ui/SplashScreen.ts, src/main.ts

## Participants

- **User**
- **SplashScreen** (src/ui/SplashScreen.ts)
- **AudioControlUtils** (src/utils/AudioControlUtils.ts)
- **AudioManager** (src/audio/AudioManager.ts)
- **Router** (src/utils/Router.ts)
- **CharacterManagerView** (src/ui/CharacterManagerView.ts)
- **FriendsView** (src/ui/FriendsView.ts)
- **SettingsView** (src/ui/SettingsView.ts)
- **AdventureView** (src/ui/AdventureView.ts)

## Current Implementation

```
User -> SplashScreen: Click "Characters" button
SplashScreen -> AudioControlUtils: playButtonSound(audioManager)
AudioControlUtils -> AudioManager: playRandomGunshot()
AudioManager -> AudioManager: Generate random pitch/volume/duration
AudioManager -> AudioManager: Create new Audio element
AudioManager -> AudioManager: Play gunshot with variations
AudioControlUtils --> SplashScreen: Sound playing

SplashScreen -> SplashScreen: Check if onCharacters callback exists
SplashScreen -> onCharacters: Call callback
Note: Callback set by main.ts
onCharacters -> Router: navigate('/characters', 'Characters')
Router -> window.history: pushState({path: '/characters'}, 'Characters', '/characters')
Router -> document: title = 'Characters'
Router -> Router: handleRoute('/characters')
Router -> Router: findRoute('/characters')
Router -> Router: Execute route handler (renderCharacterManager)

Note: Route handler destroys current view and renders new one
renderCharacterManager -> SplashScreen: destroy()
SplashScreen -> container: innerHTML = ''
SplashScreen -> SplashScreen: Clear element references
SplashScreen --> renderCharacterManager: Destroyed

renderCharacterManager -> CharacterManagerView: render(appContainer)
CharacterManagerView -> CharacterManagerView: Load characters
CharacterManagerView -> TemplateEngine: renderTemplateFromFile('character-list')
CharacterManagerView --> renderCharacterManager: Rendered
renderCharacterManager --> Router: Handler complete
Router --> User: Navigation complete

Note: Global audio control remains visible (fixed position, not in view)
Note: Background music continues playing across navigation
```

## Alternative Navigation Paths

```
User -> SplashScreen: Click "Friends" button
SplashScreen -> AudioControlUtils: playButtonSound()
SplashScreen -> onFriends: Call callback
onFriends -> Router: navigate('/friends')
Router -> Router: Render FriendsView

User -> SplashScreen: Click "Settings" button
SplashScreen -> AudioControlUtils: playButtonSound()
SplashScreen -> onSettings: Call callback
onSettings -> Router: navigate('/settings')
Router -> Router: Render SettingsView

User -> SplashScreen: Click "Adventure" button
SplashScreen -> AudioControlUtils: playButtonSound()
SplashScreen -> onAdventure: Call callback
onAdventure -> Router: navigate('/adventure')
Router -> Router: Render AdventureView

User -> SplashScreen: Click "Credits" button
SplashScreen -> AudioControlUtils: playButtonSound()
SplashScreen -> onCredits: Call callback (or default handler)
alt onCredits callback set
    onCredits -> SplashScreen: Custom credits handling
else Default behavior
    SplashScreen -> SplashScreen: showCreditsPopup()
    SplashScreen -> TemplateEngine: renderTemplateFromFile('credits-popup')
    SplashScreen -> document.body: appendChild(popup)
    User -> Popup: Click close or overlay
    Popup -> document.body: removeChild(popup)
end

User -> peerIdElement: Click peer ID
SplashScreen -> navigator.clipboard: writeText(peerId)
SplashScreen -> peerIdElement: Flash green background
alt onPeerIdClick callback set
    SplashScreen -> onPeerIdClick: Call callback
else No callback
    SplashScreen -> SplashScreen: Just copy to clipboard
end
```

## Spec Intent

Matches spec requirements:
- **Button clicks play sound effect**: Every button click plays randomized gunshot
- **Navigation buttons**: Characters, Friends, Settings, Adventure navigate to views
- **Credits popup**: Credits button shows popup (not navigation)
- **Peer ID copy**: Clicking peer ID copies to clipboard with visual feedback
- **Music persistence**: Background music continues across view changes
- **Audio controls persistence**: Global audio controls remain visible

## Analysis

### Correctly Implemented ✅

1. **Button sound effects**: All buttons play gunshot via AudioControlUtils.playButtonSound()
2. **Callback pattern**: Navigation handled via callbacks set by main.ts
3. **Router integration**: Uses Router.navigate() for SPA navigation
4. **History API**: Browser back/forward supported via window.history
5. **View lifecycle**: Old view destroyed before new view rendered
6. **Credits popup**: Non-navigational popup for credits
7. **Peer ID interaction**: Copy to clipboard with visual feedback
8. **Music continuity**: Background music persists (AudioManager not destroyed)
9. **Global controls**: Audio controls outside view container, remain visible

### Missing from Spec 📝

None. Implementation follows all spec requirements.

### Code vs Spec Deviations

None identified.

## Migration Actions

None required. Implementation is solid.
