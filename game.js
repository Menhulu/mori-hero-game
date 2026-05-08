/**
 * Māori Sea Hunt — upper-body movement game
 * MediaPipe Pose: segmentation + wrist trails; ocean as virtual background (video-call style)
 */

const STAGE_CONFIGS = [
    {
        id: 1,
        name: "Shallow warm-up",
        targetScore: 120,
        lives: 7,
        background: "img/background01.png",
        monsters: {
            size: { min: 100, max: 160 },
            speed: { vx: 0.28, vyMin: 2.0, vyMax: 3.2 },
            gravity: 0.022,
            spawnInterval: { min: 1900, max: 2800 },
            spawnCount: { min: 1, max: 2 },
            levelUpBonus: 0.20
        },
        pointsPerKill: 10
    },
    {
        id: 2,
        name: "Surf zone",
        targetScore: 220,
        lives: 7,
        background: "img/background02.png",
        monsters: {
            size: { min: 92, max: 150 },
            speed: { vx: 0.42, vyMin: 3.0, vyMax: 4.8 },
            gravity: 0.032,
            spawnInterval: { min: 1600, max: 2400 },
            spawnCount: { min: 1, max: 3 },
            levelUpBonus: 0.35
        },
        pointsPerKill: 15
    },
    {
        id: 3,
        name: "Deep current",
        targetScore: 380,
        lives: 6,
        background: "img/background03.png",
        monsters: {
            size: { min: 84, max: 140 },
            speed: { vx: 0.55, vyMin: 4.0, vyMax: 6.5 },
            gravity: 0.044,
            spawnInterval: { min: 1350, max: 2100 },
            spawnCount: { min: 2, max: 4 },
            levelUpBonus: 0.50
        },
        pointsPerKill: 20
    },
    {
        id: 4,
        name: "Final abyss",
        targetScore: 520,
        lives: 5,
        background: "img/background02.png",
        monsters: {
            size: { min: 78, max: 130 },
            speed: { vx: 0.70, vyMin: 5.0, vyMax: 8.2 },
            gravity: 0.055,
            spawnInterval: { min: 1150, max: 1900 },
            spawnCount: { min: 2, max: 5 },
            levelUpBonus: 0.68
        },
        pointsPerKill: 28
    }
];

const AFFIRMATIONS = [
    "Ka rawe!", "Tino pai!", "Āe mārika!", "Kia kaha!",
    "Mō ake tonu!", "Ka mau te wehi!", "Tū māia!", "Ka pai rawa atu!"
];

const STAGE_STORIES = [
    {
        stage: "Stage 1",
        title: "Shallow Waters",
        desc: "The sea stirs gently. Take a deep breath, move your arms slowly and enjoy the calm. Every swing protects your people!",
        img: "img/story-card/1-Relaxed Exploration.png"
    },
    {
        stage: "Stage 2",
        title: "The Surf Zone",
        desc: "The ocean picks up pace. Keep moving — your steady arms are growing stronger with every strike!",
        img: "img/story-card/2-Steady Growth.png"
    },
    {
        stage: "Stage 3",
        title: "Deep Current",
        desc: "Dark currents rise from below. Focus your mind and your body — you are the champion of Tangaroa!",
        img: "img/story-card/3-Focused Challenge.png"
    },
    {
        stage: "Stage 4",
        title: "The Final Abyss",
        desc: "Te Wheke-a-Muturangi stirs in the deep — the same beast Kupe defeated long ago. Kia kaha! Strike with all your strength!",
        img: "img/story-card/4-Final Strike.png"
    }
];

const MIN_SLASH_LEN = 20;
const WRIST_HISTORY_MAX = 18;
/** Exponential smoothing: higher = snappier, lower = smoother */
const WRIST_SMOOTH_ALPHA = 0.32;
const HIT_RADIUS_EXTRA = 88;
// User request: make monsters 1.3x larger
const MONSTER_SIZE_MULT = 1.3;
// Near miss feedback (visual only, does not count as a kill)
const NEAR_HIT_RADIUS_EXTRA = 125;
const NEAR_HIT_COOLDOWN_FRAMES = 14;
const LANDMARK_MIN_VIS = 0.35;
const MAX_MONSTERS = 4;

const monsterImages = [
    "img/sea-monster/blowfish.png",
    "img/sea-monster/crabs.png",
    "img/sea-monster/eel.png",
    "img/sea-monster/electric fish.png",
    "img/sea-monster/octopus.png",
    "img/sea-monster/starfish.png",
    "img/sea-monster/turtle.png"
];

/**
 * Weapon art and grip parameters:
 * bladeForwardIdle: fixed blade tilt (rad) toward strike direction
 * bladeSwingFactor: extra alignment to instant velocity (0–1)
 */
const WEAPONS = [
    { noWeapon: true, label: "None" },
    {
        path: "img/weapon/knif.png",
        label: "Knife",
        angleOffset: 1.14,
        anchorX: 0.5,
        anchorY: 0.84,
        scale: 1,
        bladeForwardIdle: 0.11,
        bladeSwingFactor: 0.44
    },
    {
        path: "img/weapon/axe.png",
        label: "Axe",
        angleOffset: 0.98,
        anchorX: 0.5,
        anchorY: 0.86,
        scale: 1.02,
        bladeForwardIdle: 0.125,
        bladeSwingFactor: 0.4
    }
];

/** Weapon width ≈ forearm length (px) × ratio, clamped min–max */
const WEAPON_FOREARM_RATIO = 1.55;
const WEAPON_MIN_WIDTH_PX = 260;

/** Matches monsterImages indices for behaviour animation */
const SPECIES = {
    BLOWFISH: 0,
    CRAB: 1,
    EEL: 2,
    ELECTRIC: 3,
    OCTOPUS: 4,
    STARFISH: 5,
    TURTLE: 6
};

// ─── Audio ────────────────────────────────────────────────────────────────────
let _audioCtx = null;
function audioCtx() {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
}

function playTone(freq, type, duration, gain, startTime) {
    const ctx = audioCtx();
    const t = startTime ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.start(t);
    osc.stop(t + duration);
}

function playHitSound(comboTier) {
    const ctx = audioCtx();
    const now = ctx.currentTime;

    // ── Sharp sawtooth sweep: high→low "slice" transient ──────────────────
    const osc = ctx.createOscillator();
    const g1  = ctx.createGain();
    osc.connect(g1);
    g1.connect(ctx.destination);
    osc.type = "sawtooth";
    const baseFreq = 1600 + (comboTier || 0) * 220;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.09);
    g1.gain.setValueAtTime(0.32, now);
    g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
    osc.start(now);
    osc.stop(now + 0.13);

    // ── White-noise burst: water-splash impact ─────────────────────────────
    const bufLen = Math.ceil(ctx.sampleRate * 0.09);
    const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 1.8);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const bpf = ctx.createBiquadFilter();
    bpf.type = "bandpass";
    bpf.frequency.value = 1400;
    bpf.Q.value = 0.7;
    const g2 = ctx.createGain();
    noise.connect(bpf);
    bpf.connect(g2);
    g2.connect(ctx.destination);
    g2.gain.setValueAtTime(0.22, now);
    g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    noise.start(now);
    noise.stop(now + 0.1);
}

