# Māori Sea Hunt - Arm Exercise Game

An interactive, culturally responsive arm exercise game that uses computer vision to turn physical movement into gameplay. Swing your arms to defeat sea creatures and protect your people in this immersive fitness experience.

## 🌊 Game Overview

Māori Sea Hunt combines traditional Māori storytelling with modern pose detection technology to create an engaging workout experience. Players use arm movements to wield virtual weapons, defeat sea monsters, and progress through increasingly challenging stages.

The game uses MediaPipe Pose to track arm movements in real-time, translating physical exercise into an exciting gaming experience that builds strength, coordination, and cultural connection.

## ✨ Features

- **Motion-Controlled Gameplay**: Uses your device's camera and MediaPipe Pose detection to track arm movements in real-time
- **5 Progressive Stages**: Each stage increases in difficulty with new challenges and sea creatures
- **Culturally Responsive Design**: Incorporates Māori language, storytelling, and symbolism throughout the game
- **Multiple Weapons**: Choose between traditional Māori weapons including taiaha (staff) and patu (club)
- **Combo System**: Build combos with consecutive hits to maximize your score
- **Safety-First Approach**: Includes clear safety instructions and accessibility features
- **Responsive UI**: Works on both desktop and mobile devices with camera access

## 🎮 How to Play

### Requirements
- A device with a working camera (webcam or mobile camera)
- Modern web browser (Chrome, Firefox, Safari, Edge recommended)
- Clear space to safely move your arms
- Internet connection (to load MediaPipe libraries)

### Gameplay Instructions

1. **Launch the Game**: Open `index.html` in your browser or run `npm start`
2. **Allow Camera Access**: The game needs camera access to track your movements
3. **Choose Your Weapon**: Select from traditional Māori weapons
4. **Follow the Story**: Each stage begins with a story card setting the scene
5. **Swing to Attack**: Move your arms to defeat approaching sea creatures
6. **Progress Through Stages**: Complete each stage's target score to advance
7. **Protect Your People**: Maintain your "Mauri" (lives) by avoiding hits from creatures

### Controls
- **Attack**: Swing your arms with controlled movements
- **Defend**: Hold your arms in a defensive position to block attacks
- **Exit**: Press ESC key to exit gameplay at any time

## 🛡️ Safety Guidelines

- Always ensure you have enough space to move your arms safely
- Start with gentle movements and increase intensity gradually
- Stop immediately if you feel any pain or discomfort
- For seated play, ensure you have proper back support
- Children should play under adult supervision

## 📦 Installation & Setup

### Option 1: Direct Browser Access

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Allow camera access when prompted

### Option 2: Local Server (Recommended)

```bash
# Install dependencies
npm install

# Start local development server
npm start

# Open your browser to http://localhost:3000 (or the port shown)
```

## 🎯 Game Mechanics

### Stages
1. **Relaxed Exploration**: Learn the basics with slow-moving creatures
2. **Steady Growth**: Increase your strength with faster opponents
3. **Focused Challenge**: Test your skills with complex attack patterns
4. **Final Strike**: Face powerful boss creatures
5. **Victory**: Celebrate your success as a protector of the people

### Scoring System
- **Hit Points**: 10-50 points per creature hit, depending on weapon
- **Combo Multiplier**: 1.5x multiplier for 5+ consecutive hits, 2x for 10+
- **Stage Bonuses**: 500 points bonus for completing a stage without losing lives
- **Speed Bonuses**: Additional points for fast, precise movements

### Sea Creatures
- **Crabs**: Fast-moving, low-health creatures
- **Eels**: Slippery opponents that require precise timing
- **Octopuses**: Multi-tentacled creatures with multiple hit points
- **Electric Fish**: Shock-based attacks that can stun your movement
- **Turtles**: Well-armored creatures requiring powerful hits
- **Blowfish**: Inflate to defend themselves against attacks

## 🌐 Technical Details

### Technologies Used
- **HTML5 Canvas**: Game rendering and animation
- **CSS3**: Responsive styling and animations
- **JavaScript (ES6+)**: Game logic and interaction
- **MediaPipe Pose**: Real-time pose detection and tracking
- **Serve**: Local development server

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14.1+
- Edge 90+

### Performance Tips
- Ensure good lighting for optimal pose detection
- Close other camera-using applications before playing
- For best results, play in a well-lit room
- Avoid backlighting that may obscure your silhouette

## 🎨 Cultural Context

Māori Sea Hunt draws inspiration from:
- **Māori Creation Stories**: The sea as a source of life and challenge
- **Kaitiakitanga**: The concept of guardianship and protection
- **Mauri**: The life force that connects all living things
- **Traditional Weapons**: Taiaha, patu, and other Māori fighting arts

All Māori language used in the game is accompanied by context and explanations to promote cultural understanding.

## 🤝 Contributing

We welcome contributions that align with the game's cultural values and educational mission. Please:
1. Respect the cultural integrity of Māori content
2. Follow accessibility best practices
3. Test all motion-based features thoroughly
4. Include safety considerations in all new features

## 📄 License

This project is open source and available under the MIT License. Māori cultural content is used with respect and should be treated with appropriate cultural sensitivity.

## 🙏 Acknowledgments

- Te Whare Wānanga o Awanuiārangi for cultural guidance
- Google MediaPipe for pose detection technology
- All contributors who have helped shape this project

---

*"Kia kaha, kia maia, kia manawanui"* - Be strong, be brave, be steadfast

Let your arms be your strength and your heart be your guide 🌊
