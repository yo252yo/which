// Colorful Random Dots Animation using PIXI.js
// This version is optimized for performance with many particles

// Create a PIXI Application
const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: ENDGAME_CONFIG.backgroundColor,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: false
});
document.body.appendChild(app.view);


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

if (window.OPT_ENDING_EASY_WIN) {
    app.stage.interactive = true;

    app.stage.on('pointerdown', (event) => {
        window.REQ_WIN();
    });
}

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

        // Add to container
        mainContainer.addChild(particle);

        // Add to tracking array
        particles.push(particle);


        particle.interactive = true;
        particle.on('pointerdown', () => {
            if (window.REQ_WIN) {
                window.REQ_WIN();
            }
        });
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
        }

        const dir = DIRECTIONS[p.direction];

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
    updateParticles(delta);
}


init();
app.ticker.add(gameLoop);

//const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    switch (e.key.toLowerCase()) {
        // Normal
        case 'w': applyDirection(0); break; // Up
        case 'a': applyDirection(3); break; // Left
        // French =/
        case 'z': applyDirection(0); break; // Up
        case 'q': applyDirection(3); break; // Left
        case 's': applyDirection(2); break; // Down
        case 'd': applyDirection(1); break; // Right
    }
});


function applyDirection(dirIndex) {
    const forcedCount = Math.floor(particles.length * ENDGAME_CONFIG.keyForceFraction);

    for (let i = 0; i < 3; i++) {
        particles[i].direction = dirIndex;
    }
    for (let i = 3; i < forcedCount; i++) {
        const index = Math.floor(Math.random() * particles.length);
        particles[index].direction = dirIndex;
    }
}

let touchStartTime = 0;
let touchStartPos = { x: 0, y: 0 };
let isTouching = false;
let longPressThreshold = 50; // ms

// Set up touch/mouse controls
function handleTouchStart(event) {
    const eventPos = event.touches ?
        { x: event.touches[0].clientX, y: event.touches[0].clientY } :
        { x: event.clientX, y: event.clientY };

    touchStartTime = Date.now();
    touchStartPos = eventPos;
    isTouching = true;
}

function handleTouchMove(event) {
    if (!isTouching) return;

    const currentTime = Date.now();
    if (currentTime - touchStartTime >= longPressThreshold) {
        const eventPos = event.touches ?
            { x: event.touches[0].clientX, y: event.touches[0].clientY } :
            { x: event.clientX, y: event.clientY };

        // Calculate direction based on the difference between current and start position
        const dx = eventPos.x - touchStartPos.x;
        const dy = eventPos.y - touchStartPos.y;

        // Determine primary direction (the one with larger magnitude)
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) {
                applyDirection(1);
            } else {
                applyDirection(3);
            }
        } else {
            if (dy > 0) {
                applyDirection(2);
            } else {
                applyDirection(0);
            }
        }
    }
}

function handleTouchEnd() {
    isTouching = false;
}

// Add touch/mouse event listeners
window.addEventListener('mousedown', handleTouchStart);
window.addEventListener('mousemove', handleTouchMove);
window.addEventListener('mouseup', handleTouchEnd);

window.addEventListener('touchstart', handleTouchStart);
window.addEventListener('touchmove', handleTouchMove);
window.addEventListener('touchend', handleTouchEnd);