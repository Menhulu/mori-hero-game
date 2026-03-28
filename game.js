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
const WRIST_HISTORY_MAX = 18;
/** 指数平滑：越大越跟手，越小越顺滑 */
const WRIST_SMOOTH_ALPHA = 0.32;
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

/** 武器图与握持参数：anchor 为握把末端在图上的比例（偏下=更接近拳心一侧） */
const WEAPONS = [
    {
        path: "img/weapon/knif.png",
        label: "短刀",
        angleOffset: 1.14,
        anchorX: 0.5,
        anchorY: 0.84,
        scale: 1
    },
    {
        path: "img/weapon/axe.png",
        label: "战斧",
        angleOffset: 0.98,
        anchorX: 0.5,
        anchorY: 0.86,
        scale: 1.02
    }
];

/** 武器显示宽度 ≈ 小臂长度(像素) × 该系数，再限制在 min～max，避免过小或出屏 */
const WEAPON_FOREARM_RATIO = 0.96;
const WEAPON_MIN_WIDTH_PX = 178;

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
    leftWristHistory: [],
    rightWristHistory: [],
    leftWristSmooth: { x: null, y: null },
    rightWristSmooth: { x: null, y: null },
    selectedWeaponIndex: 0,
    weaponPoseSmooth: { left: null, right: null },
    gripHintTimer: null
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
const loadedWeapons = [];

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

async function preloadMonsterImages() {
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

async function preloadWeaponImages() {
    for (const w of WEAPONS) {
        const img = new Image();
        img.src = w.path;
        await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
        });
        loadedWeapons.push(img);
    }
}

