/**
 * Toa Moana — Sea Warrior (upper-body movement game)
 * MediaPipe Pose: segmentation + wrist trails; ocean as virtual background (video-call style)
 */

const STAGE_CONFIGS = [
    {
        // Stage 1 — Calm: slow high arcs, large targets, forgiving
        // Target ~5 min: ~15 kills/min × 10 pts = 150 pts/min → 800 pts ≈ 5.3 min
        id: 1,
        name: "Shallow warm-up",
        targetScore: 800,
        lives: 9,
        background: "img/background01.png",
        monsters: {
            size: { min: 120, max: 185 },
            speed: { vyMin: 11, vyMax: 14, vxMax: 1.8 },
            gravity: 0.07,
            spawnInterval: { min: 3800, max: 5000 },
            spawnCount: { min: 3, max: 4 },
            levelUpBonus: 0.15
        },
        pointsPerKill: 10
    },
    {
        // Stage 2 — Moderate: slightly faster arcs, still comfortable
        // Target ~5 min: ~15 kills/min × 15 pts = 225 pts/min → 1100 pts ≈ 4.9 min
        id: 2,
        name: "Surf zone",
        targetScore: 1100,
        lives: 9,
        background: "img/background02.png",
        monsters: {
            size: { min: 95, max: 152 },
            speed: { vyMin: 12, vyMax: 15, vxMax: 3.5 },
            gravity: 0.14,
            spawnInterval: { min: 3000, max: 4000 },
            spawnCount: { min: 3, max: 5 },
            levelUpBonus: 0.30
        },
        pointsPerKill: 15
    },
    {
        // Stage 3 — Moderate challenge: gentle step up from Stage 2
        // Target ~5 min: ~15 kills/min × 20 pts = 300 pts/min → 1500 pts ≈ 5.0 min
        id: 3,
        name: "Deep current",
        targetScore: 1500,
        lives: 8,
        background: "img/background03.png",
        monsters: {
            size: { min: 88, max: 138 },
            speed: { vyMin: 12, vyMax: 15, vxMax: 4.0 },
            gravity: 0.15,
            spawnInterval: { min: 2600, max: 3600 },
            spawnCount: { min: 3, max: 4 },
            levelUpBonus: 0.45
        },
        pointsPerKill: 20
    },
    {
        // Stage 4 — Challenging: the true peak
        // Target ~5 min: ~15 kills/min × 28 pts = 420 pts/min → 2100 pts ≈ 5.0 min
        id: 4,
        name: "Final abyss",
        targetScore: 2100,
        lives: 7,
        background: "img/background03.png",
        monsters: {
            size: { min: 80, max: 125 },
            speed: { vyMin: 14, vyMax: 18, vxMax: 5.5 },
            gravity: 0.20,
            spawnInterval: { min: 2000, max: 2800 },
            spawnCount: { min: 3, max: 5 },
            levelUpBonus: 0.65
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

/**
 * Extended stage metadata for the journey overview screen.
 * Indices align 1-to-1 with STAGE_CONFIGS.
 */
const STAGE_OVERVIEW = [
    {
        maoiName: "Te Tirohanga",
        subtitle: "Relaxed Exploration",
        desc: "Gentle movements to wake the body. Watch the shore and follow slow creatures.",
        minutes: 5,
        motto: "Kia tūpato — Stay Alert",
        cardImg: "img/story-card/1-Relaxed Exploration.png",
        details: [
            { label: "Creatures per wave",  value: "3 – 4",              icon: "wave"    },
            { label: "Speed",               value: "Calm",                icon: "feather" },
            { label: "Creature size",       value: "Large",               icon: "resize"  },
            { label: "Points per creature", value: "10 pts",              icon: "star"    },
            { label: "Target score",        value: "800 pts",             icon: "flag"    },
            { label: "Lives",               value: "9  —  room to learn", icon: "heart"   }
        ]
    },
    {
        maoiName: "Te Tipuranga",
        subtitle: "Steady Growth",
        desc: "Build strength and steady rhythm. Creatures move with more spirit.",
        minutes: 5,
        motto: "Kia kaha — Stay Strong",
        cardImg: "img/story-card/2-Steady Growth.png",
        details: [
            { label: "Creatures per wave",  value: "3 – 5",              icon: "wave"  },
            { label: "Speed",               value: "Moderate",            icon: "run"   },
            { label: "Creature size",       value: "Medium",              icon: "resize"},
            { label: "Points per creature", value: "15 pts",              icon: "star"  },
            { label: "Target score",        value: "1 100 pts",           icon: "flag"  },
            { label: "Lives",               value: "9  —  stay steady",   icon: "heart" }
        ]
    },
    {
        maoiName: "Te Wero",
        subtitle: "Focused Challenge",
        desc: "Sharpen your aim and your mind. Patterns shift — stay aware.",
        minutes: 6,
        motto: "Wero Tino — Focused Challenge",
        cardImg: "img/story-card/3-Focused Challenge.png",
        details: [
            { label: "Creatures per wave",  value: "3 – 4",                   icon: "wave" },
            { label: "Speed",               value: "Fast",                     icon: "bolt" },
            { label: "Creature size",       value: "Smaller",                  icon: "resize"},
            { label: "Points per creature", value: "20 pts",                   icon: "star" },
            { label: "Target score",        value: "1 500 pts",                icon: "flag" },
            { label: "Lives",               value: "8  —  fewer mistakes",     icon: "heart"}
        ]
    },
    {
        maoiName: "Te Toa Whakamutunga",
        subtitle: "Final Strike",
        desc: "Stand as a kaitiaki. Protect your people with full heart.",
        minutes: 8,
        motto: "Ngāwhatu Kai-ponu — Final Strike",
        cardImg: "img/story-card/4-Final Strike.png",
        details: [
            { label: "Creatures per wave",  value: "3 – 5",                icon: "wave"  },
            { label: "Speed",               value: "Fierce",                icon: "flame" },
            { label: "Creature size",       value: "Smallest",              icon: "resize"},
            { label: "Points per creature", value: "28 pts",                icon: "star"  },
            { label: "Target score",        value: "2 100 pts",             icon: "flag"  },
            { label: "Lives",               value: "7  —  every hit counts",icon: "heart" }
        ]
    }
];

/**
 * Narrative text shown on the journey overview screen.
 * One entry per completed-stage milestone (index = completedCount, capped at 3).
 */
const STAGE_NARRATIVES = [
    // 0 stages done — before the journey begins
    "Long ago, Kupe sailed these waters and defeated the great Te Wheke-a-Muturangi. " +
    "Now the sea stirs again. Creatures rise from the deep, drawn by an ancient restlessness. " +
    "Your people watch from the shore. Raise your weapon — the haerenga begins.",

    // 1 stage done — shallow waters cleared
    "The shallows are yours. The creatures scatter, but deeper currents carry darker things. " +
    "Word spreads along the coast: a warrior has answered the sea's challenge. " +
    "The surf zone churns ahead — move with strength and do not slow down.",

    // 2 stages done — surf zone cleared
    "Two battles won. The ocean respects your arms now. " +
    "Below the surf, cold currents carry faster, fiercer creatures toward the shore. " +
    "Tangaroa watches. He tests those who would call themselves toa. " +
    "Focus your mind — the deep current does not forgive hesitation.",

    // 3 stages done — one final clash remains
    "Three victories. The people sing your name on the shore. " +
    "But in the abyss, something ancient stirs — Te Wheke-a-Muturangi itself, " +
    "the beast Kupe once drove from these waters. It remembers. " +
    "This is your final stand. Strike with everything, kia kaha."
];

/**
 * Short narration texts — one punchy sentence per stage, spoken aloud on the story card.
 * Kept brief (~12–18 words) so audio lasts ~10–14 s at rate 0.74.
 * STAGE_NARRATIVES above remains the longer visual text shown on the overview screen.
 */
/**
 * Short narration texts spoken aloud on the story card (~12–16 words each).
 * Written in a mythic, elder-storyteller register — pauses marked with em-dashes
 * so Web Speech API delivers them with natural weight.
 */
const STAGE_NARRATION_AUDIO = [
    // Stage 1 — the haerenga begins
    "Long ago, Kupe sailed these waters. Now the sea calls again. Raise your arms — and answer.",
    // Stage 2 — deeper into the ocean
    "The shallows yield to you. But below the surf, something older stirs. Move, warrior. Do not slow.",
    // Stage 3 — Tangaroa watches
    "Tangaroa watches from the deep. He does not grant victory — he reveals who is worthy. Show him.",
    // Stage 4 — the final stand
    "In the abyss, Te Wheke-a-Muturangi wakes. What Kupe once defeated — you must face. Kia kaha."
];

const MIN_SLASH_LEN = 20;
const WRIST_HISTORY_MAX = 18;
/** Exponential smoothing: higher = snappier, lower = smoother */
const WRIST_SMOOTH_ALPHA = 0.32;
const HIT_RADIUS_EXTRA = 115;
// User request: make monsters 1.3x larger
const MONSTER_SIZE_MULT = 1.3;
// Near miss feedback (visual only, does not count as a kill)
const NEAR_HIT_RADIUS_EXTRA = 125;
const NEAR_HIT_COOLDOWN_FRAMES = 14;
const LANDMARK_MIN_VIS = 0.35;
const MAX_MONSTERS = 7;

const monsterImages = [
    "img/sea-monster/blowfish.png",
    "img/sea-monster/crabs.png",
    "img/sea-monster/eel.png",
    "img/sea-monster/electric fish.png",
    "img/sea-monster/octopus.png",
    "img/sea-monster/starfish.png",
    "img/sea-monster/turtle.png",
    "img/sea-monster/seahorse.png"   // index 7 — add seahorse.png to img/sea-monster/
];

/**
 * Weapon art and grip parameters:
 * bladeForwardIdle: fixed blade tilt (rad) toward strike direction
 * bladeSwingFactor: extra alignment to instant velocity (0–1)
 */
const WEAPONS = [
    {
        noWeapon: true,
        label: "Hands",
        maoiLabel: "Ringaringa",
        desc: "Pure movement — glowing hand trails follow every swing",
        color: "#48cae4"
    },
    {
        path: "img/weapon/knif.png",
        label: "Knife",
        maoiLabel: "Maripi",
        desc: "Fast, precise slashes — blue energy trails on every strike",
        color: "#90e0ef",
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
        maoiLabel: "Toki",
        desc: "Wide, heavy sweeps — devastating arcing strikes with real weight",
        color: "#ffd166",
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
    BLOWFISH:  0,
    CRAB:      1,
    EEL:       2,
    ELECTRIC:  3,
    OCTOPUS:   4,
    STARFISH:  5,
    TURTLE:    6,
    SEAHORSE:  7
};

/**
 * Weighted species pool per stage (0-indexed).
 * Each entry is [speciesIndex, weight]. Higher weight = more likely.
 * Stage 1: gentle creatures only — no boss (Octopus) or Electric fish.
 * Stage 2: everything unlocked, Boss/Electric still rare.
 * Stage 3-4: Boss and Electric become common threats.
 */
const SPECIES_POOLS = [
    // Stage 1 — beginners: floaty, slow, forgiving species
    [
        [SPECIES.BLOWFISH,  5],
        [SPECIES.STARFISH,  5],
        [SPECIES.SEAHORSE,  5],
        [SPECIES.TURTLE,    3],
        [SPECIES.CRAB,      2],
        [SPECIES.EEL,       1],
    ],
    // Stage 2 — everything appears, Boss/Electric very rare
    [
        [SPECIES.BLOWFISH,  4],
        [SPECIES.STARFISH,  4],
        [SPECIES.SEAHORSE,  4],
        [SPECIES.TURTLE,    3],
        [SPECIES.CRAB,      3],
        [SPECIES.EEL,       2],
        [SPECIES.ELECTRIC,  1],
        [SPECIES.OCTOPUS,   1],
    ],
    // Stage 3 — harder mix; Electric and Boss become more common
    [
        [SPECIES.BLOWFISH,  2],
        [SPECIES.STARFISH,  2],
        [SPECIES.SEAHORSE,  2],
        [SPECIES.TURTLE,    2],
        [SPECIES.CRAB,      3],
        [SPECIES.EEL,       3],
        [SPECIES.ELECTRIC,  3],
        [SPECIES.OCTOPUS,   2],
    ],
    // Stage 4 — peak difficulty; Boss and Electric dominate
    [
        [SPECIES.BLOWFISH,  1],
        [SPECIES.STARFISH,  1],
        [SPECIES.SEAHORSE,  1],
        [SPECIES.TURTLE,    2],
        [SPECIES.CRAB,      3],
        [SPECIES.EEL,       3],
        [SPECIES.ELECTRIC,  4],
        [SPECIES.OCTOPUS,   4],
    ],
];

/** Pick a random species index according to the weighted pool for a given stage. */
function pickWeightedSpecies(stageIndex) {
    const pool = SPECIES_POOLS[Math.min(stageIndex, SPECIES_POOLS.length - 1)];
    const totalWeight = pool.reduce((sum, [, w]) => sum + w, 0);
    let roll = Math.random() * totalWeight;
    for (const [species, weight] of pool) {
        roll -= weight;
        if (roll <= 0) return species;
    }
    return pool[pool.length - 1][0]; // fallback
}

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
let _gleamTick    = 0;   // global gleam phase counter (cycles 0–199)
let _weaponIdleTick = 0; // continuous tick for idle float animation

// ─── Performance / adaptive-quality system ────────────────────────────────────
// Rolling FPS measured inside gameLoop. When FPS drops below threshold we
// switch to "low-perf mode": cheaper background blur, particle caps enforced
// more aggressively, and alternate-frame landmark processing.
let _perfLastTs   = 0;
let _perfRollBuf  = new Float32Array(20); // circular buffer of last 20 frame-times (ms)
let _perfRollIdx  = 0;
let _perfRollFull = false;
let _lowPerfMode  = false;          // true when rolling FPS < 22
let _onResultsOdd = false;          // toggles each onResults call — used to skip every 2nd

const PERF_FPS_THRESHOLD = 22;      // switch quality when below this FPS
const PERF_FPS_RECOVER   = 27;      // restore full quality above this FPS
const MAX_HIT_PARTICLES  = 80;      // hard cap — older GPUs struggle with more
const MAX_SWING_SPARKLES = 60;

function _perfTrackFrame(now) {
    if (_perfLastTs > 0) {
        const dt = now - _perfLastTs;
        _perfRollBuf[_perfRollIdx] = dt;
        _perfRollIdx = (_perfRollIdx + 1) % _perfRollBuf.length;
        if (_perfRollIdx === 0) _perfRollFull = true;
        const len    = _perfRollFull ? _perfRollBuf.length : _perfRollIdx;
        let   sum    = 0;
        for (let i = 0; i < len; i++) sum += _perfRollBuf[i];
        const fps = 1000 / (sum / len);
        if (!_lowPerfMode && fps < PERF_FPS_THRESHOLD) _lowPerfMode = true;
        if ( _lowPerfMode && fps > PERF_FPS_RECOVER)   _lowPerfMode = false;
    }
    _perfLastTs = now;
}
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

// ── Per-species kill sounds ───────────────────────────────────────────────────
function playSpeciesKillSound(species) {
    const ctx = audioCtx();
    const now = ctx.currentTime;
    if (species === SPECIES.CRAB) {
        // Rapid shell-clicks: 3 short noise bursts
        for (let i = 0; i < 3; i++) {
            const t = now + i * 0.045;
            const len = Math.ceil(ctx.sampleRate * 0.022);
            const buf = ctx.createBuffer(1, len, ctx.sampleRate);
            const d   = buf.getChannelData(0);
            for (let j = 0; j < len; j++) d[j] = (Math.random() * 2 - 1) * (1 - j / len);
            const src = ctx.createBufferSource(); src.buffer = buf;
            const hpf = ctx.createBiquadFilter(); hpf.type = "highpass"; hpf.frequency.value = 3200;
            const g   = ctx.createGain();
            src.connect(hpf); hpf.connect(g); g.connect(ctx.destination);
            g.gain.setValueAtTime(0.22, t);
            src.start(t); src.stop(t + 0.025);
        }
    } else if (species === SPECIES.BLOWFISH) {
        // Cartoon pop: sharp descending pitch
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.14);
        g.gain.setValueAtTime(0.38, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
        osc.start(now); osc.stop(now + 0.17);
    } else if (species === SPECIES.OCTOPUS || species === SPECIES.ELECTRIC) {
        // Wet splat: low-pass filtered noise thud
        const len = Math.ceil(ctx.sampleRate * 0.16);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d   = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.1);
        const src = ctx.createBufferSource(); src.buffer = buf;
        const lpf = ctx.createBiquadFilter(); lpf.type = "lowpass"; lpf.frequency.value = 380;
        const g   = ctx.createGain();
        src.connect(lpf); lpf.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.45, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
        src.start(now); src.stop(now + 0.18);
    } else if (species === SPECIES.SEAHORSE) {
        // Gentle chime: two quick high-pitched sine tones — delicate and watery
        [880, 1320].forEach((freq, i) => {
            const osc = ctx.createOscillator(); const g = ctx.createGain();
            osc.connect(g); g.connect(ctx.destination);
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + i * 0.06);
            g.gain.setValueAtTime(0.20, now + i * 0.06);
            g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.22);
            osc.start(now + i * 0.06); osc.stop(now + i * 0.06 + 0.24);
        });
    }
    // Other species: default hit sound already plays, no extra needed
}

function playPowerUpCollectSound(type) {
    const ctx = audioCtx();
    const now = ctx.currentTime;
    if (type === "heart") {
        [523, 659, 784].forEach((f, i) => playTone(f, "sine", 0.18, 0.22, now + i * 0.07));
    } else {
        [784, 988, 1175].forEach((f, i) => playTone(f, "triangle", 0.14, 0.28, now + i * 0.05));
    }
}

function playChainLightningSound() {
    const ctx = audioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(2200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    osc.start(now); osc.stop(now + 0.15);
}

function playWaveClearSound() {
    const ctx = audioCtx();
    const now = ctx.currentTime;
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
        playTone(f, "sine", 0.28, 0.3, now + i * 0.09));
}
// ─────────────────────────────────────────────────────────────────────────────

let gameState = {
    isPlaying: false,
    isPaused: false,
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
    powerUps: [],           // ⭐ dropped heart / star collectibles
    lightningArcs: [],      // ⚡ chain-lightning visual arcs
    hitParticles: [],       // ✨ weapon-specific spark particles on kill
    leftBladeTipHistory:  [],   // blade-tip hit detection (weapon mode)
    rightBladeTipHistory: [],
    leftWristHistory: [],
    rightWristHistory: [],
    leftWristSmooth: { x: null, y: null },
    rightWristSmooth: { x: null, y: null },
    selectedWeaponIndex: 0,
    weaponPoseSmooth: { left: null, right: null },
    weaponHitFlash: 0,
    screenShake: 0,         // pixels of camera shake; decays each frame
    gripHintTimer: null,
    spawnTimerId: null,
    // wave-clear tracking
    waveId: 0,
    waveKillCount: 0,
    waveMissCount: 0,
    waveTotal: 0,
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
// Mask expansion canvas: used to threshold + expand the segmentation mask
// so that fingers and arm edges become fully opaque instead of semi-transparent
const maskExpandCanvas = document.createElement("canvas");
const maskExpandCtx = maskExpandCanvas.getContext("2d", { willReadFrequently: true });
// Threshold canvas: receives maskExpandCanvas after high-contrast filter
// to snap semi-transparent halo pixels to fully opaque/transparent
const threshCanvas = document.createElement("canvas");
const threshCtx = threshCanvas.getContext("2d");
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

// ── Camera check screen ───────────────────────────────────────────
const cameraCheckScreen = document.getElementById("camera-check-screen");
const ccContinueBtn     = document.getElementById("cc-continue-btn");
const ccStatusBadge     = document.getElementById("cc-status-badge");
const ccStatusText      = document.getElementById("cc-status-text");
const ccFeedback        = document.getElementById("cc-feedback");

let _cameraCheckPreviewRaf  = null; // RAF id for the preview draw loop
let _cameraCheckBodyFound   = false; // true once pose + arms detected
let _cameraCheckReadyTimer  = null; // failsafe timer

const CC_STATUS_MSGS = {
    loading:   { badge: "Starting up…",              feedback: "Setting up the camera — just a moment…" },
    searching: { badge: "Looking for you…",           feedback: "👆 Please raise both arms so the camera can see them!" },
    found:     { badge: "✓  Got you!",                feedback: "✓  Perfect — tap the button below to start playing" },
    error:     { badge: "⚠  Camera unavailable",     feedback: "Please allow camera access in your browser settings, then refresh the page" },
};

function setCameraCheckStatus(state) {
    const msg = CC_STATUS_MSGS[state];
    if (!msg) return;
    if (ccStatusBadge) {
        ccStatusBadge.className = `cc-status-badge cc-status--${state}`;
    }
    if (ccStatusText) ccStatusText.textContent = msg.badge;
    if (ccFeedback)   ccFeedback.textContent   = msg.feedback;

    // Animate the "raise arms" step card based on detection state
    const raiseStep = document.getElementById("cc-raise-step");
    if (raiseStep) {
        raiseStep.classList.toggle("cc-step--active", state === "searching");
        raiseStep.classList.toggle("cc-step--found",  state === "found");
    }
}

function startCameraPreview() {
    const canvas = document.getElementById("camera-preview-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function drawFrame() {
        _cameraCheckPreviewRaf = requestAnimationFrame(drawFrame);
        if (!video || video.readyState < 2) return;
        // Sync canvas pixels to display size
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width  = w;
            canvas.height = h;
        }
        // Draw video mirrored (like a mirror — more intuitive for positioning)
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -w, 0, w, h);
        ctx.restore();
    }
    drawFrame();
}

