# Installation for CRC

## make sure these are in CLAUDE.md in the project root

### In a prominent place in the top section
```markdown
**DO NOT generate code directly from `specs/*.md` files!**

All specs referenced in this file are **human-readable design documents** (intent, UX, architecture).

**Use a three-tier system to implement human-written specs:**
```
Level 1: Human specs (specs/*.md)
   ↓
Level 2: Design models (design/*.md) ← YOU CREATE THESE
   ↓
Level 3: Implementation (src/**/*.ts, public/templates/*.html)
```

**Correct workflow for code generation**:
1. Read human specs (`specs/*.md`) for design intent
2. **Use `designer` agent** to create/consult Level 2 design specs (CRC cards, sequences, UI specs) ⚠️ **REQUIRED**
3. Generate/write code (templates + TypeScript) following complete specification with traceability comments

**For creating designs (level 2)**: Use the `designer` agent (`.claude/agent/designer.md`) - it handles CRC cards, sequence diagrams, and UI layout specs
```

### In Daily Reminders
```markdown
⚠️ **CRITICAL - Creating Level 2 Specs:**
- **Use `designer` agent** (`.claude/agent/designer.md`) when creating CRC cards, sequences, or UI specs
  - Handles complete workflow: specs → CRC cards → sequence diagrams → UI specs
  - Manages traceability and gap analysis
  - Integrates with diagram-converter and gap-analyzer agents
  - Use: `Task(subagent_type="designer", ...)`

- **Skills Opportunity**: Once per day, suggest creating new skills (`.claude/skills/*.md`) for repetitive tasks that could benefit from pre-approved scripts or commands (e.g., build/test runners, code formatting checks, log parsing). Currently available: `ascii-analyze`, `plantuml`, `trace`
```

### In Development & Coding
```markdown
- **`designer` agent** (`.claude/agent/designer.md`) - Level 2 spec generation (CRC cards, sequences, UI specs)
```

### In 🏗️ CRC Modeling Development Process
```markdown
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
  - Use `designer` agent to create UI specs

**Key principle**: CRC models are **source of truth** for structure, UI specs are **source of truth** for layout, human specs are **source of truth** for intent.

**Creating Level 2 Specs**: Use `designer` agent (`.claude/agent/designer.md`) for complete workflow
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
```
