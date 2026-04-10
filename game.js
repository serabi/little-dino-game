const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score-board');
const instructionsElement = document.getElementById('instructions');

// Game Constants
canvas.width = 1000; // Increased width
canvas.height = 400; // Increased height

const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const GROUND_Y = canvas.height - 30;
const MOVE_SPEED = 5;

// Game State
let score = 0;
let gameActive = true;
let obstacles = [];
let clouds = [];
let frameCount = 0;
let keys = {}; // Track pressed keys

class Cloud {
    constructor() {
        this.x = canvas.width + Math.random() * 200;
        this.y = 30 + Math.random() * 100;
        this.speed = 0.2 + Math.random() * 0.5;
        this.size = 20 + Math.random() * 30;
    }

    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.arc(this.x + this.size * 0.6, this.y - this.size * 0.4, this.size * 0.8, 0, Math.PI * 2);
        ctx.arc(this.x + this.size * 1.2, this.y, this.size * 0.9, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        this.x -= this.speed;
        if (this.x + this.size * 2 < 0) {
            this.x = canvas.width + this.size;
            this.y = 30 + Math.random() * 100;
        }
        this.draw();
    }
}

const dino = {
    x: 50,
    y: GROUND_Y - 40,
    width: 40,
    height: 40,
    dx: 0, // Horizontal velocity
    dy: 0,
    jumped: false,
    color: '#4CAF50', // Green Dino
    
    draw() {
        // Draw Body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw Eyes
        ctx.fillStyle = 'white';
        // Left eye
        ctx.fillRect(this.x + 25, this.y + 5, 8, 8);
        // Right eye
        ctx.fillRect(this.x + 33, this.y + 5, 4, 8);

        // Draw Pupils
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x + 29, this.y + 7, 3, 3);
        ctx.fillRect(this.x + 35, this.y + 7, 2, 2);
    },

    update() {
        // Horizontal Movement
        if (keys['ArrowLeft']) {
            this.dx = -MOVE_SPEED;
        } else if (keys['ArrowRight']) {
            this.dx = MOVE_SPEED;
        } else {
            this.dx = 0;
        }

        this.x += this.dx;

        // Boundary Checks
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

        // Apply Gravity
        this.dy += GRAVITY;
        this.y += this.dy;

        // Ground Collision
        if (this.y + this.height > GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.dy = 0;
            this.jumped = false;
        }

        this.draw();
    },

    jump() {
        if (!this.jumped) {
            this.dy = JUMP_FORCE;
            this.jumped = true;
        }
    }
};

class Obstacle {
    constructor() {
        this.width = 30;
        this.height = 30 + Math.random() * 20;
        this.x = canvas.width;
        this.y = GROUND_Y - this.height;
        this.speed = 5 + (score / 10); // Speed increases slightly with score
        this.passed = false;
        this.color = '#795548'; // Brown Rock
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.x -= this.speed;
        this.draw();
    }
}

function spawnObstacle() {
    // Spawn obstacle roughly every 100 frames, with some randomness
    if (frameCount % Math.floor(Math.random() * 50 + 70) === 0) {
        obstacles.push(new Obstacle());
    }
}

function checkCollisions() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];

        // Collision Detection Logic
        if (
            dino.x < obs.x + obs.width &&
            dino.x + dino.width > obs.x
        ) {
            // 1. LAND ON ROCK (+2 points)
            if (
                dino.y + dino.height <= obs.y + 10 && 
                dino.y + dino.height >= obs.y - 5 &&
                dino.dy >= 0
            ) {
                score += 2;
                updateScore();
                obstacles.splice(i, 1);
                continue;
            }

            // 2. COLLIDE WITH SIDE (LOSE)
            if (dino.y + dino.height > obs.y + 5) {
                gameOver();
            }
        }

        // 3. JUMP OVER (+1 point)
        if (!obs.passed && obs.x + obs.width < dino.x) {
            score += 1;
            obs.passed = true;
            updateScore();
        }

        // Remove off-screen obstacles
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
        }
    }
}

function updateScore() {
    scoreElement.innerText = `Score: ${score}`;
}

function gameOver() {
    gameActive = false;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    ctx.font = '20px Arial';
    ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 40);
}

function resetGame() {
    score = 0;
    updateScore();
    obstacles = [];
    frameCount = 0;
    gameActive = true;
    dino.x = 50;
    dino.y = GROUND_Y - dino.height;
    dino.dy = 0;
    animate();
}

function drawBackground() {
    // Sky Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB'); // Sky Blue
    gradient.addColorStop(1, '#E0F6FF'); // Light Cyan
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Clouds
    clouds.forEach(cloud => cloud.update());

    // Draw Ground (Background part)
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
}

function animate() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();

    // Draw Ground Line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(canvas.width, GROUND_Y);
    ctx.stroke();

    dino.update();
    spawnObstacle();

    obstacles.forEach(obs => obs.update());

    checkCollisions();

    frameCount++;
    requestAnimationFrame(animate);
}

// Input Handling
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') {
        if (gameActive) {
            dino.jump();
        } else {
            resetGame();
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Initialize Clouds
for(let i = 0; i < 5; i++) {
    clouds.push(new Cloud());
}

// Start Game
animate();
