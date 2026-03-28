/**
 * 毛利杀海怪 — 上肢活动互动游戏
 * MediaPipe Pose：人体分割 + 手腕轨迹，海洋为虚拟背景（类似视频会议）
 */

const STAGE_CONFIGS = [
    {
        id: 1,
        name: "浅海热身",
        targetScore: 120,
        lives: 6,
        background: "img/background01.png",
        monsters: {
            size: { min: 100, max: 160 },
            speed: { vx: 0.65, vyMin: 5.5, vyMax: 8.5 },
            gravity: 0.055,
            spawnInterval: { min: 700, max: 1400 },
            spawnCount: { min: 2, max: 5 },
            levelUpBonus: 0.25
        },
        pointsPerKill: 10
    },
    {
        id: 2,
        name: "浪花区",
        targetScore: 220,
        lives: 5,
        background: "img/background02.png",
        monsters: {
            size: { min: 92, max: 150 },
            speed: { vx: 0.8, vyMin: 6.5, vyMax: 10 },
            gravity: 0.065,
            spawnInterval: { min: 650, max: 1300 },
            spawnCount: { min: 3, max: 6 },
            levelUpBonus: 0.45
        },
        pointsPerKill: 15
    },
    {
        id: 3,
        name: "深海激流",
        targetScore: 380,
        lives: 5,
        background: "img/background03.png",
        monsters: {
            size: { min: 84, max: 140 },
            speed: { vx: 0.95, vyMin: 7.5, vyMax: 12 },
            gravity: 0.078,
            spawnInterval: { min: 600, max: 1200 },
            spawnCount: { min: 4, max: 7 },
            levelUpBonus: 0.65
        },
        pointsPerKill: 20
    },
    {
        id: 4,
        name: "终极海渊",
        targetScore: 520,
        lives: 4,
        background: "img/background01.png",
        monsters: {
            size: { min: 78, max: 130 },
            speed: { vx: 1.1, vyMin: 8.5, vyMax: 14 },
            gravity: 0.09,
            spawnInterval: { min: 550, max: 1100 },
            spawnCount: { min: 4, max: 8 },
            levelUpBonus: 0.85
        },
        pointsPerKill: 28
    }
];

const MIN_SLASH_LEN = 26;
const HIT_RADIUS_EXTRA = 58;
const LANDMARK_MIN_VIS = 0.35;
const MAX_MONSTERS = 5;

const monsterImages = [
    "img/sea-monster/blowfish.png",
    "img/sea-monster/crabs.png",
    "img/sea-monster/eel.png",
    "img/sea-monster/electric fish.png",
    "img/sea-monster/octopus.png",
    "img/sea-monster/starfish.png",
    "img/sea-monster/turtle.png"
];

/** 与 monsterImages 下标一致，用于习性动画 */
const SPECIES = {
    BLOWFISH: 0,
    CRAB: 1,
    EEL: 2,
    ELECTRIC: 3,
    OCTOPUS: 4,
    STARFISH: 5,
    TURTLE: 6
};

let gameState = {
    isPlaying: false,
    currentStage: 0,
    totalScore: 0,
    stageScore: 0,
    combo: 0,
    lives: 5,
    monsters: [],
    slashTrails: [],
    killBursts: [],
    floatTexts: [],
    lastLeftWrist: null,
    lastRightWrist: null
};

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const video = document.getElementById("camera-feed");
const bgCanvas = document.getElementById("bg-composite");
const bgCtx = bgCanvas.getContext("2d");
const scratchCanvas = document.createElement("canvas");
const scratchCtx = scratchCanvas.getContext("2d");
const bgImage = new Image();
const startScreen = document.getElementById("start-screen");
const stageCompleteScreen = document.getElementById("stage-complete-screen");
const gameCompleteScreen = document.getElementById("game-complete-screen");
const gameOverScreen = document.getElementById("game-over-screen");

const startBtn = document.getElementById("start-btn");
const nextStageBtn = document.getElementById("next-stage-btn");
const playAgainBtn = document.getElementById("play-again-btn");
const restartBtn = document.getElementById("restart-btn");

