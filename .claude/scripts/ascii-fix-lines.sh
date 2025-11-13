#!/usr/bin/env python3
"""Apply multiple line fixes to a file in one operation."""

import sys
import json

if len(sys.argv) != 3:
    print("Usage: ascii-fix-lines.sh FILE CHANGES_JSON")
    print("  FILE         - Path to file to fix")
    print("  CHANGES_JSON - JSON array of changes: [{line: N, old: 'text', new: 'text'}, ...]")
    print("")
    print("Example:")
    print('  ascii-fix-lines.sh specs/p2p.md \'[{"line":45,"old":"old text","new":"new text"}]\'')
    sys.exit(1)

file_path = sys.argv[1]
changes_json = sys.argv[2]

try:
    changes = json.loads(changes_json)
except json.JSONDecodeError as e:
    print(f"Error: Invalid JSON: {e}")
    sys.exit(1)

# Read the file
with open(file_path, 'r') as f:
    lines = f.readlines()

# Validate all changes first
for change in changes:
    if 'line' not in change or 'old' not in change or 'new' not in change:
        print(f"Error: Each change must have 'line', 'old', and 'new' fields")
        sys.exit(1)

    line_num = change['line']
    if line_num < 1 or line_num > len(lines):
        print(f"Error: Line {line_num} is out of range (file has {len(lines)} lines)")
        sys.exit(1)

    actual_line = lines[line_num - 1].rstrip('\n')
    expected_old = change['old']

    if actual_line != expected_old:
        print(f"Error: Line {line_num} doesn't match expected content")
        print(f"  Expected: '{expected_old}'")
        print(f"  Actual:   '{actual_line}'")
        sys.exit(1)

# Apply all changes
print(f"Applying {len(changes)} changes to {file_path}:")
for change in changes:
    line_num = change['line']
    old_text = change['old']
    new_text = change['new']

    lines[line_num - 1] = new_text + '\n'
    print(f"  Line {line_num}: Changed")

# Write the file back
with open(file_path, 'w') as f:
    f.writelines(lines)

print(f"\n✓ Successfully applied {len(changes)} changes to {file_path}")
