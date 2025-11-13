#!/usr/bin/env python3
"""Find all box-drawing characters and their positions in a file range."""

import sys

if len(sys.argv) != 4:
    print("Usage: ascii-char-positions.py FILE START END")
    print("  FILE  - Path to file")
    print("  START - Starting line number (1-indexed)")
    print("  END   - Ending line number (1-indexed)")
    sys.exit(1)

file_path = sys.argv[1]
start = int(sys.argv[2])
end = int(sys.argv[3])

with open(file_path, 'r') as f:
    lines = f.readlines()

box_chars = '┌┐└┘├┤┬┴┼│─←→'
print(f"Box-drawing character positions (lines {start}-{end}):")
for i in range(start-1, end):
    if i < len(lines):
        line = lines[i].rstrip('\n')
        positions = {}
        for j, char in enumerate(line):
            if char in box_chars:
                if char not in positions:
                    positions[char] = []
                positions[char].append(j)

        if positions:
            print(f"\nLine {i+1}:")
            for char, pos_list in sorted(positions.items()):
                print(f"  '{char}' at: {pos_list}")
