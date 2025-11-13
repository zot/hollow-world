#!/bin/bash
# Verify and sync traceability comments with traceability.md
# Treats traceability.md as source of truth for what should be commented
# Syncs checkbox states: checked if comment exists, unchecked if missing
#
# Usage: ./trace-verify.sh [phase-number]
# Example: ./trace-verify.sh 2
#
# IMPORTANT: Run script directly, do NOT use `bash ./trace-verify.sh`
# The script is executable and has a proper shebang.

set -e

PHASE=${1:-1}
TRACEABILITY_FILE="design/traceability.md"
EXIT_CODE=0

echo "=== Phase ${PHASE} Traceability Sync & Verification ==="
echo ""

if [ ! -f "$TRACEABILITY_FILE" ]; then
    echo "❌ Error: $TRACEABILITY_FILE not found"
    exit 1
fi

# Extract CRC cards for this phase from traceability.md
# Look in "Level 1 ↔ Level 2" section
get_phase_crc_cards() {
    local phase=$1

    # For now, we need to know which section corresponds to which phase
    # Phase 1: specs/characters.md, specs/storage.md, specs/logging.md
    # Phase 2: specs/ui.characters.md, specs/ui.md, specs/routes.md

    local spec_patterns=""
    case $phase in
        1)
            spec_patterns="specs/characters.md|specs/storage.md|specs/logging.md"
            ;;
        2)
            spec_patterns="specs/ui.characters.md|specs/ui.md|specs/routes.md"
            ;;
        *)
            echo ""
            return
            ;;
    esac

    # Extract CRC cards from matching spec sections, respecting section boundaries
    awk -v patterns="$spec_patterns" '
        BEGIN { split(patterns, p, "|") }
        /^### specs\// {
            # Check if this section matches our phase
            in_section = 0
            for (i in p) {
                if (index($0, p[i]) > 0) {
                    in_section = 1
                    break
                }
            }
            next
        }
        in_section && /^###/ { in_section = 0 }
        in_section && /^---/ { in_section = 0 }
        in_section && /^\*\*CRC Cards:\*\*/ { in_crc_list = 1; next }
        in_section && in_crc_list && /^\*\*/ { in_crc_list = 0 }
        in_section && in_crc_list && /^- crc-/ {
            gsub(/^- /, "")
            gsub(/\.md$/, "")
            print
        }
    ' "$TRACEABILITY_FILE" | sort -u
}

# Extract implementation files and checkboxes for a given CRC card
# Returns lines like: "src/ui/CharacterEditorView.ts:[ ]:File header (CRC + Spec + Sequences)"
parse_crc_implementation() {
    local crc_card=$1

    # Find the section for this CRC card
    # Extract everything between "### ${crc_card}.md" and next "###" or "---"
    awk -v card="### ${crc_card}.md" '
        $0 ~ card { found=1; next }
        found && /^###/ { exit }
        found && /^---/ { exit }
        found && /^\*\*Implementation:\*\*/ { in_impl=1; next }
        found && /^\*\*Tests:\*\*/ { in_impl=0; in_tests=1; next }
        found && /^\*\*Appears in Sequences:\*\*/ { exit }
        found && /^\*\*Interface:\*\*/ { next }
        found && /^\*\*Implementations:\*\*/ { next }
        found && (in_impl || in_tests) && /^- \*\*src\/.*\*\*$/ {
            # Extract file path from **src/path/file.ts** (only lines starting with **src/)
            match($0, /\*\*([^*]+)\*\*/, arr)
            file = arr[1]
            next
        }
        found && (in_impl || in_tests) && /^  - \[.\]/ {
            # Extract checkbox state and description
            match($0, /\[(.)\](.*)/, arr)
            checked = arr[1]
            desc = arr[2]
            gsub(/^[[:space:]]+/, "", desc)  # trim leading space
            if (file != "") {
                print file ":" checked ":" desc
            }
        }
    ' "$TRACEABILITY_FILE"
}

# Check if a file header has CRC: comment
has_crc_header() {
    local file=$1
    [ -f "$file" ] && head -20 "$file" | grep -q "^ \* CRC: design/"
}

# Check if a specific method/class has CRC comment
has_crc_comment() {
    local file=$1
    local search_term=$2

    [ -f "$file" ] && grep -B 10 "$search_term" "$file" 2>/dev/null | grep -q "CRC: design/"
}

# Update checkbox in traceability.md
# Args: file, old_checkbox_state, description, new_checkbox_state
update_checkbox() {
    local file=$1
    local old_state=$2
    local desc=$3
    local new_state=$4

    # Escape special regex characters in description
    local escaped_desc=$(echo "$desc" | sed 's/[]\/$*.^[]/\\&/g')

    # Find and replace the checkbox line
    # Pattern: "  - [old_state] desc"
    # Replace with: "  - [new_state] desc"
    sed -i "s/^  - \[$old_state\] $escaped_desc$/  - [$new_state] $desc/" "$TRACEABILITY_FILE"
}

