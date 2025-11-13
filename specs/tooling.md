# Development Tooling

**Tools, scripts, and utilities for HollowWorld development**

---

## Diagrams with d2

### Overview

**Use d2 for all architecture/flow diagrams** - Never hand-craft ASCII art diagrams

d2 is a diagram scripting language that generates clean, professional diagrams. It provides:
- Clean, version-controllable source files
- Automatic layout (no manual alignment headaches)
- Consistent styling
- Regenerable output

### Directory Structure

```
.claude/diagrams/
├── README.md              # Full documentation
├── sources/               # d2 source files (version controlled)
│   ├── my-diagram.d2
│   └── ...
├── output/                # Generated diagrams (gitignored)
│   ├── my-diagram.txt
│   └── ...
└── scripts/
    └── diagrams-generate.sh  # Generation script
```

### Creating Diagrams

**1. Write d2 source file:**

Create `.claude/diagrams/sources/my-diagram.d2`:
```d2
# Example: P2P Architecture
Browser 1 -> p2p-webapp: WebSocket
Browser 2 -> p2p-webapp: WebSocket
p2p-webapp -> Browser 1: Peer messages
p2p-webapp -> Browser 2: Peer messages
```

**2. Generate ASCII output:**

```bash
./.claude/scripts/diagrams-generate.sh
```

This creates `.claude/diagrams/output/my-diagram.txt`

**3. Embed in markdown:**

```markdown
<!-- BEGIN DIAGRAM: my-diagram -->
<!-- Generated from .claude/diagrams/sources/my-diagram.d2 -->
<!-- Regenerate with: ./.claude/scripts/diagrams-generate.sh -->
```
[paste ASCII art here]
```
<!-- END DIAGRAM: my-diagram -->
```

### Benefits

✅ **Clean source**: d2 files are readable and version-controlled
✅ **Automatic layout**: No manual alignment or spacing
✅ **Regenerable**: Easy to update diagrams
✅ **Consistent**: All diagrams use same style
✅ **No headaches**: d2 handles all the formatting

### Documentation

See `.claude/diagrams/README.md` for complete d2 documentation and examples.

---

## ASCII Art Tools

### Artist Agent

**ALWAYS use the artist agent** for creating or fixing ASCII art diagrams with box-drawing characters.

The artist agent is a specialized tool for:
- Creating architecture diagrams with box-drawing characters
- Fixing alignment issues in existing ASCII art
- Ensuring consistent line widths and vertical borders
- Validating nested box corner alignment

### When to Use

- Creating new ASCII art diagrams in markdown files (especially `specs/*.md`)
- Fixing misaligned borders or characters
- Validating existing ASCII art
- Converting text diagrams to proper box-drawing characters

### How to Use

**Invoke proactively when creating/editing ASCII art:**

```
"I need to add a diagram showing the P2P architecture"
→ Use artist agent to create it

"This ASCII diagram has alignment issues"
→ Use artist agent to fix it
```

### Pre-Approved Scripts

The artist agent has pre-approved analysis scripts in `.claude/scripts/ascii-*.sh`:
- `ascii-analyze.sh` - Analyze ASCII art for issues
- `ascii-fix-lines.sh` - Fix line alignment
- `ascii-validate.sh` - Validate box-drawing characters
- `ascii-auto-fix.sh` - Automatically fix common issues

These scripts don't require permission prompts.

---

## Development Scripts

### Build & Dev Scripts

Located in project root:

**`build.sh`** - Build production bundle
```bash
./build.sh
```

**`dev.sh`** - Start development mode (watch + serve)
```bash
./dev.sh
```

### Diagram Scripts

Located in `.claude/scripts/`:

**`diagrams-generate.sh`** - Generate all diagrams
```bash
./.claude/scripts/diagrams-generate.sh

# Or generate specific diagram
./.claude/scripts/diagrams-generate.sh my-diagram
```

### ASCII Art Scripts

Located in `.claude/scripts/`:

**`ascii-analyze.sh`** - Analyze ASCII art
```bash
./.claude/scripts/ascii-analyze.sh <file>
```

**`ascii-validate.sh`** - Validate box-drawing characters
```bash
./.claude/scripts/ascii-validate.sh <file>
```

