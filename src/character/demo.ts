// Demo character creation and usage examples
// Shows how to integrate the character sheet system

import { CharacterFactory, CharacterUpdater, CharacterValidation } from './CharacterUtils.js';
import { CharacterSheet } from './CharacterSheet.js';
import { AttributeType, ISkill, IBenefit, IDrawback } from './types.js';

// Demo function to create a sample gunslinger character
export function createGunslingerDemo(): void {
    console.log('=== Creating Demo Gunslinger Character ===');

    // Create base character
    const gunslinger = CharacterFactory.createTemplateCharacter('Jake "Dead-Eye" Morrison');
    gunslinger.description = 'A weathered gunslinger with hollow eyes and a quick draw';

    // Set up attributes for a classic gunslinger build
    console.log('Setting up attributes...');
    let updated = CharacterUpdater.updateAttribute(gunslinger, AttributeType.DEX, 8); // Lightning reflexes
    updated = CharacterUpdater.updateAttribute(updated, AttributeType.CHA, 6);         // Commanding presence
    updated = CharacterUpdater.updateAttribute(updated, AttributeType.PER, 6);        // Sharp eyes
    updated = CharacterUpdater.updateAttribute(updated, AttributeType.WIS, 4);        // Street smart
    updated = CharacterUpdater.updateAttribute(updated, AttributeType.CON, 3);        // Tough enough
    updated = CharacterUpdater.updateAttribute(updated, AttributeType.STR, 2);        // Average strength
    updated = CharacterUpdater.updateAttribute(updated, AttributeType.INT, 2);        // Not book learned
    updated = CharacterUpdater.updateAttribute(updated, AttributeType.GRI, 4);        // Seen enough horror

    console.log('Attributes set:', updated.attributes);
    console.log('Damage Capacity:', updated.damageCapacity);

    // Add some skills
    const skills: ISkill[] = [
        {
            id: 'weapon-pistol',
            name: 'Weapon (Pistol)',
            level: 4,
            isListed: true,
            costMultiplier: 2,
            specialization: 'Pistol',
            isSpecialized: false,
            description: 'Expertise with pistols and revolvers'
        },
        {
            id: 'quickdraw',
            name: 'Quickdraw',
            level: 3,
            prerequisite: 'Weapon (Pistol)',
            isListed: true,
            costMultiplier: 2,
            isSpecialized: false,
            description: 'Lightning-fast weapon drawing'
        },
        {
            id: 'intimidation',
            name: 'Intimidation',
            level: 3,
            isListed: false,
            costMultiplier: 1,
            isSpecialized: false,
            description: 'Striking fear into opponents'
        }
    ];

    updated.skills = skills;

    // Create a gunfighter field
    updated.fields = [{
        id: 'gunfighter',
        name: 'Gunfighter',
        level: 3,
        skills: ['weapon-pistol', 'quickdraw', 'intimidation'],
        isFrozen: true
    }];

    // Update benefits and drawbacks to be more specific
    const customBenefit: IBenefit = {
        id: 'quick-on-draw',
        name: 'Quick on the Draw',
        level: 2,
        condition: 'when drawing and firing in the same action',
        description: 'Years of practice have made your draw supernatural in speed'
    };

    const customDrawback: IDrawback = {
        id: 'haunted-by-past',
        name: 'Haunted by the Past',
        level: 2,
        condition: 'when confronted with reminders of past killings',
        description: 'The ghosts of those you have killed sometimes visit you'
    };

    updated.benefits = [customBenefit];
    updated.drawbacks = [customDrawback];

    // Add some experience and burn some dust to show hollow progression
    console.log('\nAdding experience and burning dust...');
    updated = CharacterUpdater.addExperience(updated, 20); // Total 30 XP = Rank 4
    updated = CharacterUpdater.burnDust(updated, 8);       // Burned 8 dust

    console.log(`Character is now Rank ${updated.rank} with ${updated.currentXP} XP`);
    console.log(`Hollow status: ${updated.hollow.dust} dust remaining, ${updated.hollow.burned} burned`);

    // Validate the character
    console.log('\n=== Validating Character ===');
    const errors = CharacterValidation.validateCharacterCreation(updated);
    if (errors.length === 0) {
        console.log('✓ Character validation passed!');
    } else {
        console.log('✗ Validation errors:', errors);
    }

    // Create and render character sheet
    console.log('\n=== Creating Character Sheet ===');
    createCharacterSheetDemo(updated);
}

