// Colorful Random Dots Animation using PIXI.js
// This version is optimized for performance with many particles

// Create a PIXI Application
const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x000000,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: false
});
document.body.appendChild(app.view);

// Configuration Parameters
const ENDGAME_CONFIG = {
    particleCount: 10000,       // Number of dots
    backgroundColor: 0x000000, // Background color
    moveSpeed: 10,              // Base movement speed
    blurForce: 5,              // Blur amount (0-10)
    directionChangeProbability: 0.05, // Probability of changing direction
    keyForceFraction: 0.3,     // Fraction of dots affected by key press
    particleSize: 3,           // Fixed particle size
    particleAlpha: 0.8         // Particle opacity (0-1)
};

// Direction constants (only 4 directions)
const DIRECTIONS = [
    { vx: 0, vy: -1 },  // Up
    { vx: 1, vy: 0 },   // Right
    { vx: 0, vy: 1 },   // Down
    { vx: -1, vy: 0 }   // Left
];

// Keyboard state
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// Particles array
const particles = [];

// Create main container for particles (NOT using ParticleContainer for better filter support)
const mainContainer = new PIXI.Container();
app.stage.addChild(mainContainer);

// Create dot texture (more efficient than drawing each frame)
function createDotTexture() {
    const gfx = new PIXI.Graphics();
    gfx.beginFill(0xFFFFFF);
    gfx.drawCircle(0, 0, ENDGAME_CONFIG.particleSize);
    gfx.endFill();
    return app.renderer.generateTexture(gfx);
}

// Initialize particles
function init() {
    // Create a shared texture for all particles
    const dotTexture = createDotTexture();

    // Create particles
    for (let i = 0; i < ENDGAME_CONFIG.particleCount; i++) {
        // Create sprite with shared texture
        const particle = new PIXI.Sprite(dotTexture);

        // Set anchor to center
        particle.anchor.set(0.5);

        // Random position
        particle.x = Math.random() * app.screen.width;
        particle.y = Math.random() * app.screen.height;

        // Random color
        particle.tint = Math.random() * 0xFFFFFF;

        // Set alpha
        particle.alpha = ENDGAME_CONFIG.particleAlpha;

        // Pick a random direction (0-3)
        const dirIndex = Math.floor(Math.random() * 4);

        // Store extra data
        particle.direction = dirIndex;
        particle.speed = ENDGAME_CONFIG.moveSpeed;
        particle.forcedDirection = null;

        // Add to container
        mainContainer.addChild(particle);

        // Add to tracking array
        particles.push(particle);
    }

    // Apply blur
    updateBlur();
}

// Update particle positions
function updateParticles(delta) {
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Random direction change
        if (Math.random() < ENDGAME_CONFIG.directionChangeProbability) {
            p.direction = Math.floor(Math.random() * 4);
            p.forcedDirection = null;
        }

        // Get current direction
        let dirIndex = p.forcedDirection !== null ? p.forcedDirection : p.direction;
        const dir = DIRECTIONS[dirIndex];

        // Update position
        p.x += dir.vx * p.speed * delta;
        p.y += dir.vy * p.speed * delta;

        // Wrap around edges
        if (p.x < 0) p.x = app.screen.width;
        if (p.x > app.screen.width) p.x = 0;
        if (p.y < 0) p.y = app.screen.height;
        if (p.y > app.screen.height) p.y = 0;
    }
}

// Update blur filter
function updateBlur() {
    // Remove existing filters
    mainContainer.filters = [];

    // Apply blur if needed
    if (ENDGAME_CONFIG.blurForce > 0) {
        const blurFilter = new PIXI.filters.BlurFilter(ENDGAME_CONFIG.blurForce);
        blurFilter.quality = 2; // Balance between quality and performance
        blurFilter.autoFit = true;
        mainContainer.filters = [blurFilter];
    }
}


// Main game loop
function gameLoop(delta) {
    processKeys();
    updateParticles(delta);
}

// Initialize and start
function start() {
    init();
    setupEventListeners();
    app.ticker.add(gameLoop);
}
start();


// Setup event listeners
function setupEventListeners() {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
        switch (e.key.toLowerCase()) {
            case 'w': keys.w = true; break;
            case 'a': keys.a = true; break;
            case 's': keys.s = true; break;
            case 'd': keys.d = true; break;
        }
    });

    window.addEventListener('keyup', (e) => {
        switch (e.key.toLowerCase()) {
            case 'w': keys.w = false; break;
            case 'a': keys.a = false; break;
            case 's': keys.s = false; break;
            case 'd': keys.d = false; break;
        }
    });

    // Resize event
    window.addEventListener('resize', () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
    });
}

// Process key presses
function processKeys() {
    // Check which keys are pressed
    let direction = null;
    let dirIndex = -1;

    if (keys.w) { direction = 'w'; dirIndex = 0; }
    if (keys.d) { direction = 'd'; dirIndex = 1; }
    if (keys.s) { direction = 's'; dirIndex = 2; }
    if (keys.a) { direction = 'a'; dirIndex = 3; }

    // Apply force to a fraction of particles
    if (direction) {
        const forcedCount = Math.floor(particles.length * ENDGAME_CONFIG.keyForceFraction);
        for (let i = 0; i < forcedCount; i++) {
            const index = Math.floor(Math.random() * particles.length);
            particles[index].forcedDirection = dirIndex;
        }
    }
}