# Get all CRC cards for this phase
CRC_CARDS=$(get_phase_crc_cards $PHASE)

if [ -z "$CRC_CARDS" ]; then
    echo "❌ No CRC cards found for Phase $PHASE"
    echo "   (or phase not configured)"
    exit 1
fi

echo "Found CRC cards for Phase $PHASE:"
while read card; do
    echo "  - ${card}.md"
done < <(echo "$CRC_CARDS")
echo ""

# Track statistics
TOTAL_ITEMS=0
CHECKED_ITEMS=0
UNCHECKED_ITEMS=0
NEWLY_CHECKED=0
NEWLY_UNCHECKED=0
MISSING_FILES=0

# Process each CRC card
while read crc_card; do
    echo "Checking ${crc_card}.md..."

    # Get implementation items for this card
    ITEMS=$(parse_crc_implementation "$crc_card")

    if [ -z "$ITEMS" ]; then
        echo "  ⚠️  No implementation items found"
        continue
    fi

    # Process each checkbox item
    while IFS=: read -r file checked_state description; do
        TOTAL_ITEMS=$((TOTAL_ITEMS + 1))

        # Check if file exists
        if [ ! -f "$file" ]; then
            echo "  ⚠️  File not found: $file"
            MISSING_FILES=$((MISSING_FILES + 1))
            continue
        fi

        # Determine what kind of comment to check for
        HAS_COMMENT=false

        if [[ "$description" == "File header"* ]]; then
            # Check for file header CRC comment
            if has_crc_header "$file"; then
                HAS_COMMENT=true
            fi
        else
            # Check for specific method/class comment
            # Extract the key term from description (e.g., "saveCharacter()" or "CharacterEditorView class")
            SEARCH_TERM=$(echo "$description" | sed 's/ comment.*//' | sed 's/ method$//' | sed 's/ class$//' | sed 's/ interface$//' | sed 's/()$//')
            if has_crc_comment "$file" "$SEARCH_TERM"; then
                HAS_COMMENT=true
            fi
        fi

        # Determine if checkbox state needs updating
        SHOULD_BE_CHECKED="x"
        if [ "$HAS_COMMENT" = false ]; then
            SHOULD_BE_CHECKED=" "
        fi

        # Update checkbox if state is wrong
        if [ "$checked_state" != "$SHOULD_BE_CHECKED" ]; then
            if [ "$SHOULD_BE_CHECKED" = "x" ]; then
                echo "  ✅ CHECKING: $file - $description"
                NEWLY_CHECKED=$((NEWLY_CHECKED + 1))
            else
                echo "  ❌ UNCHECKING: $file - $description (comment missing)"
                NEWLY_UNCHECKED=$((NEWLY_UNCHECKED + 1))
            fi
            update_checkbox "$file" "$checked_state" "$description" "$SHOULD_BE_CHECKED"
        else
            # State is correct
            if [ "$checked_state" = "x" ]; then
                CHECKED_ITEMS=$((CHECKED_ITEMS + 1))
            else
                UNCHECKED_ITEMS=$((UNCHECKED_ITEMS + 1))
            fi
        fi
    done < <(echo "$ITEMS")
done < <(echo "$CRC_CARDS")

echo ""
echo "=== Summary ==="
echo "Total items checked: $TOTAL_ITEMS"
echo "Already correct:"
echo "  ✅ Checked (has comment): $CHECKED_ITEMS"
echo "  ⬜ Unchecked (no comment): $UNCHECKED_ITEMS"
echo ""
echo "Changes made:"
echo "  ✅ Newly checked: $NEWLY_CHECKED"
echo "  ❌ Newly unchecked: $NEWLY_UNCHECKED"

if [ $MISSING_FILES -gt 0 ]; then
    echo "  ⚠️  Missing files: $MISSING_FILES"
fi

echo ""

if [ $NEWLY_CHECKED -eq 0 ] && [ $NEWLY_UNCHECKED -eq 0 ] && [ $MISSING_FILES -eq 0 ]; then
    echo "✅ PASS: All checkboxes in sync with code"
    EXIT_CODE=0
elif [ $NEWLY_UNCHECKED -gt 0 ] || [ $MISSING_FILES -gt 0 ]; then
    echo "❌ FAIL: Some items need traceability comments"
    EXIT_CODE=1
else
    echo "✅ PASS: Checkboxes updated to match code"
    EXIT_CODE=0
fi

exit $EXIT_CODE
