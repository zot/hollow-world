function createApp(): void {
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = `
            <h1>Welcome to HollowWorld</h1>
            <p>A TypeScript single-page application</p>
        `;
    }
}

document.addEventListener('DOMContentLoaded', createApp);