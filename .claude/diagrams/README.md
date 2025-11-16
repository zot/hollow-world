# Diagram Generation with d2

This directory contains d2 diagram sources and tools to generate ASCII art diagrams for embedding in markdown specifications.

## Directory Structure

```
.claude/
├── diagrams/
│   ├── sources/      # d2 source files (.d2)
│   ├── output/       # Generated ASCII diagrams (.txt)
│   └── README.md     # This file
└── scripts/
    └── diagrams-generate.sh  # Script to generate all diagrams
```

## Installation

Install d2 if not already installed:

```bash
curl -fsSL https://d2lang.com/install.sh | sh -s --
```

## Usage

### 1. Create a d2 Diagram Source

Create a `.d2` file in `.claude/diagrams/sources/`:

```d2
# .claude/diagrams/sources/my-diagram.d2
direction: right

componentA: "Component A"
componentB: "Component B"

componentA -> componentB: connection
```

### 2. Generate ASCII Art

Run the generation script:

```bash
./.claude/scripts/diagrams-generate.sh
```

Or generate a specific diagram:

```bash
d2 --layout=dagre .claude/diagrams/sources/my-diagram.d2 - --stdout-format=ascii > .claude/diagrams/output/my-diagram.txt
```

### 3. Embed in Markdown

Copy the ASCII art from `output/*.txt` and paste into your spec file:

```markdown
## Architecture Diagram

<!-- BEGIN DIAGRAM: my-diagram -->
```
<diagram content here>
```
<!-- END DIAGRAM: my-diagram -->
```

## Tips for Good ASCII Diagrams

1. **Keep labels short** - Avoid newlines in labels (use `\n` sparingly)
2. **Use simple layouts** - `--layout=dagre` works best for ASCII
3. **Test iterations** - Generate frequently to see how it renders
4. **Avoid nested containers** - They often cause wrapping issues in ASCII
5. **Direction matters** - Try `direction: right`, `direction: down`, etc.

## Existing Diagrams

- `p2p-architecture.d2` - Multi-peer P2P architecture (specs/p2p.md)

## References

- [d2 Documentation](https://d2lang.com/)
- [d2 ASCII Blog Post](https://d2lang.com/blog/ascii/)
- [d2 Language Tour](https://d2lang.com/tour/intro)
