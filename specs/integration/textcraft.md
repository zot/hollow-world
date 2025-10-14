# Textcraft Integration Specification

🧪 **Testing**: See [`textcraft.tests.md`](textcraft.tests.md) for test requirements

---

## Overview

Integrate Textcraft (oldskool peer-to-peer text-based MUD) into HollowWorld as a gameplay module in `src/mud/`. Textcraft provides a command-driven text adventure system with a rich object model and event system.

**Source**: `~/work/textcraft` (~7,500 lines of TypeScript)

**Key Features to Integrate**:
- Multi-user text-based gameplay
- Command processing system (~50 commands)
- World/Thing object model with properties and associations
- Event propagation system (descriptons)
- World creation and storage
- Real-time collaborative gameplay

---

## Integration Architecture

### Directory Structure
```
src/mud/
├── index.ts              # Main MUD module exports
├── MudGameView.ts        # MUD gameplay view
├── GameListView.ts       # World selection view
├── core/                 # Core Textcraft engine (ported)
│   ├── model.ts          # World/Thing data model
│   ├── mudcontrol.ts     # Command & event system
│   ├── connection.ts     # Player connection management
│   └── format.ts         # Text formatting utilities
├── storage/
│   ├── WorldStorage.ts   # World persistence (uses ProfileService)
│   └── WorldLoader.ts    # World loading/validation
├── p2p/
│   ├── MudP2PBridge.ts   # Bridge to HollowPeer
│   └── protocol.ts       # MUD-specific P2P messages
└── ui/
    ├── MudOutput.ts      # Terminal output component
    ├── MudInput.ts       # Command input component
    └── WorldCard.ts      # World selection card
```

---

## Routing and Navigation

### New Routes

#### `/gamelist` - Game List View
- **URL Path**: `/gamelist`
- **Purpose**: Browse and select Textcraft worlds to play
- **Components**:
  - World cards showing: name, description, player count, host status
  - "Create World" button
  - "Join Game" / "Host Game" / "Solo Play" buttons per world
  - Western theme styling consistent with HollowWorld

#### `/game/:worldId` - MUD Game View
- **URL Path**: `/game/:worldId` (e.g., `/game/dungeon-quest`)
- **Purpose**: Active MUD gameplay
- **Components**:
  - MUD output area (scrolling text display)
  - Command input field
  - Connected players list (if multiplayer)
  - "Quit Game" button → returns to `/gamelist`

### Navigation Flow
```
Splash Screen (/)
    ↓
    [Games] button
    ↓
Game List (/gamelist) ←→ Settings (/settings)
    ↓
    [Select World + Play Mode]
    ↓
MUD Game (/game/:worldId)
    ↓
    [Quit] → back to /gamelist
```

### Replace "Start Game" Button
- **Current**: Splash screen has "Start Game" button (location TBD)
- **New**: Replace with "Games" button
- **Action**: Navigate to `/gamelist`
- **Icon**: 🎮 or 🎲

---

## P2P Communication Integration

### Replace Textcraft's libp2p-websocket

**Textcraft's Current System**:
- Uses `libp2p-websocket` for browser-to-libp2p connections
- Supports host/guest/relay/solo modes
- Protocol includes: world sync, command execution, chat

**HollowWorld Integration**:

#### Use HollowPeer Instead
```typescript
// src/mud/p2p/MudP2PBridge.ts

import type { HollowPeer } from '../../p2p/HollowPeer';
import type { World } from '../core/model';

export class MudP2PBridge {
    constructor(
        private hollowPeer: HollowPeer,
        private world: World,
        private onRemoteCommand: (peerId: string, command: string) => void
    ) {}

    // Send command to all players
    broadcastCommand(command: string, output: string): void {
        const friends = this.hollowPeer.getAllFriends();
        for (const [peerId, friend] of friends) {
            this.hollowPeer.sendDirectMessage(peerId, {
                type: 'mud:command',
                worldId: this.world.id,
                command,
                output
            });
        }
    }

    // Invite friend to world
    inviteToWorld(peerId: string): void {
        this.hollowPeer.sendDirectMessage(peerId, {
            type: 'mud:invite',
            worldId: this.world.id,
            worldName: this.world.name
        });
    }

    // Sync world state to joining player
    syncWorldState(peerId: string): void {
        this.hollowPeer.sendDirectMessage(peerId, {
            type: 'mud:sync',
            worldId: this.world.id,
            worldData: this.world.serialize()
        });
    }
}
```