// Demo function to create and render a character sheet
export function createCharacterSheetDemo(character: any): void {
    // Create container element
    const container = document.createElement('div');
    container.id = 'demo-character-sheet';
    container.style.width = '100%';
    container.style.maxWidth = '1200px';
    container.style.margin = '20px auto';

    // Create character sheet with callbacks
    const sheet = new CharacterSheet(character, {
        readOnly: false,
        showCreationMode: false
    });

    // Set up in a demo section
    const demoSection = document.createElement('section');
    demoSection.innerHTML = `
        <h2 style="text-align: center; font-family: 'Sancreek', serif; color: #8B4513; margin-bottom: 20px;">
            Hollow RPG Character Sheet Demo
        </h2>
        <div id="character-sheet-container"></div>
    `;

    const sheetContainer = demoSection.querySelector('#character-sheet-container') as HTMLElement;

    try {
        sheet.render(sheetContainer);

        // Add demo section to page
        document.body.appendChild(demoSection);

        console.log('✓ Character sheet rendered successfully');
        console.log('Character data:', sheet.getCharacter());

        // Demo export functionality
        console.log('\n=== Demo Export/Import ===');
        const exported = sheet.exportCharacter();
        console.log('Exported character data length:', exported.length, 'characters');

        // Test import
        const importSuccess = sheet.importCharacter(exported);
        console.log('Import test result:', importSuccess ? '✓ Success' : '✗ Failed');

    } catch (error) {
        console.error('✗ Failed to render character sheet:', error);
    }
}

// Demo function to show character progression
export function demonstrateCharacterProgression(): void {
    console.log('\n=== Character Progression Demo ===');

    const character = CharacterFactory.createNewCharacter('Progression Demo');

    console.log('Starting character:');
    console.log(`- Rank: ${character.rank}`);
    console.log(`- XP: ${character.totalXP}`);
    console.log(`- Dust: ${character.hollow.dust}`);
    console.log(`- Hollow Influence: ${character.hollow.hollowInfluence}`);

    // Simulate gaining experience over multiple sessions
    let updated = character;

    console.log('\nGaining 25 XP (2.5 sessions)...');
    updated = CharacterUpdater.addExperience(updated, 25);
    console.log(`- New Rank: ${updated.rank} (gained ${updated.rank - character.rank} ranks)`);
    console.log(`- Total XP: ${updated.totalXP}`);
    console.log(`- Dust: ${updated.hollow.dust} (gained dust from ranking up)`);

    console.log('\nBurning 50 dust for powerful effects...');
    updated = CharacterUpdater.burnDust(updated, 50);
    console.log(`- Remaining Dust: ${updated.hollow.dust}`);
    console.log(`- Burned Total: ${updated.hollow.burned}`);
    console.log(`- Hollow Influence: -${updated.hollow.hollowInfluence}`);

    console.log('\nBurning 100 more dust (dangerous territory)...');
    updated = CharacterUpdater.burnDust(updated, 100);
    console.log(`- Remaining Dust: ${updated.hollow.dust}`);
    console.log(`- Burned Total: ${updated.hollow.burned}`);
    console.log(`- Hollow Influence: -${updated.hollow.hollowInfluence}`);

    // Check if character needs New Moon visit
    const needsVisit = updated.rank <= updated.hollow.hollowInfluence;
    console.log(`\n⚠️  New Moon Visit Required: ${needsVisit ? 'YES - Character is in danger!' : 'No - Character is safe'}`);

    if (needsVisit) {
        console.log(`Character's Rank (${updated.rank}) is not greater than Hollow Influence (${updated.hollow.hollowInfluence})`);
        console.log('The Entity will visit this character at the next new moon...');
    }
}

// Initialize demo when DOM is loaded
export function initializeDemo(): void {
    if (typeof window !== 'undefined' && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🎭 Hollow RPG Character Sheet Demo Starting...');

            // Run character creation demo
            createGunslingerDemo();

            // Show progression mechanics
            demonstrateCharacterProgression();

            console.log('🎭 Demo complete! Check the rendered character sheet above.');
        });
    } else if (typeof window !== 'undefined') {
        // DOM already loaded
        console.log('🎭 Hollow RPG Character Sheet Demo Starting...');
        createGunslingerDemo();
        demonstrateCharacterProgression();
        console.log('🎭 Demo complete!');
    }
}

// Auto-initialize if this file is loaded directly
if (typeof window !== 'undefined') {
    initializeDemo();
}