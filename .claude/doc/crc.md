# CRC Modeling Documentation

Complete guide to Class-Responsibility-Collaboration (CRC) modeling for software projects.

## Table of Contents

1. [What is CRC Modeling?](#what-is-crc-modeling)
2. [Quick Start](#quick-start)
3. [Three-Tier System](#three-tier-system)
4. [Directory Structure](#directory-structure)
5. [Required Components](#required-components)
6. [Workflow](#workflow)
7. [CRC Cards](#crc-cards)
8. [Sequence Diagrams](#sequence-diagrams)
9. [UI Specifications](#ui-specifications)
10. [Traceability](#traceability)
11. [Bidirectional Updates](#bidirectional-updates)
12. [Benefits](#benefits)

---

## What is CRC Modeling?

**CRC (Class-Responsibility-Collaboration)** is a design methodology that creates an intermediate layer between human requirements and code implementation.

**Core principle:** Explicit design phase prevents architectural problems and ensures complete, traceable specifications.

**Three-tier system:**
```
Level 1: Human specs (specs/*.md)        ← Requirements, intent, "WHAT" and "WHY"
   ↓
Level 2: Design models (design/*.md)     ← Structure, behavior, "HOW" at design level
   ↓
Level 3: Implementation (source code)    ← Concrete code, "HOW" at implementation level
```

---

## Quick Start

### Initialize CRC in Your Project

```bash
# Run the initialization command
./.claude/scripts/init-crc-project.sh
```

This will:
- Create `specs/` and `design/` directories
- Check for required components (designer agent, PlantUML)
- Update CLAUDE.md with CRC workflow sections
- Show next steps

### Basic Workflow

1. **Write specs** in `specs/*.md` (human-readable requirements)
2. **Generate designs** using designer agent:
   ```
   Task(subagent_type="designer", prompt="Generate Level 2 specs for specs/feature.md")
   ```
3. **Implement code** following CRC cards and sequences, adding traceability comments

---

## Three-Tier System

### Level 1: Human Specs (`specs/*.md`)

**Purpose:** Document WHAT needs to be built and WHY

**Content:**
- Requirements and user stories
- Architecture and design intent
- UX flows and interaction patterns
- Business logic and rules
- Principles and constraints

**Format:** Markdown, human-readable, focuses on intent

**Example:** `specs/friends.md` describes friend management requirements

### Level 2: Design Models (`design/*.md`)

**Purpose:** Document HOW it will be structured (design level)

**Content:**
- CRC cards: Classes, responsibilities, collaborators
- Sequence diagrams: Object interactions over time
- UI specs: Layout structure, data bindings, events
- Traceability map: Links between all levels
- Gap analysis: What's missing or ambiguous

**Format:** Structured markdown with ASCII diagrams

**Example:** `design/crc-FriendsManager.md` defines the FriendsManager class design

### Level 3: Implementation (Source Code)

**Purpose:** Concrete implementation (code level)

**Content:**
- Classes, methods, functions
- Templates, views, components
- Tests and documentation
- Traceability comments linking to Level 2

**Format:** Your programming language

**Example:** `src/FriendsManager.ts` implements the design from the CRC card

---

## Directory Structure

```
project-root/
├── .claude/
│   ├── agents/
│   │   ├── designer.md          # Level 2 spec generator (REQUIRED)
│   │   ├── diagram-converter.md # Optional: PlantUML conversion
│   │   └── gap-analyzer.md      # Optional: Gap analysis
│   ├── scripts/
│   │   ├── init-crc-project.sh  # Initialization command
│   │   └── plantuml.sh          # PlantUML ASCII art generator
│   ├── skills/
│   │   ├── init-crc-project.md  # Initialization skill
│   │   └── plantuml.md          # PlantUML skill documentation
│   ├── doc/
│   │   └── crc.md               # This file
│   └── bin/
│       └── plantuml.jar         # PlantUML executable
├── specs/                        # Level 1: Human-written specs
│   ├── feature1.md
│   └── feature2.md
├── design/                       # Level 2: Generated CRC/sequences/UI specs
│   ├── crc-ClassName.md         # CRC cards (one per class)
│   ├── seq-scenario.md          # Sequence diagrams (one per scenario)
│   ├── ui-view-name.md          # UI layout specs (one per view)
│   ├── manifest-ui.md           # Global UI concerns
│   ├── traceability.md          # Formal traceability map
│   └── gaps.md                  # Gap analysis
└── [source-code]/                # Level 3: Implementation
    └── ...                       # (src/, lib/, app/, pkg/, etc.)
```

**Note:** Source code directory name varies by project. Adapt to your conventions.

---

## Required Components

### 1. Designer Agent

**File:** `.claude/agents/designer.md`

**Purpose:** Generates Level 2 design specs from Level 1 human specs

**What it creates:**
- CRC cards for all classes
- Sequence diagrams for all scenarios
- UI layout specifications
- Traceability map
- Gap analysis

**Usage:**
```
Task(
  subagent_type="designer",
  prompt="Generate Level 2 specs for specs/feature.md. Output to design/"
)
```

### 2. PlantUML Setup

**Required files:**
- `.claude/scripts/plantuml.sh` - Wrapper script
- `.claude/skills/plantuml.md` - Skill documentation
- `.claude/bin/plantuml.jar` - PlantUML executable (download from https://plantuml.com/download)
- Java runtime (required by PlantUML)

**Usage:** Script generates ASCII sequence diagrams from PlantUML syntax

**Permissions:** Add to `.claude/settings.local.json`:
```json
{
  "permissions": {
    "allow": [
      "Skill(plantuml)",
      "Bash(./.claude/scripts/*.sh:*)",
      "Bash(.claude/scripts/*.sh:*)"
    ]
  }
}
```

### 3. Optional Supporting Agents

- **diagram-converter** - Converts PlantUML to ASCII art (alternative to direct script)
- **gap-analyzer** - Analyzes gaps between specs and implementation

---

## Workflow

### Step 1: Write Level 1 Specs

Create human-readable specifications in `specs/*.md`:

```markdown
# Friends Feature

## Requirements

Users can add friends by peer ID, view friend status, and manage their friends list.

## User Stories

1. As a user, I want to add a friend by entering their peer ID
2. As a user, I want to see which friends are online
3. As a user, I want to remove friends I no longer connect with

## Data

- Friend: name, peerId, notes, pending status
- Friends list stored in LocalStorage
```

### Step 2: Generate Level 2 Designs

Use the designer agent:

```
Task(
  subagent_type="designer",
  description="Generate design specs for friends",
  prompt="Generate complete Level 2 design specifications for specs/friends.md.

  Output to design/ directory.

  Create:
  - CRC cards for all classes
  - Sequence diagrams for all scenarios
  - UI layout specifications
  - Traceability map
  - Gap analysis"
)
```

**Output:** CRC cards, sequences, UI specs, traceability map, gaps document

### Step 3: Review Generated Designs

Check generated files:
- `design/crc-*.md` - Do classes have clear responsibilities?
- `design/seq-*.md` - Do sequences cover all scenarios?
- `design/ui-*.md` - Are layouts complete?
- `design/gaps.md` - Are there critical gaps to address?

### Step 4: Implement Level 3 Code

Write code following the CRC cards and sequences:

**Add traceability comments** linking to design specs:

```typescript
/**
 * CRC: design/crc-FriendsManager.md
 * Spec: specs/friends.md
 * Sequences: design/seq-add-friend.md, design/seq-remove-friend.md
 */
class FriendsManager {
  /**
   * CRC: design/crc-FriendsManager.md - "Does: Add friend to list"
   * Sequence: design/seq-add-friend.md
   */
  addFriend(peerId: string, name: string): void {
    // implementation
  }
}
```

### Step 5: Update Bidirectionally

When code changes, update design specs. When design changes, update high-level specs.

---

## CRC Cards

### Purpose

CRC cards define **classes**, their **responsibilities**, and **collaborations**.

### Format

**File naming:** `design/crc-ClassName.md`

**Template:**
```markdown
# ClassName

**Source Spec:** source-file.md

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

- seq-scenario1.md: brief description
- seq-scenario2.md: brief description
```

### Example

```markdown
# FriendsManager

**Source Spec:** friends.md

## Responsibilities

### Knows
- friends: Array of Friend objects
- unsentRequests: Set of peer IDs with unsent friend requests

### Does
- addFriend: Create new friend with 'unsent' status
- removeFriend: Delete friend from list
- saveFriends: Persist to LocalStorage
- notifyUpdateListeners: Trigger UI updates

## Collaborators

- LocalStorage: For persisting friend data
- P2PService: For sending friend requests
- FriendsView: Notifies of data changes

## Sequences

- seq-add-friend.md: User adds friend by peer ID
- seq-remove-friend.md: User removes friend
```

---

## Sequence Diagrams

### Purpose

Sequence diagrams show **object interactions over time** for specific scenarios.

### Format

**File naming:** `design/seq-scenario-name.md`

**Template:**
```markdown
# Sequence: Scenario Name

**Source Spec:** source-file.md
**Use Case:** Brief description

## Participants

- Participant1: role/description
- Participant2: role/description

## Sequence

[PlantUML-generated ASCII art here]

## Notes

- Special considerations
- Error conditions
- Alternative flows
```

### Creating Sequences

Use PlantUML via bash (pre-approved):

```bash
./.claude/scripts/plantuml.sh sequence "User -> FriendsManager: addFriend()
FriendsManager -> LocalStorage: save()
FriendsManager -> P2PService: sendRequest()
P2PService --> FriendsManager: ack"
```

**Important:** Pass PlantUML source as quoted argument (NOT heredoc) for pre-approval.

---

## UI Specifications

### Purpose

UI specs define **layout structure** for views and components.

### Format

**File naming:** `design/ui-view-name.md`

**Template:**
```markdown
# ViewName

**Source**: ui.feature.md
**Route**: /route (see manifest-ui.md)

**Purpose**: Brief description

**Data** (see crc-*.md):
- `dataItem1: Type` - Description

**Layout**:
[ASCII art diagram here]

**Events** (see crc-*.md):
- `eventName()` - Description

**CSS Classes**:
- `class-name` - Usage
```

### Principles

1. **Separation**: Layout (design) ≠ Styling (CSS) ≠ Behavior (CRC)
2. **Terseness**: Scannable lists, ASCII art, minimal prose
3. **Data clarity**: Always reference CRC cards for types
4. **References**: Point to CRC cards for behavior, manifest-ui.md for global concerns

---

## Traceability

### Purpose

Maintain **bidirectional links** between all three levels.

### Traceability Map

**File:** `design/traceability.md`

**Structure:**
```markdown
# Traceability Map

## Level 1 ↔ Level 2 (Specs to Models)

### feature.md

**CRC Cards:**
- crc-Class1.md
- crc-Class2.md

**Sequence Diagrams:**
- seq-scenario1.md

**UI Specs:**
- ui-view-name.md

## Level 2 ↔ Level 3 (Models to Implementation)

### crc-ClassName.md

**Source Spec:** feature.md

**Implementation:**
- **path/to/ClassName.ext**
  - [ ] File header (CRC + Spec + Sequences)
  - [ ] ClassName class comment → crc-ClassName.md
  - [ ] methodName() comment → seq-scenario.md

**Tests:**
- **path/to/ClassName.test.ext**
  - [ ] File header referencing CRC card
```

### Traceability Comments in Code

Add comments linking implementation to design:

**TypeScript/JavaScript/Java/C#:**
```typescript
/**
 * CRC: design/crc-ClassName.md
 * Spec: specs/feature.md
 * Sequences: design/seq-scenario.md
 */
class ClassName {
  /**
   * CRC: design/crc-ClassName.md - "Does: methodName behavior"
   * Sequence: design/seq-scenario.md
   */
  methodName() {
    // implementation
  }
}
```

**Python:**
```python
"""
CRC: design/crc-ClassName.md
Spec: specs/feature.md
Sequences: design/seq-scenario.md
"""
class ClassName:
    def method_name(self):
        """
        CRC: design/crc-ClassName.md - "Does: method_name behavior"
        Sequence: design/seq-scenario.md
        """
        # implementation
```

**Adapt comment syntax to your language.**

---

## Bidirectional Updates

### Principle

**When any level changes, propagate updates through the documentation hierarchy.**

### Source Code Changes → Design Specs

- Modified implementation → Update CRC cards/sequences/UI specs if structure/behavior changed
- New classes/methods → Create corresponding CRC cards
- Changed interactions → Update sequence diagrams
- Template/view changes → Update UI specs

### Design Spec Changes → Architectural Specs

- Modified CRC cards/sequences → Update high-level specs if requirements/architecture affected
- New components → Document in feature specs
- Changed workflows → Update architectural documentation
- UI pattern changes → Update UI principles

### Abstraction Rules

1. **Always update up**: When code/design changes, ripple changes upward
2. **Maintain abstraction**: Each level documents at its appropriate abstraction level
3. **Keep consistency**: All three tiers must tell the same story
4. **Update traceability comments**: When docs change, update references in code

### Example Flow

```
User identifies missing persistence →
Update specs/game-worlds.md (add persistence requirement) →
Update design/crc-AdventureMode.md (add persistence responsibility) →
Update source code (implement + add traceability comments)

Later: Bug fix in implementation (terminateActiveWorld logic) →
Review if CRC card needs update (it does - split cleanup behavior) →
Review if specs/game-worlds.md needs update (it does - clarify persistence rules)
```

This ensures documentation remains **accurate and useful**, not just aspirational.

---

## Benefits

### 1. Better Architecture

- **Explicit design phase** prevents shotgun surgery and god classes
- **SOLID principles** naturally emerge from CRC (single responsibility, clear collaborations)
- **Early problem detection** catches design issues before coding

### 2. Complete Specifications

- **Sequences catch edge cases** that specs miss
- **All scenarios documented** before implementation
- **Clear interaction patterns** prevent integration problems

### 3. Traceability

- **Every line traces to design and requirements**
- **Impact analysis** easy (find all code for a requirement)
- **Audit trail** for decisions and changes

### 4. Maintainability

- **Changes propagate** through all documentation levels
- **Consistent story** at all abstraction levels
- **Refactoring guided** by design specs

### 5. Onboarding

- **New developers** understand system from design docs
- **Three levels** provide entry points for different learning styles
- **Complete documentation** reduces tribal knowledge

### 6. Quality

- **Testable** - sequences define test scenarios
- **Reviewable** - designs reviewed before coding
- **Verifiable** - traceability ensures completeness

---

## Additional Resources

### CLAUDE.md Sections

To add CRC workflow to your project's `CLAUDE.md`, see `.claude/shared/crc-install.md` for copy-paste snippets.

### Agent Documentation

- `.claude/agents/designer.md` - Designer agent complete documentation
- `.claude/agents/diagram-converter.md` - Sequence diagram converter
- `.claude/agents/gap-analyzer.md` - Gap analysis agent

### Skills

- `.claude/skills/init-crc-project.md` - Initialization command
- `.claude/skills/plantuml.md` - PlantUML sequence diagrams

---

**Last updated:** 2025-11-14
