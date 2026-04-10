const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score-board');

// Game Constants
canvas.width = 800;
canvas.height = 200;

const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const GROUND_Y = canvas.height - 30;

// Game State
let score = 0;
let gameActive = true;
let obstacles = [];
let frameCount = 0;

const dino = {
    x: 50,
    y: GROUND_Y - 40,
    width: 40,
    height: 40,
    dy: 0,
    jumped: false,
    color: '#4CAF50', // Green Dino
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    },

    update() {
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
        // Check if dino is within the horizontal bounds of the rock
        if (
            dino.x < obs.x + obs.width &&
            dino.x + dino.width > obs.x
        ) {
            // 1. LAND ON ROCK (+2 points)
            // If dino's feet are at the top of the rock and he is falling/landing
            if (
                dino.y + dino.height <= obs.y + 10 && 
                dino.y + dino.height >= obs.y - 5 &&
                dino.dy >= 0
            ) {
                score += 2;
                updateScore();
                // Remove rock so we don't trigger multiple scores or death
                obstacles.splice(i, 1);
                continue;
            }

            // 2. COLLIDE WITH SIDE (LOSE)
            // If dino hits the side of the rock (not on top)
            if (dino.y + dino.height > obs.y + 5) {
                gameOver();
            }
        }

        // 3. JUMP OVER (+1 point)
        // If the rock has passed the dino's X position and hasn't been scored yet
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
    dino.y = GROUND_Y - dino.height;
    dino.dy = 0;
    animate();
}

function animate() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Ground
    ctx.strokeStyle = '#333';
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
    if (e.code === 'Space') {
        if (gameActive) {
            dino.jump();
        } else {
            resetGame();
        }
    }
});

// Start Game
animate();
