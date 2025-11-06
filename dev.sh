#!/bin/bash
# Development script - runs tsc --watch and p2p-webapp serve simultaneously
# Cleans up both processes on exit

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Cleanup function
cleanup() {
    echo -e "\n${BLUE}🛑 Shutting down development servers...${NC}"
    
    # Kill watch process if running
    if [ ! -z "$WATCH_PID" ] && kill -0 $WATCH_PID 2>/dev/null; then
        echo "Stopping TypeScript watch (PID: $WATCH_PID)..."
        kill $WATCH_PID 2>/dev/null || true
    fi
    
    # Kill serve process if running
    if [ ! -z "$SERVE_PID" ] && kill -0 $SERVE_PID 2>/dev/null; then
        echo "Stopping p2p-webapp server (PID: $SERVE_PID)..."
        kill $SERVE_PID 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Development servers stopped${NC}"
    exit 0
}

# Set up trap to catch Ctrl+C and other exit signals
trap cleanup SIGINT SIGTERM EXIT

# Initial build in development mode
echo -e "${BLUE}📦 Building application...${NC}"
MODE=development ./build.sh

# Start esbuild watch in background
echo -e "${BLUE}👁️  Starting esbuild watch...${NC}"
npm run watch &
WATCH_PID=$!
echo "esbuild watch running (PID: $WATCH_PID)"

# Give tsc a moment to start
sleep 1

# Start p2p-webapp serve
echo -e "${BLUE}🚀 Starting p2p-webapp server...${NC}"
cd hollow-world-p2p && ../bin/p2p-webapp serve -v "$@"&
SERVE_PID=$!
cd ..
echo "p2p-webapp server running (PID: $SERVE_PID)"

echo -e "\n${GREEN}✅ Development servers running${NC}"
echo -e "${BLUE}Press Ctrl+C to stop both servers${NC}\n"

# Wait for serve process to exit
wait $SERVE_PID
