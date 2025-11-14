# Hollow World project: digital companion for the Hollow TTRPG

# written in typescript

---

## ⚠️ IMPORTANT: Code Generation Process

**DO NOT LOOK IN THE OBSOLETE DIRECTORY**

**DO NOT generate code directly from `specs/*.md` files!**

All specs referenced in this file are **human-readable design documents** (intent, UX, architecture).

**Correct workflow for code generation**:
1. Read human specs (`specs/*.md`) for design intent
2. **Use `design` agent** to create/consult Level 2 design specs (CRC cards, sequences, UI specs) ⚠️ **REQUIRED**
3. Design specs are markdown files located in the `design` directory: `design/crc-*.md`, `design/seq-*.md`, `design/ui-*.md`, and also `design/manifest-ui.md` (for global UI concerns)
4. Generate/write code (templates + TypeScript) following complete specification with traceability comments

**For creating Level 2 specs**: Use the `design` agent (`.claude/agent/design.md`) - it handles CRC cards, sequence diagrams, and UI layout specs

---

**📋 Main Specification**: See [`specs/main.md`](specs/main.md) for comprehensive project specifications

**🗺️ Application Routes**: See [`specs/routes.md`](specs/routes.md) for centralized route reference
- All application routes (URLs/paths) are documented in `specs/routes.md`
- **IMPORTANT**: When documenting features in spec files, use **view names** (e.g., "Friends view", "Settings view") instead of hard-coded routes (e.g., `/friends`, `/settings`)
- To find the route for a view, refer to the route table in `specs/routes.md`
- Only `specs/routes.md` should contain hard-coded route paths
- When adding routes, referencing routes in docs, or working with navigation, refer to this file
- Ensures consistency across codebase and documentation

---

## 📚 Specification Files Quick Reference

### Core Specifications
- **[`main.md`](specs/main.md)** - Main project specification, architecture, and features
- **[`routes.md`](specs/routes.md)** - Centralized route reference for all application URLs
- **[`storage.md`](specs/storage.md)** - Storage systems (IndexedDB, LocalStorage), data patterns
- **[`testing.md`](specs/testing.md)** - Testing strategy, Playwright setup, test organization
- **[`audio.md`](specs/audio.md)** - Audio system (background music, sound effects, controls)
- **[`dependencies.md`](specs/dependencies.md)** - Project dependencies and version management

### Development & Coding
- **[`development.md`](specs/development.md)** - Development server, build process, workflow
- **[`view-management.md`](specs/view-management.md)** - View manager and single-active-view architecture
- **[`coding-standards.md`](specs/coding-standards.md)** - TypeScript, HTML, SOLID principles, best practices
- **`design` agent** (`.claude/agent/design.md`) - Level 2 spec generation (CRC cards, sequences, UI specs)
- **[`tooling.md`](specs/tooling.md)** - d2 diagrams, scripts, development tools
- **[`logging.md`](specs/logging.md)** - Application logging system

### UI Specifications
- **`design` agent** (`.claude/agent/design.md`) - Create UI layout specs (use for generating `design/*.md` files)
- **[`design/*.md`](design/)** - UI layout specifications (HTML structure, CSS classes, data bindings)
- **[`ui.md`](specs/ui.md)** - General UI principles (save behavior, audio controls, navigation, western theme)
- **[`ui.splash.md`](specs/ui.splash.md)** - Splash Screen (main menu)
- **[`ui.characters.md`](specs/ui.characters.md)** - Character Manager and Character Editor views
- **[`ui.friends.md`](specs/ui.friends.md)** - Friends view (P2P friend management)
- **[`ui.settings.md`](specs/ui.settings.md)** - Settings view (peer ID, profiles, log)

### UI Testing Specifications
- **[`main.tests.md`](specs/main.tests.md)** - Integration testing (routes, P2P, events, cross-view)
- **[`ui.splash.tests.md`](specs/ui.splash.tests.md)** - Splash Screen testing
- **[`ui.characters.tests.md`](specs/ui.characters.tests.md)** - Character management testing
- **[`ui.settings.tests.md`](specs/ui.settings.tests.md)** - Settings view testing

