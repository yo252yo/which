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

if (localStorage.getItem("epilepsy") === "true") {
    app.ticker.maxFPS = 1;

    ENDGAME_CONFIG.moveSpeed /= 10;

    // Create a fullscreen gray overlay
    const grayOverlay = new PIXI.Graphics();
    grayOverlay.beginFill(0xAAAAAA, 0.6);
    grayOverlay.drawRect(0, 0, app.screen.width, app.screen.height);
    grayOverlay.endFill();

    // Add overlay to stage
    app.stage.addChild(grayOverlay);
}


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

const GRID_COLS = 4;
const GRID_ROWS = 4;
const regionWidth = app.screen.width / GRID_COLS;
const regionHeight = app.screen.height / GRID_ROWS;
const FLOCKS = {};
// Initialize particles
function init() {
    // Create a shared texture for all particles
    const dotTexture = createDotTexture();

    // Calculate particles per region (evenly distributed)
    const particlesPerRegion = Math.ceil(ENDGAME_CONFIG.particleCount / (GRID_COLS * GRID_ROWS));

    let flock_index = 1;
    FLOCKS[flock_index] = [];
    // Create particles for each region
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            // Calculate region boundaries
            const regionX = col * regionWidth;
            const regionY = row * regionHeight;

            // Spawn particles in this region
            let flock_size = 1;
            let dirIndex = Math.floor(Math.random() * 4);
            let tint = Math.random() * 0xFFFFFF;
            let centerX = regionX + (Math.random() * regionWidth);
            let centerY = regionY + (Math.random() * regionHeight);
            for (let i = 0; i < particlesPerRegion; i++) {
                // Skip if we've reached the total particle count
                if (particles.length >= ENDGAME_CONFIG.particleCount) break;

                // Create sprite with shared texture
                const particle = new PIXI.Sprite(dotTexture);
                particle.flock = flock_index;
                FLOCKS[flock_index].push(particle);
                // Set anchor to center
                particle.anchor.set(0.5);
                // Position within this region
                let varX = Math.floor(Math.random() * 100) - 50;
                let varY = Math.floor(Math.random() * 100) - 50;
                particle.x = Math.max(0, Math.min(centerX + varX, regionX + regionWidth));
                particle.y = Math.max(0, Math.min(centerY + varY, regionY + regionHeight));
                // Random color
                particle.tint = tint;
                // Set alpha
                particle.alpha = ENDGAME_CONFIG.particleAlpha;
                // Store extra data
                particle.direction = dirIndex;
                particle.speed = ENDGAME_CONFIG.moveSpeed;
                // Add to container
                mainContainer.addChild(particle);
                // Add to tracking array
                particles.push(particle);
                // Make interactive
                particle.interactive = true;
                particle.on('pointerdown', () => {
                    if (window.REQ_WIN) {
                        window.REQ_WIN();
                    }
                });

                flock_size--;
                if (flock_size <= 0) {
                    flock_index++;
                    flock_size = Math.ceil(Math.random() * 12);
                    FLOCKS[flock_index] = [];
                    dirIndex = Math.floor(Math.random() * 4);
                    tint = Math.random() * 0xFFFFFF;
                    centerX = regionX + (Math.random() * regionWidth);
                    centerY = regionY + (Math.random() * regionHeight);
                }

            }
        }
    }
    // Apply blur
    updateBlur();
}

// Update particle positions
function updateParticles(delta) {
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Random direction change
        if (Math.random() < ENDGAME_CONFIG.directionChangeProbability / FLOCKS[p.flock].length) {
            p.direction = Math.floor(Math.random() * 4);
            for (var e of FLOCKS[p.flock]) {
                e.direction = p.direction;
            }
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