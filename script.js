const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ===== GAME STATE =====
let gameState = "menu";
let isMultiplayer = false;
let score = 0;
let health = 5;
let highScore = localStorage.getItem("cyberHighScore") || 0;
let players = [];
let bullets = [];
let enemies = [];
let particles = [];
let stars = [];

document.getElementById("highScore").textContent = highScore;

// Background Stars
for(let i=0; i<80; i++) {
    stars.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, s: Math.random()*2});
}

class Player {
    constructor(x, color, id) {
        this.x = x;
        this.y = canvas.height - 220; // Adjusted for mobile zone space
        this.w = 40; this.h = 40;
        this.color = color;
        this.id = id;
        this.vx = 0;
        this.acc = 1.2;
        this.fric = 0.88;
        this.shootTimer = 0;
    }

    update() {
        // Friction and Movement
        this.vx *= this.fric;
        this.x += this.vx;

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;

        // AUTO-FIRE LOGIC
        this.shootTimer++;
        if (this.shootTimer > 15) { // Shoots every 15 frames
            this.shoot();
            this.shootTimer = 0;
        }
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x + this.w/2, this.y);
        ctx.lineTo(this.x, this.y + this.h);
        ctx.lineTo(this.x + this.w/2, this.y + this.h - 8);
        ctx.lineTo(this.x + this.w, this.y + this.h);
        ctx.fill();
        ctx.restore();
    }

    shoot() {
        bullets.push({
            x: this.x + this.w/2 - 2,
            y: this.y,
            w: 4, h: 15,
            v: 12,
            color: this.color
        });
    }
}

// ===== INPUT HANDLING =====
const keys = {};
window.addEventListener("keydown", e => {
    if(["ArrowLeft", "ArrowRight", "KeyA", "KeyD"].includes(e.code)) e.preventDefault();
    keys[e.code] = true;
});
window.addEventListener("keyup", e => keys[e.code] = false);

// Mobile Move Function
function handleMove(dir, active) {
    if (dir === 'Left') keys['ArrowLeft'] = active;
    if (dir === 'Right') keys['ArrowRight'] = active;
}

// ===== GAME LOOP =====
function startGame(mode) {
    isMultiplayer = (mode === 'multi');
    gameState = "playing";
    score = 0; health = 5;
    bullets = []; enemies = []; players = [];
    
    if(isMultiplayer) {
        players.push(new Player(canvas.width * 0.3, '#00f3ff', 1));
        players.push(new Player(canvas.width * 0.6, '#ff00ff', 2));
    } else {
        players.push(new Player(canvas.width/2 - 20, '#00f3ff', 1));
    }

    document.getElementById("menu").classList.add("hidden");
    document.getElementById("gameOverScreen").classList.add("hidden");
    update();
}

function spawnEnemy() {
    if (gameState !== "playing") return;
    enemies.push({
        x: Math.random() * (canvas.width - 40),
        y: -50, w: 40, h: 40,
        v: 3 + (score * 0.05)
    });
}
setInterval(spawnEnemy, 1000);

function update() {
    if (gameState !== "playing") return;

    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Star Field
    ctx.fillStyle = "white";
    stars.forEach(s => {
        s.y += 1.5; if (s.y > canvas.height) s.y = 0;
        ctx.fillRect(s.x, s.y, s.s, s.s);
    });

    // Players
    players.forEach(p => {
        if(p.id === 1) {
            if(keys['ArrowLeft'] || keys['KeyA']) p.vx -= p.acc;
            if(keys['ArrowRight'] || keys['KeyD']) p.vx += p.acc;
        }
        if(p.id === 2) {
            if(keys['ArrowLeft']) p.vx -= p.acc; // Simplified for local co-op share
            if(keys['ArrowRight']) p.vx += p.acc;
        }
        p.update(); p.draw();
    });

    // Bullets
    bullets.forEach((b, bi) => {
        b.y -= b.v;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        if (b.y < 0) bullets.splice(bi, 1);
    });

    // Enemies
    enemies.forEach((en, ei) => {
        en.y += en.v;
        ctx.strokeStyle = "red";
        ctx.strokeRect(en.x, en.y, en.w, en.h);

        // Check Bullet Collision
        bullets.forEach((b, bi) => {
            if (b.x < en.x + en.w && b.x + b.w > en.x && b.y < en.y + en.h && b.y + b.h > en.y) {
                enemies.splice(ei, 1);
                bullets.splice(bi, 1);
                score += 1; // EXACTLY 1 POINT PER KILL
                saveScore();
            }
        });

        if (en.y > canvas.height) {
            enemies.splice(ei, 1);
            health--;
            if (health <= 0) endGame();
        }
    });

    document.getElementById("score").textContent = score;
    document.getElementById("health").textContent = health;
    requestAnimationFrame(update);
}

function saveScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("cyberHighScore", highScore);
        document.getElementById("highScore").textContent = highScore;
    }
}

function endGame() {
    gameState = "over";
    document.getElementById("gameOverScreen").classList.remove("hidden");
    document.getElementById("finalScore").textContent = score;
}

function restartGame() { location.reload(); }