# Character Management Testing Requirements

*Testing specifications for [`ui.characters.md`](ui.characters.md)*

## Routing Tests

### Character Manager Route: `/characters`
- [ ] **Direct navigation**: Navigate directly to `/characters` URL
  - Verify character manager view renders
  - Verify character list displays
  - Verify "Add Character" button visible
- [ ] **Page refresh**: Refresh browser on `/characters`
  - Verify view remains on character manager
  - Verify no asset loading errors (404s)
  - Verify character list persists
- [ ] **Navigation from splash**: Click Characters button from splash
  - Verify URL changes to `/characters`
  - Verify browser back returns to `/`
- [ ] **Back to menu button**
  - Click back button
  - Verify navigates to `/` (splash screen)
  - Verify URL updates

### Character Editor Route: `/character/:id`
- [ ] **Parameterized route with UUID**
  - Navigate to `/character/{valid-uuid}`
  - Verify character editor renders
  - Verify correct character data loads
- [ ] **Page refresh with character ID**
  - Open editor for character
  - Refresh browser on `/character/{uuid}`
  - Verify view remains on editor
  - Verify same character data loads
  - Verify no asset loading errors
- [ ] **Navigation from character manager**
  - Click character in list
  - Verify URL changes to `/character/{uuid}`
  - Verify browser back returns to `/characters`
- [ ] **Invalid character ID**
  - Navigate to `/character/{invalid-uuid}`
  - Verify redirects to `/characters`
  - Verify error logged to console
- [ ] **Non-existent character ID**
  - Navigate to `/character/{valid-but-nonexistent-uuid}`
  - Verify redirects to `/characters`
  - Verify "Character not found" error

## Character Manager Tests

### Character List Display
- [ ] **Character cards render correctly**
  - Name, rank, XP, DC, dust display
  - Physical attributes (DEX, STR, CON)
  - Social attributes (CHA, WIS, GRI)
  - Mental attributes (INT, PER)
- [ ] **Delete button (💀) positioned correctly**
  - Skull appears on right side of each card
  - Responsive on mobile devices
- [ ] **Character list persists**
  - Create characters
  - Navigate away and back
  - Verify list unchanged
- [ ] **Add Character button**
  - Click "Add Character"
  - Verify creates new character
  - Verify navigates to editor with new UUID

### Character Selection
- [ ] **Click character to edit**
  - Click character card
  - Verify navigates to `/character/{uuid}`
  - Verify correct character loads in editor
- [ ] **Delete character**
  - Click delete button (💀)
  - Verify character removed from list
  - Verify localStorage updated

## Character Editor Tests

### Editor Initialization
- [ ] **Load existing character**
  - Open editor with UUID
  - Verify all character data loads
  - Verify attributes display correctly
  - Verify skills, fields, equipment display
- [ ] **New character creation**
  - Create new character
  - Verify starts with default rank 1 values
  - Verify 10 XP, 16 Attribute Chips available
  - Verify 10 dust, 10 DC

### Attribute Editing
- [ ] **Attribute increment**
  - Click increment button
  - Verify attribute increases
  - Verify XP/chips deducted
  - Verify displays update
- [ ] **Attribute decrement**
  - Click decrement button
  - Verify attribute decreases
  - Verify XP/chips restored
  - Verify displays update
- [ ] **Attribute range validation**
  - Try to increment beyond 15
  - Verify button disabled at max
  - Try to decrement below -2
  - Verify button disabled at min
- [ ] **Mouse wheel interaction**
  - Scroll wheel over attribute spinner
  - Verify increment/decrement works
  - Verify range validation applies

### Resource Management
- [ ] **XP calculation**
  - Verify XP display shows unspent XP
  - Verify total XP in parentheses (rank × 10)
  - Verify negative XP shows in red
- [ ] **Attribute Chips calculation**
  - Verify chips display shows available chips
  - Verify total chips in parentheses (16 + rank - 1)
  - Verify negative chips show as 0
- [ ] **Rank editing**
  - Change rank value
  - Verify total XP updates
  - Verify total Attribute Chips updates
  - Verify parentheses values update

### Save/Revert Functionality
- [ ] **"Yep" button (save)**
  - Make changes to character
  - Verify button enabled
  - Click "Yep"
  - Verify character saved to localStorage
  - Verify button disabled after save
- [ ] **"Nope" button (revert)**
  - Make changes to character
  - Verify button enabled
  - Click "Nope"
  - Verify changes reverted
  - Verify original data restored
  - Verify button disabled
- [ ] **Button states**
  - No changes: both buttons disabled
  - Unsaved changes: both buttons enabled
  - After save: both buttons disabled

### Skills and Fields
- [ ] **Field level editing**
  - Change field level
  - Verify level updates
  - Verify mouse wheel works
- [ ] **Skill checkboxes**
  - Check/uncheck skills
  - Verify skill level updates
  - Verify XP cost calculated
- [ ] **Skill prerequisites**
  - Verify prerequisite display
  - Verify prerequisite validation
- [ ] **Field level auto-increment**
  - Check all skills in field
  - Verify field level increments
  - Verify checks cleared

## Asset Loading Tests
- [ ] **Audio from character manager**
  - Navigate to `/characters`
  - Verify background music continues
  - Verify no audio 404 errors
- [ ] **Audio from character editor**
  - Navigate to `/character/{uuid}`
  - Verify background music continues
  - Verify no audio 404 errors
- [ ] **Templates load correctly**
  - Verify character manager templates load
  - Verify character editor templates load
  - Verify no 404 errors for template files

## Browser History Tests
- [ ] **Back button from editor**
  - Open editor
  - Click browser back
  - Verify returns to character manager
  - Verify character list displays
- [ ] **Forward button**
  - Navigate back from editor
  - Click browser forward
  - Verify returns to editor
  - Verify character data intact
- [ ] **History truncation on new navigation**
  - Navigate to editor
  - Go back to manager
  - Select different character
  - Verify future history cleared
  - Verify can't forward to previous character

## Data Persistence Tests
- [ ] **Character persists across refresh**
  - Create/edit character
  - Save character
  - Refresh browser
  - Navigate to character editor
  - Verify character data unchanged
- [ ] **Character version compatibility**
  - Verify character schema versioning works
  - Verify upgrade function handles old formats
  - Verify VERSION file version stored in character
