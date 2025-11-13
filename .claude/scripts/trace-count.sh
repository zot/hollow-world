#!/bin/bash
# Count traceability checkbox items by phase or CRC card
#
# Usage: ./trace-count.sh [phase-number|crc-card-name]
# Examples:
#   ./trace-count.sh 1              # Count Phase 1 items
#   ./trace-count.sh 2              # Count Phase 2 items
#   ./trace-count.sh ProfileService # Count items for specific CRC card
#
# IMPORTANT: Run script directly, do NOT use `bash ./trace-count.sh`
# The script is executable and has a proper shebang.

set -e

TRACEABILITY_FILE="design/traceability.md"

if [ ! -f "$TRACEABILITY_FILE" ]; then
    echo "❌ Error: $TRACEABILITY_FILE not found"
    exit 1
fi

# Get CRC cards for a phase
get_phase_crc_cards() {
    local phase=$1

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

    awk -v patterns="$spec_patterns" '
        BEGIN { split(patterns, p, "|") }
        /^### specs\// {
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
            gsub(/^crc-/, "")
            gsub(/\.md$/, "")
            print
        }
    ' "$TRACEABILITY_FILE" | sort -u
}

# Count checkboxes for a CRC card
count_crc_checkboxes() {
    local crc_card=$1

    awk -v card="### crc-${crc_card}.md" '
        $0 ~ card { found=1; next }
        found && /^###/ { exit }
        found && /^---/ { exit }
        found && /^\*\*Implementation:\*\*/ { in_impl=1; next }
        found && /^\*\*Tests:\*\*/ { in_impl=0; in_tests=1; next }
        found && /^\*\*Appears in Sequences:\*\*/ { exit }
        found && (in_impl || in_tests) && /^  - \[x\]/ { checked++ }
        found && (in_impl || in_tests) && /^  - \[ \]/ { unchecked++ }
        END {
            total = checked + unchecked
            printf "%d %d %d\n", total, checked, unchecked
        }
    ' "$TRACEABILITY_FILE"
}

# Main logic
if [ $# -eq 0 ]; then
    # Default: Show all phases
    echo "=== Traceability Checkbox Counts ==="
    echo ""

    for phase in 1 2; do
        echo "Phase $phase:"
        CRC_CARDS=$(get_phase_crc_cards $phase)

        if [ -z "$CRC_CARDS" ]; then
            echo "  No CRC cards found"
            continue
        fi

        PHASE_TOTAL=0
        PHASE_CHECKED=0
        PHASE_UNCHECKED=0

        while read crc_card; do
            read total checked unchecked < <(count_crc_checkboxes "$crc_card")
            PHASE_TOTAL=$((PHASE_TOTAL + total))
            PHASE_CHECKED=$((PHASE_CHECKED + checked))
            PHASE_UNCHECKED=$((PHASE_UNCHECKED + unchecked))
        done < <(echo "$CRC_CARDS")

        if [ $PHASE_TOTAL -gt 0 ]; then
            PERCENT=$((PHASE_CHECKED * 100 / PHASE_TOTAL))
            echo "  Total: $PHASE_TOTAL items"
            echo "  ✅ Checked: $PHASE_CHECKED ($PERCENT%)"
            echo "  ⬜ Unchecked: $PHASE_UNCHECKED"
        fi
        echo ""
    done

elif [[ "$1" =~ ^[0-9]+$ ]]; then
    # Phase number provided
    PHASE=$1
    echo "=== Phase $PHASE Traceability Checkbox Counts ==="
    echo ""

    CRC_CARDS=$(get_phase_crc_cards $PHASE)

    if [ -z "$CRC_CARDS" ]; then
        echo "❌ No CRC cards found for Phase $PHASE"
        exit 1
    fi

    PHASE_TOTAL=0
    PHASE_CHECKED=0
    PHASE_UNCHECKED=0

    echo "CRC Card Breakdown:"
    while read crc_card; do
        read total checked unchecked < <(count_crc_checkboxes "$crc_card")

        if [ $total -gt 0 ]; then
            percent=$((checked * 100 / total))
            printf "  %-30s %3d items (%3d checked, %3d%% complete)\n" \
                "${crc_card}.md" "$total" "$checked" "$percent"
        fi

        PHASE_TOTAL=$((PHASE_TOTAL + total))
        PHASE_CHECKED=$((PHASE_CHECKED + checked))
        PHASE_UNCHECKED=$((PHASE_UNCHECKED + unchecked))
    done < <(echo "$CRC_CARDS")

    echo ""
    echo "Phase Summary:"
    if [ $PHASE_TOTAL -gt 0 ]; then
        PERCENT=$((PHASE_CHECKED * 100 / PHASE_TOTAL))
        echo "  Total: $PHASE_TOTAL items"
        echo "  ✅ Checked: $PHASE_CHECKED ($PERCENT%)"
        echo "  ⬜ Unchecked: $PHASE_UNCHECKED"
    fi

else
    # CRC card name provided
    CRC_CARD=$1
    # Remove crc- prefix and .md suffix if present
    CRC_CARD=${CRC_CARD#crc-}
    CRC_CARD=${CRC_CARD%.md}

    echo "=== ${CRC_CARD} Checkbox Count ==="
    echo ""

    read total checked unchecked < <(count_crc_checkboxes "$CRC_CARD")

    if [ $total -eq 0 ]; then
        echo "❌ No checkboxes found for crc-${CRC_CARD}.md"
        echo "   (CRC card may not exist or have no Implementation/Tests sections)"
        exit 1
    fi

    percent=$((checked * 100 / total))

    echo "Total items: $total"
    echo "✅ Checked: $checked ($percent%)"
    echo "⬜ Unchecked: $unchecked"

    if [ $unchecked -gt 0 ]; then
        echo ""
        echo "Unchecked items:"
        awk -v card="### crc-${CRC_CARD}.md" '
            $0 ~ card { found=1; next }
            found && /^###/ { exit }
            found && /^---/ { exit }
            found && /^\*\*Implementation:\*\*/ { in_impl=1; section="Implementation"; next }
            found && /^\*\*Tests:\*\*/ { in_impl=0; in_tests=1; section="Tests"; next }
            found && /^\*\*Appears in Sequences:\*\*/ { exit }
            found && (in_impl || in_tests) && /^- \*\*.*\*\*$/ {
                match($0, /\*\*([^*]+)\*\*/, arr)
                file = arr[1]
                next
            }
            found && (in_impl || in_tests) && /^  - \[ \]/ {
                match($0, /- \[ \] (.*)/, arr)
                printf "  [%s] %s: %s\n", section, file, arr[1]
            }
        ' "$TRACEABILITY_FILE"
    fi
fi
