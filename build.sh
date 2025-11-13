#!/bin/bash
# Build script for HollowWorld without Vite

set -e

# Default to production mode unless DEV=true is set
MODE="${MODE:-production}"
if [ "$MODE" = "development" ]; then
    DEV_FLAG="true"
    MODE_FLAG='"development"'
else
    DEV_FLAG="false"
    MODE_FLAG='"production"'
fi

echo "📚 Extracting p2p-webapp client library..."
mkdir -p src/p2p/client
bin/p2p-webapp cp client.* types.d.ts src/p2p/client/

echo "🔧 Updating client library class names..."
sed -i 's/IPFSWebAppClient/P2PWebAppClient/g' src/p2p/client/client.js
sed -i 's/IPFSWebAppClient/P2PWebAppClient/g' src/p2p/client/client.d.ts
echo "✅ Client library extracted and updated"

echo "🧹 Cleaning output directory..."
rm -rf hollow-world-p2p/html/*

echo "📄 Creating index.html..."
cat > hollow-world-p2p/html/index.html << 'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HollowWorld</title>
    <style>
        * {
            box-sizing: border-box;
        }
        html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow-x: hidden;
        }
        #app {
            height: 100%;
        }
    </style>
    <!-- Bundled CSS from esbuild (includes Milkdown styles) -->
    <link rel="stylesheet" href="/main.css">
    <!-- CSS files -->
    <link rel="stylesheet" href="/styles/EnhancedAudioControl.css">
    <link rel="stylesheet" href="/styles/SplashScreen.css">
    <link rel="stylesheet" href="/styles/CharacterManager.css">
    <link rel="stylesheet" href="/styles/CharacterEditor.css">
    <link rel="stylesheet" href="/styles/CharacterSheet.css">
    <link rel="stylesheet" href="/styles/FriendsView.css">
    <link rel="stylesheet" href="/styles/SettingsView.css">
    <link rel="stylesheet" href="/styles/EventModal.css">
    <link rel="stylesheet" href="/styles/GlobalAudioControl.css">
    <link rel="stylesheet" href="/styles/AdventureView.css">
</head>
<body>
  <!-- Base URL initialization - must be at top of body before main.js loads -->
  <script>
   // Set Base URL to app root (origin) for SPA routing
   window.Base = new URL('/', document.location.origin)
  </script>

  <div id="app"></div>
  <script type="module" src="/main.js"></script>
</body>
</html>
HTML

echo "📦 Bundling with esbuild (MODE=$MODE)..."
npx esbuild src/main.ts \
    --bundle \
    --format=esm \
    --platform=browser \
    --target=es2020 \
    --sourcemap \
    --loader:.woff=dataurl \
    --loader:.woff2=dataurl \
    --loader:.ttf=dataurl \
    --loader:.css=css \
    --define:import.meta.env.DEV=$DEV_FLAG \
    --define:import.meta.env.MODE=$MODE_FLAG \
    --outfile=hollow-world-p2p/html/main.js

echo "📄 Copying CSS files..."
mkdir -p hollow-world-p2p/html/styles
cp -r src/styles/*.css hollow-world-p2p/html/styles/

echo "📄 Copying public assets..."
cp -r public/* hollow-world-p2p/html/

echo "📄 Copying VERSION file..."
cp VERSION hollow-world-p2p/html/

echo "✅ Build complete! Files in hollow-world-p2p/html/"
echo "   - index.html (entry point)"
echo "   - main.js (compiled TypeScript)"
echo "   - templates/ (UI templates)"
echo "   - assets/ (static files)"