function stopCameraPreview() {
    if (_cameraCheckPreviewRaf !== null) {
        cancelAnimationFrame(_cameraCheckPreviewRaf);
        _cameraCheckPreviewRaf = null;
    }
}

function hideCameraCheckScreen() {
    if (cameraCheckScreen) cameraCheckScreen.classList.add("hidden");
    stopCameraPreview();
    if (_cameraCheckReadyTimer !== null) {
        clearTimeout(_cameraCheckReadyTimer);
        _cameraCheckReadyTimer = null;
    }
}

function initCameraCheck() {
    setCameraCheckStatus("loading");
    startCameraPreview();

    // Failsafe: after 20 s without detection, show a manual override note
    // but do NOT silently enable the button — user must consciously click "proceed anyway"
    _cameraCheckReadyTimer = setTimeout(() => {
        _cameraCheckReadyTimer = null;
        if (!_cameraCheckBodyFound) {
            if (ccFeedback) {
                ccFeedback.textContent =
                    "Having trouble detecting your arms? That's okay — press the button to continue anyway.";
            }
            if (ccContinueBtn) {
                ccContinueBtn.disabled = false;
                ccContinueBtn.style.opacity = "0.75";
            }
        }
    }, 20000);

    if (ccContinueBtn) {
        ccContinueBtn.addEventListener("click", hideCameraCheckScreen, { once: true });
    }
}
// ─────────────────────────────────────────────────────────────────

const storyCardOverlay = document.getElementById("story-card-overlay");
const storyCardStageEl = document.getElementById("story-card-stage");
const storyCardImgEl   = document.getElementById("story-card-img");
const storyCardTitleEl = document.getElementById("story-card-title");
const storyCardDescEl  = document.getElementById("story-card-desc");
// NOTE: No cached begin-button reference — the old const caused a stale-DOM bug
//       starting from Stage 2. Skip button is now #sc-skip-btn (always fresh via getElementById).
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
        // Option C: blur + desaturate the background image before compositing.
        // blur(4px) kills fine detail so the scene reads as atmosphere, not texture.
        // saturate(0.45) drains colour from the background so sea monsters stay
        // the most vivid elements on screen — instant visual hierarchy.
        bgCtx.save();
        bgCtx.filter = "blur(4px) saturate(0.45)";
        drawImageCover(bgCtx, bgImage, w, h);
        bgCtx.filter = "none";
        bgCtx.restore();
    } else {
        bgCtx.fillStyle = "#023047";
        bgCtx.fillRect(0, 0, w, h);
    }
    // Dark overlay: 0.28 — light touch, scenery stays vivid, monsters still pop
    bgCtx.fillStyle = "rgba(0, 10, 24, 0.28)";
    bgCtx.fillRect(0, 0, w, h);

    // Top vignette: deep-blue gradient hides any room-background bleed-through
    // that appears above the player's head when segmentation is imperfect
    const topVig = bgCtx.createLinearGradient(0, 0, 0, h * 0.25);
    topVig.addColorStop(0,   "rgba(0, 8, 28, 0.88)");
    topVig.addColorStop(0.6, "rgba(0, 8, 28, 0.35)");
    topVig.addColorStop(1,   "rgba(0, 8, 28, 0)");
    bgCtx.fillStyle = topVig;
    bgCtx.fillRect(0, 0, w, h * 0.25);

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
        maskExpandCanvas.width = vw;
        maskExpandCanvas.height = vh;
    }

    // ── Build an expanded, thresholded mask to fix semi-transparent fingers ──
    // MediaPipe Pose gives fingers/extremities low confidence (alpha ≈ 0.1–0.3).
    // Fix: draw mask with large blur (expands detected regions outward, filling
    // gaps at fingers), then draw again at full opacity with source-atop to boost
    // low-alpha pixels. The net effect fills in fingers and softens outer edges.
    // In low-perf mode we halve the blur radius and skip the second pass to save
    // ~4 ms per frame on slow machines (acceptable quality trade-off).
    const expandBlur = _lowPerfMode ? "blur(6px)"  : "blur(12px)";
    const coreBlur   = _lowPerfMode ? "blur(2px)"  : "blur(3px)";
    maskExpandCtx.clearRect(0, 0, vw, vh);
    // Pass 1 — expand: large blur pushes the person region outward, filling gaps
    maskExpandCtx.filter = expandBlur;
    maskExpandCtx.drawImage(mask, 0, 0, vw, vh);
    maskExpandCtx.filter = "none";
    if (!_lowPerfMode) {
        // Pass 2 — reinforce the high-confidence core (skipped in low-perf mode)
        maskExpandCtx.globalCompositeOperation = "source-atop";
        maskExpandCtx.filter = coreBlur;
        maskExpandCtx.drawImage(mask, 0, 0, vw, vh);
        maskExpandCtx.filter = "none";
        maskExpandCtx.globalCompositeOperation = "source-over";
    }

    // ── Hand fill: fan-of-strokes + polygon + gradient circles ──────────
    // MediaPipe Pose only provides wrist (15/16) + 4 fingertips (17-22).
    // Middle & ring fingers have NO landmarks, so a simple polygon leaves
    // visible gaps between fingers.
    //
    // Three-layer approach:
    //   1. FAT STROKES  — thick blurred lines from wrist to each fingertip
    //                     (+ interpolated middle/ring positions).
    //                     Each stroke ≈ 2× finger-width, so adjacent strokes
    //                     overlap and seal the inter-finger gaps.
    //   2. PALM POLYGON — blurred convex hull of all landmarks to solidify the
    //                     base of the hand.
    //   3. GRADIENT DOTS — soft radial circles at every landmark for edge feather.
    //
    // Landmark indices: 15=L wrist, 16=R wrist
    //                   17=L pinky tip, 18=R pinky tip
    //                   19=L index tip, 20=R index tip
    //                   21=L thumb tip, 22=R thumb tip
    if (results.poseLandmarks) {
        const L = results.poseLandmarks;

        const handDefs = [
            { wrist: 15, thumb: 21, index: 19, pinky: 17 },  // left
            { wrist: 16, thumb: 22, index: 20, pinky: 18 },  // right
        ];

        for (const hd of handDefs) {
            const wPt = L[hd.wrist];
            if (!wPt || wPt.visibility < 0.20) continue;

            const wx = wPt.x * vw;
            const wy = wPt.y * vh;

            // Collect visible fingertip positions
            const tips = [hd.thumb, hd.index, hd.pinky]
                .map(i => L[i])
                .filter(pt => pt && pt.visibility > 0.18)
                .map(pt => [pt.x * vw, pt.y * vh]);

            if (tips.length < 2) continue;

            // Estimate missing middle & ring finger tips by interpolating
            // between index and pinky (spread evenly at 1/3 and 2/3)
            const idxPt  = tips.find((_, i) => [hd.index].includes([hd.thumb, hd.index, hd.pinky][i]));
            const idxTip = tips[1] ?? tips[0]; // index (middle of array)
            const pinkyTip = tips[tips.length - 1];
            const midTip  = [(idxTip[0] * 2 + pinkyTip[0]) / 3,
                              (idxTip[1] * 2 + pinkyTip[1]) / 3];   // middle finger estimate
            const ringTip = [(idxTip[0] + pinkyTip[0] * 2) / 3,
                              (idxTip[1] + pinkyTip[1] * 2) / 3];   // ring finger estimate
            const allTips = [...tips, midTip, ringTip];

            // ── Layer 1: Fat strokes from wrist to every fingertip ────
            const strokeW = vw * 0.085; // ≈ 1.3× finger width — enough to fill gaps without giant halo
            maskExpandCtx.save();
            maskExpandCtx.filter    = "blur(8px)";
            maskExpandCtx.strokeStyle = "rgba(255,255,255,1)";
            maskExpandCtx.lineWidth = strokeW;
            maskExpandCtx.lineCap   = "round";
            maskExpandCtx.lineJoin  = "round";
            for (const [tx, ty] of allTips) {
                maskExpandCtx.beginPath();
                maskExpandCtx.moveTo(wx, wy);
                maskExpandCtx.lineTo(tx, ty);
                maskExpandCtx.stroke();
            }
            maskExpandCtx.restore();

            // ── Layer 2: Palm polygon (convex hull of wrist + all tips) ─
            const polyPts = [[wx, wy], ...allTips];
            maskExpandCtx.save();
            maskExpandCtx.filter    = "blur(10px)";
            maskExpandCtx.fillStyle = "rgba(255,255,255,1)";
            maskExpandCtx.beginPath();
            maskExpandCtx.moveTo(polyPts[0][0], polyPts[0][1]);
            for (let i = 1; i < polyPts.length; i++) {
                maskExpandCtx.lineTo(polyPts[i][0], polyPts[i][1]);
            }
            maskExpandCtx.closePath();
            maskExpandCtx.fill();
            maskExpandCtx.restore();
        }

        // ── Layer 3: Soft gradient dot at each landmark ───────────────
        const handIdx = [15, 16, 17, 18, 19, 20, 21, 22];
        const handR   = vw * 0.07;   // tighter radius — the threshold pass compensates
        for (const idx of handIdx) {
            const pt = L[idx];
            if (!pt || pt.visibility < 0.22) continue;
            const px = pt.x * vw;
            const py = pt.y * vh;
            const grad = maskExpandCtx.createRadialGradient(px, py, handR * 0.2, px, py, handR);
            grad.addColorStop(0,   "rgba(255,255,255,1.0)");
            grad.addColorStop(0.55,"rgba(255,255,255,0.95)");
            grad.addColorStop(1,   "rgba(255,255,255,0)");
            maskExpandCtx.fillStyle = grad;
            maskExpandCtx.beginPath();
            maskExpandCtx.arc(px, py, handR, 0, Math.PI * 2);
            maskExpandCtx.fill();
        }
    }

    // ── Threshold pass: snap soft mask edges to binary ────────────────
    // The blurred mask has large semi-transparent zones (~0.2–0.6 alpha)
    // at hand/finger/arm edges. These let the bright room background bleed
    // through as a white glow. A high-contrast filter snaps them to 0 or 1
    // so the cutout has clean hard edges with no halo.
    //
    // contrast(7) + brightness(1.2): alpha values that were < ~0.45 → 0 (gone),
    // values > ~0.55 → 1 (fully opaque). Small soft feather still remains
    // at the very outer edge due to the blur, but the large translucent zone is eliminated.
    if (threshCanvas.width !== vw || threshCanvas.height !== vh) {
        threshCanvas.width = vw;
        threshCanvas.height = vh;
    }
    threshCtx.clearRect(0, 0, vw, vh);
    threshCtx.filter = "contrast(7) brightness(1.18)";
    threshCtx.drawImage(maskExpandCanvas, 0, 0, vw, vh);
    threshCtx.filter = "none";

    // ── Person cutout: use THRESHOLDED mask (hard edges, no halo) ─────
    scratchCtx.clearRect(0, 0, vw, vh);
    scratchCtx.drawImage(threshCanvas, 0, 0, vw, vh);
    scratchCtx.globalCompositeOperation = "source-in";
    scratchCtx.drawImage(video, 0, 0, vw, vh);
    scratchCtx.globalCompositeOperation = "source-over";

    // ── Warm amber rim-glow uses soft (un-thresholded) mask ──────────
    // The rim glow LOOKS GOOD with soft edges (they fade into the ocean),
    // so keep maskExpandCanvas here — only the person cutout needs hard edges.
    rimCtx.clearRect(0, 0, vw, vh);
    rimCtx.drawImage(maskExpandCanvas, 0, 0, vw, vh);
    rimCtx.globalCompositeOperation = "source-in";
    rimCtx.fillStyle = "rgba(255, 155, 50, 0.85)";
    rimCtx.fillRect(0, 0, vw, vh);
    rimCtx.globalCompositeOperation = "source-over";

    // Draw subtle warm silhouette first (rim glow behind person)
    bgCtx.save();
    bgCtx.filter = "blur(12px)";              // reduced from 22px → less blurry halo
    bgCtx.globalAlpha = 0.55;                 // reduced from 0.72 → subtler glow
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

/** Load a single image; always resolves (errors are silently ignored so one
 *  missing asset doesn't block the rest). */
function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img);   // keep the (broken) img so indices stay aligned
        img.src = src;
    });
}

async function preloadMonsterImages() {
    // Fire all requests in parallel; preserve original order via Promise.all
    const imgs = await Promise.all(monsterImages.map(loadImage));
    loadedMonsterImages.push(...imgs);
}

