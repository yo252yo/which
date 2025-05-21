// HACK ==== REQUIRED INPUT: window.REQ_
// HACK ==== OPTIONAL INPUT: window.OPT_


//HACK ==========================================================================================
//HACK ===== PARAMETERS
const CHANGE_DIRECTION_PROBA = 0.05;
const PIXEL_RATIO_ADJUST = window.devicePixelRatio - 1;
const SCREEN_SIZE_ADJUST = (window.innerWidth * window.innerHeight) / 1700000;
let CHARACTERS_SPEED = (window.OPT_CHAR_SPEED_MOD || 1) * 1 / (1 + 0.5 * PIXEL_RATIO_ADJUST);
const ANIMATION_SPEED = (window.OPT_ANIM_SPEED_MOD || 1) * 0.15 / (1 + 0.4 * PIXEL_RATIO_ADJUST);
const SPRITE_WIDTH = 48;
const SPRITE_HEIGHT = 64;
let NUM_DECOYS = Math.ceil((window.OPT_DESIRED_DECOYS || 0) * Math.sqrt(SCREEN_SIZE_ADJUST));
let NUM_APPLES = Math.ceil((window.OPT_DESIRED_APPLES || 0) * Math.sqrt(SCREEN_SIZE_ADJUST));
let APPLES = window.OPT_POSSIBLE_APPLES || ['🍎'];

let LOAD_TIME = Date.now();

if (window.OPT_FIXED_DECOY) {
    NUM_DECOYS = OPT_FIXED_DECOY;
}

window.checkColor = function () {
    var c = localStorage.getItem("forcedColor");
    if (!c) {
        return;
    }
    const decimalColor = parseInt(c.substring(1), 16);
    window.OPT_PLAYER_TINT = decimalColor;

    if (PLAYER_FIGURE && PLAYER_FIGURE.tint != window.OPT_PLAYER_TINT) {
        PLAYER_FIGURE.tint = window.OPT_PLAYER_TINT;
        if (PLAYER_FIGURE.sprite) {
            PLAYER_FIGURE.sprite.tint = window.OPT_PLAYER_TINT;
        }
    }
}

window.resetColor = function () {
    localStorage.removeItem('forcedColor');

    var tint = generateRGBColor(true);
    if (PLAYER_FIGURE) {
        PLAYER_FIGURE.tint = tint;
        if (PLAYER_FIGURE.sprite) {
            PLAYER_FIGURE.sprite.tint = tint;
        }
    }
}

//HACK ==========================================================================================
//HACK ===== APPLICATION

// Create the PIXI Application
const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: window.OPT_BACKGROUND_COLOR || 0x000000,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
});
document.body.appendChild(app.view);

// Make canvas responsive
window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
});

//HACK ==========================================================================================
//HACK ===== INPUT
let lastTouchDirection = 0;
const ORIGINAL_SPEED = CHARACTERS_SPEED;
if (!window.OPT_NO_INPUT) {
    const keys = {};
    window.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;

        if (PLAYER_FIGURE) {
            switch (e.key.toLowerCase()) {
                // Normal
                case 'w': PLAYER_FIGURE.setPlayerDirection(3); break; // Up
                case 'a': PLAYER_FIGURE.setPlayerDirection(1); break; // Left
                // French =/
                case 'z': PLAYER_FIGURE.setPlayerDirection(3); break; // Up
                case 'q': PLAYER_FIGURE.setPlayerDirection(1); break; // Left
                case 's': PLAYER_FIGURE.setPlayerDirection(0); break; // Down
                case 'd': PLAYER_FIGURE.setPlayerDirection(2); break; // Right
            }
        }
        if (e.shiftKey) {
            CHARACTERS_SPEED = ORIGINAL_SPEED * 3;
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
        if (!e.shiftKey) {
            CHARACTERS_SPEED = ORIGINAL_SPEED;
        }
    });

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
        if (!isTouching || !PLAYER_FIGURE) return;

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
                PLAYER_FIGURE.setPlayerDirection(dx > 0 ? 2 : 1); // Right or Left
            } else {
                // Vertical movement is primary
                PLAYER_FIGURE.setPlayerDirection(dy > 0 ? 0 : 3); // Down or Up
            }
            lastTouchDirection = Date.now();
        }
    }

    function handleTouchEnd(event) {
        isTouching = false;
    }

    // Add touch/mouse event listeners
    window.addEventListener('mousedown', handleTouchStart);
    window.addEventListener('mousemove', handleTouchMove);
    window.addEventListener('mouseup', handleTouchEnd);

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
}