function playComboSound(combo) {
    // Ascending chime on each combo threshold
    const notes = [523, 659, 784, 988, 1175];
    const freq = notes[Math.min(Math.floor((combo - 3) / 2), notes.length - 1)];
    playTone(freq, "triangle", 0.28, 0.28);
}

function playLifeLostSound() {
    const ctx = audioCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(240, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(72, ctx.currentTime + 0.38);
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.38);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.38);
}

function playStageCompleteSound() {
    const ctx = audioCtx();
    const melody = [523, 659, 784, 1047];
    melody.forEach((freq, i) => {
        playTone(freq, "sine", 0.32, 0.28, ctx.currentTime + i * 0.14);
    });
}

let _swingSoundCooldown = 0;
let _gleamTick = 0;   // global gleam phase counter (cycles 0–179)
function playSwingSound(speed) {
    if (_swingSoundCooldown > 0) return;
    _swingSoundCooldown = 10;
    const ctx = audioCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    const baseFreq = Math.min(900, 280 + speed * 2.8);
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.13);
    g.gain.setValueAtTime(0.07, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.13);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.13);
}

function playGameOverSound() {
    const ctx = audioCtx();
    [330, 277, 220].forEach((freq, i) => {
        playTone(freq, "triangle", 0.38, 0.22, ctx.currentTime + i * 0.18);
    });
}
// ─────────────────────────────────────────────────────────────────────────────

let gameState = {
    isPlaying: false,
    currentStage: 0,
    totalScore: 0,
    stageScore: 0,
    combo: 0,
    lives: 5,
    monsters: [],
    leftTrail: null,
    rightTrail: null,
    killBursts: [],
    nearHitBursts: [],
    floatTexts: [],
    swingSparkles: [],
    leftWristHistory: [],
    rightWristHistory: [],
    leftWristSmooth: { x: null, y: null },
    rightWristSmooth: { x: null, y: null },
    selectedWeaponIndex: 0,
    weaponPoseSmooth: { left: null, right: null },
    weaponHitFlash: 0,
    gripHintTimer: null
};

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const video = document.getElementById("camera-feed");
const bgCanvas = document.getElementById("bg-composite");
const bgCtx = bgCanvas.getContext("2d");
const scratchCanvas = document.createElement("canvas");
const scratchCtx = scratchCanvas.getContext("2d");
// Persistent rim-glow canvas: warm amber silhouette drawn blurred under person
const rimCanvas = document.createElement("canvas");
const rimCtx = rimCanvas.getContext("2d");
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

const loadingOverlay   = document.getElementById("loading-overlay");
const storyCardOverlay = document.getElementById("story-card-overlay");
const storyCardStageEl = document.getElementById("story-card-stage");
const storyCardImgEl   = document.getElementById("story-card-img");
const storyCardTitleEl = document.getElementById("story-card-title");
const storyCardDescEl  = document.getElementById("story-card-desc");
const storyCardBeginBtn= document.getElementById("story-card-begin");
const cameraBadgeEl    = document.getElementById("camera-badge");
const emptyStateEl     = document.getElementById("empty-state");
const instructionBarEl = document.getElementById("instruction-bar");
const errorCardEl      = document.getElementById("error-card");
const errorMsgEl       = document.getElementById("error-msg");
const errorDismissBtn  = document.getElementById("error-dismiss");
const progressFillEl   = document.getElementById("stage-progress-fill");

const loadedMonsterImages = [];
const loadedWeapons = [];

// Logical (CSS-pixel) dimensions used by all game coordinate calculations.
// Canvas buffers are sized at gameW/H × devicePixelRatio for crisp rendering.
let gameW = window.innerWidth;
let gameH = window.innerHeight;

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    gameW = window.innerWidth;
    gameH = window.innerHeight;

    canvas.width  = Math.round(gameW * dpr);
    canvas.height = Math.round(gameH * dpr);
    canvas.style.width  = gameW + "px";
    canvas.style.height = gameH + "px";

    bgCanvas.width  = Math.round(gameW * dpr);
    bgCanvas.height = Math.round(gameH * dpr);
    bgCanvas.style.width  = gameW + "px";
    bgCanvas.style.height = gameH + "px";

    // Reset to identity then scale so drawing uses logical pixels.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/**
 * object-fit: cover draw (ocean image, person layer)
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
 * Ocean virtual background + segmented person only (mirrored to match game coords)
 */
