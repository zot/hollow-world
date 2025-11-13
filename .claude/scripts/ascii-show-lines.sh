#!/usr/bin/env python3
"""Show lines with their exact character counts for debugging."""

import sys

if len(sys.argv) != 4:
    print("Usage: ascii-show-lines.sh FILE START END")
    print("  FILE  - Path to file")
    print("  START - Starting line number (1-indexed)")
    print("  END   - Ending line number (1-indexed)")
    sys.exit(1)

file_path = sys.argv[1]
start = int(sys.argv[2])
end = int(sys.argv[3])

with open(file_path, 'r') as f:
    lines = f.readlines()

print(f"Lines {start}-{end} from {file_path}:")
print("="*70)

for i in range(start-1, end):
    if i < len(lines):
        line = lines[i].rstrip('\n')
        # Show line number, character count, and the actual line
        print(f"Line {i+1:3d} ({len(line):2d} chars): {line}")

        # Highlight first and last characters if they're box-drawing
        if line and line[0] in '┌┐└┘├┤┬┴┼│':
            print(f"             First char at col 0: '{line[0]}'")
        if line and line[-1] in '┌┐└┘├┤┬┴┼│':
            print(f"             Last char at col {len(line)-1}: '{line[-1]}'")

print("="*70)