//HACK ==========================================================================================
//HACK ===== GAME LOGIC
function generateRGBColor(isPlayer = false, scalingFactor = 1) {
    let r, g, b;

    var playerDefaultColor = 102;
    var minColor = 40; // avoid black on black

    if (scalingFactor < 0.2) { // not used in the game but avoids breakage
        scalingFactor = 0.2;
    }

    let rng = function () {
        if (Math.random() < playerDefaultColor / 256) { // below playerDefaultColor
            if (isPlayer) {
                return minColor + (playerDefaultColor - minColor) * (1 - scalingFactor * Math.random());
            }
            else {
                var boundary = playerDefaultColor * (1 - scalingFactor);
                return minColor + (boundary - minColor) * Math.random() * scalingFactor; // multiplication by * scalingFactor to increase contrast with NPCs
            }
        } else { // above playerDefaultColor

            if (isPlayer) {
                var correctBoundary = playerDefaultColor + scalingFactor * (256 - playerDefaultColor);
                return playerDefaultColor + (correctBoundary - playerDefaultColor) * Math.random();
            }
            else {
                // We force values towards the extreme to get vibrant colors. We ban the range [102;156].
                // This was originally a mistake in the code but I like the effect.
                return 256 - 100 * Math.random() * scalingFactor * scalingFactor;
            }
        }
    }

    r = Math.floor(rng());
    g = Math.floor(rng());
    b = Math.floor(rng());

    // White is only for NG+
    while (r > 175 && g > 175 && b > 175) {
        r = Math.floor(rng());
        g = Math.floor(rng());
        b = Math.floor(rng());
    }

    // Combine into a single hex value for Pixi.js tint
    var value = (r << 16) + (g << 8) + b;

    if (isPlayer) {
        var picker = document.getElementById("colorPicker");
        if (picker) {
            picker.value = `#${value.toString(16).padStart(6, '0')}`;
            picker.classList.remove("lockedColor");
        }
        window.PLAYER_COLOR = `#${value.toString(16).padStart(6, '0')}`;
    }
    return value;
}

const FLOCKS = {};

// Create a class for our stick figures
class StickFigure {
    constructor(isPlayerControlled = false) {
        // Create a container for the figure and its animations
        this.container = new PIXI.Container();

        // Set random position
        this.container.x = Math.random() * app.screen.width;
        this.container.y = Math.random() * app.screen.height;

        if (window.OPT_PLAYER_CENTERED) {
            while (Math.abs(this.container.x / app.screen.width - 0.5) < 0.1) {
                this.container.x = Math.random() * app.screen.width;
            }
            while (Math.abs(this.container.y / app.screen.height - 0.5) < 0.1) {
                this.container.y = Math.random() * app.screen.height;
            }
        }

        this.direction = Math.floor(Math.random() * 4);
        if (window.OPT_FIXED_DIRECTION && isPlayerControlled) {
            this.direction = window.OPT_FIXED_DIRECTION;
        }

        // Random tint color
        this.tint = generateRGBColor(isPlayerControlled, window.OPT_COLOR_CONSTRAIN_FACTOR);
        if (isPlayerControlled && window.OPT_PLAYER_TINT) {
            this.tint = window.OPT_PLAYER_TINT;
        }
        this.alpha = window.OPT_CHAR_ALPHA || 1;
        this.scale = window.OPT_CHAR_SCALE || 1;

        if (window.OPT_AGING && !isPlayerControlled) {
            this.aging_phase = Math.random() > 0.5 ? -1 : 1;
            this.alpha = Math.random();
        }

        // Animation state
        this.frameIndex = 0;
        this.frameCounter = 0;

        // Create sprite
        this.sprite = null; // Will be set when spritesheet loads

        // Player controlled flag
        this.isPlayerControlled = isPlayerControlled;

        this.eaten_apples = [];
        // const border = new PIXI.Graphics();
        // border.lineStyle(2, 0xff0000, 1); // Red border
        // border.drawRect(-SPRITE_WIDTH / 2, -SPRITE_HEIGHT / 2, SPRITE_WIDTH, SPRITE_HEIGHT);
        // this.container.addChild(border);
    }

