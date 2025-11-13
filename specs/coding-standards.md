# Coding Standards

**Development guidelines and best practices for HollowWorld**

---

## Core Principles

### SOLID Principles
- **Single Responsibility**: Each class/module has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes must be substitutable for base types
- **Interface Segregation**: Many specific interfaces over one general
- **Dependency Inversion**: Depend on abstractions, not concretions

Apply SOLID principles in all implementations.

---

## TypeScript Standards

### 🔒 Strict Typing Required

**All function parameters, return values, and object properties must use explicit TypeScript types.**

❌ **FORBIDDEN:**
```typescript
function processCharacter(char: any) {  // NO!
    return char.name;
}

const attributes = {};  // NO!
```

✅ **REQUIRED:**
```typescript
function processCharacter(char: ICharacter): string {
    return char.name;
}

const attributes: IAttributes = {
    STR: 2,
    DEX: 3,
    // ...
};
```

**Rules:**
- Never use `any` type except for truly dynamic content
- Interface types like `AttributeType` must be used when indexing typed objects like `IAttributes`
- All function parameters must have explicit types
- All function return values must have explicit types
- All object properties must have explicit types
- Use `unknown` instead of `any` when type is truly unknown (then narrow with type guards)

*Type your code tighter than a hangman's noose*

---

## HTML & Templates

### 🚫 NO HTML Strings in TypeScript/JavaScript

**CRITICAL**: Never use template literals or string concatenation for HTML in `.ts` or `.js` files.

**All HTML must be in template files under `public/templates/`**

❌ **FORBIDDEN:**
```typescript
// Direct HTML strings
const html = `<div class="foo">${bar}</div>`;
element.innerHTML = '<span>text</span>';

// Functions returning HTML strings
function createCard(name: string): string {
    return `<div class="card"><h2>${name}</h2></div>`;
}

// String concatenation for HTML
let html = '<ul>';
items.forEach(item => html += `<li>${item}</li>`);
html += '</ul>';
```

✅ **REQUIRED:**
```typescript
// Use TemplateEngine for all HTML
const html = await templateEngine.renderTemplateFromFile('foo', { bar });

// For functions that need to return HTML, return template results
async function createCard(name: string): Promise<string> {
    return await templateEngine.renderTemplateFromFile('card', { name });
}

// Use templates with loops
const itemsHtml = items.map(item =>
    templateEngine.renderTemplateFromFile('list-item', { item })
);
const html = await templateEngine.renderTemplateFromFile('list', {
    itemsHtml: (await Promise.all(itemsHtml)).join('')
});
```

**Exceptions (RARE):**
- Single-tag empty elements: `document.createElement('div')`
- Test files that verify HTML output
- Fallback error messages (keep minimal, single line max)

**Enforcement:** All HTML belongs in `public/templates/`

*Separate your concerns like a good sheriff*

---

## Data Integrity

### Hash-Based Change Detection

Use cryptographic hashes (SHA-256) to detect changes instead of storing object copies.

**Why:**
- Avoids shallow copy issues with nested objects (spread operator only copies references)
- More efficient than deep object comparison
- Provides integrity verification
- Consistent approach across the application

**Where to use:**
- UI change detection (e.g., CharacterEditorView detecting unsaved changes)
- Storage integrity verification
- P2P data synchronization

**Example:**
```typescript
// ❌ WRONG: Shallow copy doesn't capture nested changes
class CharacterEditorView {
    private originalCharacter: ICharacter;

    loadCharacter(char: ICharacter) {
        this.originalCharacter = { ...char };  // Shallow copy!
        this.character = char;
    }

    hasChanges(): boolean {
        // This won't detect nested changes!
        return JSON.stringify(this.character) !== JSON.stringify(this.originalCharacter);
    }
}

// ✅ CORRECT: Hash-based detection
class CharacterEditorView {
    private originalCharacterHash: string;

    async loadCharacter(char: ICharacter) {
        this.originalCharacterHash = await hashCharacter(char);
        this.character = char;
    }

    async hasChanges(): boolean {
        const currentHash = await hashCharacter(this.character);
        return currentHash !== this.originalCharacterHash;
    }
}
```

**Utilities:**
- See: `src/utils/characterHash.ts` for hash calculation utilities

