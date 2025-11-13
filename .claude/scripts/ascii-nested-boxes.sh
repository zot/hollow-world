#!/usr/bin/env python3
"""Validate nested box alignment in ASCII art."""

import sys

if len(sys.argv) != 4:
    print("Usage: ascii-nested-boxes.py FILE START END")
    print("  FILE  - Path to file")
    print("  START - Starting line number (1-indexed)")
    print("  END   - Ending line number (1-indexed)")
    sys.exit(1)

file_path = sys.argv[1]
start = int(sys.argv[2])
end = int(sys.argv[3])

with open(file_path, 'r') as f:
    lines = f.readlines()

print(f"Nested box alignment check (lines {start}-{end}):")

# Find all vertical borders grouped by column
vertical_borders = {}
for i in range(start-1, end):
    if i < len(lines):
        line = lines[i].rstrip('\n')
        for j, char in enumerate(line):
            if char == '│':
                if j not in vertical_borders:
                    vertical_borders[j] = []
                vertical_borders[j].append(i+1)

print("\nVertical border structures:")
for col, line_nums in sorted(vertical_borders.items()):
    print(f"  Column {col}: lines {line_nums}")

# Find nested boxes (look for ┌ and check if └ aligns)
print("\nNested box validation:")
for i in range(start-1, end):
    if i < len(lines):
        line = lines[i].rstrip('\n')
        for j, char in enumerate(line):
            if char == '┌':
                print(f"\n  Found nested box top-left '┌' at line {i+1}, column {j}")
                # Look for matching └ below
                for k in range(i+1, min(end, len(lines))):
                    next_line = lines[k].rstrip('\n')
                    if len(next_line) > j and next_line[j] == '└':
                        print(f"    ✓ Found matching '└' at line {k+1}, column {j}")
                        break
                    elif len(next_line) > j and next_line[j] != '│' and next_line[j] != '┌':
                        # Check if └ is nearby (off by one)
                        for offset in [-1, 1]:
                            if len(next_line) > j+offset and next_line[j+offset] == '└':
                                print(f"    ✗ MISALIGNED: Found '└' at line {k+1}, column {j+offset} (should be {j})")
                                break
