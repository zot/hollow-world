# Development Scripts

This directory contains Node.js scripts used during development.

## watch-assets.js

**Purpose**: Watches template and CSS files during development and automatically copies them to the output directory when changed.

**Usage**: Automatically started by `npm run dev` (via `dev.sh`)

**Watched directories**:
- `public/templates/` → `hollow-world-p2p/html/templates/`
- `src/styles/` → `hollow-world-p2p/html/styles/`

**Features**:
- Recursive directory watching
- Automatic directory creation
- Ignores hidden and temporary files
- Colored console output

**Manual usage** (if needed):
```bash
node scripts/watch-assets.js
```

Press Ctrl+C to stop.

**Why this exists**: The `npm run watch` command only watches TypeScript files via esbuild. Templates and CSS files are not watched by esbuild, so this script fills that gap during development. Without it, developers would need to manually run `./build.sh` or copy files every time a template or CSS file changes.
