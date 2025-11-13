# 🖥️ p2p-webapp CLI Reference

**⭐ AUTHORITATIVE GUIDE for all p2p-webapp server usage**

**Command-line interface, options, workflows, and troubleshooting for the p2p-webapp server**

**📖 This is THE reference for:**
- Server commands and options
- Development workflows
- Testing workflows (Playwright)
- Multi-peer setup
- Updating p2p-webapp
- Troubleshooting

*See also: [`p2p.md`](p2p.md) (P2P networking concepts), [`dependencies.md`](dependencies.md) (installation)*

---

## 📋 Overview

The `p2p-webapp` binary is a Go application that provides P2P networking capabilities to browser-based applications. It runs as a local WebSocket server that browsers connect to.

**Key Features**:
- Serves web applications with P2P capabilities
- WebSocket server for browser communication
- libp2p-based peer-to-peer networking
- Process management (ps, kill, killall)
- Bundle management (extract, bundle, ls, cp)

**Binary Location**: `bin/p2p-webapp`

**Source**: https://github.com/zot/p2p-webapp

---

## 🎯 Command Reference

### Default Command (Serve)

Starts the p2p-webapp server to serve a web application.

```bash
p2p-webapp [options]
```

**Options**:

| Option | Short | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--dir <path>` | | string | Bundled site | Directory to serve from (must contain `html/`, `ipfs/`, `storage/`) |
| `--port <port>` | `-p` | int | 10000+ | Port to listen on (auto-selects if 0 or unavailable) |
| `--noopen` | | bool | false | Do not open browser automatically |
| `--linger` | | bool | false | Keep server running after all WebSocket clients disconnect |
| `--verbose` | `-v` | count | 0 | Verbose output (use multiple times: `-v`, `-vv`, `-vvv`) |

**Examples**:

```bash
# Serve from directory (development)
p2p-webapp --dir ./hollow-world-p2p -v

# Serve from bundled site (production binary)
p2p-webapp

# Auto-exit disabled, browser won't open
p2p-webapp --dir ./hollow-world-p2p --linger --noopen

# Specific port with verbose logging
p2p-webapp --dir ./hollow-world-p2p -p 8080 -vvv
```

**Directory Structure** (when using `--dir`):

```
hollow-world-p2p/
├── html/           # Web application files (REQUIRED)
│   └── index.html  # Entry point (REQUIRED)
├── ipfs/           # IPFS content (optional, auto-created)
└── storage/        # Server storage (optional, auto-created)
    └── peer-keys   # libp2p peer keys
```

**Behavior**:
- Creates IPFS node with unique peer ID
- Starts HTTP server on specified/auto-selected port
- Listens for WebSocket connections at `/ws`
- Serves static files from `html/` directory
- Opens browser unless `--noopen` specified
- Registers process in PID tracking file

---

## ⚙️ Auto-Exit Feature

**Default Mode** (without `--linger`):

When all browser clients disconnect (WebSocket connections close):
1. Server detects zero active WebSocket connections
2. Starts 5-second countdown timer
3. Logs: `"Server closing in 5 seconds due to no active connections"`
4. If no new connections within 5 seconds: server exits cleanly
5. If new connection arrives: countdown cancelled, server continues

**Benefits**:
- Automatic cleanup when development session ends
- No orphaned server processes after closing browser
- Clean resource management

**Linger Mode** (with `--linger`):

Server runs indefinitely regardless of WebSocket connection count.

**Use Cases**:
- Multiple browser tabs with frequent reconnections
- Page reload workflows during development
- Long-running server scenarios
- Testing with intermittent connections

**Note**: Auto-exit monitors **WebSocket connections from browser clients**, not libp2p P2P connections between peers.

---

## 🔧 Utility Commands

### version

Show p2p-webapp version information.

```bash
p2p-webapp version
```

**Example Output**:
```
p2p-webapp version 0.1.3
```

---

### ps

List all running p2p-webapp server processes.

```bash
p2p-webapp ps
```

**Example Output**:
```
PID     Port    Started
12345   10000   2025-01-07 10:30:15
12346   10001   2025-01-07 11:45:32
```

**Use Cases**:
- Check which servers are running
- Find port numbers for running servers
- Identify processes to kill

---

### kill

Kill a specific p2p-webapp server by PID.

```bash
p2p-webapp kill <pid>
```

**Example**:
```bash
p2p-webapp kill 12345
```

---

### killall

Kill all running p2p-webapp server processes.

```bash
p2p-webapp killall
```

**Warning**: This will terminate ALL p2p-webapp servers, including those serving other applications.

---

## 📦 Bundle Commands

### extract

Extract bundled site from binary to filesystem.

```bash
p2p-webapp extract <output-dir>
```

**Example**:
```bash
p2p-webapp extract ./extracted-site
```

**Use Cases**:
- Inspect bundled application contents
- Modify bundled application
- Debug bundled binary issues

---

### bundle

Bundle a site directory into the binary.

```bash
p2p-webapp bundle <input-dir>
```

**Example**:
```bash
p2p-webapp bundle ./hollow-world-p2p
```

**Use Cases**:
- Create standalone executable with application embedded
- Distribution of complete application as single file

---

### ls

List files in the bundled or served application.

```bash
p2p-webapp ls [path]
```

**Example**:
```bash
# List root
p2p-webapp ls