    handleAppleEating() {
        ALL_APPLES.forEach((apple, index) => {
            // Assume playerFigure.container and apple have 'getBounds()' methods:
            if (hitTestRectangle(this.container.getBounds(), apple.getBounds())) {
                app.stage.removeChild(apple);
                ALL_APPLES.splice(index, 1);
                spawnApples(1);

                if (this.isPlayerControlled) {
                    if (window.OPT_REQUIRED_APPLES) {
                        if (!window.OPT_MATCHING_APPLES) {
                            if (!window.OPT_DISTINCT_APPLES) {
                                this.eaten_apples.push(apple.text);
                            } else if (!this.eaten_apples.includes(apple.text)) {
                                this.eaten_apples.push(apple.text);
                            }
                        } else if (this.eaten_apples.length == 0 || apple.text == this.eaten_apples[0]) {
                            this.eaten_apples.push(apple.text);
                        }

                        if (this.eaten_apples.length > window.OPT_REQUIRED_APPLES) {
                            this.eaten_apples.shift();
                        }
                        refresh_apple_counter(this.eaten_apples);
                    }
                }
            }
        });
    }

    handleFlockingDissent() {
        const FLOCK_LEAVING_PROBA = 0.0002;
        const MIN_FLOCK_SIZE = 2;

        if (this.isPlayerControlled) {
            return;
        }

        var flock_array = FLOCKS[this.flock];
        if (flock_array && flock_array.length > MIN_FLOCK_SIZE && Math.random() < FLOCK_LEAVING_PROBA) {
            this.tint = generateRGBColor(this.isPlayerControlled, window.OPT_COLOR_CONSTRAIN_FACTOR);
            this.sprite.tint = this.tint;

            switch (this.direction) {
                case 0: this.direction = 3; break;
                case 1: this.direction = 2; break;
                case 2: this.direction = 1; break;
                default: this.direction = 0;
            }

            delete this.flock;
            this.flock_cooldown = 1;
            const index = flock_array.indexOf(this);
            if (index !== -1) {
                flock_array.splice(index, 1);
            }
            return true;
        }
        return false;
    }

    handleFlockingCollision(isInFlock) {
        if (this.isPlayerControlled && !window.OPT_PLAYER_FLOCKING) {
            return;
        }

        ALL_FIGURES.forEach((figure, index) => {
            if (figure == this) {
                return;
            }
            if (figure.isPlayerControlled && !window.OPT_PLAYER_FLOCKING) {
                return;
            }

            // this.flock might be true
            if (hitTestRectangle(this.container.getBounds(), figure.container.getBounds())) {
                if (!figure.flock && !this.flock) {
                    const new_flock = Object.keys(FLOCKS).length;
                    FLOCKS[new_flock] = [this, figure];

                    this.flock = new_flock;
                    figure.flock = new_flock;

                    const avg_tint = (this.tint + figure.tint) / 2;
                    this.tint = avg_tint;
                    figure.tint = avg_tint;
                    this.sprite.tint = avg_tint;
                    figure.sprite.tint = avg_tint;

                    figure.direction = this.direction;
                } else if (!this.flock) {
                    this.flock = figure.flock;
                    this.tint = figure.tint;
                    this.sprite.tint = figure.tint;
                    this.direction = figure.direction;
                    FLOCKS[figure.flock].push(this);
                } else if (!figure.flock) {
                    figure.flock = this.flock;
                    figure.tint = this.tint;
                    figure.sprite.tint = this.tint;
                    figure.direction = this.direction;
                    FLOCKS[figure.flock].push(figure);
                } else if (figure.flock != PLAYER_FIGURE.flock) {
                    var PROBA_FLOCK_MERGE = 0.0001;
                    if (this.isPlayerControlled || this.flock == PLAYER_FIGURE.flock) {
                        PROBA_FLOCK_MERGE += window.OPT_PLAYER_EXTRA_FLOCK_MERGE;
                    }

                    if (Math.random() < PROBA_FLOCK_MERGE) {
                        var target_flock = FLOCKS[figure.flock];
                        for (var f of target_flock) {
                            //f.tint = this.tint;
                            //f.sprite.tint = this.tint;
                            //f.direction = this.direction;
                            delete f.flock;
                        }
                        delete FLOCKS[figure.flock];
                    }
                }

                if (localStorage.getItem("forcedColor") && (this.isPlayerControlled || figure.isPlayerControlled)) {
                    let color = parseInt(localStorage.getItem("forcedColor").substring(1), 16);
                    for (var f of FLOCKS[PLAYER_FIGURE.flock]) {
                        f.tint = color;
                    }
                }

            }
        });
    }