async function preloadImages() {
    await Promise.all([preloadMonsterImages(), preloadWeaponImages()]);
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

/**
 * 刀光：直线段或三次贝塞尔（Catmull-Rom 平滑段，过点更顺）
 */
class SlashTrail {
    constructor(kind, hue, payload) {
        this.kind = kind;
        this.hue = hue;
        this.life = 1;
        this.decay = 0.042;
        if (kind === "line") {
            this.p0 = payload.p0;
            this.p1 = payload.p1;
        } else {
            this.b0 = payload.b0;
            this.b1 = payload.b1;
            this.b2 = payload.b2;
            this.b3 = payload.b3;
        }
    }

    gradientEndpoints() {
        if (this.kind === "line") {
            return { x0: this.p0.x, y0: this.p0.y, x1: this.p1.x, y1: this.p1.y };
        }
        return { x0: this.b0.x, y0: this.b0.y, x1: this.b3.x, y1: this.b3.y };
    }

    path(ctx2) {
        ctx2.beginPath();
        if (this.kind === "line") {
            ctx2.moveTo(this.p0.x, this.p0.y);
            ctx2.lineTo(this.p1.x, this.p1.y);
        } else {
            ctx2.moveTo(this.b0.x, this.b0.y);
            ctx2.bezierCurveTo(this.b1.x, this.b1.y, this.b2.x, this.b2.y, this.b3.x, this.b3.y);
        }
    }

    update() {
        this.life -= this.decay;
        return this.life > 0;
    }

    draw(ctx2) {
        const a = Math.min(1, this.life * 1.15);
        const { x0, y0, x1, y1 } = this.gradientEndpoints();
        const g = ctx2.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, `hsla(${this.hue}, 98%, 58%, ${a})`);
        g.addColorStop(0.5, `hsla(${(this.hue + 25) % 360}, 95%, 52%, ${a * 0.95})`);
        g.addColorStop(1, `hsla(${(this.hue + 48) % 360}, 92%, 48%, ${a * 0.55})`);

        ctx2.save();
        ctx2.lineCap = "round";
        ctx2.lineJoin = "round";

        ctx2.globalAlpha = a * 0.5;
        ctx2.strokeStyle = `hsla(${this.hue}, 100%, 72%, 0.85)`;
        ctx2.lineWidth = 44 * this.life;
        ctx2.shadowColor = `hsla(${this.hue}, 100%, 62%, 1)`;
        ctx2.shadowBlur = 48 * this.life;
        this.path(ctx2);
        ctx2.stroke();

        ctx2.globalAlpha = a * 0.72;
        ctx2.strokeStyle = g;
        ctx2.lineWidth = 26 * this.life;
        ctx2.shadowBlur = 28 * this.life;
        this.path(ctx2);
        ctx2.stroke();

        ctx2.globalAlpha = a;
        ctx2.strokeStyle = `hsla(${(this.hue + 12) % 360}, 100%, 92%, 1)`;
        ctx2.lineWidth = 11 * this.life;
        ctx2.shadowColor = "#fff";
        ctx2.shadowBlur = 18 * this.life;
        this.path(ctx2);
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
        for (let i = 0; i < 22; i++) {
            const a = (Math.PI * 2 * i) / 22 + Math.random() * 0.55;
            const sp = 5 + Math.random() * 9;
            this.particles.push({
                x: 0,
                y: 0,
                vx: Math.cos(a) * sp,
                vy: Math.sin(a) * sp - 1.4,
                size: 5 + Math.random() * 9
            });
        }
    }

    update() {
        this.life -= 0.045;
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
        this.vy = -2.6;
    }

    update() {
        this.y += this.vy;
        this.life -= 0.024;
        return this.life > 0;
    }

    draw(ctx2) {
        ctx2.save();
        ctx2.globalAlpha = Math.min(1, this.life * 1.5);
        const fontPx = Math.round(34 + 14 * this.life);
        ctx2.font = `800 ${fontPx}px system-ui, "Segoe UI", sans-serif`;
        ctx2.fillStyle = "#ffd166";
        ctx2.strokeStyle = "rgba(0,0,0,0.55)";
        ctx2.lineWidth = 7;
        ctx2.textAlign = "center";
        ctx2.textBaseline = "middle";
        ctx2.strokeText(this.text, this.x, this.y);
        ctx2.shadowColor = "rgba(255, 209, 102, 0.7)";
        ctx2.shadowBlur = 14;
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
    setTimeout(() => el.remove(), 1400);
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

function showGripHintBar() {
    const el = document.getElementById("grip-hint");
    if (!el) return;
    if (gameState.gripHintTimer) clearTimeout(gameState.gripHintTimer);
    el.classList.remove("hidden");
    gameState.gripHintTimer = setTimeout(() => {
        el.classList.add("hidden");
        gameState.gripHintTimer = null;
    }, 14000);
}

function hideGripHintBar() {
    const el = document.getElementById("grip-hint");
    if (el) el.classList.add("hidden");
    if (gameState.gripHintTimer) {
        clearTimeout(gameState.gripHintTimer);
        gameState.gripHintTimer = null;
    }
}

function showStageComplete() {
    hideGripHintBar();
    completedStageEl.textContent = gameState.currentStage + 1;
    stageScoreEl.textContent = gameState.stageScore;
    stageCompleteScreen.classList.remove("hidden");
}

function showGameComplete() {
    hideGripHintBar();
    totalScoreEl.textContent = gameState.totalScore;
    gameCompleteScreen.classList.remove("hidden");
}

function endGame() {
    gameState.isPlaying = false;
    hideGripHintBar();
    reachedStageEl.textContent = gameState.currentStage + 1;
    finalScoreEl.textContent = gameState.totalScore + gameState.stageScore;
    gameOverScreen.classList.remove("hidden");
}

function cubicBezierPoint(b0, b1, b2, b3, t) {
    const u = 1 - t;
    const u2 = u * u;
    const u3 = u2 * u;
    const t2 = t * t;
    const t3 = t2 * t;
    return {
        x: u3 * b0.x + 3 * u2 * t * b1.x + 3 * u * t2 * b2.x + t3 * b3.x,
        y: u3 * b0.y + 3 * u2 * t * b1.y + 3 * u * t2 * b2.y + t3 * b3.y
    };
}

/**
 * 均匀 Catmull-Rom：曲线从 P1 到 P2，四结点为 P0,P1,P2,P3（P0/P3 可为外推点）
 */
function catmullRomSegmentToBezier(p0, p1, p2, p3) {
    return {
        b0: { x: p1.x, y: p1.y },
        b1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
        b2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
        b3: { x: p2.x, y: p2.y }
    };
}

function approximateCubicLength(b0, b1, b2, b3) {
    let len = 0;
    let prev = { x: b0.x, y: b0.y };
    const seg = 24;
    for (let i = 1; i <= seg; i++) {
        const t = i / seg;
        const p = cubicBezierPoint(b0, b1, b2, b3, t);
        len += Math.hypot(p.x - prev.x, p.y - prev.y);
        prev = p;
    }
    return len;
}

function tryHitMonsterAt(px, py, hitIds) {
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
            gameState.floatTexts.push(new FloatScore(monster.x, monster.y - 42, `+${points}`));
            updateUI();
            checkStageComplete();
            if (gameState.combo >= 3) {
                showComboText(monster.x, monster.y, `${gameState.combo} 连击`);
            }
        }
    }
}