const scoreEl = document.getElementById("score");
const stageEl = document.getElementById("stage");
const targetEl = document.getElementById("target");
const comboEl = document.getElementById("combo");
const livesEl = document.getElementById("lives");
const completedStageEl = document.getElementById("completed-stage");
const stageScoreEl = document.getElementById("stage-score");
const totalScoreEl = document.getElementById("total-score");
const reachedStageEl = document.getElementById("reached-stage");
const finalScoreEl = document.getElementById("final-score");

const loadedMonsterImages = [];

function resizeCanvas() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    bgCanvas.width = w;
    bgCanvas.height = h;
}

/**
 * object-fit: cover 绘制（用于海洋图、人物层）
 */
function drawImageCover(ctx2, src, cw, ch) {
    const iw = src.naturalWidth || src.videoWidth || src.width;
    const ih = src.naturalHeight || src.videoHeight || src.height;
    if (!iw || !ih) return;
    const ir = iw / ih;
    const cr = cw / ch;
    let dw;
    let dh;
    let ox;
    let oy;
    if (ir > cr) {
        dh = ch;
        dw = dh * ir;
        ox = (cw - dw) / 2;
        oy = 0;
    } else {
        dw = cw;
        dh = dw / ir;
        ox = 0;
        oy = (ch - dh) / 2;
    }
    ctx2.drawImage(src, ox, oy, dw, dh);
}

/**
 * 海洋虚拟背景 + 仅绘制抠像后的人物（镜像与游戏坐标一致）
 */
function drawVirtualBackground(results) {
    const w = bgCanvas.width;
    const h = bgCanvas.height;
    if (!w || !h) return;

    bgCtx.clearRect(0, 0, w, h);
    if (bgImage.complete && bgImage.naturalWidth) {
        drawImageCover(bgCtx, bgImage, w, h);
    } else {
        bgCtx.fillStyle = "#023047";
        bgCtx.fillRect(0, 0, w, h);
    }

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 360;
    if (!vw || !vh) return;

    const mask = results.segmentationMask;

    if (!mask) {
        bgCtx.save();
        bgCtx.translate(w, 0);
        bgCtx.scale(-1, 1);
        drawImageCover(bgCtx, video, w, h);
        bgCtx.restore();
        return;
    }

    scratchCanvas.width = vw;
    scratchCanvas.height = vh;
    scratchCtx.clearRect(0, 0, vw, vh);
    scratchCtx.drawImage(mask, 0, 0, vw, vh);
    scratchCtx.globalCompositeOperation = "source-in";
    scratchCtx.drawImage(video, 0, 0, vw, vh);
    scratchCtx.globalCompositeOperation = "source-over";

    bgCtx.save();
    bgCtx.translate(w, 0);
    bgCtx.scale(-1, 1);
    drawImageCover(bgCtx, scratchCanvas, w, h);
    bgCtx.restore();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

async function preloadImages() {
    for (const src of monsterImages) {
        const img = new Image();
        img.src = src;
        await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
        });
        loadedMonsterImages.push(img);
    }
}

function landmarkVisible(lm) {
    const v = lm.visibility;
    return v === undefined || v === null || v >= LANDMARK_MIN_VIS;
}