**`ascii-auto-fix.sh`** - Auto-fix common issues
```bash
./.claude/scripts/ascii-auto-fix.sh <file>
```

---

## Skills

### What are Skills?

Skills are pre-approved command sequences that can be invoked without permission prompts. They're useful for repetitive tasks.

**Currently available:**
- `ascii-analyze` - Analyze and fix ASCII art

### Creating New Skills

Skills are defined in `.claude/skills/*.md`:

**Example skill structure:**
```markdown
# Skill Name

Short description of what this skill does

## Commands

```bash
# Pre-approved commands
command1
command2
```

## Usage

How to invoke this skill
```

### Suggesting New Skills

Consider creating skills for:
- Build/test runners
- Code formatting checks
- Log parsing
- Deployment tasks
- Database migrations

See CLAUDE.md "Daily Reminders" for skill creation suggestions.

---

## Utilities

### Hash Utilities

**Location**: `src/utils/characterHash.ts`

Calculate cryptographic hashes for change detection:

```typescript
import { hashCharacter } from './utils/characterHash';

const hash = await hashCharacter(character);
```

See [`coding-standards.md`](coding-standards.md#hash-based-change-detection) for usage details.

### Template Engine

**Location**: `src/TemplateEngine.ts`

Render HTML templates:

```typescript
const html = await templateEngine.renderTemplateFromFile('template-name', {
    data: value
});
```

All HTML rendering must use TemplateEngine. See [`coding-standards.md`](coding-standards.md#-no-html-strings-in-typescriptjavascript).

### Character Utilities

Various character manipulation utilities in `src/utils/`:
- Validation
- Calculation (XP, chips, advancement)
- Serialization

---

## VSCode Integration

### Recommended Extensions

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Language support
- **Playwright Test** - Test integration

### Settings

Workspace settings in `.vscode/settings.json`:
- Auto-format on save
- ESLint integration
- TypeScript strict mode

---

## Git Hooks

### Pre-commit Hooks

Consider adding pre-commit hooks for:
- Code formatting (Prettier)
- Linting (ESLint)
- Type checking (tsc --noEmit)
- Test execution

Use tools like `husky` or `pre-commit` to manage hooks.

---

## CI/CD

### GitHub Actions (Future)

Potential CI/CD workflows:
- **Build**: Run on every push
- **Test**: Run unit and E2E tests
- **Deploy**: Deploy to itch.io on release

See [`itch-io.md`](itch-io.md) for deployment details.

---

## Debugging

### Browser DevTools

**Console:**
- P2P messages logged with prefix
- WebSocket connection status
- Error messages and stack traces

**Network:**
- WebSocket frames (filter by "ws://")
- Asset loading
- Template requests

**Storage:**
- LocalStorage: Characters, profiles, settings
- IndexedDB: TextCraft worlds

### Server Logs

p2p-webapp provides verbose logging with `-v` flag:

```bash
bin/p2p-webapp --dir hollow-world-p2p -v
```

Shows:
- Peer connections/disconnections
- Message routing
- WebSocket handshakes
- HTTP requests

---

## Performance Profiling

### Browser Performance Tools

**Chrome DevTools Performance Tab:**
- Record page load
- Identify slow operations
- Check rendering performance
- Monitor memory usage

**Lighthouse:**
- Automated performance audits
- Accessibility checks
- Best practices verification

### Optimization Tips

See [`coding-standards.md`](coding-standards.md#performance) for performance guidelines.

---

## Documentation Tools

### Markdown Preview

Use VSCode or other markdown viewers to preview:
- Spec files (`specs/*.md`)
- README files
- Documentation

### Diagram Viewers

d2 diagrams can be viewed in:
- Text editors (ASCII output)
- d2 playground (online)
- Local d2 viewer

---

## References

- **Main Spec**: [`main.md`](main.md)
- **Coding Standards**: [`coding-standards.md`](coding-standards.md)
- **Development**: [`development.md`](development.md)
- **Testing**: [`testing.md`](testing.md)
- **d2 Documentation**: `.claude/diagrams/README.md`
- **ASCII Art Agent**: `.claude/agent/artist.md`
