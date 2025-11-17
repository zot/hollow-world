# UI Principles

## General Principles

### Save Behavior
- **NEVER block saves due to validation errors** - Users must not lose their work
  - Always save data, even if invalid
  - Show validation warnings but allow save to complete
  - Invalid data can be prevented from being used (e.g., entering worlds) but never from being saved
  - Example: CharacterEditorView saves invalid characters and shows validation warning notification
  - Rationale: Preventing saves risks data loss during intermediate work states

### Audio Controls
- **REQUIRED**: Audio control **MUST** be visible on all pages at the bottom-right
  - The audio control must be rendered and visible at all times when AudioManager exists
  - Position: fixed at bottom-right corner (z-index high enough to appear above other content)
  - Must include play/pause toggle and be accessible on every view/route
  - Must display current track information and provide next/previous track controls

### UI Polling
- **UI polling threshold**: Use 250ms for human UI interaction polling (e.g., change detection)
  - This provides responsive feedback without excessive CPU usage
  - Example: CharacterEditorView uses 250ms intervals to detect character changes for enabling save/cancel buttons

### Markdown Editing
- Use Milkdown crepe for markdown editing
  - Use `crepe.on` for events like in the docs about using Crepe
  - Don't put padding around the editor content
  - Support all available crepe features

## P2P User Experience
- **NO DIALOGS for P2P operations** - Never use `alert()` or modal dialogs for P2P status updates
  - Friend requests, peer discovery, connection status should use visual badges and the event system
  - Errors that require user action can use dialogs, but informational updates must not
  - Use the EventService to notify users of P2P events (friend requests, connections, etc.)
  - Use status badges (e.g., "⏳ Pending") in the UI to show current state
  - Keep P2P operations non-intrusive and seamless

## Events
- There is a persisted list of events
- Whenever the event list is not empty
  - There is an event notification button with a bugle on it and a red count of pending events
  - It appears at the screen's upper right
  - Clicking it opens a modal dialog with the event view
    - A list shows cards for the events with skull buttons at the right to remove them
      - Each event is presented according to its type