class Monster {
    constructor(config) {
        this.size =
            config.monsters.size.min +
            Math.random() * (config.monsters.size.max - config.monsters.size.min);
        this.monsterTypeIndex = Math.floor(Math.random() * loadedMonsterImages.length);
        this.opacity = 1;
        this.spawnAge = 0;
        this.spawnDuration = 22 + Math.floor(Math.random() * 10);

        this.puffPhase = Math.random() * Math.PI * 2;
        this.puffSpeed = 0.09 + Math.random() * 0.05;
        this.eelPhase = Math.random() * Math.PI * 2;
        this.eelWiggle = 0.11 + Math.random() * 0.05;
        this.eelAmp = 2.8 + Math.random() * 2.2;
        this.bobPhase = Math.random() * Math.PI * 2;
        this.electricShock = 0;
        this.flipX = 1;

        const spawnType = Math.random();
        const sp = this.monsterTypeIndex;

        if (sp === SPECIES.CRAB) {
            this.spawnCrabHorizontal(config);
        } else if (sp === SPECIES.OCTOPUS) {
            this.spawnOctopusBob(config);
        } else if (sp === SPECIES.STARFISH) {
            this.spawnStarfishCreep(config);
        } else if (sp === SPECIES.EEL && Math.random() < 0.55) {
            this.spawnEelSlither(config);
        } else {
            this.spawnGeneric(config, spawnType);
        }

        this.gravity = this.gravity ?? config.monsters.gravity;
        this.rotation = this.rotation ?? (Math.random() - 0.5) * 0.35;
        this.spin = this.spin ?? (Math.random() - 0.5) * 0.018;

        if (sp === SPECIES.TURTLE) {
            this.vx *= 0.62;
            this.vy *= 0.58;
            this.gravity *= 0.72;
            this.spin *= 0.35;
        }

        if (sp === SPECIES.BLOWFISH) {
            this.spin *= 0.22;
        }

        if (sp === SPECIES.STARFISH) {
            this.spin = (Math.random() > 0.5 ? 1 : -1) * (0.006 + Math.random() * 0.008);
        }

        this.image = loadedMonsterImages[this.monsterTypeIndex] || null;
        this.alive = true;
        this.points = config.pointsPerKill;
    }

    spawnCrabHorizontal(config) {
        this.x = this.size / 2 + Math.random() * (canvas.width - this.size);
        this.y = canvas.height + this.size * 0.42;
        const goRight = Math.random() > 0.5;
        this.vx = (goRight ? 1 : -1) * config.monsters.speed.vx * (1.85 + Math.random() * 1.35);
        this.vy = -(1.0 + Math.random() * 2.2);
        this.gravity = config.monsters.gravity * 0.32;
        this.spin = (Math.random() - 0.5) * 0.005;
        this.rotation = 0;
    }

    spawnOctopusBob(config) {
        this.x = this.size / 2 + Math.random() * (canvas.width - this.size);
        this.y = canvas.height + this.size * 0.48;
        this.vx = (Math.random() - 0.5) * config.monsters.speed.vx * 1.05;
        this.vy = -(config.monsters.speed.vyMin * 0.5 + Math.random() * 2.0);
        this.gravity = config.monsters.gravity * 0.68;
        this.spin = (Math.random() - 0.5) * 0.016;
        this.rotation = (Math.random() - 0.5) * 0.2;
        this.octopusBaseRot = this.rotation;
    }

    spawnStarfishCreep(config) {
        this.x = this.size / 2 + Math.random() * (canvas.width - this.size);
        this.y = canvas.height + this.size * 0.35;
        this.vx = (Math.random() - 0.5) * config.monsters.speed.vx * 0.65;
        this.vy = -(config.monsters.speed.vyMin * 0.32 + Math.random() * 1.1);
        this.gravity = config.monsters.gravity * 0.42;
        this.rotation = Math.random() * Math.PI * 2;
    }

    spawnEelSlither(config) {
        const fromLeft = Math.random() > 0.5;
        this.x = fromLeft ? -this.size / 2 : canvas.width + this.size / 2;
        this.y = canvas.height * 0.28 + Math.random() * canvas.height * 0.48;
        this.vx = (fromLeft ? 1 : -1) * config.monsters.speed.vx * (1.35 + Math.random() * 0.95);
        this.vy = (Math.random() - 0.5) * config.monsters.speed.vx * 1.1;
        this.gravity = config.monsters.gravity * 0.52;
        this.rotation = fromLeft ? -0.15 : 0.15;
        this.spin = 0;
    }

