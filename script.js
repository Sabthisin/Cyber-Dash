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
let stars = [];

document.getElementById("highScore").textContent = highScore;

// Create Starfield
for(let i=0; i<60; i++) {
    stars.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, s: Math.random()*2});
}

class Player {
    constructor(x, color, id) {
        this.x = x;
        this.y = canvas.height - 200; // Positioned above mobile zones
        this.w = 40; this.h = 40;
        this.color = color;
        this.id = id;
        this.vx = 0;
        this.acc = 1.3;
        this.fric = 0.88;
        this.reload = 0;
    }

    update() {
        this.vx *= this.fric;
        this.x += this.vx;

        if (this.x < 0) this.x = 0;
        if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;

        // Auto-Fire Logic
        this.reload++;
        if (this.reload > 12) { // Fire speed
            this.shoot();
            this.reload = 0;
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
        ctx.lineTo(this.x + this.w, this.y + this.h);
        ctx.fill();
        ctx.restore();
    }

    shoot() {
        bullets.push({x: this.x + this.w/2 - 2, y: this.y, w: 4, h: 15, v: 12, color: this.color});
    }
}

// ===== INPUTS =====
const keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

function handleMove(dir, active) {
    if (dir === 'Left') keys['ArrowLeft'] = active;
    if (dir === 'Right') keys['ArrowRight'] = active;
}

// ===== CORE LOOP =====
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
    enemies.push({ x: Math.random() * (canvas.width - 40), y: -50, w: 40, h: 40, v: 3 + (score * 0.05)});
}
setInterval(spawnEnemy, 1000);

function update() {
    if (gameState !== "playing") return;

    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Star background
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    stars.forEach(s => {
        s.y += 1; if (s.y > canvas.height) s.y = 0;
        ctx.fillRect(s.x, s.y, s.s, s.s);
    });

    players.forEach(p => {
        if (keys['ArrowLeft'] || keys['KeyA']) p.vx -= p.acc;
        if (keys['ArrowRight'] || keys['KeyD']) p.vx += p.acc;
        p.update(); p.draw();
    });

    bullets.forEach((b, bi) => {
        b.y -= b.v;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        if (b.y < 0) bullets.splice(bi, 1);
    });

    enemies.forEach((en, ei) => {
        en.y += en.v;
        ctx.strokeStyle = "red";
        ctx.strokeRect(en.x, en.y, en.w, en.h);

        bullets.forEach((b, bi) => {
            if (b.x < en.x + en.w && b.x + b.w > en.x && b.y < en.y + en.h && b.y + b.h > en.y) {
                enemies.splice(ei, 1);
                bullets.splice(bi, 1);
                score += 1; // KILL ONE ENEMY = +1 SCORE
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem("cyberHighScore", highScore);
                    document.getElementById("highScore").textContent = highScore;
                }
            }
        });

        if (en.y > canvas.height) {
            enemies.splice(ei, 1);
            health--;
            if (health <= 0) {
                gameState = "over";
                document.getElementById("gameOverScreen").classList.remove("hidden");
                document.getElementById("finalScore").textContent = score;
            }
        }
    });

    document.getElementById("score").textContent = score;
    document.getElementById("health").textContent = health;
    requestAnimationFrame(update);
}

function restartGame() { location.reload(); }