function drawVirtualBackground(results) {
    const w = gameW;
    const h = gameH;
    if (!w || !h) return;

    bgCtx.clearRect(0, 0, w, h);
    if (bgImage.complete && bgImage.naturalWidth) {
        drawImageCover(bgCtx, bgImage, w, h);
    } else {
        bgCtx.fillStyle = "#023047";
        bgCtx.fillRect(0, 0, w, h);
    }
    // Darken background slightly so person and monsters stand out
    bgCtx.fillStyle = "rgba(0, 10, 24, 0.28)";
    bgCtx.fillRect(0, 0, w, h);

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

    if (scratchCanvas.width !== vw || scratchCanvas.height !== vh) {
        scratchCanvas.width = vw;
        scratchCanvas.height = vh;
        rimCanvas.width = vw;
        rimCanvas.height = vh;
    }

    // ── Person cutout (mask → video pixels) ──────────────────────────
    scratchCtx.clearRect(0, 0, vw, vh);
    scratchCtx.drawImage(mask, 0, 0, vw, vh);
    scratchCtx.globalCompositeOperation = "source-in";
    scratchCtx.drawImage(video, 0, 0, vw, vh);
    scratchCtx.globalCompositeOperation = "source-over";

    // ── Warm amber rim-glow silhouette ────────────────────────────────
    rimCtx.clearRect(0, 0, vw, vh);
    rimCtx.drawImage(mask, 0, 0, vw, vh);
    rimCtx.globalCompositeOperation = "source-in";
    rimCtx.fillStyle = "rgba(255, 155, 50, 0.92)";
    rimCtx.fillRect(0, 0, vw, vh);
    rimCtx.globalCompositeOperation = "source-over";

    // Draw blurred warm silhouette first (rim glow behind person)
    bgCtx.save();
    bgCtx.filter = "blur(22px)";
    bgCtx.globalAlpha = 0.72;
    bgCtx.translate(w, 0);
    bgCtx.scale(-1, 1);
    drawImageCover(bgCtx, rimCanvas, w, h);
    bgCtx.restore();

    // Draw crisp person on top
    bgCtx.save();
    bgCtx.translate(w, 0);
    bgCtx.scale(-1, 1);
    drawImageCover(bgCtx, scratchCanvas, w, h);
    bgCtx.restore();

    // Subtle warm screen-blend over person to warm up skin tones
    bgCtx.save();
    bgCtx.globalCompositeOperation = "screen";
    bgCtx.globalAlpha = 0.09;
    bgCtx.translate(w, 0);
    bgCtx.scale(-1, 1);
    drawImageCover(bgCtx, rimCanvas, w, h);
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
        if (w.noWeapon) {
            loadedWeapons.push(null);
            continue;
        }
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
        this.size *= MONSTER_SIZE_MULT;
        this.monsterTypeIndex = Math.floor(Math.random() * loadedMonsterImages.length);
        this.opacity = 1;
        this.spawnAge = 0;
        this.spawnDuration = 22 + Math.floor(Math.random() * 10);
        this.spawnHint = config.id === 1;
        this.moveSlowFactor = config.id === 1 ? 0.65 : 1;
        this.moveSlowRampFrames = 18;
        this.hitVibe = 0;
        this.nearHitCooldownFrames = 0;

        this.puffPhase = Math.random() * Math.PI * 2;
        this.puffSpeed = 0.09 + Math.random() * 0.05;
        this.eelPhase = Math.random() * Math.PI * 2;
        this.eelWiggle = 0.11 + Math.random() * 0.05;
        this.eelAmp = 2.8 + Math.random() * 2.2;
        this.bobPhase = Math.random() * Math.PI * 2;
        this.electricShock = 0;
        this.flipX = 1;

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
            this.spawnGeneric(config);
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

        // Te Wheke (octopus) = Boss — larger and worth triple points
        if (this.monsterTypeIndex === SPECIES.OCTOPUS) {
            this.size *= 1.5;
            this.points = config.pointsPerKill * 3;
            this.isBoss = true;
        } else {
            this.isBoss = false;
        }
    }

    spawnCornerGlide(config, opts = {}) {
        const fromLeft = opts.fromLeft ?? Math.random() > 0.5;
        const sp = config.monsters.speed;
        const vyMid = (sp.vyMin + sp.vyMax) / 2;
        // Stage 1 baseline vyMid ≈ 4.2; faster stages get proportionally shorter travel time
        const travelFrames =
            opts.travelFrames ??
            Math.round((4.2 / vyMid) * (175 + Math.random() * 50));
        const gravityScale = opts.gravityScale ?? (config.id === 1 ? 0.18 : 0.22);

        // Spawn from bottom-left / bottom-right (slightly off-screen) and glide toward center.
        const xEdge = fromLeft ? -this.size * 0.15 : gameW + this.size * 0.15;
        const yEdge = gameH + this.size * (0.34 + Math.random() * 0.22);

        const targetX =
            opts.targetX ?? gameW * (0.5 + (Math.random() - 0.5) * 0.18);
        const targetY =
            opts.targetY ?? gameH * (0.46 + Math.random() * 0.08);

        this.x = xEdge;
        this.y = yEdge;

        this.gravity = config.monsters.gravity * gravityScale;

        // Solve a simple constant-gravity trajectory so it lands near targetY at travelFrames.
        const t = travelFrames;
        const g = this.gravity;
        this.vx = (targetX - this.x) / t;
        this.vy = (targetY - this.y - 0.5 * g * t * t) / t;
    }

    spawnCrabHorizontal(config) {
        const fromLeft = Math.random() > 0.5;
        this.spawnCornerGlide(config, {
            fromLeft,
            targetY: gameH * (0.48 + Math.random() * 0.06),
            gravityScale: 0.2
        });
        this.spin = (Math.random() - 0.5) * 0.004;
        this.rotation = 0;
    }

    spawnOctopusBob(config) {
        this.spawnCornerGlide(config, {
            targetY: gameH * (0.46 + Math.random() * 0.1),
            gravityScale: 0.25
        });
        this.spin = (Math.random() - 0.5) * 0.016;
        this.rotation = (Math.random() - 0.5) * 0.2;
        this.octopusBaseRot = this.rotation;
    }

    spawnStarfishCreep(config) {
        this.spawnCornerGlide(config, {
            targetY: gameH * (0.52 + Math.random() * 0.06),
            gravityScale: 0.18
        });
        this.rotation = Math.random() * Math.PI * 2;
    }

    spawnEelSlither(config) {
        const fromLeft = Math.random() > 0.5;
        this.spawnCornerGlide(config, {
            fromLeft,
            targetY: gameH * (0.42 + Math.random() * 0.12),
            gravityScale: 0.2
        });
        this.rotation = fromLeft ? -0.15 : 0.15;
        this.spin = 0;
    }

    spawnGeneric(config) {
        const fromLeft = Math.random() > 0.5;
        this.spawnCornerGlide(config, {
            fromLeft,
            targetY: gameH * (0.46 + Math.random() * 0.12),
            gravityScale: 0.22
        });
    }

    getSpawnScale() {
        if (this.spawnAge >= this.spawnDuration) return 1;
        const t = this.spawnAge / this.spawnDuration;
        return 0.2 + 0.8 * (1 - Math.pow(1 - t, 3));
    }

    getSpawnMoveFactor() {
        if (this.moveSlowFactor === 1) return 1;
        const t = Math.min(1, this.spawnAge / this.moveSlowRampFrames);
        // At spawn start => moveSlowFactor; approaches 1 as it grows in.
        return 1 - (1 - this.moveSlowFactor) * (1 - t);
    }

    /** Blowfish puff scale; others stay 1 */
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
        const moveK = this.getSpawnMoveFactor();

        if (this.hitVibe > 0) this.hitVibe = Math.max(0, this.hitVibe - 0.055);
        if (this.nearHitCooldownFrames > 0) this.nearHitCooldownFrames--;

        if (sp === SPECIES.EEL) {
            this.eelPhase += this.eelWiggle;
            this.x += Math.sin(this.eelPhase) * this.eelAmp * 0.14 * moveK;
            this.rotation += Math.sin(this.eelPhase * 1.3) * 0.04;
        } else if (sp === SPECIES.ELECTRIC) {
            this.electricShock += 0.45 + Math.random() * 0.35;
            this.vx += (Math.random() - 0.5) * 0.48 * moveK;
            this.vy += (Math.random() - 0.5) * 0.38 * moveK;
            this.rotation += (Math.random() - 0.5) * 0.04;
            const maxV = 5.2;
            this.vx = Math.max(-maxV, Math.min(maxV, this.vx));
            this.vy = Math.max(-maxV, Math.min(maxV, this.vy));
        } else if (sp === SPECIES.OCTOPUS) {
            this.bobPhase += 0.065;
            this.y += Math.sin(this.bobPhase) * 0.55 * moveK;
            this.x += Math.cos(this.bobPhase * 0.7) * 0.35 * moveK;
            const base = this.octopusBaseRot ?? this.rotation;
            this.rotation = base + Math.sin(this.bobPhase * 0.5) * 0.28;
        } else if (sp === SPECIES.STARFISH) {
            this.rotation += this.spin;
        } else if (sp === SPECIES.CRAB) {
            this.rotation = 0;
        } else {
            this.rotation += this.spin;
        }

        this.vy += this.gravity * moveK;

        this.x += this.vx * moveK;
        this.y += this.vy * moveK;

        if (this.x < this.size / 2) {
            this.x = this.size / 2;
            this.vx = Math.abs(this.vx);
        } else if (this.x > gameW - this.size / 2) {
            this.x = gameW - this.size / 2;
            this.vx = -Math.abs(this.vx);
        }

        const out =
            this.y > gameH + 420 ||
            this.y < -this.size - 220 ||
            this.x < -this.size - 200 ||
            this.x > gameW + this.size + 200;

        if (out) {
            if (this.y > gameH - 80) {
                gameState.lives--;
                showComboBreak(gameState.combo);
                gameState.combo = 0;
                playLifeLostSound();
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

        if (this.hitVibe > 0.001) {
            const shake = this.hitVibe * 2.2;
            const t = this.spawnAge * 0.9 + this.monsterTypeIndex;
            ctx2.translate(Math.sin(t) * shake, Math.cos(t * 1.2) * shake);
            ctx2.save();
            const a = Math.min(1, this.hitVibe * 1.35);
            ctx2.globalAlpha = a * this.opacity;
            ctx2.strokeStyle = `rgba(144, 224, 239, ${a})`;
            ctx2.lineWidth = 5 + 7 * a;
            ctx2.shadowColor = `rgba(144, 224, 239, ${a})`;
            ctx2.shadowBlur = 22 + 18 * a;
            ctx2.beginPath();
            ctx2.arc(0, 0, half + 10 + 9 * a, 0, Math.PI * 2);
            ctx2.stroke();
            ctx2.restore();
        }

        if (this.spawnHint) {
            const hintT = Math.max(0, 1 - this.spawnAge / 18);
            if (hintT > 0.001) {
                ctx2.save();
                ctx2.globalAlpha = hintT * 0.55;
                ctx2.strokeStyle = "rgba(144,224,239,1)";
                ctx2.lineWidth = 6;
                ctx2.shadowColor = "rgba(144,224,239,0.95)";
                ctx2.shadowBlur = 26 * hintT + 6;
                ctx2.beginPath();
                ctx2.arc(0, 0, half + 12, 0, Math.PI * 2);
                ctx2.stroke();
                ctx2.restore();
            }
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
            ctx2.fillText("Creature", 0, 0);
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
 * Slash trail: line segments or cubic Bezier (Catmull-Rom smoothed)
 */
/**
 * Continuous Fruit-Ninja-style wrist trail.
 * Stores recent positions and draws a single Catmull-Rom spline per frame,
 * tapered from thin/transparent (tail) to thick/bright (tip).
 */
class WristTrail {
    constructor(hue) {
        this.hue = hue;
        this.pts = [];
        this.maxLen = 22;      // fewer stored points → cleaner curves
        this.idleFrames = 0;
        this.IDLE_DECAY = 5;
        this._sx = null;       // internal EMA state (separate from hit-detection smoothRef)
        this._sy = null;
        this.EMA   = 0.20;     // lower = smoother trail (independent of hit detection)
        this.MIN_D = 14;       // px: skip point if too close to last → no micro-jitter clusters
    }

    push(x, y) {
        // Trail-specific EMA smoothing
        if (this._sx === null) { this._sx = x; this._sy = y; }
        else {
            const a = this.EMA;
            this._sx = a * x + (1 - a) * this._sx;
            this._sy = a * y + (1 - a) * this._sy;
        }
        // Minimum-distance gate: skip if barely moved
        const last = this.pts[this.pts.length - 1];
        if (last && Math.hypot(this._sx - last.x, this._sy - last.y) < this.MIN_D) return;

        this.pts.push({ x: this._sx, y: this._sy });
        if (this.pts.length > this.maxLen) this.pts.shift();
        this.idleFrames = 0;
    }

    // Call once per frame; erodes tail when wrist is idle
    tick() {
        this.idleFrames++;
        if (this.idleFrames > this.IDLE_DECAY && this.pts.length > 0) {
            this.pts.shift();
        }
    }

    clear() {
        this.pts = [];
        this.idleFrames = 0;
        this._sx = null;
        this._sy = null;
    }

    // Laplacian smooth: each interior point averages with its neighbours
    // Removes remaining angular corners before bezier rendering
    _smooth(pts) {
        const n = pts.length;
        if (n < 3) return pts;
        const out = [pts[0]];
        for (let i = 1; i < n - 1; i++) {
            out.push({
                x: pts[i - 1].x * 0.25 + pts[i].x * 0.5 + pts[i + 1].x * 0.25,
                y: pts[i - 1].y * 0.25 + pts[i].y * 0.5 + pts[i + 1].y * 0.25
            });
        }
        out.push(pts[n - 1]);
        return out;
    }

    // Single render pass: Catmull-Rom bezier segments with tapered width + glow
    _pass(ctx2, maxW, maxAlpha, lightness, hueShift) {
        const pts = this._smooth(this.pts);  // smooth before rendering
        const n = pts.length;
        const h = (this.hue + hueShift) % 360;

        ctx2.lineCap = "round";
        ctx2.lineJoin = "round";
        ctx2.strokeStyle = `hsl(${h},100%,${lightness}%)`;
        ctx2.shadowColor  = `hsl(${h},100%,${Math.max(50, lightness - 18)}%)`;

        for (let i = 1; i < n; i++) {
            const t = i / (n - 1);     // 0 = oldest, 1 = newest
            const ease = t * t;        // quadratic: tip is thick & bright
            const w = ease * maxW + 0.5;
            const a = ease * maxAlpha;
            if (a < 0.015) continue;

            // Catmull-Rom → Bezier control points
            const p0 = pts[Math.max(0, i - 2)];
            const p1 = pts[i - 1];
            const p2 = pts[i];
            const p3 = pts[Math.min(n - 1, i + 1)];
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            ctx2.globalAlpha = a;
            ctx2.lineWidth   = w;
            ctx2.shadowBlur  = w * 0.9;
            ctx2.beginPath();
            ctx2.moveTo(p1.x, p1.y);
            ctx2.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
            ctx2.stroke();
        }
    }

    draw(ctx2) {
        if (this.pts.length < 2) return;
        ctx2.save();
        // Outer glow
        this._pass(ctx2, 42, 0.18, 62,  0);
        // Mid color
        this._pass(ctx2, 22, 0.55, 78, 15);
        // Bright white core
        this._pass(ctx2,  9, 0.96, 97,  8);
        ctx2.restore();
    }
}

// Initialise wrist trails now that WristTrail is defined
gameState.leftTrail  = new WristTrail(195);
gameState.rightTrail = new WristTrail(28);

// Sparkle particles emitted along the slash trail when swinging fast
class SwingSparkle {
    constructor(x, y, hue, speed) {
        this.x = x;
        this.y = y;
        this.hue = hue;
        const spread = 0.9 + speed * 0.012;
        const a = Math.random() * Math.PI * 2;
        const sp = (1.2 + Math.random() * 3.8) * spread;
        this.vx = Math.cos(a) * sp;
        this.vy = Math.sin(a) * sp - 1.2;
        this.size = 1.8 + Math.random() * 3.5;
        this.life = 0.65 + Math.random() * 0.35;
    }

    update() {
        this.life -= 0.055;
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.11;
        this.vx *= 0.97;
        return this.life > 0;
    }

    draw(ctx2) {
        const a = Math.min(1, this.life * 1.6);
        ctx2.save();
        ctx2.globalAlpha = a;
        ctx2.shadowColor = `hsla(${this.hue}, 100%, 80%, 1)`;
        ctx2.shadowBlur = 10;
        ctx2.fillStyle = `hsla(${this.hue}, 100%, 88%, 1)`;
        ctx2.beginPath();
        ctx2.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx2.fill();
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

class NearHitBurst {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 0.9;
        this.particles = [];
        // Lightweight cyan water splash particles
        for (let i = 0; i < 14; i++) {
            const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.35;
            const sp = 2.2 + Math.random() * 5.4;
            this.particles.push({
                x: 0,
                y: 0,
                vx: Math.cos(a) * sp,
                vy: Math.sin(a) * sp - 1.1,
                size: 2.5 + Math.random() * 4.2,
                hue: 190 + Math.random() * 22
            });
        }
    }

    update() {
        this.life -= 0.05;
        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.16;
            p.vx *= 0.98;
        }
        return this.life > 0;
    }

    draw(ctx2) {
        ctx2.save();
        ctx2.globalAlpha = Math.max(0, this.life);
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            const px = this.x + p.x;
            const py = this.y + p.y;
            const a = this.life * 0.9;
            ctx2.fillStyle = `hsla(${p.hue}, 98%, 62%, ${a})`;
            ctx2.beginPath();
            ctx2.arc(px, py, p.size * this.life, 0, Math.PI * 2);
            ctx2.fill();
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

// ─── Error card ───────────────────────────────────────────────────────────────
function showErrorCard(msg) {
    if (errorMsgEl) errorMsgEl.textContent = msg;
    if (errorCardEl) errorCardEl.classList.remove("hidden");
}
if (errorDismissBtn) errorDismissBtn.addEventListener("click", () => {
    errorCardEl.classList.add("hidden");
});

// ─── Story card ───────────────────────────────────────────────────────────────
function showStoryCard(stageIndex, onBegin) {
    const story = STAGE_STORIES[stageIndex];
    if (!story || !storyCardOverlay) { onBegin(); return; }
    storyCardStageEl.textContent = story.stage;
    storyCardTitleEl.textContent = story.title;
    storyCardDescEl.textContent  = story.desc;
    if (story.img) {
        storyCardImgEl.src = story.img;
        storyCardImgEl.classList.remove("hidden");
    } else {
        storyCardImgEl.classList.add("hidden");
    }
    storyCardOverlay.classList.remove("hidden");
    const begin = () => {
        storyCardOverlay.classList.add("hidden");
        storyCardBeginBtn.removeEventListener("click", begin);
        onBegin();
    };
    storyCardBeginBtn.addEventListener("click", begin);
}

// ─── Affirmation popup ────────────────────────────────────────────────────────
function showAffirmation(x, y) {
    const text = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
    const el = document.createElement("div");
    el.className = "affirmation-text";
    el.textContent = text;
    el.style.left = `${Math.min(Math.max(x - 60, 4), gameW - 140)}px`;
    el.style.top  = `${Math.max(y - 70, 10)}px`;
    document.getElementById("game-container").appendChild(el);
    setTimeout(() => el.remove(), 1500);
}

// ─── Kupe boss kill ───────────────────────────────────────────────────────────
const KUPE_LINES = [
    "You struck Te Wheke! Like Kupe!",
    "Ka hinga Te Wheke! — The octopus falls!",
    "Kupe's spirit is with you!",
    "He toa! — A warrior!",
];
function showKupeVictory(x, y) {
    const text = KUPE_LINES[Math.floor(Math.random() * KUPE_LINES.length)];
    const el = document.createElement("div");
    el.className = "affirmation-text kupe-victory";
    el.textContent = text;
    el.style.left = `${Math.min(Math.max(x - 80, 4), gameW - 200)}px`;
    el.style.top  = `${Math.max(y - 90, 10)}px`;
    document.getElementById("game-container").appendChild(el);
    setTimeout(() => el.remove(), 2200);
}

// ─── Combo break feedback ─────────────────────────────────────────────────────
function showComboBreak(combo) {
    if (combo < 3) return;
    const el = document.createElement("div");
    el.className = "combo-break-text";
    el.textContent = "Combo broken!";
    el.style.left = `${gameW / 2 - 70}px`;
    el.style.top  = `${gameH * 0.38}px`;
    document.getElementById("game-container").appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

// ─── Ambient ocean music ──────────────────────────────────────────────────────
let _ambienceNodes = [];
function startAmbience() {
    stopAmbience();
    const ctx2 = audioCtx();
    const bufLen = ctx2.sampleRate * 3;
    const buf = ctx2.createBuffer(1, bufLen, ctx2.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx2.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const lpf = ctx2.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.value = 320;
    lpf.Q.value = 0.8;

    const gain = ctx2.createGain();
    gain.gain.value = 0.06;

    src.connect(lpf);
    lpf.connect(gain);
    gain.connect(ctx2.destination);
    src.start();
    _ambienceNodes = [src, lpf, gain];
}
function stopAmbience() {
    _ambienceNodes.forEach(n => { try { n.disconnect(); if (n.stop) n.stop(); } catch (_) {} });
    _ambienceNodes = [];
}

// ─── Camera badge ─────────────────────────────────────────────────────────────
function showCameraBadge() { cameraBadgeEl && cameraBadgeEl.classList.remove("hidden"); }
function hideCameraBadge() { cameraBadgeEl && cameraBadgeEl.classList.add("hidden"); }

// ─── Empty state ──────────────────────────────────────────────────────────────
function showEmptyState() { emptyStateEl && emptyStateEl.classList.remove("hidden"); }
function hideEmptyState() { emptyStateEl && emptyStateEl.classList.add("hidden"); }

// ─── Instruction bar ──────────────────────────────────────────────────────────
function showInstructionBar() { instructionBarEl && instructionBarEl.classList.remove("hidden"); }
function hideInstructionBar() { instructionBarEl && instructionBarEl.classList.add("hidden"); }

// ─── ESC to return to start ───────────────────────────────────────────────────
function returnToStart() {
    gameState.isPlaying = false;
    stopAmbience();
    hideCameraBadge();
    hideInstructionBar();
    hideEmptyState();
    [stageCompleteScreen, gameCompleteScreen, gameOverScreen,
     storyCardOverlay].forEach(el => el && el.classList.add("hidden"));
    startScreen.classList.remove("hidden");
}
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && gameState.isPlaying) returnToStart();
});

// ─────────────────────────────────────────────────────────────────────────────
function updateUI() {
    const sum = gameState.totalScore + gameState.stageScore;
    scoreEl.textContent = sum;
    stageEl.textContent = gameState.currentStage + 1;
    const config = STAGE_CONFIGS[gameState.currentStage];
    targetEl.textContent = `${gameState.stageScore}/${config.targetScore}`;
    comboEl.textContent = gameState.combo;
    livesEl.textContent = gameState.lives;
    livesEl.classList.toggle("lives-danger", gameState.lives <= 2);
    if (progressFillEl) {
        const pct = Math.min(100, (gameState.stageScore / config.targetScore) * 100);
        progressFillEl.style.width = pct + "%";
    }
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
    const wcfg = WEAPONS[gameState.selectedWeaponIndex];
    if (wcfg?.noWeapon) {
        el.classList.add("hidden");
        if (gameState.gripHintTimer) {
            clearTimeout(gameState.gripHintTimer);
            gameState.gripHintTimer = null;
        }
        return;
    }
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
    hideCameraBadge();
    hideInstructionBar();
    hideEmptyState();
    playStageCompleteSound();
    completedStageEl.textContent = gameState.currentStage + 1;
    stageScoreEl.textContent = gameState.stageScore;
    stageCompleteScreen.classList.remove("hidden");
}

function showGameComplete() {
    hideGripHintBar();
    hideCameraBadge();
    hideInstructionBar();
    hideEmptyState();
    stopAmbience();
    playStageCompleteSound();
    totalScoreEl.textContent = gameState.totalScore;
    gameCompleteScreen.style.backgroundImage = "url('img/story-card/5-Win.png')";
    gameCompleteScreen.style.backgroundSize = "cover";
    gameCompleteScreen.style.backgroundPosition = "center";
    gameCompleteScreen.classList.remove("hidden");
}

function endGame() {
    gameState.isPlaying = false;
    hideGripHintBar();
    hideCameraBadge();
    hideInstructionBar();
    hideEmptyState();
    stopAmbience();
    playGameOverSound();
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
 * Uniform Catmull-Rom: segment from P1 to P2 with control points P0–P3 (P0/P3 may be extrapolated)
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

        const drawScale = monster.getDrawScale();
        const half = drawScale / 2;
        const dx = monster.x - px;
        const dy = monster.y - py;
        const dist2 = dx * dx + dy * dy;

        const rHit = half + HIT_RADIUS_EXTRA;
        const rNear = half + NEAR_HIT_RADIUS_EXTRA;

        if (dist2 < rHit * rHit) {
            hitIds.add(monster);
            monster.alive = false;
            monster.hitVibe = 1;
            monster.nearHitCooldownFrames = 0;
            gameState.combo++;
            const comboTier = Math.floor(gameState.combo / 5);
            const config = STAGE_CONFIGS[gameState.currentStage];
            const bonus = 1 + comboTier * (0.12 + config.monsters.levelUpBonus * 0.08);
            const points = Math.round(monster.points * bonus);
            gameState.stageScore += points;
            gameState.killBursts.push(new KillBurst(monster.x, monster.y));
            gameState.floatTexts.push(new FloatScore(monster.x, monster.y - 42, `+${points}`));
            playHitSound(comboTier);
            gameState.weaponHitFlash = 9;
            if (monster.isBoss) {
                showKupeVictory(monster.x, monster.y);
            } else {
                showAffirmation(monster.x, monster.y);
            }
            updateUI();
            checkStageComplete();
            if (gameState.combo >= 3) {
                showComboText(monster.x, monster.y, `${gameState.combo} combo`);
                playComboSound(gameState.combo);
            }
        } else if (dist2 < rNear * rNear) {
            // Near miss feedback: visual only (does not affect score/lives)
            if (monster.nearHitCooldownFrames <= 0) {
                monster.nearHitCooldownFrames = NEAR_HIT_COOLDOWN_FRAMES;
                gameState.nearHitBursts.push(new NearHitBurst(monster.x, monster.y));
            }
            monster.hitVibe = Math.max(monster.hitVibe, 0.48);
        }
    }
}

function sampleHitsAlongLine(px0, py0, px1, py1) {
    const dx = px1 - px0;
    const dy = py1 - py0;
    const distance = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(distance / 11));
    const hitIds = new Set();
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        tryHitMonsterAt(px0 + dx * t, py0 + dy * t, hitIds);
    }
}

function sampleHitsAlongCubic(b0, b1, b2, b3) {
    const len = approximateCubicLength(b0, b1, b2, b3);
    const steps = Math.max(12, Math.ceil(len / 10));
    const hitIds = new Set();
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const pt = cubicBezierPoint(b0, b1, b2, b3, t);
        tryHitMonsterAt(pt.x, pt.y, hitIds);
    }
}

