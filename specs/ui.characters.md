# 👤 Character Management Specification

**Character editing system for the Hollow World single-page webapp**

*Based on [`../claude.md`](../claude.md)*

## 🎯 Core Requirements
- Use **SOLID principles** in all implementations
- Create comprehensive **unit tests** for all components
- use html templates instead of javascript template literals

### 🧭 Navigation
- **Browser back button** navigates to previous screen
- **Persistent character list** tracked across sessions

### 📜 Character List Display
- **"Add Character" button** at the bottom
- **UUID-based storage** for each character
- **Character card list entries** showing:
  - Character name, rank, xp, dc, dust
    - the 4 stats should be bottom aligned in the row
  - physical attrs
  - social attrs
  - mental attrs
  - **Delete button** on the right (💀 skull and crossbones) -- make sure it is on the right side of the list entry

### 🖱️ Interaction
- **Click character item** to edit
  - Navigates to character editor view
  - Passes UUID in URL path

### 🏗️ Editor Initialization
- **From character manager**: Load character from storage using UUID in URL path
- **From browser navigation**: Edit history item live as "current" character
- **Live editing**: Make changes without persistence until "Yep" button clicked

### 🎨 Editor Interface
- **🎭 Stylish old-timey labeled fields** for editing character values
- **📋 Character sheet integration** with full Hollow RPG system
- **🤠 Western styling** consistent with splash screen theme
- **📊 Resource displays** - Show unspent XP and attribute chips for current rank
- **🏷️ Attribute organization** - Arrange attributes in rows by cost order (4, 3, 1):
  - 💪 **Physical** - DEX(4), STR(3), CON(1)
  - 🗣️ **Social** - CHA(4), WIS(3), GRI(1)
  - 🧠 **Mental** - INT(4), PER(4)
- **📈 Top stats bar** - Rank, damage capacity, dust, available XP, and Attribute Chips at top under character name
- **🎯 Available XP display**:
  - Show total XP in parentheses in label based on rank (rank 1 = 10 XP, +10 per additional rank)
  - Value shown is unspent XP remaining (persisted in character)
- **🎲 Available Attribute Chips display**:
  - Show total chips in parentheses in label based on rank (rank 1 = 16 chips, +1 per additional rank)
  - available attribute chips should be total chips - the total attribute costs
    - show negatives as 0 because the excess points are automatically removed from XP anyway
- **⚡ Editable rank input**:
  - Number input field with min/max validation (1-15)
  - On blur: automatically updates total XP and Attribute Chips available, also the totals in parens

### New Characters
- new characters start with points given in game rules (XP and Attribute Chips)

### 🔘 Action Buttons

#### ➕ **Attribute Increment Buttons**
- **🎨 Stylish western-themed** inc/dec buttons on each attribute
- **⬆️ When incrementing** an attribute:
  - **🎲 Priority spending**: Take points from Attribute Chips first, then XP when chips depleted
  - **⚡ Live validation**: Prevent increment if insufficient resources
  - don't allow increment if the attribute cannot be incremented

#### ➖ **Attribute Decrement Logic**
- **📊 Point restoration** = attribute cost (1, 3, or 4 points)
- **📈 Current total** = sum of all attribute costs before decrement
- **📉 Next total** = sum of all attribute costs after decrement
- **🎯 Smart restoration logic**:
  - **If current total > max Attribute Chips for rank**:
    - **💰 Slop-over portion** → restored to XP
    - **🎲 Remaining portion** → restored to Attribute Chips
  - **Otherwise**: All points → restored to Attribute Chip total

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

## ✅ Implementation Checklist