function sampleHitsAlongLine(px0, py0, px1, py1) {
    const dx = px1 - px0;
    const dy = py1 - py0;
    const distance = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(distance / 14));
    const hitIds = new Set();
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        tryHitMonsterAt(px0 + dx * t, py0 + dy * t, hitIds);
    }
}

function sampleHitsAlongCubic(b0, b1, b2, b3) {
    const len = approximateCubicLength(b0, b1, b2, b3);
    const steps = Math.max(12, Math.ceil(len / 12));
    const hitIds = new Set();
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const pt = cubicBezierPoint(b0, b1, b2, b3, t);
        tryHitMonsterAt(pt.x, pt.y, hitIds);
    }
}

/**
 * 指数平滑 + Catmull-Rom 三次曲线刀光；2 点仍为直线
 */
function processWristSlash(history, x, y, hue, smoothRef) {
    let px = x;
    let py = y;
    if (smoothRef.x != null && smoothRef.y != null) {
        const a = WRIST_SMOOTH_ALPHA;
        px = a * x + (1 - a) * smoothRef.x;
        py = a * y + (1 - a) * smoothRef.y;
    }
    smoothRef.x = px;
    smoothRef.y = py;

    history.push({ x: px, y: py });
    while (history.length > WRIST_HISTORY_MAX) history.shift();

    if (history.length === 2) {
        const a = history[0];
        const b = history[1];
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        if (dist < MIN_SLASH_LEN) return;
        gameState.slashTrails.push(new SlashTrail("line", hue, { p0: a, p1: b }));
        sampleHitsAlongLine(a.x, a.y, b.x, b.y);
        return;
    }

    if (history.length >= 3) {
        const p0 = history[history.length - 3];
        const p1 = history[history.length - 2];
        const p2 = history[history.length - 1];
        const segMove = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (segMove < MIN_SLASH_LEN * 0.3) return;

        const p3 = { x: p2.x + (p2.x - p1.x), y: p2.y + (p2.y - p1.y) };
        const bez = catmullRomSegmentToBezier(p0, p1, p2, p3);

        gameState.slashTrails.push(
            new SlashTrail("cubic", hue, { b0: bez.b0, b1: bez.b1, b2: bez.b2, b3: bez.b3 })
        );
        sampleHitsAlongCubic(bez.b0, bez.b1, bez.b2, bez.b3);
    }
}

function smoothAngleRad(prev, next, t) {
    if (prev == null || next == null) return next;
    let d = next - prev;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return prev + d * t;
}

function smoothWeaponPose(prev, raw) {
    if (!raw) return null;
    if (!prev) {
        return { wx: raw.wx, wy: raw.wy, angle: raw.angle, armLen: raw.armLen };
    }
    const k = 0.44;
    const al = prev.armLen * 0.52 + raw.armLen * 0.48;
    return {
        wx: prev.wx + (raw.wx - prev.wx) * k,
        wy: prev.wy + (raw.wy - prev.wy) * k,
        angle: smoothAngleRad(prev.angle, raw.angle, 0.38),
        armLen: al
    };
}

/**
 * 肩-肘-腕 定小臂方向；握点沿小臂伸向「拳心/掌心」一侧，并略向拇指侧偏移，便于握拳姿势对齐
 */
function updateWeaponHandPose(landmarks) {
    const L = landmarks;

    const build = (shi, ehi, whi, isLeft) => {
        const s = L[shi];
        const e = L[ehi];
        const w = L[whi];
        if (!landmarkVisible(w) || !landmarkVisible(e) || !landmarkVisible(s)) return null;
        const sx = (1 - s.x) * canvas.width;
        const sy = s.y * canvas.height;
        const ex = (1 - e.x) * canvas.width;
        const ey = e.y * canvas.height;
        const wx = (1 - w.x) * canvas.width;
        const wy = w.y * canvas.height;
        const dx = wx - ex;
        const dy = wy - ey;
        const armLen = Math.hypot(dx, dy) || 1;
        const ux = dx / armLen;
        const uy = dy / armLen;
        const armAngle = Math.atan2(dy, dx);
        const along = armLen * 0.168;
        const thumb = armLen * 0.045;
        const perpX = -uy;
        const perpY = ux;
        const thumbSign = isLeft ? -1 : 1;
        const gx = wx + ux * along + perpX * thumb * thumbSign;
        const gy = wy + uy * along + perpY * thumb * thumbSign;
        return { wx: gx, wy: gy, angle: armAngle, armLen };
    };

    gameState.weaponPoseSmooth.left = smoothWeaponPose(gameState.weaponPoseSmooth.left, build(11, 13, 15, true));
    gameState.weaponPoseSmooth.right = smoothWeaponPose(gameState.weaponPoseSmooth.right, build(12, 14, 16, false));
}