### P2P & Networking
- **[`p2p-webapp-cli.md`](specs/p2p-webapp-cli.md)** - **p2p-webapp server CLI** (commands, options, workflows, testing) - **CONSULT THIS FOR ALL SERVER USAGE**
- **[`p2p.md`](specs/p2p.md)** - P2P system architecture (WebSocket, multi-peer, protocol)
- **[`p2p-messages.md`](specs/p2p-messages.md)** - P2P message types and protocols
- **[`friends.md`](specs/friends.md)** - Friends system data structures and flows

### Feature Specifications
- **[`characters.md`](specs/characters.md)** - Character system (attributes, skills, equipment)
- **[`integrate-textcraft.md`](specs/integrate-textcraft.md)** - TextCraft MUD integration

### Planning & Historical
- **[`todo.md`](specs/todo.md)** - Task tracking and pending work

### Other
- **[`itch-io.md`](specs/itch-io.md)** - Itch.io deployment and distribution
- **[`Hollow-summary.md`](specs/Hollow-summary.md)** - Summary of parts of the pencil & paper role playing game, Hollow
- **[`notes.md`](specs/notes.md)** - Development notes and scratchpad

**📝 Note**: CLAUDE.md should remain lean and focused on guidelines. Never add TODO items, scratch work, or temporary notes here. Use `specs/todo.md` for task tracking and `specs/notes.md` for development scratchpad.

---

## 🏗️ CRC Modeling Development Process

**Three-tier process**: Human-readable specs (`specs/*.md`) → CRC cards + Sequence diagrams + UI specs → Generated code/templates/tests

- **CRC Cards** (`design/crc-*.md`): Classes, responsibilities, collaborators → TypeScript classes
  - One card per class in markdown format
  - Defines what each class knows (data) and does (behavior)
  - Identifies collaborations between classes

- **Sequence Diagrams** (`design/seq-*.md`): Object interactions over time → Method implementations
  - One diagram per scenario/use case
  - Shows how objects collaborate to fulfill requirements
  - Guides implementation details

- **UI Specs** (`design/ui-*.md`): Layout structure → HTML templates
  - Organized by view (may group small related components together)
  - Defines HTML structure, CSS classes, data bindings
  - References CRC cards for data types and behavior
  - Use `design` agent to create UI specs

**Key principle**: CRC models are **source of truth** for structure, UI specs are **source of truth** for layout, human specs are **source of truth** for intent.

**Creating Level 2 Specs**: Use `design` agent (`.claude/agent/design.md`) for complete workflow
**Traceability**: [`design/traceability.md`](design/traceability.md) - Links from specs → CRC → code

### 🔄 Bidirectional Traceability Principle

**When changes occur at any level, propagate updates through the documentation hierarchy:**

**Source Code Changes → Design Specs:**
- Modified implementation (`.ts`, `.html`) → Update CRC cards/sequences/UI specs if structure/behavior changed
- New classes/methods → Create corresponding CRC cards
- Changed interactions → Update sequence diagrams
- Template changes → Update UI specs

**Design Spec Changes → Architectural Specs:**
- Modified CRC cards/sequences → Update high-level specs (`specs/*.md`) if requirements/architecture affected
- New components → Document in feature specs
- Changed workflows → Update architectural documentation
- UI pattern changes → Update UI principles

**Abstraction Levels:**
- **High-level specs** (`specs/*.md`): Intent, architecture, UX requirements, principles (WHAT and WHY)
- **Design specs** (`design/*.md`): Structure, behavior, interactions, layout (HOW at design level)
- **Implementation** (`src/*.ts`, `public/templates/*.html`): Code, templates, concrete implementation (HOW at code level)