/**
 * Remove white/near-white background from a weapon image.
 * Weapon PNGs are often exported against a white background; this converts
 * those pixels to transparent so no white rectangle appears in-game.
 * Uses a soft ramp: pixels where the *darkest* channel >= loThresh fade out
 * gradually, reaching full transparency at hiThresh.  Coloured pixels
 * (brown wood, teal stone, etc.) keep at least one dark channel and are
 * unaffected.
 */
function stripWhiteBackground(img, loThresh = 228, hiThresh = 250) {
    const oc  = document.createElement("canvas");
    oc.width  = img.naturalWidth;
    oc.height = img.naturalHeight;
    const cx  = oc.getContext("2d");
    cx.drawImage(img, 0, 0);
    const id  = cx.getImageData(0, 0, oc.width, oc.height);
    const d   = id.data;
    for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;           // already transparent
        const minC = Math.min(d[i], d[i + 1], d[i + 2]);
        if (minC >= loThresh) {
            const t   = Math.min(1, (minC - loThresh) / (hiThresh - loThresh));
            d[i + 3]  = Math.round(d[i + 3] * (1 - t));
        }
    }
    cx.putImageData(id, 0, 0);
    return oc;          // returns HTMLCanvasElement (compatible with drawImage)
}

async function preloadWeaponImages() {
    // Build a parallel task for each slot (null placeholder for noWeapon entries)
    const tasks = WEAPONS.map((w) =>
        w.noWeapon ? Promise.resolve(null) : loadImage(w.path)
    );
    const imgs = await Promise.all(tasks);
    // Strip white backgrounds before storing — prevents the white-rectangle
    // artifact that appears when a PNG with a white background is drawImage'd
    // onto a transparent canvas.
    imgs.forEach((img, i) => {
        loadedWeapons[i] = img ? stripWhiteBackground(img) : null;
    });
}

async function preloadImages() {
    await Promise.all([preloadMonsterImages(), preloadWeaponImages()]);
}

function landmarkVisible(lm) {
    const v = lm.visibility;
    return v === undefined || v === null || v >= LANDMARK_MIN_VIS;
}

class Monster {
    constructor(config, spawnHints = {}) {
        this.size =
            config.monsters.size.min +
            Math.random() * (config.monsters.size.max - config.monsters.size.min);
        this.size *= MONSTER_SIZE_MULT;
        this.monsterTypeIndex = pickWeightedSpecies(config.id - 1); // config.id is 1-based
        this.opacity = 1;
        this.spawnAge = 0;
        this.spawnDuration = 22 + Math.floor(Math.random() * 10);
        this.spawnHint = config.id === 1;
        this.moveSlowFactor = config.id === 1 ? 0.65 : 1;
        this.moveSlowRampFrames = 18;
        this.hitVibe = 0;
        this.nearHitCooldownFrames = 0;

        // Batch hints: side and screen-zone are pre-assigned to prevent clustering
        this._fromLeft = spawnHints.fromLeft;            // undefined = random
        this._targetXFraction = spawnHints.targetXFraction; // undefined = random

        this.hasEnteredScreen = false;  // true once monster is fully inside viewport

        this.puffPhase = Math.random() * Math.PI * 2;
        this.puffSpeed = 0.09 + Math.random() * 0.05;
        this.eelPhase = Math.random() * Math.PI * 2;
        this.eelWiggle = 0.11 + Math.random() * 0.05;
        this.eelAmp = 2.8 + Math.random() * 2.2;
        this.bobPhase = Math.random() * Math.PI * 2;
        this.electricShock = 0;
        this.flipX = 1;
        this.crabWalkPhase = Math.random() * Math.PI * 2;

        const sp = this.monsterTypeIndex;

        // All species use parabolic launch from bottom — like Fruit Ninja.
        // Species-specific tweaks applied after base launch is set.
        this.spawnParabolic(config, sp);

        this.image = loadedMonsterImages[this.monsterTypeIndex] || null;
        this.alive = true;
        this.dying = false;
        this.deathAge = 0;
        this.deathScaleMult = 1;
        this.deathSpinV = 0;
        this.waveId = gameState.waveId;   // track which wave this monster belongs to
        this.points = config.pointsPerKill;

        // Te Wheke (octopus) = Boss — slightly smaller than normal (flicker makes up for it), triple points
        if (sp === SPECIES.OCTOPUS) {
            this.size *= 0.80;   // smaller than other monsters — harder to hit precisely
            this.points = config.pointsPerKill * 3;
            this.isBoss = true;
        } else {
            this.isBoss = false;
        }

        // Per-species hit radius scale — simpler/bigger creatures are easier to hit.
        // Octopus is overridden dynamically by opacity in checkHit().
        const HIT_SCALES = {
            [SPECIES.BLOWFISH]:  1.35,   // puffs up big — easiest
            [SPECIES.STARFISH]:  1.20,   // slow tumbler
            [SPECIES.TURTLE]:    1.10,   // large shell
            [SPECIES.SEAHORSE]:  1.05,   // tall and slender — slightly narrow
            [SPECIES.CRAB]:      1.00,   // normal
            [SPECIES.EEL]:       0.95,   // wiggly, narrow
            [SPECIES.ELECTRIC]:  0.85,   // small and twitchy
            [SPECIES.OCTOPUS]:   1.00,   // overridden by flicker in checkHit
        };
        this.hitRadiusScale = HIT_SCALES[sp] ?? 1.0;
    }

