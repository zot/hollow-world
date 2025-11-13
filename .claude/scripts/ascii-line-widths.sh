#!/usr/bin/env python3
"""Check line widths in a file range for ASCII art alignment."""

import sys

if len(sys.argv) != 4:
    print("Usage: ascii-line-widths.py FILE START END")
    print("  FILE  - Path to file")
    print("  START - Starting line number (1-indexed)")
    print("  END   - Ending line number (1-indexed)")
    sys.exit(1)

file_path = sys.argv[1]
start = int(sys.argv[2])
end = int(sys.argv[3])

with open(file_path, 'r') as f:
    lines = f.readlines()

print(f"Line width analysis (lines {start}-{end}):")
for i in range(start-1, end):
    if i < len(lines):
        line = lines[i].rstrip('\n')
        print(f"Line {i+1}: {len(line)} chars")