    handleFlocking() {
        if (!window.OPT_FLOCKING) {
            return;
        }
        if (Date.now() - LOAD_TIME < 2 * 1000) {
            return; // small cooldown
        }
        const FLOCK_COOLDOWN_AFTER_LEAVING = 100;
        if (this.flock_cooldown) {
            this.flock_cooldown++;
            if (this.flock_cooldown > FLOCK_COOLDOWN_AFTER_LEAVING) {
                delete this.flock_cooldown;
            }
            return;
        }
        if (this.flock) {
            if (this.handleFlockingDissent()) {
                return;
            }
        }
        // We are eligible, not in a flock or on cooldown
        this.handleFlockingCollision();
    }

    update() {
        if (window.OPT_STOP_MOTION) return;
        switch (this.direction) {
            case 0: // Down (row 0 in spritesheet)
                this.container.y += CHARACTERS_SPEED;
                break;
            case 1:  // Left (row 1 in spritesheet)
                this.container.x -= CHARACTERS_SPEED;
                break;
            case 2: // Right (row 2 in spritesheet)
                this.container.x += CHARACTERS_SPEED;
                break;
            case 3: // Up (row 3 in spritesheet)
                this.container.y -= CHARACTERS_SPEED;
                break;
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
        this.handleAppleEating();
        this.handleFlocking();
        this.changeDirection();
    }

    agingEffect() {
        if (!window.OPT_AGING || this.isPlayerControlled) {
            return;
        }

        var AGING_SPEED = 0.05;
        this.alpha += this.aging_phase * AGING_SPEED * Math.random();

        if (this.alpha > 1) {
            this.alpha = 1;
            this.aging_phase = -1;
        }
        if (this.alpha < 0) {
            this.alpha = 0;
            this.aging_phase = 1;

            this.container.x = Math.random() * app.screen.width;
            this.container.y = Math.random() * app.screen.height;

            this.tint = generateRGBColor(this.isPlayerControlled, window.OPT_COLOR_CONSTRAIN_FACTOR);
        }
        this.sprite.alpha = this.alpha;
        this.sprite.tint = this.tint;
    }

    changeDirection() {
        if (window.OPT_FLOCKING && this.flock) {
            var flock_inertia_factor = 0.5;
            if (this.flock == PLAYER_FIGURE.flock) {
                flock_inertia_factor = 0.01;
            }

            if (Math.random() < flock_inertia_factor * CHANGE_DIRECTION_PROBA / FLOCKS[this.flock].length) {
                this.direction = Math.floor(Math.random() * 4);
                for (var f of FLOCKS[this.flock]) {
                    f.direction = this.direction;
                }
                this.updateAnimation();
            }
        } else {
            // normal direction change
            if (!this.isPlayerControlled && Math.random() < CHANGE_DIRECTION_PROBA * (window.OPT_CHANGE_DIRECTION_MODIFIER || 1)) {
                this.direction = Math.floor(Math.random() * 4);
                this.updateAnimation();
            }
        }
    }

    updateAnimation() {
        if (window.OPT_STOP_MOTION) return;
        if (!this.sprite) return;
        if (window.OPT_STOP_ANIM) return;

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

        this.agingEffect();
    }

    setNormalWinCondition() {
        if (!this.isPlayerControlled) {
            return;
        }
        this.sprite.eventMode = 'static';
        this.sprite.on('pointerdown', () => {
            if (lastTouchDirection && (Date.now() - lastTouchDirection) < 500) {
                return;
            }
            if (!window.OPT_REQUIRED_APPLES) {
                return window.REQ_WIN();
            }
            if (this.eaten_apples.length >= window.OPT_REQUIRED_APPLES) {
                window.REQ_WIN();
            }
        });
    }

    setFlockingWinCondition() {
        this.sprite.eventMode = 'static';
        this.sprite.on('pointerdown', () => {
            if (window.OPT_ENDING_EASY_WIN) {
                return window.REQ_WIN();
            }

            if (this.isPlayerControlled || this.flock == PLAYER_FIGURE.flock) {
                if (!window.OPT_FLOCK_SIZE_CONDITION) {
                    return window.REQ_WIN();
                }

                if (!(PLAYER_FIGURE.flock in FLOCKS)) {
                    return; // we dont have flock and theres a flock condition
                }

                if (window.OPT_FLOCK_SIZE_CONDITION >= 1) { // integer condition
                    // strict inequality because the player is in the flock
                    if (FLOCKS[PLAYER_FIGURE.flock].length > window.OPT_FLOCK_SIZE_CONDITION) {
                        window.REQ_WIN();
                    }
                } else {
                    const fraction = FLOCKS[PLAYER_FIGURE.flock].length / ALL_FIGURES.length;
                    console.log(fraction);
                    if (fraction > window.OPT_FLOCK_SIZE_CONDITION) {
                        window.REQ_WIN();
                    }
                }
            }
        });
    }

    setWinCondition() {
        if (window.OPT_PLAYER_FLOCKING) {
            this.setFlockingWinCondition();
        } else {
            this.setNormalWinCondition();
        }
    }

    makeHighlight() {
        if (this.isPlayerControlled && localStorage.getItem("cheat") == "true" && !location.href.includes("title")) {
            this.highlight = new PIXI.Graphics();
            this.highlight.beginFill(0x44FFFF, 0.4);
            this.highlight.drawCircle(0, 0, Math.floor(40 * this.scale));
            this.highlight.endFill();
            this.container.addChild(this.highlight);
        }
    }

    setTexture(baseTexture) {
        if (!baseTexture.valid) {
            console.log("Base texture not valid, waiting for it to load...");
            baseTexture.once('loaded', () => {
                this.setTexture(baseTexture);
            });
            return;
        }

        // Create the sprite with the initial frame
        const texture = new PIXI.Texture(
            baseTexture,
            new PIXI.Rectangle(0, 0, SPRITE_WIDTH, SPRITE_HEIGHT) // Start with first frame of down animation
        );

        this.sprite = new PIXI.Sprite(texture);
        this.sprite.anchor.set(0.5);
        this.sprite.tint = this.tint;
        this.sprite.alpha = this.alpha;

        this.sprite.scale.set(this.scale, this.scale);

        this.setWinCondition();
        this.makeHighlight();


        if (window.OPT_BLUR) {
            const blurFilter = new PIXI.filters.BlurFilter();
            blurFilter.blur = window.OPT_BLUR;
            this.sprite.filters = [blurFilter];
        }

        this.container.addChild(this.sprite);

        // Set initial animation frame
        this.updateAnimation();
    }

    setPlayerDirection(direction) {
        if (!this.isPlayerControlled) {
            return
        }

        this.direction = direction;
        this.updateAnimation();

        if (this.flock) {
            for (var f of FLOCKS[this.flock]) {
                f.direction = direction;
            }
        }
    }
}

function hitTestRectangle(player, apple) {
    var player_margin = player.width * .3;
    return (
        player.x + player_margin < apple.x + apple.width &&
        player.x + player.width - player_margin > apple.x &&
        player.y < apple.y + apple.height &&
        player.y + player.height > apple.y
    );
}

// Array to store all stick figures
const ALL_FIGURES = [];
const ALL_APPLES = [];
let PLAYER_FIGURE;

const base64String = function () {
    return "data:image/png;base64,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adOmjd0qFxYW8thjjznO33777QwZMsQ6/L1SKp06oFkqAPAwcCYY/c3ExET7REFBAY8//jhgjPlPnz49lPu1ARa6T7PJ4hGM6DsBceONN9oTYkuWLCE3N9c+5/F4ePLJJ63DZIy13WGj2SmAUmogRveHiy++mClTpjjOz5kzh7IyIypSZmZmOGPs05RSE1yk2iShlBoGhFSrKKVYunQpcXFxnDp1itmzZzvOX3LJJfos9y1KqTHh8nFVAbTI6bonZccMpZ4mSsgEEjweD5mZmY4T69at47XXXgPg2muv5aKLLgrphm3btgXDrn2pUipqlUoMyT8+IcHvN7ADI0eO5KabbgLg3Xff5Z///Kfj/JNPPmnlKQ7IVPo4dghwtbAsd9YAH330kb3/4Ycf2vtav63BYdb+PwW49dZbHVysITcRITExMaxJr7vusr/BRgCT3WMcHmJA/uOAiQB33nlnyNctXLiQ5ORkAO69916qq0+7YurTp48u/3HmFjoitOarAuShhx4SEZGioiLp0qWLbX9+yy23yK9+9SvbPj09PV2Ki4tFROShhx6yrPmqGtD6cDambX9BQYHoePnll21LRCs/3igqKrL3H3/8cTv94cOHpV27dtbxMw2Yn1iT/5OY1rY//vijxMfH15L3/v37fcr+0UcfteX91FNP1SoXzVfT4rA4RZihA4DceuutNpmPPvrI54KMxMREWblypZ3u17/+tXWuoAELYA6mrbnuf6akpES6du0qgHTr1k1KS0t9FoKI4R1aRGTGjBkCSHJysoiIDBs2zMrP6w2Yn1iT/3OAnHPOOSIikp6eLjr/I0eO+JV7RUWF9O7dWwDp2LGj/Pjjj47zPXv2tPLzVFicIszQKkAGDBjgILNt2zaZMmWKdO3aVbp27SpXXXVVLV87/fr1swh/3oAFcKX1Qtx3331SVVUl5eXlcuONN9ovyiuvvOK3EERE1qxZIyIio0aNEjBiCnz99dcSFxdn3eOxBsxPrMn/IcyFLZ988om9vNTiv379+oCyf+edd+xyuvHGG6WqqkpERN5++21d2cNaJhlphuwVPZ988klA8jr0BSbAjAYsgDhgi/XsDh066F0XOf/886WmpiYg982bNztWhJ199tl6jXsS6NGA+Yk1+XfGCDwuCQkJdo1u8f/3v/8dlLsWIEN69eol5513nl75FAMpYXGK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"; // Your base64 string here
}

const texture = PIXI.Texture.from(base64String());

//HACK ==========================================================================================
//HACK ===== FIGURES

// Create player-controlled figure first
PLAYER_FIGURE = new StickFigure(true);
PLAYER_FIGURE.setTexture(texture.baseTexture);
if (window.OPT_PLAYER_CENTERED) {
    PLAYER_FIGURE.container.x = app.screen.width / 2;
    PLAYER_FIGURE.container.y = app.screen.height / 2;
}
ALL_FIGURES.push(PLAYER_FIGURE);
app.stage.addChild(PLAYER_FIGURE.container);
window.checkColor();

// Create 99 more regular figures
for (let i = 0; i < NUM_DECOYS; i++) {
    const figure = new StickFigure();
    figure.setTexture(texture.baseTexture);
    ALL_FIGURES.push(figure);
    app.stage.addChild(figure.container);
}
app.ticker.add(() => {
    perfMonitoring.update();
    ALL_FIGURES.forEach(figure => figure.update());
});

//HACK ==========================================================================================
//HACK ===== APPLES

function spawnApples(count) {
    for (let i = 0; i < count; i++) {
        const apple = new PIXI.Text(APPLES[Math.floor(Math.random() * APPLES.length)], { fontFamily: 'Twemoji Mozilla', fontSize: 36 });
        apple.style.fill = 0xFFFFFF;
        apple.x = Math.random() * (app.screen.width - apple.width);
        apple.y = Math.random() * (app.screen.height - apple.height);
        ALL_APPLES.push(apple);
        app.stage.addChild(apple);

        apple.anchor.set(0.5); // Set anchor point to center for better rotation
        apple.rotation = Math.PI / 8;
        if (Math.random() < 0.5) {
            apple.rotation *= -1;
        }

        // const border = new PIXI.Graphics();
        // border.lineStyle(2, 0xff0000, 1);
        // border.drawRect(0, 0, apple.width, apple.height);
        // apple.addChild(border);
    }
}

setTimeout(function () {
    spawnApples(NUM_APPLES)
}, 50); // timer in hope it helps emojis load

if (NUM_APPLES) {
    var lastFlip = 0;
    app.ticker.add(() => {
        const timestamp = Date.now();
        if (timestamp - lastFlip > 750) {
            for (let i = 0; i < ALL_APPLES.length; i++) {
                ALL_APPLES[i].rotation *= -1;
            }
            lastFlip = timestamp;
        }
    });
}

if (window.OPT_REQUIRED_APPLES) {
    const appleDiv = document.createElement("div");
    appleDiv.id = "apple_counter";
    document.body.appendChild(appleDiv);
    appleDiv.innerText = "_ ".repeat(window.OPT_REQUIRED_APPLES);
}

function refresh_apple_counter(eaten_apples) {
    var appleDiv = document.getElementById("apple_counter");
    if (!appleDiv) {
        return;
    }
    appleDiv.innerText = "";
    for (var a of eaten_apples) {
        appleDiv.innerText += `${a} `
    }
    var missing = Math.max(0, window.OPT_REQUIRED_APPLES - eaten_apples.length);
    appleDiv.innerText += "_ ".repeat(missing);
}

//HACK ==========================================================================================
//HACK ===== PERF MONITORING


const perfMonitoring = {
    frameCount: 0,
    lastTime: performance.now(),
    fps: 0,
    history: [], // Store recent FPS values

    update: function () {
        this.frameCount++;
        const now = performance.now();
        const elapsed = now - this.lastTime;

        if (elapsed >= 1000) { // Update every second
            this.fps = Math.round((this.frameCount * 1000) / elapsed);
            this.frameCount = 0;
            this.lastTime = now;

            // Store history (keep last 10 readings)
            this.history.push(this.fps);
            if (this.history.length > 10) this.history.shift();

            if (this.fps < 50 && ALL_FIGURES.length > 30 && document.visibilityState == "visible") {
                const figuresToRemove = Math.floor(ALL_FIGURES.length * 0.1); // Calculate 10% of ALL_FIGURES
                console.log(`KILLING ${figuresToRemove} / ${ALL_FIGURES.length}`);

                // Create a list of figures to remove
                const figuresForRemoval = [];
                let count = 0;

                // Identify figures to remove
                for (let i = 0; i < ALL_FIGURES.length && count < figuresToRemove; i++) {
                    const mySprite = ALL_FIGURES[i];
                    if (!mySprite.isPlayerControlled && !mySprite.flock) {
                        figuresForRemoval.push(mySprite);
                        count++;
                    }
                }

                // Remove the identified figures
                for (const figureToRemove of figuresForRemoval) {
                    // Visual indication
                    figureToRemove.sprite.tint = 0xff0000;
                    figureToRemove.container.visible = false;

                    // Remove from stage
                    app.stage.removeChild(figureToRemove);

                    // Remove from array (find index and splice)
                    const index = ALL_FIGURES.indexOf(figureToRemove);
                    if (index !== -1) {
                        ALL_FIGURES.splice(index, 1);
                    }
                }
            }
        }
    }
};