- **Testing**: EventService is accessible via `window.__HOLLOW_WORLD_TEST__.eventService` in dev/test environments
  - Get events: `eventService.getEvents()`
  - Add/remove events for testing
  - See [Testing section](../CLAUDE.md#test-api-for-singleton-access) for usage examples

## Navigation

### Home Button
- **REQUIRED**: All top-level screens **MUST** have a "🏠" home button at the top-left
  - Button navigates to the splash screen (main menu)
  - Position: Top-left corner of the view
  - Not required on:
    - Splash screen itself (it IS the home)
    - Embedded components (modals, cards, sub-panels)
  - Required on all main views:
    - World List View
    - Character Manager View
    - Character Editor View
    - Friends View
    - Settings View
    - Adventure View

### URL-Based Navigation
- **Single-page app location** represented by browser URL
- **Each view** gets its own URL path

### Browser History Integration
- **History array of objects** for browser back/forward navigation
- **Forward/back buttons** enabled only when history objects are available
- **Self-rendering objects**: Each history object knows what view to display

### Navigation Behavior
- **Going back**: User can navigate backward through history
  - **Forward navigation**: Can advance through existing history
  - **New navigation**: Can navigate to different object
    - **Future deletion**: Removes "future" history objects
    - **New object**: Pushes new object to history array

## Visual Design & Western Frontier Theme

### Color Palette
- **Primary browns**: `#8b4513` (saddle brown), `#deb887` (burlywood), `#f4a460` (sandy brown), `#654321` (dark brown)
- **Gold accent**: `#d4af37` (metallic gold) for titles, labels, and highlights
- **Parchment**: `rgba(255,248,220,0.9)` for content boxes
- **Dark backgrounds**: `#2a1810`, `#3a2418`, `#4a3228` for contrast elements
- **Muted text**: `#a0826d`, `#b8946f`, `#c8a882` for secondary text

### Background Patterns
- **Wood grain texture**: Use repeating linear gradients to simulate wood grain
  ```css
  repeating-linear-gradient(
      90deg,
      transparent 0px,
      rgba(139,69,19,0.1) 1px,
      rgba(139,69,19,0.1) 2px,
      transparent 3px,
      transparent 20px
  )
  ```
- **Radial highlights**: Subtle center highlights with `radial-gradient(circle at center, rgba(255,248,220,0.1) 0%, transparent 50%)`
- **Diagonal stripes**: Use 45-degree gradients for variety

### Decorative Elements
- **Pseudo-element borders**: Use `::before` and `::after` for decorative borders and textures
  - Layer with `z-index: 0` for decorative elements
  - Content above decoratives should have `z-index: 1` or higher
- **Inset shadows**: `inset 0 0 50px rgba(0,0,0,0.3)` for depth
- **Outer shadows**: `0 0 50px rgba(0,0,0,0.5)` for lift effect
- **Border patterns**: Use `border-image` with gradients for decorative borders

### Content Boxes (Parchment Style)
All major content sections should use parchment-style boxes:

```css
.content-section {
    background: rgba(255,248,220,0.9);
    border: 3px solid #8b4513;
    border-radius: 8px;
    padding: 20px;
    margin: 15px auto;
    max-width: 600px;
    width: 100%;
    box-shadow:
        inset 0 0 15px rgba(139,69,19,0.2),
        3px 3px 0px #654321,
        6px 6px 15px rgba(0,0,0,0.4);
    z-index: 10;
    position: relative;
}
```

### Typography
- **Fonts**: Use western-themed fonts from Google Fonts:
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Rye&family=Creepster&family=Sancreek&display=swap');
  ```
- **Monospace**: `'Courier New', monospace` for technical data (peer IDs, code)
- **Text shadows**: Use subtle shadows for depth: `2px 2px 4px rgba(0, 0, 0, 0.7)`

### Buttons
- **Base style**: Dark brown background with gold text
  ```css
  background-color: #6a4f3a;
  color: #d4af37;
  border: 2px solid #8b4513;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  ```
- **Hover effects**:
  - Lighten background: `#8b6a4f`
  - Change border to gold: `#d4af37`
  - Subtle lift: `transform: translateY(-2px)`
  - Shadow: `box-shadow: 0 4px 8px rgba(212, 175, 55, 0.3)`

### Cards and Lists
- **Card backgrounds**: Slightly darker than parchment for nested elements
  - Primary cards: `#4a3228`
  - Nested cards: `#3a2418`
- **Borders**: 1-2px solid borders with brown tones
- **Hover states**: Change border to gold and add subtle glow
  ```css
  border-color: #d4af37;
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
  ```

### Layout
- **Container padding**: Minimum 20px padding on all sides
- **Max-width**: Content sections typically 600px max-width, centered with `margin: auto`
- **Spacing**: 1-2rem gaps between major sections
- **Vertical layout**: Avoid vertical centering for main content; use `flex-direction: column` without `justify-content: center`
- **Z-index layers**:
  - Background decoratives: `z-index: 0`
  - Content: `z-index: 1-9`
  - Parchment boxes: `z-index: 10`
  - Modals: `z-index: 1000`

### Form Inputs
- **Dark inputs**: Match dark theme elements
  ```css
  background-color: #3a2418;
  color: #d4af37;
  border: 1px solid #8b4513;
  padding: 0.5rem;
  border-radius: 4px;
  ```
- **Focus states**:
  ```css
  outline: none;
  border-color: #d4af37;
  box-shadow: 0 0 4px rgba(212, 175, 55, 0.5);
  ```

### Badges and Status Indicators
- **Pending badge**: Orange background with white text
  ```css
  background-color: #ff8c00;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  ```
- **Default/favorite**: Gold star `⭐` or gold text `#ffd700`
- **Icons**: Use emojis for visual interest (💀, 👥, 🗺️, 📜, etc.)

### Modals
- **Overlay**: `rgba(0, 0, 0, 0.7)` semi-transparent black
- **Content**: Dark brown background with gold accents
  ```css
  background-color: #2a1810;
  border: 2px solid #8b4513;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.8);
  ```

### Consistency Requirements
- All views must follow the western frontier theme
- Parchment boxes for main content sections
- Wood grain and decorative borders on container backgrounds
- Gold and brown color palette throughout
- Consistent button styling across all views
- Monospace fonts for technical/system data only