    spawnGeneric(config, spawnType) {
        if (spawnType < 0.35) {
            this.x = this.size / 2 + Math.random() * (canvas.width - this.size);
            this.y = canvas.height + this.size / 2;
            this.vx = (Math.random() - 0.5) * config.monsters.speed.vx * 1.45;
            this.vy = -(
                config.monsters.speed.vyMin +
                Math.random() * (config.monsters.speed.vyMax - config.monsters.speed.vyMin)
            );
        } else if (spawnType < 0.5) {
            this.x = -this.size / 2;
            this.y = canvas.height * 0.22 + Math.random() * canvas.height * 0.48;
            this.vx = config.monsters.speed.vx * (0.55 + Math.random() * 0.75);
            this.vy = -(config.monsters.speed.vyMin * 0.35 + Math.random() * config.monsters.speed.vyMin * 0.55);
        } else if (spawnType < 0.65) {
            this.x = canvas.width + this.size / 2;
            this.y = canvas.height * 0.22 + Math.random() * canvas.height * 0.48;
            this.vx = -config.monsters.speed.vx * (0.55 + Math.random() * 0.75);
            this.vy = -(config.monsters.speed.vyMin * 0.35 + Math.random() * config.monsters.speed.vyMin * 0.55);
        } else if (spawnType < 0.82) {
            this.x = this.size / 2 + Math.random() * (canvas.width - this.size);
            this.y = canvas.height * 0.55 + Math.random() * canvas.height * 0.28;
            this.vx = (Math.random() - 0.5) * config.monsters.speed.vx * 1.15;
            this.vy = -(config.monsters.speed.vyMin * 0.5 + Math.random() * config.monsters.speed.vyMin * 0.45);
        } else {
            this.x = this.size / 2 + Math.random() * (canvas.width - this.size);
            this.y = -this.size / 2;
            this.vx = (Math.random() - 0.5) * config.monsters.speed.vx * 0.75;
            this.vy = config.monsters.speed.vyMin * 0.45 + Math.random() * config.monsters.speed.vyMin * 0.55;
        }
    }

    getSpawnScale() {
        if (this.spawnAge >= this.spawnDuration) return 1;
        const t = this.spawnAge / this.spawnDuration;
        return 0.2 + 0.8 * (1 - Math.pow(1 - t, 3));
    }

    /** 河豚鼓气缩放，其余为 1 */
    getSpeciesScale() {
        if (this.monsterTypeIndex === SPECIES.BLOWFISH) {
            return 0.78 + 0.22 * Math.sin(this.spawnAge * this.puffSpeed + this.puffPhase);
        }
        return 1;
    }

    getDrawScale() {
        return this.size * this.getSpawnScale() * this.getSpeciesScale();
    }

    update() {
        if (!this.alive) return false;

        this.spawnAge++;
        const sp = this.monsterTypeIndex;

        if (sp === SPECIES.EEL) {
            this.eelPhase += this.eelWiggle;
            this.x += Math.sin(this.eelPhase) * this.eelAmp * 0.14;
            this.rotation += Math.sin(this.eelPhase * 1.3) * 0.04;
        } else if (sp === SPECIES.ELECTRIC) {
            this.electricShock += 0.45 + Math.random() * 0.35;
            this.vx += (Math.random() - 0.5) * 0.48;
            this.vy += (Math.random() - 0.5) * 0.38;
            this.rotation += (Math.random() - 0.5) * 0.04;
            const maxV = 5.2;
            this.vx = Math.max(-maxV, Math.min(maxV, this.vx));
            this.vy = Math.max(-maxV, Math.min(maxV, this.vy));
        } else if (sp === SPECIES.OCTOPUS) {
            this.bobPhase += 0.065;
            this.y += Math.sin(this.bobPhase) * 0.55;
            this.x += Math.cos(this.bobPhase * 0.7) * 0.35;
            const base = this.octopusBaseRot ?? this.rotation;
            this.rotation = base + Math.sin(this.bobPhase * 0.5) * 0.28;
        } else if (sp === SPECIES.STARFISH) {
            this.rotation += this.spin;
        } else if (sp === SPECIES.CRAB) {
            this.rotation = 0;
        } else {
            this.rotation += this.spin;
        }

        this.vy += this.gravity;

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < this.size / 2) {
            this.x = this.size / 2;
            this.vx = Math.abs(this.vx);
        } else if (this.x > canvas.width - this.size / 2) {
            this.x = canvas.width - this.size / 2;
            this.vx = -Math.abs(this.vx);
        }

