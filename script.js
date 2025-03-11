
// Create the PIXI Application
const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x222222,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
});
document.body.appendChild(app.view);

// Make canvas responsive
window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
});

// Touch/mouse state
let touchStartTime = 0;
let touchStartPos = { x: 0, y: 0 };
let isTouching = false;
let longPressThreshold = 200; // ms

// Create a class for our stick figures
class StickFigure {
    constructor(isPlayerControlled = false) {
        // Create a container for the figure and its animations
        this.container = new PIXI.Container();

        // Set random position
        this.container.x = Math.random() * app.screen.width;
        this.container.y = Math.random() * app.screen.height;

        // Set initial direction (0=down, 1=right, 2=up, 3=left)
        this.direction = Math.floor(Math.random() * 4);

        // Set slower random speed between 0.5 and 1.5
        this.speed = 0.5 + Math.random() * 1.0;

        // Random tint color
        this.tint = Math.random() * 0xFFFFFF;

        // Animation state
        this.frameIndex = 0;
        this.animationSpeed = 0.1 + Math.random() * 0.1; // Random animation speed
        this.frameCounter = 0;

        // Create sprite
        this.sprite = null; // Will be set when spritesheet loads

        // Player controlled flag
        this.isPlayerControlled = isPlayerControlled;

        // If player controlled, add highlight
        if (isPlayerControlled) {
            this.highlight = new PIXI.Graphics();
            this.highlight.beginFill(0xFFFFFF, 0.3);
            this.highlight.drawCircle(0, 0, 40);
            this.highlight.endFill();
            this.container.addChild(this.highlight);
        }
    }

    update() {
        if (!this.isPlayerControlled) {
            // Move in current direction
            switch (this.direction) {
                case 0: // Down (row 0 in spritesheet)
                    this.container.y += this.speed;
                    break;
                case 1: // Right (row 1 in spritesheet)
                    this.container.x += this.speed;
                    break;
                case 2: // Up (row 2 in spritesheet)
                    this.container.y -= this.speed;
                    break;
                case 3: // Left (row 3 in spritesheet)
                    this.container.x -= this.speed;
                    break;
            }

            // Random direction change (1% chance)
            if (Math.random() < 0.01) {
                this.direction = Math.floor(Math.random() * 4);
                this.updateAnimation();
            }
        } else {
            // Player-controlled movement
            switch (this.direction) {
                case 0: // Down
                    this.container.y += this.speed * 1.5;
                    break;
                case 1: // Right
                    this.container.x += this.speed * 1.5;
                    break;
                case 2: // Up
                    this.container.y -= this.speed * 1.5;
                    break;
                case 3: // Left
                    this.container.x -= this.speed * 1.5;
                    break;
            }
        }

        // Check for screen wrap
        if (this.container.x < 0) this.container.x = app.screen.width;
        if (this.container.x > app.screen.width) this.container.x = 0;
        if (this.container.y < 0) this.container.y = app.screen.height;
        if (this.container.y > app.screen.height) this.container.y = 0;

        // Update animation frames
        this.frameCounter += this.animationSpeed;
        if (this.frameCounter >= 1) {
            this.frameCounter = 0;
            this.frameIndex = (this.frameIndex + 1) % 4; // 4 frames per animation
            this.updateAnimation();
        }
    }

    updateAnimation() {
        if (!this.sprite) return;

        // Get the current row based on direction
        // 0=down, 1=right, 2=up, 3=left corresponds to the spritesheet rows
        let row = this.direction;

        // Calculate the frame rectangle
        const frameWidth = 48;
        const frameHeight = 64;
        const col = this.frameIndex;

        this.sprite.texture.frame = new PIXI.Rectangle(
            col * frameWidth,
            row * frameHeight,
            frameWidth,
            frameHeight
        );
    }

    setTexture(baseTexture) {
        // Create the sprite with the initial frame
        const texture = new PIXI.Texture(
            baseTexture,
            new PIXI.Rectangle(0, 0, 48, 64) // Start with first frame of down animation
        );

        this.sprite = new PIXI.Sprite(texture);
        this.sprite.anchor.set(0.5);
        this.sprite.tint = this.tint;

        // Make sprite interactive if player controlled
        if (this.isPlayerControlled) {
            this.sprite.eventMode = 'static';
            this.sprite.cursor = 'pointer';
            this.sprite.on('pointerdown', () => {
                alert("win");
            });
        }

        // Add the sprite to the container (after highlight if it exists)
        if (this.isPlayerControlled && this.highlight) {
            this.container.addChildAt(this.sprite, 0);
        } else {
            this.container.addChild(this.sprite);
        }

        // Set initial animation frame
        this.updateAnimation();
    }

    setDirection(direction) {
        this.direction = direction;
        this.updateAnimation();
    }
}

// Array to store all stick figures
const figures = [];
let playerFigure;

// Display loading message
const loadingText = new PIXI.Text('Loading spritesheet...', {
    fontFamily: 'Arial',
    fontSize: 24,
    fill: 0xFFFFFF
});
loadingText.anchor.set(0.5);
loadingText.x = app.screen.width / 2;
loadingText.y = app.screen.height / 2;
app.stage.addChild(loadingText);

// Load the spritesheet
const spriteSheetUrl = 'spritesheet.png';

// Set up keyboard controls
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    if (playerFigure) {
        switch (e.key.toLowerCase()) {
            case 'w': playerFigure.setDirection(2); break; // Up
            case 'a': playerFigure.setDirection(3); break; // Left
            case 's': playerFigure.setDirection(0); break; // Down
            case 'd': playerFigure.setDirection(1); break; // Right
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

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
    if (!isTouching || !playerFigure) return;

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
            // Horizontal movement is primary
            playerFigure.setDirection(dx > 0 ? 1 : 3); // Right or Left
        } else {
            // Vertical movement is primary
            playerFigure.setDirection(dy > 0 ? 0 : 2); // Down or Up
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

// Load the assets
PIXI.Assets.load(spriteSheetUrl).then(texture => {
    // Remove loading text
    app.stage.removeChild(loadingText);

    // Create player-controlled figure first
    playerFigure = new StickFigure(true);
    playerFigure.setTexture(texture.baseTexture);
    playerFigure.container.x = app.screen.width / 2;
    playerFigure.container.y = app.screen.height / 2;
    figures.push(playerFigure);
    app.stage.addChild(playerFigure.container);

    // Create 99 more regular figures
    for (let i = 0; i < 99; i++) {
        const figure = new StickFigure();
        figure.setTexture(texture.baseTexture);
        figures.push(figure);
        app.stage.addChild(figure.container);
    }

    // Start the game loop
    app.ticker.add(() => {
        figures.forEach(figure => figure.update());
    });
}).catch(error => {
    console.error("Error loading spritesheet:", error);
    loadingText.text = "Error loading spritesheet. Check console for details.";
});