# List subdirectory
p2p-webapp ls html/templates
```

---

### cp

Copy files from bundled/served application to filesystem.

```bash
p2p-webapp cp <source-files...> <destination-dir>
```

**Example**:
```bash
# Copy client library files
bin/p2p-webapp cp client.js client.d.ts types.d.ts src/p2p/client/
```

**Use Cases**:
- Extract client library files
- Update dependencies from bundled binary
- Sync files between binary and project

---

## 🚀 Common Workflows

### Quick Start Development

**Recommended** - Use dev script with recommended flags:

```bash
# Recommended for development and automation (Claude Code)
./dev.sh --noopen --linger

# Or via npm
npm run dev -- --noopen --linger
```

**What this does:**
1. Builds the application
2. Starts esbuild watch (auto-recompile TypeScript)
3. Starts asset watch (auto-copy templates & CSS)
4. Starts p2p-webapp server with flags: `--dir . -v --noopen --linger`
5. Cleans up all processes on Ctrl+C

**Why `--noopen --linger`:**
- `--noopen` - No auto-browser opening (Playwright-ready, better for automation)
- `--linger` - Server persists through page reloads and disconnections
- Open browser manually to URL shown in terminal

**Benefits:**
- Single command for full development environment
- Auto-rebuild on file changes
- Clean process management
- Playwright-ready (no browser conflicts)
- Server stays running during development

**Note:** The flags are passed through to p2p-webapp via `"$@"` in dev.sh

---

### Manual Development Workflow

```bash
# Start server with auto-exit (default behavior)
cd hollow-world-p2p
../bin/p2p-webapp --dir . -v

# Browser opens automatically
# Work on application...
# Close browser → server exits after 5 seconds
```

**Standard flags:**
- `--dir .` - Serve from current directory
- `-v` - Verbose logging

---

### Development with Manual Testing

**For interactive testing with multiple browser tabs:**

```bash
# Start server with linger and noopen
cd hollow-world-p2p
../bin/p2p-webapp --dir . -v --noopen --linger
```

**Why these flags?**
- `--noopen` - Don't auto-open browser (you open tabs manually)
- `--linger` - Server keeps running when all tabs close
- `-v` - Verbose logging for debugging

**Recommended for:**
- Testing with multiple browser tabs
- Frequent page reloads during development
- Multi-profile testing (different profiles in different tabs)

---

### Automated Testing (Playwright)

**CRITICAL for Playwright:** Always use `--noopen` flag

```bash
# Terminal 1: Start server for testing
cd hollow-world-p2p
../bin/p2p-webapp --dir . -v --noopen

