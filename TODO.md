* p29: needs cluttering and singlign out of one dot. singling is done i think but cluttering should be easy with a flock based spawning algo

* Discord: put higher on website, prepare

* new game + color picker
* sfx on found, mb vfx too?




>> just spawn the particules directly in groups?

// Add to the config
config.attractionPoints = 3;          // Number of attraction points
config.attractionStrength = 0.05;     // How strongly particles are pulled (0-1)
config.attractionRadius = 150;        // How far the attraction works
config.attractionMovement = true;     // Whether attraction points move

// Create attraction points array
const attractionPoints = [];

// In the init() function, add:
// Initialize attraction points
for (let i = 0; i < config.attractionPoints; i++) {
    attractionPoints.push({
        x: Math.random() * app.screen.width,
        y: Math.random() * app.screen.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
    });
}

// In the updateParticles function, before updating position:
// Apply attraction forces
for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    
    // Find closest attraction point
    let closestPoint = null;
    let closestDist = Infinity;
    
    for (let j = 0; j < attractionPoints.length; j++) {
        const point = attractionPoints[j];
        const dx = point.x - p.x;
        const dy = point.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < closestDist && dist < config.attractionRadius) {
            closestDist = dist;
            closestPoint = point;
        }
    }
    
    // Apply attraction if within radius
    if (closestPoint) {
        const dx = closestPoint.x - p.x;
        const dy = closestPoint.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Stronger force when closer (inverse square law)
        const force = config.attractionStrength * (1 - dist/config.attractionRadius);
        
        // Add attraction vector to movement
        p.x += dx * force;
        p.y += dy * force;
    }
}

// Add to gameLoop function:
// Move attraction points
if (config.attractionMovement) {
    for (let i = 0; i < attractionPoints.length; i++) {
        const point = attractionPoints[i];
        
        // Move the point
        point.x += point.vx;
        point.y += point.vy;
        
        // Bounce off edges
        if (point.x < 0 || point.x > app.screen.width) point.vx *= -1;
        if (point.y < 0 || point.y > app.screen.height) point.vy *= -1;
    }
}






# SPRITE WORK
* proper sprite
* thicker outline

# GAMEPLAY IDEAS
Mb click at the right time, when the object is close by 
Match someone's movement? Adopt an other rpov 


# MISC NOTES
* you need to stand out to be noticed
* touch your self to progress
* first read should be "its obvious", second read = "its so arbitrary"
* "you can't fill your hole? Car tu peux pas tout contenir car tes frontières sont poreuses et tu finit par te dissoudre 


# TITLE

find yourself?
which is i
quel est je
