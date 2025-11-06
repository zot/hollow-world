# Dependency Management

## External Binaries

### p2p-webapp
- **Version**: Latest from repository
- **Purpose**: P2P networking server providing libp2p capabilities to browsers via WebSocket
- **Location**: `bin/p2p-webapp`
- **Source**: https://github.com/emendir/p2p-webapp
- **Platform**: Platform-specific binary (Linux, macOS, Windows)
- **Installation**: Download from GitHub releases or build from source
- **Note**: Binary is .gitignored - must be obtained separately

#### Building from Source
```bash
# Clone repository
git clone https://github.com/emendir/p2p-webapp.git
cd p2p-webapp

# Build (requires Go 1.21+)
go build -o p2p-webapp

# Copy to HollowWorld
cp p2p-webapp /path/to/HollowWorld/bin/
```

#### Using Pre-built Binary
Download from GitHub releases and place in `bin/p2p-webapp`.

## NPM Dependencies

### Production Dependencies

#### Milkdown Editor (7.16.0)
Rich markdown editor framework:
- `@milkdown/core` - Core editor engine
- `@milkdown/crepe` - Pre-configured editor setup
- `@milkdown/ctx` - Context system
- `@milkdown/plugin-block` - Block editing
- `@milkdown/plugin-clipboard` - Clipboard operations
- `@milkdown/plugin-history` - Undo/redo
- `@milkdown/plugin-listener` - Event listeners
- `@milkdown/plugin-slash` - Slash commands
- `@milkdown/preset-commonmark` - CommonMark syntax
- `@milkdown/prose` - ProseMirror integration
- `@milkdown/theme-nord` - Nord color theme

**Version Notes**:
- Largest dependency (accounts for most of bundle size)
- Character sheets use Milkdown for rich text editing
- All packages must stay in sync at same version

### Development Dependencies

#### Build Tools
- **esbuild** (^0.25.12) - Fast JavaScript bundler
  - Replaced Vite in Phase 6 of P2P migration
  - Build time: ~729ms vs 8.88s with Vite
  - Bundle size: 5.2MB
  - See: `build.sh` for build configuration

#### TypeScript
- **typescript** (^5.9.2) - TypeScript compiler
- **@types/node** (^24.4.0) - Node.js type definitions

#### Testing Framework
- **vitest** (^4.0.6) - Unit test framework
  - Added back in Phase 7 after Vite removal
  - 31 packages (standalone, not part of Vite)
- **jsdom** (^27.1.0) - DOM environment for tests (44 packages)
- **fake-indexeddb** (^6.2.4) - IndexedDB mock for tests (1 package)
- **@playwright/test** (^1.56.1) - E2E test framework
- **playwright** (^1.55.1) - Browser automation

#### P2P Client Library
- **@emendir/p2p-webapp-client** - TypeScript client for p2p-webapp
  - WebSocket-based communication with p2p-webapp server
  - Provides P2P messaging API
  - Used by `P2PWebAppNetworkProvider`

## Dependency History

### Major Removals (P2P Migration)

**Phase 4: Removed libp2p/helia (591 packages)**
- All `@libp2p/*` packages
- All `@chainsafe/libp2p-*` packages
- `helia` and related IPFS packages
- `@multiformats/*` packages
- WebRTC/WebTransport dependencies
- See: `specs/p2p-migration-progress.md` Phase 4

**Phase 6: Removed Vite (195 packages)**
- `vite` and all Vite plugins
- Rollup and related bundler tools
- Development server dependencies
- Replaced with lightweight esbuild
- See: `specs/p2p-migration-progress.md` Phase 6

**Net Result**:
- **Removed**: 786 packages (591 libp2p + 195 Vite)
- **Added back**: 76 packages (vitest 31 + jsdom 44 + fake-indexeddb 1)
- **Net reduction**: 710 packages removed
- **Bundle size reduction**: From complex Vite setup to 5.2MB esbuild bundle

### Why These Changes Were Made

#### libp2p → p2p-webapp
**Problem**: Browser-based libp2p was complex with 591 dependencies
**Solution**: Use Go-based p2p-webapp server with WebSocket client (zero runtime dependencies)
**Benefits**:
- Simpler dependency management
- Faster installs
- More reliable P2P connectivity
- Easier troubleshooting

