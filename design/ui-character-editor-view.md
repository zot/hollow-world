# CharacterEditorView

**Source**: `ui.characters.md` → Editor Interface section

**Route**: `/character/:id` (see `manifest-ui.md`)

**Purpose**: Full character sheet editor with all character data

---

## Structure

**Overall Layout**:
```
┌──────────────────────────────────────────────────────────┐
│ [🏠] [Bob Smith_______________________________]          │ ← Home + Name (editable)
├──────────────────────────────────────────────────────────┤
│ Rank: [3] DC: 15  Dust: 100                              │ ← Top stats
│ Available XP (30): 5   Attribute Chips (18): 2           │
├──────────────────────────────────────────────────────────┤
│ 💪  DEX(4) [▼4▲]  STR(3) [▼5▲]  CON(1) [▼4▲]           │ ← Attributes
│ 🗣️  CHA(4) [▼3▲]  WIS(3) [▼4▲]  GRI(1) [▼5▲]           │
│ 🧠  INT(4) [▼3▲]  PER(4) [▼4▲]                          │
├──────────────────────────────────────────────────────────┤
│ Skills & Fields                                          │ ← Skills section
│ • Gunslinging (2)  [X]                                   │
│ • Medicine (1)     [X]                                   │
│ [Add Skill ▼] [Add Field ▼]                              │
├──────────────────────────────────────────────────────────┤
│ Benefits & Drawbacks                                     │
│ ✓ Quick Draw  ✗ Bad Knee                                 │
├──────────────────────────────────────────────────────────┤
│ Equipment & Companions                                   │
├──────────────────────────────────────────────────────────┤
│ Hollow Tracker  ◯◯◯◯◯◯◯◯◯◯                              │
├──────────────────────────────────────────────────────────┤
│ [Yep] [Nope] [Freeze]  [Export] [Import] [Validate]     │ ← Actions
└──────────────────────────────────────────────────────────┘
```

**Main sections** (vertical layout):
1. Character name (inline editable)
2. Top stats bar (rank, DC, dust, available XP, available chips)
3. Attributes section (organized by category)
4. Skills & Fields section
5. Benefits & Drawbacks section
6. Equipment & Companions section
7. Hollow Tracker section
8. Action buttons (Yep/Nope/Freeze)
9. Export/Import/Validate actions

---

## Character Name

**Structure**:
```html
<div class="character-name-section">
  <button class="home-btn">🏠</button>
  <input type="text" class="character-name-input"
         data-field="name"
         value="{{character.name}}"
         data-action="updateField">
</div>
```

**Behavior**:
- Home button navigates to splash screen
- Inline editable text field
- Updates on blur (not real-time)
- Auto-save disabled (requires "Yep" button)

**Events**:
- `clickHome()` - Navigate to splash screen
- `updateField(field: 'name', value)` - Update character name

**CSS Classes**:
- `character-name-section` - Container
- `home-btn` - Home button (top-left)
- `character-name-input` - Text input (large, bold, western-themed)

---

## Character Description

**Structure**:
```html
<p class="character-description">{{character.description}}</p>
```

**Behavior**:
- Read-only display field
- Shows character's descriptive text/backstory
- Displayed as paragraph below character name
- Optional field (may be empty)

**CSS Classes**:
- `character-description` - Paragraph styling for description text

---

## Top Stats Bar

**Purpose**: Display primary stats and available resources

**Layout**:
```
┌──────────────────────────────────────────────────────────┐
│ Rank: [3] DC: 15  Dust: 100                              │
│ Available XP (30): 5   Attribute Chips (18): 2           │
└──────────────────────────────────────────────────────────┘
```

