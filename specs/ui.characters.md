# 👤 Character Management Specification

**Character editing system for the Hollow World single-page webapp**

*Based on [`../claude.md`](../claude.md)*

## 🎯 Core Requirements
- Use **SOLID principles** in all implementations
- Create comprehensive **unit tests** for all components

### 🧭 Navigation
- **Browser back button** navigates to previous screen
- **Persistent character list** tracked across sessions

### 📜 Character List Display
- **"Add Character" button** at the bottom
- **UUID-based storage** for each character
- **Character cards** showing:
  - Character name
  - Abbreviated stats underneath
  - **Delete button** on the right (💀 skull and crossbones)

### 🖱️ Interaction
- **Click character item** to edit
  - Navigates to character editor view
  - Passes UUID in URL path

### 🏗️ Editor Initialization
- **From character manager**: Load character from storage using UUID in URL path
- **From browser navigation**: Edit history item live as "current" character
- **Live editing**: Make changes without persistence until "Yep" button clicked

### 🎨 Editor Interface
- **Stylish old-timey labeled fields** for editing character values
- **Character sheet integration** with full Hollow RPG system
- **Western styling** consistent with splash screen theme

### 🔘 Action Buttons

#### 🚫 "Nope" Button (Bottom-left)
- **Revert changes**: Reload character from storage
- **Update fields**: Display original stats in all fields
- **History update**: Overwrite history item with retrieved object

#### ✅ "Yep" Button (Bottom-right)
- **Save workflow**:
  1. Load original character from storage → temporary variable
  2. Save current (edited) character to storage
  3. Replace history object with original from temporary variable
  4. Remove any "future" history items
  5. Add newly saved character to history
  6. Advance internal history for proper back button behavior

### 🧭 Navigation Behavior
- **Browser back button** returns to previous history object
- **History management** ensures proper state restoration
- **Future truncation** when new changes are made