    /**
     * Fruit-Ninja-style launch: spawn just below the screen at an assigned X zone,
     * shoot upward with physics gravity, arc up then fall back down.
     * Species tweaks (speed, spin, angle) are applied here too.
     */
    spawnParabolic(config, species) {
        const sp = config.monsters.speed;

        // ── X position: use pre-assigned zone fraction from spawnMonster ──
        const xFrac = this._targetXFraction ?? (0.15 + Math.random() * 0.70);
        this.x = gameW * xFrac;
        this.y = gameH + this.size * 0.6;   // just below screen bottom

        // ── Upward launch speed ───────────────────────────────────────────
        let launchVy = sp.vyMin + Math.random() * (sp.vyMax - sp.vyMin);

        // ── Horizontal drift: slight centre-bias + small random jitter ───
        // Monsters launched from the left lean a bit right, and vice versa,
        // so they arc visibly into the play area rather than off the side.
        const centreBias = (0.5 - xFrac) * sp.vxMax * 0.5;
        const jitter     = (Math.random() - 0.5) * sp.vxMax * 0.6;
        let launchVx = centreBias + jitter;

        // ── Gravity ───────────────────────────────────────────────────────
        this.gravity = config.monsters.gravity;

        // ── Species-specific personality ─────────────────────────────────
        this.rotation = Math.random() * Math.PI * 2;
        this.spin     = (Math.random() - 0.5) * 0.022;

        if (species === SPECIES.OCTOPUS) {
            // Boss: tall slow arc, but flickers in/out — hardest to hit
            launchVy *= 0.82;
            this.gravity *= 0.70;
            this.spin           = (Math.random() - 0.5) * 0.012;
            this.octopusBaseRot = this.rotation;
            // Flicker: two overlapping sine waves → irregular visible/invisible rhythm
            // flickerSpeed increases with stage so later stages flicker faster
            this.flickerPhase = Math.random() * Math.PI * 2;
            this.flickerSpeed = 0.14 + config.id * 0.04;   // s1:0.18 s4:0.30 — clearly visible
        } else if (species === SPECIES.TURTLE) {
            // Heavy shell: visibly arcs onto screen, but short and quick.
            // Old values (launchVy*0.72, gravity*1.18, spawn y+size*0.6) gave
            // too short an arc — turtles barely peeked above the bottom edge.
            // Fix: spawn closer to screen edge + gentler gravity + a bit more speed.
            this.y        = gameH + this.size * 0.25;  // closer to screen edge
            launchVy     *= 0.88;
            launchVx     *= 0.60;
            this.gravity *= 1.05;
            this.spin     = (Math.random() - 0.5) * 0.006;
        } else if (species === SPECIES.CRAB) {
            // Crabs enter from a screen side and scuttle horizontally across.
            // Bottom-up spawning failed because launchVy*0.48 can't overcome
            // the size*0.6 spawn offset — crabs never made it onto screen.
            //
            // New behaviour: spawn just off the left or right edge at a Y position
            // in the lower 35–62% of the screen. Pure horizontal motion (no arc),
            // only the walk-bob animation adds subtle vertical bounce.
            // Running off the far side counts as a miss (same as falling through).
            const crabDir = Math.random() > 0.5 ? 1 : -1;   // +1 = L→R, -1 = R→L
            this.x = crabDir > 0
                ? -this.size * 0.5                // entering from left
                : gameW + this.size * 0.5;         // entering from right
            this.y = gameH * (0.35 + Math.random() * 0.27);  // lower 35–62%
            launchVy      = 0;       // no vertical launch
            this.gravity  = 0;       // no gravity — horizontal-only movement
            const crabSpd = Math.min(13, Math.max(4.5, sp.vxMax * 1.5));
            launchVx      = crabDir * (crabSpd + Math.random() * 2.5);
            this.spin     = 0;
            this.rotation = 0;
            this.flipX    = crabDir; // face the direction of travel
            this.crabWalkPhase = Math.random() * Math.PI * 2;
        } else if (species === SPECIES.BLOWFISH) {
            // Floaty — puffs up and drifts
            launchVy *= 0.90;
            this.gravity *= 0.80;
            this.spin     = (Math.random() - 0.5) * 0.008;
        } else if (species === SPECIES.EEL) {
            // Wiggly — moderate arc, rotation that reads as slithering
            this.rotation = launchVx > 0 ? -0.2 : 0.2;
            this.spin     = 0;
        } else if (species === SPECIES.STARFISH) {
            // Slow tumbler
            launchVy *= 0.85;
            this.gravity *= 0.90;
            this.spin     = (Math.random() > 0.5 ? 1 : -1) * (0.008 + Math.random() * 0.010);
        } else if (species === SPECIES.ELECTRIC) {
            // Twitchy — same arc but will zigzag in update()
            this.spin     = (Math.random() - 0.5) * 0.030;
        } else if (species === SPECIES.SEAHORSE) {
            // Graceful floater: slow rise, very low gravity, gentle sway.
            // Stays upright (minimal spin) and bobs side-to-side as it drifts up.
            this.y        = gameH + this.size * 0.35;  // start just below bottom edge
            launchVy     *= 0.78;   // rises slowly
            launchVx     *= 0.40;   // barely drifts sideways — mostly vertical
            this.gravity *= 0.60;   // very light — floats a long time
            this.spin     = 0;      // seahorses stay upright
            this.seahorseBobPhase = Math.random() * Math.PI * 2;
        }

        this.vx = launchVx;
        this.vy = -launchVy;   // negative = upward
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
            // More dramatic range (0.55 → 1.0) so inflate/deflate is very visible
            const t = (Math.sin(this.spawnAge * this.puffSpeed + this.puffPhase) + 1) * 0.5; // 0→1
            return 0.55 + 0.45 * t;
        }
        return 1;
    }

    getDrawScale() {
        return this.size * this.getSpawnScale() * this.getSpeciesScale() * this.deathScaleMult;
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
        } else if (sp === SPECIES.SEAHORSE) {
            // Gentle side-sway while floating upward — like a real seahorse drifting
            this.seahorseBobPhase += 0.055;
            this.x += Math.sin(this.seahorseBobPhase) * 0.9 * moveK;
            // Subtle tilt left/right matching the sway
            this.rotation = Math.sin(this.seahorseBobPhase) * 0.10;
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
            // Flicker: two overlapping sine waves → irregular rhythm, clearly visible fade in/out
            this.flickerPhase = (this.flickerPhase || 0) + (this.flickerSpeed || 0.18);
            const w1 = Math.sin(this.flickerPhase);
            const w2 = Math.sin(this.flickerPhase * 1.73 + 1.1);
            // Sharpen the wave so it spends more time near 0 or 1, less in between
            const raw = (w1 + w2 * 0.6) / 1.6;               // −1 … +1
            const sharpened = Math.sign(raw) * Math.pow(Math.abs(raw), 0.55);
            this.opacity = Math.max(0.05, Math.min(1.0, (sharpened + 1) * 0.5));
            const base = this.octopusBaseRot ?? this.rotation;
            this.rotation = base + Math.sin(this.bobPhase * 0.5) * 0.28;
        } else if (sp === SPECIES.STARFISH) {
            this.rotation += this.spin;
        } else if (sp === SPECIES.CRAB) {
            // Walking bob: rapid up-down bounce simulating scuttling legs
            this.crabWalkPhase += 0.32;
            this.y += Math.sin(this.crabWalkPhase) * 1.1 * moveK;
            // Slight body lean based on walk rhythm (rock side-to-side)
            this.rotation = Math.sin(this.crabWalkPhase * 0.55) * 0.07;
        } else if (sp === SPECIES.BLOWFISH) {
            // Inhale → float upward; exhale → sink back down.
            // puffVal: −1 (deflated/small) to +1 (inflated/big)
            const puffVal = Math.sin(this.spawnAge * this.puffSpeed + this.puffPhase);
            this.y -= puffVal * 0.65 * moveK;   // positive = rise when puffed
            this.rotation += this.spin * 0.3;   // very slow gentle tumble
        } else {
            this.rotation += this.spin;
        }

        this.vy += this.gravity * moveK;

        this.x += this.vx * moveK;
        this.y += this.vy * moveK;

        // Track when the monster first becomes visible inside the viewport.
        // Used so crabs don't get false-positive "lost offside" while still
        // entering from their spawn edge.
        if (!this.hasEnteredScreen &&
            this.x > -this.size * 0.5 && this.x < gameW + this.size * 0.5 &&
            this.y < gameH + this.size * 0.5) {
            this.hasEnteredScreen = true;
        }

        // Soft side clamp for non-crabs — nudge back rather than hard bounce
        // so parabolic arcs near the edge still look natural.
        // Crabs are excluded: they must be allowed to exit the far side.
        if (sp !== SPECIES.CRAB) {
            if (this.x < -this.size) this.x = -this.size;
            if (this.x > gameW + this.size) this.x = gameW + this.size;
        }

        // Monster has fallen back below the screen after arcing up → missed!
        // We only count it as "out" on the way DOWN (vy > 0) to avoid
        // penalising the brief moment it spawns below the screen.
        const fellThrough = this.vy > 0 && this.y > gameH + this.size * 0.6;

        // Crab-specific: exiting the far side after entering counts as a miss.
        const crabEscaped = sp === SPECIES.CRAB && this.hasEnteredScreen &&
            (this.x < -this.size * 1.5 || this.x > gameW + this.size * 1.5);

        // Safety net: remove any monster that drifts wildly off screen
        // (only fires for non-crabs; crabs use crabEscaped above).
        const lostOffside = sp !== SPECIES.CRAB &&
            (this.x < -this.size * 3 || this.x > gameW + this.size * 3);

        if (fellThrough || crabEscaped || lostOffside) {
            if (fellThrough || crabEscaped) {
                gameState.lives--;
                gameState.waveMissCount++;
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

    // Death animation: spin + shrink over ~18 frames; returns true while still animating
    updateDeath() {
        this.deathAge++;
        this.deathSpinV += 0.04;
        this.rotation += this.deathSpinV;
        this.deathScaleMult = Math.max(0, 1 - this.deathAge / 16);
        this.opacity = Math.max(0, 1 - this.deathAge / 13);
        this.x += this.vx * 0.25;
        this.y += this.vy * 0.12;
        return this.deathAge < 18;
    }

    draw(ctx2) {
        if (!this.alive && !this.dying) return;
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

        // Boss octopus: pulse a golden glow when nearly fully visible (the "strike window")
        if (this.isBoss && this.opacity > 0.75) {
            const glowA = (this.opacity - 0.75) / 0.25;   // 0→1 as opacity goes 0.75→1
            ctx2.save();
            ctx2.globalAlpha = glowA * 0.55;
            ctx2.strokeStyle = "#ffd166";
            ctx2.lineWidth   = 5 + 4 * glowA;
            ctx2.shadowColor = "#ffd166";
            ctx2.shadowBlur  = 28 * glowA;
            ctx2.beginPath();
            ctx2.arc(0, 0, half + 8, 0, Math.PI * 2);
            ctx2.stroke();
            ctx2.restore();
        }

        ctx2.restore();
    }

    checkHit(px, py) {
        if (!this.alive) return false;
        let scale = this.hitRadiusScale ?? 1.0;
        // Boss octopus: hit radius shrinks with opacity — must swing while it's visible
        if (this.isBoss) scale = Math.max(0.10, this.opacity);
        const r = (this.getDrawScale() / 2 + HIT_RADIUS_EXTRA) * scale;
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

// ─── #36 Power-up collectible (heart / star) ─────────────────────────────────
class PowerUp {
    constructor(x, y, type) {
        this.x    = x;
        this.y    = y;
        this.type = type;   // "heart" | "star"
        this.vy   = -3.5 + Math.random() * -2;  // pop upward first
        this.vx   = (Math.random() - 0.5) * 2.5;
        this.gravity = 0.22;
        this.size = 36;
        this.life = 1;          // fades out naturally after ~4 s
        this.age  = 0;
        this.collected = false;
    }

    update() {
        this.age++;
        this.vy += this.gravity;
        this.x  += this.vx;
        this.y  += this.vy;
        // Fade after 90 frames (~1.5 s remain)
        if (this.age > 120) this.life -= 0.018;
        // Check collection by either hand palm
        if (!this.collected) {
            for (const hand of ["left", "right"]) {
                const hs = gameState[hand + "WristSmooth"];
                if (hs.x == null) continue;
                const dx = this.x - hs.x;
                const dy = this.y - hs.y;
                if (dx * dx + dy * dy < (80) ** 2) {
                    this.collected = true;
                    this.life = 0;
                    if (this.type === "heart") {
                        const maxLives = STAGE_CONFIGS[gameState.currentStage].lives;
                        gameState.lives = Math.min(gameState.lives + 1, maxLives);
                        updateUI();
                    } else {
                        // star: +50 bonus score
                        const bonus = 50;
                        gameState.stageScore += bonus;
                        gameState.floatTexts.push(new FloatScore(this.x, this.y - 30, `+${bonus}★`));
                        updateUI();
                    }
                    playPowerUpCollectSound(this.type);
                    break;
                }
            }
        }
        return this.life > 0 && this.y < gameH + 60;
    }

    draw(ctx2) {
        ctx2.save();
        ctx2.globalAlpha = Math.min(1, this.life * 1.4);
        // Pulse scale
        const pulse = 1 + 0.12 * Math.sin(this.age * 0.25);
        ctx2.translate(this.x, this.y);
        ctx2.scale(pulse, pulse);
        const emoji = this.type === "heart" ? "❤️" : "⭐";
        ctx2.font = `${this.size}px serif`;
        ctx2.textAlign = "center";
        ctx2.textBaseline = "middle";
        // Glow behind emoji
        ctx2.shadowColor = this.type === "heart" ? "rgba(255,80,80,0.9)" : "rgba(255,220,0,0.9)";
        ctx2.shadowBlur  = 18;
        ctx2.fillText(emoji, 0, 0);
        ctx2.restore();
    }
}

// ─── #37 Chain-lightning arc ──────────────────────────────────────────────────
class LightningArc {
    constructor(x0, y0, x1, y1) {
        this.x0 = x0; this.y0 = y0;
        this.x1 = x1; this.y1 = y1;
        this.life = 1;
        this.age  = 0;
        // Generate jagged mid-points for the bolt
        this._buildSegments();
    }

    _buildSegments() {
        const segs = 8;
        const pts  = [{ x: this.x0, y: this.y0 }];
        for (let i = 1; i < segs; i++) {
            const t  = i / segs;
            const bx = this.x0 + (this.x1 - this.x0) * t;
            const by = this.y0 + (this.y1 - this.y0) * t;
            const perp = Math.hypot(this.x1 - this.x0, this.y1 - this.y0) * 0.18;
            pts.push({ x: bx + (Math.random() - 0.5) * perp,
                       y: by + (Math.random() - 0.5) * perp });
        }
        pts.push({ x: this.x1, y: this.y1 });
        this._pts = pts;
    }

    update() {
        this.age++;
        // Rebuild jagged path every 3 frames to flicker like real lightning
        if (this.age % 3 === 0) this._buildSegments();
        this.life -= 0.10;
        return this.life > 0;
    }

    draw(ctx2) {
        ctx2.save();
        ctx2.globalAlpha = Math.min(1, this.life * 1.5);
        ctx2.strokeStyle = `rgba(180, 230, 255, ${this.life})`;
        ctx2.lineWidth = 2 + 3 * this.life;
        ctx2.shadowColor = "rgba(100, 200, 255, 0.9)";
        ctx2.shadowBlur  = 18;
        ctx2.beginPath();
        ctx2.moveTo(this._pts[0].x, this._pts[0].y);
        for (const p of this._pts.slice(1)) ctx2.lineTo(p.x, p.y);
        ctx2.stroke();
        // Inner bright core
        ctx2.strokeStyle = "rgba(255,255,255,0.95)";
        ctx2.lineWidth = 1;
        ctx2.shadowBlur = 6;
        ctx2.stroke();
        ctx2.restore();
    }
}

// ─── Weapon hit particles ────────────────────────────────────────────────────
/**
 * Spawns short-lived spark particles at the hit point.
 * Knife → small sharp blue sparks; Axe → larger golden embers.
 */
function spawnHitParticles(x, y, wcfg) {
    const color   = wcfg?.color || "#90e0ef";
    const isAxe   = wcfg?.label === "Axe";
    const count   = isAxe ? 12 : 10;
    const baseSpd = isAxe ? 4.5 : 3.5;
    for (let i = 0; i < count; i++) {
        const ang   = Math.random() * Math.PI * 2;
        const spd   = baseSpd + Math.random() * 4;
        const size  = isAxe ? (2.5 + Math.random() * 3) : (1.5 + Math.random() * 2.5);
        gameState.hitParticles.push({
            x, y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 1.5,   // slight upward bias
            life: 1.0,
            decay: 0.045 + Math.random() * 0.03,
            size,
            color
        });
    }
}

// ─── #41 Wave-clear bonus ─────────────────────────────────────────────────────
function checkWaveClear() {
    // Only trigger when the wave was all-or-nothing (at least 2 monsters) and 0 missed
    if (gameState.waveTotal < 2) return;
    if (gameState.waveKillCount < gameState.waveTotal) return;
    if (gameState.waveMissCount > 0) return;
    // All killed with none missed → grant bonus
    const clearBonus = Math.round(gameState.waveTotal * 15);
    gameState.stageScore += clearBonus;
    gameState.floatTexts.push(
        new FloatScore(gameW / 2, gameH * 0.22, `WAVE CLEAR +${clearBonus}`)
    );
    playWaveClearSound();
    updateUI();
    // Reset so next wave starts fresh
    gameState.waveKillCount = 0;
    gameState.waveMissCount = 0;
    gameState.waveTotal     = 0;
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
/**
 * Show the stage story card with auto-narration.
 * Flow (v5 — narration-driven dismiss, corner skip button):
 *   1. Card appears; atmospheric ambience starts immediately.
 *   2. Narration begins 600 ms later.
 *   3. Narration ends naturally → 1 s breath → card fades → game starts.
 *   4. "Skip ›" button (top-right corner) dismisses at any time.
 *   5. Safety fallback: if TTS unavailable, auto-dismiss after 7 s.
 *
 * Bug fix (v4+): stale `storyCardBeginBtn` const removed entirely.
 *   The old impl cloned+re-parented the button on every call, leaving the
 *   module-level const pointing to a detached node (parentNode === null) by
 *   Stage 2, causing a silent crash. Now every element is fetched fresh.
 */
function showStoryCard(stageIndex, onBegin) {
    const story = STAGE_STORIES[stageIndex];
    if (!story || !storyCardOverlay) { onBegin(); return; }

    // ── Populate content ─────────────────────────────────────────────────
    storyCardStageEl.textContent = story.stage;
    storyCardTitleEl.textContent = story.title;
    storyCardDescEl.textContent  = story.desc;
    if (story.img) {
        storyCardImgEl.src = story.img;
        storyCardImgEl.classList.remove("hidden");
    } else {
        storyCardImgEl.classList.add("hidden");
    }

    // Stage 1: show inline how-to-play tips
    const scTipsEl = document.getElementById("sc-tips");
    if (scTipsEl) scTipsEl.classList.toggle("hidden", stageIndex !== 0);

    // Clean up any leftover DOM from a previous card
    storyCardOverlay.querySelector(".sc-narration-wrap")?.remove();
    storyCardOverlay.classList.remove("story-card-overlay--fadeout", "hidden");

    // Start ocean ambience now so it fades in gently under the narration.
    // The same nodes will keep playing when the game starts — no restart needed.
    startAmbience(stageIndex);

    // ── Shared dismiss ───────────────────────────────────────────────────
    let _dismissed      = false;
    let _fallbackTimer  = null;
    let _narrationTimer = null;

    const doFadeOut = () => {
        if (_dismissed) return;
        _dismissed = true;
        clearTimeout(_fallbackTimer);
        clearTimeout(_narrationTimer);
        stopNarration();
        storyCardOverlay.classList.add("story-card-overlay--fadeout");
        setTimeout(() => {
            storyCardOverlay.classList.add("hidden");
            storyCardOverlay.classList.remove("story-card-overlay--fadeout");
            onBegin();
        }, 700);
    };

    // ── Helper: sync mute button icon + class ────────────────────────────
    const syncMuteBtn = (btn) => {
        if (!btn) return;
        btn.textContent = narrationMuted ? "🔇" : "🔊";
        btn.classList.toggle("muted", narrationMuted);
        btn.setAttribute("aria-label", narrationMuted ? "Voice off — tap to turn on" : "Voice on — tap to turn off");
    };

    // ── Skip button ───────────────────────────────────────────────────────
    const skipBtn = document.getElementById("sc-skip-btn");
    if (skipBtn) {
        const freshSkip = skipBtn.cloneNode(true);
        skipBtn.parentNode.replaceChild(freshSkip, skipBtn);
        freshSkip.addEventListener("click", (e) => { e.stopPropagation(); doFadeOut(); });
    }

    // ── Mute toggle button ────────────────────────────────────────────────
    const muteBtn = document.getElementById("sc-mute-btn");
    if (muteBtn) {
        const freshMute = muteBtn.cloneNode(true);
        muteBtn.parentNode.replaceChild(freshMute, muteBtn);
        syncMuteBtn(freshMute);
        freshMute.addEventListener("click", (e) => {
            e.stopPropagation();
            narrationMuted = !narrationMuted;
            localStorage.setItem("narrationMuted", narrationMuted);
            syncMuteBtn(freshMute);
            if (narrationMuted) {
                clearTimeout(_narrationTimer);
                clearTimeout(_fallbackTimer);
                stopNarration();
                if (!_dismissed) setTimeout(doFadeOut, 1500);
            }
        });
    }

    // ── One-time hint tooltip ─────────────────────────────────────────────
    const hintEl = document.getElementById("sc-voice-hint");
    if (hintEl) {
        if (!_narrationHintShown && !narrationMuted) {
            hintEl.classList.remove("hidden");
            const freshHint = hintEl.cloneNode(true);
            hintEl.parentNode.replaceChild(freshHint, hintEl);
            setTimeout(() => freshHint.classList.add("hidden"), 4600);
            _narrationHintShown = true;
            localStorage.setItem("narrationHintShown", "true");
        } else {
            hintEl.classList.add("hidden");
        }
    }

    // ── If muted: auto-dismiss after 1.5 s ───────────────────────────────
    if (narrationMuted) {
        _fallbackTimer = setTimeout(doFadeOut, 1500);
        return;
    }

    // ── Play narration; auto-dismiss when it finishes ─────────────────────
    _narrationTimer = setTimeout(() => {
        if (_dismissed) return;
        narrateText(() => {
            if (!_dismissed) setTimeout(doFadeOut, 800);
        }, stageIndex);
    }, 400);

    // Safety fallback: if narration never fires onDone (e.g. very long file), cap at 40 s
    _fallbackTimer = setTimeout(doFadeOut, 40000);
}

// ─── Stage overview / journey map ────────────────────────────────────────────
/**
 * Show the journey overview screen.
 * @param {number}   completedCount  How many stages are already done (0–4)
 * @param {function} onBegin         Called with no args when player clicks a stage card;
 *                                   initStage() is called internally before onBegin().
 */
// ── Overview card helpers ─────────────────────────────────────────
/** Render speed as filled/empty dot indicators  e.g. ●●○○ */
function ovSpeedDots(speedLabel) {
    const lvl = { Calm: 1, Moderate: 2, Fast: 3, Fierce: 4 }[speedLabel] || 1;
    const on  = `<span class="ov-dot ov-dot--on">●</span>`;
    const off = `<span class="ov-dot ov-dot--off">○</span>`;
    return on.repeat(lvl) + off.repeat(4 - lvl);
}

/** Build icon stats grid — icon + value + label */
function ovIconStatsHTML(details, isLocked) {
    if (!details || !details.length) return "";
    // details layout: [0] creatures, [1] speed, [2] size, [3] pts/kill, [4] target, [5] lives
    const creatures  = (details[0]?.value || "—").replace(/\s/g, "");
    const speedLbl   = details[1]?.value || "Calm";
    const ptsRaw     = details[3]?.value || "—";
    const targetRaw  = details[4]?.value || "—";
    const livesRaw   = details[5]?.value || "—";
    const livesNum   = (livesRaw.match(/\d+/) || ["—"])[0];

    return `<div class="ov-icon-stats">
        <div class="ov-istat" tabindex="0" data-tip="Sea creatures per wave — defeat them all to advance!">
            <span class="ov-istat-icon">🐙</span>
            <div class="ov-istat-text">
                <span class="ov-istat-val">${creatures}</span>
                <span class="ov-istat-lbl">Per Wave</span>
            </div>
        </div>
        <div class="ov-istat" tabindex="0" data-tip="How fast creatures move — Calm is easiest, Fierce is hardest">
            <span class="ov-istat-icon">⚡</span>
            <div class="ov-istat-text">
                <span class="ov-istat-val">${speedLbl}</span>
                <span class="ov-istat-lbl">Speed</span>
            </div>
        </div>
        <div class="ov-istat" tabindex="0" data-tip="Points earned per creature defeated">
            <span class="ov-istat-icon">⭐</span>
            <div class="ov-istat-text">
                <span class="ov-istat-val">${ptsRaw}</span>
                <span class="ov-istat-lbl">Points</span>
            </div>
        </div>
        <div class="ov-istat" tabindex="0" data-tip="Score needed to complete this stage">
            <span class="ov-istat-icon">🎯</span>
            <div class="ov-istat-text">
                <span class="ov-istat-val">${targetRaw}</span>
                <span class="ov-istat-lbl">Target</span>
            </div>
        </div>
        <div class="ov-istat" tabindex="0" data-tip="Your Mauri (life force) — lives before the journey ends">
            <span class="ov-istat-icon">❤️</span>
            <div class="ov-istat-text">
                <span class="ov-istat-val">${livesNum}</span>
                <span class="ov-istat-lbl">Lives</span>
            </div>
        </div>
    </div>`;
}
// ─────────────────────────────────────────────────────────────────

let _ovTipInited = false;
function initOvTooltip() {
    if (_ovTipInited) return;
    _ovTipInited = true;

    // Create tooltip element once
    let tip = document.getElementById("ov-tip");
    if (!tip) {
        tip = document.createElement("div");
        tip.id = "ov-tip";
        tip.setAttribute("role", "tooltip");
        document.body.appendChild(tip);
    }

    const cardsEl = document.getElementById("ov-cards");
    if (!cardsEl) return;

    let hideTimer = null;

    function position(el) {
        const rect = el.getBoundingClientRect();
        const tw = tip.offsetWidth || 220;
        const th = tip.offsetHeight || 60;
        let left = rect.left + rect.width / 2 - tw / 2;
        let top  = rect.top - th - 12;
        if (top < 8) top = rect.bottom + 12;   // flip below if no room above
        left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
        tip.style.left = left + "px";
        tip.style.top  = top  + "px";
    }

    function show(el) {
        clearTimeout(hideTimer);
        const text = el.dataset.tip;
        if (!text) return;
        tip.textContent = text;
        tip.classList.add("ov-tip--on");
        position(el);
        tip._src = el;
    }

    function hide(delay) {
        hideTimer = setTimeout(() => {
            tip.classList.remove("ov-tip--on");
            tip._src = null;
        }, delay ?? 120);
    }

    // Hover
    cardsEl.addEventListener("mouseover", (e) => {
        const el = e.target.closest("[data-tip]");
        if (el) show(el);
    });
    cardsEl.addEventListener("mouseout", (e) => {
        if (e.target.closest("[data-tip]")) hide();
    });

    // Keyboard focus
    cardsEl.addEventListener("focusin", (e) => {
        const el = e.target.closest("[data-tip]");
        if (el) show(el);
    });
    cardsEl.addEventListener("focusout", (e) => {
        if (e.target.closest("[data-tip]")) hide(0);
    });

    // Tap / click toggle
    cardsEl.addEventListener("click", (e) => {
        const el = e.target.closest("[data-tip]");
        if (!el) { hide(0); return; }
        if (tip._src === el && tip.classList.contains("ov-tip--on")) {
            hide(0);
        } else {
            show(el);
        }
        e.stopPropagation();
    });
    document.addEventListener("click", () => hide(0));
}

function showStageOverview(completedCount, onBegin) {
    const screen = document.getElementById("stage-overview-screen");
    if (!screen) { onBegin(); return; }   // graceful fallback if HTML isn't present

    // ── Progress bar ──────────────────────────────────────────────────────────
    const fillEl = document.getElementById("ov-prog-fill");
    const textEl = document.getElementById("ov-prog-text");
    const pct = Math.round((completedCount / STAGE_CONFIGS.length) * 100);
    if (fillEl) fillEl.style.width = pct + "%";
    if (textEl) textEl.textContent =
        `${completedCount} OF ${STAGE_CONFIGS.length} COMPLETE`;

    // ── Story narrative ───────────────────────────────────────────────────────
    const storyEl = document.getElementById("ov-story");
    if (storyEl) {
        const narrativeIdx = Math.min(completedCount, STAGE_NARRATIVES.length - 1);
        storyEl.textContent = STAGE_NARRATIVES[narrativeIdx];
    }

    // ── Build stage cards ─────────────────────────────────────────────────────
    const cardsEl = document.getElementById("ov-cards");
    if (!cardsEl) { screen.classList.remove("hidden"); return; }
    cardsEl.innerHTML = "";

    STAGE_CONFIGS.forEach((cfg, i) => {
        const info = STAGE_OVERVIEW[i];
        const cardState = i < completedCount ? "done"
                        : i === completedCount  ? "active"
                        : "locked";

        const card = document.createElement("div");
        card.className = `ov-card ov-card--${cardState}`;
        card.setAttribute("aria-label",
            `Stage ${i + 1}: ${info.maoiName} — ${cardState}`);

        const isLocked = cardState === "locked";
        const unlockHint = i > 0 ? `Complete Stage ${i} to unlock` : "Locked";

        card.innerHTML = `
            <div class="ov-img" style="background-image:url('${info.cardImg || cfg.background}')">
                <span class="ov-num">${i + 1}</span>
                <span class="ov-duration">⏱ ${info.minutes} min</span>
                ${isLocked ? '<span class="ov-lock" aria-hidden="true">🔒</span>' : ""}
                ${cardState === "done" ? '<span class="ov-check" aria-hidden="true">✓</span>' : ""}
            </div>
            <div class="ov-body">
                <div class="ov-top">
                    <h3 class="ov-name">${info.maoiName}</h3>
                    <p class="ov-subtitle">${info.subtitle}</p>
                    <p class="ov-desc">${info.desc}</p>
                </div>
                ${ovIconStatsHTML(info.details, isLocked)}
                <div class="ov-action">
                    ${cardState === "active"
                        ? `<button type="button" class="ov-begin-btn" data-index="${i}">Begin →</button>`
                        : ""}
                    ${cardState === "done"
                        ? '<span class="ov-complete-label">✓</span>'
                        : ""}
                    ${isLocked
                        ? `<span class="ov-unlock-hint">${unlockHint}</span>`
                        : ""}
                </div>
            </div>`;

        cardsEl.appendChild(card);
    });

    // ── Wire up begin buttons ─────────────────────────────────────────────────
    cardsEl.querySelectorAll(".ov-begin-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            screen.classList.add("hidden");
            const idx = parseInt(btn.dataset.index, 10);
            initStage(idx);
            onBegin();
        });
    });

    initOvTooltip();

    // ── Change Weapon button ──────────────────────────────────────────────────
    const changeBtn = document.getElementById("ov-change-weapon-btn");
    if (changeBtn) {
        // Remove any previous listener by cloning the button
        const freshBtn = changeBtn.cloneNode(true);
        changeBtn.parentNode.replaceChild(freshBtn, changeBtn);
        freshBtn.addEventListener("click", () => openOvWeaponModal());
    }
    initOvWeaponModal();

    screen.classList.remove("hidden");
}

/** Build and initialise the floating weapon-picker modal on the overview screen */
function initOvWeaponModal() {
    const modal   = document.getElementById("ov-weapon-modal");
    const grid    = document.getElementById("ovm-grid");
    const closeBtn= document.getElementById("ovm-close");
    const confirmBtn = document.getElementById("ovm-confirm");
    if (!modal || !grid) return;

    // Clone buttons to purge old listeners
    const freshClose   = closeBtn  ? closeBtn.cloneNode(true)   : null;
    const freshConfirm = confirmBtn ? confirmBtn.cloneNode(true) : null;
    if (freshClose   && closeBtn)   closeBtn.parentNode.replaceChild(freshClose, closeBtn);
    if (freshConfirm && confirmBtn) confirmBtn.parentNode.replaceChild(freshConfirm, confirmBtn);

    // Rebuild weapon cards
    grid.innerHTML = "";
    let pendingIndex = gameState.selectedWeaponIndex;
    WEAPONS.forEach((w, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "weapon-card" + (i === pendingIndex ? " selected" : "");
        btn.setAttribute("role", "option");
        btn.setAttribute("aria-selected", i === pendingIndex ? "true" : "false");
        btn.dataset.index = String(i);
        if (w.color) btn.style.setProperty("--wc-accent", w.color);
        const imgHTML = w.noWeapon
            ? `<div class="wc-img-wrap wc-img-hands" aria-hidden="true">
                   <svg viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg" class="wc-hands-svg">
                       <path d="M18 52 C16 44 16 36 18 28 C18 24 22 22 26 24 L26 18 C26 14 30 12 33 14 C34 10 38 9 41 12 C42 8 46 8 48 12 L48 26 C52 24 56 26 56 32 L56 54 C56 66 48 76 36 78 C24 78 18 68 18 56 Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
                       <line x1="26" y1="24" x2="26" y2="44" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
                       <line x1="33" y1="14" x2="33" y2="44" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
                       <line x1="41" y1="12" x2="41" y2="44" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
                       <line x1="48" y1="12" x2="48" y2="44" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
                   </svg>
               </div>`
            : `<div class="wc-img-wrap" aria-hidden="true"><img src="${w.path}" alt="" class="wc-img" /></div>`;
        btn.innerHTML = `
            ${imgHTML}
            <div class="wc-body">
                <span class="wc-maori">${w.maoiLabel || ""}</span>
                <span class="wc-name">${w.label}</span>
                <span class="wc-desc">${w.desc || ""}</span>
            </div>
            <span class="wc-check" aria-hidden="true">✓</span>`;
        btn.addEventListener("click", () => {
            pendingIndex = i;
            grid.querySelectorAll(".weapon-card").forEach((b, j) => {
                const sel = j === i;
                b.classList.toggle("selected", sel);
                b.setAttribute("aria-selected", sel ? "true" : "false");
            });
        });
        grid.appendChild(btn);
    });

    // Confirm: apply selection and close
    const newConfirm = document.getElementById("ovm-confirm");
    if (newConfirm) {
        newConfirm.addEventListener("click", () => {
            gameState.selectedWeaponIndex = pendingIndex;
            closeOvWeaponModal();
        });
    }
    // Close / backdrop
    const newClose = document.getElementById("ovm-close");
    if (newClose) newClose.addEventListener("click", closeOvWeaponModal);
    const backdrop = modal.querySelector(".ovm-backdrop");
    if (backdrop) backdrop.addEventListener("click", closeOvWeaponModal);
}

function openOvWeaponModal() {
    const modal = document.getElementById("ov-weapon-modal");
    if (modal) modal.classList.remove("hidden");
}

function closeOvWeaponModal() {
    const modal = document.getElementById("ov-weapon-modal");
    if (modal) modal.classList.add("hidden");
}

function hideStageOverview() {
    const screen = document.getElementById("stage-overview-screen");
    if (screen) screen.classList.add("hidden");
}

// ─── Affirmation popup ────────────────────────────────────────────────────────
function showAffirmation(x, y) {
    const text = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
    const el = document.createElement("div");
    el.className = "affirmation-text";
    el.textContent = text;
    // Pin to top-centre so it never overlaps the player's hands
    el.style.left      = "50%";
    el.style.transform = "translateX(-50%)";
    el.style.top       = `${Math.round(gameH * 0.07)}px`;
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
    el.style.left      = "50%";
    el.style.transform = "translateX(-50%)";
    el.style.top       = `${Math.round(gameH * 0.07)}px`;
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

// ─── Ambient ocean music + Māori drums ────────────────────────────────────────
let _ambienceNodes = [];
let _drumScheduler  = null;
let _drumNextTime   = 0;
let _drumStep       = 0;

/**
 * startAmbience(stageIndex)
 * Three-layer ocean ambience (deep rumble / mid surf / high spray), each with
 * a slow LFO swell, plus a rhythmic Māori-style kick-drum pattern that grows
 * more intense each stage.
 */
function startAmbience(stageIndex = 0) {
    stopAmbience();
    const ctx2   = audioCtx();
    const stage  = Math.min(stageIndex, 3);
    const allNodes = [];

    // Per-stage intensity and drum tempo
    const intensityScale = [0.55, 0.70, 0.85, 1.0][stage];
    const drumBPM        = [68,   84,  102,  118][stage];

    // Master output (fades in over 2.5 s so first beat isn't jarring)
    const master = ctx2.createGain();
    master.gain.setValueAtTime(0, ctx2.currentTime);
    master.gain.linearRampToValueAtTime(intensityScale, ctx2.currentTime + 2.5);
    master.connect(ctx2.destination);
    allNodes.push(master);

    // ── Ocean layers ───────────────────────────────────────────────────────────
    function makeOceanLayer(lpFreq, hpFreq, baseGain, lfoFreq, lfoDepth) {
        const bufLen = ctx2.sampleRate * 5;
        const buf    = ctx2.createBuffer(1, bufLen, ctx2.sampleRate);
        const d      = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;

        const src = ctx2.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        src.loopStart = Math.random() * 2; // stagger phase so layers don't align

        const lpf = ctx2.createBiquadFilter();
        lpf.type = "lowpass";
        lpf.frequency.value = lpFreq;

        const hpf = ctx2.createBiquadFilter();
        hpf.type = "highpass";
        hpf.frequency.value = hpFreq;

        const layerGain = ctx2.createGain();
        layerGain.gain.value = baseGain;

        // LFO: slow swell to simulate wave motion
        const lfo  = ctx2.createOscillator();
        lfo.type   = "sine";
        lfo.frequency.value = lfoFreq;
        const lfoG = ctx2.createGain();
        lfoG.gain.value = lfoDepth * baseGain;

        src.connect(hpf);
        hpf.connect(lpf);
        lpf.connect(layerGain);
        lfo.connect(lfoG);
        lfoG.connect(layerGain.gain);
        layerGain.connect(master);

        src.start();
        lfo.start();
        allNodes.push(src, hpf, lpf, lfo, lfoG, layerGain);
    }

    // Layer 1 — deep ocean rumble (20–160 Hz), ~14-second swell
    makeOceanLayer(160,  20,   0.10,  0.072, 0.50);
    // Layer 2 — mid surf wash (180–900 Hz), ~7-second swell
    makeOceanLayer(900,  180,  0.055, 0.15,  0.45);
    // Layer 3 — high spray / hiss (1 800–5 000 Hz), fast flutter
    makeOceanLayer(5000, 1800, 0.025, 0.38,  0.40);

    // ── Māori drum scheduler ───────────────────────────────────────────────────
    const eighthDur = (60 / drumBPM) / 2;  // one 8th-note in seconds
    const LOOKAHEAD = 0.15;                  // schedule this many s ahead
    const TICK_MS   = 80;                    // poll every 80 ms

    // 8th-note kick patterns (1 = strike, 0 = rest), 8 steps = 1 bar
    const kickPatterns = [
        [1,0, 0,0, 1,0, 0,0],   // Stage 1 — slow quarter notes
        [1,0, 0,0, 1,0, 1,0],   // Stage 2 — + pick-up on beat 3.5
        [1,0, 1,0, 1,0, 0,1],   // Stage 3 — driving syncopation
        [1,0, 1,1, 1,0, 1,0],   // Stage 4 — intense warrior rhythm
    ];
    // Rim/wood-block accent on off-beats (stages 2–4)
    const rimPatterns = [
        [0,0, 0,0, 0,0, 0,0],
        [0,0, 0,0, 1,0, 0,0],
        [0,1, 0,0, 0,1, 0,0],
        [0,1, 0,1, 0,1, 0,1],
    ];
    const kickPat = kickPatterns[stage];
    const rimPat  = rimPatterns[stage];

    function scheduleKick(t) {
        // Low sine: punch + pitch drop (pahu drum body)
        const osc = ctx2.createOscillator();
        const og  = ctx2.createGain();
        osc.connect(og); og.connect(master);
        osc.type = "sine";
        osc.frequency.setValueAtTime(190 + stage * 18, t);
        osc.frequency.exponentialRampToValueAtTime(38, t + 0.16);
        og.gain.setValueAtTime(0.52 * intensityScale, t);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        osc.start(t); osc.stop(t + 0.24);

        // Noise burst: skin-impact transient
        const nLen = Math.ceil(ctx2.sampleRate * 0.04);
        const nBuf = ctx2.createBuffer(1, nLen, ctx2.sampleRate);
        const nd   = nBuf.getChannelData(0);
        for (let i = 0; i < nLen; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nLen);
        const ns  = ctx2.createBufferSource(); ns.buffer = nBuf;
        const nbf = ctx2.createBiquadFilter();
        nbf.type = "bandpass"; nbf.frequency.value = 250; nbf.Q.value = 0.9;
        const ng  = ctx2.createGain();
        ns.connect(nbf); nbf.connect(ng); ng.connect(master);
        ng.gain.setValueAtTime(0.30 * intensityScale, t);
        ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
        ns.start(t); ns.stop(t + 0.05);
    }

    function scheduleRim(t) {
        // Short triangle click: wood block / rim accent
        const osc = ctx2.createOscillator();
        const og  = ctx2.createGain();
        osc.connect(og); og.connect(master);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(700, t);
        osc.frequency.exponentialRampToValueAtTime(340, t + 0.04);
        og.gain.setValueAtTime(0.18 * intensityScale, t);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        osc.start(t); osc.stop(t + 0.055);
    }

    _drumStep     = 0;
    _drumNextTime = ctx2.currentTime + 0.6; // brief lead-in before first beat

    function tickDrums() {
        if (!_drumScheduler) return;
        const now = audioCtx().currentTime;
        while (_drumNextTime < now + LOOKAHEAD) {
            const step = _drumStep % kickPat.length;
            if (kickPat[step]) scheduleKick(_drumNextTime);
            if (rimPat[step])  scheduleRim(_drumNextTime);
            _drumNextTime += eighthDur;
            _drumStep++;
        }
        _drumScheduler = setTimeout(tickDrums, TICK_MS);
    }
    _drumScheduler = setTimeout(tickDrums, TICK_MS);

    _ambienceNodes = allNodes;
}

function stopAmbience() {
    if (_drumScheduler) { clearTimeout(_drumScheduler); _drumScheduler = null; }
    _ambienceNodes.forEach(n => { try { n.disconnect(); if (n.stop) n.stop(); } catch (_) {} });
    _ambienceNodes = [];
}

// ─── Story-card narration (WAV playback only) ─────────────────────────────────
/**
 * Plays the pre-recorded WAV narration for a stage.
 * No TTS, no Web Audio oscillators — HTMLAudioElement only.
 * onDone() fires when playback ends or on any error/block.
 */

const STAGE_NARRATION_FILES = [
    "img/audio/narration-1.wav",
    "img/audio/narration-2.wav",
    "img/audio/narration-3.wav",
    "img/audio/narration-4.wav",
];

// ── Narration mute preference (persisted in localStorage) ───────────────────
// Default: unmuted unless the user has explicitly turned it OFF before
let narrationMuted      = localStorage.getItem("narrationMuted") === "true";
let _narrationHintShown = localStorage.getItem("narrationHintShown") === "true";

let _narrationAudio = null;   // the one active HTMLAudioElement

/** Play the WAV for stageIndex. Calls onDone when done or on any failure. */
function narrateText(onDone, stageIndex) {
    stopNarration();
    const path = STAGE_NARRATION_FILES[stageIndex];
    if (!path) { onDone(); return; }

    const audio = new Audio(path);
    _narrationAudio = audio;

    const finish = () => {
        if (_narrationAudio !== audio) return;  // already superseded
        _narrationAudio = null;
        onDone();
    };

    audio.onended  = finish;
    audio.onerror  = finish;
    audio.play().catch(finish);   // blocked by autoplay policy → treat as done
}

/** Immediately stop any playing narration. No fades, no async. */
function stopNarration() {
    if (_narrationAudio) {
        _narrationAudio.onended = null;
        _narrationAudio.onerror = null;
        _narrationAudio.pause();
        _narrationAudio.src = "";
        _narrationAudio = null;
    }
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
    gameState.isPaused  = false;
    cancelSpawnTimer();
    stopAmbience();
    hideCameraBadge();
    hidePauseBtn();
    hideInstructionBar();
    hideEmptyState();
    [stageCompleteScreen, gameCompleteScreen, gameOverScreen,
     storyCardOverlay].forEach(el => el && el.classList.add("hidden"));
    hideStageOverview();
    startScreen.classList.remove("hidden");
    showPlayerBadge();
}
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && gameState.isPlaying) {
        if (gameState.isPaused) resumeGame();
        else pauseGame();
    }
});

