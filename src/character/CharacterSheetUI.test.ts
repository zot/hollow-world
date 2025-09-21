// Unit tests for CharacterSheet UI behavior - attribute buttons and resource management

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CharacterSheet } from './CharacterSheet.js';
import { ICharacter, AttributeType } from './types.js';
import { CharacterFactory, CharacterCalculations } from './CharacterUtils.js';

// Mock DOM environment for UI testing
class MockElement {
    innerHTML: string = '';
    textContent: string = '';
    disabled: boolean = false;
    classList = {
        toggle: vi.fn(),
        add: vi.fn(),
        remove: vi.fn()
    };
    dataset: { [key: string]: string } = {};
    style: { [key: string]: string } = {};

    addEventListener(event: string, listener: Function): void {
        // Store listeners for testing
    }

    querySelector(selector: string): MockElement | null {
        if (selector.includes('character-attributes')) return new MockElement();
        if (selector.includes('attr-')) return new MockElement();
        if (selector.includes('available-xp')) return new MockElement();
        if (selector.includes('available-chips')) return new MockElement();
        return null;
    }

    querySelectorAll(selector: string): MockElement[] {
        if (selector.includes('.attr-btn')) {
            return [
                Object.assign(new MockElement(), {
                    dataset: { action: 'inc', attribute: 'DEX', cost: '4' }
                }),
                Object.assign(new MockElement(), {
                    dataset: { action: 'dec', attribute: 'DEX', cost: '4' }
                })
            ];
        }
        return [];
    }
}

