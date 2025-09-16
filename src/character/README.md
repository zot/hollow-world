# Character Sheet System

A comprehensive character management system for the Hollow RPG, built following SOLID principles.

## Overview

This system provides a complete character sheet implementation for the Hollow western supernatural RPG, including character creation, attribute management, skill tracking, and the unique Hollow/Dust mechanic.

## Architecture

### Core Components

- **types.ts** - TypeScript interfaces and enums defining the character data model
- **CharacterUtils.ts** - Utility classes for calculations, validation, and character management
- **CharacterSheet.ts** - Main UI component for displaying and editing characters
- **CharacterSheet.test.ts** - Comprehensive unit tests

### Design Principles

Following SOLID principles:
- **Single Responsibility**: Each class/function has one clear purpose
- **Open/Closed**: Extensible through interfaces without modification
- **Liskov Substitution**: Components are interchangeable through interfaces
- **Interface Segregation**: Focused interfaces for specific needs
- **Dependency Inversion**: Depends on abstractions, not implementations

## Features

### Character Creation
- 16 attribute chips distributed across 8 attributes
- Starting benefits and drawbacks
- Validation of creation rules

### Attribute System
- 8 attributes in 3 categories (Physical, Social, Mental)
- Variable XP costs (x1, x3, x4)
- Range validation (-2 to 15)

### Skills & Fields
- Listed skills (🞐) vs custom skills
- Field system for grouped skills (3+ skills per field)
- Specialization tracking (checkmarks)

### Hollow Mechanics
- Dust tracking (current/burned)
- Hollow influence calculation (1 per 100 burned)
- New Moon visit warnings
- Glimmer debt system

### Equipment & Companions
- Fine weapons with level bonuses
- Companion character sheets
- Item management

## Usage

### Basic Character Creation

```typescript
import { CharacterFactory, CharacterSheet } from './character/';

// Create a new character
const character = CharacterFactory.createTemplateCharacter('Gunslinger Joe');

// Set up attributes
character.attributes.Dex = 8;  // High dexterity for gunfighting
character.attributes.Cha = 6;  // Social presence
character.attributes.Con = 4;  // Decent toughness

// Create character sheet component
const sheet = new CharacterSheet(character);
sheet.render(document.getElementById('character-container'));
```

### Character Updates

```typescript
import { CharacterUpdater } from './character/CharacterUtils';

// Add experience
const updatedCharacter = CharacterUpdater.addExperience(character, 15);

// Burn dust for effects
const afterBurning = CharacterUpdater.burnDust(updatedCharacter, 10);

// Update specific attribute
const withNewDex = CharacterUpdater.updateAttribute(character, 'Dex', 10);
```

### Validation

```typescript
import { CharacterValidation } from './character/CharacterUtils';

const errors = CharacterValidation.validateCharacterCreation(character);
if (errors.length > 0) {
    console.log('Character has validation errors:', errors);
}
```

## Character Data Model

### Core Character Properties

```typescript
interface ICharacter {
    // Identity
    id: string;
    name: string;
    description: string;

    // Progression
    rank: number;          // 1 + (totalXP / 10)
    totalXP: number;
    currentXP: number;

    // Stats
    attributes: IAttributes;  // 8 attributes
    damageCapacity: number;   // 10 + CON

    // Character Building
    skills: ISkill[];
    fields: IField[];
    benefits: IBenefit[];
    drawbacks: IDrawback[];

    // Hollow System
    hollow: {
        dust: number;
        burned: number;
        hollowInfluence: number;  // 1 per 100 burned
        glimmerDebt: number;
        newMoonMarks: number;     // 0-3, failure marks
    };

    // Equipment
    items: IItem[];
    companions: ICompanion[];
}
```

### Attribute System

8 attributes with variable XP costs:

**Physical** (body and physicality)
- Dex (x4) - coordination, speed, agility
- Str (x3) - physical power, size
- Con (x1) - health, endurance, toughness

**Social** (interaction and mental resilience)
- Cha (x4) - quick wit, social defense
- Wis (x3) - willpower, judgment, insight
- Gri (x1) - psychological resilience

**Mental** (reasoning and awareness)
- Int (x4) - intelligence, analysis, design
- Per (x4) - perception, memory, focus

## Character Creation Rules

Starting characters receive:
- 16 positive attribute chips
- 10 XP
- 1 benefit
- 1 drawback
- 10 grains of dust

### Attribute Chips

Chips come in denominations matching XP costs:
- x4 chips for Dex, Cha, Int, Per
- x3 chips for Str, Wis
- x1 chips for Con, Gri

Players can take additional positive chips by taking equal negative chips.

### Ranking Up

Every 10 XP grants 1 rank and:
- 5 grains of dust
- 1 positive attribute chip
- Optional: up to 4 more positive chips with equal negative chips
- Every 5th rank: 2 benefits and 2 drawbacks

## Hollow System

The Hollow system represents supernatural corruption:

### Dust Mechanics
- **Dust**: Current magical resource (grains)
- **Burned**: Total dust consumed (permanent)
- **Hollow Influence**: Negative influence (1 per 100 burned)

### New Moon Visits
When Rank ≤ (Hollow Influence + Glimmer Debt), characters are visited by the Entity at each new moon and must resist or gain marks. 3 marks = taken out of existence.

### Glimmer Debt
Emergency dust extraction without XP, but:
- Creates negative Glimmer Debt influence
- "Eats" all future XP and dust until paid off
- Increases visitation risk

## Styling

The character sheet uses a western theme matching the game's aesthetic:

- **Fonts**: Sancreek for headers, Rye for body text
- **Colors**: Brown color palette (#8B4513, #CD853F, #DEB887)
- **Effects**: Weathered paper backgrounds, western-style borders
- **Layout**: Responsive grid with clear sections

## Testing

Comprehensive unit tests cover:
- Character creation and validation
- Attribute calculations
- XP and ranking mechanics
- Hollow system calculations
- Component rendering and interaction

Run tests with:
```bash
npm test src/character/
```

## Integration

The character sheet integrates with the main HollowWorld application:

1. Import character system components
2. Create/load character data
3. Render character sheet in designated container
4. Handle character updates and persistence

See `main.ts` for integration examples.