// ─── Pause system ─────────────────────────────────────────────────────────────
const pauseOverlayEl    = document.getElementById("pause-overlay");
const pauseResumeBtnEl  = document.getElementById("pause-resume-btn");
const pauseExitBtnEl    = document.getElementById("pause-exit-btn");
const pauseBtnEl        = document.getElementById("pause-btn");

function showPauseBtn()  { pauseBtnEl  && pauseBtnEl.classList.remove("hidden"); }
function hidePauseBtn()  { pauseBtnEl  && pauseBtnEl.classList.add("hidden"); }

function pauseGame() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    gameState.isPaused = true;
    cancelSpawnTimer();
    // Suspend AudioContext so all sound (ambience + drums) pauses cleanly
    if (_audioCtx) _audioCtx.suspend();
    pauseOverlayEl && pauseOverlayEl.classList.remove("hidden");
}

function resumeGame() {
    if (!gameState.isPaused) return;
    gameState.isPaused = false;
    pauseOverlayEl && pauseOverlayEl.classList.add("hidden");
    if (_audioCtx) _audioCtx.resume();
    // Re-trigger spawn cycle (it was cancelled on pause)
    spawnMonster();
}

// Wire up pause overlay buttons
if (pauseResumeBtnEl) pauseResumeBtnEl.addEventListener("click", resumeGame);
if (pauseExitBtnEl)   pauseExitBtnEl.addEventListener("click", () => {
    gameState.isPaused = false;
    pauseOverlayEl && pauseOverlayEl.classList.add("hidden");
    returnToStart();
});
// Wire up the in-game pause button
if (pauseBtnEl) pauseBtnEl.addEventListener("click", () => {
    if (gameState.isPaused) resumeGame(); else pauseGame();
});

