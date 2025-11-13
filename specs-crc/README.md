# CRC Modeling for Hollow World

This document describes the complete CRC (Class-Responsibility-Collaborator) modeling process used in the Hollow World project.

## Overview: Three-Level Development System

```
[Human-Written Specs] → [CRC Cards + Sequence Diagrams] → [Generated Code/UI/Tests/Docs]
     (Level 1)                    (Level 2)                        (Level 3)
```

### Level 1: Human-Written Specifications
Written specifications describe features, requirements, and system behavior in natural language. These are found in `specs/*.md` files.

### Level 2: CRC Cards and Sequence Diagrams
Formal models that capture the complete specification in structured form:
- **CRC Cards** (`crc-NAME.md`) - Define classes, their responsibilities, and collaborations
- **Sequence Diagrams** (`seq-SITUATION.md`) - Show object interactions over time for specific scenarios

### Level 3: Generated Artifacts
Implementation artifacts generated from Level 2 models:
- TypeScript source code
- Template-based HTML UI
- Test suites
- Documentation

### Traceability

All artifacts maintain **bidirectional links** to their sources:
- Level 2 artifacts (CRC cards, sequences) link back to Level 1 specs
- **Level 3 artifacts (code) link back to Level 2 models** ⚠️ **CRITICAL**
- The `traceability.md` file maintains the complete map

**⚠️ REQUIRED: Code must have traceability comments**

The following items that come from specs MUST have linking comments:
- **Implementation files** - Header comments linking to CRC cards and specs
- **Classes** - Comments linking to their CRC card
- **Interfaces** - Comments linking to CRC card or spec
- **ALL methods listed in CRC cards** - Comments referencing CRC cards and/or sequence diagrams

**⚠️ CRITICAL: "Key methods" means ALL methods documented in the CRC card "Does" section, NOT a subset.**

**Why complete traceability matters:**

Traceability comments enable **efficient spec evolution**. When specs change:
- ✅ **Easy to find**: `grep "crc-SettingsView"` instantly locates ALL code implementing that component
- ✅ **Safe to remove**: Code without spec references becomes a candidate for deletion (no longer needed)
- ✅ **Complete updates**: When a CRC card changes, you know exactly which methods need review

**Risks of incomplete traceability:**
- 💰 **Costs more money/tokens**: Without comments, LLMs must search entire codebase to find what to update
- 🔥 **Lava flow anti-pattern**: Orphaned code that nobody dares remove (is it used? is it dead? unknown!)
- 🐛 **Production bugs**: Stale code remains when specs change because nobody knew it existed
- ⏱️ **Wasted time**: Manual grep/search to find "what implements this feature?" every time

**There is NEVER a reason to skip traceability for any element:**
- ❌ WRONG: "This phase has simple CRUD so we'll skip method comments"
- ❌ WRONG: "No sequence diagrams so method comments aren't needed"
- ✅ CORRECT: Every method in every CRC card gets a traceability comment (even simple getters/setters)

**📖 For complete traceability documentation, see [`traceability-guide.md`](traceability-guide.md)**

That guide covers:
- Comment format standards
- Formal traceability map structure
- Using the `/trace` command
- Verification with `trace-verify.sh`
- Handling interfaces with multiple implementations
- Best practices and common patterns

---

## Part 1: CRC Cards

### What is a CRC Card?

A CRC card represents a single class in the system. It's divided into three sections:

```
┌─────────────────────────────────┐
│         Class Name              │
├──────────────────┬──────────────┤
│                  │              │
│  Responsibilities│ Collaborators│
│                  │              │
│                  │              │
└──────────────────┴──────────────┘
```

### Card Components

#### Class Name
A **singular noun** identifying a collection of similar objects. An object can be:
- **Person** (e.g., `Player`, `Character`, `Friend`)
- **Place** (e.g., `World`, `Location`, `Room`)
- **Thing** (e.g., `Inventory`, `Item`, `Equipment`)
- **Event** (e.g., `Order`, `Message`, `Sync`)
- **Concept** (e.g., `Profile`, `Settings`, `Connection`)
- **Screen/Report** (e.g., `CharacterEditor`, `SplashScreen`)