/**
 * Exponential smoothing + hit detection; rendering is handled by WristTrail.
 */
function processWristSlash(history, x, y, hue, smoothRef, trail) {
    let px = x;
    let py = y;
    if (smoothRef.x != null && smoothRef.y != null) {
        const a = WRIST_SMOOTH_ALPHA;
        px = a * x + (1 - a) * smoothRef.x;
        py = a * y + (1 - a) * smoothRef.y;
    }
    smoothRef.x = px;
    smoothRef.y = py;

    trail.push(px, py);   // feed continuous trail

    history.push({ x: px, y: py });
    while (history.length > WRIST_HISTORY_MAX) history.shift();

    if (history.length === 2) {
        const a = history[0];
        const b = history[1];
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        if (dist < MIN_SLASH_LEN) return;
        sampleHitsAlongLine(a.x, a.y, b.x, b.y);
        emitSwingSparkles(a.x, a.y, b.x, b.y, dist, hue);
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
        sampleHitsAlongCubic(bez.b0, bez.b1, bez.b2, bez.b3);
        emitSwingSparkles(p1.x, p1.y, p2.x, p2.y, segMove, hue);
    }
}

// Spawn sparkle particles along the slash segment; play whoosh above speed threshold.
function emitSwingSparkles(x0, y0, x1, y1, dist, hue) {
    const count = Math.min(10, Math.floor(dist / 18));
    for (let i = 0; i < count; i++) {
        const t = i / Math.max(1, count - 1);
        gameState.swingSparkles.push(
            new SwingSparkle(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, hue, dist)
        );
    }
    if (dist > 55) playSwingSound(dist);
}