// ─── Tutorial overlay ─────────────────────────────────────────────────────────
const tutorialOverlayEl = document.getElementById("tutorial-overlay");
const tutGoBtnEl        = document.getElementById("tut-go-btn");
const tutCountdownBarEl = document.getElementById("tut-countdown-bar");

const TUT_DURATION_MS = 9000; // auto-dismiss after 9 s

/**
 * showTutorial(callback)
 * Displays the tutorial overlay, then calls callback() when dismissed
 * (either by button or by auto-countdown).  Only shown on Stage 1.
 */
function showTutorial(callback) {
    if (!tutorialOverlayEl) { callback(); return; }

    tutorialOverlayEl.classList.remove("hidden");

    // Animate countdown bar shrinking from 100% → 0% over TUT_DURATION_MS
    if (tutCountdownBarEl) {
        tutCountdownBarEl.style.transition = "none";
        tutCountdownBarEl.style.transform  = "scaleX(1)";
        // Force reflow so the reset is applied before transition starts
        tutCountdownBarEl.getBoundingClientRect();
        tutCountdownBarEl.style.transition = `transform ${TUT_DURATION_MS}ms linear`;
        tutCountdownBarEl.style.transform  = "scaleX(0)";
    }

    let dismissed = false;
    const dismiss = () => {
        if (dismissed) return;
        dismissed = true;
        clearTimeout(autoTimer);
        tutorialOverlayEl.classList.add("hidden");
        if (tutCountdownBarEl) {
            tutCountdownBarEl.style.transition = "none";
            tutCountdownBarEl.style.transform  = "scaleX(1)";
        }
        callback();
    };

    const autoTimer = setTimeout(dismiss, TUT_DURATION_MS);

    // Button click dismisses immediately
    if (tutGoBtnEl) {
        const handler = () => { tutGoBtnEl.removeEventListener("click", handler); dismiss(); };
        tutGoBtnEl.addEventListener("click", handler);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
/** Track previous lives to detect gains (heart-collect) vs losses */
let _prevLivesForUI = -1;

function updateUI() {
    const sum = gameState.totalScore + gameState.stageScore;
    scoreEl.textContent = sum;
    stageEl.textContent = gameState.currentStage + 1;
    const config = STAGE_CONFIGS[gameState.currentStage];
    targetEl.textContent = `${gameState.stageScore}/${config.targetScore}`;
    comboEl.textContent = gameState.combo;

    // ── Heart lives display ──────────────────────────────────────
    const maxLives     = config.lives;
    const currentLives = Math.max(0, gameState.lives);
    const isGain       = currentLives > _prevLivesForUI && _prevLivesForUI >= 0;
    _prevLivesForUI    = currentLives;

    // Build hearts HTML: full hearts first, then lost hearts
    const hearts = Array.from({ length: maxLives }, (_, i) => {
        if (i < currentLives) {
            // Animate the newly gained heart if lives went up
            const gainClass = (isGain && i === currentLives - 1) ? " lh--gain" : "";
            return `<span class="lh lh--full${gainClass}" aria-hidden="true">💖</span>`;
        }
        return `<span class="lh lh--lost" aria-hidden="true">🤍</span>`;
    }).join("");

    livesEl.innerHTML = hearts;
    livesEl.setAttribute("aria-label", `${currentLives} of ${maxLives} lives remaining`);
    livesEl.classList.toggle("lives-danger", currentLives <= 2);
    // ─────────────────────────────────────────────────────────────

    if (progressFillEl) {
        const pct = Math.min(100, (gameState.stageScore / config.targetScore) * 100);
        progressFillEl.style.width = pct + "%";
    }
}

function showComboText(x, y, text) {
    const el = document.createElement("div");
    // #38 Combo视觉升级: parse combo number for tier colour
    const comboNum = parseInt(text, 10) || 0;
    let tier = "combo-text";
    if (comboNum >= 8)      tier = "combo-text combo-text--rainbow";
    else if (comboNum >= 5) tier = "combo-text combo-text--gold";
    else if (comboNum >= 3) tier = "combo-text combo-text--cyan";
    el.className = tier;
    el.textContent = text;
    el.style.left      = "50%";
    el.style.transform = "translateX(-50%)";
    el.style.top       = `${Math.round(gameH * 0.14)}px`;
    document.getElementById("game-container").appendChild(el);
    setTimeout(() => el.remove(), 1600);
}

function setBackground(imagePath) {
    if (imagePath) {
        bgImage.src = imagePath;
    }
}

function spawnMonster() {
    gameState.spawnTimerId = null;
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

        // Stagger: stage 1 = 550 ms between launches, stage 4 = 220 ms
        const staggerMs = Math.round(550 / (1 + gameState.currentStage * 0.45));

        // Spread launch X-zones evenly across screen (20 %–80 %) with slight jitter.
        // Narrowed from 15-85% so monsters never appear right at the edge where
        // elderly players struggle to reach. Forces left/right arm exercise without
        // requiring extreme extension.
        const zoneWidth = 0.60 / Math.max(count - 1, 1);
        const baseZones = Array.from({ length: count }, (_, i) =>
            count === 1 ? 0.5 : 0.20 + i * zoneWidth
        );
        // Simple shuffle so monsters don't always come in the same order
        for (let i = baseZones.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [baseZones[i], baseZones[j]] = [baseZones[j], baseZones[i]];
        }

        // #41 波次清空奖励: assign a new waveId for this batch
        gameState.waveId++;
        gameState.waveKillCount = 0;
        gameState.waveMissCount = 0;
        gameState.waveTotal     = count;

        for (let i = 0; i < count; i++) {
            const targetXFraction = Math.max(0.18, Math.min(0.82,
                baseZones[i] + (Math.random() - 0.5) * Math.min(zoneWidth * 0.4, 0.06)
            ));
            setTimeout(() => {
                if (gameState.isPlaying) {
                    gameState.monsters.push(new Monster(config, { targetXFraction }));
                }
            }, i * staggerMs);
        }
    }

    const interval =
        config.monsters.spawnInterval.min +
        Math.random() * (config.monsters.spawnInterval.max - config.monsters.spawnInterval.min);
    gameState.spawnTimerId = setTimeout(spawnMonster, interval);
}

/** Cancel any pending spawnMonster timer (call before stopping the game). */
function cancelSpawnTimer() {
    if (gameState.spawnTimerId !== null) {
        clearTimeout(gameState.spawnTimerId);
        gameState.spawnTimerId = null;
    }
}

function checkStageComplete() {
    const config = STAGE_CONFIGS[gameState.currentStage];
    if (gameState.stageScore >= config.targetScore) {
        gameState.isPlaying = false;
        cancelSpawnTimer();
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
    hidePauseBtn();
    hideInstructionBar();
    hideEmptyState();
    playStageCompleteSound();
    completedStageEl.textContent = gameState.currentStage + 1;
    stageScoreEl.textContent = gameState.stageScore;
    stageCompleteScreen.classList.remove("hidden");
    showPlayerBadge();
}

// ─── Multi-user leaderboard — shared device support ──────────────────────────
const LB_STORAGE_KEY = "maori_hero_lb_v2";
const LB_LAST_PLAYER_KEY = "maori_hero_last_player";

/// Session-only: who is playing right now (not persisted)
let currentPlayerName = "";

const WARRIOR_TITLES = [
    { min: 0,    title: "Ākonga",                subtitle: "Learner" },
    { min: 150,  title: "Toa Hou",               subtitle: "New Warrior" },
    { min: 350,  title: "Toa",                   subtitle: "Warrior" },
    { min: 600,  title: "Toa Māia",              subtitle: "Brave Warrior" },
    { min: 850,  title: "Kaitiaki",              subtitle: "Guardian" },
    { min: 1100, title: "Tohunga",               subtitle: "Expert" },
    { min: 1400, title: "Rangatira o te Moana",  subtitle: "Chief of the Sea" },
];

function getWarriorTitle(score) {
    for (let i = WARRIOR_TITLES.length - 1; i >= 0; i--) {
        if (score >= WARRIOR_TITLES[i].min) return WARRIOR_TITLES[i];
    }
    return WARRIOR_TITLES[0];
}

/** Load the shared leaderboard array: [{ name, best, plays, lastDate }, ...] */
function loadLeaderboard() {
    try { return JSON.parse(localStorage.getItem(LB_STORAGE_KEY)) || []; }
    catch { return []; }
}

function saveLeaderboard(lb) {
    try { localStorage.setItem(LB_STORAGE_KEY, JSON.stringify(lb)); } catch {}
}

/** Record a completed game score for `playerName`. Returns updated leaderboard. */
function recordScore(playerName, totalScore) {
    const lb    = loadLeaderboard();
    const today = new Date().toLocaleDateString("en-NZ");
    const key   = playerName.trim().toLowerCase();
    let entry   = lb.find(e => e.name.trim().toLowerCase() === key);
    if (entry) {
        entry.plays    = (entry.plays || 0) + 1;
        entry.best     = Math.max(entry.best || 0, totalScore);
        entry.lastDate = today;
    } else {
        lb.push({ name: playerName.trim() || "Toa", best: totalScore, plays: 1, lastDate: today });
    }
    saveLeaderboard(lb);
    // Remember who played last so we can pre-fill next time
    try { localStorage.setItem(LB_LAST_PLAYER_KEY, playerName.trim()); } catch {}
    return lb;
}

/** Compatibility shim used in showGameComplete */
function recordGameScore(totalScore) {
    return recordScore(currentPlayerName || "Toa", totalScore);
}

// ─── Player badge — persistent corner widget, replaces modal ─────────────────
function initPlayerBadge() {
    const badge       = document.getElementById("player-badge");
    if (!badge) return;

    const trigger     = document.getElementById("pb-trigger");
    const avatarEl    = document.getElementById("pb-avatar");
    const nameEl      = document.getElementById("pb-name");
    const popover     = document.getElementById("pb-popover");
    const input       = document.getElementById("player-name-input");
    const suggestList = document.getElementById("player-name-suggestions");
    const confirmBtn  = document.getElementById("pb-confirm");

    // ── Sync badge display to a name ─────────────────────────────────────────
    function updateBadge(name) {
        if (name) {
            badge.classList.remove("player-badge--new");
            badge.classList.add("player-badge--set");
            avatarEl.textContent = name.charAt(0).toUpperCase();
            nameEl.textContent   = name;
            // Hide callout once name is set
            const callout = document.getElementById("pb-callout");
            if (callout) callout.remove();
        } else {
            badge.classList.add("player-badge--new");
            badge.classList.remove("player-badge--set");
            avatarEl.textContent = "?";
            nameEl.textContent   = "Add your name";
            // Inject callout bubble if not already there
            if (!document.getElementById("pb-callout")) {
                const callout = document.createElement("div");
                callout.id = "pb-callout";
                callout.className = "pb-callout";
                callout.innerHTML = `<span>👆 Tap here to add your name first!</span>`;
                badge.appendChild(callout);
            }
        }
    }

    // Initialise from storage immediately — no modal needed
    const saved = (() => { try { return localStorage.getItem(LB_LAST_PLAYER_KEY) || ""; } catch { return ""; } })();
    currentPlayerName = saved;
    updateBadge(saved);

    // Ensure existing saved name appears in leaderboard (for autocomplete)
    if (saved) {
        const lb  = loadLeaderboard();
        const key = saved.toLowerCase();
        if (!lb.find(e => e.name.trim().toLowerCase() === key)) {
            lb.push({ name: saved, best: 0, plays: 0, lastDate: new Date().toLocaleDateString("en-NZ") });
            saveLeaderboard(lb);
        }
    }

    // ── Popover open / close ──────────────────────────────────────────────────
    let popoverOpen = false;

    function openPopover() {
        popoverOpen = true;
        popover.classList.remove("hidden");
        trigger.setAttribute("aria-expanded", "true");
        // Clear input so user sees all known players immediately
        input.value = "";
        setTimeout(() => {
            input.focus();
            _pbShowSuggestions(""); // show all known players right away
        }, 60);
    }

    function closePopover() {
        popoverOpen = false;
        popover.classList.add("hidden");
        trigger.setAttribute("aria-expanded", "false");
        _pbHideSuggestions();
    }

    trigger.addEventListener("click", () => popoverOpen ? closePopover() : openPopover());

    // Close on outside click
    document.addEventListener("pointerdown", (e) => {
        if (popoverOpen && !badge.contains(e.target)) closePopover();
    });

    // ── Autocomplete ──────────────────────────────────────────────────────────
    let _pbActiveIdx = -1;

    function _pbHideSuggestions() {
        suggestList.classList.add("hidden");
        suggestList.innerHTML = "";
        _pbActiveIdx = -1;
    }

    function _pbShowSuggestions(query) {
        const lb = loadLeaderboard();
        const q  = query.trim().toLowerCase();
        const matches = lb
            .filter(e => !q || e.name.toLowerCase().includes(q))
            .sort((a, b) => (b.lastDate || "").localeCompare(a.lastDate || "") || b.best - a.best)
            .slice(0, 6);

        if (!matches.length) { _pbHideSuggestions(); return; }

        suggestList.innerHTML = matches.map((e, i) => {
            const wt = getWarriorTitle(e.best);
            return `<li role="option" data-name="${e.name}" data-idx="${i}">
                <span class="ns-avatar">${e.name.charAt(0).toUpperCase()}</span>
                <span class="ns-name">${e.name}</span>
                <span class="ns-score">${wt.title} · ${e.best} pts</span>
            </li>`;
        }).join("");
        suggestList.classList.remove("hidden");
        _pbActiveIdx = -1;

        suggestList.querySelectorAll("li").forEach(li => {
            li.addEventListener("pointerdown", (ev) => {
                ev.preventDefault();
                _pbConfirm(li.dataset.name);
            });
        });
    }

    function _pbHighlight(idx) {
        const items = suggestList.querySelectorAll("li");
        items.forEach((li, i) => li.classList.toggle("ns-active", i === idx));
        if (items[idx]) input.value = items[idx].dataset.name;
    }

    input.addEventListener("input",  () => _pbShowSuggestions(input.value));
    input.addEventListener("focus",  () => _pbShowSuggestions(input.value));
    input.addEventListener("keydown", (e) => {
        const items = suggestList.querySelectorAll("li");
        if (e.key === "ArrowDown") {
            e.preventDefault();
            _pbActiveIdx = Math.min(_pbActiveIdx + 1, items.length - 1);
            _pbHighlight(_pbActiveIdx);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            _pbActiveIdx = Math.max(_pbActiveIdx - 1, -1);
            if (_pbActiveIdx === -1) input.value = currentPlayerName;
            else _pbHighlight(_pbActiveIdx);
        } else if (e.key === "Enter") {
            e.preventDefault();
            _pbConfirm(input.value);
        } else if (e.key === "Escape") {
            closePopover();
        }
    });

    confirmBtn.addEventListener("click", () => _pbConfirm(input.value));

    // ── Confirm selection ─────────────────────────────────────────────────────
    function _pbConfirm(name) {
        const trimmed = name.trim();
        if (!trimmed) return;          // don't confirm an empty name
        currentPlayerName = trimmed;
        try { localStorage.setItem(LB_LAST_PLAYER_KEY, trimmed); } catch {}

        // Register in leaderboard immediately so autocomplete works next time
        const lb  = loadLeaderboard();
        const key = trimmed.toLowerCase();
        if (!lb.find(e => e.name.trim().toLowerCase() === key)) {
            lb.push({ name: trimmed, best: 0, plays: 0, lastDate: new Date().toLocaleDateString("en-NZ") });
            saveLeaderboard(lb);
        }

        updateBadge(trimmed);
        closePopover();
        _refreshStartBtn();           // re-evaluate start button now that name is set
    }
}

function showPlayerBadge() {
    const badge = document.getElementById("player-badge");
    if (badge) badge.classList.remove("hidden");
}

function hidePlayerBadge() {
    const badge = document.getElementById("player-badge");
    if (badge) { badge.classList.add("hidden"); document.getElementById("pb-popover")?.classList.add("hidden"); }
}

// No-op shim — badge replaces the modal; kept so nothing else breaks
function showNameSetup(onDone) { onDone(); }

// ─── Fireworks ceremony ───────────────────────────────────────────────────────
const fwCanvas  = document.getElementById("fireworks-canvas");
const fwCtx     = fwCanvas ? fwCanvas.getContext("2d") : null;
let   _fwRaf    = null;
let   _fwShells = [];

const FW_COLORS = [
    "#ffd166", "#06d6a0", "#48cae4", "#ef476f",
    "#fb8500", "#a8dadc", "#e9c46a", "#90e0ef"
];

function _fwResize() {
    if (!fwCanvas) return;
    fwCanvas.width  = window.innerWidth;
    fwCanvas.height = window.innerHeight;
}

/** One firework shell: explodes at (x, y) with `color` into `count` sparks. */
function _fwBurst(x, y, color, count = 55) {
    const sparks = [];
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const spd   = 3.5 + Math.random() * 5.5;
        sparks.push({
            x, y,
            vx:   Math.cos(angle) * spd,
            vy:   Math.sin(angle) * spd - 1.5,
            life: 1.0,
            decay: 0.016 + Math.random() * 0.012,
            size:  2 + Math.random() * 2,
            trail: [],
        });
    }
    _fwShells.push({ sparks, color });
}

function _fwLaunchWave(w, h) {
    const count = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const x = w * (0.15 + Math.random() * 0.70);
            const y = h * (0.10 + Math.random() * 0.50);
            _fwBurst(x, y, FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)]);
        }, i * 140);
    }
}

