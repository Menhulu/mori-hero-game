let gameState = {
    isPlaying: false,
    score: 0,
    level: 1,
    combo: 0,
    lives: 5,
    monsters: [],
    slashTrails: [],
    lastLeftWrist: null,
    lastRightWrist: null,
    slashPoints: []
};

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const video = document.getElementById('camera-feed');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const comboEl = document.getElementById('combo');
const livesEl = document.getElementById('lives');
const finalScoreEl = document.getElementById('final-score');

const monsterImages = [
    'img/sea-monster/blowfish.png',
    'img/sea-monster/crabs.png',
    'img/sea-monster/eel.png',
    'img/sea-monster/electric fish.png',
    'img/sea-monster/octopus.png',
    'img/sea-monster/robot.png',
    'img/sea-monster/starfish.png',
    'img/sea-monster/turtle.png'
];

const loadedMonsterImages = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

async function preloadImages() {
    for (const src of monsterImages) {
        const img = new Image();
        img.src = src;
        await new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
        });
        loadedMonsterImages.push(img);
    }
}

class Monster {
    constructor() {
        this.x = Math.random() * (canvas.width - 100) + 50;
        this.y = canvas.height + 100;
        this.size = 90 + Math.random() * 50;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = -(5 + Math.random() * 3 + gameState.level * 0.5);
        this.gravity = 0.15;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.03;
        this.image = loadedMonsterImages[Math.floor(Math.random() * loadedMonsterImages.length)] || null;
        this.alive = true;
        this.points = 10 + gameState.level * 5;
    }

    update() {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;

        if (this.x < this.size / 2 || this.x > canvas.width - this.size / 2) {
            this.vx *= -1;
        }

        if (this.y > canvas.height + 200) {
            if (this.alive) {
                gameState.lives--;
                gameState.combo = 0;
                updateUI();
                if (gameState.lives <= 0) {
                    endGame();
                }
            }
            return false;
        }
        return true;
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        if (this.image && this.image.complete) {
            ctx.drawImage(this.image, -this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👾', 0, 0);
        }
        ctx.restore();
    }

    checkHit(x, y) {
        if (!this.alive) return false;
        const dx = this.x - x;
        const dy = this.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.size / 2 + 60;
    }
}

class SlashTrail {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.life = 1;
        this.decay = 0.05;
    }

    update() {
        this.life -= this.decay;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.strokeStyle = `rgba(255, 215, 0, ${this.life})`;
        ctx.lineWidth = 8 * this.life;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();
        ctx.restore();
    }
}

function updateUI() {
    scoreEl.textContent = gameState.score;
    levelEl.textContent = gameState.level;
    comboEl.textContent = gameState.combo;
    livesEl.textContent = gameState.lives;
}

function showComboText(x, y, text) {
    const el = document.createElement('div');
    el.className = 'combo-text';
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.getElementById('game-container').appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function spawnMonster() {
    if (!gameState.isPlaying) return;
    gameState.monsters.push(new Monster());
    const interval = Math.max(1500, 4000 - gameState.level * 200);
    setTimeout(spawnMonster, interval + Math.random() * 1000);
}

function checkLevelUp() {
    const newLevel = Math.floor(gameState.score / 200) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        showComboText(canvas.width / 2, canvas.height / 2, `等级 ${gameState.level}!`);
        updateUI();
    }
}

function processSlash(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 30) return;
    
    gameState.slashTrails.push(new SlashTrail(x1, y1, x2, y2));
    
    const steps = Math.ceil(distance / 20);
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = x1 + dx * t;
        const py = y1 + dy * t;
        
        for (const monster of gameState.monsters) {
            if (monster.checkHit(px, py)) {
                monster.alive = false;
                gameState.combo++;
                const comboBonus = Math.floor(gameState.combo / 5);
                const points = monster.points * (1 + comboBonus);
                gameState.score += points;
                checkLevelUp();
                updateUI();
                
                if (gameState.combo >= 3) {
                    showComboText(monster.x, monster.y, `${gameState.combo}连击!`);
                }
                break;
            }
        }
    }
}

function onResults(results) {
    if (!gameState.isPlaying || !results.poseLandmarks) return;
    
    const landmarks = results.poseLandmarks;
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    
    const lx = (1 - leftWrist.x) * canvas.width;
    const ly = leftWrist.y * canvas.height;
    const rx = (1 - rightWrist.x) * canvas.width;
    const ry = rightWrist.y * canvas.height;
    
    if (gameState.lastLeftWrist) {
        processSlash(gameState.lastLeftWrist.x, gameState.lastLeftWrist.y, lx, ly);
    }
    if (gameState.lastRightWrist) {
        processSlash(gameState.lastRightWrist.x, gameState.lastRightWrist.y, rx, ry);
    }
    
    gameState.lastLeftWrist = { x: lx, y: ly };
    gameState.lastRightWrist = { x: rx, y: ry };
}

function gameLoop() {
    if (!gameState.isPlaying) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    gameState.monsters = gameState.monsters.filter(monster => {
        const alive = monster.update();
        if (alive || monster.alive) {
            monster.draw(ctx);
        }
        return alive;
    });
    
    gameState.slashTrails = gameState.slashTrails.filter(trail => {
        const alive = trail.update();
        if (alive) {
            trail.draw(ctx);
        }
        return alive;
    });
    
    requestAnimationFrame(gameLoop);
}

async function startGame() {
    await preloadImages();
    gameState = {
        isPlaying: true,
        score: 0,
        level: 1,
        combo: 0,
        lives: 5,
        monsters: [],
        slashTrails: [],
        lastLeftWrist: null,
        lastRightWrist: null,
        slashPoints: []
    };
    updateUI();
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    spawnMonster();
    gameLoop();
}

function endGame() {
    gameState.isPlaying = false;
    finalScoreEl.textContent = gameState.score;
    gameOverScreen.classList.remove('hidden');
}

async function init() {
    const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 } 
    });
    video.srcObject = stream;
    
    const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });
    
    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    
    pose.onResults(onResults);
    
    const camera = new Camera(video, {
        onFrame: async () => {
            await pose.send({ image: video });
        },
        width: 1280,
        height: 720
    });
    
    camera.start();
    
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
}

init();
