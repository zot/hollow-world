// Character version compatibility module to manage upgrading old stored characters to the latest format
// Following Single Responsibility Principle

import { ICharacter, IField, IFieldSkillEntry } from './types.js';

export interface ICharacterSchema {
    version: string;
    description: string;
    fieldFormat: 'legacy' | 'skillEntries';
}

export interface ILegacyField {
    id: string;
    name: string;
    level: number;
    skills: string[]; // Old format: array of skill IDs
    isFrozen: boolean;
}

export class CharacterVersioning {
    // Character schemas array in sorted order by version number
    private static readonly CHARACTER_SCHEMAS: ICharacterSchema[] = [
        {
            version: '0.0.16',
            description: 'Legacy format with skills array in fields',
            fieldFormat: 'legacy'
        },
        {
            version: '0.0.17',
            description: 'New format with skillEntries array in fields',
            fieldFormat: 'skillEntries'
        }
    ];

    // Get the current app version from VERSION file
    static getCurrentVersion(): string {
        return '0.0.17'; // This should ideally be imported from VERSION file
    }

    // Get character schema for a specific version
    static getSchemaForVersion(version: string): ICharacterSchema | null {
        return this.CHARACTER_SCHEMAS.find(schema => schema.version === version) || null;
    }

    // Get the latest schema
    static getLatestSchema(): ICharacterSchema {
        return this.CHARACTER_SCHEMAS[this.CHARACTER_SCHEMAS.length - 1];
    }

    // Check if character is at the latest version
    static isLatestVersion(character: ICharacter | any): boolean {
        const currentVersion = this.getCurrentVersion();
        return character.version === currentVersion;
    }

    // Upgrade character from version 0.0.16 (legacy) to 0.0.17 (skillEntries)
    static upgradeFromV0_0_16ToV0_0_17(character: any): ICharacter {
        console.log(`Migrating character ${character.name || character.id} from v0.0.16 to v0.0.17`);

        // Convert legacy fields format to new skillEntries format
        const upgradedFields: IField[] = character.fields?.map((field: ILegacyField) => {
            const skillEntries: IFieldSkillEntry[] = field.skills?.map(skillId => ({
                skillId,
                hasExperience: false // Default to no experience for migrated skills
            })) || [];

            return {
                ...field,
                skillEntries,
                // Remove old skills property (it will be ignored by TypeScript but clean up the object)
                skills: undefined
            };
        }) || [];

        // Create upgraded character with version field
        const upgradedCharacter: ICharacter = {
            ...character,
            version: '0.0.17',
            fields: upgradedFields
        };

        return upgradedCharacter;
    }

    // Main upgrade function that upgrades a character to the latest version
    static upgradeCharacterToLatest(character: any): ICharacter {
        let upgradedCharacter = character;

        // If character has no version, assume it's the oldest supported version
        if (!upgradedCharacter.version) {
            console.log(`Character ${character.name || character.id} has no version field, assuming v0.0.16`);
            upgradedCharacter.version = '0.0.16';
        }

        // If already at latest version, return as-is
        if (this.isLatestVersion(upgradedCharacter)) {
            return upgradedCharacter as ICharacter;
        }

        // Apply upgrades in sequence until we reach the latest version
        const currentVersion = upgradedCharacter.version;

        if (currentVersion === '0.0.16') {
            upgradedCharacter = this.upgradeFromV0_0_16ToV0_0_17(upgradedCharacter);
        }

        // Future version upgrades would be added here:
        // if (currentVersion === '0.0.17') {
        //     upgradedCharacter = this.upgradeFromV0_0_17ToV0_0_18(upgradedCharacter);
        // }

        console.log(`Character ${character.name || character.id} upgraded from v${currentVersion} to v${upgradedCharacter.version}`);
        return upgradedCharacter;
    }

    // Validate character against its schema version
    static validateCharacterSchema(character: ICharacter): string[] {
        const errors: string[] = [];
        const schema = this.getSchemaForVersion(character.version);

        if (!schema) {
            errors.push(`Unknown character version: ${character.version}`);
            return errors;
        }

        // Validate field format matches schema
        if (character.fields) {
            character.fields.forEach((field, index) => {
                if (schema.fieldFormat === 'skillEntries') {
                    if (!field.skillEntries || !Array.isArray(field.skillEntries)) {
                        errors.push(`Field ${index} (${field.name || field.id}) missing skillEntries array for version ${character.version}`);
                    }
                } else if (schema.fieldFormat === 'legacy') {
                    const legacyField = field as any;
                    if (!legacyField.skills || !Array.isArray(legacyField.skills)) {
                        errors.push(`Field ${index} (${field.name || field.id}) missing skills array for version ${character.version}`);
                    }
                }
            });
        }

        return errors;
    }

    // Get all supported versions
    static getSupportedVersions(): string[] {
        return this.CHARACTER_SCHEMAS.map(schema => schema.version);
    }
}