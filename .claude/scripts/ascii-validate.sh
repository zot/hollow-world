#!/usr/bin/env python3
"""Validate ASCII art for common issues before presenting fixes."""

import sys

if len(sys.argv) != 4:
    print("Usage: ascii-validate.sh FILE START END")
    print("  FILE  - Path to file to validate")
    print("  START - Starting line number (1-indexed)")
    print("  END   - Ending line number (1-indexed)")
    sys.exit(1)

file_path = sys.argv[1]
start = int(sys.argv[2])
end = int(sys.argv[3])

with open(file_path, 'r') as f:
    lines = f.readlines()

print("="*60)
print(f"ASCII ART VALIDATION: {file_path}")
print(f"Lines {start}-{end}")
print("="*60)

issues = []

# 1. Check line widths
print("\n1. LINE WIDTH CHECK:")
widths = {}
for i in range(start-1, end):
    if i < len(lines):
        line = lines[i].rstrip('\n')
        width = len(line)
        if width not in widths:
            widths[width] = []
        widths[width].append(i+1)

if len(widths) > 1:
    print("  ❌ FAIL: Inconsistent widths detected!")
    for w, line_nums in sorted(widths.items()):
        print(f"     {w} chars: lines {line_nums}")
    issues.append("Inconsistent line widths")
else:
    target_width = list(widths.keys())[0]
    print(f"  ✓ PASS: All lines have consistent width: {target_width} chars")

# 2. Check for leading spaces before left border
print("\n2. LEFT BORDER CHECK (must be at column 0):")
leading_space_issues = []
for i in range(start-1, end):
    if i < len(lines):
        line = lines[i].rstrip('\n')
        if line.startswith(' │'):
            leading_space_issues.append(i+1)
            print(f"  ❌ FAIL: Line {i+1} has leading space before │")

if not leading_space_issues:
    print("  ✓ PASS: No leading spaces before left borders")
else:
    issues.append(f"Leading spaces before left border on lines: {leading_space_issues}")

# 3. Check arrow consistency
print("\n3. ARROW CONSISTENCY CHECK:")
arrow_issues = []
for i in range(start-1, end):
    if i < len(lines):
        line = lines[i].rstrip('\n')
        # Check for single-dash arrows (bad)
        if '←─┐' in line or '←─┘' in line or '←─┼' in line:
            arrow_issues.append((i+1, "single-dash arrow ←─ (should be ←──)"))
        if '─→' in line and '──→' not in line:
            arrow_issues.append((i+1, "single-dash arrow ─→ (should be ──→)"))

if not arrow_issues:
    print("  ✓ PASS: Arrow formatting looks consistent")
else:
    print("  ❌ FAIL: Arrow formatting issues found:")
    for line_num, issue in arrow_issues:
        print(f"     Line {line_num}: {issue}")
    issues.append("Inconsistent arrow formatting")

# 4. Check vertical border alignment
print("\n4. VERTICAL BORDER ALIGNMENT:")
vertical_borders = {}
for i in range(start-1, end):
    if i < len(lines):
        line = lines[i].rstrip('\n')
        for j, char in enumerate(line):
            if char == '│':
                if j not in vertical_borders:
                    vertical_borders[j] = []
                vertical_borders[j].append(i+1)

print(f"  Found {len(vertical_borders)} vertical border columns:")
for col, line_nums in sorted(vertical_borders.items()):
    print(f"    Column {col}: lines {line_nums}")

# 5. Check nested box corners
print("\n5. NESTED BOX CORNER ALIGNMENT:")
corner_issues = []
for i in range(start-1, end):
    if i < len(lines):
        line = lines[i].rstrip('\n')
        for j, char in enumerate(line):
            if char in '┌└':
                # Check if there's a vertical border at this column
                if j in vertical_borders:
                    # Good - corner aligns with vertical borders
                    pass
                else:
                    # Check if there's a nearby vertical border
                    found_nearby = False
                    for offset in [-1, 1]:
                        if j+offset in vertical_borders:
                            corner_issues.append((i+1, char, j, j+offset))
                            found_nearby = True
                    if not found_nearby and char == '┌':
                        # This is OK for new nested boxes
                        pass

if corner_issues:
    print("  ❌ FAIL: Nested box corner alignment issues:")
    for line_num, char, actual_col, expected_col in corner_issues:
        print(f"     Line {line_num}: '{char}' at column {actual_col}, but vertical borders at column {expected_col}")
    issues.append("Nested box corner misalignment")
else:
    print("  ✓ PASS: Nested box corners align with vertical borders")

# Final summary
print("\n" + "="*60)
if issues:
    print("❌ VALIDATION FAILED")
    print(f"\nIssues found ({len(issues)}):")
    for i, issue in enumerate(issues, 1):
        print(f"  {i}. {issue}")
    print("\n⚠ DO NOT present this as a fix - issues must be corrected first!")
    sys.exit(1)
else:
    print("✅ VALIDATION PASSED")
    print("\nAll checks passed - ASCII art is properly aligned!")
    sys.exit(0)