function _fwTick() {
    if (!fwCtx || !fwCanvas) return;
    const w = fwCanvas.width, h = fwCanvas.height;

    // Fade trail instead of clear for comet effect
    fwCtx.fillStyle = "rgba(2, 10, 22, 0.18)";
    fwCtx.fillRect(0, 0, w, h);

    for (const shell of _fwShells) {
        fwCtx.save();
        fwCtx.globalCompositeOperation = "lighter";
        for (const s of shell.sparks) {
            if (s.life <= 0) continue;
            // Trail: last 3 positions
            s.trail.push({ x: s.x, y: s.y });
            if (s.trail.length > 4) s.trail.shift();

            // Draw trail line
            if (s.trail.length >= 2) {
                fwCtx.beginPath();
                fwCtx.strokeStyle = shell.color;
                fwCtx.globalAlpha = s.life * 0.35;
                fwCtx.lineWidth   = s.size * 0.6;
                fwCtx.moveTo(s.trail[0].x, s.trail[0].y);
                for (let t = 1; t < s.trail.length; t++) {
                    fwCtx.lineTo(s.trail[t].x, s.trail[t].y);
                }
                fwCtx.stroke();
            }

            // Spark head
            fwCtx.beginPath();
            fwCtx.globalAlpha = s.life;
            fwCtx.fillStyle   = shell.color;
            fwCtx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
            fwCtx.fill();

            // Physics
            s.x    += s.vx;
            s.y    += s.vy;
            s.vy   += 0.12;     // gravity
            s.vx   *= 0.97;     // air drag
            s.life -= s.decay;
        }
        fwCtx.restore();
    }

    // Remove dead shells
    _fwShells = _fwShells.filter(sh => sh.sparks.some(s => s.life > 0));
    _fwRaf = requestAnimationFrame(_fwTick);
}

function startFireworks(durationMs = 5500) {
    if (!fwCanvas || !fwCtx) return;
    _fwResize();
    fwCanvas.classList.remove("hidden");
    _fwShells = [];

    const w = fwCanvas.width, h = fwCanvas.height;

    // 3 waves of bursts, 900 ms apart (fits inside the 3 s window)
    const waveCount = 3;
    for (let wave = 0; wave < waveCount; wave++) {
        setTimeout(() => _fwLaunchWave(w, h), wave * 900);
    }

    _fwRaf = requestAnimationFrame(_fwTick);

    // Auto-stop after duration
    setTimeout(stopFireworks, durationMs);
}

function stopFireworks() {
    if (_fwRaf) { cancelAnimationFrame(_fwRaf); _fwRaf = null; }
    _fwShells = [];
    if (fwCanvas) fwCanvas.classList.add("hidden");
    if (fwCtx && fwCanvas) fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);
}

/** Fanfare: more elaborate than playStageCompleteSound */
function playVictoryFanfare() {
    const ctx2  = audioCtx();
    const now   = ctx2.currentTime;
    // Rising arpegio + chord swell
    const melody = [523, 659, 784, 1047, 1319, 1047, 1319, 1568];
    melody.forEach((freq, i) =>
        playTone(freq, "sine", 0.45, i < 5 ? 0.22 : 0.30, now + i * 0.10)
    );
    // Low bass note under it
    playTone(131, "triangle", 1.2, 0.18, now + 0.5);
    // Shimmer: high triangle chord
    [2093, 2637].forEach((f, i) =>
        playTone(f, "triangle", 0.6, 0.10, now + 0.6 + i * 0.08)
    );
}

// ─────────────────────────────────────────────────────────────────────────────

function showGameComplete() {
    hideGripHintBar();
    hideCameraBadge();
    hidePauseBtn();
    hideInstructionBar();
    hideEmptyState();
    stopAmbience();
    playVictoryFanfare();
    startFireworks(3000);

    // Record score into shared leaderboard; get fresh data
    const lb         = recordGameScore(gameState.totalScore);
    const myKey      = (currentPlayerName || "Toa").trim().toLowerCase();
    const myEntry    = lb.find(e => e.name.trim().toLowerCase() === myKey);
    const myBest     = myEntry ? myEntry.best : gameState.totalScore;
    const isNewBest  = gameState.totalScore >= myBest;

    // Warrior badge
    const wt = getWarriorTitle(myBest);
    const nameEl  = document.getElementById("gc-warrior-name");
    const titleEl = document.getElementById("gc-warrior-title");
    if (nameEl)  nameEl.textContent  = currentPlayerName || "Toa";
    if (titleEl) titleEl.textContent = `${wt.title} — ${wt.subtitle}`;

    // Scores
    totalScoreEl.textContent = gameState.totalScore;
    const bestEl = document.getElementById("gc-personal-best");
    if (bestEl) bestEl.textContent = myBest;

    const newBestEl = document.getElementById("gc-new-best");
    if (newBestEl) newBestEl.classList.toggle("hidden", !isNewBest);

    // All-players leaderboard — top 5 by best score, current player highlighted
    const lbEl = document.getElementById("gc-lb-list");
    if (lbEl) {
        const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
        const top5   = [...lb].sort((a, b) => b.best - a.best).slice(0, 5);
        lbEl.innerHTML = top5.map((e, i) => {
            const isCurrent = e.name.trim().toLowerCase() === myKey;
            const isDefault = isCurrent && !currentPlayerName;
            const displayName = isDefault
                ? `Toa <span class="gc-lb-default-tag">default</span>`
                : e.name;
            return `<li class="gc-lb-row${isCurrent ? " gc-lb-row--current" : ""}">
                <span class="gc-lb-rank">${medals[i] ?? (i + 1)}</span>
                <span class="gc-lb-name">${displayName}</span>
                <span class="gc-lb-score">${e.best}</span>
            </li>`;
        }).join("");

        // Remind anonymous player to add their name
        if (!currentPlayerName) {
            const hint = document.createElement("p");
            hint.className = "gc-lb-name-hint";
            hint.textContent = "Playing as \"Toa\" (default) — tap the badge (top-right) on the home screen to add your name!";
            lbEl.after(hint);
        } else {
            document.querySelector(".gc-lb-name-hint")?.remove();
        }
    }

    gameCompleteScreen.style.backgroundImage = "url('img/story-card/5-Win.png')";
    gameCompleteScreen.style.backgroundSize  = "cover";
    gameCompleteScreen.style.backgroundPosition = "center";
    gameCompleteScreen.classList.remove("hidden");
    showPlayerBadge();
}