# Terminal 2: Run Playwright tests
npm run test:e2e
```

**Why `--noopen` is REQUIRED:**
- Prevents p2p-webapp from launching its own browser window
- Playwright needs to control the browser automation
- Without `--noopen`, you'll get browser conflicts

**Optional `--linger`:**
- Not required but can be useful if server exits between test runs
- Auto-exit (5 seconds) is usually fast enough for Playwright reconnection

---

### Multi-Peer Testing

**Testing P2P features requires multiple peers:**

```bash
# Start server with noopen and linger
cd hollow-world-p2p
../bin/p2p-webapp --dir . -v --noopen --linger

# Open multiple browser tabs manually
# IMPORTANT: Use different profiles in each tab
```

**Multi-Peer Architecture:**
- One p2p-webapp server supports multiple browser clients
- Each browser tab gets a unique peer identity
- Example: 5 tabs = 5 peer IDs, 1 server

**⚠️ Profile Requirement:**
- **Same profile in multiple tabs**: ERROR (peer ID conflict)
- **Different profiles in multiple tabs**: WORKS (unique peer IDs)
- Use Settings → Profiles to switch profiles per tab

**Use Cases:**
- Testing friend requests between peers
- Testing P2P messaging
- Testing multiplayer game sessions

### Production Deployment

```bash
# Bundle application into binary
p2p-webapp bundle ./hollow-world-p2p

# Distribute bundled binary
# Users run: ./p2p-webapp
```

---

## 🔄 Updating p2p-webapp

When the p2p-webapp binary or client library is updated in the `../p2p-webapp/` repository:

### Update Binary

```bash
# Copy updated binary from p2p-webapp repo
cp ../p2p-webapp/p2p-webapp bin/p2p-webapp
```

### Update Client Library

```bash
# Use p2p-webapp cp command to extract client files
bin/p2p-webapp cp client.js client.d.ts types.d.ts src/p2p/client/
```

**This extracts:**
- `client.js` - Compiled client library
- `client.d.ts` - TypeScript definitions for client
- `types.d.ts` - TypeScript type definitions

### Verify Update

```bash
# Check version
bin/p2p-webapp version

# List bundled files
bin/p2p-webapp ls

# Test server
bin/p2p-webapp --dir ./hollow-world-p2p -v --noopen
```

### When to Update

- **Protocol changes**: p2p-webapp protocol version updates
- **Bug fixes**: Client library bug fixes
- **New features**: New API features in p2p-webapp
- **Security updates**: Security patches

### Build Script Integration

The `build.sh` script automatically extracts client library files during build:

```bash
# Extraction happens automatically during build
npm run build

# Or manually run build script
./build.sh
```

---

## 🔍 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
p2p-webapp ps

# Kill specific process
p2p-webapp kill <pid>

# Or kill all
p2p-webapp killall
```

### Multiple Servers Running

```bash
# List all running servers
p2p-webapp ps

# Kill all servers
p2p-webapp killall

# Start fresh
p2p-webapp --dir ./hollow-world-p2p -v
```

### Server Exits Unexpectedly

**Cause**: Default auto-exit behavior kicks in when all browser connections close.

**Solutions**:
```bash
# Use --linger to prevent auto-exit
p2p-webapp --dir ./hollow-world-p2p --linger

# Keep browser tab open
# Or reconnect within 5 seconds
```

### PID Tracking Issues

PID tracking uses a file in the project directory to track running servers.

**Recovery**:
```bash
# If PID tracking is corrupted
rm -f .p2p-webapp-pids.json

# Start fresh
p2p-webapp --dir ./hollow-world-p2p -v
```

---

## 🔐 Security Notes

- **Local Only**: p2p-webapp listens on `localhost` by default
- **No Authentication**: WebSocket connections are not authenticated (assumes local trust)
- **CORS**: Allows all origins for localhost development
- **File Access**: Server can only serve files within specified `--dir` directory
- **Process Tracking**: PID file tracks local processes (not security-sensitive)

---

## 📚 Related Documentation

- **[`development.md`](development.md)** - Build process and development workflow
- **[`testing.md`](testing.md)** - Testing strategy and Playwright setup
- **[`p2p.md`](p2p.md)** - P2P networking architecture and API
- **[`dependencies.md`](dependencies.md)** - Installation and setup
- **[`main.md`](main.md)** - Project overview

---

*Last Updated: 2025-11-13*
