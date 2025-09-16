# Character Sheet UI Component Plan

Based on the Hollow RPG system specifications, I propose creating a comprehensive character sheet component with the following structure:

## Core Character Data Model
- **Basic Info**: Name, Description, Rank (starts at 1, +1 per 10 XP)
- **Attributes** (8 total, organized by category):
  - Physical: Dex (x4), Str (x3), Con (x1)
  - Social: Cha (x4), Wis (x3), Gri (x1)
  - Mental: Int (x4), Per (x4)
- **Derived Stats**:
  - Damage Capacity (10 + CON)
  - XP total and current
- **Hollow System**: Dust (current), Burned (total), Hollow level
- **Character Progression**: Skills, Fields, Benefits, Drawbacks
- **Equipment**: Items, Companions

## UI Layout Sections

### 1. Header Section
- Character name and description
- Rank display with XP progress bar
- Quick stats (Damage Capacity, Dust remaining)

### 2. Attributes Grid
- 3-column layout (Physical | Social | Mental)
- Each attribute shows current level with cost multiplier indicator
- Color coding for cost tiers (x1=green, x3=yellow, x4=red)
- Hover tooltips explaining each attribute's purpose

### 3. Skills & Fields Panel
- Expandable Fields with nested Skills
- Listed Skills (🞐) vs Created Skills differentiation
- Cost indicators (x1 vs x2)
- Specialization checkmarks for Skills above Field level

### 4. Benefits & Drawbacks Section
- Conditional benefits with clear trigger descriptions
- Drawbacks with situational penalties
- Level indicators for each

### 5. Hollow Tracking
- Dust counter with burn history
- Hollow Influence calculator (1 per 100 burned)
- Glimmer Debt tracking if applicable
- Visual warning system for New Moon visits

### 6. Equipment & Companions
- Fine Weapons with level bonuses
- Companion stat blocks (simplified character sheets)
- Tool descriptions with mechanical benefits

## Implementation Approach
- React/TypeScript component following SOLID principles
- Modular sub-components for each section
- Local state management with persistence
- Validation for character creation rules (16 attribute chips, minimum totals)
- Western theme styling to match the game's aesthetic
- Export/import functionality for character data

## Key Features
- Real-time XP/Rank calculations
- Attribute cost validation during character creation
- Automatic Hollow tracking and New Moon warnings
- Field/Skill relationship management
- Companion creation and management tools