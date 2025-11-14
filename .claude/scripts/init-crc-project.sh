#!/bin/bash
# init-crc-project.sh - Initialize CRC modeling in a project
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🎯 Initializing CRC Modeling System..."
echo ""

# Create directories
echo "📁 Setting up directory structure..."

if [ ! -d "$PROJECT_ROOT/specs" ]; then
    mkdir -p "$PROJECT_ROOT/specs"
    echo -e "${GREEN}✓${NC} Created specs/ directory"
else
    echo -e "${BLUE}→${NC} specs/ directory already exists"
fi

if [ ! -d "$PROJECT_ROOT/design" ]; then
    mkdir -p "$PROJECT_ROOT/design"
    echo -e "${GREEN}✓${NC} Created design/ directory"
else
    echo -e "${BLUE}→${NC} design/ directory already exists"
fi

echo ""

# Check for required files
echo "🔍 Checking for required components..."

missing_components=()

if [ ! -f "$PROJECT_ROOT/.claude/agents/designer.md" ]; then
    echo -e "${YELLOW}⚠${NC} Missing designer agent (.claude/agents/designer.md)"
    missing_components+=("designer agent")
else
    echo -e "${GREEN}✓${NC} Found designer agent"
fi

if [ ! -f "$PROJECT_ROOT/.claude/scripts/plantuml.sh" ]; then
    echo -e "${YELLOW}⚠${NC} Missing plantuml.sh (.claude/scripts/plantuml.sh)"
    missing_components+=("plantuml.sh")
else
    echo -e "${GREEN}✓${NC} Found plantuml.sh script"
fi

if [ ! -f "$PROJECT_ROOT/.claude/skills/plantuml.md" ]; then
    echo -e "${YELLOW}⚠${NC} Missing plantuml skill (.claude/skills/plantuml.md)"
    missing_components+=("plantuml skill")
else
    echo -e "${GREEN}✓${NC} Found plantuml skill"
fi

if [ ! -f "$PROJECT_ROOT/.claude/bin/plantuml.jar" ]; then
    echo -e "${YELLOW}⚠${NC} Missing plantuml.jar (.claude/bin/plantuml.jar)"
    echo -e "   ${BLUE}→${NC} Download from: https://plantuml.com/download"
    missing_components+=("plantuml.jar")
else
    echo -e "${GREEN}✓${NC} Found plantuml.jar"
fi

echo ""

# Check CLAUDE.md and add CRC sections if needed
echo "📝 Checking CLAUDE.md..."

if [ ! -f "$PROJECT_ROOT/CLAUDE.md" ]; then
    echo -e "${YELLOW}⚠${NC} CLAUDE.md not found in project root"
    echo -e "   ${BLUE}→${NC} Creating CLAUDE.md with CRC sections..."

    cat > "$PROJECT_ROOT/CLAUDE.md" << 'EOF'
# Project Instructions

## CRC Modeling Workflow

**DO NOT generate code directly from `specs/*.md` files!**

**Use a three-tier system:**
```
Level 1: Human specs (specs/*.md)
   ↓
Level 2: Design models (design/*.md) ← CREATE THESE FIRST
   ↓
Level 3: Implementation (source code)
```

**Workflow:**
1. Read human specs (`specs/*.md`) for design intent
2. Use `designer` agent to create Level 2 specs (CRC cards, sequences, UI specs)
3. Generate code following complete specification with traceability comments

See `.claude/doc/crc.md` for complete documentation.
EOF
    echo -e "${GREEN}✓${NC} Created CLAUDE.md with CRC sections"
else
    # Check if CLAUDE.md already has CRC content
    if grep -q "three-tier system" "$PROJECT_ROOT/CLAUDE.md" 2>/dev/null; then
        echo -e "${BLUE}→${NC} CLAUDE.md already has CRC sections"
    else
        echo -e "${YELLOW}⚠${NC} CLAUDE.md exists but missing CRC sections"
        echo -e "   ${BLUE}→${NC} Appending CRC workflow sections..."

        # Append CRC sections to existing CLAUDE.md
        cat >> "$PROJECT_ROOT/CLAUDE.md" << 'EOF'

---

## CRC Modeling Workflow

**DO NOT generate code directly from `specs/*.md` files!**

**Use a three-tier system:**
```
Level 1: Human specs (specs/*.md)
   ↓
Level 2: Design models (design/*.md) ← CREATE THESE FIRST
   ↓
Level 3: Implementation (source code)
```

**Workflow:**
1. Read human specs (`specs/*.md`) for design intent
2. Use `designer` agent to create Level 2 specs (CRC cards, sequences, UI specs)
3. Generate code following complete specification with traceability comments

See `.claude/doc/crc.md` for complete documentation.

### 🔄 Bidirectional Traceability Principle

**When changes occur at any level, propagate updates through the documentation hierarchy:**

**Source Code Changes → Design Specs:**
- Modified implementation → Update CRC cards/sequences/UI specs if structure/behavior changed
- New classes/methods → Create corresponding CRC cards
- Changed interactions → Update sequence diagrams
- Template/view changes → Update UI specs

**Design Spec Changes → Architectural Specs:**
- Modified CRC cards/sequences → Update high-level specs if requirements/architecture affected
- New components → Document in feature specs
- Changed workflows → Update architectural documentation

**Key Rules:**
1. **Always update up**: When code/design changes, ripple changes upward through documentation
2. **Maintain abstraction**: Each level documents at its appropriate abstraction
3. **Keep consistency**: All three tiers must tell the same story at their respective levels
4. **Update traceability comments**: When docs change, update CRC/spec references in code comments
EOF
        echo -e "${GREEN}✓${NC} Added CRC sections to CLAUDE.md"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ${#missing_components[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 CRC Modeling initialized successfully!${NC}"
else
    echo -e "${YELLOW}⚠ CRC Modeling partially initialized${NC}"
    echo ""
    echo "Missing components:"
    for component in "${missing_components[@]}"; do
        echo "  - $component"
    done
    echo ""
    echo "See .claude/doc/crc.md for setup instructions"
fi

echo ""
echo -e "${BLUE}📚 Documentation:${NC} .claude/doc/crc.md"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo "   1. Write Level 1 specs in specs/*.md"
echo "   2. Generate Level 2 designs: Task(subagent_type=\"designer\", ...)"
echo "   3. Implement Level 3 code with traceability comments"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
