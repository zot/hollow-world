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

## Unit Tests
See `test/SettingsView.test.ts` for:
- Log sorting behavior (does not create new entries)
- Log entry count persistence across operations
- LogService read/write operations