#### Vite → esbuild
**Problem**: Vite brought 195 dependencies and slower builds (8.88s)
**Solution**: Use esbuild directly for bundling
**Benefits**:
- Faster builds (729ms)
- Fewer dependencies
- Simpler configuration
- Sufficient for project needs

## Package Version Management

### Version Pinning Strategy

**Critical packages** (pin to specific versions):
- `typescript` - Language features depend on version
- `@milkdown/*` - All must stay synchronized
- `@playwright/test` - Must match playwright version

**Development packages** (allow minor updates):
- `vitest`, `jsdom`, `fake-indexeddb` - Test framework
- `esbuild` - Build tool (breaking changes are rare)

### Updating Dependencies

#### Safe to Update
```bash
# Development tools (test carefully)
npm update vitest jsdom
npm update @playwright/test playwright
npm update esbuild
```

#### Update with Caution
```bash
# TypeScript (may require code changes)
npm update typescript

# Type definitions (usually safe)
npm update @types/node
```

#### Never Update Independently
```bash
# Milkdown - all packages must match versions
# Update all at once or none at all
npm update @milkdown/core @milkdown/crepe @milkdown/ctx \
  @milkdown/plugin-block @milkdown/plugin-clipboard \
  @milkdown/plugin-history @milkdown/plugin-listener \
  @milkdown/plugin-slash @milkdown/preset-commonmark \
  @milkdown/prose @milkdown/theme-nord
```

### Checking for Updates
```bash
# See which packages have updates available
npm outdated

# Check specific package
npm view @milkdown/core versions
```

## Build Configuration

### esbuild Configuration
See: `build.sh` for complete configuration

**Key settings**:
- **Entry**: `src/main.ts`
- **Output**: `hollow-world-p2p/html/main.js`
- **Format**: ESM (ES modules)
- **Platform**: Browser
- **Target**: ES2020
- **Bundle**: Yes (all dependencies inlined)
- **Sourcemap**: Yes (for debugging)

### Development vs Production

**Development** (`npm run dev`):
- esbuild watch mode (rebuilds on changes)
- p2p-webapp server with verbose logging
- Source maps enabled
- No minification

**Production** (`npm run build`):
- Single esbuild run
- Output in `hollow-world-p2p/html/`
- Source maps included
- No minification (for now)

## Testing Dependencies

### Unit Testing Stack
- **vitest**: Test runner and assertion library
- **jsdom**: Simulates browser DOM for tests
- **fake-indexeddb**: Mocks IndexedDB for TextCraft storage tests

**Test command**: `npm run test:unit`
**Config**: `vitest.config.ts`
**Setup**: `test/setup.ts` (configures fake-indexeddb)

### E2E Testing Stack
- **@playwright/test**: Test framework
- **playwright**: Browser automation (Chromium, Firefox, WebKit)

**Test command**: `npm run test:e2e`
**Config**: `playwright.config.ts`
**Tests**: `test/e2e/*.test.{js,ts}`

## Troubleshooting

### npm install Failures

**Symptom**: Package installation fails
**Solutions**:
1. Clear npm cache: `npm cache clean --force`
2. Delete node_modules: `rm -rf node_modules`
3. Delete package-lock.json: `rm package-lock.json`
4. Reinstall: `npm install`

### Binary Not Found

**Symptom**: `p2p-webapp` binary not found
**Solutions**:
1. Check if file exists: `ls -la bin/p2p-webapp`
2. Make executable: `chmod +x bin/p2p-webapp`
3. Download or build binary (see External Binaries section)

### TypeScript Errors After Update

**Symptom**: New TS errors after dependency update
**Solutions**:
1. Check TypeScript version: `npm list typescript`
2. Update type definitions: `npm update @types/node`
3. Review breaking changes in package release notes
4. Consider rolling back if errors are extensive

### Test Failures After Update

**Symptom**: Tests fail after updating test dependencies
**Solutions**:
1. Check for breaking changes in vitest/playwright
2. Update test configuration if needed
3. Verify fake-indexeddb compatibility
4. Check test setup file: `test/setup.ts`

## Related Documentation

- **[`p2p.md`](p2p.md)** - P2P system architecture and p2p-webapp usage
- **[`p2p-migration-progress.md`](p2p-migration-progress.md)** - Dependency removal history
- **[`testing.md`](testing.md)** - Test framework setup and usage

---

*Last updated: 2025-11-03*
*For dependency removal history, see: [`p2p-migration-progress.md`](p2p-migration-progress.md)*