function weaponDisplayWidthPx(armLen) {
    const cw = canvas.width || 800;
    const maxW = Math.min(340, cw * 0.3);
    let bw = armLen * WEAPON_FOREARM_RATIO;
    bw = Math.max(WEAPON_MIN_WIDTH_PX, Math.min(maxW, bw));
    return bw;
}

function drawHeldWeapons(ctx2) {
    const img = loadedWeapons[gameState.selectedWeaponIndex];
    const wcfg = WEAPONS[gameState.selectedWeaponIndex];
    if (!img || !img.complete || !img.naturalWidth || !wcfg) return;

    const drawOne = (pose, flip) => {
        if (!pose) return;
        const { wx, wy, angle, armLen } = pose;
        let bw = weaponDisplayWidthPx(armLen || 200) * wcfg.scale;
        const cw = canvas.width || 800;
        bw = Math.min(bw, Math.min(340, cw * 0.3));
        const bh = (img.naturalHeight / img.naturalWidth) * bw;
        const ax = wcfg.anchorX * bw;
        const ay = wcfg.anchorY * bh;

        ctx2.save();
        ctx2.translate(wx, wy);
        ctx2.rotate(angle + wcfg.angleOffset);
        if (flip) ctx2.scale(-1, 1);

        ctx2.fillStyle = "rgba(0,0,0,0.2)";
        ctx2.beginPath();
        ctx2.ellipse(6, 16, bw * 0.36, 13, 0, 0, Math.PI * 2);
        ctx2.fill();

        ctx2.shadowColor = "rgba(0,0,0,0.48)";
        ctx2.shadowBlur = 20;
        ctx2.shadowOffsetY = 7;
        ctx2.drawImage(img, -ax, -ay, bw, bh);

        ctx2.restore();
    };

    drawOne(gameState.weaponPoseSmooth.left, true);
    drawOne(gameState.weaponPoseSmooth.right, false);
}

function onResults(results) {
    drawVirtualBackground(results);

    if (results.poseLandmarks && gameState.isPlaying) {
        updateWeaponHandPose(results.poseLandmarks);
    }

    if (!gameState.isPlaying || !results.poseLandmarks) return;

    const landmarks = results.poseLandmarks;
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];

    const lx = (1 - leftWrist.x) * canvas.width;
    const ly = leftWrist.y * canvas.height;
    const rx = (1 - rightWrist.x) * canvas.width;
    const ry = rightWrist.y * canvas.height;

    if (landmarkVisible(leftWrist)) {
        processWristSlash(gameState.leftWristHistory, lx, ly, 195, gameState.leftWristSmooth);
    } else {
        gameState.leftWristHistory = [];
        gameState.leftWristSmooth = { x: null, y: null };
    }

    if (landmarkVisible(rightWrist)) {
        processWristSlash(gameState.rightWristHistory, rx, ry, 28, gameState.rightWristSmooth);
    } else {
        gameState.rightWristHistory = [];
        gameState.rightWristSmooth = { x: null, y: null };
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

    drawHeldWeapons(ctx);

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
    gameState.leftWristHistory = [];
    gameState.rightWristHistory = [];
    gameState.leftWristSmooth = { x: null, y: null };
    gameState.rightWristSmooth = { x: null, y: null };
    gameState.weaponPoseSmooth = { left: null, right: null };

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

    showGripHintBar();

    spawnMonster();
    gameLoop();
}

function nextStage() {
    initStage(gameState.currentStage + 1);
    gameState.isPlaying = true;
    stageCompleteScreen.classList.add("hidden");

    showGripHintBar();

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

function buildWeaponPicker() {
    const grid = document.getElementById("weapon-grid");
    if (!grid) return;
    grid.innerHTML = "";
    WEAPONS.forEach((w, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "weapon-card" + (i === gameState.selectedWeaponIndex ? " selected" : "");
        btn.setAttribute("role", "option");
        btn.setAttribute("aria-selected", i === gameState.selectedWeaponIndex ? "true" : "false");
        btn.dataset.index = String(i);
        btn.innerHTML = `<img src="${w.path}" alt="" /><span>${w.label}</span>`;
        btn.addEventListener("click", () => {
            gameState.selectedWeaponIndex = i;
            grid.querySelectorAll(".weapon-card").forEach((b, j) => {
                const sel = j === i;
                b.classList.toggle("selected", sel);
                b.setAttribute("aria-selected", sel ? "true" : "false");
            });
        });
        grid.appendChild(btn);
    });
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

    buildWeaponPicker();

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