#### Message Types
```typescript
// src/mud/p2p/protocol.ts

export type MudMessage =
    | { type: 'mud:invite'; worldId: string; worldName: string }
    | { type: 'mud:join'; worldId: string }
    | { type: 'mud:leave'; worldId: string }
    | { type: 'mud:command'; worldId: string; command: string; output: string }
    | { type: 'mud:sync'; worldId: string; worldData: any }
    | { type: 'mud:chat'; worldId: string; message: string };
```

#### Register P2P Handlers
```typescript
// In src/main.ts during HollowPeer initialization

hollowPeer.on('directMessage', (peerId: string, message: any) => {
    if (message.type?.startsWith('mud:')) {
        mudP2PBridge.handleMessage(peerId, message as MudMessage);
    }
});
```

---

## World Storage

### Use ProfileService for Persistence

**Textcraft's Current System**:
- Uses IndexedDB for world storage
- Worlds stored as YAML
- Extensions supported

**HollowWorld Integration**:
```typescript
// src/mud/storage/WorldStorage.ts

import { getProfileService } from '../../services/ProfileService';

export class WorldStorage {
    private STORAGE_KEY_PREFIX = 'mud:world:';

    async saveWorld(worldId: string, worldData: any): Promise<void> {
        const profileService = getProfileService();
        const key = `${this.STORAGE_KEY_PREFIX}${worldId}`;
        await profileService.setItem(key, JSON.stringify(worldData));
    }

    async loadWorld(worldId: string): Promise<any> {
        const profileService = getProfileService();
        const key = `${this.STORAGE_KEY_PREFIX}${worldId}`;
        const data = profileService.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    async listWorlds(): Promise<string[]> {
        const profileService = getProfileService();
        const allKeys = profileService.getAllKeys();
        return allKeys
            .filter(key => key.startsWith(this.STORAGE_KEY_PREFIX))
            .map(key => key.replace(this.STORAGE_KEY_PREFIX, ''));
    }

    async deleteWorld(worldId: string): Promise<void> {
        const profileService = getProfileService();
        const key = `${this.STORAGE_KEY_PREFIX}${worldId}`;
        profileService.removeItem(key);
    }
}
```

### Profile Isolation
- Each profile has its own set of worlds
- Switching profiles switches available worlds
- World data stored with profile-specific localStorage keys

---

## Game List View

### GameListView Component
```typescript
// src/mud/ui/GameListView.ts

export class GameListView {
    private worlds: World[] = [];
    private worldStorage: WorldStorage;

    async renderGameList(container: HTMLElement): Promise<void> {
        this.worlds = await this.loadWorlds();

        const html = await templateEngine.renderTemplateFromFile('gamelist-view', {
            worlds: this.worlds.map(w => ({
                id: w.id,
                name: w.name,
                description: w.description,
                playerCount: w.connectedPlayers?.length || 0,
                isHosting: w.isHosting,
                isSolo: !w.isMultiplayer
            })),
            hasWorlds: this.worlds.length > 0
        });

        container.innerHTML = html;
        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        // Handle world selection and play mode
        const worldCards = document.querySelectorAll('.world-card');
        worldCards.forEach(card => {
            const worldId = card.getAttribute('data-world-id');

            card.querySelector('.solo-btn')?.addEventListener('click', () => {
                this.startSoloGame(worldId);
            });

            card.querySelector('.host-btn')?.addEventListener('click', () => {
                this.startHosting(worldId);
            });

            card.querySelector('.join-btn')?.addEventListener('click', () => {
                this.joinGame(worldId);
            });
        });

        document.getElementById('create-world-btn')?.addEventListener('click', () => {
            this.createNewWorld();
        });
    }

    private async startSoloGame(worldId: string): Promise<void> {
        // Navigate to /game/:worldId in solo mode
        window.history.pushState({ worldId, mode: 'solo' }, '', `/game/${worldId}`);
        await this.loadMudGame(worldId, 'solo');
    }
}
```

