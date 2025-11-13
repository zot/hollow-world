# Sequence: Application Startup

**Source Spec:** specs/ui.splash.md, specs/audio.md
**Existing Code:** src/main.ts

## Participants

- **main.ts** (application entry point)
- **ProfileService** (src/services/ProfileService.ts)
- **AudioManager** (src/audio/AudioManager.ts)
- **HollowPeer** (src/p2p/HollowPeer.ts)
- **ViewManager** (src/utils/ViewManager.ts)
- **AdventureMode** (src/ui/AdventureMode.ts)
- **Router** (src/utils/Router.ts)
- **SplashScreen** (src/ui/SplashScreen.ts)

## Current Implementation

```
     ,----.            ,-------.                                             ,--------------.                       ,------------.           ,----------.           ,-----------.          ,-------------.                                ,------.                     ,------------.
     |User|            |main.ts|                                             |ProfileService|                       |AudioManager|           |HollowPeer|           |ViewManager|          |AdventureMode|                                |Router|                     |SplashScreen|
     `--+-'            `---+---'                                             `-------+------'                       `------+-----'           `-----+----'           `-----+-----'          `------+------'                                `---+--'                     `------+-----'
        |    Load page     |                                                         |                                     |                       |                      |                       |                                           |                               |
        |----------------->|                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |----.                                                    |                                     |                       |                      |                       |                                           |                               |
        |                  |    | Import all modules                                 |                                     |                       |                      |                       |                                           |                               |
        |                  |<---'                                                    |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                    Initialize early                     |                                     |                       |                      |                       |                                           |                               |
        |                  |-------------------------------------------------------->|                                     |                       |                      |                       |                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                         |----.                                |                       |                      |                       |                                           |                               |
        |                  |                                                         |    | Load or create default profile |                       |                      |                       |                                           |                               |
        |                  |                                                         |<---'                                |                       |                      |                       |                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                     Profile ready                       |                                     |                       |                      |                       |                                           |                               |
        |                  |<- - - - - - - - - - - - - - - - - - - - - - - - - - - - |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |----.                                                 ,------------------------------------------!.                    |                      |                       |                                           |                               |
        |                  |    | Start initializeAudio() (async, non-blocking)   |Audio initialization happens in background|_\                   |                      |                       |                                           |                               |
        |                  |<---'                                                 `--------------------------------------------'                   |                      |                       |                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |----.                                                    | ,----------------------------------------!.                 |                      |                       |                                           |                               |
        |                  |    | Start initializeHollowPeer() (async, non-blocking) | |P2P initialization happens in background|_\                |                      |                       |                                           |                               |
        |                  |<---'                                                    | `------------------------------------------'                |                      |                       |                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                         |                                     |     new SplashScreen(config, audioManager)   |                       |                                           |                               |
        |                  |------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------->|
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |----.                                                    |                                     |                       |                      |                       |                                           |                               |
        |                  |    | setupRoutes() - add basic routes                   |                                     |                       |                      |                       |                                           |                               |
        |                  |<---'                                                    |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                         |    new ViewManager()                |                       |                      |                       |                                           |                               |
        |                  |--------------------------------------------------------------------------------------------------------------------------------------------->|                       |                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                    registerView('splash', splashScreen)       |                       |                      |                       |                                           |                               |
        |                  |--------------------------------------------------------------------------------------------------------------------------------------------->|                       |                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                registerView('characters', characterManager)   |                       |                      | ,-----------------------------!.                                  |                               |
        |                  |--------------------------------------------------------------------------------------------------------------------------------------------->| |Register other basic views...|_\                                 |                               |
        |                  |                                                         |                                     |                       |                      | `-------------------------------'                                 |                               |
        |                  |                                           new AdventureMode(mudStorage, templateEngine, router, hollowPeer, viewManager)                     |                       |                                           |                               |
        |                  |--------------------------------------------------------------------------------------------------------------------------------------------------------------------->|                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                         |                  initialize()       |                       |                      |                       |                                           |                               |
        |                  |--------------------------------------------------------------------------------------------------------------------------------------------------------------------->|                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                         |                                     |   getItem('activeWorldId')                   |                       |                                           |                               |
        |                  |                                                         |<-----------------------------------------------------------------------------------------------------------|                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                         |                                     |     savedWorldId or null                     |                       |                                           |                               |
        |                  |                                                         | - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - >|                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                         |                                     |                       |                      |      _______________________________________________________________________________________________________
        |                  |                                                         |                                     |                       |                      |      ! ALT  /  savedWorldId exists                                |                               |         !
        |                  |                                                         |                                     |                       |                      |      !_____/          |                                           |                               |         !
        |                  |                                                         |                                     |                       |                      |      !                |----.                                ,----------------------------------!. |         !
        |                  |                                                         |                                     |                       |                      |      !                |    | activeWorldId = savedWorldId   |Active world restored from storage|_\|         !
        |                  |                                                         |                                     |                       |                      |      !                |<---'                                `------------------------------------'|         !
        |                  |                                                         |                                     |                       |                      |      !~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~!
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |    addRoute('/worlds', showWorldList)     |                               |
        |                  |                                                         |                                     |                       |                      |                       |------------------------------------------>|                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |addRoute('/world/:worldId', showAdventure) |                               |
        |                  |                                                         |                                     |                       |                      |                       |------------------------------------------>|                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                         |           Adventure Mode initialized|                       |                      |                       |                                           |                               |
        |                  |<- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                  registerView('adventure', adventureMode)     |                       |                      |                       |                                           |                               |
        |                  |--------------------------------------------------------------------------------------------------------------------------------------------->|                       |                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |    _______________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________
        |    ! ALT  /  currentPath === '/' AND activeWorldId exists                  |                                     |                       |                      |                       |                                           |                               |                             !
        |    !_____/       |                                                         |                                     |                       |                      |                       |                                           |                               |                             !
        |    !             |                                                         |                getDefaultRoute()    |                       |                      |                       |                                           |                               |                             !
        |    !             |--------------------------------------------------------------------------------------------------------------------------------------------------------------------->|                                           |                               |                             !
        |    !             |                                                         |                                     |                       |                      |                       |                                           |                               |                             !
        |    !             |                                                         |                '/world/:worldId'    |                       |                      |                       |                                           |                               |                             !
        |    !             |<- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|                                           |                               |                             !
        |    !             |                                                         |                                     |                       |                      |                       |                                           |                               |                             !
        |    !             |                                                         |                           Update currentPath to '/world/:worldId'                  |                       |                                           | ,----------------------------------------------!.           !
        |    !             |----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------->| |Resume active world before router.initialize()|_\          !
        |    !~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`------------------------------------------------'~~~~~~~~~~!
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                         |                                     |  initialize()         |                      |                       |                                           |                               |
        |                  |----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------->|                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |----.                          |
        |                  |                                                         |                                     |                       |                      |                       |                                           |    | handleRoute(currentPath) |
        |                  |                                                         |                                     |                       |                      |                       |                                           |<---'                          |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |    __________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________
        |    ! ALT  /  currentPath is '/world/:worldId'                              |                                     |                       |                      |                       |                                           |                               |                !
        |    !_____/       |                                                         |                                     |                       |                      |                       |                                           |                               |                !
        |    !             |                                                         |                                     |                       |                      |                       |          showAdventure(worldId)           |                               |                !
        |    !             |                                                         |                                     |                       |                      |                       |<------------------------------------------|                               |                !
        |    !             |                                                         |                                     |                       |                      |                       |                                           |                               |                !
        |    !             |                                                         |            Adventure view displayed |                       |                      |                       |                                           |                               |                !
        |    !             |<- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|                                           |                               |                !
        |    !~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~!
        |    ! [currentPath is '/']                                                  |                                     |                       |                      |                       |                                           |                               |                !
        |    !             |                                                         |                                    renderSplashScreen()     |                      |                       |                                           |                               |                !
        |    !             |<-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|                               |                !
        |    !             |                                                         |                                     |                       |                      |                       |                                           |                               |                !
        |    !             |                                                         |                                     |              render(appContainer)            |                       |                                           |                               |                !
        |    !             |------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------->|                !
        |    !             |                                                         |                                     |                       |                      |                       |                                           |                               |                !
        |    !             |                                                         |                                     |             Splash screen displayed          |                       |                                           |                               |                !
        |    !             |<- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|                !
        |    !~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~!
        |                  |                                                         |                                     |                       |                      |                       |                                           |                               |
        |Application ready |                                                         |                                     |                       |                      |                       |                                           |                               |
        |<- - - - - - - - -|                                                         |                                     |                       |                      |                       |                                           |                               |
     ,--+-.            ,---+---.                                             ,-------+------.                       ,------+-----.           ,-----+----.           ,-----+-----.          ,------+------.                                ,---+--.                     ,------+-----.
     |User|            |main.ts|                                             |ProfileService|                       |AudioManager|           |HollowPeer|           |ViewManager|          |AdventureMode|                                |Router|                     |SplashScreen|
     `----'            `-------'                                             `--------------'                       `------------'           `----------'           `-----------'          `-------------'                                `------'                     `------------'
```