function smoothAngleRad(prev, next, t) {
    if (prev == null || next == null) return next;
    let d = next - prev;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return prev + d * t;
}

function unwrapAngleDiff(a, b) {
    let d = a - b;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return d;
}

function lerpAngle(a, b, t) {
    return a + unwrapAngleDiff(b, a) * t;
}

/**
 * Weapon angle: blends forearm direction on screen with wrist velocity as attack direction.
 * When the forearm is nearly horizontal, blade axis tends perpendicular to the forearm.
 */
function computeWeaponAngle(ex, ey, wx, wy, vx, vy, isLeft) {
    const fx = wx - ex;
    const fy = wy - ey;
    const len = Math.hypot(fx, fy) || 1;
    if (len < 28) {
        return Math.atan2(fy, fx);
    }

    const forearmAngle = Math.atan2(fy, fx);
    const horizontal = Math.abs(fx) > Math.abs(fy) * 1.08;
    const sp = Math.hypot(vx, vy);
    const attackAngle = Math.atan2(vy, vx);

    let base;

    if (horizontal) {
        const alt1 = forearmAngle + Math.PI / 2;
        const alt2 = forearmAngle - Math.PI / 2;
        const screenUp = -Math.PI / 2;

        if (sp > 16) {
            const d1 = Math.abs(unwrapAngleDiff(attackAngle, alt1));
            const d2 = Math.abs(unwrapAngleDiff(attackAngle, alt2));
            base = d1 < d2 ? alt1 : alt2;
            base = lerpAngle(base, attackAngle, Math.min(0.62, sp / 165));
        } else {
            const u1 = Math.abs(unwrapAngleDiff(alt1, screenUp));
            const u2 = Math.abs(unwrapAngleDiff(alt2, screenUp));
            let pickUp = u1 < u2 ? alt1 : alt2;
            let pickDn = u1 < u2 ? alt2 : alt1;
            base = pickUp;
            if (isLeft) {
                base = pickDn;
            }
        }
    } else {
        base = forearmAngle;
        if (sp > 18) {
            base = lerpAngle(base, attackAngle, Math.min(0.55, sp / 190));
        }
    }

    return base;
}

