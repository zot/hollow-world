# Sequence: View Transition (Route-Based Navigation)

**CRC Cards:** crc-Application.md, crc-Router.md
**Spec:** specs/main.md, specs/routes.md

## Overview

This sequence shows how the application transitions between views using the Router.
The Router finds the matching route, calls the handler, and the Application orchestrates
the view lifecycle (destroy old view, render new view, update URL and title).

## Participants

- **User** - Player interacting with the UI
- **Browser** - Web browser
- **Router** - Client-side routing system
- **Application** - Application orchestrator (main.ts)
- **Current View** - Currently displayed view component
- **New View** - View to be displayed
- **TemplateEngine** - HTML template rendering
- **DOM Container** - Main app container element

## Flow

1. User clicks a navigation link
2. Browser calls Router.navigate(path)
3. Router finds the matching route
4. Router calls the route's handler function
5. Application calls destroy() on current view
6. Current view cleans up resources
7. Application calls render(container) on new view
8. New view renders its template via TemplateEngine
9. New view updates the DOM container
10. Application returns to Router
11. Router updates browser URL (pushState)
12. Router updates document.title

## Sequence Diagram

```
     ┌────┐                ┌───────┐               ┌──────┐                 ┌───────────┐          ┌────────────┐           ┌────────┐             ┌──────────────┐           ┌─────────────┐
     │User│                │Browser│               │Router│                 │Application│          │Current View│           │New View│             │TemplateEngine│           │DOM Container│
     └──┬─┘                └───┬───┘               └───┬──┘                 └─────┬─────┘          └──────┬─────┘           └────┬───┘             └───────┬──────┘           └──────┬──────┘
        │Click navigation link │                       │                          │                       │                      │                         │                         │
        │─────────────────────>│                       │                          │                       │                      │                         │                         │
        │                      │                       │                          │                       │                      │                         │                         │
        │                      │    navigate(path)     │                          │                       │                      │                         │                         │
        │                      │──────────────────────>│                          │                       │                      │                         │                         │
        │                      │                       │                          │                       │                      │                         │                         │
        │                      │                       │────┐                     │                       │                      │                         │                         │
        │                      │                       │    │ Find matching route │                       │                      │                         │                         │
        │                      │                       │<───┘                     │                       │                      │                         │                         │
        │                      │                       │                          │                       │                      │                         │                         │
        │                      │                       │   Call route handler     │                       │                      │                         │                         │
        │                      │                       │─────────────────────────>│                       │                      │                         │                         │
        │                      │                       │                          │                       │                      │                         │                         │
        │                      │                       │                          │    Call destroy()     │                      │                         │                         │
        │                      │                       │                          │──────────────────────>│                      │                         │                         │
        │                      │                       │                          │                       │                      │                         │                         │
        │                      │                       │                          │   Cleanup complete    │                      │                         │                         │
        │                      │                       │                          │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                      │                         │                         │
        │                      │                       │                          │                       │                      │                         │                         │
        │                      │                       │                          │           Call render(container)             │                         │                         │
        │                      │                       │                          │─────────────────────────────────────────────>│                         │                         │
        │                      │                       │                          │                       │                      │                         │                         │
        │                      │                       │                          │                       │                      │renderTemplateFromFile() │                         │
        │                      │                       │                          │                       │                      │────────────────────────>│                         │
        │                      │                       │                          │                       │                      │                         │                         │
        │                      │                       │                          │                       │                      │      HTML content       │                         │
        │                      │                       │                          │                       │                      │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                         │
        │                      │                       │                          │                       │                      │                         │                         │
        │                      │                       │                          │                       │                      │                 Update innerHTML                  │
        │                      │                       │                          │                       │                      │──────────────────────────────────────────────────>│
        │                      │                       │                          │                       │                      │                         │                         │
        │                      │                       │                          │               Render complete                │                         │                         │
        │                      │                       │                          │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                         │                         │
        │                      │                       │                          │                       │                      │                         │                         │
        │                      │                       │    Handler complete      │                       │                      │                         │                         │
        │                      │                       │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                       │                      │                         │                         │
        │                      │                       │                          │                       │                      │                         │                         │
        │                      │Update URL (pushState) │                          │                       │                      │                         │                         │
        │                      │<──────────────────────│                          │                       │                      │                         │                         │
        │                      │                       │                          │                       │                      │                         │                         │
        │                      │Update document.title  │                          │                       │                      │                         │                         │
        │                      │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                          │                       │                      │                         │                         │
     ┌──┴─┐                ┌───┴───┐               ┌───┴──┐                 ┌─────┴─────┐          ┌──────┴─────┐           ┌────┴───┐             ┌───────┴──────┐           ┌──────┴──────┐
     │User│                │Browser│               │Router│                 │Application│          │Current View│           │New View│             │TemplateEngine│           │DOM Container│
     └────┘                └───────┘               └──────┘                 └───────────┘          └────────────┘           └────────┘             └──────────────┘           └─────────────┘
```

## Key Points

- **Route matching**: Router finds handler for path
- **View lifecycle**: Old view destroyed before new view rendered
- **Template rendering**: Views use TemplateEngine for HTML
- **URL management**: Router updates browser URL and title via pushState
- **Clean separation**: Router handles navigation, Application handles views
- **Error handling**: Fallback navigation on render errors

## Related Sequences

- seq-app-startup.md (from Phase 3) - Initial application load
- seq-navigate-from-splash.md (from Phase 3) - Navigation from splash screen