### Template: `public/templates/gamelist-view.html`
```handlebars
<div class="gamelist-container">
    <div class="gamelist-header">
        <h1 class="gamelist-title">🎮 Textcraft Worlds</h1>
        <button class="create-world-btn" id="create-world-btn">Create New World</button>
    </div>

    {{#if hasWorlds}}
    <div class="world-grid">
        {{#each worlds}}
        <div class="world-card" data-world-id="{{id}}">
            <div class="world-card-header">
                <h3 class="world-name">{{name}}</h3>
                {{#if isSolo}}
                <span class="world-badge solo">Solo</span>
                {{else}}
                <span class="world-badge multiplayer">Multiplayer ({{playerCount}})</span>
                {{/if}}
            </div>
            <div class="world-description">{{description}}</div>
            <div class="world-actions">
                <button class="solo-btn">Play Solo</button>
                <button class="host-btn">Host Game</button>
                <button class="join-btn">Join Game</button>
            </div>
        </div>
        {{/each}}
    </div>
    {{else}}
    <div class="no-worlds">
        <p>No worlds yet. Create one to get started!</p>
    </div>
    {{/if}}

    <button class="back-btn">Back to Menu</button>
</div>
```

---

## MUD Game View

### MudGameView Component
```typescript
// src/mud/ui/MudGameView.ts

import { MudConnection } from '../core/mudcontrol';
import { World } from '../core/model';
import { MudP2PBridge } from '../p2p/MudP2PBridge';

export class MudGameView {
    private connection: MudConnection | null = null;
    private world: World | null = null;
    private p2pBridge: MudP2PBridge | null = null;
    private outputElement: HTMLElement | null = null;
    private inputElement: HTMLInputElement | null = null;

    async renderMudGame(
        container: HTMLElement,
        worldId: string,
        mode: 'solo' | 'host' | 'guest'
    ): Promise<void> {
        // Load world
        this.world = await this.loadWorld(worldId);

        // Render UI
        const html = await templateEngine.renderTemplateFromFile('mud-game-view', {
            worldName: this.world.name,
            mode
        });
        container.innerHTML = html;

        // Get elements
        this.outputElement = document.getElementById('mud-output');
        this.inputElement = document.getElementById('mud-input') as HTMLInputElement;

        // Create connection
        this.connection = new MudConnection(this.world, (output) => {
            this.displayOutput(output);
        });

        // Set up P2P if multiplayer
        if (mode !== 'solo') {
            this.p2pBridge = new MudP2PBridge(
                hollowPeer,
                this.world,
                (peerId, command) => this.handleRemoteCommand(peerId, command)
            );
        }

        // Start game
        await this.connection.start();

        // Setup event handlers
        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        // Command submission
        this.inputElement?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.executeCommand(this.inputElement!.value);
                this.inputElement!.value = '';
            }
        });

        document.getElementById('quit-btn')?.addEventListener('click', () => {
            this.quitGame();
        });
    }

    private executeCommand(command: string): void {
        if (!this.connection) return;

        this.connection.runText(command);

        // Broadcast to other players if multiplayer
        if (this.p2pBridge) {
            this.p2pBridge.broadcastCommand(command, '');
        }
    }

    private displayOutput(html: string): void {
        if (!this.outputElement) return;

        const outputDiv = document.createElement('div');
        outputDiv.innerHTML = html;
        this.outputElement.appendChild(outputDiv);

        // Auto-scroll to bottom
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }

    private quitGame(): void {
        this.connection?.close();
        this.connection = null;
        this.p2pBridge = null;

        // Navigate back to game list
        window.history.pushState({}, '', '/gamelist');
        router.navigate('/gamelist');
    }
}
```

### Template: `public/templates/mud-game-view.html`
```handlebars
<div class="mud-game-container">
    <div class="mud-header">
        <h2 class="mud-title">{{worldName}}</h2>
        <button class="quit-btn" id="quit-btn">Quit</button>
    </div>

    <div class="mud-output" id="mud-output">
        <!-- MUD text output appears here -->
    </div>

    <div class="mud-input-area">
        <input
            type="text"
            id="mud-input"
            class="mud-input"
            placeholder="Enter command..."
            autocomplete="off"
        />
    </div>

    {{#if isMultiplayer}}
    <div class="mud-players">
        <h3>Connected Players</h3>
        <ul id="player-list">
            <!-- Player list dynamically updated -->
        </ul>
    </div>
    {{/if}}
</div>
```

---

## Styling

### Western Theme Integration
- Use HollowWorld's existing western theme CSS
- Apply to MUD components:
  - `src/styles/MudGameView.css`
  - `src/styles/GameListView.css`
- Font: Monospace for MUD output (authentic terminal feel)
- Colors: Match western palette (browns, golds, beige)
- Borders: Wooden frame aesthetic
- Buttons: Western button styling from `SettingsView.css`

---

## Code Porting Strategy

### Phase 1: Core Engine
Port essential Textcraft modules:
1. `model.ts` → `src/mud/core/model.ts` (World/Thing classes)
2. `mudcontrol.ts` → `src/mud/core/mudcontrol.ts` (Command system)
   - Remove libp2p-websocket dependencies
   - Keep command processing intact
   - Adapt output handler interface