**Structure**:
```html
<div class="character-stats">
  <span class="rank-stat">Rank: <input type="number" min="1" max="15"
         value="{{rank}}"
         data-field="rank"
         data-action="updateRank"></span>
  <span class="damage-capacity">Damage Capacity: {{damageCapacity}}</span>
  <span class="dust">Dust: {{dust}}</span>
</div>

  <div class="stat-group" data-negative="{{availableXP < 0}}">
    <label>Available XP ({{totalXP}})</label>
    <span class="xp-value">{{availableXP}}</span>
  </div>

  <div class="stat-group">
    <label>Attribute Chips ({{totalChips}})</label>
    <span>{{availableChips}}</span>
  </div>
</div>
```

**Computed Values**:
- `damageCapacity` = 10 + CON
- `totalXP` = rank * 10 (rank 1 = 10 XP, +10 per rank)
- `totalChips` = 16 + (rank - 1) (rank 1 = 16 chips, +1 per rank)
- `availableXP` = totalXP - (spent XP from fields and excess attributes)
- `availableChips` = max(0, totalChips - total attribute costs)

**States**:
- `data-negative="true"` - When availableXP < 0 (red text)

**Events**:
- `updateRank(value)` - Updates rank, recalculates XP and chips

**CSS Classes**:
- `top-stats-bar` - Horizontal stats container
- `stat-group` - Editable stat (rank, available XP/chips)
- `stat-display` - Read-only stat (DC, dust)
- `xp-value` - XP value (red when negative)

---

## Attributes Section

**Purpose**: Edit character attributes with spinners

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ 💪  DEX(4): [ 4 ] ▲   STR(3): [ 5 ] ▲   CON(1): [ 4 ] ▲ │
│                   ▼                 ▼                 ▼ │
│                                                         │
│ 🗣️  CHA(4): [ 3 ] ▲   WIS(3): [ 4 ] ▲   GRI(1): [ 5 ] ▲ │
│                   ▼                 ▼                 ▼ │
│                                                         │
│ 🧠  INT(4): [ 3 ] ▲   PER(4): [ 4 ] ▲                   │
│                   ▼                 ▼                   │
└─────────────────────────────────────────────────────────┘
```

**Structure**: Organized by category in cost order (4, 3, 1)

**Categories**:
- 💪 Physical: DEX(4), STR(3), CON(1)
- 🗣️ Social: CHA(4), WIS(3), GRI(1)
- 🧠 Mental: INT(4), PER(4)

**Attribute Box Structure**:
```html
<div class="attributes-section">
  <!-- Physical Attributes -->
  <div class="attribute-category">
    <span class="category-emoji">💪</span>
    <div class="attribute-box">
      <label>DEX (4): </label>
      <input type="number" min="-2" max="15"
             value="{{character.dex}}"
             data-attribute="dex"
             data-cost="4">
      <div class="spinner-buttons">
        <button class="spinner-up" data-action="incrementAttribute" data-attribute="dex">▲</button>
        <button class="spinner-down" data-action="decrementAttribute" data-attribute="dex">▼</button>
      </div>
    </div>
    <!-- STR and CON boxes follow same pattern... -->
  </div>

  <!-- Social and Mental categories follow same pattern... -->