**Naming conventions:**
- Use 1-2 words
- Always singular (e.g., `Character` not `Characters`)
- Use domain terminology from specs
- CamelCase for multi-word names

#### Responsibilities
Anything a class **knows** (data) or **does** (behavior):

**Knows** (Attributes/Data):
```
Character
─────────────────
Name
Attributes (STR, DEX, etc.)
Skills
Equipment
```

**Does** (Behaviors/Actions):
```
Character
─────────────────
Calculate skill bonus
Validate attributes
Serialize to JSON
Sync with peers
```

**Questions to identify responsibilities:**
- What does this class need to remember?
- What information can this class provide to others?
- What actions can this class perform?
- What business logic belongs to this class?

#### Collaborators
Other classes needed to fulfill responsibilities. Collaboration occurs when:
- A class needs information it doesn't have
- A class needs to modify information it doesn't own
- A class needs another class to perform an action

**Example:**
```
Order
─────────────────────────────────
Order number           │
Date ordered           │
Calculate total        │ OrderItem
                       │ Customer
Print invoice          │ OrderItem
                       │ Customer
```

The `Order` class collaborates with `OrderItem` to calculate totals and with both `OrderItem` and `Customer` to print invoices.

### CRC Card File Format

Each class gets its own markdown file: `crc-ClassName.md`

**File naming:**
- Prefix: `crc-`
- Class name in PascalCase
- Extension: `.md`
- Examples: `crc-Character.md`, `crc-FriendsManager.md`, `crc-SplashScreen.md`

**File structure:**
```markdown
# ClassName

**Source Spec:** specs/feature-name.md

## Responsibilities

### Knows
- attribute1: description
- attribute2: description

### Does
- behavior1: description
- behavior2: description

## Collaborators

- CollaboratorClass1: why/when collaboration occurs
- CollaboratorClass2: why/when collaboration occurs

## Sequences

- seq-situation1.md: brief description
- seq-situation2.md: brief description
```

### Creating CRC Cards from Specs

#### Step 1: Identify Classes

Read the spec and look for:

1. **Nouns** - Potential classes
2. **Actors** - Who/what interacts with the system?
3. **Tangible things** - What objects exist in the domain?
4. **Events** - What happens in the system?
5. **Screens/Reports** - What UI elements exist?
6. **"Follow the money"** - What business objects handle value?

**Example from a spec:**
> "The user can create and edit characters. Each character has attributes (STR, DEX, INT, etc.) and skills. Characters can be synchronized with friends over P2P."

**Classes identified:**
- `Character` - Main business object
- `CharacterEditor` - UI screen
- `FriendsManager` - P2P coordination
- `Attribute` - Character property
- `Skill` - Character capability

#### Step 2: Define Responsibilities

For each class, determine:

**What it knows:**
- Ask: "What information does this object remember?"
- Look for properties, states, and data
- Consider both persistent and transient data

**What it does:**
- Ask: "What can this object do?"
- Look for verbs in the spec related to this class
- Consider business logic, calculations, validation
- Include lifecycle methods (create, update, delete)

**Example:**
```
Character
─────────────────────────────────
Knows:
- name
- attribute values (STR, DEX, INT, etc.)
- skill values
- equipment
- world ID

Does:
- validate attribute totals
- calculate skill bonus
- serialize to JSON
- deserialize from JSON
- sync with peer
```

#### Step 3: Identify Collaborators

For each responsibility, ask:
- "Does this class have all the information to do this?"
- If NO → Identify the class that has it → Add as collaborator

**Collaboration patterns:**
- **Information request** - "Give me your data"
- **Action request** - "Do something for me"
- **Delegation** - "You handle this part"

