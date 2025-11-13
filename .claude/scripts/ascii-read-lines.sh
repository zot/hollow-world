#!/usr/bin/env python3
"""Read specific lines from a file and output them."""

import sys

if len(sys.argv) != 4:
    print("Usage: ascii-read-lines.sh FILE START END")
    print("  FILE  - Path to file")
    print("  START - Starting line number (1-indexed)")
    print("  END   - Ending line number (1-indexed)")
    sys.exit(1)

file_path = sys.argv[1]
start = int(sys.argv[2])
end = int(sys.argv[3])

with open(file_path, 'r') as f:
    lines = f.readlines()

for i in range(start-1, end):
    if i < len(lines):
        # Print without the trailing newline to avoid double newlines
        print(lines[i].rstrip('\n'))
