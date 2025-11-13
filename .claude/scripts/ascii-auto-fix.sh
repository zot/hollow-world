#!/usr/bin/env python3
"""Automatically fix ASCII art alignment issues intelligently."""

import sys
import re

if len(sys.argv) != 4:
    print("Usage: ascii-auto-fix.sh FILE START END")
    print("  FILE  - Path to file to fix")
    print("  START - Starting line number (1-indexed)")
    print("  END   - Ending line number (1-indexed)")
    sys.exit(1)

file_path = sys.argv[1]
start = int(sys.argv[2])
end = int(sys.argv[3])

with open(file_path, 'r') as f:
    lines = f.readlines()

print(f"Auto-fixing ASCII art in {file_path} (lines {start}-{end})")
print("="*60)

# Extract the section to fix
section_lines = []
for i in range(start-1, end):
    if i < len(lines):
        section_lines.append(lines[i].rstrip('\n'))

# 1. Determine target width from border lines (lines with only ─ and corners)
target_width = None
for line in section_lines:
    # Border lines have only box-drawing chars and dashes
    if re.match(r'^[┌┐└┘├┤┬┴┼─]+$', line):
        target_width = len(line)
        break

if target_width is None:
    print("ERROR: Could not determine target width from border lines")
    sys.exit(1)

print(f"Target width detected: {target_width} chars")

# 2. Fix each line (Pass 1: Basic fixes)
fixed_lines = []
fixes_made = 0

for i, line in enumerate(section_lines):
    original_line = line
    fixed_line = line

    # Remove leading spaces before left border
    if line.startswith(' │'):
        fixed_line = line.lstrip(' ')
        print(f"  Line {start+i}: Removed leading space before │")
        fixes_made += 1

    # Fix arrow lengths (normalize to 2 dashes)
    if '←─┐' in fixed_line or '←─┘' in fixed_line or '←─┼' in fixed_line:
        fixed_line = fixed_line.replace('←─┐', '←──┐')
        fixed_line = fixed_line.replace('←─┘', '←──┘')
        fixed_line = fixed_line.replace('←─┼', '←──┼')
        print(f"  Line {start+i}: Fixed arrow length (←─ → ←──)")
        fixes_made += 1

    # Adjust line width
    current_width = len(fixed_line)
    if current_width != target_width:
        # Check if line has borders at both ends
        if fixed_line.startswith('│') and fixed_line.endswith('│'):
            # Content line with left and right borders
            # Calculate how many spaces we need to add/remove
            diff = target_width - current_width

            if diff > 0:
                # Need to add spaces - add before the closing │
                fixed_line = fixed_line[:-1] + (' ' * diff) + '│'
                print(f"  Line {start+i}: Added {diff} space(s) before closing │")
                fixes_made += 1
            elif diff < 0:
                # Need to remove spaces - remove from before the closing │
                # Find the position of closing │
                content = fixed_line[:-1]  # Everything except closing │
                # Remove trailing spaces
                spaces_to_remove = abs(diff)
                if content.endswith(' ' * spaces_to_remove):
                    content = content[:-spaces_to_remove]
                    fixed_line = content + '│'
                    print(f"  Line {start+i}: Removed {spaces_to_remove} space(s) before closing │")
                    fixes_made += 1
        elif fixed_line.startswith('├') or fixed_line.startswith('└') or fixed_line.startswith('┌'):
            # Border line - should already be correct width, but check
            if current_width != target_width:
                print(f"  Line {start+i}: WARNING: Border line has wrong width ({current_width} vs {target_width})")

    fixed_lines.append(fixed_line)

# 2.5. Fix nested box corner alignment (Pass 2)
# Find vertical border columns for nested boxes
vertical_cols = {}
for i, line in enumerate(fixed_lines):
    for pos, char in enumerate(line):
        if char == '│':
            if pos not in vertical_cols:
                vertical_cols[pos] = []
            vertical_cols[pos].append(i)

# For each line with a corner, check if it should align with a vertical column
for i, line in enumerate(fixed_lines):
    for col, char in enumerate(line):
        if char in ['┌', '└', '┐', '┘']:
            # Check if there's a vertical column adjacent to this corner
            # For left corners (┌, └), check if there's a │ column at same position
            # For right corners (┐, ┘), check if there's a │ column at same position
            if char in ['┌', '└']:
                # Left corner - should align with left │ borders
                # Find nearest vertical column within 1-2 chars
                for vcol in sorted(vertical_cols.keys()):
                    if vcol > col and vcol - col <= 2:
                        # Found a vertical border to the right - this corner might need adjustment
                        # Check if this vertical column has other │ characters
                        if len(vertical_cols[vcol]) >= 2:  # At least 2 borders in this column
                            # Move the corner to align by adding spaces before it
                            # BUT maintain the total line width by removing spaces from end
                            diff = vcol - col
                            fixed_line = fixed_lines[i]
                            # Add spaces before the corner to move it right
                            fixed_line = fixed_line[:col] + (' ' * diff) + fixed_line[col:]
                            # Now remove diff spaces from before the closing │ to maintain width
                            if fixed_line.endswith('│'):
                                content = fixed_line[:-1]
                                if content.endswith(' ' * diff):
                                    fixed_line = content[:-diff] + '│'
                            fixed_lines[i] = fixed_line
                            print(f"  Line {start+i}: Moved {char} from column {col} to {vcol} to align with vertical borders")
                            fixes_made += 1
                            break

# 3. Write the fixed content back
for i in range(start-1, end):
    if i < len(lines):
        section_index = i - (start - 1)
        if section_index < len(fixed_lines):
            lines[i] = fixed_lines[section_index] + '\n'

with open(file_path, 'w') as f:
    f.writelines(lines)

print("="*60)
print(f"✓ Auto-fix complete: {fixes_made} fixes applied")
print(f"✓ File updated: {file_path}")

# 4. Run validation
print("\nRunning validation...")
import subprocess
result = subprocess.run(
    [sys.argv[0].replace('ascii-auto-fix.sh', 'ascii-validate.sh'), file_path, str(start), str(end)],
    capture_output=True,
    text=True
)
print(result.stdout)
sys.exit(result.returncode)
