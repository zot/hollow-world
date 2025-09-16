console.log('Debug main.ts loading...');

// Test basic functionality first
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded');

    const app = document.getElementById('app');
    if (!app) {
        console.error('App container not found');
        return;
    }

    console.log('App container found');

    // Test basic rendering
    app.innerHTML = `
        <div style="
            background: linear-gradient(45deg, #8b4513 0%, #deb887 25%, #f4a460 50%, #deb887 75%, #8b4513 100%);
            min-height: 100vh;
            padding: 40px;
            text-align: center;
            color: #3d2914;
        ">
            <h1 style="
                font-family: 'Sancreek', serif;
                font-size: 3rem;
                color: #8b4513;
                text-shadow: 2px 2px 0px #000;
                margin-bottom: 20px;
            ">Don't Go <span style="color: #00ff00; text-shadow: 0 0 20px #00ff00;">Hollow</span></h1>

            <p style="font-size: 1.5rem; margin-bottom: 30px;">
                Peer ID: test-peer-123
            </p>

            <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 40px;">
                <button id="join-btn" style="
                    background: linear-gradient(45deg, #deb887, #f4a460);
                    border: 2px solid #8b4513;
                    color: #3d2914;
                    padding: 15px 30px;
                    font-size: 1.2rem;
                    font-weight: bold;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: 'Rye', serif;
                ">Join Game</button>

                <button id="start-btn" style="
                    background: linear-gradient(45deg, #deb887, #f4a460);
                    border: 2px solid #8b4513;
                    color: #3d2914;
                    padding: 15px 30px;
                    font-size: 1.2rem;
                    font-weight: bold;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: 'Rye', serif;
                ">Start Game</button>

                <button id="characters-btn" style="
                    background: linear-gradient(45deg, #deb887, #f4a460);
                    border: 2px solid #8b4513;
                    color: #3d2914;
                    padding: 15px 30px;
                    font-size: 1.2rem;
                    font-weight: bold;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: 'Rye', serif;
                ">Characters</button>
            </div>

            <div id="status" style="
                background: rgba(255,248,220,0.8);
                border: 2px solid #8b4513;
                border-radius: 8px;
                padding: 20px;
                margin: 20px auto;
                max-width: 500px;
            ">
                <h2>Status</h2>
                <p>Basic app loaded successfully!</p>
            </div>
        </div>
    `;

    // Add click handlers
    const joinBtn = app.querySelector('#join-btn');
    const startBtn = app.querySelector('#start-btn');
    const charactersBtn = app.querySelector('#characters-btn');
    const status = app.querySelector('#status p');

    if (joinBtn) {
        joinBtn.addEventListener('click', () => {
            if (status) status.textContent = 'Join Game clicked!';
        });
    }

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (status) status.textContent = 'Start Game clicked!';
        });
    }

    if (charactersBtn) {
        charactersBtn.addEventListener('click', () => {
            if (status) status.textContent = 'Characters clicked!';
            // Switch to character view
            showCharacterView();
        });
    }

    console.log('Basic app initialized');
});

function showCharacterView() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
        <div style="
            background: linear-gradient(45deg, #8b4513 0%, #deb887 25%, #f4a460 50%, #deb887 75%, #8b4513 100%);
            min-height: 100vh;
            padding: 40px;
            text-align: center;
            color: #3d2914;
        ">
            <h1 style="
                font-family: 'Sancreek', serif;
                font-size: 3rem;
                color: #8b4513;
                text-shadow: 2px 2px 0px #000;
                margin-bottom: 20px;
            ">Character Manager</h1>

            <div style="
                background: rgba(255,248,220,0.8);
                border: 2px solid #8b4513;
                border-radius: 8px;
                padding: 40px;
                margin: 20px auto;
                max-width: 600px;
            ">
                <h2>Character management coming soon!</h2>
                <p>This is where you'll manage your frontier characters.</p>

                <button id="back-btn" style="
                    background: linear-gradient(45deg, #696969, #808080);
                    border: 2px solid #2f4f4f;
                    color: white;
                    padding: 15px 30px;
                    font-size: 1.2rem;
                    font-weight: bold;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: 'Rye', serif;
                    margin-top: 20px;
                ">Back to Menu</button>
            </div>
        </div>
    `;

    const backBtn = app.querySelector('#back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            location.reload(); // Simple way to go back
        });
    }
}

// Add fonts
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Rye&family=Sancreek&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);