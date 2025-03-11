const CHANGE_DIRECTION_PROBA = 0.05;
const CHARACTERS_SPEED = 1;
const ANIMATION_SPEED = 0.15;
const SPRITE_WIDTH = 48;
const SPRITE_HEIGHT = 64;
const NUM_DECOYS = 99;

const WIN = function () {
    alert("win");
}


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

//HACK ==========================================================================================
//HACK ===== KEYBOARD
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    if (playerFigure) {
        switch (e.key.toLowerCase()) {
            case 'w': playerFigure.setDirection(3); break; // Up
            case 'a': playerFigure.setDirection(1); break; // Left
            case 's': playerFigure.setDirection(0); break; // Down
            case 'd': playerFigure.setDirection(2); break; // Right
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

//HACK ==========================================================================================
//HACK ===== MOUSE/TOUCH
let touchStartTime = 0;
let touchStartPos = { x: 0, y: 0 };
let isTouching = false;
let longPressThreshold = 200; // ms

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
            playerFigure.setDirection(dx > 0 ? 2 : 1); // Right or Left
        } else {
            // Vertical movement is primary
            playerFigure.setDirection(dy > 0 ? 0 : 3); // Down or Up
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

//HACK ==========================================================================================
//HACK ===== GAME LOGIC
// Create a class for our stick figures
class StickFigure {
    constructor(isPlayerControlled = false) {
        // Create a container for the figure and its animations
        this.container = new PIXI.Container();

        // Set random position
        this.container.x = Math.random() * app.screen.width;
        this.container.y = Math.random() * app.screen.height;

        this.direction = Math.floor(Math.random() * 4);

        // Set slower random speed between 0.5 and 1.5
        this.speed = CHARACTERS_SPEED;
        // Random tint color
        this.tint = Math.random() * 0xFFFFFF;

        // Animation state
        this.frameIndex = 0;
        this.frameCounter = 0;

        // Create sprite
        this.sprite = null; // Will be set when spritesheet loads

        // Player controlled flag
        this.isPlayerControlled = isPlayerControlled;
    }

    update() {
        switch (this.direction) {
            case 0: // Down (row 0 in spritesheet)
                this.container.y += this.speed;
                break;
            case 1:  // Left (row 1 in spritesheet)
                this.container.x -= this.speed;
                break;
            case 2: // Right (row 2 in spritesheet)
                this.container.x += this.speed;
                break;
            case 3: // Up (row 3 in spritesheet)
                this.container.y -= this.speed;
                break;
        }

        if (!this.isPlayerControlled && Math.random() < CHANGE_DIRECTION_PROBA) {
            this.direction = Math.floor(Math.random() * 4);
            this.updateAnimation();
        }

        // Check for screen wrap
        if (this.container.x < 0) this.container.x = app.screen.width;
        if (this.container.x > app.screen.width) this.container.x = 0;
        if (this.container.y < 0) this.container.y = app.screen.height;
        if (this.container.y > app.screen.height) this.container.y = 0;

        // Update animation frames
        this.frameCounter += ANIMATION_SPEED;
        if (this.frameCounter >= 1) {
            this.frameCounter = 0;
            this.frameIndex = (this.frameIndex + 1) % 4; // 4 frames per animation
            this.updateAnimation();
        }
    }

    updateAnimation() {
        if (!this.sprite) return;

        // Get the current row based on direction
        // 0=down, 1=left, 2=right, 3=up corresponds to the spritesheet rows
        let row = this.direction;

        // Calculate the frame rectangle
        const col = this.frameIndex;

        this.sprite.texture.frame = new PIXI.Rectangle(
            col * SPRITE_WIDTH,
            row * SPRITE_HEIGHT,
            SPRITE_WIDTH,
            SPRITE_HEIGHT
        );
    }

    setTexture(baseTexture) {
        // Create the sprite with the initial frame
        const texture = new PIXI.Texture(
            baseTexture,
            new PIXI.Rectangle(0, 0, SPRITE_WIDTH, SPRITE_HEIGHT) // Start with first frame of down animation
        );

        this.sprite = new PIXI.Sprite(texture);
        this.sprite.anchor.set(0.5);
        this.sprite.tint = this.tint;

        // Make sprite interactive if player controlled
        if (this.isPlayerControlled) {
            this.sprite.eventMode = 'static';
            this.sprite.on('pointerdown', () => {
                WIN();
            });
        }

        this.container.addChild(this.sprite);

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

const base64String = function () {
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAAEACAYAAADlQ3kHAAABFGVYSWZJSSoACAAAAAsAAAEEAAEAAADAAAAAAQEEAAEAAAAAAQAAAgEDAAMAAACSAAAADgECABIAAACYAAAAEgEDAAEAAAABAAAAGgEFAAEAAACqAAAAGwEFAAEAAACyAAAAKAEDAAEAAAADAAAAMQECAA0AAAC6AAAAMgECABQAAADIAAAAaYcEAAEAAADcAAAAAAAAAAgACAAIAENyZWF0ZWQgd2l0aCBHSU1QAPwpAABbAAAA / CkAAFsAAABHSU1QIDIuMTAuMzgAADIwMjU6MDM6MTEgMTc6MzE6MDMAAgCGkgcAGQAAAPoAAAABoAMAAQAAAAEAAAAAAAAAAAAAAAAAAABDcmVhdGVkIHdpdGggR0lNUAC6PN9wAAABhGlDQ1BJQ0MgcHJvZmlsZQAAeJx9kT1Iw0AcxV9TpaIVFTuIdMhQneyiIo61CkWoEGqFVh1MLv2CJg1Jiouj4Fpw8GOx6uDirKuDqyAIfoC4C06KLlLi / 5JCi1gPjvvx7t7j7h0g1MtMs7pigKbbZioRFzPZVTHwCj / 6MIgwhmRmGXOSlETH8XUPH1 / vojyr87k / R7 + asxjgE4ljzDBt4g3imU3b4LxPHGJFWSU + J54w6YLEj1xXPH7jXHBZ4JkhM52aJw4Ri4U2VtqYFU2NeJo4omo65QsZj1XOW5y1cpU178lfGMzpK8tcpxlGAotYggQRCqoooQwbUVp1UiykaD / ewT / q + iVyKeQqgZFjARVokF0 / +B / 87tbKT016ScE40P3iOB9jQGAXaNQc5 / vYcRongP8ZuNJb / kodmP0kvdbSIkfAwDZwcd3SlD3gcgcYeTJkU3YlP00hnwfez + ibssDwLdC75vXW3MfpA5CmrpI3wMEhMF6g7PUO7 + 5p7 + 3fM83 + fgBbo3KdwGiuVAAADltpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw / eHBhY2tldCBiZWdpbj0i77u / IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8 + Cjx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDQuNC4wLUV4aXYyIj4KIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI + CiAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgIHhtbG5zOkdJTVA9Imh0dHA6Ly93d3cuZ2ltcC5vcmcveG1wLyIKICAgIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIgogICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICB4bXBNTTpEb2N1bWVudElEPSJnaW1wOmRvY2lkOmdpbXA6MTc3ZDMxM2MtNzcwMC00ZjA2LWE5N2MtMGQ2NTY2OGRjMGFhIgogICB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjBkMmI4N2M5LWU3MzctNDhhYy1iZTBjLTM5MDVlNDZiYzJmYiIKICAgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjFjMThjMzE4LWUzN2YtNDBlOS05ZjczLTE0MTBhYTA1ZGU4MCIKICAgZGM6Rm9ybWF0PSJpbWFnZS9wbmciCiAgIEdJTVA6QVBJPSIyLjAiCiAgIEdJTVA6UGxhdGZvcm09IkxpbnV4IgogICBHSU1QOlRpbWVTdGFtcD0iMTc0MTcxMDY2Mzg3NTQ0MyIKICAgR0lNUDpWZXJzaW9uPSIyLjEwLjM4IgogICB0aWZmOk9yaWVudGF0aW9uPSIxIgogICB4bXA6Q3JlYXRvclRvb2w9IkdJTVAgMi4xMCIKICAgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyNTowMzoxMVQxNzozMTowMyswMTowMCIKICAgeG1wOk1vZGlmeURhdGU9IjIwMjU6MDM6MTFUMTc6MzE6MDMrMDE6MDAiPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJzYXZlZCIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIKICAgICAgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDozODE4NGNiYS00MmIwLTQxMDQtODJhZi0zNTFhNmVhMWU2NGMiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkdpbXAgMi4xMCAoTGludXgpIgogICAgICBzdEV2dDp3aGVuPSIyMDI1LTAzLTExVDE0OjI2OjEwKzAxOjAwIi8 + CiAgICAgPHJkZjpsaQogICAgICBzdEV2dDphY3Rpb249InNhdmVkIgogICAgICBzdEV2dDpjaGFuZ2VkPSIvIgogICAgICBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmM0ZmU0ZjhmLWIxMGEtNDE1My04MTcwLWE2MTQ5YjRjYTNkNyIKICAgICAgc3RFdnQ6c29mdHdhcmVBZ2VudD0iR2ltcCAyLjEwIChMaW51eCkiCiAgICAgIHN0RXZ0OndoZW49IjIwMjUtMDMtMTFUMTc6MzE6MDMrMDE6MDAiLz4KICAgIDwvcmRmOlNlcT4KICAgPC94bXBNTTpIaXN0b3J5PgogIDwvcmRmOkRlc2NyaXB0aW9uPgogPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3Ij8 + elqgjwAAAAZiS0dEAP8AAAAAMyd88wAAAAlwSFlzAAAuIwAALiMBeKU / dgAAAAd0SU1FB + kDCxAfAyVL4W8AAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAgAElEQVR42u19d3xURff + M / fubnoPEAgQSuhNCEWQLogoUlSKovgTUBERFARUigIKglgQBHkBBUGpihTpRUqkhRpqCCEhjfSezbZ7fn9kN98ku5vsJksyvO99Pp98NHdnw5lz55kzc + bMOYAMGTJkyJAhQ4YMGTJkyJDxPwJRVsF / J9zc3JjBYHAC4MQYUwiCwIhIkjVTBWCMeQKYBeAvAGsA9HtMu / I + gG0ANgF4VRTFx2XCaA8gGYBUs2ZNydnZWQIgMcZOMca474Ozs7MAIAjADpVKlaRUKh8C2ACgvvEzbhEA4E7nzp0Ne / bsoczMTIqIiKCZM2cSgAIAn3FvEkVRwRi74O7urtuwYQMlJydTXFwcLVu2jGrUqKFljP2mUqkYx5PP + meffdaQkpJCer2eTNBqtXT16lUSBKEAQF + eJ0 / GWE5ISIgUFRVFkiSRJEl09epV6tGjh8QYi2KMefAoeysnJ6eca9eukcFgoNLIz8 + n119 / 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"; // Your base64 string here
}

const texture = PIXI.Texture.from(base64String());

// Create player-controlled figure first
playerFigure = new StickFigure(true);
playerFigure.setTexture(texture.baseTexture);
playerFigure.container.x = app.screen.width / 2;
playerFigure.container.y = app.screen.height / 2;
figures.push(playerFigure);
app.stage.addChild(playerFigure.container);

// Create 99 more regular figures
for (let i = 0; i < NUM_DECOYS; i++) {
    const figure = new StickFigure();
    figure.setTexture(texture.baseTexture);
    figures.push(figure);
    app.stage.addChild(figure.container);
}

//HACK ==========================================================================================
//HACK ===== GAME LOOP

// Start the game loop
app.ticker.add(() => {
    figures.forEach(figure => figure.update());
});