function endGame() {
    gameState.isPlaying = false;
    gameState.isPaused  = false;
    cancelSpawnTimer();
    hideGripHintBar();
    hideCameraBadge();
    hidePauseBtn();
    hideInstructionBar();
    hideEmptyState();
    stopAmbience();
    playGameOverSound();
    // Remember which stage the player failed on so retryCurrentStage can resume there
    gameState.failedStageIndex = gameState.currentStage;
    reachedStageEl.textContent = gameState.currentStage + 1;
    finalScoreEl.textContent = gameState.totalScore + gameState.stageScore;
    gameOverScreen.classList.remove("hidden");
    showPlayerBadge();
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

            // ── Transition to death animation ────────────────────────────────
            monster.alive = false;
            monster.dying = true;
            monster.deathAge = 0;
            monster.deathSpinV = (Math.random() > 0.5 ? 1 : -1) * (0.06 + Math.random() * 0.08);
            monster.hitVibe = 1;
            monster.nearHitCooldownFrames = 0;

            gameState.combo++;
            const comboTier = Math.floor(gameState.combo / 5);
            const config = STAGE_CONFIGS[gameState.currentStage];

            // ── #40 速击奖励: monster still rising (vy < 0) → 2× points ─────
            const earlyStrike = monster.vy < 0;
            const earlyMult   = earlyStrike ? 2 : 1;
            const bonus = 1 + comboTier * (0.12 + config.monsters.levelUpBonus * 0.08);
            const points = Math.round(monster.points * bonus * earlyMult);
            gameState.stageScore += points;

            gameState.killBursts.push(new KillBurst(monster.x, monster.y));
            // ③ Weapon-specific hit particles at the monster's position
            spawnHitParticles(monster.x, monster.y, WEAPONS[gameState.selectedWeaponIndex]);
            const scoreLabel = earlyStrike ? `+${points} ⚡` : `+${points}`;
            gameState.floatTexts.push(new FloatScore(monster.x, monster.y - 42, scoreLabel));

            // ── #35 屏幕震动: stronger at higher combos ──────────────────────
            const shakeStrength = Math.min(18, 5 + gameState.combo * 1.5);
            gameState.screenShake = Math.max(gameState.screenShake, shakeStrength);

            // ── #39 物种专属音效 ────────────────────────────────────────────
            playSpeciesKillSound(monster.monsterTypeIndex);
            playHitSound(comboTier);
            gameState.weaponHitFlash = 9;

            // ── #36 道具掉落: rare drop (20 % chance — boss always drops star) ──
            const dropRoll = Math.random();
            if (monster.isBoss || dropRoll < 0.10) {
                gameState.powerUps.push(new PowerUp(monster.x, monster.y, "star"));
            } else if (dropRoll < 0.20) {
                gameState.powerUps.push(new PowerUp(monster.x, monster.y, "heart"));
            }

            // ── #37 连锁闪电: combo≥5 → zap nearest alive monster ───────────
            if (gameState.combo >= 5) {
                let nearest = null;
                let bestD2  = Infinity;
                for (const m2 of gameState.monsters) {
                    if (!m2.alive || m2 === monster) continue;
                    const d2 = (m2.x - monster.x) ** 2 + (m2.y - monster.y) ** 2;
                    if (d2 < bestD2) { bestD2 = d2; nearest = m2; }
                }
                if (nearest && bestD2 < (gameW * 0.65) ** 2) {
                    gameState.lightningArcs.push(
                        new LightningArc(monster.x, monster.y, nearest.x, nearest.y)
                    );
                    // Chain kill: same dying treatment, no extra combo/score
                    nearest.alive = false;
                    nearest.dying = true;
                    nearest.deathAge = 0;
                    nearest.deathSpinV = (Math.random() > 0.5 ? 1 : -1) * 0.1;
                    gameState.killBursts.push(new KillBurst(nearest.x, nearest.y));
                    playChainLightningSound();
                }
            }

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

            // ── #41 波次清空奖励: track per-wave kills ───────────────────────
            gameState.waveKillCount++;
            checkWaveClear();
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
 * Blade-tip hit detection (weapon mode only).
 * Computes the world position of the blade tip from the current weapon pose,
 * then samples hits along the path from the previous tip position.
 * Runs independently of palm-hit detection so the blade tip can register
 * kills even when the hand itself doesn't intersect the monster.
 *
 * @param {object|null} pose  - current weaponPoseSmooth entry (left or right)
 * @param {Array}  tipHistory - persistent array of recent tip positions (shared across frames)
 */
function processBladeTipHits(pose, tipHistory) {
    const wcfg = WEAPONS[gameState.selectedWeaponIndex];
    if (!pose || !wcfg || wcfg.noWeapon) { tipHistory.length = 0; return; }

    const img = loadedWeapons[gameState.selectedWeaponIndex];
    if (!img) return;

    // Blade length in world pixels: anchorY × displayed height
    const bw  = weaponDisplayWidthPx(pose.armLen || 200) * wcfg.scale;
    const bh  = ((img.naturalHeight || img.height) / (img.naturalWidth || img.width)) * bw;
    const ay  = wcfg.anchorY * bh;

    // Blade direction: totalAngle (forearm angle + weapon offset, ignoring small tilt)
    const totalAngle = pose.angle + wcfg.angleOffset;
    const tipX = pose.wx + ay * Math.sin(totalAngle);
    const tipY = pose.wy - ay * Math.cos(totalAngle);

    tipHistory.push({ x: tipX, y: tipY });
    if (tipHistory.length > 3) tipHistory.shift();

    if (tipHistory.length >= 2) {
        const prev = tipHistory[tipHistory.length - 2];
        const curr = tipHistory[tipHistory.length - 1];
        const dist = Math.hypot(curr.x - prev.x, curr.y - prev.y);
        // Only register hits on meaningful movement (half MIN_SLASH_LEN)
        if (dist >= MIN_SLASH_LEN * 0.5) {
            sampleHitsAlongLine(prev.x, prev.y, curr.x, curr.y);
        }
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
        const along = armLen * 0.38;   // wrist → palm centre (~38% of forearm)
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
    // loadedWeapons now stores HTMLCanvasElement (after white-background strip),
    // so check .width/.height instead of .complete/.naturalWidth
    if (!img || !img.width || !img.height) return;
    // Provide naturalWidth/Height aliases so the rest of the function still works
    if (img.naturalWidth === undefined) img.naturalWidth = img.width;
    if (img.naturalHeight === undefined) img.naturalHeight = img.height;

    _gleamTick     = (_gleamTick + 1) % 200;
    _weaponIdleTick++;

    const weaponColor = wcfg.color || "#90e0ef";

    const drawOne = (pose, flip) => {
        if (!pose) return;
        const { wx: rawWx, wy: rawWy, angle, armLen, vx, vy } = pose;
        const sp = Math.hypot(vx || 0, vy || 0);

        let bw = weaponDisplayWidthPx(armLen || 200) * wcfg.scale;
        const cw = gameW || 800;
        bw = Math.min(bw, Math.min(480, cw * 0.46));
        const bh = (img.naturalHeight / img.naturalWidth) * bw;
        const tilt = weaponBladeTiltAdditive(wcfg, pose, flip);
        const totalAngle = angle + wcfg.angleOffset + tilt;
        const ax = wcfg.anchorX * bw;
        const ay = wcfg.anchorY * bh;

        // ── #1 Idle float ─────────────────────────────────────────────
        const idleAmp  = Math.max(0, 1 - sp / 18) * 2.4;
        const floatOff = Math.sin(_weaponIdleTick * 0.048) * idleAmp;
        const wx = rawWx + Math.cos(totalAngle + Math.PI / 2) * floatOff;
        const wy = rawWy + Math.sin(totalAngle + Math.PI / 2) * floatOff;

        // ── ④ Rotation inertia: displayAngle lags behind totalAngle ───
        // Gives the weapon "physical weight" — direction changes arrive
        // slightly late, as if the blade is resisting the change.
        if (pose.displayAngle === undefined) {
            pose.displayAngle = totalAngle;
        } else {
            const diff = unwrapAngleDiff(totalAngle, pose.displayAngle);
            pose.displayAngle += diff * 0.22;   // 22% catchup per rAF frame
        }
        const renderAngle = pose.displayAngle;

        // ── ① Blade-tip trail ─────────────────────────────────────────
        // Connects the BLADE TIP positions across the last few frames so
        // the trail arc reflects the actual cutting edge, not the wrist.
        // Tip world coords: (wx + ay*sin(weaponAngle), wy − ay*cos(weaponAngle))
        const trail = pose.trail || [];
        const bladeTip = (tp) => ({
            x: tp.wx + ay * Math.sin(tp.angle + wcfg.angleOffset),
            y: tp.wy - ay * Math.cos(tp.angle + wcfg.angleOffset)
        });
        if (trail.length >= 2) {
            const curTip = { x: wx + ay * Math.sin(renderAngle), y: wy - ay * Math.cos(renderAngle) };
            const pts    = [curTip, ...trail.map(bladeTip)];
            ctx2.save();
            ctx2.globalCompositeOperation = "lighter";
            ctx2.lineCap  = "round";
            ctx2.lineJoin = "round";
            for (let ti = 0; ti < pts.length - 1; ti++) {
                const alpha = 0.32 - ti * 0.07;
                if (alpha <= 0) break;
                const p0 = pts[ti], p1 = pts[ti + 1];
                const lw = Math.max(2, (12 - ti * 2.5) * (bw / 220));
                ctx2.beginPath();
                ctx2.strokeStyle = weaponColor;
                ctx2.lineWidth   = lw;
                ctx2.globalAlpha = alpha;
                ctx2.moveTo(p0.x, p0.y);
                ctx2.lineTo(p1.x, p1.y);
                ctx2.stroke();
            }
            ctx2.restore();
        }

        // ── Speed-scale ────────────────────────────────────────────────
        const speedBoost = 1 + Math.min(sp / 260, 0.10);
        const dbw = bw * speedBoost, dbh = bh * speedBoost;
        const dax = ax * speedBoost, day = ay * speedBoost;

        ctx2.save();
        ctx2.translate(wx, wy);
        ctx2.rotate(renderAngle);          // ← use inertia angle for rendering
        if (flip) ctx2.scale(-1, 1);

        // ── ② Speed-responsive energy halo ────────────────────────────
        // Halo grows and brightens with movement speed, giving visual
        // feedback proportional to how hard the player is swinging.
        const speedFactor  = Math.min(sp / 75, 1.0);
        const haloAlpha    = 0.06 + speedFactor * 0.13;   // 0.06 still → 0.19 fast
        const haloRadMult  = 0.75 + speedFactor * 0.55;   // 0.75x still → 1.30x fast
        ctx2.save();
        ctx2.globalCompositeOperation = "lighter";
        ctx2.fillStyle   = weaponColor;
        ctx2.globalAlpha = haloAlpha;
        ctx2.beginPath();
        ctx2.ellipse(-dax + dbw * 0.52, -day + dbh * 0.42,
                     dbw * 0.44 * haloRadMult, dbh * 0.13 * haloRadMult,
                     0, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.globalAlpha = haloAlpha * 0.6;
        ctx2.beginPath();
        ctx2.ellipse(-dax + dbw * 0.52, -day + dbh * 0.42,
                     dbw * 0.28 * haloRadMult, dbh * 0.08 * haloRadMult,
                     0, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.restore();

        // Main weapon image — NO shadowBlur on drawImage: canvas shadows use the
        // bounding box (not PNG alpha) and produce a visible white rectangle.
        // Depth is handled by the energy halo and trail instead.
        ctx2.drawImage(img, -dax, -day, dbw, dbh);

        // ── Periodic blade gleam ───────────────────────────────────────
        // IMPORTANT: gradient must be purely horizontal (same y at start and end).
        // A diagonal gradient causes ALL four corners of the fillRect to fall
        // inside non-zero alpha regions, lighting up the whole bounding box as
        // a visible white rectangle. Horizontal gradient: alpha=0 outside the
        // sweep band, so only a vertical stripe is brightened.
        const gPhase = _gleamTick / 200;
        if (gPhase < 0.22) {
            const gp     = gPhase / 0.22;
            const gAlpha = Math.sin(gp * Math.PI) * 0.38;
            const sweepX = -dax + dbw * gp;
            const halfW  = dbw * 0.22;
            // Horizontal-only gradient: y is identical at both endpoints
            const grad   = ctx2.createLinearGradient(sweepX - halfW, 0, sweepX + halfW, 0);
            grad.addColorStop(0,   `rgba(255,255,255,0)`);
            grad.addColorStop(0.5, `rgba(255,255,255,${gAlpha})`);
            grad.addColorStop(1,   `rgba(255,255,255,0)`);
            ctx2.globalCompositeOperation = "lighter";
            ctx2.fillStyle = grad;
            ctx2.fillRect(-dax, -day, dbw, dbh * 0.62);
            ctx2.globalCompositeOperation = "source-over";
        }

        // ── #2 Hit flash + expanding burst ring ────────────────────────
        if (gameState.weaponHitFlash > 0) {
            const t2 = gameState.weaponHitFlash / 9;  // 1→0
            ctx2.globalCompositeOperation = "lighter";
            ctx2.globalAlpha = t2 * 0.72;
            ctx2.drawImage(img, -dax, -day, dbw, dbh);
            ctx2.globalCompositeOperation = "source-over";
            ctx2.globalAlpha = 1;
            // Expanding color ring
            const ringR = (1 - t2) * dbw * 0.95;
            ctx2.save();
            ctx2.globalAlpha  = t2 * 0.75;
            ctx2.strokeStyle  = weaponColor;
            ctx2.lineWidth    = 3 + 5 * t2;
            ctx2.shadowColor  = weaponColor;
            ctx2.shadowBlur   = 18;
            ctx2.beginPath();
            ctx2.arc(-dax + dbw * 0.45, -day + dbh * 0.38, ringR, 0, Math.PI * 2);
            ctx2.stroke();
            ctx2.restore();
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
        // Model is warm — camera check moves to "searching for body" phase
        setCameraCheckStatus("searching");
    }

    // ── Camera check: detect if the player is well-positioned ────────
    if (!_cameraCheckBodyFound && results.poseLandmarks) {
        const lm = results.poseLandmarks;
        const ls = lm[11]; // left shoulder
        const rs = lm[12]; // right shoulder
        const lw = lm[15]; // left wrist
        const rw = lm[16]; // right wrist
        const bothShoulders = ls && rs && ls.visibility > 0.5 && rs.visibility > 0.5;
        // Require BOTH wrists to be visible AND raised above the shoulder line
        // (In MediaPipe normalised coords, y decreases upward — wrist.y < shoulder.y means arm is raised)
        const lRaised = lw && ls && lw.visibility > 0.4 && lw.y < ls.y - 0.02;
        const rRaised = rw && rs && rw.visibility > 0.4 && rw.y < rs.y - 0.02;
        if (bothShoulders && lRaised && rRaised) {
            _cameraCheckBodyFound = true;
            setCameraCheckStatus("found");
            if (ccContinueBtn) {
                ccContinueBtn.disabled  = false;
                ccContinueBtn.style.opacity = "";
            }
        }
    }
    // ─────────────────────────────────────────────────────────────────

    drawVirtualBackground(results);

    // In low-perf mode skip landmark processing on every other frame —
    // background + video composite still runs so the feed doesn't freeze.
    _onResultsOdd = !_onResultsOdd;
    if (_lowPerfMode && _onResultsOdd) return;

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
    const leftElbow  = landmarks[13];
    const leftWrist  = landmarks[15];
    const rightElbow = landmarks[14];
    const rightWrist = landmarks[16];

    /**
     * Compute palm centre: offset from wrist toward fingertips
     * by ~38% of the forearm length (elbow→wrist), matching
     * the weapon display anchor in updateWeaponHandPose.
     */
    const PALM_OFFSET = 0.38;
    const palmCenter = (elbow, wrist) => {
        const ex = (1 - elbow.x) * gameW,  ey = elbow.y * gameH;
        const wx = (1 - wrist.x) * gameW,  wy = wrist.y * gameH;
        const dx = wx - ex, dy = wy - ey;
        const len = Math.hypot(dx, dy) || 1;
        return {
            x: wx + (dx / len) * len * PALM_OFFSET,
            y: wy + (dy / len) * len * PALM_OFFSET
        };
    };

    if (landmarkVisible(leftWrist) && landmarkVisible(leftElbow)) {
        const { x: lx, y: ly } = palmCenter(leftElbow, leftWrist);
        processWristSlash(gameState.leftWristHistory, lx, ly, 195, gameState.leftWristSmooth, gameState.leftTrail);
        processBladeTipHits(gameState.weaponPoseSmooth.left,  gameState.leftBladeTipHistory);
    } else {
        gameState.leftWristHistory = [];
        gameState.leftWristSmooth = { x: null, y: null };
        gameState.leftBladeTipHistory = [];
        // trail fades naturally via tick()
    }

    if (landmarkVisible(rightWrist) && landmarkVisible(rightElbow)) {
        const { x: rx, y: ry } = palmCenter(rightElbow, rightWrist);
        processWristSlash(gameState.rightWristHistory, rx, ry, 28, gameState.rightWristSmooth, gameState.rightTrail);
        processBladeTipHits(gameState.weaponPoseSmooth.right, gameState.rightBladeTipHistory);
    } else {
        gameState.rightWristHistory = [];
        gameState.rightWristSmooth = { x: null, y: null };
        gameState.rightBladeTipHistory = [];
    }
}

function gameLoop(now) {
    if (!gameState.isPlaying) return;
    // Keep rAF chain alive while paused, but skip all updates/draws
    if (gameState.isPaused) {
        requestAnimationFrame(gameLoop);
        return;
    }

    _perfTrackFrame(now);

    // ── Hard caps: trim particle arrays to avoid GPU overload ─────────────
    if (gameState.hitParticles.length > MAX_HIT_PARTICLES) {
        gameState.hitParticles.splice(0, gameState.hitParticles.length - MAX_HIT_PARTICLES);
    }
    if (gameState.swingSparkles.length > MAX_SWING_SPARKLES) {
        gameState.swingSparkles.splice(0, gameState.swingSparkles.length - MAX_SWING_SPARKLES);
    }

    ctx.clearRect(0, 0, gameW, gameH);

    // ── Screen shake ──────────────────────────────────────────────────────────
    let shakeApplied = false;
    if (gameState.screenShake > 0.5) {
        const sx = (Math.random() - 0.5) * gameState.screenShake * 2;
        const sy = (Math.random() - 0.5) * gameState.screenShake * 2;
        ctx.save();
        ctx.translate(sx, sy);
        shakeApplied = true;
        gameState.screenShake = Math.max(0, gameState.screenShake - 1.8);
    } else {
        gameState.screenShake = 0;
    }

    // ── Monsters (alive + dying) ───────────────────────────────────────────
    gameState.monsters = gameState.monsters.filter((monster) => {
        if (monster.dying) {
            const still = monster.updateDeath();
            monster.draw(ctx);
            return still;
        }
        if (!monster.alive) return false;
        const onScreen = monster.update();
        if (onScreen) monster.draw(ctx);
        return onScreen;
    });

    // Show empty-state hint between waves when no monsters are visible
    if (emptyStateEl) {
        const hasVisible = gameState.monsters.some(m => m.alive || m.dying);
        emptyStateEl.classList.toggle("hidden", hasVisible);
    }

    gameState.leftTrail.tick();
    gameState.rightTrail.tick();
    gameState.leftTrail.draw(ctx);
    gameState.rightTrail.draw(ctx);

    // ── Power-up collectibles ──────────────────────────────────────────────
    gameState.powerUps = gameState.powerUps.filter((pu) => {
        const alive = pu.update();
        if (alive) pu.draw(ctx);
        return alive;
    });

    // ── Chain-lightning arcs ───────────────────────────────────────────────
    gameState.lightningArcs = gameState.lightningArcs.filter((arc) => {
        const alive = arc.update();
        if (alive) arc.draw(ctx);
        return alive;
    });

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

    // ── ③ Weapon hit particles ─────────────────────────────────────────────
    gameState.hitParticles = gameState.hitParticles.filter((p) => {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.28;   // gravity
        p.vx *= 0.95;   // air drag
        p.life -= p.decay;
        return p.life > 0;
    });
    if (gameState.hitParticles.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (const p of gameState.hitParticles) {
            ctx.globalAlpha = p.life * 0.9;
            ctx.fillStyle   = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * Math.max(0.2, p.life), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    gameState.swingSparkles = gameState.swingSparkles.filter((s) => {
        const alive = s.update();
        if (alive) s.draw(ctx);
        return alive;
    });

    if (shakeApplied) ctx.restore();

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
    gameState.powerUps = [];
    gameState.lightningArcs = [];
    gameState.screenShake = 0;
    gameState.waveId = 0;
    gameState.waveKillCount = 0;
    gameState.waveMissCount = 0;
    gameState.waveTotal = 0;
    gameState.leftWristHistory = [];
    gameState.rightWristHistory = [];
    gameState.leftBladeTipHistory  = [];
    gameState.rightBladeTipHistory = [];
    gameState.hitParticles = [];
    gameState.leftWristSmooth = { x: null, y: null };
    gameState.rightWristSmooth = { x: null, y: null };
    gameState.weaponPoseSmooth = { left: null, right: null };

    setBackground(config.background);
    _prevLivesForUI = -1;  // reset so first updateUI of new stage skips gain-animation
    updateUI();
}

function launchStageOverview() {
    showStageOverview(0, () => {
        showStoryCard(gameState.currentStage, () => {
            gameState.isPlaying = true;
            // Ambience already started inside showStoryCard — no need to restart here
            showCameraBadge();
            showPauseBtn();
            showInstructionBar();
            showGripHintBar();
            spawnMonster();
            gameLoop();
        });
    });
}

async function startGame() {
    gameState.totalScore = 0;
    startScreen.classList.add("hidden");
    stageCompleteScreen.classList.add("hidden");
    gameCompleteScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    hidePlayerBadge();
    launchStageOverview();
}

/**
 * Retry from the stage the player just failed on.
 * Scores reset to 0; previously-completed stages show as "done" in the overview.
 */
function retryCurrentStage() {
    const stageToRetry = gameState.failedStageIndex ?? 0;
    gameState.totalScore = 0;
    gameOverScreen.classList.add("hidden");

    showStageOverview(stageToRetry, () => {
        showStoryCard(gameState.currentStage, () => {
            gameState.isPlaying = true;
            // Ambience already started inside showStoryCard — no need to restart here
            showCameraBadge();
            showPauseBtn();
            showInstructionBar();
            showGripHintBar();
            spawnMonster();
            gameLoop();
        });
    });
}

function nextStage() {
    const completedCount = gameState.currentStage + 1;
    stageCompleteScreen.classList.add("hidden");

    showStageOverview(completedCount, () => {
        showStoryCard(gameState.currentStage, () => {
            gameState.isPlaying = true;
            // Ambience already started inside showStoryCard — no need to restart here
            showCameraBadge();
            showPauseBtn();
            showInstructionBar();
            showGripHintBar();
            spawnMonster();
            gameLoop();
        });
    });
}

let _cameraReady = false;

function enableStartAfterCamera() {
    _cameraReady = true;
    _refreshStartBtn();
}

/** Enable the Start button once camera is ready. Name is optional. */
function _refreshStartBtn() {
    const cameraStatusEl = document.getElementById("camera-status");
    if (!_cameraReady) return; // camera not done yet — leave as-is

    startBtn.disabled = false;
    if (cameraStatusEl) {
        cameraStatusEl.textContent = currentPlayerName
            ? "Camera is ready. You can start the game."
            : "Camera is ready. You can start — or add your name (top-right) first!";
    }
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
        // Colour accent applied via CSS custom property
        if (w.color) btn.style.setProperty("--wc-accent", w.color);
        const imgHTML = w.noWeapon
            ? `<div class="wc-img-wrap wc-img-hands" aria-hidden="true">
                   <svg viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg" class="wc-hands-svg">
                       <!-- Palm -->
                       <path d="M18 52 C16 44 16 36 18 28 C18 24 22 22 26 24 L26 18 C26 14 30 12 33 14 C34 10 38 9 41 12 C42 8 46 8 48 12 L48 26 C52 24 56 26 56 32 L56 54 C56 66 48 76 36 78 C24 78 18 68 18 56 Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
                       <!-- Finger dividers -->
                       <line x1="26" y1="24" x2="26" y2="44" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
                       <line x1="33" y1="14" x2="33" y2="44" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
                       <line x1="41" y1="12" x2="41" y2="44" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
                       <line x1="48" y1="12" x2="48" y2="44" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
                   </svg>
               </div>`
            : `<div class="wc-img-wrap" aria-hidden="true">
                   <img src="${w.path}" alt="" class="wc-img" />
               </div>`;
        btn.innerHTML = `
            ${imgHTML}
            <div class="wc-body">
                <span class="wc-maori">${w.maoiLabel || ""}</span>
                <span class="wc-name">${w.label}</span>
                <span class="wc-desc">${w.desc || ""}</span>
            </div>
            <span class="wc-check" aria-hidden="true">✓</span>`;
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
    initCameraCheck(); // start preview loop + failsafe timer

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
    initPlayerBadge();
    showPlayerBadge();

    startBtn.addEventListener("click", startGame);
    nextStageBtn.addEventListener("click", nextStage);
    playAgainBtn.addEventListener("click", () => { stopFireworks(); startGame(); });
    restartBtn.addEventListener("click", retryCurrentStage);
}

init().catch((err) => {
    console.error(err);
    if (loadingOverlay) loadingOverlay.classList.add("hidden");
    // Show error state in camera check screen (stays visible with instructions)
    setCameraCheckStatus("error");
    if (ccContinueBtn) ccContinueBtn.disabled = true;
    const cameraStatusEl = document.getElementById("camera-status");
    if (cameraStatusEl) {
        cameraStatusEl.textContent =
            "Camera unavailable. Allow camera access in browser settings, then refresh.";
    }
    showErrorCard(
        "Could not open camera or load the pose model. Check camera permission and your network connection."
    );
});