**Principles:**
- Assign responsibility to the logical owner (don't "pass the buck")
- Keep collaborations minimal (low coupling)
- Each responsibility should have clear ownership

**Example:**
```
CharacterEditor
─────────────────────────────────
Display character        │ Character
Validate changes         │ Character
Save character           │ CharacterManager
                         │ StorageService
```

The `CharacterEditor` doesn't validate directly - it asks `Character` to validate itself (Single Responsibility Principle).

#### Step 4: Arrange and Review

**Spatial arrangement** (if using physical cards or visual layout):
- Core classes toward center
- Highly collaborative classes close together
- Independent classes farther apart

**Review checklist:**
- [ ] All nouns from spec have corresponding classes?
- [ ] All behaviors from spec assigned to classes?
- [ ] Each responsibility has clear ownership?
- [ ] Collaborations are necessary and minimal?
- [ ] No "god classes" with too many responsibilities?
- [ ] Class names follow naming conventions?

---

## Part 2: Sequence Diagrams

### What is a Sequence Diagram?

A sequence diagram shows **how objects interact over time** for a specific scenario or use case. It complements CRC cards by showing the **dynamic behavior** of the system.

**CRC cards** = Static structure (what classes exist, what they can do)
**Sequence diagrams** = Dynamic behavior (how they work together in time)

### Creating Sequence Diagrams with PlantUML

We use **PlantUML** to generate ASCII art sequence diagrams that are both Claude-readable and human-readable.

**⚠️ CRITICAL: seq-*.md files contain ASCII art OUTPUT, NOT PlantUML source code**

**Critical requirements:**
- Diagrams must be readable by both Claude and humans in plain text
- Use PlantUML to generate clean ASCII art
- Paste the ASCII output directly into markdown files
- Do not save PlantUML source files

**Process:**
1. Write PlantUML sequence diagram syntax in a temporary .puml file
2. Run PlantUML to generate ASCII art output:
   ```bash
   java -jar .claude/bin/plantuml.jar -tutxt your-file.puml
   ```
3. Copy the ASCII art from the generated .txt file
4. Paste directly into the `seq-NAME.md` file under ## Sequence section

### Sequence Diagram File Format

**File naming:**
- Prefix: `seq-`
- Situation name (kebab-case)
- Extension: `.md`
- Examples: `seq-character-creation.md`, `seq-p2p-sync.md`, `seq-save-character.md`

**File structure:**
```markdown
# Sequence: Situation Name

**Source Spec:** specs/feature-name.md
**Use Case:** Brief description of what this sequence demonstrates

## Participants

- ActorOrClass1: Description
- ActorOrClass2: Description

## Sequence

[Paste PlantUML-generated ASCII art here]

## Notes

- Any special considerations
- Error conditions
- Alternative flows
```

**Example PlantUML input (not saved to file):**
```
@startuml
actor User
participant SplashScreen
participant CharacterEditor
participant Character

User -> SplashScreen: click "New Character"
SplashScreen -> CharacterEditor: navigate()
CharacterEditor -> Character: new()
Character -> CharacterEditor: character instance
@enduml
```

**After running through PlantUML, paste the ASCII output into the Sequence section of the markdown file.**

**⚠️ IMPORTANT: Do NOT paste PlantUML source code into seq-*.md files. Only paste the generated ASCII art output.**

### Diagram Formatting Guidelines

**Width management:**
- Keep diagrams **≤ 150 characters wide** for readability
- If diagram exceeds 150 characters, apply slimming techniques:
  1. **Use shorter participant names** - Abbreviate long class names
     - `CharacterManagerView` → `CharMgrView`
     - `CharacterStorageService` → `Storage`
     - `calculateCharacterHash` → `calcHash`
  2. **Collapse internal details** - Hide implementation internals in note boxes
     - Example: Show `Storage` with note box containing ProfileService, parse JSON, validateAndFix details
     - Use standard UML "ref" or note boxes for lower-level operations
  3. **Split into multiple diagrams** - If still too wide after abbreviations
     - Break complex sequences into logical parts (e.g., nav, load, render)

**Left margin:**
- Use **exactly 1 space character** for left margin in ASCII art diagrams
- Example:
  ```
   ┌─┐
   ║"│
   └┬┘
  ```
  (Note: single space before box-drawing characters)

**Example of collapsed internals:**
```
participant Storage
note right of Storage
  Internal:
  - ProfileService.getItem()
  - Parse JSON
  - Find by ID
  - Versioning.validateAndFix()
end note
```

### Creating Sequence Diagrams from Specs

#### Step 1: Identify Scenarios

Look for **situations** or **use cases** in the spec:
- User interactions (e.g., "User creates a character")
- System events (e.g., "Peer connects and syncs")
- Background processes (e.g., "Auto-save every 30 seconds")

**Each scenario becomes one sequence diagram.**

#### Step 2: Identify Participants

List all **actors** and **objects** involved:
- **Actors** - External entities (User, System, Peer)
- **Objects** - Instances of CRC classes

**From CRC cards:**
- Main class handling the scenario
- All its collaborators for relevant responsibilities
- Any additional classes needed

#### Step 3: Trace the Flow

Work through the scenario **step by step in time order**:

1. **Who initiates?** (Usually User or System)
2. **What message is sent?** (Method call, event, signal)
3. **Who receives it?** (Which object)
4. **Does that object need to collaborate?**
   - If YES → Add collaboration messages
   - If NO → Add return message
5. **Continue until scenario complete**

**Tips:**
- Use CRC collaborators as your guide
- Show **all** significant interactions
- Include return values when important
- Show error paths if critical

#### Step 4: Document Decisions

Add notes section for:
- Why certain design choices were made
- Alternative flows not shown
- Error handling approaches
- Timing or performance considerations

### Sequence Diagram Patterns

When creating sequence diagrams with PlantUML, use these common patterns:

#### Pattern 1: Simple CRUD Operation
Shows basic create/read/update/delete flow:
- User action triggers view
- View delegates to model
- Model persists via storage
- Success flows back through layers

#### Pattern 2: Validation Flow
Shows conditional logic with validation:
- User submits data
- Model validates against rules
- Success path: save and confirm (alt block)
- Failure path: return errors to user (alt block)

#### Pattern 3: Collaboration Chain
Shows multiple objects collaborating:
- Each object delegates to its collaborators
- Return values flow back up the chain
- Final result returned to initiator

**Note:** Write PlantUML syntax with @startuml/@enduml markers, generate ASCII art, and paste the output.

---

## Part 3: The Complete Process

### Workflow

```
1. READ specs/*.md
   ↓
2. IDENTIFY classes, responsibilities, collaborators
   ↓
3. CREATE crc-*.md files
   ↓
4. IDENTIFY scenarios from specs
   ↓
5. CREATE seq-*.md files using CRC cards as reference
   ↓
6. REVIEW for completeness
   ↓
7. GENERATE code/UI/tests/docs from CRC cards and sequences
   ↓
8. UPDATE traceability.md (formal structure: Level 1↔2, Level 2↔3 with checkboxes)
   ↓
9. ADD traceability comments to existing code (use /trace command or trace-phase agent, see below)
   ↓
10. UPDATE gaps.md documenting what CRC adds beyond specs (use gap-analyzer agent, see below)
```

### Step-by-Step Example

**Given spec:** `specs/characters.md`
> "Users can create characters with a name and attributes (STR, DEX, INT, WIL, CHA). The total of all attributes must equal exactly 50 points. Characters are saved to local storage and can be edited later."

#### Step 1: Create CRC Cards

**crc-Character.md:**
```markdown
# Character

**Source Spec:** specs/characters.md

## Responsibilities

### Knows
- name: string
- attributes: { STR, DEX, INT, WIL, CHA }
- id: unique identifier

### Does
- validate(): Check attribute total equals 50
- serialize(): Convert to JSON
- deserialize(): Create from JSON

## Collaborators

None (Character is self-contained)

## Sequences

- seq-create-character.md
- seq-edit-character.md
```

**crc-CharacterEditor.md:**
```markdown
# CharacterEditor

**Source Spec:** specs/characters.md

## Responsibilities

### Knows
- current character being edited
- original character state (for change detection)

### Does
- display character form
- handle user input
- validate changes
- save character
- navigate to list on save

## Collaborators

- Character: validate, serialize
- CharacterManager: save character
- Router: navigate to list

## Sequences

- seq-create-character.md
- seq-edit-character.md
```

**crc-CharacterManager.md:**
```markdown
# CharacterManager

**Source Spec:** specs/characters.md

## Responsibilities

### Knows
- list of all characters
- next available character ID

### Does
- load all characters from storage
- save character to storage
- delete character
- get character by ID

## Collaborators

- Character: serialize/deserialize
- LocalStorage: persist data

## Sequences

- seq-create-character.md
- seq-edit-character.md
- seq-load-characters.md
```

#### Step 2: Create Sequence Diagrams

**seq-create-character.md:**
```markdown
# Sequence: Create Character

**Source Spec:** specs/characters.md
**Use Case:** User creates a new character from the splash screen

## Participants

- User: The person using the application
- SplashScreen: Main menu view
- CharacterEditor: Character editing view
- Character: Character model
- CharacterManager: Character persistence
- LocalStorage: Browser storage API

## Sequence

[Here you would paste the PlantUML-generated ASCII art showing the interaction flow:
 User clicks button → SplashScreen navigates → CharacterEditor creates Character →
 User enters data → CharacterEditor validates → saves via CharacterManager → LocalStorage]

## Notes

- Attribute sum must equal exactly 50
- If validation fails, user stays in editor with errors
- CharacterManager loads existing characters, adds new one, saves all
```

#### Step 3: Update Traceability

**traceability.md (Level 1 ↔ Level 2 section):**
```markdown
# Traceability Map

## Level 1 ↔ Level 2 (Human Specs to Models)

### specs/characters.md

**CRC Cards:**
- crc-Character.md
- crc-CharacterEditor.md
- crc-CharacterManager.md

**Sequence Diagrams:**
- seq-create-character.md
- seq-edit-character.md
- seq-load-characters.md
```

**traceability.md (Level 2 ↔ Level 3 section with checkboxes):**
```markdown
## Level 2 ↔ Level 3 (CRC Cards to Code)

### crc-Character.md

**Source Spec:** specs/characters.md

**Implementation:**
- **src/models/Character.ts**
  - [ ] File header (CRC + Spec + Sequences)
  - [ ] ICharacter interface comment
  - [ ] validate() method comment → seq-create-character.md

**Tests:**
- **src/models/Character.test.ts**
  - [ ] File header referencing CRC card

### crc-CharacterEditor.md

**Implementation:**
- **src/ui/CharacterEditorView.ts**
  - [ ] File header (CRC + Spec + Sequences)
  - [ ] CharacterEditorView class comment → crc-CharacterEditor.md
  - [ ] handleSave() method comment → seq-create-character.md

**Tests:**
- **src/ui/CharacterEditorView.test.ts**
  - [ ] File header referencing CRC card
```

### Quality Checklist

Before generating code, verify:

**CRC Cards:**
- [ ] Every noun in spec has a class
- [ ] Every verb/action assigned to appropriate class
- [ ] All collaborations are necessary
- [ ] No god classes (too many responsibilities)
- [ ] Naming conventions followed
- [ ] All cards link back to source specs

**Sequence Diagrams:**
- [ ] Every user scenario has a sequence
- [ ] **seq-*.md files contain PlantUML ASCII art OUTPUT, NOT source code** ⚠️ **CRITICAL**
- [ ] All participants are from CRC cards
- [ ] Message flows match CRC collaborations
- [ ] Error conditions addressed
- [ ] Alternative flows documented
- [ ] All sequences link back to source specs
- [ ] **Diagrams ≤ 150 characters wide** (use abbreviations, collapsed internals if needed)
- [ ] **Left margin is exactly 1 space character**

**Traceability:**
- [ ] Code/UI/tests/docs generated from CRC cards and sequences (Step 7)
- [ ] Every CRC card traced to spec (in Level 1 ↔ Level 2 section)
- [ ] Every sequence traced to spec (in Level 1 ↔ Level 2 section)
- [ ] traceability.md Level 1 ↔ Level 2 section complete (Step 8)
- [ ] traceability.md Level 2 ↔ Level 3 section complete with all checkboxes (Step 8)
- [ ] **All checkboxes in traceability.md correspond to actual existing code elements** ⚠️ **CRITICAL**
- [ ] **Implementation files have header comments** (use /trace command, Step 9)
- [ ] **Classes have comments linking to CRC cards** (use /trace command, Step 9)
- [ ] **Interfaces have comments linking to CRC cards** (use /trace command, Step 9)
- [ ] **Key methods have comments linking to sequences** (use /trace command, Step 9)
- [ ] Traceability comments added AFTER code exists and traceability.md filled out (Step 8 before Step 9)
- [ ] All checkboxes in traceability.md checked off when comments added (use /trace command to automate)

**Gap Analysis (Step 10):**
- [ ] gaps.md updated with Type A/B/C issues identified
- [ ] Spec ambiguities documented
- [ ] Code deviations explained with rationale
- [ ] Design decisions recorded
- [ ] Implementation patterns documented
- [ ] Extra features (not in specs) cataloged

---

### Documenting Gaps (Step 8 & 10)

**Agent Available:** Use **gap-analyzer agent** (`.claude/agents/gap-analyzer.md`) to automate gap analysis.

The **gap-analyzer agent** performs comprehensive gap analysis for a phase and writes results to `.claude/scratch/gaps-phaseX.md` for review before insertion into `gaps.md`.

**Manual process:** The **`gaps.md`** file (see `specs-crc/gaps.md`) documents **what the CRC process reveals that wasn't in the original specs**. This is critical for:

1. **Bidirectional traceability** - Not just specs→CRC→code, but also reality→CRC→specs
2. **Gap analysis** - Type A/B/C issues identified during CRC review
3. **Design rationale** - Why certain implementation choices were made
4. **Spec ambiguities** - Inconsistencies or unclear requirements discovered
5. **Implementation reality** - What's actually in the code vs. what's in the specs

**Update gaps.md after completing CRC cards and sequence diagrams for each phase.**

**What to document:**

#### Type A/B/C Issues

Track discrepancies discovered during CRC review:

- **Type A** = Spec-required features NOT implemented (critical fixes)
- **Type B** = Design improvements / code quality issues
- **Type C** = Enhancements not strictly required (deferred)

**Example:**
```markdown
## Phase 1: Type A Issue

**Issue A1: Hash-Based Save Optimization**
- **Spec:** specs/characters.md lines 212-265 fully documented hash optimization
- **Reality:** Code always writes to storage (hash comparison not implemented)
- **Impact:** Unnecessary storage writes on every save
- **Status:** FIXED in Phase 1 ✅
```

#### Implementation Reality vs. Spec

Document what's working, what's missing, and what's extra:

**Example:**
```markdown
## CharacterStorageService

✅ **Working well:**
- Pure static methods
- Comprehensive calculation coverage
- Matches spec formulas exactly

⚠️ **Potential issues:**
- MAJOR DEVIATION: Spec says individual keys, code uses array
- Hash optimization not implemented

📝 **Extra (code has, spec doesn't mention):**
- Default character examples
- Comprehensive validation on load
```

#### Spec Ambiguities

Track inconsistencies in specifications:

**Example:**
```markdown
## Attribute Range Inconsistency

- Spec says: -2 to 15 (specs/characters.md line 510)
- Code validates: 0-4 in creation, -2 to 15 in storage
- **Resolution needed:** Clarify actual range with team
```

#### Design Decisions & Rationale

Explain **why** implementation choices were made:

**Example:**
```markdown
## Storage Pattern Decision

**Current:** Array of all characters in single key
**Spec:** Individual keys per character

**Analysis:**
- Array approach simpler for getAllCharacters()
- Individual keys more efficient for single saves
- With hash optimization, less critical

**Decision:** DEFER to Type C (not critical)
- Current approach works
- Changing risky for existing users
- Would require migration
```

**gaps.md provides the context needed for future development, ensuring design intent is preserved.**

**Using the gap-analyzer agent:**
```
Use gap-analyzer agent to analyze Phase 2 gaps
```

The agent will:
1. Read all CRC cards, sequences, implementation files, and specs for the phase
2. Identify Type A/B/C issues
3. Document implementation patterns
4. Write analysis to `.claude/scratch/gaps-phaseX.md`
5. Main agent uses Edit tool to insert into gaps.md
6. User reviews diff in IDE and approves

---

### Adding Traceability Comments (Step 9)

**Agent Available:** Use **trace-phase agent** (`.claude/agents/trace-phase.md`) to batch-process all files in a phase.

The **trace-phase agent** processes each CRC card in a phase, runs `/trace` for each, and applies comments via Edit tool for user approval.

**Manual process:** See `specs-crc/traceability-guide.md` for complete documentation of the `/trace` command and manual traceability workflows.

**Using the trace-phase agent:**
```
Use trace-phase agent to add traceability comments for Phase 2
```

The agent will:
1. Identify all CRC cards belonging to the phase from traceability.md
2. Process each file one at a time:
   - Run `./.claude/scripts/trace-add-comments.py <CardName>`
   - Read original and new versions
   - Use Edit tool to apply changes (user sees diffs)
   - Clean up scratch file on approval
3. Verify all comments added with grep count
4. Report summary of changes

**Benefits of using the agent:**
- Processes entire phase systematically
- No files accidentally skipped
- Consistent application across phase
- Progress tracking and error handling
- User still approves each diff via Edit tool

---

## Part 4: File Organization

### Directory Structure

```
specs-crc/
├── crc.md                      # This document (CRC modeling overview)
├── traceability.md             # Formal traceability map (checkboxes)
├── traceability-guide.md       # Complete traceability guide
├── gaps.md                     # Gap analysis (Step 8 & 10)
├── crc-ClassName.md            # One per class
├── seq-scenario-name.md        # One per scenario
└── resources/                  # Reference materials
    └── ambler-summary.md

.claude/agents/
├── gap-analyzer.md             # Agent for automating gap analysis
└── trace-phase.md              # Agent for batch traceability comments

.claude/scratch/
├── gaps-phaseX.md              # Gap analysis output (for review)
└── ClassName.trace-new.ts      # Traceability comment output (for review)
```

**Documentation Split:**
- `crc.md` - CRC modeling basics, workflow, quality checklist (you are here)
- `traceability-guide.md` - Comment formats, /trace command, verification
- `gaps.md` - Type A/B/C issues, implementation reality, design rationale

**Agents:**
- `gap-analyzer.md` - Automates Steps 8 & 10 (gap analysis)
- `trace-phase.md` - Automates Step 9 (traceability comments)

### Naming Conventions

**CRC Card Files:**
- Format: `crc-ClassName.md`
- ClassName in PascalCase
- Examples:
  - `crc-Character.md`
  - `crc-CharacterEditor.md`
  - `crc-FriendsManager.md`
  - `crc-P2PConnection.md`

**Sequence Diagram Files:**
- Format: `seq-scenario-name.md`
- scenario-name in kebab-case
- Examples:
  - `seq-create-character.md`
  - `seq-peer-sync.md`
  - `seq-save-and-navigate.md`
  - `seq-friend-connection-established.md`

### File Templates

**CRC Card Template:**
```markdown
# ClassName

**Source Spec:** specs/source-file.md

## Responsibilities

### Knows
- attribute1: description
- attribute2: description

### Does
- behavior1: description
- behavior2: description

## Collaborators

- Collaborator1: reason for collaboration
- Collaborator2: reason for collaboration

## Sequences

- seq-scenario1.md: description
- seq-scenario2.md: description
```

**Sequence Diagram Template:**
```markdown
# Sequence: Scenario Name

**Source Spec:** specs/source-file.md
**Use Case:** Brief description

## Participants

- Participant1: role/description
- Participant2: role/description

## Sequence

` ``
Participant1 -> Participant2: message
Participant2 -> Participant3: message
Participant3 --> Participant2: return
Participant2 --> Participant1: return
` ``

## Notes

- Important considerations
- Error conditions
- Alternative flows
```

---

## Part 5: From Models to Code

### Code Generation Principles

1. **One CRC card = One TypeScript class** (usually)
2. **Responsibilities → Methods and properties**
3. **Collaborators → Dependencies (constructor params or imports)**
4. **Sequences → Method implementations**

### Example Transformation

**From CRC Card:**
```markdown
# Character

## Responsibilities

### Knows
- name: string
- attributes: IAttributes (STR, DEX, INT, WIL, CHA)

### Does
- validate(): boolean
- serialize(): string

## Collaborators

None
```

**To TypeScript Code:**
```typescript
interface IAttributes {
  STR: number;
  DEX: number;
  INT: number;
  WIL: number;
  CHA: number;
}

class Character {
  private name: string;
  private attributes: IAttributes;

  constructor(name: string, attributes: IAttributes) {
    this.name = name;
    this.attributes = attributes;
  }

  public validate(): boolean {
    const total = Object.values(this.attributes).reduce((sum, val) => sum + val, 0);
    return total === 50;
  }

  public serialize(): string {
    return JSON.stringify({
      name: this.name,
      attributes: this.attributes
    });
  }
}
```

**From Sequence Diagram:**
The `seq-create-character.md` sequence shows:
- `Character.validate()` must sum attributes and check === 50
- `Character.serialize()` returns JSON string
- `CharacterManager.save()` calls `LocalStorage.set()`

This guides the **implementation details** of each method.

### UI Generation

**From CRC Card:**
```markdown
# CharacterEditor

## Responsibilities

### Does
- display character form
- handle user input
- save character
```

**To HTML Template:**
```html
<!-- public/templates/character-editor.html -->
<div class="character-editor">
  <h2>Character Editor</h2>
  <form id="character-form">
    <input type="text" id="char-name" placeholder="Name">
    <input type="number" id="attr-str" placeholder="STR">
    <input type="number" id="attr-dex" placeholder="DEX">
    <!-- ... -->
    <button type="submit">Save</button>
  </form>
</div>
```

**To TypeScript View:**
```typescript
class CharacterEditorView {
  private character: Character;
  private characterManager: CharacterManager;

  public async render(): Promise<void> {
    // Uses template engine to load HTML
    const html = await loadTemplate('character-editor');
    document.getElementById('app').innerHTML = html;
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    document.getElementById('character-form')
      .addEventListener('submit', (e) => this.handleSave(e));
  }

  private handleSave(e: Event): void {
    e.preventDefault();
    if (this.character.validate()) {
      this.characterManager.save(this.character);
      // Navigate per sequence diagram
    }
  }
}
```

### Test Generation

**From CRC Card + Sequence:**
```typescript
describe('Character', () => {
  describe('validate', () => {
    it('returns true when attributes sum to 50', () => {
      const char = new Character('Test', {
        STR: 10, DEX: 10, INT: 10, WIL: 10, CHA: 10
      });
      expect(char.validate()).toBe(true);
    });

    it('returns false when attributes sum is not 50', () => {
      const char = new Character('Test', {
        STR: 10, DEX: 10, INT: 10, WIL: 10, CHA: 11
      });
      expect(char.validate()).toBe(false);
    });
  });
});
```

**From Sequence Diagram:**
```typescript
describe('Character creation flow', () => {
  it('follows the complete sequence', async () => {
    // Setup from seq-create-character.md
    const editor = new CharacterEditor();
    const character = new Character('Zeke', attributes);

    // Test each step of sequence
    expect(character.validate()).toBe(true);
    const json = character.serialize();
    await characterManager.save(json);

    // Verify storage collaboration
    expect(localStorage.getItem('characters')).toContain('Zeke');
  });
});
```

---

## Summary

### The Complete Process

1. **Write specs** in natural language (`specs/*.md`)
2. **Create CRC cards** identifying classes and responsibilities (`crc-*.md`)
3. **Create sequences** showing object interactions (`seq-*.md`)
4. **Generate code** from CRC cards (classes, methods, properties)
5. **Generate UI** from view CRC cards (templates, event handlers)
6. **Generate tests** from CRC cards and sequences
7. **Generate docs** from all sources
8. **Update traceability** with formal checkbox structure (`traceability.md`)
9. **Add traceability comments** to existing code (using checkboxes as checklist)

### Key Benefits

- **Clarity** - Models are easier to understand than code
- **Traceability** - Every line of code traces back to requirements
- **Completeness** - Systematic process catches missing pieces
- **Consistency** - Models ensure uniform implementation
- **Communication** - Clear models facilitate collaboration
- **Flexibility** - Easy to change models before coding

### Remember

- CRC cards = **structure** (what exists)
- Sequences = **behavior** (how it works)
- Together they form a **complete specification**
- Code is **generated from** models, not the other way around
- Models are the **source of truth**
- **Traceability.md checkboxes** = enforcement mechanism (ensures nothing gets skipped)