</div>
```

**Attribute Costs**:
- 4 points: DEX, CHA, INT, PER
- 3 points: STR, WIS
- 1 point: CON, GRI

**Layout** (at 1145px width):
- 3 attributes across in each row
- 5px column gap between attributes
- 5px left/right padding on container

**Spinner Behavior**:
- **Increment**: Spends Attribute Chips first, then XP when chips depleted
  - Disabled if at max (15) OR insufficient resources
- **Decrement**: Restores points to Chips (up to total), then to XP
  - Disabled if at min (-2)
- **Mouse wheel**: Scroll to increment/decrement (with range validation)
- **Range**: -2 to 15

**Visual Spacing**:
- Thin space between close paren and value
- Little space between attribute and open paren

**Events**:
- `updateAttribute(attribute, value)` - Direct value change
- `incrementAttribute(attribute)` - Increase by 1 (spends resources)
- `decrementAttribute(attribute)` - Decrease by 1 (restores resources)

**CSS Classes**:
- `attributes-section` - Main container
- `attribute-category` - Category group (Physical/Social/Mental)
- `category-emoji` - Category icon
- `attribute-box` - Individual attribute container
- `spinner-buttons` - Stacked up/down buttons
- `spinner-up`, `spinner-down` - Increment/decrement buttons

---

## Skills & Fields Section

**Purpose**: Manage skills organized in fields

**Structure**:
```html
<div class="skills-fields-section">
  {{#each fields}}
    <div class="field">
      <div class="field-header">
        <label>{{fieldName}}</label>
        <input type="number" min="0"
               value="{{level}}"
               data-field-id="{{fieldId}}"
               data-action="updateFieldLevel">
        <div class="spinner-buttons">
          <button class="spinner-up">▲</button>
          <button class="spinner-down">▼</button>
        </div>
      </div>

      <ul class="skills-list">
        {{#each skills}}
          <li class="skill-item" data-skill-id="{{skillId}}" data-action="toggleSkillCheck">
            <input type="checkbox" {{#if checked}}checked{{/if}}>
            <span class="skill-icon">{{icon}}</span> <!-- 🞐 standard, 🞸 created -->
            <span class="skill-name">{{name}}</span>
            <span class="skill-level">{{computedLevel}}</span>
            {{#if multiplier > 1}}
              <span class="skill-multiplier">(×{{multiplier}})</span>
            {{/if}}
            {{#if prerequisites}}
              <span class="skill-prereqs">({{prerequisites}})</span>
            {{/if}}
          </li>
        {{/each}}
      </ul>
    </div>
  {{/each}}

  <!-- Orphaned skills (not in fields) -->
  <div class="orphaned-skills">
    <h3>Skills Not in Fields</h3>
    {{#each orphanedSkills}}
      <div class="skill-item" data-error="{{level > 1}}">
        <!-- Skill with level > 1 shown in red (error) -->
      </div>
    {{/each}}
  </div>
</div>
```

**Skill Icons**:
- 🞐 - Standard skills (from Hollow-summary.md constants)
- 🞸 - Created skills (custom)

**Skill Level Computation**:
- Sum of field level for each occurrence (twice if skill appears twice)
- Plus number of checkboxes checked

**Field Level Behavior**:
- Editable as text or via mouse wheel
- When all skills checked: Increment field level, clear all checks

**Skill Check Behavior**:
- Click skill to toggle check
- Check adds 1 to skill level and adds skill cost to XP
- Skills with unmet prerequisites can only be checked if character has prerequisite at next level

**Events**:
- `updateFieldLevel(fieldId, value)` - Update field level
- `toggleSkillCheck(skillId)` - Check/uncheck skill
- `incrementFieldLevel(fieldId)` - Mouse wheel or button
- `decrementFieldLevel(fieldId)` - Mouse wheel or button

**CSS Classes**:
- `skills-fields-section` - Main container
- `field` - Field container
- `field-header` - Field name and level
- `skills-list` - List of skills
- `skill-item` - Individual skill
- `skill-icon` - 🞐 or 🞸
- `skill-name`, `skill-level`, `skill-multiplier`, `skill-prereqs` - Skill details
- `orphaned-skills` - Skills not in fields
- `data-error="true"` - Red text for orphaned skill with level > 1

---

## Benefits & Drawbacks Section

**Purpose**: List character benefits and drawbacks

**Structure**:
```html
<div class="benefits-drawbacks-section">
  <div class="benefits">
    <h3>Benefits</h3>
    <ul>
      {{#each benefits}}
        <li>{{name}}: {{description}}</li>
      {{/each}}
    </ul>
  </div>

  <div class="drawbacks">
    <h3>Drawbacks</h3>
    <ul>
      {{#each drawbacks}}
        <li>{{name}}: {{description}}</li>
      {{/each}}
    </ul>
  </div>
</div>
```

**CSS Classes**:
- `benefits-drawbacks-section` - Main container
- `benefits`, `drawbacks` - Subsections

---

## Equipment & Companions Section

**Purpose**: List equipment and companions

**Structure**:
```html
<div class="equipment-companions-section">
  <div class="equipment">
    <h3>Equipment</h3>
    <ul>
      {{#each equipment}}
        <li>{{item}}</li>
      {{/each}}
    </ul>
  </div>

  <div class="companions">
    <h3>Companions</h3>
    <ul>
      {{#each companions}}
        <li>{{name}}</li>
      {{/each}}
    </ul>
  </div>
</div>
```

**CSS Classes**:
- `equipment-companions-section` - Main container
- `equipment`, `companions` - Subsections

---

## Hollow Tracker Section

**Purpose**: Track hollow progression and status

**Structure**:
```html
<div class="hollow-tracker-section">
  <h3>Hollow Tracker</h3>

  <div class="hollow-stats">
    <div class="stat-field">
      <label>Dust</label>
      <input type="number" value="{{character.dust}}" data-field="dust">
    </div>
    <div class="stat-field">
      <label>Burned</label>
      <input type="number" value="{{character.burned}}" data-field="burned">
    </div>
    <div class="stat-field">
      <label>Influence</label>
      <input type="number" value="{{character.influence}}" data-field="influence">
    </div>
    <div class="stat-field">
      <label>Glimmer Debt</label>
      <input type="number" value="{{character.glimmerDebt}}" data-field="glimmerDebt">
    </div>
  </div>

  <div class="new-moon-marks">
    <label>New Moon Marks</label>
    <!-- Checkbox list or counter -->
  </div>
</div>
```

**CSS Classes**:
- `hollow-tracker-section` - Main container
- `hollow-stats` - Stats grid
- `stat-field` - Individual stat
- `new-moon-marks` - Marks counter

---

## Action Buttons

**Purpose**: Save, revert, and freeze character

**Structure**:
```html
<div class="action-buttons">
  <button class="yep-button"
          data-action="clickSave"
          {{#unless hasChanges}}disabled{{/unless}}>
    Yep
  </button>

  <button class="nope-button"
          data-action="clickRevert"
          {{#unless hasChanges}}disabled{{/unless}}>
    Nope
  </button>

  <button class="freeze-button" data-action="clickFreeze">
    {{#if character.frozen}}Unfreeze{{else}}Freeze{{/if}}
  </button>
</div>
```

**Button States**:
- Yep/Nope: Enabled only when `hasChanges === true`
- Freeze: Always enabled, text changes based on frozen state

**Change Detection**:
- Hash-based comparison every 250ms (see `manifest-ui.md` → Global UI Patterns)
- Calculate hash of original character on load (`originalCharacterHash`)
- Compare current character hash to original every 250ms
- Enable buttons when hashes differ

**Events**:
- `clickSave()` - Save character to storage, update hash
- `clickRevert()` - Reload character from storage
- `clickFreeze()` - Toggle frozen state, disable editing

**CSS Classes**:
- `action-buttons` - Button group container
- `yep-button`, `nope-button`, `freeze-button` - Individual buttons

---

## Export/Import/Validate Actions

**Purpose**: Character data management actions

**Structure**:
```html
<div class="character-actions">
  <button data-action="exportCharacter">Export</button>
  <button data-action="importCharacter">Import</button>
  <button data-action="validateCharacter">Validate</button>
</div>
```

**Events**:
- `exportCharacter()` - Download character as JSON
- `importCharacter()` - Upload character JSON file
- `validateCharacter()` - Check character data integrity

**CSS Classes**:
- `character-actions` - Action buttons container

---

## Data

**From CRC cards** (see `crc-Character.md`, `crc-CharacterStorageService.md`, `crc-CharacterEditorView.md`):
- `character: ICharacter` - Character loaded from storage
  - All character fields: name, rank, attributes, skills, fields, etc.
- `originalCharacterHash: string` - SHA-256 hash of original character (see `crc-CharacterHash.md`)
- `hasChanges: boolean` - Computed from hash comparison

**Computed values** (see `crc-CharacterCalculations.md`):
- `damageCapacity` = 10 + character.con
- `totalXP` = character.rank * 10
- `totalChips` = 16 + (character.rank - 1)
- `availableXP` = totalXP - spentXP
- `availableChips` = max(0, totalChips - totalAttributeCosts)

---

## States

### Default (Unfrozen)
- All fields editable
- Save/Revert buttons enabled when changes detected
- Freeze button shows "Freeze"

### Has Changes
- Yep/Nope buttons enabled
- Change detection running (250ms polling)
- Hash differs from original

### Frozen
- All fields disabled (read-only)
- Freeze button shows "Unfreeze"
- Save/Revert buttons disabled

---

## Events

**Behavior Implementation**: See `crc-CharacterEditorView.md`, `seq-edit-character.md`, `seq-save-character-ui.md`

**Field Updates**:
- `updateField(field, value)` - Update any character field
- `updateAttribute(attribute, value)` - Update attribute value
- `incrementAttribute(attribute)` - Increase attribute (spend resources, see `seq-increment-attribute.md`)
- `decrementAttribute(attribute)` - Decrease attribute (restore resources)
- `updateRank(value)` - Update rank, recalculate resources
- `updateFieldLevel(fieldId, value)` - Update field level
- `toggleSkillCheck(skillId)` - Check/uncheck skill

**Actions**:
- `clickSave()` - Save to storage (see `seq-save-character-ui.md`)
- `clickRevert()` - Reload from storage (see `seq-revert-character.md`)
- `clickFreeze()` - Toggle frozen state
- `exportCharacter()` - Download JSON
- `importCharacter()` - Upload JSON
- `validateCharacter()` - Check integrity (see `crc-CharacterValidation.md`)

**Key Interactions** (see CRC cards and sequence diagrams for implementation):
- **Load character**: CharacterEditorView → CharacterStorageService (see `seq-edit-character.md`)
- **Update fields**: CharacterEditorView → Character (local state update)
- **Increment attribute**: CharacterEditorView → CharacterSheet → CharacterCalculations (see `seq-increment-attribute.md`)
- **Save character**: CharacterEditorView → CharacterStorageService (see `seq-save-character-ui.md`)
- **Detect changes**: 250ms polling with hash comparison (see `crc-CharacterHash.md`)

---

## CSS Classes

*Too numerous to list exhaustively - see structure sections above*

**Key Classes**:
- `character-editor-container` - Main container
- `character-name-section` - Name input
- `top-stats-bar` - Primary stats
- `attributes-section` - Attributes area
- `attribute-category` - Category group
- `attribute-box` - Individual attribute
- `spinner-buttons`, `spinner-up`, `spinner-down` - Spinners
- `skills-fields-section` - Skills area
- `field`, `field-header`, `skills-list`, `skill-item` - Skills structure
- `benefits-drawbacks-section`, `equipment-companions-section`, `hollow-tracker-section` - Other sections
- `action-buttons` - Save/revert/freeze
- `character-actions` - Export/import/validate

---

## Theme Requirements

**Western Frontier Styling** (from `manifest-ui.md`):
- Parchment-style content boxes for each section
- Western-themed spinners (stacked arrows)
- Brown/gold color scheme
- Monospace fonts for numeric values
- Input fields: Dark backgrounds with gold text

**Layout**:
- Max-width: 1145px for proper 3-attribute layout
- Responsive breakpoints for mobile/tablet
- Vertical scrolling for long character sheets

**Save Behavior** (from `manifest-ui.md`):
- NEVER block saves due to validation errors
- Always save, show warnings but allow completion
- Invalid data prevented from being used, not from being saved

---

*Last updated: 2025-11-08*
