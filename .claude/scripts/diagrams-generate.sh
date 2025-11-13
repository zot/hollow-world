#!/bin/bash
# Generate ASCII art diagrams from all d2 sources

set -e

if ! command -v d2 &> /dev/null; then
    echo "Error: d2 is not installed"
    echo "Install with: curl -fsSL https://d2lang.com/install.sh | sh -s --"
    exit 1
fi

SOURCES_DIR=".claude/diagrams/sources"
OUTPUT_DIR=".claude/diagrams/output"

mkdir -p "$OUTPUT_DIR"

echo "Generating ASCII diagrams from d2 sources..."
echo ""

count=0
for d2_file in "$SOURCES_DIR"/*.d2; do
    if [ ! -f "$d2_file" ]; then
        echo "No .d2 files found in $SOURCES_DIR"
        exit 0
    fi

    basename=$(basename "$d2_file" .d2)
    output_file="$OUTPUT_DIR/${basename}.txt"

    echo "→ $basename"

    # Generate ASCII art with dagre layout
    d2 --layout=dagre "$d2_file" - --stdout-format=ascii 2>/dev/null > "$output_file"

    echo "  ✓ Generated: $output_file"
    count=$((count + 1))
done

echo ""
echo "✓ Generated $count diagram(s)"
echo ""
echo "Next steps:"
echo "  1. Review ASCII output in $OUTPUT_DIR/*.txt"
echo "  2. Copy diagram into appropriate specs/*.md file"
echo "  3. Wrap with markers: <!-- BEGIN DIAGRAM: name --> ... <!-- END DIAGRAM: name -->"
