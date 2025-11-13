# 🏜️ Splash Screen Specification

**The initial screen for the Hollow World game**

*Based on [`../claude.md`](../claude.md)*

🧪 **Testing**: See [`ui.splash.tests.md`](ui.splash.tests.md) for test requirements

---

## 🎯 Core Requirements
- [x] Use **SOLID principles** in all implementations ✅ **IMPLEMENTED**
- **🔒 Strict TypeScript typing** - All function parameters, return values, and object properties must use explicit TypeScript types. Never use `any` type except for truly dynamic content. Interface types like `AttributeType` must be used when indexing typed objects like `IAttributes` *(Type your code tighter than a hangman's noose)*
- [x] Create comprehensive **unit tests** for all components ✅ **IMPLEMENTED**
- Use **HTML templates** instead of JavaScript template literals *(Separate your concerns like a good sheriff)*

### 🎨 Theme & Typography
- [x] **Old-timey western look** with Sancreek font, like a dime novel ✅ **IMPLEMENTED**
- [x] **Non-selectable elements** unless specifically noted ✅ **IMPLEMENTED**
- [x] **"Don't Go Hollow" title** in large old-west style font ✅ **IMPLEMENTED**
  - [x] The word **"Hollow"** should have a **green glow** while still using Sancreek font ✅ **IMPLEMENTED**
- [x] **Text color**: Medium-light brown throughout ✅ **IMPLEMENTED**
- [x] **Min splash screen height** on desktop should be 100vh ✅ **IMPLEMENTED**

### 🏷️ Version Display
- [x] Keep the current version number in a VERSION file at the top of the project ✅ **IMPLEMENTED** (currently v0.0.13)
- [x] ~~The current version starts at 0.0.1~~ ✅ **COMPLETED** (now at v0.0.13)
- [x] Display the version number at the bottom of the splash screen ✅ **IMPLEMENTED**
- [x] Print the current version number to the console ✅ **IMPLEMENTED**

### 📡 Peer ID Display ("Outlaw Code")
- [x] **Display the peer ID** prominently ✅ **IMPLEMENTED**
- [x] Display shows just the value, without "Peer:" label ✅ **IMPLEMENTED**
- [x] **Clickable to copy** - Click peer ID to copy to clipboard ✅ **IMPLEMENTED**
- [x] Visual feedback on copy (e.g., brief color change or message) ✅ **IMPLEMENTED**

### 🔘 Interactive Buttons
- [x] **Join Game** - Connect to existing game session ✅ **IMPLEMENTED** (placeholder)
- [x] **Start Game** - Begin new game session ✅ **IMPLEMENTED** (placeholder)
- [x] **Characters** - Navigate to character manager view ✅ **IMPLEMENTED**
- [x] **Credits** - Display pop up with a nice Western thankyou and license info about assets taken from README.md ✅ **IMPLEMENTED**
  - [x] Credits get their own line so people see 'em ✅ **IMPLEMENTED**
  - [x] Make audio file titles into links with the URL to the project ✅ **IMPLEMENTED**
- [ ] settings button at the lower left of the screen shows settings view (see ui.settings.md)

### 🌍 Adventure Mode Navigation

**Route Selection Logic**: The splash screen delegates to AdventureMode (or WorldListView) to determine the appropriate route when entering adventure mode.

**Behavior**:

When user clicks "Start Game" or similar adventure mode entry point:
1. Query AdventureMode/WorldListView for the appropriate route
2. Navigate to the returned route

**Route Decision**:
- **No active world**: Navigate to `/worlds` (world list view)
- **Active world exists**: Navigate to `/world/:worldId` (return to active world)

**Implementation Pattern**:
```typescript
// Splash screen delegates route decision
const adventureRoute = adventureMode.getDefaultRoute();
router.navigate(adventureRoute);

// AdventureMode decides based on active world state
getDefaultRoute(): string {
  if (this.activeWorld) {
    return `/world/${this.activeWorld.id}`;
  } else {
    return '/worlds';
  }
}
```

**Rationale**:
- Keeps splash screen simple (no world state management)
- Single source of truth for active world state (AdventureMode)
- Consistent behavior across app (world list shows active indicator, splash respects active world)
