// Simple version to test basic functionality

console.log('Main.ts loading...');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');

    const app = document.getElementById('app');
    if (!app) {
        console.error('App container not found');
        return;
    }

    console.log('App container found');

    app.innerHTML = `
        <div style="
            background: linear-gradient(45deg, #8b4513 0%, #deb887 25%, #f4a460 50%, #deb887 75%, #8b4513 100%);
            min-height: 100vh;
            padding: 40px;
            text-align: center;
            font-family: Arial, sans-serif;
            color: #3d2914;
        ">
            <h1 style="
                font-size: 3rem;
                color: #8b4513;
                text-shadow: 2px 2px 0px #000;
                margin-bottom: 20px;
            ">Don't Go Hollow</h1>

            <p style="font-size: 1.5rem; margin-bottom: 30px;">
                Welcome to the frontier!
            </p>

            <div style="margin-bottom: 20px;">
                <button id="test-btn" style="
                    background: linear-gradient(45deg, #deb887, #f4a460);
                    border: 2px solid #8b4513;
                    color: #3d2914;
                    padding: 15px 30px;
                    font-size: 1.2rem;
                    font-weight: bold;
                    border-radius: 4px;
                    cursor: pointer;
                ">Click Me - Test Button</button>
            </div>

            <div style="
                background: rgba(255,248,220,0.8);
                border: 2px solid #8b4513;
                border-radius: 8px;
                padding: 20px;
                margin: 20px auto;
                max-width: 500px;
            ">
                <h2>Status</h2>
                <p id="status">Application loaded successfully!</p>
            </div>
        </div>
    `;

    const testBtn = app.querySelector('#test-btn');
    if (testBtn) {
        testBtn.addEventListener('click', () => {
            const status = app.querySelector('#status');
            if (status) {
                status.textContent = 'Button clicked! JavaScript is working.';
            }
        });
    }

    console.log('Simple app initialized');
});