        const out =
            this.y > canvas.height + 420 ||
            this.y < -this.size - 220 ||
            this.x < -this.size - 200 ||
            this.x > canvas.width + this.size + 200;

        if (out) {
            if (this.y > canvas.height - 80) {
                gameState.lives--;
                gameState.combo = 0;
                updateUI();
                if (gameState.lives <= 0) endGame();
            }
            return false;
        }
        return true;
    }

    draw(ctx2) {
        if (!this.alive) return;
        const s = this.getDrawScale();
        const half = s / 2;
        const sp = this.monsterTypeIndex;

        if (sp === SPECIES.CRAB) {
            this.flipX = this.vx >= 0 ? 1 : -1;
        }

        ctx2.save();
        ctx2.translate(this.x, this.y);
        if (sp === SPECIES.CRAB) {
            ctx2.scale(this.flipX, 1);
        }
        ctx2.rotate(this.rotation);
        ctx2.globalAlpha = this.opacity;

        if (sp === SPECIES.ELECTRIC) {
            const flick = 0.88 + 0.12 * Math.sin(this.electricShock);
            ctx2.scale(flick, flick);
        }

        if (this.image && this.image.complete && this.image.naturalWidth) {
            ctx2.drawImage(this.image, -half, -half, s, s);
        } else {
            ctx2.fillStyle = "#ff6b6b";
            ctx2.beginPath();
            ctx2.arc(0, 0, half, 0, Math.PI * 2);
            ctx2.fill();
            ctx2.fillStyle = "#fff";
            ctx2.font = `${Math.max(20, half * 0.45)}px sans-serif`;
            ctx2.textAlign = "center";
            ctx2.textBaseline = "middle";
            ctx2.fillText("海怪", 0, 0);
        }
        ctx2.restore();
    }

    checkHit(px, py) {
        if (!this.alive) return false;
        const r = this.getDrawScale() / 2 + HIT_RADIUS_EXTRA;
        const dx = this.x - px;
        const dy = this.y - py;
        return dx * dx + dy * dy < r * r;
    }
}

class SlashTrail {
    constructor(x1, y1, x2, y2, hue) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.life = 1;
        this.decay = 0.065;
        this.hue = hue;
    }

    update() {
        this.life -= this.decay;
        return this.life > 0;
    }

    draw(ctx2) {
        ctx2.save();
        ctx2.globalAlpha = Math.min(1, this.life * 1.2);
        const g = ctx2.createLinearGradient(this.x1, this.y1, this.x2, this.y2);
        g.addColorStop(0, `hsla(${this.hue}, 95%, 62%, ${this.life})`);
        g.addColorStop(1, `hsla(${(this.hue + 40) % 360}, 90%, 55%, ${this.life * 0.4})`);
        ctx2.strokeStyle = g;
        ctx2.lineWidth = 10 * this.life;
        ctx2.lineCap = "round";
        ctx2.shadowColor = `hsla(${this.hue}, 100%, 60%, 0.9)`;
        ctx2.shadowBlur = 14 * this.life;
        ctx2.beginPath();
        ctx2.moveTo(this.x1, this.y1);
        ctx2.lineTo(this.x2, this.y2);
        ctx2.stroke();
        ctx2.restore();
    }
}

class KillBurst {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 1;
        this.particles = [];
        for (let i = 0; i < 14; i++) {
            const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.5;
            const sp = 3 + Math.random() * 6;
            this.particles.push({
                x: 0,
                y: 0,
                vx: Math.cos(a) * sp,
                vy: Math.sin(a) * sp - 1.2,
                size: 3 + Math.random() * 5
            });
        }
    }

    update() {
        this.life -= 0.05;
        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.18;
            p.vx *= 0.98;
        }
        return this.life > 0;
    }

    draw(ctx2) {
        ctx2.save();
        ctx2.globalAlpha = this.life;
        let i = 0;
        for (const p of this.particles) {
            const px = this.x + p.x;
            const py = this.y + p.y;
            ctx2.fillStyle = i % 2 === 0 ? "#ffd166" : "#fb8500";
            ctx2.beginPath();
            ctx2.arc(px, py, p.size * this.life, 0, Math.PI * 2);
            ctx2.fill();
            i++;
        }
        ctx2.restore();
    }
}

