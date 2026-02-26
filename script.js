const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Disable Context Menu (No Copy/Paste popup)
window.oncontextmenu = (e) => { e.preventDefault(); return false; };

let gameState = "menu";
let score = 0, health = 5;
let highScore = localStorage.getItem("cyberHighScore") || 0;
let players = [], bullets = [], enemies = [], stars = [];

document.getElementById("highScore").textContent = highScore;

// Star background
for(let i=0; i<60; i++) stars.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, s: Math.random()*2});

class Player {
    constructor(x, color) {
        this.x = x;
        this.y = canvas.height - 250; 
        this.w = 40; this.h = 40;
        this.color = color;
        this.vx = 0; this.acc = 1.5; this.fric = 0.85;
        this.reload = 0;
    }

    update() {
        this.vx *= this.fric;
        this.x += this.vx;
        if (this.x < 0) this.x = 0;
        if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;

        this.reload++;
        if (this.reload > 14) { this.shoot(); this.reload = 0; }
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 15; ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x + this.w/2, this.y);
        ctx.lineTo(this.x, this.y + this.h);
        ctx.lineTo(this.x + this.w, this.y + this.h);
        ctx.fill();
        ctx.restore();
    }

    shoot() {
        bullets.push({x: this.x + this.w/2 - 2, y: this.y, w: 4, h: 12, v: 12, color: this.color});
    }
}

const keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

// FAST TOUCH HANDLER
function handleMove(dir, active, event) {
    if (event) event.preventDefault(); // Stop mobile selection menu
    if (dir === 'Left') keys['ArrowLeft'] = active;
    if (dir === 'Right') keys['ArrowRight'] = active;
}

function startGame(mode) {
    gameState = "playing"; score = 0; health = 5;
    bullets = []; enemies = []; players = [];
    players.push(new Player(canvas.width/2 - 20, '#00f3ff'));
    if(mode === 'multi') players.push(new Player(canvas.width/2 + 40, '#ff00ff'));
    
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("gameOverScreen").classList.add("hidden");
    update();
}

function spawnEnemy() {
    if (gameState !== "playing") return;
    enemies.push({ x: Math.random()*(canvas.width-40), y: -50, w: 40, h: 40, v: 4 + (score * 0.05)});
}
setInterval(spawnEnemy, 1000);

function update() {
    if (gameState !== "playing") return;
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    stars.forEach(s => { s.y += 1.2; if (s.y > canvas.height) s.y = 0; ctx.fillRect(s.x, s.y, s.s, s.s); });

    players.forEach(p => {
        if (keys['ArrowLeft'] || keys['KeyA']) p.vx -= p.acc;
        if (keys['ArrowRight'] || keys['KeyD']) p.vx += p.acc;
        p.update(); p.draw();
    });

    bullets.forEach((b, bi) => {
        b.y -= b.v; ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.w, b.h);
        if (b.y < 0) bullets.splice(bi, 1);
    });

    enemies.forEach((en, ei) => {
        en.y += en.v;
        ctx.strokeStyle = "red"; ctx.lineWidth = 2; ctx.strokeRect(en.x, en.y, en.w, en.h);

        bullets.forEach((b, bi) => {
            if (b.x < en.x+en.w && b.x+b.w > en.x && b.y < en.y+en.h && b.y+b.h > en.y) {
                enemies.splice(ei, 1); bullets.splice(bi, 1);
                score += 1; // Strictly +1 per kill
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem("cyberHighScore", highScore);
                    document.getElementById("highScore").textContent = highScore;
                }
            }
        });

        if (en.y > canvas.height) {
            enemies.splice(ei, 1); health--;
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
