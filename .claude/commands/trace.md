Traceability management for CRC cards: {{args}}

## Add Traceability Comments

Following the three-pass process from design/crc.md:

**Workflow:**
1. Run: `./.claude/scripts/trace-add-comments.py {{args}}`
2. Script computes new file with comments → `.claude/scratch/<file>.trace-new.ts`
3. Read both original and new file
4. Use Edit tool to show diff for user approval
5. If approved, update traceability.md checkboxes
6. Cleanup: `./.claude/scripts/trace-add-comments.py --cleanup {{args}}`

**Key points:**
- Script never modifies original file directly
- Keeps file extension for syntax highlighting
- Only adds comments to methods without existing `CRC:` references
- Inserts in reverse line order to preserve offsets
- Use `--cleanup` flag to safely remove scratch file after applying changes

## Count Traceability Checkboxes

**Usage:**
- `./.claude/scripts/trace-count.sh` - Count all phases
- `./.claude/scripts/trace-count.sh 1` - Count Phase 1 with per-CRC breakdown
- `./.claude/scripts/trace-count.sh 2` - Count Phase 2 with per-CRC breakdown
- `./.claude/scripts/trace-count.sh ProfileService` - Count specific CRC card with unchecked items

**Note:** Run scripts directly (e.g., `./script.sh`), do NOT use `bash ./script.sh`

**Example output:**
```
=== Phase 2 Traceability Checkbox Counts ===

CRC Card Breakdown:
  crc-CharacterEditorView.md      11 items ( 11 checked, 100% complete)
  crc-CharacterManagerView.md     11 items ( 10 checked,  90% complete)
  ...

Phase Summary:
  Total: 58 items
  ✅ Checked: 56 (96%)
  ⬜ Unchecked: 2
```

## Verify Traceability

**Usage:**
- `./.claude/scripts/trace-verify.sh [phase]` - Sync checkboxes with code reality

**Purpose:**
- Treats traceability.md as source of truth for what should be commented
- Verifies that all expected comments exist in code
- Updates checkboxes: checked if comment exists, unchecked if missing
- Reports missing comments and files
