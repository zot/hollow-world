// Simple Character Manager View to get the app running

import { IUIComponent } from './SplashScreen.js';

export interface ICharacterManager extends IUIComponent {
    onBackToMenu?: () => void;
    onCharacterSelected?: (character: any) => void;
}

export class CharacterManagerView implements ICharacterManager {
    private container: HTMLElement | null = null;

    public onBackToMenu?: () => void;
    public onCharacterSelected?: (character: any) => void;

    constructor() {
    }

    render(container: HTMLElement): void {
        if (!container) {
            throw new Error('Container element is required');
        }

        this.container = container;

        const html = `
            <div style="
                font-family: 'Rye', serif;
                background: linear-gradient(45deg, #8b4513, #deb887, #f4a460, #deb887, #8b4513);
                min-height: 100vh;
                padding: 40px;
                color: #3d2914;
                text-align: center;
            ">
                <h1 style="
                    font-family: 'Sancreek', serif;
                    font-size: 3rem;
                    color: #8b4513;
                    text-shadow: 2px 2px 0px #000, 3px 3px 0px #654321;
                    margin-bottom: 40px;
                ">Character Manager</h1>

                <div style="
                    background: rgba(255,248,220,0.9);
                    border: 3px solid #8b4513;
                    border-radius: 8px;
                    padding: 40px;
                    margin: 0 auto;
                    max-width: 600px;
                ">
                    <h2>Character management coming soon!</h2>
                    <p>This is where you'll manage your frontier characters.</p>

                    <div style="margin-top: 40px;">
                        <button id="back-to-menu-btn" style="
                            font-family: 'Rye', serif;
                            background: linear-gradient(45deg, #deb887, #f4a460);
                            border: 2px solid #8b4513;
                            color: #3d2914;
                            padding: 15px 30px;
                            font-size: 1.2rem;
                            font-weight: bold;
                            border-radius: 4px;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        ">Back to Menu</button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Set up event listeners
        const backButton = container.querySelector('#back-to-menu-btn');
        if (backButton) {
            backButton.addEventListener('click', () => {
                if (this.onBackToMenu) {
                    this.onBackToMenu();
                }
            });
        }

        this.applyStyles();
    }

    destroy(): void {
        if (this.container) {
            this.container.innerHTML = '';
            this.container = null;
        }
    }

    private applyStyles(): void {
        if (!document.getElementById('character-manager-simple-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'character-manager-simple-styles';
            styleSheet.textContent = `
                @import url('https://fonts.googleapis.com/css2?family=Rye&family=Sancreek&display=swap');

                #back-to-menu-btn:hover {
                    background: linear-gradient(45deg, #f4a460, #ffd700) !important;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                }
            `;
            document.head.appendChild(styleSheet);
        }
    }
}