### Phase 2: Storage Layer
Replace IndexedDB with ProfileService:
1. Create `WorldStorage.ts` using ProfileService
2. Convert YAML world format to JSON
3. Implement world import/export
   - import/export is in YAML but storage is in JSON
   - still need YAML library for this

### Phase 3: P2P Layer
Replace Textcraft P2P with HollowPeer:
1. Create `MudP2PBridge.ts`
2. Implement MUD-specific message handlers
3. Test with friend-to-friend gameplay

### Phase 4: UI Components
Create HollowWorld-integrated views:
1. `GameListView.ts` + template
2. `MudGameView.ts` + template
3. Western theme CSS

### Phase 5: Router Integration
Add routes to HollowWorld router:
1. `/gamelist` route
2. `/game/:worldId` route
3. Update splash screen navigation

---

## TypeScript Types

### World and Thing Types
```typescript
// src/mud/core/model.ts (ported from textcraft)

export interface IWorld {
    id: string;
    name: string;
    description: string;
    version: number;
    things: Map<number, Thing>;
    nextId: number;
}

export interface IThing {
    _id: number;
    _prototype: Thing | null;
    name: string;
    description?: string;
    location?: Thing;
    // ... other properties
}

export class World implements IWorld {
    // ... ported from textcraft
}

export class Thing implements IThing {
    // ... ported from textcraft
}
```

### Connection Types
```typescript
// src/mud/core/connection.ts

export interface IMudConnection {
    world: World;
    thing: Thing;
    user: string;
    admin: boolean;
    runText(command: string): void;
    output(text: string): void;
    close(): void;
}

export class MudConnection implements IMudConnection {
    // ... ported from textcraft mudcontrol.ts
}
```

---

## Event System Integration

### Hook into HollowWorld EventService

```typescript
// When world events occur, emit HollowWorld events

// Example: Player joins world
eventService.addEvent({
    type: 'mud:join',
    message: `${playerName} joined ${worldName}`,
    data: { worldId, playerName }
});

// Example: Important in-game event
eventService.addEvent({
    type: 'mud:event',
    message: 'You found the treasure!',
    data: { worldId, eventType: 'treasure' }
});
```

---

## Command Conflicts

### Avoid Conflicts with HollowWorld Commands
- MUD commands only active when in MUD game view
- HollowWorld navigation (back button, settings) always available
- ESC key: Exit MUD input, return to navigation

---

## Testing Requirements

See [`textcraft.tests.md`](textcraft.tests.md) for comprehensive testing specifications including:
- Game list view tests
- MUD gameplay tests
- P2P multiplayer tests
- World storage tests
- Profile isolation tests

---

## Migration Path

### Initial Implementation (MVP)
1. **Solo play only** - No P2P initially
2. **Single world** - One demo world included
3. **Basic commands** - Core MUD commands only
4. **Simple UI** - Text output + input field

### Future Enhancements
1. **Full P2P multiplayer** - Host/guest/relay modes
2. **World creation** - In-game world builder
3. **Extensions** - Custom game modules
4. **Advanced commands** - Full ~50 command set
5. **Rich formatting** - Colors, styles, ASCII art

---

## Dependencies

### New npm Packages (if needed)
```json
{
  "js-yaml": "^4.1.0",  // For YAML world format (optional)
  "msgpack-lite": "^0.1.26"  // For efficient data serialization (optional)
}
```

### Reuse Existing HollowWorld Dependencies
- Template engine (Handlebars)
- Router
- ProfileService
- HollowPeer
- EventService

---

## File Size Estimates

- **Core engine**: ~4,000 lines (ported from textcraft)
- **P2P bridge**: ~300 lines
- **Storage layer**: ~200 lines
- **UI components**: ~600 lines
- **Templates**: ~200 lines
- **CSS**: ~400 lines
- **Types**: ~300 lines

**Total**: ~6,000 lines of new code

---

## Summary

This integration brings Textcraft's powerful MUD engine into HollowWorld while:
- ✅ Using HollowWorld's P2P system (HollowPeer)
- ✅ Using HollowWorld's storage system (ProfileService)
- ✅ Using HollowWorld's routing and navigation
- ✅ Maintaining HollowWorld's western theme
- ✅ Supporting profile-isolated gameplay
- ✅ Providing both solo and multiplayer modes
- ✅ Preserving Textcraft's command-driven gameplay