- [x] **🎮 Make character view editable** - Added stylish inc/dec buttons with western styling, implemented XP/chip spending logic
- [x] **🏷️ Arrange attributes by category** - Organized by category (Physical, Social, Mental) in cost order (4,3,1) with clear headers
- [x] **📊 Update core stats position** - Moved rank, damage capacity, and dust to prominent top bar under character name
- [x] **💰 Update resource positions** - Moved available XP and Attribute Chips to top stats bar with totals in parentheses
- [x] **⚡ Implement rank editing behavior** - Added editable rank input with blur event to auto-update XP and chip totals
- [x] **🔄 Update parentheses totals** - Rank changes now dynamically update the total values shown in parentheses for XP and chip labels
- [x] **🎯 Fix rank 1 XP calculation** - Corrected character creation to use proper starting XP (10) and dust (10) from game rules
- [x] **➖ Update attribute decrement behavior** - Implemented improved slop-over logic for smart point restoration between XP and Attribute Chips
- [x] **🧮 Fix attribute cost calculations** - Updated decrement logic to use sum of attribute costs (not values) for accurate point management
- [x] **📏 Validate attribute ranges** - Enforced proper min/max limits (-2 to 15) with visual feedback and disabled button states
- [x] **🔄 Enable negative decrements** - Allow decrementing from zero and negative values (0→-1, -1→-2) to properly restore points to resource pools
- [x] **🎲 Simplify chips calculation** - Available chips now calculated as total chips minus total attribute costs (cleaner, more direct approach)
- [x] **🛡️ Handle negative chip display** - Show 0 for available chips when calculation is negative (excess automatically deducted from XP)
- [x] **🚫 Enhanced increment validation** - Increment buttons disabled when at maximum OR when insufficient resources (chips + XP)
- [x] **🩺 Fix damage capacity formula** - Corrected calculation from 6+CON to proper game rule of 10+CON
- [x] **💾 Implement save/load workflow** - Added proper "Yep" (save to localStorage) and "Nope" (revert from storage) button functionality
- [x] **💀 Verify delete button position** - Confirmed skull emoji (💀) properly positioned on right side of character list entries with responsive mobile support
- [x] **🏷️ Reorganize character list attributes** - Updated character cards to display attributes grouped by category (Physical, Social, Mental) with clear labels
- [x] **📝 Inline character name** - Changed character name from separate header line to inline badge with primary stats for more compact layout
- [x] **📐 Align character card stats** - Set character name to flex-start and rank/xp/dc/dust stats to flex-end for proper visual alignment
- [x] **🧪 Verify unit tests for components** - Ensure comprehensive test coverage for all character management functionality
- [x] **🎨 Polish western styling theme** - Enhanced wood grain textures, cowboy hat decorations, and consistent old-timey aesthetic across all character UI elements
- [x] **📱 Mobile responsiveness** - Added comprehensive responsive design with tablet (768px) and mobile (480px) breakpoints for optimal touch interaction
- [x] **♿ Accessibility compliance** - Implemented ARIA labels, keyboard navigation (arrow keys, home/end), screen reader support, and focus management
- [x] **🔍 Error handling** - Added robust error handling for localStorage failures, character validation, corrupted data recovery, and user-friendly error notifications
- [x] **⚡ Performance optimization** - Implemented render caching, debounced updates, virtual scrolling for large lists, and efficient DOM updates
- [x] **🎯 User experience testing** - Added automated workflow validation, accessibility auditing, performance testing, and UX report generation methods
- [x] **📋 Verify character sheet editor shows complete character info** - Confirmed editor displays all character data: attributes (editable), skills & fields, benefits & drawbacks, equipment & companions, hollow tracker, plus export/import/validate actions
- [x] **📊 Verify character sheet editor has sections for all the various parts of a character** - Confirmed all character sections present: basic info, attributes, skills & fields, benefits & drawbacks, equipment & companions, complete hollow tracker (dust, burned, influence, glimmer debt fields, new moon marks)
- [x] **🏗️ Check new core requirements** - Implemented HTML template system replacing JavaScript template literals: created TemplateEngine utility class, moved all HTML to separate template files in public/templates/, updated CharacterManagerView to use async template rendering with proper error handling and caching
