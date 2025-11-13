# 🤠 Character Management Specification
## *"Don't Go Hollow, Partner"*

**🏜️ Frontier Character Wrangling System for the Hollow World Webapp 🏜️**

*Saddle up your characters for the wild frontier adventure*

---

🌵 *Based on [`../CLAUDE.md`](../CLAUDE.md)* 🌵

🧪 **Testing**: See [`ui.characters.tests.md`](ui.characters.tests.md) for test requirements

---

## 🎯 Core Requirements *(Code Harder Than a Two-Dollar Steak)*
- Use **SOLID principles** in all implementations *(Keep it cleaner than a Sunday church service)*
- Create comprehensive **unit tests** for all components *(Test everything twice, trust nothing once)*
- Use **HTML templates** instead of JavaScript template literals *(Separate your concerns like a good sheriff)*
- **🔒 Strict TypeScript typing** - All function parameters, return values, and object properties must use explicit TypeScript types. Never use `any` type except for truly dynamic content. Interface types like `AttributeType` must be used when indexing typed objects like `IAttributes` *(Type your code tighter than a hangman's noose)*
- compute available XP and Attribute Chips dynamically according to "Character structure" below

### Character structure
**See [`storage.md`](storage.md#-character-storage-localstorage) for complete character storage specifications**

- Total XP and total Attribute Chips are based on rank
- Available Attribute Chips is computed dynamically
  - rank's attribute chip total - current attribute cost total
    - this amount is allowed to go higher than the rank's attribute chip total
    - make sure there's a test for Dex -2 and all other attrs at 0
      - the attribute chip total should be 8 higher than the rank's attribute chip total
  - doesn't drop below 0 because extra attribute points come from XP
- Available XP is computed dynamically from fields and total attribute costs that exceed total attribute chips
  - Fields cost their level * the cost of each entry + 1 if it has a check
- A version field that stores the current app version (from the VERSION file)

**Character version compatibility**: See [`storage.md`](storage.md#character-version-compatibility) for details on schema versioning and upgrade system

### 🧭 Navigation *(Trail Blazing Through the UI)*
- **Browser back button** navigates to previous screen *(Like ridin' back to where you came from)*
- **Persistent character list** tracked across sessions *(Your posse remembers you)*

### 📜 Character List Display *(The Saloon Roll Call)*
- **"Add Character" button** at the bottom *(Recruit new gunhands for your outfit)*
- **UUID-based storage** for each character *(Every outlaw needs a proper wanted poster)*
- **Character card list entries** showing *(Like a deck of playing cards, but deadlier)*:
  - Character name, rank, xp, dc, dust *(The vital statistics)*
    - *The 4 stats should be bottom aligned in the row like bullets in a chamber*
    - Physical attrs *(How tough they are)*
    - Social attrs *(How smooth they talk)*
    - Mental attrs *(How sharp they think)*
  - **Delete button** on the right (💀 skull and crossbones) *(Send 'em to Boot Hill)*

### 🖱️ Interaction *(How to Wrangle Your Characters)*
- **Click character item** to edit *(Pick your fighter)*
  - Navigates to character editor view *(Head to the character creation station)*
  - Passes UUID in URL path *(Proper paperwork for the sheriff)*

### 🏗️ Editor Initialization *(Setting Up Camp)*
**See [`storage.md`](storage.md#loading-characters) for complete character loading specifications**

- **From character manager**: Load character from storage using UUID in URL path *(Find your outlaw in the filing cabinet)*
- **From browser navigation**: Edit history item live as "current" character *(Pick up where you left off)*
- **Live editing**: Make changes without persistence until "Yep" button clicked *(Sketch in the dirt before carving in stone)*

### 🎨 Editor Interface *(The Character Creation Saloon)*
- **🎭 Stylish old-timey labeled fields** for editing character values *(Fancy as a gambling hall)*
- **📋 Character sheet integration** with full Hollow RPG system *(All the rules, none of the confusion)*
- **🤠 Western styling** consistent with splash screen theme *(Prettier than a painted lady)*
- **📊 Resource displays** - Show unspent XP and attribute chips for current rank *(Keep track of your gold and gunpowder)*
- **🏷️ Attribute organization** - Arrange attributes in rows by cost order (4, 3, 1) *(Most expensive to cheapest, like whiskey pricing)*:
  - 💪: DEX(4), STR(3), CON(1) *(How fast, strong, and tough you are)*
  - 🗣️: CHA(4), WIS(3), GRI(1) *(How charming, wise, and gritty you are)*
  - 🧠: INT(4), PER(4) *(How smart and sharp-eyed you are)*
  - group them in rows according to the lists below
    - [emoji] [attr] [attr] [attr (if there is a third one)]
    - put each attribute into a box with its value and spinner, all on one line
      - see "Attribute Spinner Button" for more layout information
    - *A little space between the attr and the open paren* *(Give 'em breathing room)*
    - *Use a thin space character between the close paren and the attribute value* *(Don't crowd the numbers)*
    - a 1145px wide character sheet editor should show 3 attributes across in the Attributes section
      - 5px column gap between attributes
      - 5px left/right padding on the attributes container
- **🎨 Attribute value spacing** - Add visual spacing before each attribute input value for better readability *(Make it easy on the eyes)*
- **🖱️ Mouse wheel interaction** - Attribute input spinners respond to mouse wheel for increment/decrement with range validation (-2 to 15) *(Scroll like you're spinning the cylinder of a six-shooter)*
- **📝 Character description** - Optional descriptive text/backstory displayed as a paragraph below the character name *(Tell their tale)*
- **📈 Top stats bar** - Rank, damage capacity, dust, available XP, and Attribute Chips at top under character name *(The important stuff front and center)*
- **🎯 Available XP display** *(Your advancement currency)*:
  - Show total XP in parentheses in label based on rank (rank 1 = 10 XP, +10 per additional rank) *(Show the pot size)*
  - Value shown is unspent XP remaining *(What you got left to spend)*
- **🎲 Available Attribute Chips display** *(Your character creation tokens)*:
  - Show total chips in parentheses in label based on rank (rank 1 = 16 chips, +1 per additional rank) *(Show your stake)*
  - Available attribute chips should be total chips - the total attribute costs *(What's left after you ante up)*
    - Show negatives as 0 because the excess points are automatically removed from XP anyway *(Don't go into debt, partner)*
    - This should update whenever attributes change *(Live as a poker game)*
  - make sure that XP shows in red whenever available XP is negative
- available xp and attribute chips should have their proper appearance when first showing the editor
- **⚡ Editable rank input** *(Promote your gunslinger)*:
  - Number input field with min/max validation (1-15) *(From greenhorn to legend)*
  - On blur: automatically updates total XP and Attribute Chips available, also the totals in parens *(Recalculate the pot)*

### Skills and Fields
- each field tracks its level (as a variable) and its skills
- a skill can be listed once or twice in a field
- the UI shows
  - each field with its level
    - the field level is editable like the attribute values
      - editable as text
      - changable by rolling the mouse
      - stacked spin buttons after the value
    - the field's skills in a list underneath with optional checks (a check adds one to the skills level and adds the skill's cost in XP)
      - clicking on a skill checks / unchecks it
      - skills list their multipliers (if > 1) and prereqs in parens after the skill name
      - if all the skills are checked, increment the field level and clear the checks
      - a skill with unmet prerequisites can only get a check if the character already has the prerequisite at the next level for the skill
  - any skills that are not in fields
    - if any of these skills has level > 1, the level shows in red because this is an error
- standard skills from the game (listed in Hollow-summary.md) should be in a constant object
  - key is the name
  - value is the skill representation
- the UI shows each field and its level
  - skills are preceded by a skill type indicator
    - 🞐 for standard skills
    - 🞸 for created skills
  - each skill lists its computed level as the sum of
    - the level of each field it occurs in (twice if it occurs twice)
    - each checkbox for each of its entries in the fields
  - rolling the mouse wheel over a field should increment and decrement it

### 🌟 New Characters *(Fresh Meat for the Frontier)*
- New characters start with points given in game rules (XP and Attribute Chips) *(Everyone gets a fair shake)*

### 🔘 Action Buttons *(The Business End of Character Creation)*

#### ➕ **Attribute Spinner Button** *(Fine-Tuning Your Gunslinger)*
- **🎨 Stylish western-themed** spinner buttons on each attribute *(Classier than a silver-plated Colt)*
  - Stacked arrows, like normal spinner buttons but still western themed *(Up and down like a bucking bronco)*
  - No space between the value and the spinner buttons *(Tight as a new saddle)*
- **⬆️ When incrementing** an attribute *(Making your outlaw meaner)*:
  - **🎲 Priority spending**: Take points from Attribute Chips first, then XP when chips depleted *(Spend your coins before your gold)*
  - **⚡ Live validation**: Prevent increment if insufficient resources *(Can't buy what you can't afford)*
  - Don't allow increment unless both of these apply *(Even legends have limits)*:
    - **📏 The new value is in range** *(Stay between the fences)*
    - **💰 There's enough XP and Attribute Chips to pay for the new value** *(Don't write checks your wallet can't cash)*
  - **📊 Update displayed available XP and available Attribute Chips** *(Keep the books current)*

#### ➖ **Attribute Decrement Logic** *(Getting Your Money Back)*
- **📊 Point restoration** = attribute cost (1, 3, or 4 points) *(Get back what you paid)*
- **📈 Current total** = sum of all attribute costs before decrement *(Count your chips before cashing out)*
- **📉 Next total** = sum of all attribute costs after decrement *(What you'll have left)*
- **🚫 Range protection**: Don't allow decrement if attribute would be out of range *(Don't ride off a cliff)*
- **📊 Update displays**: Update available XP and Attribute Chips after a decrement *(Balance the books)*

#### 🚫 **"Nope" Button** *(The Chicken-Out Option)*
**See [`storage.md`](storage.md#nope-button-revert) for complete revert specifications**

- **Revert changes**: Reload character from storage *(Put everything back the way it was)*
- **Update fields**: Display original stats in all fields *(Wipe the slate clean)*
- **History update**: Overwrite history item with retrieved object *(Fix the paperwork)*
- Enable only if there are changes to revert *(No point in backing down if you ain't moved forward)*
- test cases for these things

#### ✅ **"Yep" Button** *(Seal the Deal)*
**See [`storage.md`](storage.md#yep-button-save) for complete save workflow specifications**

- Enable only if there are changes that have not been saved *(Only when you got something worth keeping)*
- **Save workflow** *(The proper way to file your paperwork)*:
  1. Load original character from storage → temporary variable *(Keep a backup copy)*
  2. Save current (edited) character to storage *(Write it in permanent ink)*
  3. Replace history object with original from temporary variable *(Clean up the records)*
  4. Remove any "future" history items *(No fortune telling allowed)*
  5. Add newly saved character to history *(Add it to the ledger)*
  6. Advance internal history for proper back button behavior *(Keep the timeline straight)*
- test cases for these things

### 🧭 Navigation Behavior *(Finding Your Way Around the Frontier)*
- **Browser back button** returns to previous history object *(Backtrack your steps)*
- **History management** ensures proper state restoration *(Remember where you've been)*
- **Future truncation** when new changes are made *(Can't change the past, but you can change the future)*

## ✅ Implementation Checklist *(Trail Markers on the Road to Glory)*
### *"Every feature implemented, every bug shot down, every test passed with flying colors"*

---

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
