# Commit Command

Analyze recent changes and create a git commit with terse bullet points for each change or bug fix.

## Instructions

1. Check git status and diff to identify all changes
2. Stop and ask about new files to make sure test/temp things are not added to the repo by accident. Unless it's in .gitignore
3. git add everything
4. Generate a commit message with:
   - Terse bullet points (• prefix) for each distinct change/fix
   - Brief, descriptive language following existing commit style
   - Include version bumps, new features, bug fixes, and file additions
5. Add relevant files to staging and commit with the generated message
6. Verify the commit was successful

## Example Format
```
• bump version to 1.0.16
• add ship SVG guidelines and requirements
• fix neck symmetry in converted_icon_14x14.svg

🤖 Vibe-Coded by [Claude Code](https://claude.ai/code)
```