class FloatScore {
    constructor(x, y, text) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.life = 1;
        this.vy = -2.2;
    }

    update() {
        this.y += this.vy;
        this.life -= 0.028;
        return this.life > 0;
    }

    draw(ctx2) {
        ctx2.save();
        ctx2.globalAlpha = Math.min(1, this.life * 1.5);
        ctx2.font = "bold 26px system-ui, sans-serif";
        ctx2.fillStyle = "#ffd166";
        ctx2.strokeStyle = "rgba(0,0,0,0.45)";
        ctx2.lineWidth = 4;
        ctx2.textAlign = "center";
        ctx2.strokeText(this.text, this.x, this.y);
        ctx2.fillText(this.text, this.x, this.y);
        ctx2.restore();
    }
}

function updateUI() {
    const sum = gameState.totalScore + gameState.stageScore;
    scoreEl.textContent = sum;
    stageEl.textContent = gameState.currentStage + 1;
    const config = STAGE_CONFIGS[gameState.currentStage];
    targetEl.textContent = `${gameState.stageScore}/${config.targetScore}`;
    comboEl.textContent = gameState.combo;
    livesEl.textContent = gameState.lives;
}

function showComboText(x, y, text) {
    const el = document.createElement("div");
    el.className = "combo-text";
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.getElementById("game-container").appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function setBackground(imagePath) {
    if (imagePath) {
        bgImage.src = imagePath;
    }
}

function spawnMonster() {
    if (!gameState.isPlaying) return;
    const config = STAGE_CONFIGS[gameState.currentStage];
    const aliveCount = gameState.monsters.filter((m) => m.alive).length;

    if (aliveCount < MAX_MONSTERS) {
        const maxPossible = MAX_MONSTERS - aliveCount;
        const desired =
            config.monsters.spawnCount.min +
            Math.floor(
                Math.random() * (config.monsters.spawnCount.max - config.monsters.spawnCount.min + 1)
            );
        const count = Math.min(desired, maxPossible);
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (gameState.isPlaying) {
                    gameState.monsters.push(new Monster(config));
                }
            }, i * 180);
        }
    }

    const interval =
        config.monsters.spawnInterval.min +
        Math.random() * (config.monsters.spawnInterval.max - config.monsters.spawnInterval.min);
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
    stageCompleteScreen.classList.remove("hidden");
}

function showGameComplete() {
    totalScoreEl.textContent = gameState.totalScore;
    gameCompleteScreen.classList.remove("hidden");
}

function endGame() {
    gameState.isPlaying = false;
    reachedStageEl.textContent = gameState.currentStage + 1;
    finalScoreEl.textContent = gameState.totalScore + gameState.stageScore;
    gameOverScreen.classList.remove("hidden");
}

function processSlash(x1, y1, x2, y2, hue) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.hypot(dx, dy);
    if (distance < MIN_SLASH_LEN) return;

    gameState.slashTrails.push(new SlashTrail(x1, y1, x2, y2, hue));

    const steps = Math.ceil(distance / 18);
    const hitIds = new Set();

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = x1 + dx * t;
        const py = y1 + dy * t;

        for (const monster of gameState.monsters) {
            if (!monster.alive || hitIds.has(monster)) continue;
            if (monster.checkHit(px, py)) {
                hitIds.add(monster);
                monster.alive = false;
                gameState.combo++;
                const comboTier = Math.floor(gameState.combo / 5);
                const config = STAGE_CONFIGS[gameState.currentStage];
                const bonus = 1 + comboTier * (0.12 + config.monsters.levelUpBonus * 0.08);
                const points = Math.round(monster.points * bonus);
                gameState.stageScore += points;
                gameState.killBursts.push(new KillBurst(monster.x, monster.y));
                gameState.floatTexts.push(new FloatScore(monster.x, monster.y - 30, `+${points}`));
                updateUI();
                checkStageComplete();
                if (gameState.combo >= 3) {
                    showComboText(monster.x, monster.y, `${gameState.combo} 连击`);
                }
            }
        }
    }
}

