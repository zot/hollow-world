#!/bin/bash
# Install d2 diagram tool for ASCII art generation

set -e

echo "Installing d2..."
curl -fsSL https://d2lang.com/install.sh | sh -s --

echo ""
echo "✓ d2 installed successfully"
echo "Test with: d2 --version"
