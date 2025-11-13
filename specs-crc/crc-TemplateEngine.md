# TemplateEngine

**Source Spec:** specs/ui.md, specs/coding-standards.md
**Existing Code:** src/utils/TemplateEngine.ts

## Responsibilities

### Knows
- base: string - Base path for template files (default: '/templates/')
- templateCache: Map<string, string> - Cached template HTML strings

### Does
- loadTemplate(filename): Load template file from server
- renderTemplate(template, data): Replace {{variables}} with data values
- renderTemplateFromFile(filename, data): Load and render in one call
- preloadTemplates(filenames): Preload multiple templates into cache
- clearCache(): Clear all cached templates
- (Supports nested properties: {{user.name}})
- (Supports optional values: {{?optional}})
- (Supports loops: {{#items}} ... {{/items}})
- (Supports conditionals: {{#if condition}} ... {{/if}})

## Collaborators

- **fetch API**: Loads template files from server
- **All UI Views**: CharacterEditorView, CharacterManagerView, SplashScreen, etc. use renderTemplateFromFile()
- **DOM**: Returns HTML strings for insertion into DOM

## Code Review Notes

✅ **Working well:**
- Simple Mustache-like template syntax
- Template caching for performance
- Clean separation: HTML in templates, logic in TypeScript
- Supports nested properties and optional values
- Async loading with error handling

✅ **Matches spec:**
- No HTML strings in TypeScript (per coding-standards.md) ✓
- All HTML in template files (public/templates/) ✓
- Simple variable replacement with {{}} syntax ✓

⚠️ **Potential issues:**
- Regex-based parsing (could be fragile for complex templates)
- No template validation (syntax errors only caught at runtime)
- Limited loop/conditional support (might need expansion)
- Cache never expires (could grow large)

📝 **Design pattern:**
- Singleton pattern: Exported instance `templateEngine`
- Template engine: Mustache-like syntax
- Caching: Memoization pattern for loaded templates
- Async loading: fetch-based with await

📝 **Template syntax:**
```html
<!-- Variable replacement -->
<div>{{characterName}}</div>

<!-- Nested properties -->
<div>{{character.attributes.dex}}</div>

<!-- Optional values (skip if undefined) -->
<div>{{?description}}</div>

<!-- Loops (if supported) -->
{{#items}}
    <li>{{name}}</li>
{{/items}}

<!-- Conditionals (if supported) -->
{{#if hasItems}}
    <ul>...</ul>
{{/if}}
```

## Implementation Notes

**Usage Pattern (per coding-standards.md):**
```typescript
// ❌ DON'T DO THIS (HTML in TypeScript)
const html = `<div>${characterName}</div>`;

// ✅ DO THIS (HTML in template file)
const html = await templateEngine.renderTemplateFromFile(
    'character-card',
    { characterName: char.name }
);
container.innerHTML = html;
```

**Template File Location:**
- All templates in `public/templates/`
- Naming convention: `{component-name}.html`
- Example: `character-editor.html`, `character-card.html`

**Caching Strategy:**
- Templates cached after first load
- Cache key = filename
- clearCache() for development/testing
- preloadTemplates() for critical templates

## Sequences

- seq-load-template.md
- seq-render-template.md
- seq-preload-templates.md

## Type A/B/C Issues

**To be identified during CRC review**

