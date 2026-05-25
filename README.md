# 🌊 Toa Moana — Sea Warrior

> *He toa tū māia, he toa tū tūāhu* — A brave warrior stands bold, a blessed warrior stands resolute.

**Toa Moana** is a browser-based movement game designed for kaumātua (Māori elders). Players use their arms — detected live by a webcam — to slash through sea monsters in a 4-stage journey inspired by the legendary voyage of **Kupe** and his battle against **Te Wheke-a-Muturangi**, the great octopus of the deep.

Built for the **Rauawaawa Kaumātua Charitable Trust**, the game supports elder wellbeing through purposeful physical movement, cultural storytelling, and friendly competition — aligned with the **Te Whare Tapa Whā** model of Māori health.

---

## ✨ Features

- **Camera-based arm detection** — MediaPipe Pose tracks wrist landmarks in real time; no controller needed
- **4-stage mythic journey** — Each stage advances Kupe's legendary voyage with a narrated story card
- **8 sea monster species** — Blowfish, Crab, Eel, Electric Fish, Octopus, Starfish, Turtle, and Seahorse, each with unique movement and kill sound
- **Weighted spawning by stage** — Gentle creatures early, fearsome bosses in the deep
- **Combo system** — Chain hits for score multipliers (up to ×8)
- **Mauri (💖) lives display** — Hearts pulse red when lives are low; gain animation on recovery
- **Immersive story cards** — Auto-narrated with a deep Web Speech API voice + 4-layer atmospheric ambient soundscape
- **Weapon trail FX** — Glowing slash trail follows arm movement in real time
- **Culturally grounded UI** — Māori language labels (Mauri, Toa), ocean colour palette

---

## 🏛️ Cultural Alignment — Te Whare Tapa Whā

| Pillar | How Toa Moana Addresses It |
|---|---|
| **Taha Tinana** (physical) | Arm-swing movements = purposeful upper-body exercise |
| **Taha Hinengaro** (mental) | Focused attention, reaction timing, score goals |
| **Taha Wairua** (spiritual) | Māori legend, narrated whakapapa of Kupe's journey |
| **Taha Whānau** (social) | Group sessions at Rauawaawa; shared scores and laughter |

---

## 🌊 The Story: 4 Stages

| Stage | Setting | Narrative Beat | Monster Mix |
|---|---|---|---|
| 1 — **The Call** | Coastal shallows | Kupe hears the sea calling | Blowfish, Starfish, Seahorse, Turtle |
| 2 — **Into the Current** | Open ocean | The shallows yield; something stirs | + Crab, Eel |
| 3 — **Tangaroa's Trial** | The deep sea | Tangaroa watches — show him you are worthy | + Electric Fish, Octopus |
| 4 — **Te Wheke Rises** | The abyss | Te Wheke-a-Muturangi wakes — face what Kupe once defeated | Maximum difficulty |

---

## 🚀 Getting Started

### Requirements

- A modern browser (**Chrome recommended** for best MediaPipe + Speech API support)
- A webcam
- A reasonably well-lit environment

### Run Locally

```bash
git clone https://github.com/your-org/maori-hero-game.git
cd maori-hero-game

# Install dependencies (dev server only)
npm install

# Start local server
npm start
# or use any static server:
npx serve .
# then open http://localhost:3000
```

> **Important:** The game must be served over HTTP/HTTPS — opening `index.html` directly via `file://` will block camera access and MediaPipe WASM loading.

### Controls

| Action | How |
|---|---|
| Slash a monster | Swing your **right or left wrist** through it |
| Pause | Click the **⏸** button (top right during gameplay) |
| Skip story card | Click **Skip** on the narration overlay |
| Restart | After game over → click **Play Again** |

---

## 📁 Project Structure

```
maori-hero-game/
├── index.html          # Game shell, UI overlay, HUD elements
├── style.css           # All visual styling, animations, heart lives display
├── game.js             # Core game loop, MediaPipe integration, monster logic
└── img/
    ├── sea-monster/    # AI-generated monster sprites
    │   ├── blowfish.png
    │   ├── crab.png
    │   ├── eel.png
    │   ├── electric.png
    │   ├── octopus.png
    │   ├── starfish.png
    │   ├── turtle.png
    │   └── seahorse.png
    └── story/          # AI-generated story card backgrounds (per stage)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Game engine | Vanilla **HTML5 Canvas** — no framework |
| Pose detection | **MediaPipe Pose** (BlazePose, WASM) — wrist landmark tracking |
| Ambient audio | **Web Audio API** — oscillators, BiquadFilter, GainNode layers |
| Narration | **Web Speech API** — SpeechSynthesisUtterance, NZ/UK English voice |
| Monster sprites | **AI-generated** PNG images |
| Story backgrounds | **AI-generated** illustrated scenes |
| Deployment | Static HTML — any modern browser with webcam access |

---

## 🎮 Key Technical Mechanics

### Arm Detection

MediaPipe Pose detects 33 body landmarks at ~30 fps. Toa Moana tracks **left wrist** (landmark 15) and **right wrist** (landmark 16). Each frame, wrist velocity is computed; passing through a monster's bounding circle registers a hit.

### Monster Spawning — Parabolic Arc

```js
vy_initial = -launchVy       // species-tuned upward launch speed
vy += gravity each frame     // arc back down
```

Each species has tuned gravity and size multipliers. A **weighted random pool** selects species per stage:

```js
// Stage 1 example pool (id=0):
[[BLOWFISH,5], [STARFISH,5], [SEAHORSE,5], [TURTLE,3], [CRAB,2], [EEL,1]]
// Octopus and Electric Fish are absent from Stage 1
```

### Atmospheric Ambient Audio (Story Cards)

Four Web Audio API layers routed through a master `GainNode` with 1.8 s fade-in:

1. **55 Hz sine drone** — tremolo at 0.06 Hz (oceanic depth)
2. **110 + 165 Hz triangle pad** — perfect fifth, breathing LFO
3. **White noise → LP 100 Hz** — ocean abyss rumble
4. **660 + 880 Hz sine shimmer** — ethereal high shimmer

### Lives Display

Lives render as emoji hearts (`💖` / `🤍`) with CSS animations — pulse on danger (≤2 lives), pop on gain.

---

## 🤝 Acknowledgements

- **Rauawaawa Kaumātua Charitable Trust** — community partner and primary design audience
- **University of Waikato** — MInfoTech programme, COMP570
- Māori legend of **Kupe and Te Wheke-a-Muturangi** — the mythic backbone of this journey
- **MediaPipe** by Google — real-time pose estimation
- AI image generation — sea monster sprites and story card illustrations

---

## 📄 Licence

Created for academic and community wellbeing purposes (University of Waikato, MInfoTech COMP570). Please contact the authors before any commercial use. Māori cultural content is used with deep respect for tikanga Māori.

---

*"Kia kaha, kia maia, kia manawanui"* — Be strong, be brave, be steadfast. 🌊













