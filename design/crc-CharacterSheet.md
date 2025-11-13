# CharacterSheet

**Source Spec:** specs/ui.characters.md, specs/characters.md
**Existing Code:** src/character/CharacterSheet.ts

## Responsibilities

### Knows
- character: ICharacter - Character being displayed/edited
- container: HTMLElement - DOM container for the sheet
- config: ICharacterSheetConfig - Sheet configuration
- callbacks: ICharacterSheetComponent - Event callbacks for changes
- headerComponent: Component - Character name and top stats
- attributesComponent: Component - Physical/Social/Mental attributes
- skillsComponent: Component - Skills and fields editor
- benefitsComponent: Component - Benefits and drawbacks
- hollowComponent: Component - Hollow tracker (dust, burned, influence)
- equipmentComponent: Component - Equipment and companions

### Does
- render(): Render the complete character sheet
- updateCharacter(character): Update sheet with new character data
- getCharacter(): Return current character state
- exportCharacter(): Download character as JSON
- importCharacter(): Upload and load character JSON
- validateCharacter(): Check character against game rules
- createCharacterSheetHTML(): Generate main sheet structure
- initializeSubComponents(): Create all sub-components
- initializePlaceholderContent(): Set up section placeholders
- destroySubComponents(): Cleanup all sub-components
- renderAttributes(): Render attribute section with spinners
- renderSkills(): Render skills and fields section
- renderBenefits(): Render benefits/drawbacks section
- renderEquipment(): Render equipment/companions section
- refreshComponents(): Force re-render of all components
- incrementAttribute(attrType): Increase attribute value
- decrementAttribute(attrType): Decrease attribute value
- updateAttributeButtonStates(): Enable/disable +/- buttons based on resources
- updateDisplay(): Refresh all displays after changes
- updateResourceDisplays(): Update XP and attribute chip displays
- setupActionButtons(): Wire up Export/Import/Validate buttons
- openImportDialog(): Show file picker for character import
- downloadCharacterData(): Export character to JSON file
- showValidationResults(errors): Display validation errors
- destroy(): Cleanup sheet and remove listeners

## Collaborators

- **Character**: ICharacter data structure
- **CharacterCalculations**: calculateAvailableXP(), calculateAvailableAttributeChips(), calculateDamageCapacity()
- **CharacterValidation**: validateCharacterCreation(), validateAttributes(), validateSkillPrerequisites()
- **ATTRIBUTE_DEFINITIONS**: Constant data for attribute costs and ranges
- **TemplateEngine**: renderTemplateFromFile() for section templates
- **Parent View**: Callbacks for onChange, onValidation events

## Code Review Notes

✅ **Working well:**
- Modular component architecture (header, attributes, skills, etc.)
- Clear separation between rendering and logic
- Attribute increment/decrement with resource tracking
- Live resource display updates (XP and attribute chips)
- Export/Import/Validate functionality
- Proper cleanup of sub-components

✅ **Matches spec:**
- Attribute organization by cost (4, 3, 1) ✓
- Attribute groups (Physical, Social, Mental) ✓
- Attribute spinners with range validation (-2 to 15) ✓
- Mouse wheel support for spinners ✓
- Available XP shows total in parens ✓
- Available chips shows total in parens ✓
- Negative XP shows in red ✓
- Skills and fields with level tracking ✓
- Export/Import character data ✓

⚠️ **Potential issues:**
- Component structure suggests sub-components exist but they're just placeholders
- Many render methods but unclear if they're actually modular
- Attribute increment/decrement logic could be refactored to separate class
- Resource calculation duplicated (should delegate to CharacterCalculations)

📝 **Design pattern:**
- Component pattern: Sheet composed of sub-components
- Template-based rendering: Uses TemplateEngine for sections
- Event callbacks: Parent notified of changes via callbacks
- Stateful component: Maintains character state internally

📝 **Implementation details:**
- Attribute spinner buttons: stacked arrows, western-themed
- XP/chips display: "Available XP (30)" format
- Negative available chips shown as 0 (excess deducted from XP)
- Skills prefixed: 🞐 for standard, 🞸 for created
- Field level editable: text input + mouse wheel + spinners

## Implementation Notes

**Attribute Increment Logic (per spec):**
```typescript
incrementAttribute(attrType) {
    // Priority spending: Attribute Chips first, then XP
    // 1. Check if in range (max 15)
    // 2. Calculate cost (1, 3, or 4 based on attribute type)
    // 3. Check if enough chips + XP available
    // 4. Increment attribute
    // 5. Update displays
}
```

**Attribute Decrement Logic (per spec):**
```typescript
decrementAttribute(attrType) {
    // Point restoration = attribute cost (1, 3, or 4)
    // 1. Check if in range (min -2)
    // 2. Calculate cost to restore
    // 3. Decrement attribute
    // 4. Update displays (XP and chips restored)
}
```

**Resource Display Updates:**
- Total XP = 10 + (rank-1) * 10
- Total chips = 16 + (rank-1)
- Available XP = total XP - spent XP
- Available chips = total chips - sum of attribute costs
- Display negative chips as 0

## Sequences

- seq-render-character-sheet.md
- seq-increment-attribute.md
- seq-decrement-attribute.md
- seq-update-resource-displays.md
- seq-export-character.md
- seq-import-character.md
- seq-validate-character-ui.md

## Type A/B/C Issues

**To be identified during CRC review**