function smoothWeaponPose(prev, raw) {
    if (!raw) return null;
    if (!prev) {
        const angle = computeWeaponAngle(raw.ex, raw.ey, raw.wx, raw.wy, 0, 0, raw.isLeft);
        return {
            wx: raw.wx,
            wy: raw.wy,
            angle,
            armLen: raw.armLen,
            ex: raw.ex,
            ey: raw.ey,
            isLeft: raw.isLeft,
            vx: 0,
            vy: 0
        };
    }
    const k = 0.44;
    const wx = prev.wx + (raw.wx - prev.wx) * k;
    const wy = prev.wy + (raw.wy - prev.wy) * k;
    const rvx = wx - prev.wx;
    const rvy = wy - prev.wy;
    const vx = prev.vx * 0.52 + rvx * 0.48;
    const vy = prev.vy * 0.52 + rvy * 0.48;
    const al = prev.armLen * 0.52 + raw.armLen * 0.48;
    let angle = computeWeaponAngle(raw.ex, raw.ey, wx, wy, vx, vy, raw.isLeft);
    angle = smoothAngleRad(prev.angle, angle, 0.4);
    // Keep last 4 positions for motion-blur trail
    const trail = [{ wx: prev.wx, wy: prev.wy, angle: prev.angle }, ...(prev.trail || [])].slice(0, 4);
    return { wx, wy, angle, armLen: al, ex: raw.ex, ey: raw.ey, isLeft: raw.isLeft, vx, vy, trail };
}

