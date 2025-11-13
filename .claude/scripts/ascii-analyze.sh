#!/usr/bin/env python3
"""Complete ASCII art alignment analysis (all checks combined)."""

import sys

if len(sys.argv) != 4:
    print("Usage: ascii-analyze.py FILE START END")
    print("  FILE  - Path to file")
    print("  START - Starting line number (1-indexed)")
    print("  END   - Ending line number (1-indexed)")
    sys.exit(1)

file_path = sys.argv[1]
start = int(sys.argv[2])
end = int(sys.argv[3])

with open(file_path, 'r') as f:
    lines = f.readlines()

print("="*60)
print(f"COMPLETE ASCII ART ANALYSIS: {file_path}")
print(f"Lines {start}-{end}")
print("="*60)

# 1. Line widths
print("\n1. LINE WIDTHS:")
widths = {}
for i in range(start-1, end):
    if i < len(lines):
        line = lines[i].rstrip('\n')
        width = len(line)
        if width not in widths:
            widths[width] = []
        widths[width].append(i+1)
        print(f"  Line {i+1}: {width} chars")

if len(widths) > 1:
    print("\n  ⚠ WARNING: Inconsistent widths detected!")
    for w, line_nums in sorted(widths.items()):
        print(f"    {w} chars: lines {line_nums}")
else:
    print(f"\n  ✓ All lines have consistent width: {list(widths.keys())[0]} chars")

# 2. Character positions
print("\n2. BOX-DRAWING CHARACTER POSITIONS:")
box_chars = '┌┐└┘├┤┬┴┼│─'
for i in range(start-1, end):
    if i < len(lines):
        line = lines[i].rstrip('\n')
        found = []
        for j, char in enumerate(line):
            if char in box_chars:
                found.append(f"{char}@{j}")
        if found:
            print(f"  Line {i+1}: {', '.join(found)}")

# 3. Vertical alignment
print("\n3. VERTICAL BORDER ALIGNMENT:")
vertical_borders = {}
for i in range(start-1, end):
    if i < len(lines):
        line = lines[i].rstrip('\n')
        for j, char in enumerate(line):
            if char == '│':
                if j not in vertical_borders:
                    vertical_borders[j] = []
                vertical_borders[j].append(i+1)

for col, line_nums in sorted(vertical_borders.items()):
    print(f"  Column {col}: lines {line_nums}")

# 4. Nested box corners
print("\n4. NESTED BOX CORNER ALIGNMENT:")
issues_found = False
for i in range(start-1, end):
    if i < len(lines):
        line = lines[i].rstrip('\n')
        for j, char in enumerate(line):
            if char in '┌└':
                # Check if there's a vertical border at this column
                if j in vertical_borders:
                    print(f"  ✓ Line {i+1}: '{char}' at column {j} (vertical structure exists)")
                else:
                    # Check nearby columns
                    found_nearby = False
                    for offset in [-1, 1]:
                        if j+offset in vertical_borders:
                            print(f"  ✗ Line {i+1}: '{char}' at column {j}, but vertical borders at column {j+offset}")
                            issues_found = True
                            found_nearby = True
                    if not found_nearby and char == '┌':
                        print(f"  ℹ Line {i+1}: '{char}' at column {j} (nested box start)")

print("\n" + "="*60)
if issues_found:
    print("❌ ALIGNMENT ISSUES DETECTED")
else:
    print("✅ NO OBVIOUS ALIGNMENT ISSUES")
print("="*60)