---

## TextCraft Integration

### Thing Storage Guidelines

**Property Persistence**: Only Thing properties starting with `_` (data) or `!` (functions) are persisted to storage

**Accessor Pattern**: Use getter/setter accessors for clean API while storing with underscore prefix

**Example:**
```typescript
class Thing {
    // Storage property (persisted)
    _character?: string;

    // Accessor (public API)
    get character(): string | undefined {
        return this._character;
    }

    set character(value: string | undefined) {
        this._character = value;
    }
}

// Usage
thing.character = "char-123";  // Sets _character
const id = thing.character;     // Gets _character
```

**Pattern follows:**
- `thing.name` (accessor) → `thing._name` (storage)
- `thing.description` (accessor) → `thing._description` (storage)
- `thing.character` (accessor) → `thing._character` (storage)

**Adding New Properties:**
1. Add storage property with `_` prefix (e.g., `_character?: string`)
2. Add getter/setter accessor without prefix (e.g., `get character()` / `set character()`)
3. Use the accessor in all code for clean, consistent API

---

## Testing

### Comprehensive Unit Tests

Create comprehensive unit tests for all components:
- **Coverage**: Aim for high test coverage (>80%)
- **Isolation**: Mock dependencies for unit tests
- **Integration**: Use Playwright for E2E tests
- **Organization**: Follow structure in [`testing.md`](testing.md)

**Test file naming:**
- Unit tests: `*.test.ts` (next to source file)
- Integration tests: `test/*.spec.ts`
- Spec documentation: `specs/*.tests.md`

---

## Visual Consistency

### Western Frontier Theme

Follow specifications for consistent western frontier theme:
- See [`ui.md`](ui.md) for UI principles
- See [`ui.*.md`](ui.splash.md) for specific view styling
- Typography, colors, and styling must match theme
- Audio feedback with western ambiance

---

## Code Organization

### File Structure
- **Concepts**: Independent, zero-dependency services
- **Views**: UI presentation layer (thin, no business logic)
- **Utilities**: Shared functions (hashing, validation, etc.)
- **Types**: TypeScript interfaces and type definitions

### Naming Conventions
- **Classes**: PascalCase (e.g., `CharacterEditorView`)
- **Interfaces**: PascalCase with `I` prefix (e.g., `ICharacter`)
- **Functions**: camelCase (e.g., `loadCharacter`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_CHARACTERS`)
- **Files**: kebab-case (e.g., `character-editor-view.ts`)

---

## Documentation

### Code Comments
- Use TSDoc format for function/class documentation
- Explain **why**, not **what** (code should be self-documenting)
- Document non-obvious behavior
- Keep comments up-to-date with code changes

### Specification Files
- All features must have spec documentation in `specs/`
- Update specs when changing behavior
- Use specs to communicate intent
- See [`main.md`](main.md) for spec organization

---

## Version Control

### Commit Messages
- Use conventional commit format: `type(scope): message`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Keep first line under 72 characters
- Provide context in commit body when needed

### Pull Requests
- Reference related spec files
- Include test results
- Update documentation
- Follow review feedback

---

## Performance

### Guidelines
- Minimize DOM manipulation (batch updates)
- Use efficient data structures
- Avoid unnecessary re-renders
- Profile before optimizing
- Cache expensive computations

### Storage
- Validate data before writing
- Handle storage failures gracefully
- Use appropriate storage type (LocalStorage vs IndexedDB)
- See [`storage.md`](storage.md) for details

---

## Security

### Input Validation
- Validate all user input
- Sanitize data before display
- Use parameterized queries (TextCraft commands)
- Avoid XSS vulnerabilities

### P2P Security
- Validate peer messages
- Implement rate limiting
- Handle malicious peers gracefully
- See [`p2p.md`](p2p.md) for P2P security

---

## References

- **Main Spec**: [`main.md`](main.md)
- **UI Guidelines**: [`ui.md`](ui.md)
- **Storage**: [`storage.md`](storage.md)
- **Testing**: [`testing.md`](testing.md)
- **P2P**: [`p2p.md`](p2p.md)
- **CRC Modeling**: [`../specs-crc/README.md`](../specs-crc/README.md)
