# Development Guide

**Development server, build process, and workflow for HollowWorld**

---

## Development Server

### p2p-webapp Server (Primary)

The application is served by **p2p-webapp** (Go WebSocket server, not Vite):

**📖 See [`p2p-webapp-cli.md`](p2p-webapp-cli.md) for complete server documentation:**
- Command reference and options
- Development workflows
- Testing workflows
- Multi-peer setup
- Troubleshooting

**Quick Reference:**
- **Binary location**: `bin/p2p-webapp`
- **Start command**: `npm run serve` (or `npm run dev` for full development)
- **Port**: Random (p2p-webapp prints URL on startup)
- **Multi-Peer Architecture**: One server supports multiple browser clients
  - Each browser tab = unique peer identity
  - Different profiles required for multiple tabs (see [`p2p-webapp-cli.md#multi-peer-testing`](p2p-webapp-cli.md#multi-peer-testing))

---

## Build Process

### Build Script

**Script**: `./build.sh`
**Bundler**: esbuild (replaced Vite for lightweight bundling)

### Build Steps

1. Creates `index.html` entry point with CSS `<link>` tags
2. Bundles TypeScript with esbuild (handles npm packages like Milkdown)
3. Copies CSS files from `src/styles/`
4. Copies JavaScript files from `src/` (non-TypeScript files)
5. Copies `public/` assets (templates, audio)
6. Copies `VERSION` file

### Output Directory

**Location**: `hollow-world-p2p/html/`

**Directory structure:**
```
hollow-world-p2p/
├── html/       # Built application (tsc output + assets)
│   ├── index.html   # Entry point
│   ├── main.js      # Compiled TypeScript
│   ├── templates/   # UI templates
│   ├── assets/      # Static files
│   └── ...
├── ipfs/       # IPFS content (optional)
└── storage/    # p2p-webapp storage (auto-created)
```

---

## Development Workflow

### Recommended: Integrated Dev Mode

```bash
# Run watch + serve in single command
npm run dev

# This will:
# 1. Build the application
# 2. Start esbuild watch (auto-recompile TypeScript on changes)
# 3. Start asset watch (auto-copy templates & CSS on changes)
# 4. Start p2p-webapp server
# 5. Clean up all processes on Ctrl+C

# Browser: Open URL from terminal (e.g., http://localhost:54321)
# Edit files → watchers auto-update → refresh browser to see changes
# Files watched:
#   - src/**/*.ts       → hollow-world-p2p/html/main.js (esbuild)
#   - public/templates/ → hollow-world-p2p/html/templates/ (asset watcher)
#   - src/styles/       → hollow-world-p2p/html/styles/ (asset watcher)
```

### Manual Control (Advanced)

```bash
# Terminal 1: esbuild watch only
npm run watch

# Terminal 2: Serve only
npm run serve
```

### Build Only

```bash
# Just build (no watch, no serve)
npm run build
```

---

## WebSocket Connection

**Endpoint**: Auto-detected from browser URL (e.g., `ws://localhost:PORT/ws`)
- **Port**: Shown in terminal when p2p-webapp starts
- **P2P Protocol**: `/hollow-world/1.0.0`
- **Peer ID**: Generated and stored in localStorage on first run

---

## Testing

### Playwright Testing with p2p-webapp

**📖 See [`p2p-webapp-cli.md#automated-testing-playwright`](p2p-webapp-cli.md#automated-testing-playwright) for complete testing workflow**

**Quick Reference:**

```bash
# Start p2p-webapp for testing (MUST use --noopen)
cd hollow-world-p2p && ../bin/p2p-webapp --dir . -v --noopen

# In another terminal, run Playwright tests
npm run test:e2e
```

**Why `--noopen` is REQUIRED**: Prevents browser conflicts with Playwright automation.

### Key Testing Requirements

- Use Playwright for integration tests
- Test organization: `test/` directory for TypeScript/JavaScript tests
- Each spec should have a corresponding `.tests.md` file
- All routes must work on both direct navigation AND page refresh
- Asset URLs must resolve correctly from all routes

See [`testing.md`](testing.md) for complete testing documentation.

---

## App Initialization

### Window.Base URL

✅ **IMPLEMENTED**: Base URL initialization in script element at top of body:

```html
<script>
    window.Base = new URL('', document.location);
</script>
```

This provides a base URL for all asset loading, ensuring assets work from all routes.

---

## Asset URL Management

### Pervasive Base URL Usage

✅ **IMPLEMENTED**: Use `Base` as parent URL for all assets, including templates

**Pattern:**
```typescript
// Use Base URL for all asset paths
const templateUrl = new URL('templates/character-card.html', Base).toString();
const audioUrl = new URL('assets/audio/gunshot.mp3', Base).toString();
```

**Benefits:**
- Assets work from all routes (/, /characters, /character/:id, etc.)
- Handles subdirectory deployments
- Consistent asset loading across views

---

## CORS Configuration

Allow requests from:
- Current host
- localhost
- zotimer.itch.io (for itch.io deployment)

p2p-webapp handles CORS automatically for most cases. Custom CORS headers may be needed for specific deployments.

---

## Updating p2p-webapp

**📖 See [`p2p-webapp-cli.md#updating-p2p-webapp`](p2p-webapp-cli.md#updating-p2p-webapp) for complete update process**

**Quick Reference:**

```bash
# 1. Update binary
cp ../p2p-webapp/p2p-webapp bin/p2p-webapp

# 2. Update client library
bin/p2p-webapp cp client.js client.d.ts types.d.ts src/p2p/client/

# 3. Verify
bin/p2p-webapp version
```

---

## npm Scripts

### Available Scripts

```bash
# Development
npm run dev          # Build + watch + serve (recommended)
npm run watch        # Auto-recompile on changes
npm run serve        # Serve built app with p2p-webapp

# Building
npm run build        # Build production bundle

# Testing
npm run test:unit    # Run unit tests
npm run test:e2e     # Run Playwright integration tests
npm test             # Run all tests

# Utilities
npm run lint         # Run ESLint
npm run format       # Run Prettier
```

---

## Environment

### Node.js Version

**Required**: Node.js 18+ (for native fetch, WebSocket support)

### Dependencies

See [`dependencies.md`](dependencies.md) for complete dependency documentation.

**Key dependencies:**
- **esbuild**: Fast TypeScript bundler
- **Milkdown**: Markdown editor for notes
- **Playwright**: E2E testing framework

---

## Troubleshooting

### Build Errors

**"Cannot find module"**:
- Run `npm install` to ensure dependencies are installed
- Check `package.json` for correct dependency versions

**"esbuild failed"**:
- Check TypeScript errors (`npx tsc --noEmit`)
- Ensure all imports use correct paths
- Verify file extensions (.ts, .js, .css)

### Server Errors

**"Port already in use"**:
- p2p-webapp uses random ports, so this is rare
- Kill existing p2p-webapp process: `pkill p2p-webapp`

**"WebSocket connection failed"**:
- Ensure p2p-webapp server is running
- Check browser console for WebSocket errors
- Verify port matches server output

### Testing Errors

**"Playwright browser not found"**:
- Run `npx playwright install` to install browsers
- Ensure `--noopen` flag is used with p2p-webapp during tests

**"Test timeout"**:
- Increase timeout in test configuration
- Check if server is running and accessible
- Verify test selectors match current UI

---

## Performance Tips

### Development Mode

- Use `npm run dev` for fastest workflow
- esbuild watch rebuilds only changed files
- Browser refresh shows changes immediately

### Production Build

- Run `npm run build` before deployment
- Minified bundle for faster loading
- Source maps for debugging

---

## References

- **Main Spec**: [`main.md`](main.md)
- **Testing**: [`testing.md`](testing.md)
- **P2P System**: [`p2p.md`](p2p.md)
- **p2p-webapp CLI**: [`p2p-webapp-cli.md`](p2p-webapp-cli.md)
- **Dependencies**: [`dependencies.md`](dependencies.md)
- **Storage**: [`storage.md`](storage.md)
