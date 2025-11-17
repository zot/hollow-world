# Test Design: SplashScreen

**Component:** SplashScreen (Splash View)
**CRC Reference:** crc-SplashScreen.md
**UI Spec Reference:** ui-splash-view.md
**Spec Reference:** specs/ui.splash.md
**Implementation Test:** No dedicated test file yet (needs creation)

## Component Overview

SplashScreen is the main menu/landing page with navigation to all major features. Displays title, logo, and menu buttons with western frontier theme.

## Test Categories

### Unit Tests

#### Rendering Tests

**Test Case: Render Splash Screen**
- Purpose: Verify splash screen renders correctly
- Setup: None
- Input: Initialize view
- Expected: Title, logo, and menu buttons visible
- Related CRC: crc-SplashScreen.md (render)
- Related UI Spec: ui-splash-view.md (Structure)

**Test Case: Render Title and Logo**
- Purpose: Verify branding elements present
- Setup: None
- Input: Render view
- Expected: "Hollow World" title and logo visible
- Related CRC: crc-SplashScreen.md
- Related UI Spec: ui-splash-view.md (Header)

**Test Case: Render Menu Buttons**
- Purpose: Verify all navigation buttons present
- Setup: None
- Input: Render view
- Expected: Buttons for Characters, Friends, Worlds, Settings visible
- Related CRC: crc-SplashScreen.md (renderMenuButtons)
- Related UI Spec: ui-splash-view.md (Menu Buttons)

**Test Case: Render Audio Controls**
- Purpose: Verify audio controls visible
- Setup: None
- Input: Render view
- Expected: Audio controls present (per UI spec)
- Related CRC: crc-SplashScreen.md (audioManager)
- Related Spec: specs/ui.md (Audio on all views)

**Test Case: Render Version Information**
- Purpose: Verify version displayed
- Setup: None
- Input: Render view
- Expected: App version visible in footer
- Related CRC: crc-SplashScreen.md
- Related UI Spec: ui-splash-view.md (Footer)

#### Navigation Tests

**Test Case: Navigate to Characters**
- Purpose: Verify Characters button navigation
- Setup: Splash screen rendered
- Input: Click Characters button
- Expected: Navigate to /characters route
- Related CRC: crc-SplashScreen.md (navigateToCharacters)
- Related Sequence: seq-navigate-from-splash.md

**Test Case: Navigate to Friends**
- Purpose: Verify Friends button navigation
- Setup: Splash screen rendered
- Input: Click Friends button
- Expected: Navigate to /friends route
- Related CRC: crc-SplashScreen.md (navigateToFriends)

**Test Case: Navigate to Worlds**
- Purpose: Verify Worlds button navigation
- Setup: Splash screen rendered
- Input: Click Worlds button
- Expected: Navigate to /worlds route
- Related CRC: crc-SplashScreen.md (navigateToWorlds)

**Test Case: Navigate to Settings**
- Purpose: Verify Settings button navigation
- Setup: Splash screen rendered
- Input: Click Settings button
- Expected: Navigate to /settings route
- Related CRC: crc-SplashScreen.md (navigateToSettings)

#### Event Listener Tests

**Test Case: Setup Button Listeners**
- Purpose: Verify event listeners attached
- Setup: None
- Input: Initialize view
- Expected: All button click handlers registered
- Related CRC: crc-SplashScreen.md (setupEventListeners)

**Test Case: Remove Listeners on Destroy**
- Purpose: Verify cleanup on view destroy
- Setup: View initialized
- Input: Call destroy()
- Expected: Event listeners removed
- Related CRC: crc-SplashScreen.md (destroy)

#### Audio Management Tests

**Test Case: Start Background Music**
- Purpose: Verify music starts on splash screen
- Setup: None
- Input: Initialize view
- Expected: Background music playing
- Related CRC: crc-SplashScreen.md (audioManager)
- Related Spec: specs/audio.md (Background music)

**Test Case: Audio Controls Accessible**
- Purpose: Verify user can control audio
- Setup: Splash screen with audio
- Input: Click audio control buttons
- Expected: Music stops/starts, volume adjusts
- Related CRC: crc-SplashScreen.md (audioManager)

### Integration Tests

**Test Case: Router Integration**
- Purpose: Verify routing from splash to views
- Setup: None
- Input: Click each menu button
- Expected: Correct route activated
- Related CRC: crc-SplashScreen.md, crc-Router.md