/**
 * Shoulder–elbow–wrist defines forearm; grip point shifts toward palm side and slightly thumb-ward for fist alignment
 */
function updateWeaponHandPose(landmarks) {
    const L = landmarks;

    const build = (shi, ehi, whi, isLeft) => {
        const s = L[shi];
        const e = L[ehi];
        const w = L[whi];
        if (!landmarkVisible(w) || !landmarkVisible(e) || !landmarkVisible(s)) return null;
        const sx = (1 - s.x) * gameW;
        const sy = s.y * gameH;
        const ex = (1 - e.x) * gameW;
        const ey = e.y * gameH;
        const wx = (1 - w.x) * gameW;
        const wy = w.y * gameH;
        const dx = wx - ex;
        const dy = wy - ey;
        const armLen = Math.hypot(dx, dy) || 1;
        const ux = dx / armLen;
        const uy = dy / armLen;
        const along = armLen * 0.168;
        const thumb = armLen * 0.045;
        const perpX = -uy;
        const perpY = ux;
        const thumbSign = isLeft ? -1 : 1;
        const gx = wx + ux * along + perpX * thumb * thumbSign;
        const gy = wy + uy * along + perpY * thumb * thumbSign;
        return { wx: gx, wy: gy, armLen, ex, ey, isLeft };
    };

    gameState.weaponPoseSmooth.left = smoothWeaponPose(gameState.weaponPoseSmooth.left, build(11, 13, 15, true));
    gameState.weaponPoseSmooth.right = smoothWeaponPose(gameState.weaponPoseSmooth.right, build(12, 14, 16, false));
}

/**
 * Blade tilt: idle lean toward strike; swing adds blend toward instant velocity
 */
function weaponBladeTiltAdditive(wcfg, pose, flip) {
    const idle = wcfg.bladeForwardIdle ?? 0.1;
    const swingK = wcfg.bladeSwingFactor ?? 0.42;
    const sid = flip ? -1 : 1;
    let t = idle * sid;

    const vx = pose.vx || 0;
    const vy = pose.vy || 0;
    const sp = Math.hypot(vx, vy);
    if (sp < 5) return t;

    const baseAng = pose.angle + wcfg.angleOffset;
    const vAng = Math.atan2(vy, vx);
    const d = unwrapAngleDiff(vAng, baseAng);
    const w = swingK * Math.min(0.58, sp / 130);
    const swing = Math.max(-0.52, Math.min(0.52, d * w));
    return t + swing;
}

function weaponDisplayWidthPx(armLen) {
    const cw = gameW || 800;
    const maxW = Math.min(480, cw * 0.46);
    let bw = armLen * WEAPON_FOREARM_RATIO;
    bw = Math.max(WEAPON_MIN_WIDTH_PX, Math.min(maxW, bw));
    return bw;
}

function drawHeldWeapons(ctx2) {
    const wcfg = WEAPONS[gameState.selectedWeaponIndex];
    if (!wcfg || wcfg.noWeapon) return;
    const img = loadedWeapons[gameState.selectedWeaponIndex];
    if (!img || !img.complete || !img.naturalWidth) return;

    _gleamTick = (_gleamTick + 1) % 200;

    const drawOne = (pose, flip) => {
        if (!pose) return;
        const { wx, wy, angle, armLen, vx, vy } = pose;
        const sp = Math.hypot(vx || 0, vy || 0);

        let bw = weaponDisplayWidthPx(armLen || 200) * wcfg.scale;
        const cw = gameW || 800;
        bw = Math.min(bw, Math.min(480, cw * 0.46));
        const bh = (img.naturalHeight / img.naturalWidth) * bw;
        const tilt = weaponBladeTiltAdditive(wcfg, pose, flip);
        const totalAngle = angle + wcfg.angleOffset + tilt;
        const ax = wcfg.anchorX * bw;
        const ay = wcfg.anchorY * bh;

        // ── 1. Motion-blur ghost trail ────────────────────────────────
        const trail = pose.trail || [];
        trail.forEach((t, i) => {
            const a = 0.16 - i * 0.038;
            if (a <= 0) return;
            const sc = 1 - i * 0.025;
            ctx2.save();
            ctx2.globalAlpha = a;
            ctx2.translate(t.wx, t.wy);
            ctx2.rotate(t.angle + wcfg.angleOffset + tilt);
            if (flip) ctx2.scale(-1, 1);
            ctx2.drawImage(img, -ax * sc, -ay * sc, bw * sc, bh * sc);
            ctx2.restore();
        });

        // ── 2. Main weapon (slight speed-scale boost) ─────────────────
        const speedBoost = 1 + Math.min(sp / 260, 0.10);
        const dbw = bw * speedBoost, dbh = bh * speedBoost;
        const dax = ax * speedBoost, day = ay * speedBoost;

        ctx2.save();
        ctx2.translate(wx, wy);
        ctx2.rotate(totalAngle);
        if (flip) ctx2.scale(-1, 1);

        ctx2.shadowColor = "rgba(0,0,0,0.55)";
        ctx2.shadowBlur = 14;
        ctx2.shadowOffsetX = 3;
        ctx2.shadowOffsetY = 5;
        ctx2.drawImage(img, -dax, -day, dbw, dbh);
        ctx2.shadowColor = "transparent";
        ctx2.shadowBlur = 0;
        ctx2.shadowOffsetX = 0;
        ctx2.shadowOffsetY = 0;

        // ── 3. Periodic blade gleam (diagonal light sweep) ────────────
        const gPhase = _gleamTick / 200;   // 0..1
        if (gPhase < 0.22) {
            const gp  = gPhase / 0.22;    // 0..1 within gleam window
            const gAlpha = Math.sin(gp * Math.PI) * 0.45;
            const sweepX = -dax + dbw * gp;
            const halfW  = dbw * 0.28;
            const grad = ctx2.createLinearGradient(sweepX - halfW, -day, sweepX + halfW, -day + dbh * 0.6);
            grad.addColorStop(0,   `rgba(255,255,255,0)`);
            grad.addColorStop(0.5, `rgba(255,255,255,${gAlpha})`);
            grad.addColorStop(1,   `rgba(255,255,255,0)`);
            ctx2.globalCompositeOperation = "lighter";
            ctx2.fillStyle = grad;
            ctx2.fillRect(-dax, -day, dbw, dbh * 0.62);
            ctx2.globalCompositeOperation = "source-over";
        }

        // ── 4. Hit flash: bright white overlay on kill ────────────────
        if (gameState.weaponHitFlash > 0) {
            const flashA = (gameState.weaponHitFlash / 9) * 0.72;
            ctx2.globalCompositeOperation = "lighter";
            ctx2.globalAlpha = flashA;
            ctx2.drawImage(img, -dax, -day, dbw, dbh);
            ctx2.globalCompositeOperation = "source-over";
            ctx2.globalAlpha = 1;
        }

        ctx2.restore();
    };

    drawOne(gameState.weaponPoseSmooth.left, true);
    drawOne(gameState.weaponPoseSmooth.right, false);
}

