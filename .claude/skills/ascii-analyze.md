---
name: ascii-analyze
description: Analyze ASCII art box-drawing alignment (line widths, character positions, nested boxes)
tools: Bash, Read
---

# ASCII Art Alignment Analysis Skill

Provides pre-approved Python analysis scripts for checking ASCII art alignment.

## Usage

When you need to analyze ASCII art in a file, use these commands:

### Quick Commands (sed/awk)

**Check line widths with awk:**
```bash
sed -n '44,57p' FILE | awk '{print NR+43 ": " length($0) " chars"}'
```

**Find lines not matching target width:**
```bash
TARGET=65
sed -n '44,57p' FILE | awk -v target=$TARGET '{if(length($0) != target) print NR+43 ": " length($0) " (should be " target ")"}'
```

**Extract specific line range:**
```bash
sed -n '44,57p' FILE
```

**Show line with visible characters (including tabs/spaces):**
```bash
sed -n '44,57p' FILE | cat -A
```

### 1. Check Line Widths in Range

**PRE-APPROVED SCRIPT** (no permission needed):
```bash
./.claude/scripts/ascii-line-widths.sh FILE START END
```

**Example**:
```bash
./.claude/scripts/ascii-line-widths.sh specs/p2p.md 44 57
```

### 2. Find All Box-Drawing Characters with Positions

**PRE-APPROVED SCRIPT** (no permission needed):
```bash
./.claude/scripts/ascii-char-positions.sh FILE START END
```

**Example**:
```bash
./.claude/scripts/ascii-char-positions.sh specs/p2p.md 44 57
```

### 3. Validate Nested Box Alignment

**PRE-APPROVED SCRIPT** (no permission needed):
```bash
./.claude/scripts/ascii-nested-boxes.sh FILE START END
```

**Example**:
```bash
./.claude/scripts/ascii-nested-boxes.sh specs/p2p.md 44 57
```

### 4. Complete Analysis (All Checks)

**PRE-APPROVED SCRIPT** (no permission needed):
```bash
./.claude/scripts/ascii-analyze.sh FILE START END
```

**Example**:
```bash
./.claude/scripts/ascii-analyze.sh specs/p2p.md 44 57
```

### 5. Show Lines with Character Counts

**PRE-APPROVED SCRIPT** (no permission needed):
```bash
./.claude/scripts/ascii-show-lines.sh FILE START END
```

**Example**:
```bash
./.claude/scripts/ascii-show-lines.sh specs/p2p.md 44 57
```

### 6. Validate ASCII Art (REQUIRED before presenting fixes)

**PRE-APPROVED SCRIPT** (no permission needed):
```bash
./.claude/scripts/ascii-validate.sh FILE START END
```

**Example**:
```bash
./.claude/scripts/ascii-validate.sh specs/p2p.md 44 57
```

## Parameters

All scripts take 3 arguments:
1. `file_path` - Path to the file to analyze
2. `start` - Starting line number (1-indexed)
3. `end` - Ending line number (1-indexed)

## Important Notes

**CRITICAL**: All scripts are executable with shebang (`#!/usr/bin/env python3`).
**Always call them directly**, never use `python3`:

✅ **CORRECT**: `./.claude/scripts/ascii-analyze.sh FILE START END`
❌ **WRONG**: `python3 ./.claude/scripts/ascii-analyze.sh FILE START END`

The direct invocation is pre-approved in permissions. Using `python3` requires additional approval.

## Integration with Artist Agent

The artist agent can invoke this skill to get pre-approved analysis commands that won't require permission prompts.
