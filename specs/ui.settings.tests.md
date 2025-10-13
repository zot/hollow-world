# Settings View Testing Requirements

*Testing specifications for [`ui.settings.md`](ui.settings.md)*

## Routing Tests

### Settings Main View Route: `/settings`
- [ ] **Direct navigation**: Navigate directly to `/settings` URL
  - Verify settings view renders correctly
  - Verify peer ID displays
  - Verify all sections are present
- [ ] **Page refresh**: Refresh browser on `/settings`
  - Verify view remains on settings
  - Verify no asset loading errors (404s)
  - Verify templates load correctly
- [ ] **Navigation from splash**: Click settings button from splash screen
  - Verify URL changes to `/settings`
  - Verify browser back button works

### Log View Route: `/settings/log`
- [ ] **Direct navigation**: Navigate directly to `/settings/log` URL
  - Verify log view renders correctly
  - Verify log table displays
  - Verify filter field present
- [ ] **Page refresh**: Refresh browser on `/settings/log`
  - Verify view remains on log page
  - Verify no asset loading errors
  - Verify log entries still display
- [ ] **Navigation from settings**: Click Log button from settings view
  - Verify URL changes to `/settings/log`
  - Verify browser back button returns to `/settings`

## Log View Functionality Tests

### Log Sorting
- [ ] **Sort by Serial Number column**
  - Click Serial # column header
  - Verify entire rows reorder (serial + date + message together)
  - Verify sort indicator shows ascending (▲)
  - Click again to toggle descending (▼)
  - Verify rows reorder in reverse
- [ ] **Sort by Date column**
  - Click Date column header
  - Verify entire rows reorder by date
  - Verify sort indicator shows ascending (▲)
  - Click again to toggle descending (▼)
- [ ] **Sort by Message column**
  - Click Message column header
  - Verify entire rows reorder alphabetically by message
  - Verify sort indicator toggles
- [ ] **Sorting does not create new log entries**
  - Count log entries before sorting
  - Perform multiple sort operations
  - Verify entry count unchanged (see `test/SettingsView.test.ts`)

### Log Filtering
- [ ] **Filter by text**
  - Enter text in filter field
  - Verify only matching messages display
  - Verify non-matching messages hidden
- [ ] **Filter is case-insensitive**
  - Enter lowercase text
  - Verify matches uppercase and mixed case messages
- [ ] **Filter multiple words**
  - Enter multiple words
  - Verify matches messages containing any of the words
- [ ] **Clear filter**
  - Clear filter field
  - Verify all messages display again

### Log Persistence
- [ ] **Log entries persist across navigation**
  - Add log entries
  - Navigate away from log view
  - Return to log view
  - Verify entries still present
- [ ] **Log entries persist across page refresh**
  - Add log entries
  - Refresh browser
  - Navigate to `/settings/log`
  - Verify entries still present (localStorage)

## Asset Loading Tests
- [ ] **Audio files load from settings view**
  - Navigate to `/settings`
  - Check browser console for audio 404 errors
  - Verify background music continues playing
- [ ] **Audio files load from log view**
  - Navigate to `/settings/log`
  - Check browser console for audio 404 errors
  - Verify background music continues playing
- [ ] **Templates load correctly**
  - Navigate to `/settings` and `/settings/log`
  - Verify no template 404 errors
  - Verify views render with correct HTML structure

## Expandable Friend Cards Tests

### Friend Card Display
- [ ] **Collapsed state displays correctly**
  - Friend card shows friend name (unlabeled)
  - Friend card shows peer ID (unlabeled)
  - Friend card shows first line of notes if notes exist (unlabeled)
  - Kill button (💀) appears on right side
  - Card has western theme styling (bordered, colored background)
- [ ] **Multiple friend cards display**
  - Multiple friends each get their own card
  - Cards are stacked vertically
  - Each card is independent

### Friend Card Expansion
- [ ] **Click collapsed card to expand**
  - Click anywhere on collapsed card (except kill button)
  - Verify collapsed section hides
  - Verify expanded section displays
  - Verify data-expanded attribute changes to "true"
- [ ] **Expanded state displays correctly**
  - "Friend Details" heading appears
  - Collapse button (⬆️) appears in header
  - Player Name field shows with label and editable input
  - Peer ID shows with label and read-only text
  - Private Notes section shows with label and Milkdown editor
  - Remove button appears

### Friend Card Collapse
- [ ] **Click collapse button to collapse**
  - Click collapse button (⬆️) in expanded header
  - Verify expanded section hides
  - Verify collapsed section displays
  - Verify data-expanded attribute changes to "false"
- [ ] **Click header to collapse**
  - Click anywhere on friend card header (not collapse button)
  - Verify expanded section hides
  - Verify collapsed section displays
  - Verify data-expanded attribute changes to "false"
  - Verify button sound plays
- [ ] **Header click area works correctly**
  - Click on "Friend Details" heading - should collapse
  - Click on empty space in header - should collapse
  - Click on collapse button - should collapse (already tested above)
  - All three should have identical behavior

### Friend Data Editing
- [ ] **Edit friend name**
  - Expand friend card
  - Edit name in Player Name input
  - Blur input field
  - Verify friend name updates in FriendsManager
  - Verify change persists in localStorage
  - Collapse and re-expand card
  - Verify new name displays
- [ ] **Edit friend notes**
  - Expand friend card
  - Edit notes in Milkdown editor
  - Verify notes auto-save on change
  - Verify change persists in FriendsManager
  - Collapse and re-expand card
  - Verify new notes display

### Friend Removal
- [ ] **Quick remove with kill button**
  - Click kill button (💀) on collapsed card
  - Verify confirmation dialog appears
  - Accept confirmation
  - Verify friend removed from list
  - Verify friend removed from FriendsManager
  - Verify change persists in localStorage
- [ ] **Remove from expanded state**
  - Expand friend card
  - Click Remove button
  - Verify confirmation dialog appears
  - Accept confirmation
  - Verify friend removed from list
  - Verify friend removed from FriendsManager
- [ ] **Cancel friend removal**
  - Click kill button or Remove button
  - Cancel confirmation dialog
  - Verify friend remains in list

### Friend Card Persistence
- [ ] **Friend card state persists across navigation**
  - Add/edit friends in settings
  - Navigate away from settings
  - Return to settings
  - Verify friends still present with correct data
- [ ] **Friend cards load on page refresh**
  - Add/edit friends
  - Refresh browser on `/settings`
  - Verify friends load with correct data

## Unit Tests
See `test/SettingsView.test.ts` for:
- Log sorting behavior (does not create new entries)
- Log entry count persistence across operations
- LogService read/write operations