function onResults(results) {
    drawVirtualBackground(results);

    if (!gameState.isPlaying || !results.poseLandmarks) return;

    const landmarks = results.poseLandmarks;
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];

    const lx = (1 - leftWrist.x) * canvas.width;
    const ly = leftWrist.y * canvas.height;
    const rx = (1 - rightWrist.x) * canvas.width;
    const ry = rightWrist.y * canvas.height;

    if (landmarkVisible(leftWrist)) {
        if (gameState.lastLeftWrist) {
            processSlash(gameState.lastLeftWrist.x, gameState.lastLeftWrist.y, lx, ly, 195);
        }
        gameState.lastLeftWrist = { x: lx, y: ly };
    } else {
        gameState.lastLeftWrist = null;
    }

    if (landmarkVisible(rightWrist)) {
        if (gameState.lastRightWrist) {
            processSlash(gameState.lastRightWrist.x, gameState.lastRightWrist.y, rx, ry, 28);
        }
        gameState.lastRightWrist = { x: rx, y: ry };
    } else {
        gameState.lastRightWrist = null;
    }
}

function gameLoop() {
    if (!gameState.isPlaying) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    gameState.monsters = gameState.monsters.filter((monster) => {
        if (!monster.alive) return false;
        const onScreen = monster.update();
        if (onScreen) monster.draw(ctx);
        return onScreen;
    });

    gameState.slashTrails = gameState.slashTrails.filter((trail) => {
        const alive = trail.update();
        if (alive) trail.draw(ctx);
        return alive;
    });

    gameState.killBursts = gameState.killBursts.filter((b) => {
        const alive = b.update();
        if (alive) b.draw(ctx);
        return alive;
    });

    gameState.floatTexts = gameState.floatTexts.filter((f) => {
        const alive = f.update();
        if (alive) f.draw(ctx);
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
    gameState.killBursts = [];
    gameState.floatTexts = [];
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
    startScreen.classList.add("hidden");
    stageCompleteScreen.classList.add("hidden");
    gameCompleteScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    spawnMonster();
    gameLoop();
}

function nextStage() {
    initStage(gameState.currentStage + 1);
    gameState.isPlaying = true;
    stageCompleteScreen.classList.add("hidden");

    spawnMonster();
    gameLoop();
}

function enableStartAfterCamera() {
    const cameraStatusEl = document.getElementById("camera-status");
    if (cameraStatusEl) {
        cameraStatusEl.textContent =
            "摄像头已开启，您将以虚拟海洋为背景显示（人体抠像），可开始游戏。";
    }
    startBtn.disabled = false;
}

async function init() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    video.srcObject = stream;

    if (video.readyState >= 2) {
        enableStartAfterCamera();
    } else {
        video.addEventListener("playing", enableStartAfterCamera, { once: true });
        video.addEventListener(
            "loadeddata",
            () => {
                if (startBtn.disabled) enableStartAfterCamera();
            },
            { once: true }
        );
    }

    const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.55
    });

    pose.onResults(onResults);

    const camera = new Camera(video, {
        onFrame: async () => {
            await pose.send({ image: video });
        },
        width: 640,
        height: 360
    });

    camera.start();

    setBackground(STAGE_CONFIGS[0].background);

    startBtn.addEventListener("click", startGame);
    nextStageBtn.addEventListener("click", nextStage);
    playAgainBtn.addEventListener("click", startGame);
    restartBtn.addEventListener("click", startGame);
}

init().catch((err) => {
    console.error(err);
    const cameraStatusEl = document.getElementById("camera-status");
    if (cameraStatusEl) {
        cameraStatusEl.textContent = "无法打开摄像头，请在浏览器设置中允许摄像头后刷新页面。";
    }
    alert("无法打开摄像头或加载姿态模型，请检查浏览器权限与网络（需加载 MediaPipe 脚本）。");
});
