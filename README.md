# Voice Productivity Companion

> **🚀 Built in Just Hours with AI!** VoiceVibe was rapidly prototyped and developed using AI code generation tools, showcasing the power of modern development workflows. The seamless voice recognition is powered by [Deepgram's incredibly easy-to-use STT API](https://deepgram.com) - making sophisticated voice interfaces accessible to any developer.

A beautifully simple and immersive voice-first productivity companion that sits as a translucent bar at the top of your screen. Control your personalized soundscape entirely through voice commands with intelligent Voice Activity Detection that automatically manages music volume during speech.

## ✨ Features

### 🎤 **Smart Voice Activity Detection (VAD)**
- **Automatic Music Ducking**: Music intelligently lowers when you speak, restores when you finish
- **Real-Time Speech Analysis**: Advanced energy-based detection with adaptive thresholding
- **No Manual Muting**: Seamless voice commands without interrupting your workflow
- **Customizable Sensitivity**: Adjust detection threshold and ducking levels via settings
- **Visual Feedback**: Live speech activity indicator with smooth animations

### 🎵 **Intelligent Music System**
- **Global Overlay**: Works on any screen, any app - always accessible with ⌘M
- **Voice-First Interface**: Responds entirely to natural voice commands
- **GPT-Powered Music Search**: Searchs FreeCloud based on natural language music request
- **CC0 Public Domain**: Uses only Creative Commons Zero sounds - completely copyright-free
- **Freesound Integration**: Access to thousands of high-quality public domain sounds
- **Real Audio Playback**: Plays actual music tracks, not synthetic tones
- **Intelligent Caching**: Remembers your preferences for faster responses

### 🛠️ **Technical Excellence**
- **Deepgram Nova-3**: High-quality speech-to-text processing
- **Translucent UI**: Minimal, elegant interface that doesn't interrupt your workflow
- **Multi-Screen Support**: Stays visible across all workspaces and monitors
- **Low Latency**: Optimized for real-time voice processing and audio control
- **Smooth Audio Transitions**: Professional fade-in/fade-out during voice detection

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Microphone access
- **API Keys** (all free):
  - Deepgram API key ([Get one free](https://deepgram.com))
  - OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
  - Freesound API key ([Get one free](https://freesound.org/apiv2/apply/))

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd voice-productivity-companion
   npm install
   ```

2. **Set up your API keys:**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys:
   # DEEPGRAM_API_KEY=your_actual_deepgram_key
   # OPENAI_API_KEY=your_actual_openai_key  
   # FREESOUND_API_KEY=your_actual_freesound_key
   ```

3. **Run the application:**
   ```bash
   npm start
   # or for development with DevTools:
   npm run dev
   ```

## 🔓 Copyright-Free Audio

This application uses **only CC0 (Creative Commons Zero) licensed sounds** from Freesound.org, ensuring:

- **✅ No attribution required** - Completely public domain
- **✅ Commercial use allowed** - No restrictions whatsoever  
- **✅ No copyright concerns** - Safe for any use case
- **✅ No licensing fees** - Completely free forever

All audio content is sourced from Freesound's public domain collection, making this application completely worry-free from a legal perspective. You can use, modify, and distribute the generated audio without any restrictions.

## 🎤 Voice Activity Detection

### How It Works
The system continuously monitors audio input and uses advanced signal processing to detect when you're speaking:

- **Energy Analysis**: Calculates real-time audio energy levels
- **Adaptive Thresholding**: Automatically adjusts to your environment and speaking volume
- **Smoothing Filters**: Uses exponential moving averages to prevent false triggers
- **Minimum Duration**: Requires sustained speech to trigger (prevents noise activation)
- **Silence Detection**: Automatically restores music after speech ends

### Visual Indicators
- **🗣️ Speech Indicator**: Pulses green when speech is detected
- **🎤 Microphone Button**: Shows red dot when actively listening for commands
- **Smooth Transitions**: Music volume fades smoothly during voice activity

### Customizable Settings
Access via the ⚙️ settings button:
- **Detection Sensitivity**: Adjust threshold from 0.001 to 0.1
- **Music Ducking Level**: Set how much music volume reduces (10-100%)
- **Real-time Monitoring**: View current energy levels and speech status

## 🎵 Natural Voice Commands

The system uses GPT to understand any natural language about music. **Music automatically ducks when you speak** - no need to manually mute!

### Music Requests
- *"Make it more ambient and spacey"*
- *"I need something to help me focus"*  
- *"Add some gentle rain sounds"*
- *"Switch to peaceful piano music"*
- *"Make it darker and more mysterious"*
- *"I want something energetic but not too loud"*
- *"Play some dreamy ethereal sounds"*
- *"Give me nature sounds for relaxation"*
- *"Play some rock music"*
- *"Switch to classical piano"*

### Simple Controls
- "Make it more ambient" - Switch to dreamy ambient soundscape
- "Switch to piano" - Gentle piano melodies
- "Focus music" or "Help me focus" - Concentration-friendly sounds
- "Relaxing music" or "Help me relax" - Calming, peaceful audio
- "Play some jazz" - Jazz music selection
- "Add rainfall" - Nature sounds with rain

### Playback Control
- "Louder" or "Turn it up" - Increase volume
- "Quieter" or "Turn it down" - Decrease volume
- "Stop" or "Pause" - Pause music
- "Play" or "Resume" - Resume playback

## ⌨️ Controls & Interface

### Global Shortcuts
- **⌘M** (or Ctrl+M): 
  - First press: Show the music bar
  - Subsequent presses: Activate voice input to request music
- **ESC**: Hide the music bar (stays running in background)

### Interface Elements
- **🎤 Microphone Button**: Click to manually activate voice input (or use ⌘M)
- **⚙️ Settings Button**: Access VAD sensitivity and ducking controls
- **🗣️ Speech Indicator**: Shows when Voice Activity Detection is active
- **Status Text**: Displays current system status and instructions

### Voice Interaction Flow
1. **Continuous Monitoring**: VAD always listens for speech (when mic is active)
2. **Automatic Ducking**: Music volume reduces when you start speaking
3. **Command Processing**: Your voice command is processed by Deepgram + GPT
4. **Music Transition**: New music starts playing, volume restores automatically
5. **Ready for Next**: System returns to monitoring mode

## 🛠️ Technical Architecture

### Core Components

- **Electron App**: Cross-platform desktop application with translucent overlay
- **Voice Activity Detection**: Real-time speech analysis with adaptive thresholding
- **Voice Processing**: Deepgram Nova-3 streaming STT + GPT-powered interpretation
- **Audio System**: Freesound API integration with CC0-only filtering + smart volume control
- **Music Intelligence**: GPT-powered natural language to music search conversion
- **Volume Management**: Automatic ducking/restoration with smooth fade transitions
- **Legal Compliance**: Automatic CC0 license filtering ensures copyright-free audio

### VAD Algorithm Details

The Voice Activity Detection system uses several sophisticated techniques:

```javascript
// Energy-based detection with smoothing
currentEnergy = (smoothingFactor * prevEnergy) + ((1 - smoothingFactor) * instantEnergy)

// Adaptive thresholding based on recent history
adaptiveThreshold = max(baseThreshold, averageRecentEnergy * 1.5)

// Minimum duration filtering to prevent false triggers
if (speechDuration >= minSpeechDuration && !currentlyActive) {
    triggerSpeechStart()
}
```

### Audio Processing Pipeline

1. **Microphone Input**: Web Audio API captures 16kHz mono audio
2. **VAD Analysis**: Real-time energy calculation and speech detection
3. **Volume Control**: Smooth fade-in/fade-out during speech events
4. **STT Processing**: Deepgram Nova-3 converts speech to text
5. **Intent Parsing**: GPT interprets natural language music requests
6. **Audio Playback**: Freesound API delivers CC0-licensed music

### File Structure
```
src/
├── main.js                 # Electron main process + GPT integration
├── renderer/
│   ├── index.html         # Main UI with VAD indicator
│   ├── styles.css         # Translucent styling + VAD animations
│   └── renderer.js        # UI logic, VAD events, and coordination
└── services/
    ├── voiceProcessor.js   # Deepgram STT + Voice Activity Detection
    └── audioSystem.js      # Music control + automatic volume ducking
```

## 🎨 Customization

### Adding New Music Styles

1. Extend the `AudioSystem.generateMusic()` method:
   ```javascript
   case 'your-style':
       await this.createYourStyleMusic();
       break;
   ```

2. Add voice commands in `VoiceProcessor.parseIntent()`:
   ```javascript
   'your command': { action: 'your-style', description: 'your style' }
   ```

### Waveform Colors

Customize visualization colors in `WaveformVisualizer`:
```javascript
this.colors = {
    'your-style': ['#color1', '#color2', '#color3']
};
```

## 🔧 Configuration

### Environment Variables

- `DEEPGRAM_API_KEY`: Your Deepgram API key (required)
- `OPENAI_API_KEY`: OpenAI key for GPT-powered music interpretation (required)
- `FREESOUND_API_KEY`: Freesound API key for accessing CC0 audio library (required)

### Audio Settings

Modify audio parameters in `AudioSystem`:
- `this.volume`: Default volume (0.0 - 1.0)
- License filtering: Automatically set to CC0-only for copyright-free audio
- Search parameters: Duration, quality, and mood filters

## 🎯 Usage Tips

### Getting Started
1. **Global Access**: Press ⌘M from anywhere to show/activate the music bar
2. **First Run**: Grant microphone permissions when prompted
3. **Music Start**: Music only plays when you request it via voice commands - no auto-start
4. **Hide/Show**: Use ESC to hide the bar, ⌘M to show it again

### Voice Activity Detection
5. **Natural Speech**: Just speak normally - no need to hold buttons or manually mute
6. **Watch the Indicator**: 🗣️ shows green when speech is detected
7. **Adjust Sensitivity**: Use ⚙️ settings if detection is too sensitive/insensitive
8. **Background Noise**: VAD adapts to your environment automatically

### Optimal Performance
9. **Voice Quality**: Speak clearly and wait for the listening indicator
10. **Multi-Screen**: Works across all monitors and virtual desktops
11. **Background Use**: Stays accessible but won't interfere with other applications
12. **Performance**: Uses minimal CPU/GPU resources for continuous operation
13. **Smooth Transitions**: Music fades naturally during voice commands

## 🐛 Troubleshooting

### Common Issues

**"Cannot access microphone"**
- Check system microphone permissions
- Ensure no other app is using the microphone exclusively
- Restart the app after granting permissions

**"Failed to initialize"** 
- Verify your Deepgram API key is set correctly in .env
- Check your OpenAI API key is properly configured
- Verify your Freesound API key is valid
- Check your internet connection

**No audio output**
- Check system audio settings
- Verify audio isn't muted
- Try different music styles
- Check if Freesound API is accessible

**VAD not working properly**
- Adjust sensitivity via ⚙️ settings button
- Check microphone levels in system settings
- Ensure you're speaking clearly and loudly enough
- Try different ducking percentages (20% vs 50% vs 80%)

**Music doesn't duck during speech**
- Verify VAD is enabled (should be by default)
- Check console logs for "Speech detected" messages
- Adjust VAD threshold if too high/low
- Ensure audio system initialized properly

### Debug Mode

Run with debug output:
```bash
npm run dev
```

## 🚧 Future Enhancements

### Voice & Audio Intelligence
- [ ] Multi-language voice command support
- [ ] Voice biometrics for personalized responses
- [ ] Advanced noise cancellation during VAD
- [ ] Directional microphone array support
- [ ] Voice emotion detection for mood-based music

### Music & Sound
- [ ] Riffusion integration for AI-generated music
- [ ] Noise2Music model integration
- [ ] Custom music style creation and training
- [ ] Advanced audio mixing and layering
- [ ] Spatial audio positioning

### User Experience
- [ ] Productivity analytics and focus tracking
- [ ] Multiple display support with independent controls
- [ ] Customizable UI themes and layouts
- [ ] Voice command history and favorites
- [ ] Integration with calendar and productivity apps

### Technical Improvements
- [ ] Offline voice processing capabilities
- [ ] Advanced VAD with neural networks
- [ ] Real-time audio visualization improvements
- [ ] Performance optimizations for low-power devices
- [ ] Plugin system for custom audio sources

## 📝 License

MIT License - feel free to modify and distribute!

## 🤝 Contributing

Contributions welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

---

Built with ❤️ for focused, productive work sessions. 