## Spec Intent

Matches spec requirements:
- **Profile initialization**: Profile service initialized before other systems
- **Audio initialization early**: Audio system created as early as possible (specs/audio.md)
- **P2P initialization**: HollowPeer initialized asynchronously in background
- **ViewManager registration**: Views registered with ViewManager for centralized management
- **Adventure Mode initialization**: AdventureMode loads active world from storage and registers routes
- **Active world resumption**: If user was in a world, automatically resume that world on startup
- **Router initialization**: Router initialized after all routes are registered and default route determined
- **Graceful fallback**: If no active world, show splash screen

## Analysis

### Correctly Implemented ✅

1. **Non-blocking initialization**: Audio and P2P initialize asynchronously without blocking UI
2. **Profile-first**: ProfileService initialized before other systems
3. **ViewManager pattern**: Centralized view registration and management
4. **Adventure Mode lifecycle**:
   - Loads activeWorldId from ProfileService during initialize()
   - Restores active world state if found
   - Registers adventure routes with router
   - Provides getDefaultRoute() for world resumption
5. **World resumption logic**:
   - Checks if currentPath === '/' AND activeWorldId exists
   - Calls getDefaultRoute() to get /world/:worldId
   - Updates router's currentPath before initialize()
   - Router then routes to active world on startup
6. **Route ordering**: All routes registered before router.initialize()
7. **Conditional routing**: Router handles both adventure view and splash screen paths

### Implementation Details

1. **ViewManager Creation**: Created before view registration
2. **Basic Route Setup**: Basic routes (splash, characters, friends, settings) registered first
3. **Adventure Mode Setup**:
   - Created with dependencies (mudStorage, templateEngine, router, hollowPeer, viewManager)
   - initialize() called to load active world state
   - Registers /worlds and /world/:worldId routes
   - Registered with ViewManager as 'adventure' view
4. **World Resumption**: Only happens if currentPath === '/' (not on direct navigation to other routes)
5. **Router Initialize**: Called after all setup complete, handles current path

### Missing from Spec 📝

None. Implementation matches specs.

### Code vs Spec Deviations

None. Code follows spec requirements.

## Migration Actions

None required. Implementation follows proper initialization sequence.
