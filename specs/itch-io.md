# 🎯 Itch.io Deployment Plan

**Deploy HollowWorld character management system to itch.io as a web game**

## make a shell script, bin/deploy, that does this deployment

## 📋 Pre-Deployment Checklist

### 🔧 Technical Preparation
- [ ] **Build production bundle** - Run `npm run build` to create optimized distribution files
- [ ] **Test production build** - Verify all functionality works in production mode
- [ ] **Validate asset paths** - Ensure all audio, images, and fonts load correctly
- [ ] **Check bundle size** - Optimize if necessary for web delivery
- [ ] **Browser compatibility** - Test in Chrome, Firefox, Safari, Edge

### 📁 File Organization
- [ ] **Create distribution folder** - Organize all deployable files
- [ ] **Include required assets**:
  - HTML entry point (`index.html`)
  - JavaScript bundle (`main.js` or similar)
  - CSS stylesheets
  - Audio files (gunshots, background music)
  - Font files (Rye, Sancreek)
- [ ] **Verify relative paths** - All assets use relative URLs for itch.io hosting

### 🎮 Game Metadata
- [ ] **Create game description** - Write compelling description for itch.io page
- [ ] **Design cover image** - Create western-themed game banner/logo
- [ ] **Prepare screenshots** - Capture character manager, editor, and splash screen
- [ ] **Write game tags** - Include: character-creator, rpg, western, hollow, web

## 🚀 Deployment Steps

### 1. 🏗️ Build Production Version
```bash
npm run build
# Creates dist/ folder with optimized files
```

### 2. 📦 Package for Itch.io
- **Clean temporary files** from dist folder:
  - Remove `*~` backup files
  - Remove `*.~undo-tree~` files
  - Remove any editor temporary files
- **Copy missing assets** to dist:
  - Copy `src/assets/audio/*.mp3` to `dist/assets/audio/`
  - Verify all audio files (gunshots, background music) are included
- increment minor version in top-level VERSION file
- copy the VERSION file to dist
- **Zip the dist folder** containing:
  - `index.html` (entry point)
  - `assets/` (JS, CSS, fonts, audio)
  - `templates/` (HTML template files)
  - ensure required project files are present and current
- **Test the zip** by extracting and opening locally
- **Verify file size** (itch.io has upload limits)

### 3. 🌐 Itch.io Setup
- use the zotimer/hollow-world project on itch.io
- update the project using instructions below
- **Upload game files** with butler

### 4. 📝 Game Page Content
- **Title**: "Don't Go Hollow - Game Tools for the Hollow TTRPG"
- **Subtitle**: "Frontier Character Creation for the Hollow TTRPG and more"
- **Description**:
  ```
  Create and manage your frontier outlaws for the Hollow RPG system.

  Features:
  • Interactive character creation with western theming
  • Full attribute management with game-accurate point economy
  • Persistent character storage across sessions
  • Authentic frontier audio and visual design
  • Mobile-friendly responsive interface

  Build your perfect gunslinger, doc, or mysterious drifter for your next adventure on the frontier!
  ```

### 5. 🎨 Visual Assets
- **Cover Art**: Western-themed banner featuring character silhouettes
- **Screenshots**:
  1. Splash screen with title and peer ID
  2. Character list showing multiple frontier characters
  3. Character editor with attribute controls
  4. Mobile view demonstrating responsiveness
- **Favicon**: Small western-themed icon

### 6. 🏷️ Metadata & Tags
- **Genre**: Role Playing, Tools
- **Tags**: character-creator, rpg, western, hollow, web-based, frontier
- **Platform**: Web (HTML5)
- **Price**: Free
- **License**: Specify appropriate license for RPG tool

## 🧪 Testing Protocol

### 📱 Cross-Platform Testing
- [ ] **Desktop browsers** - Chrome, Firefox, Safari, Edge
- [ ] **Mobile devices** - iOS Safari, Android Chrome
- [ ] **Tablet devices** - iPad, Android tablets
- [ ] **Different screen sizes** - 320px to 1920px+

### 🎮 Functionality Testing
- [ ] **Character creation** - Create new characters with proper starting values
- [ ] **Attribute editing** - Test increment/decrement with proper point spending
- [ ] **Rank changes** - Verify XP and chip totals update correctly
- [ ] **Save/load cycle** - Test persistence across browser sessions
- [ ] **Delete characters** - Confirm deletion with proper confirmation
- [ ] **Audio playback** - Gunshots and background music work
- [ ] **Navigation** - Browser back button and internal navigation

### 🔧 Performance Testing
- [ ] **Load times** - Ensure fast initial loading
- [ ] **Audio performance** - No audio lag or overlap issues
- [ ] **Memory usage** - Check for leaks during extended use
- [ ] **Battery impact** - Test on mobile devices

## 📈 Post-Deployment

### 🔍 Monitoring
- [ ] **Check itch.io analytics** - Track plays and engagement
- [ ] **Monitor user feedback** - Respond to comments and reviews
- [ ] **Bug reports** - Set up system for collecting and addressing issues

### 🚀 Future Updates
- [ ] **Version control** - Tag releases for deployment tracking
- [ ] **Update process** - Establish workflow for pushing updates
- [ ] **Feature expansion** - Plan additional RPG tools and features
- [ ] **Community feedback** - Incorporate user suggestions

## 🎯 Success Metrics

- **Functional deployment** - All features work in itch.io environment
- **Positive user feedback** - 4+ star rating if possible
- **Performance goals** - Load in under 3 seconds
- **Accessibility** - Works on 95%+ of target devices
- **User engagement** - Characters created and saved successfully

---

*This deployment plan ensures a smooth launch of the HollowWorld character management system as a professional web-based RPG tool on itch.io.*