**Key Rules:**
1. **Always update up**: When code/design changes, ripple changes upward through documentation
2. **Maintain abstraction**: Each level documents at its appropriate abstraction (don't add implementation details to high-level specs)
3. **Keep consistency**: All three tiers must tell the same story at their respective levels
4. **Update traceability comments**: When docs change, update CRC/spec references in code comments

**Example Flow:**
```
User identifies missing persistence →
Update specs/game-worlds.md (add persistence requirement) →
Update design/crc-AdventureMode.md (add persistence responsibility) →
Update src/ui/AdventureMode.ts (implement + add traceability comments)

Later: Bug fix in AdventureMode.ts (terminateActiveWorld logic) →
Review if CRC card needs update (it does - split cleanup behavior) →
Review if specs/game-worlds.md needs update (it does - clarify persistence rules)
```

**This ensures documentation remains accurate and useful, not just aspirational.**

---

## 💡 Daily Reminders

⚠️ **CRITICAL - Creating Level 2 Specs:**
- **Use `design` agent** (`.claude/agent/design.md`) when creating CRC cards, sequences, or UI specs
  - Handles complete workflow: specs → CRC cards → sequence diagrams → UI specs
  - Manages traceability and gap analysis
  - Integrates with diagram-converter and gap-analyzer agents
  - Use: `Task(subagent_type="design", ...)`

- **Skills Opportunity**: Once per day, suggest creating new skills (`.claude/skills/*.md`) for repetitive tasks that could benefit from pre-approved scripts or commands (e.g., build/test runners, code formatting checks, log parsing). Currently available: `ascii-analyze`, `plantuml`, `trace`

## 🚦 Starting New Work Checklist

**Before implementing ANY change (feature, bug fix, refactor):**

1. **Identify affected documentation**:
   - [ ] Which high-level specs (`specs/*.md`) describe this area?
   - [ ] Which CRC cards/sequences/UI specs (`design/*.md`) are involved?
   - [ ] Which source files will change?

2. **Create comprehensive todos** using TodoWrite:
   - [ ] Todo for the code implementation
   - [ ] Todo for updating CRC cards/sequences (if structure/behavior changes)
   - [ ] Todo for updating UI specs (if templates/layout changes)
   - [ ] Todo for updating high-level specs (if requirements/architecture changes)

3. **Plan abstraction levels**:
   - High-level specs: Document WHAT and WHY (intent, architecture, principles)
   - Design specs: Document HOW at design level (structure, interactions, layout)
   - Code: Implement HOW at code level (concrete implementation)

**Example todo list for a bug fix:**
```
[ ] Fix router initialization order in main.ts
[ ] Update design/crc-Application.md (startup sequence)
[ ] Update specs/game-worlds.md (clarify startup behavior)
```

**Skipping documentation updates creates technical debt and makes specs obsolete.**

## 🎨 Diagrams & ASCII Art

**CRITICAL: Diagram Format Requirements**

- **Sequence Diagrams (`design/seq-*.md`)**: MUST use PlantUML ASCII art output
  - ⚠️ **REQUIRED APPROACH: Use the `diagram-converter` agent**
    - Launch with Task tool: `subagent_type="diagram-converter"`
    - **NEVER manually write sequence text or pseudocode** - always use this agent
    - Agent handles entire workflow: edit PlantUML source → convert to ASCII → embed in markdown
    - Handles complex conversions with reasoning and decision-making
    - See `.claude/agent/diagram-converter.md` for details
  - **ALTERNATIVE: Direct skill invocation** (for simple one-off diagrams, if agent unavailable)
    - Use Skill tool: `Skill(skill: "plantuml")`
    - Pass PlantUML source as input
    - Good for quick single diagrams
  - **FALLBACK: Bash script** (for batch conversions without Claude)
    - Script: `./.claude/scripts/convert-p2p-sequences-to-plantuml.sh`
    - Bypasses skill system (calls plantuml.sh directly)
    - Use when agent/skill approach not available
  - PlantUML jar location: `.claude/bin/plantuml.jar`
  - ASCII art format (`-ttxt` flag for text output)
  - Embedded in markdown files as code blocks
  - ⚠️ **Never manually write sequence diagrams as plain text or pseudocode**

- **All Other Diagrams**: MUST use d2 tool
  - Architecture diagrams, flow diagrams, component diagrams, etc.
  - Source files: `.claude/diagrams/sources/*.d2`
  - Generate: `./.claude/scripts/diagrams-generate.sh`
  - See [`specs/tooling.md`](specs/tooling.md#diagrams-with-d2) for details

- **Box-drawing character diagrams**: Use artist agent when needed
  - Pre-approved scripts in `.claude/scripts/ascii-*.sh`
  - See [`specs/tooling.md`](specs/tooling.md#ascii-art-tools) for details

**Never hand-craft ASCII art diagrams** - Always use the appropriate tool above.

## 🎯 Core Principles

**Critical rules enforced for all code:**

### SOLID Principles
Use **SOLID principles** in all implementations. See [`specs/coding-standards.md`](specs/coding-standards.md#core-principles) for details.

### 🔒 Strict TypeScript Typing
**All function parameters, return values, and object properties must use explicit TypeScript types.** Never use `any` type except for truly dynamic content. Interface types like `AttributeType` must be used when indexing typed objects like `IAttributes`.

*Type your code tighter than a hangman's noose*

See [`specs/coding-standards.md`](specs/coding-standards.md#typescript-standards) for complete rules.

### 🚫 NO HTML Strings in TypeScript/JavaScript
**CRITICAL**: Never use template literals or string concatenation for HTML in `.ts` or `.js` files. **All HTML must be in template files under `public/templates/`**

❌ `const html = \`<div>${bar}</div>\`;`
✅ `const html = await templateEngine.renderTemplateFromFile('foo', { bar });`

*Separate your concerns like a good sheriff*

See [`specs/coding-standards.md`](specs/coding-standards.md#html--templates) for complete rules.

### Hash-Based Change Detection
Use cryptographic hashes (SHA-256) to detect changes instead of storing object copies:
- Avoids shallow copy issues with nested objects
- More efficient than deep object comparison
- Example: CharacterEditorView stores `originalCharacterHash` instead of `originalCharacter`
- See: `src/utils/characterHash.ts` for utilities

See [`specs/coding-standards.md`](specs/coding-standards.md#hash-based-change-detection) for details.

### TextCraft Thing Storage
- **Property Persistence**: Only Thing properties starting with `_` (data) or `!` (functions) are persisted
- **Accessor Pattern**: `thing.character` (accessor) → `thing._character` (storage)
- See [`specs/coding-standards.md`](specs/coding-standards.md#textcraft-integration) for complete guidelines

### Testing
Create comprehensive **unit tests** for all components. See [`specs/testing.md`](specs/testing.md) and [`specs/coding-standards.md`](specs/coding-standards.md#testing).

### Visual Consistency
Follow specifications for consistent western frontier theme. See [`specs/ui.md`](specs/ui.md) for UI principles.


## 🗄️ Storage Systems

The application uses multiple storage systems:
- **MudStorage**: IndexedDB-backed storage for TextCraft MUD worlds
- **LocalStorage**: Character data, profiles, and application state

See [`specs/storage.md`](specs/storage.md) for complete storage documentation.

## 🎨 UI Principles

Key UI requirements:
- HTML open and close elements MUST be balanced
- NEVER block saves due to validation errors
- Audio controls MUST be visible on all pages
- Use 250ms polling for UI change detection
- NO DIALOGS for P2P operations (use badges and events)
- Western frontier theme throughout

See [`specs/ui.md`](specs/ui.md) for complete UI guidelines.

## 📝 Logging

Application maintains a persistent log in LocalStorage:
- Running serial numbers for each entry
- Automatic trimming when exceeding 512K characters
- Trim to 256K (but keep at least one entry)

See [`specs/logging.md`](specs/logging.md) for complete logging specification.

## 🛠️ Development

**Quick Start for Claude Code:**
```bash
# ALWAYS invoke dev.sh with these flags
./dev.sh --noopen --linger

# Or via npm (pass flags after --)
npm run dev -- --noopen --linger
```

**Why these flags:**
- `--noopen` - Prevents auto-opening browser (required for Playwright, better for automation)
- `--linger` - Server persists through page reloads and disconnections

**p2p-webapp Server:**
- Binary: `bin/p2p-webapp` (Go WebSocket server for P2P capabilities)
- **📖 See [`specs/p2p-webapp-cli.md`](specs/p2p-webapp-cli.md) for complete server usage, options, and workflows**

**Key Points:**
- Multi-peer: One server supports multiple browser clients (each tab = unique peer)
- Use different profiles for multi-tab testing
- Open browser manually to the URL shown in terminal output

See [`specs/development.md`](specs/development.md) for build process and development workflow.

## 🧪 Testing

**Playwright Testing:**
- Start p2p-webapp with `--noopen` flag (prevents browser conflicts)
- **📖 See [`specs/p2p-webapp-cli.md`](specs/p2p-webapp-cli.md#automated-testing-playwright) for complete testing workflow**

```bash
cd hollow-world-p2p && ../bin/p2p-webapp --dir . -v --noopen
npm run test:e2e
```

See [`specs/testing.md`](specs/testing.md) for complete testing documentation.

## 🎵 Audio System

- **Background Music**: 8-track cycling, smooth transitions, 0.3 volume
- **Sound Effects**: Gunshot with pitch/duration variation
- **Audio Controls**: Fixed bottom-right, visible on all routes

**REQUIRED**: Audio controls **MUST be visible** on all pages/routes

See [`specs/audio.md`](specs/audio.md) for complete audio specification.