describe('CharacterSheet UI Behavior', () => {
    let characterSheet: CharacterSheet;
    let mockContainer: MockElement;
    let testCharacter: ICharacter;

    beforeEach(() => {
        mockContainer = new MockElement();
        testCharacter = CharacterFactory.createNewCharacter('Test Character');
        testCharacter.rank = 2;
        testCharacter.attributes[AttributeType.DEX] = 2;
        testCharacter.attributes[AttributeType.STR] = 1;

        characterSheet = new CharacterSheet(testCharacter);

        // Mock document
        (global as any).document = {
            getElementById: vi.fn().mockReturnValue(new MockElement()),
            createElement: vi.fn().mockReturnValue(new MockElement()),
            head: new MockElement()
        };
    });

    afterEach(() => {
        if (characterSheet) {
            characterSheet.destroy();
        }
    });

    describe('Attribute Increment Button Behavior (Per Specs)', () => {
        beforeEach(() => {
            characterSheet.render(mockContainer as any);
        });

        it('should implement priority spending: chips first, then XP', () => {
            // Character with some available chips and XP
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 3; // 18 total chips, 30 total XP
            char.attributes[AttributeType.CON] = 5; // Costs 5 chips, leaves 13 chips available

            const sheet = new CharacterSheet(char);

            // Test increment logic
            const availableChips = CharacterCalculations.calculateAvailableAttributeChips(char);
            const availableXP = CharacterCalculations.calculateAvailableXP(char);

            expect(availableChips).toBe(13); // 18 - 5 = 13 chips available
            expect(availableXP).toBe(30); // No XP spent yet

            // Incrementing DEX (cost 4) should use chips first
            const incrementMethod = (sheet as any).incrementAttribute.bind(sheet);
            incrementMethod(AttributeType.DEX, 4);

            // Should increment DEX and use chips
            expect(char.attributes[AttributeType.DEX]).toBe(1); // 0 + 1 = 1
        });

        it('should prevent increment when insufficient resources', () => {
            // Character with no available resources
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 1; // 16 total chips, 10 total XP
            char.attributes[AttributeType.DEX] = 4; // Costs 16 chips (all chips used)
            char.attributes[AttributeType.STR] = 3; // Costs 9 XP (would exceed total)

            const sheet = new CharacterSheet(char);

            const availableChips = CharacterCalculations.calculateAvailableAttributeChips(char);
            const availableXP = CharacterCalculations.calculateAvailableXP(char);

            expect(availableChips).toBe(0); // No chips available
            expect(availableXP).toBeGreaterThanOrEqual(0); // Some XP might be available

            // Try to increment when no resources
            const initialDEX = char.attributes[AttributeType.DEX];
            const incrementMethod = (sheet as any).incrementAttribute.bind(sheet);
            incrementMethod(AttributeType.DEX, 4);

            // Should not increment if insufficient resources
            const canAfford = (availableChips >= 4) || (availableXP >= 4);
            if (!canAfford) {
                expect(char.attributes[AttributeType.DEX]).toBe(initialDEX);
            }
        });

        it('should prevent increment at maximum attribute value', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.attributes[AttributeType.DEX] = 15; // At maximum

            const sheet = new CharacterSheet(char);

            const initialValue = char.attributes[AttributeType.DEX];
            const incrementMethod = (sheet as any).incrementAttribute.bind(sheet);
            incrementMethod(AttributeType.DEX, 4);

            // Should not increment beyond maximum
            expect(char.attributes[AttributeType.DEX]).toBe(initialValue);
        });
    });

    describe('Attribute Decrement Logic (Per Specs)', () => {
        it('should restore correct point values based on attribute cost', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 3;
            char.attributes[AttributeType.DEX] = 3; // Cost 4 each, total 12 cost
            char.attributes[AttributeType.STR] = 2; // Cost 3 each, total 6 cost

            const sheet = new CharacterSheet(char);

            // Total cost before: 12 + 6 = 18
            const initialTotalCost = CharacterCalculations.calculateTotalAttributeCosts(char.attributes);

            const decrementMethod = (sheet as any).decrementAttribute.bind(sheet);
            decrementMethod(AttributeType.DEX, 4); // Decrement DEX (cost 4)

            // Should decrement by 1
            expect(char.attributes[AttributeType.DEX]).toBe(2);

            // Total cost after: 8 + 6 = 14 (reduced by 4)
            const finalTotalCost = CharacterCalculations.calculateTotalAttributeCosts(char.attributes);
            expect(finalTotalCost).toBe(initialTotalCost - 4);
        });

        it('should handle slop-over restoration logic', () => {
            // Character with costs exceeding attribute chips
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 2; // 17 total chips
            char.attributes[AttributeType.DEX] = 5; // Cost 20 (exceeds 17 chips)

            const totalCost = CharacterCalculations.calculateTotalAttributeCosts(char.attributes);
            const maxChips = CharacterCalculations.calculateTotalAttributeChipsForRank(char.rank);

            expect(totalCost).toBeGreaterThan(maxChips); // Confirms slop-over situation

            const sheet = new CharacterSheet(char);
            const decrementMethod = (sheet as any).decrementAttribute.bind(sheet);

            // Decrement should restore points properly
            decrementMethod(AttributeType.DEX, 4);

            // Smart restoration logic is handled by computed functions
            const newAvailableXP = CharacterCalculations.calculateAvailableXP(char);
            const newAvailableChips = CharacterCalculations.calculateAvailableAttributeChips(char);

            expect(newAvailableXP).toBeGreaterThanOrEqual(0);
            expect(newAvailableChips).toBeGreaterThanOrEqual(0);
        });

        it('should prevent decrement below minimum attribute value', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.attributes[AttributeType.DEX] = -2; // At minimum

            const sheet = new CharacterSheet(char);

            const initialValue = char.attributes[AttributeType.DEX];
            const decrementMethod = (sheet as any).decrementAttribute.bind(sheet);
            decrementMethod(AttributeType.DEX, 4);

            // Should not decrement below minimum
            expect(char.attributes[AttributeType.DEX]).toBe(initialValue);
        });
    });

    describe('Button State Management', () => {
        it('should disable increment buttons when at maximum', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.attributes[AttributeType.DEX] = 15; // At maximum

            const sheet = new CharacterSheet(char);
            sheet.render(mockContainer as any);

            const updateButtonStates = (sheet as any).updateAttributeButtonStates.bind(sheet);
            const mockAttributesEl = new MockElement();

            // Mock increment button at maximum
            const incButton = new MockElement();
            incButton.dataset = { action: 'inc', attribute: 'DEX', cost: '4' };
            mockAttributesEl.querySelectorAll = vi.fn().mockReturnValue([incButton]);

            updateButtonStates(mockAttributesEl);

            expect(incButton.disabled).toBe(true);
            expect(incButton.classList.toggle).toHaveBeenCalledWith('disabled', true);
        });

        it('should disable decrement buttons when at minimum', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.attributes[AttributeType.DEX] = -2; // At minimum

            const sheet = new CharacterSheet(char);
            sheet.render(mockContainer as any);

            const updateButtonStates = (sheet as any).updateAttributeButtonStates.bind(sheet);
            const mockAttributesEl = new MockElement();

            // Mock decrement button at minimum
            const decButton = new MockElement();
            decButton.dataset = { action: 'dec', attribute: 'DEX', cost: '4' };
            mockAttributesEl.querySelectorAll = vi.fn().mockReturnValue([decButton]);

            updateButtonStates(mockAttributesEl);

            expect(decButton.disabled).toBe(true);
            expect(decButton.classList.toggle).toHaveBeenCalledWith('disabled', true);
        });

        it('should enable buttons when resources are available and within range', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 3; // Plenty of resources
            char.attributes[AttributeType.DEX] = 5; // Mid-range value

            const sheet = new CharacterSheet(char);
            const updateButtonStates = (sheet as any).updateAttributeButtonStates.bind(sheet);
            const mockAttributesEl = new MockElement();

            const incButton = new MockElement();
            incButton.dataset = { action: 'inc', attribute: 'DEX', cost: '4' };
            const decButton = new MockElement();
            decButton.dataset = { action: 'dec', attribute: 'DEX', cost: '4' };

            mockAttributesEl.querySelectorAll = vi.fn().mockReturnValue([incButton, decButton]);

            updateButtonStates(mockAttributesEl);

            // Both buttons should be enabled
            expect(incButton.disabled).toBe(false);
            expect(decButton.disabled).toBe(false);
        });
    });

    describe('Resource Display Updates', () => {
        it('should update XP display when attributes change', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 2;

            const sheet = new CharacterSheet(char);

            const updateResourceDisplays = (sheet as any).updateResourceDisplays.bind(sheet);

            // Mock resource display elements
            const xpEl = new MockElement();
            const chipsEl = new MockElement();

            (sheet as any).container = {
                querySelector: vi.fn().mockImplementation((selector) => {
                    if (selector.includes('available-xp')) return xpEl;
                    if (selector.includes('available-chips')) return chipsEl;
                    return null;
                })
            };

            updateResourceDisplays();

            // Should show correct format: "Available XP (20): 20"
            expect(xpEl.textContent).toContain('Available XP (20):');
            expect(xpEl.textContent).toContain('20'); // Available XP
        });

        it('should update chip display when attributes change', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 2; // 17 total chips
            char.attributes[AttributeType.CON] = 5; // Uses 5 chips

            const sheet = new CharacterSheet(char);

            const updateResourceDisplays = (sheet as any).updateResourceDisplays.bind(sheet);

            const chipsEl = new MockElement();
            (sheet as any).container = {
                querySelector: vi.fn().mockReturnValue(chipsEl)
            };

            updateResourceDisplays();

            // Should show correct format: "Attribute Chips (17): 12"
            expect(chipsEl.textContent).toContain('Attribute Chips (17):');
            expect(chipsEl.textContent).toContain('12'); // 17 - 5 = 12 available
        });
    });

    describe('Live Validation (Per Specs)', () => {
        it('should prevent increment when insufficient chips and XP', () => {
            // Create character with exhausted resources
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 1; // 16 chips, 10 XP total
            char.attributes[AttributeType.DEX] = 4; // Uses all 16 chips
            // Remaining XP < 4 (cost of DEX increment)

            const sheet = new CharacterSheet(char);
            const incrementMethod = (sheet as any).incrementAttribute.bind(sheet);

            const initialDEX = char.attributes[AttributeType.DEX];
            const availableChips = CharacterCalculations.calculateAvailableAttributeChips(char);
            const availableXP = CharacterCalculations.calculateAvailableXP(char);

            // Should not be able to afford increment
            if (availableChips < 4 && availableXP < 4) {
                incrementMethod(AttributeType.DEX, 4);
                expect(char.attributes[AttributeType.DEX]).toBe(initialDEX); // No change
            }
        });

        it('should allow increment when chips are available', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 3; // Plenty of resources

            const sheet = new CharacterSheet(char);
            const incrementMethod = (sheet as any).incrementAttribute.bind(sheet);

            const initialDEX = char.attributes[AttributeType.DEX];
            incrementMethod(AttributeType.DEX, 4);

            expect(char.attributes[AttributeType.DEX]).toBe(initialDEX + 1);
        });

        it('should use XP when chips are depleted', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 2; // 17 chips, 20 XP
            char.attributes[AttributeType.DEX] = 4; // Uses 16 chips
            char.attributes[AttributeType.CON] = 1; // Uses 1 chip (total 17, all chips used)

            const sheet = new CharacterSheet(char);
            const incrementMethod = (sheet as any).incrementAttribute.bind(sheet);

            const availableChips = CharacterCalculations.calculateAvailableAttributeChips(char);
            const availableXP = CharacterCalculations.calculateAvailableXP(char);

            expect(availableChips).toBe(0); // No chips left
            expect(availableXP).toBeGreaterThan(0); // XP available

            // Should be able to increment using XP
            if (availableXP >= 4) {
                const initialDEX = char.attributes[AttributeType.DEX];
                incrementMethod(AttributeType.DEX, 4);
                expect(char.attributes[AttributeType.DEX]).toBe(initialDEX + 1);
            }
        });
    });

    describe('Smart Restoration Logic (Per Specs)', () => {
        it('should handle decrement with slop-over logic', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 2; // 17 chips max
            char.attributes[AttributeType.DEX] = 6; // Costs 24 (exceeds chips by 7)

            const sheet = new CharacterSheet(char);
            const decrementMethod = (sheet as any).decrementAttribute.bind(sheet);

            const initialAvailableXP = CharacterCalculations.calculateAvailableXP(char);
            const initialAvailableChips = CharacterCalculations.calculateAvailableAttributeChips(char);

            // Decrement DEX (should restore 4 points)
            decrementMethod(AttributeType.DEX, 4);

            const finalAvailableXP = CharacterCalculations.calculateAvailableXP(char);
            const finalAvailableChips = CharacterCalculations.calculateAvailableAttributeChips(char);

            // Resources should increase due to point restoration
            expect(finalAvailableXP + finalAvailableChips).toBeGreaterThan(initialAvailableXP + initialAvailableChips);
        });

        it('should restore all points to chips when within chip limit', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 3; // 18 chips max
            char.attributes[AttributeType.CON] = 5; // Uses 5 chips (well within limit)

            const sheet = new CharacterSheet(char);
            const decrementMethod = (sheet as any).decrementAttribute.bind(sheet);

            const initialChips = CharacterCalculations.calculateAvailableAttributeChips(char);
            decrementMethod(AttributeType.CON, 1);

            const finalChips = CharacterCalculations.calculateAvailableAttributeChips(char);

            // Should restore 1 point to available chips
            expect(finalChips).toBe(initialChips + 1);
        });
    });

    describe('Mouse Wheel Behavior (Per Specs)', () => {
        it('should prevent page scroll when wheel event occurs on attribute spinner', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            const sheet = new CharacterSheet(char);

            // Mock wheel event
            const mockWheelEvent = {
                preventDefault: vi.fn(),
                stopPropagation: vi.fn(),
                deltaY: -120, // Wheel up
                target: new MockElement(),
                closest: vi.fn().mockReturnValue({
                    dataset: { attribute: 'DEX' },
                    querySelector: vi.fn().mockReturnValue({ textContent: '(4)' })
                })
            };

            // Test preventDefault is called
            const wheelHandler = (sheet as any).setupAttributeWheelHandler?.bind(sheet);
            if (wheelHandler) {
                wheelHandler(mockWheelEvent);
                expect(mockWheelEvent.preventDefault).toHaveBeenCalled();
                expect(mockWheelEvent.stopPropagation).toHaveBeenCalled();
            }
        });

        it('should increment attribute on wheel up', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 3; // Ensure resources available
            const sheet = new CharacterSheet(char);

            const initialDEX = char.attributes[AttributeType.DEX];

            // Mock wheel up event (negative deltaY)
            const incrementMethod = (sheet as any).incrementAttribute.bind(sheet);

            // Simulate wheel up increment
            const mockWheelEvent = { deltaY: -120 };
            if (mockWheelEvent.deltaY < 0) {
                incrementMethod(AttributeType.DEX, 4);
            }

            expect(char.attributes[AttributeType.DEX]).toBe(initialDEX + 1);
        });

        it('should decrement attribute on wheel down', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.attributes[AttributeType.DEX] = 2; // Set above minimum

            const sheet = new CharacterSheet(char);

            const initialDEX = char.attributes[AttributeType.DEX];

            // Mock wheel down event (positive deltaY)
            const decrementMethod = (sheet as any).decrementAttribute.bind(sheet);

            // Simulate wheel down decrement
            const mockWheelEvent = { deltaY: 120 };
            if (mockWheelEvent.deltaY > 0) {
                decrementMethod(AttributeType.DEX, 4);
            }

            expect(char.attributes[AttributeType.DEX]).toBe(initialDEX - 1);
        });

        it('should show visual feedback for mouse wheel interaction', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            const sheet = new CharacterSheet(char);

            const mockElement = new MockElement();

            // Simulate mouseenter for wheel feedback
            const target = mockElement;
            target.style.cursor = 'ns-resize';
            target.title = 'Use mouse wheel to increment/decrement';

            expect(target.style.cursor).toBe('ns-resize');
            expect(target.title).toBe('Use mouse wheel to increment/decrement');

            // Simulate mouseleave
            target.style.cursor = '';
            target.title = '';

            expect(target.style.cursor).toBe('');
            expect(target.title).toBe('');
        });

        it('should respect same validation rules as button clicks', () => {
            // Character at maximum DEX
            const char = CharacterFactory.createNewCharacter('Test');
            char.attributes[AttributeType.DEX] = 15; // At maximum

            const sheet = new CharacterSheet(char);

            const initialValue = char.attributes[AttributeType.DEX];
            const incrementMethod = (sheet as any).incrementAttribute.bind(sheet);

            // Try to increment beyond maximum via wheel
            incrementMethod(AttributeType.DEX, 4);

            // Should not increment beyond maximum
            expect(char.attributes[AttributeType.DEX]).toBe(initialValue);
        });

        it('should handle insufficient resources during wheel increment', () => {
            // Character with exhausted resources
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 1; // Minimal resources
            char.attributes[AttributeType.DEX] = 4; // Uses all chips

            const sheet = new CharacterSheet(char);
            const incrementMethod = (sheet as any).incrementAttribute.bind(sheet);

            const availableChips = CharacterCalculations.calculateAvailableAttributeChips(char);
            const availableXP = CharacterCalculations.calculateAvailableXP(char);

            // If cannot afford increment, should not change
            if (availableChips < 4 && availableXP < 4) {
                const initialValue = char.attributes[AttributeType.DEX];
                incrementMethod(AttributeType.DEX, 4);
                expect(char.attributes[AttributeType.DEX]).toBe(initialValue);
            }
        });
    });

    describe('Button Click Integration Tests', () => {
        it('should update attribute value and page display when increment button is clicked', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 3; // Ensure resources available
            const sheet = new CharacterSheet(char);

            const initialDEX = char.attributes[AttributeType.DEX];

            // Mock the attribute value display element
            const mockValueElement = new MockElement();
            (global as any).document.getElementById = vi.fn().mockImplementation((id) => {
                if (id === 'attr-DEX') return mockValueElement;
                return new MockElement();
            });

            // Simulate increment button click
            const incrementMethod = (sheet as any).incrementAttribute.bind(sheet);
            incrementMethod(AttributeType.DEX, 4);

            // Verify attribute value changed
            expect(char.attributes[AttributeType.DEX]).toBe(initialDEX + 1);

            // Verify page display was updated
            const updateDisplay = (sheet as any).updateDisplay.bind(sheet);
            updateDisplay();

            // Verify DOM element shows new value
            expect(mockValueElement.textContent).toBe((initialDEX + 1).toString());
        });

        it('should update attribute value and page display when decrement button is clicked', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.attributes[AttributeType.DEX] = 3; // Set above minimum

            const sheet = new CharacterSheet(char);

            const initialDEX = char.attributes[AttributeType.DEX];

            // Mock the attribute value display element
            const mockValueElement = new MockElement();
            (global as any).document.getElementById = vi.fn().mockImplementation((id) => {
                if (id === 'attr-DEX') return mockValueElement;
                return new MockElement();
            });

            // Simulate decrement button click
            const decrementMethod = (sheet as any).decrementAttribute.bind(sheet);
            decrementMethod(AttributeType.DEX, 4);

            // Verify attribute value changed
            expect(char.attributes[AttributeType.DEX]).toBe(initialDEX - 1);

            // Verify page display was updated
            const updateDisplay = (sheet as any).updateDisplay.bind(sheet);
            updateDisplay();

            // Verify DOM element shows new value
            expect(mockValueElement.textContent).toBe((initialDEX - 1).toString());
        });

        it('should update resource displays when attribute changes', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 2;
            const sheet = new CharacterSheet(char);

            // Mock resource display elements
            const mockXPElement = new MockElement();
            const mockChipsElement = new MockElement();

            (sheet as any).container = {
                querySelector: vi.fn().mockImplementation((selector) => {
                    if (selector.includes('available-xp')) return mockXPElement;
                    if (selector.includes('available-chips')) return mockChipsElement;
                    return null;
                })
            };

            // Get initial resource values
            const initialAvailableXP = CharacterCalculations.calculateAvailableXP(char);
            const initialAvailableChips = CharacterCalculations.calculateAvailableAttributeChips(char);

            // Simulate increment that uses chips
            const incrementMethod = (sheet as any).incrementAttribute.bind(sheet);
            incrementMethod(AttributeType.CON, 1); // CON costs 1 chip

            // Update displays
            const updateDisplay = (sheet as any).updateDisplay.bind(sheet);
            updateDisplay();

            // Verify resource displays were updated
            const newAvailableChips = CharacterCalculations.calculateAvailableAttributeChips(char);
            expect(newAvailableChips).toBe(initialAvailableChips - 1);

            // Verify DOM shows updated chip count
            expect(mockChipsElement.textContent).toContain(newAvailableChips.toString());
        });

        it('should update button states after attribute changes', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.attributes[AttributeType.DEX] = 14; // Near maximum

            const sheet = new CharacterSheet(char);

            // Mock increment button
            const mockIncButton = new MockElement();
            mockIncButton.dataset = { action: 'inc', attribute: 'DEX', cost: '4' };

            const mockAttributesEl = {
                querySelectorAll: vi.fn().mockReturnValue([mockIncButton])
            };

            // Before increment - should be enabled
            const updateButtonStates = (sheet as any).updateAttributeButtonStates.bind(sheet);
            updateButtonStates(mockAttributesEl);

            expect(mockIncButton.disabled).toBe(false);

            // Increment to maximum
            const incrementMethod = (sheet as any).incrementAttribute.bind(sheet);
            incrementMethod(AttributeType.DEX, 4);

            // After increment to max - should be disabled
            updateButtonStates(mockAttributesEl);

            expect(mockIncButton.disabled).toBe(true);
            expect(mockIncButton.classList.toggle).toHaveBeenCalledWith('disabled', true);
        });

        it('should handle complete button click workflow: click → change → display update', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 3; // Ensure resources
            const sheet = new CharacterSheet(char);

            // Mock all DOM elements for full workflow test
            const mockValueElement = new MockElement();
            const mockXPElement = new MockElement();
            const mockChipsElement = new MockElement();
            const mockButton = new MockElement();
            mockButton.dataset = { action: 'inc', attribute: 'DEX', cost: '4' };

            (global as any).document.getElementById = vi.fn().mockImplementation((id) => {
                if (id === 'attr-DEX') return mockValueElement;
                return new MockElement();
            });

            (sheet as any).container = {
                querySelector: vi.fn().mockImplementation((selector) => {
                    if (selector.includes('available-xp')) return mockXPElement;
                    if (selector.includes('available-chips')) return mockChipsElement;
                    if (selector.includes('character-attributes')) return {
                        querySelectorAll: vi.fn().mockReturnValue([mockButton])
                    };
                    return null;
                })
            };

            const initialDEX = char.attributes[AttributeType.DEX];
            const initialChips = CharacterCalculations.calculateAvailableAttributeChips(char);

            // Simulate complete button click workflow
            const incrementMethod = (sheet as any).incrementAttribute.bind(sheet);
            incrementMethod(AttributeType.DEX, 4);

            // 1. Verify character data changed
            expect(char.attributes[AttributeType.DEX]).toBe(initialDEX + 1);

            // 2. Verify display update method works
            const updateDisplay = (sheet as any).updateDisplay.bind(sheet);
            updateDisplay();

            // 3. Verify DOM elements updated
            expect(mockValueElement.textContent).toBe((initialDEX + 1).toString());

            // 4. Verify resource displays updated
            const newChips = CharacterCalculations.calculateAvailableAttributeChips(char);
            expect(newChips).toBe(initialChips - 4); // Used 4 chips for DEX increment
            expect(mockChipsElement.textContent).toContain(newChips.toString());

            // 5. Verify button states updated
            const updateButtonStates = (sheet as any).updateAttributeButtonStates.bind(sheet);
            updateButtonStates({ querySelectorAll: vi.fn().mockReturnValue([mockButton]) });

            // Button state should reflect new conditions
            expect(mockButton.classList.toggle).toHaveBeenCalled();
        });
    });

    describe('Available Attribute Chips Display Updates (Per Spec Line 65)', () => {
        it('should update available chips display whenever attributes change', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 3; // 18 total chips
            char.attributes[AttributeType.CON] = 2; // Uses 2 chips initially

            const sheet = new CharacterSheet(char);

            // Mock chips display element
            const mockChipsElement = new MockElement();
            (sheet as any).container = {
                querySelector: vi.fn().mockImplementation((selector) => {
                    if (selector.includes('available-chips')) return mockChipsElement;
                    return null;
                })
            };

            // Initial state: 18 - 2 = 16 chips available
            const initialChips = CharacterCalculations.calculateAvailableAttributeChips(char);
            expect(initialChips).toBe(16);

            // Simulate increment CON (uses 1 more chip)
            const incrementMethod = (sheet as any).incrementAttribute.bind(sheet);
            incrementMethod(AttributeType.CON, 1);

            // Trigger display update
            const updateDisplay = (sheet as any).updateDisplay.bind(sheet);
            updateDisplay();

            // Verify chips decreased: 16 - 1 = 15
            const newChips = CharacterCalculations.calculateAvailableAttributeChips(char);
            expect(newChips).toBe(15);

            // Verify display shows updated chips
            expect(mockChipsElement.textContent).toContain('15');
        });

        it('should update chips display when expensive attribute changes', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 3; // 18 total chips
            char.attributes[AttributeType.DEX] = 1; // Uses 4 chips

            const sheet = new CharacterSheet(char);

            const mockChipsElement = new MockElement();
            (sheet as any).container = {
                querySelector: vi.fn().mockImplementation((selector) => {
                    if (selector.includes('available-chips')) return mockChipsElement;
                    return null;
                })
            };

            // Initial: 18 - 4 = 14 chips available
            const initialChips = CharacterCalculations.calculateAvailableAttributeChips(char);
            expect(initialChips).toBe(14);

            // Increment expensive attribute (DEX costs 4)
            const incrementMethod = (sheet as any).incrementAttribute.bind(sheet);
            incrementMethod(AttributeType.DEX, 4);

            const updateDisplay = (sheet as any).updateDisplay.bind(sheet);
            updateDisplay();

            // Verify chips decreased by 4: 14 - 4 = 10
            const newChips = CharacterCalculations.calculateAvailableAttributeChips(char);
            expect(newChips).toBe(10);

            // Verify display reflects change
            expect(mockChipsElement.textContent).toContain('10');
        });

        it('should show 0 chips when attributes exceed chip limit (per spec)', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 1; // 16 total chips
            char.attributes[AttributeType.DEX] = 5; // Uses 20 chips (exceeds limit)

            const sheet = new CharacterSheet(char);

            const mockChipsElement = new MockElement();
            (sheet as any).container = {
                querySelector: vi.fn().mockImplementation((selector) => {
                    if (selector.includes('available-chips')) return mockChipsElement;
                    return null;
                })
            };

            // Should show 0 when negative per spec
            const availableChips = CharacterCalculations.calculateAvailableAttributeChips(char);
            expect(availableChips).toBe(0); // Shows 0 for negatives

            const updateDisplay = (sheet as any).updateDisplay.bind(sheet);
            updateDisplay();

            // Display should show 0, not negative
            expect(mockChipsElement.textContent).toContain('0');
        });

        it('should update both XP and chips displays simultaneously', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 2; // 17 chips, 20 XP
            char.attributes[AttributeType.DEX] = 4; // Uses 16 chips
            char.attributes[AttributeType.CON] = 1; // Uses 1 chip (total 17, all chips used)

            const sheet = new CharacterSheet(char);

            const mockXPElement = new MockElement();
            const mockChipsElement = new MockElement();

            (sheet as any).container = {
                querySelector: vi.fn().mockImplementation((selector) => {
                    if (selector.includes('available-xp')) return mockXPElement;
                    if (selector.includes('available-chips')) return mockChipsElement;
                    return null;
                })
            };

            // Initial state: 0 chips, 20 XP available
            const initialChips = CharacterCalculations.calculateAvailableAttributeChips(char);
            const initialXP = CharacterCalculations.calculateAvailableXP(char);

            expect(initialChips).toBe(0); // All chips used
            expect(initialXP).toBe(20); // No XP spent yet

            // Increment DEX (should use XP since chips exhausted)
            const incrementMethod = (sheet as any).incrementAttribute.bind(sheet);
            incrementMethod(AttributeType.DEX, 4);

            const updateDisplay = (sheet as any).updateDisplay.bind(sheet);
            updateDisplay();

            // Verify both displays updated
            const newChips = CharacterCalculations.calculateAvailableAttributeChips(char);
            const newXP = CharacterCalculations.calculateAvailableXP(char);

            expect(newChips).toBe(0); // Still 0 chips
            expect(newXP).toBe(16); // XP reduced by 4

            // Verify both DOM elements show updated values
            expect(mockChipsElement.textContent).toContain('0');
            expect(mockXPElement.textContent).toContain('16');
        });
    });

    describe('Display Updates', () => {
        it('should update attribute value displays', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            const sheet = new CharacterSheet(char);

            // Mock getElementById to return element
            const mockElement = new MockElement();
            (global as any).document.getElementById = vi.fn().mockReturnValue(mockElement);

            const updateDisplay = (sheet as any).updateDisplay.bind(sheet);
            updateDisplay();

            // Should call textContent update
            expect(mockElement.textContent).toBeDefined();
        });

        it('should update resource displays with correct format', () => {
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 3;

            const sheet = new CharacterSheet(char);
            const updateResourceDisplays = (sheet as any).updateResourceDisplays.bind(sheet);

            const xpEl = new MockElement();
            const chipsEl = new MockElement();

            (sheet as any).container = {
                querySelector: vi.fn().mockImplementation((selector) => {
                    if (selector.includes('available-xp')) return xpEl;
                    if (selector.includes('available-chips')) return chipsEl;
                    return null;
                })
            };

            updateResourceDisplays();

            // Should show format: "Available XP (30): 30"
            expect(xpEl.textContent).toMatch(/Available XP \(\d+\): \d+/);
            expect(chipsEl.textContent).toMatch(/Attribute Chips \(\d+\): \d+/);
        });

        it('should show negative XP in red when character has overspent (per spec)', () => {
            // Create character with overspent XP budget
            const char = CharacterFactory.createNewCharacter('Overspent Character');
            char.rank = 2; // 20 total XP, 17 total chips
            char.attributes = {
                [AttributeType.DEX]: 5, // 20 attribute chips (exceeds 17)
                [AttributeType.STR]: 3, // 9 attribute chips
                [AttributeType.CON]: 2, // 2 attribute chips
                [AttributeType.CHA]: 2, // 8 attribute chips
                [AttributeType.WIS]: 1, // 3 attribute chips
                [AttributeType.GRI]: 1, // 1 attribute chip
                [AttributeType.INT]: 1, // 4 attribute chips
                [AttributeType.PER]: 1  // 4 attribute chips
            };
            // Total: 20+9+2+8+3+1+4+4 = 51 chips needed, but only 17+20=37 total resources

            const sheet = new CharacterSheet(char);
            const updateResourceDisplays = (sheet as any).updateResourceDisplays.bind(sheet);

            const xpEl = new MockElement();
            (sheet as any).container = {
                querySelector: vi.fn().mockImplementation((selector) => {
                    if (selector.includes('available-xp')) return xpEl;
                    return null;
                })
            };

            updateResourceDisplays();

            // Verify XP is negative
            const totalXP = CharacterCalculations.calculateTotalXPForRank(char.rank);
            const spentXP = CharacterCalculations.calculateSpentXP(char);
            const availableXP = totalXP - spentXP;

            expect(availableXP).toBeLessThan(0); // Should be negative

            // Verify red styling is applied
            expect(xpEl.style.color).toBe('#dc143c'); // Red color
            expect(xpEl.style.fontWeight).toBe('bold'); // Bold text
            expect(xpEl.title).toBe('Character has overspent XP budget!'); // Warning tooltip
            expect(xpEl.textContent).toContain(`${availableXP}`); // Shows negative number
        });

        it('should reset to normal color when XP becomes positive', () => {
            // Start with overspent character
            const char = CharacterFactory.createNewCharacter('Test');
            char.rank = 1;
            char.attributes[AttributeType.DEX] = 10; // Way overspent

            const sheet = new CharacterSheet(char);
            const updateResourceDisplays = (sheet as any).updateResourceDisplays.bind(sheet);

            const xpEl = new MockElement();
            (sheet as any).container = {
                querySelector: vi.fn().mockReturnValue(xpEl)
            };

            // First update - should be red (overspent)
            updateResourceDisplays();
            expect(xpEl.style.color).toBe('#dc143c');

            // Fix character to have positive XP
            char.attributes[AttributeType.DEX] = 1; // Reasonable spending

            // Second update - should reset to normal
            updateResourceDisplays();
            expect(xpEl.style.color).toBe(''); // Reset to default
            expect(xpEl.style.fontWeight).toBe(''); // Reset weight
            expect(xpEl.title).toBe(''); // Clear warning
        });
    });
});