**Test Case: AudioManager Integration**
- Purpose: Verify audio system initialization
- Setup: None
- Input: Load splash screen
- Expected: AudioManager initialized, music playing
- Related CRC: crc-SplashScreen.md, crc-AudioManager.md

**Test Case: TemplateEngine Integration**
- Purpose: Verify template rendering
- Setup: None
- Input: Render splash screen
- Expected: Template loaded and rendered
- Related CRC: crc-SplashScreen.md, crc-TemplateEngine.md

### E2E Tests

**Test Case: App Startup to Splash**
- Purpose: Verify splash screen is first view
- Setup: Fresh app load
- Input: Navigate to base URL
- Expected: Splash screen displayed
- Test Type: Playwright E2E
- Related Sequence: seq-app-startup.md

**Test Case: Navigation from Splash**
- Purpose: Verify complete navigation workflow
- Setup: Splash screen loaded
- Input: Click Characters, verify view, click back, verify splash
- Expected: Navigation works, back returns to splash
- Test Type: Playwright E2E

**Test Case: Audio on Splash**
- Purpose: Verify audio plays on load
- Setup: None
- Input: Load app
- Expected: Background music playing (check audio context)
- Test Type: Playwright E2E

### Edge Cases

**Test Case: Template Load Failure**
- Purpose: Verify fallback when template fails
- Setup: Mock template error
- Input: Render view
- Expected: Fallback UI shown, app doesn't crash
- Related CRC: crc-SplashScreen.md (renderFallback)

**Test Case: Audio Init Failure**
- Purpose: Verify handling when audio unavailable
- Setup: Mock audio context error
- Input: Initialize view
- Expected: View renders, error logged, continues without audio
- Related CRC: crc-SplashScreen.md

**Test Case: Rapid Navigation Clicks**
- Purpose: Verify handling of rapid button clicks
- Setup: Splash screen
- Input: Click multiple buttons rapidly
- Expected: Only last navigation executes, no errors
- Related CRC: crc-SplashScreen.md

**Test Case: Browser Back from Other View**
- Purpose: Verify returning to splash via browser back
- Setup: Navigate to Characters view
- Input: Click browser back button
- Expected: Splash screen re-rendered
- Related CRC: crc-SplashScreen.md
- Related Spec: specs/main.md (Browser history)

**Test Case: Resize Window**
- Purpose: Verify responsive layout
- Setup: Splash screen rendered
- Input: Resize browser window (mobile, tablet, desktop)
- Expected: Layout adapts, buttons remain accessible
- Related CRC: crc-SplashScreen.md
- Related UI Spec: ui-splash-view.md (Responsive)

**Test Case: Missing Logo Asset**
- Purpose: Verify handling of missing image
- Setup: Mock logo image 404
- Input: Render view
- Expected: Placeholder shown or text-only title
- Related CRC: crc-SplashScreen.md

**Test Case: Accessibility - Keyboard Navigation**
- Purpose: Verify keyboard-only navigation
- Setup: Splash screen
- Input: Tab through buttons, press Enter
- Expected: Can navigate and activate all buttons via keyboard
- Related CRC: crc-SplashScreen.md
- Related Spec: specs/ui.md (Accessibility)

**Test Case: Screen Reader Support**
- Purpose: Verify ARIA labels and semantic HTML
- Setup: Splash screen
- Input: Run accessibility audit
- Expected: Proper ARIA labels, button roles, alt text
- Related CRC: crc-SplashScreen.md

## Coverage Goals

- Test splash screen rendering (title, logo, buttons)
- Test navigation to all major views
- Test event listeners (setup and cleanup)
- Test audio initialization and controls
- Test integration with Router, AudioManager, TemplateEngine
- Test edge cases (template failures, audio errors, rapid clicks)
- Test accessibility (keyboard nav, screen readers)
- Test responsive layout
- E2E tests for app startup and navigation

## Notes

- SplashScreen is the entry point and main menu
- Must display audio controls (per UI spec)
- Browser back button should work from other views back to splash
- Western frontier theme (parchment, wood, old west typography)
- Responsive layout for mobile, tablet, desktop
- Keyboard and screen reader accessible
- Background music should start automatically (with user gesture if required)
- Simple view with clear navigation intent
- No complex state management (just navigation)
