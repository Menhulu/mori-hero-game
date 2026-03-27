const STAGE_CONFIGS = [
    {
        id: 1,
        name: "浅海探险",
        targetScore: 80,
        lives: 5,
        background: "img/background.png",
        monsters: {
            size: { min: 90, max: 140 },
            speed: { vx: 1.5, vyMin: 5, vyMax: 8 },
            gravity: 0.15,
            spawnInterval: { min: 2500, max: 5000 },
            levelUpBonus: 0.3
        },
        rotationSpeed: 0.03,
        pointsPerKill: 10
    },
    {
        id: 2,
        name: "深海探索",
        targetScore: 150,
        lives: 5,
        background: "img/bg_Bak.png",
        monsters: {
            size: { min: 80, max: 130 },
            speed: { vx: 2, vyMin: 6, vyMax: 10 },
            gravity: 0.18,
            spawnInterval: { min: 2000, max: 4000 },
            levelUpBonus: 0.5
        },
        rotationSpeed: 0.05,
        pointsPerKill: 15
    },
    {
        id: 3,
        name: "海底深渊",
        targetScore: 250,
        lives: 4,
        background: "img/f1d4708a41ed3b9280384b9aa85012c5.png",
        monsters: {
            size: { min: 70, max: 120 },
            speed: { vx: 2.5, vyMin: 7, vyMax: 12 },
            gravity: 0.2,
            spawnInterval: { min: 1500, max: 3500 },
            levelUpBonus: 0.7
        },
        rotationSpeed: 0.07,
        pointsPerKill: 20
    },
    {
        id: 4,
        name: "终极挑战",
        targetScore: 400,
        lives: 4,
        background: "img/background.png",
        monsters: {
            size: { min: 60, max: 110 },
            speed: { vx: 3, vyMin: 8, vyMax: 14 },
            gravity: 0.22,
            spawnInterval: { min: 1200, max: 3000 },
            levelUpBonus: 1
        },
        rotationSpeed: 0.1,
        pointsPerKill: 25
    }
];

let gameState = {
    isPlaying: false,
    currentStage: 0,
    totalScore: 0,
    stageScore: 0,
    combo: 0,
    lives: 5,
    monsters: [],
    slashTrails: [],
    lastLeftWrist: null,
    lastRightWrist: null
};

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const video = document.getElementById('camera-feed');
const backgroundLayer = document.getElementById('background-layer');
const startScreen = document.getElementById('start-screen');
const stageCompleteScreen = document.getElementById('stage-complete-screen');
const gameCompleteScreen = document.getElementById('game-complete-screen');
const gameOverScreen = document.getElementById('game-over-screen');

const startBtn = document.getElementById('start-btn');
const nextStageBtn = document.getElementById('next-stage-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const restartBtn = document.getElementById('restart-btn');

const scoreEl = document.getElementById('score');
const stageEl = document.getElementById('stage');
const targetEl = document.getElementById('target');
const comboEl = document.getElementById('combo');
const livesEl = document.getElementById('lives');
const completedStageEl = document.getElementById('completed-stage');
const stageScoreEl = document.getElementById('stage-score');
const totalScoreEl = document.getElementById('total-score');
const reachedStageEl = document.getElementById('reached-stage');
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
    constructor(config) {
        this.x = Math.random() * (canvas.width - 100) + 50;
        this.y = canvas.height + 100;
        this.size = config.monsters.size.min + Math.random() * (config.monsters.size.max - config.monsters.size.min);
        this.vx = (Math.random() - 0.5) * config.monsters.speed.vx;
        this.vy = -(config.monsters.speed.vyMin + Math.random() * (config.monsters.speed.vyMax - config.monsters.speed.vyMin));
        this.gravity = config.monsters.gravity;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * config.rotationSpeed;
        this.image = loadedMonsterImages[Math.floor(Math.random() * loadedMonsterImages.length)] || null;
        this.alive = true;
        this.points = config.pointsPerKill;
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
    scoreEl.textContent = gameState.totalScore + gameState.stageScore;
    stageEl.textContent = gameState.currentStage + 1;
    const config = STAGE_CONFIGS[gameState.currentStage];
    targetEl.textContent = `${gameState.stageScore}/${config.targetScore}`;
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

function setBackground(imagePath) {
    if (imagePath) {
        backgroundLayer.style.backgroundImage = `url('${imagePath}')`;
    } else {
        backgroundLayer.style.backgroundImage = 'none';
    }
}

function spawnMonster() {
    if (!gameState.isPlaying) return;
    const config = STAGE_CONFIGS[gameState.currentStage];
    gameState.monsters.push(new Monster(config));
    const interval = config.monsters.spawnInterval.min + Math.random() * (config.monsters.spawnInterval.max - config.monsters.spawnInterval.min);
    setTimeout(spawnMonster, interval);
}

function checkStageComplete() {
    const config = STAGE_CONFIGS[gameState.currentStage];
    if (gameState.stageScore >= config.targetScore) {
        gameState.isPlaying = false;
        gameState.totalScore += gameState.stageScore;
        
        if (gameState.currentStage >= STAGE_CONFIGS.length - 1) {
            showGameComplete();
        } else {
            showStageComplete();
        }
    }
}

function showStageComplete() {
    completedStageEl.textContent = gameState.currentStage + 1;
    stageScoreEl.textContent = gameState.stageScore;
    stageCompleteScreen.classList.remove('hidden');
}

function showGameComplete() {
    totalScoreEl.textContent = gameState.totalScore;
    gameCompleteScreen.classList.remove('hidden');
}

function endGame() {
    gameState.isPlaying = false;
    reachedStageEl.textContent = gameState.currentStage + 1;
    finalScoreEl.textContent = gameState.totalScore + gameState.stageScore;
    gameOverScreen.classList.remove('hidden');
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
                gameState.stageScore += points;
                updateUI();
                checkStageComplete();
                
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

function initStage(stageIndex) {
    const config = STAGE_CONFIGS[stageIndex];
    gameState.currentStage = stageIndex;
    gameState.stageScore = 0;
    gameState.combo = 0;
    gameState.lives = config.lives;
    gameState.monsters = [];
    gameState.slashTrails = [];
    gameState.lastLeftWrist = null;
    gameState.lastRightWrist = null;
    
    setBackground(config.background);
    updateUI();
}

async function startGame() {
    await preloadImages();
    gameState.totalScore = 0;
    initStage(0);
    gameState.isPlaying = true;
    startScreen.classList.add('hidden');
    stageCompleteScreen.classList.add('hidden');
    gameCompleteScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    spawnMonster();
    gameLoop();
}

function nextStage() {
    initStage(gameState.currentStage + 1);
    gameState.isPlaying = true;
    stageCompleteScreen.classList.add('hidden');
    
    spawnMonster();
    gameLoop();
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
    nextStageBtn.addEventListener('click', nextStage);
    playAgainBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
}

init();