let _poseReady = false;
function onResults(results) {
    if (!_poseReady && results.poseLandmarks) {
        _poseReady = true;
        if (loadingOverlay) loadingOverlay.classList.add("hidden");
    }
    drawVirtualBackground(results);

    if (results.poseLandmarks && gameState.isPlaying) {
        const wcfg = WEAPONS[gameState.selectedWeaponIndex];
        if (wcfg && !wcfg.noWeapon) {
            updateWeaponHandPose(results.poseLandmarks);
        } else {
            gameState.weaponPoseSmooth = { left: null, right: null };
        }
    }

    if (!gameState.isPlaying || !results.poseLandmarks) return;

    const landmarks = results.poseLandmarks;
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];

    const lx = (1 - leftWrist.x) * gameW;
    const ly = leftWrist.y * gameH;
    const rx = (1 - rightWrist.x) * gameW;
    const ry = rightWrist.y * gameH;

    if (landmarkVisible(leftWrist)) {
        processWristSlash(gameState.leftWristHistory, lx, ly, 195, gameState.leftWristSmooth, gameState.leftTrail);
    } else {
        gameState.leftWristHistory = [];
        gameState.leftWristSmooth = { x: null, y: null };
        // trail fades naturally via tick()
    }

    if (landmarkVisible(rightWrist)) {
        processWristSlash(gameState.rightWristHistory, rx, ry, 28, gameState.rightWristSmooth, gameState.rightTrail);
    } else {
        gameState.rightWristHistory = [];
        gameState.rightWristSmooth = { x: null, y: null };
    }
}

function gameLoop() {
    if (!gameState.isPlaying) return;

    ctx.clearRect(0, 0, gameW, gameH);

    gameState.monsters = gameState.monsters.filter((monster) => {
        if (!monster.alive) return false;
        const onScreen = monster.update();
        if (onScreen) monster.draw(ctx);
        return onScreen;
    });

    // Show empty-state hint between waves when no monsters are visible
    if (emptyStateEl) {
        const hasVisible = gameState.monsters.some(m => m.alive);
        emptyStateEl.classList.toggle("hidden", hasVisible);
    }

    gameState.leftTrail.tick();
    gameState.rightTrail.tick();
    gameState.leftTrail.draw(ctx);
    gameState.rightTrail.draw(ctx);

    gameState.killBursts = gameState.killBursts.filter((b) => {
        const alive = b.update();
        if (alive) b.draw(ctx);
        return alive;
    });

    gameState.nearHitBursts = gameState.nearHitBursts.filter((b) => {
        const alive = b.update();
        if (alive) b.draw(ctx);
        return alive;
    });

    gameState.floatTexts = gameState.floatTexts.filter((f) => {
        const alive = f.update();
        if (alive) f.draw(ctx);
        return alive;
    });

    gameState.swingSparkles = gameState.swingSparkles.filter((s) => {
        const alive = s.update();
        if (alive) s.draw(ctx);
        return alive;
    });

    if (_swingSoundCooldown > 0) _swingSoundCooldown--;
    if (gameState.weaponHitFlash > 0) gameState.weaponHitFlash--;

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
    gameState.leftTrail.clear();
    gameState.rightTrail.clear();
    gameState.killBursts = [];
    gameState.nearHitBursts = [];
    gameState.floatTexts = [];
    gameState.swingSparkles = [];
    gameState.leftWristHistory = [];
    gameState.rightWristHistory = [];
    gameState.leftWristSmooth = { x: null, y: null };
    gameState.rightWristSmooth = { x: null, y: null };
    gameState.weaponPoseSmooth = { left: null, right: null };

    setBackground(config.background);
    updateUI();
}

async function startGame() {
    gameState.totalScore = 0;
    initStage(0);
    startScreen.classList.add("hidden");
    stageCompleteScreen.classList.add("hidden");
    gameCompleteScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    showStoryCard(0, () => {
        gameState.isPlaying = true;
        startAmbience();
        showCameraBadge();
        showInstructionBar();
        showGripHintBar();
        spawnMonster();
        gameLoop();
    });
}

function nextStage() {
    const nextIndex = gameState.currentStage + 1;
    initStage(nextIndex);
    stageCompleteScreen.classList.add("hidden");

    showStoryCard(nextIndex, () => {
        gameState.isPlaying = true;
        showCameraBadge();
        showInstructionBar();
        showGripHintBar();
        spawnMonster();
        gameLoop();
    });
}

function enableStartAfterCamera() {
    const cameraStatusEl = document.getElementById("camera-status");
    if (cameraStatusEl) {
        cameraStatusEl.textContent =
            "Camera is ready. You can start the game.";
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
        btn.innerHTML = w.noWeapon
            ? `<span class="weapon-none-placeholder" aria-hidden="true">—</span><span>${w.label}</span>`
            : `<img src="${w.path}" alt="" /><span>${w.label}</span>`;
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
    preloadImages();

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
    if (loadingOverlay) loadingOverlay.classList.add("hidden");
    const cameraStatusEl = document.getElementById("camera-status");
    if (cameraStatusEl) {
        cameraStatusEl.textContent =
            "Camera unavailable. Allow camera access in browser settings, then refresh.";
    }
    showErrorCard(
        "Could not open camera or load the pose model. Check camera permission and your network connection."
    );
});
