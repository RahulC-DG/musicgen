const { ipcRenderer } = require('electron');
const VoiceProcessor = require('../services/voiceProcessor');
const AudioSystem = require('../services/audioSystem');

class VoiceProductivityCompanion {
    constructor() {
        try {
            console.log('🔧 VoiceProductivityCompanion constructor started');
            this.isListening = false;
            this.isInitialized = false;
            
            // DOM elements first
            console.log('🔧 Getting DOM elements...');
                    this.statusText = document.getElementById('statusText');
        this.listeningDot = document.getElementById('listeningDot');
        this.micToggle = document.getElementById('micToggle');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.vadIndicator = document.getElementById('vadIndicator');
            
            if (!this.statusText || !this.listeningDot || !this.micToggle || !this.settingsBtn || !this.vadIndicator) {
                throw new Error('Required DOM elements not found');
            }
            console.log('✅ DOM elements found');
            
            // Initialize components
            console.log('🔧 Creating service components...');
            this.voiceProcessor = new VoiceProcessor();
            this.audioSystem = new AudioSystem();
            console.log('✅ Service components created');
            
            this.initializeEventListeners();
            console.log('✅ Event listeners initialized');
            
            // Don't start initialization immediately, let constructor finish
            setTimeout(() => this.initialize(), 100);
            console.log('✅ Constructor completed');
        } catch (error) {
            console.error('❌ Constructor failed:', error);
            if (this.statusText) {
                this.statusText.textContent = 'Constructor Error: ' + error.message;
            }
            throw error;
        }
    }
    
    initializeEventListeners() {
        // Control button handlers
        this.micToggle.addEventListener('click', () => this.toggleListening());
        this.settingsBtn.addEventListener('click', () => this.showSettings());
        
        // Voice processor events
        this.voiceProcessor.on('listening', () => this.setListeningState(true));
        this.voiceProcessor.on('stopped', () => this.setListeningState(false));
        this.voiceProcessor.on('transcription', (text) => this.handleVoiceCommand(text));
        this.voiceProcessor.on('speaking', () => this.setSpeakingState(true));
        this.voiceProcessor.on('speaking-complete', () => this.setSpeakingState(false));
        
        // Audio system events
        this.audioSystem.on('music-changed', (info) => this.updateMusicInfo(info));
        
        // Window controls
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                console.log('Escape pressed - hiding window');
                ipcRenderer.invoke('hide-window');
            }
            // Command+M (or Ctrl+M on Windows/Linux) to toggle microphone
            if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
                console.log('Command+M pressed!');
                e.preventDefault();
                this.toggleListening();
            }
        });
        
        // Add click debugging
        console.log('Setting up button event listeners...');
        
        // Test if buttons are working
        this.micToggle.addEventListener('click', (e) => {
            console.log('Microphone button clicked!');
            e.stopPropagation();
        });
        
        this.settingsBtn.addEventListener('click', (e) => {
            console.log('Settings button clicked!');
            e.stopPropagation();
            this.showVADSettings();
        });

        // Listen for global shortcut from main process
        ipcRenderer.on('toggle-microphone', () => {
            console.log('Global shortcut received!');
            this.toggleListening();
        });
        
        // Add a simple spacebar shortcut as backup
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat) {
                console.log('Spacebar pressed for microphone toggle');
                e.preventDefault();
                this.toggleListening();
            }
        });
    }
    
    async initialize() {
        try {
            console.log('🚀 Starting initialization...');
            this.updateStatus('Initializing voice system...');
            console.log('🖼️ Interface should be visible now');
            
            // Initialize voice processor with Deepgram
            console.log('📡 Initializing voice processor...');
            try {
                await this.voiceProcessor.initialize();
                console.log('✅ Voice processor initialized');
                
                // Set up VAD event listeners
                this.voiceProcessor.on('speechStart', () => {
                    console.log('🎤 VAD: Speech started - ducking music');
                    this.audioSystem.onSpeechDetected();
                    this.vadIndicator.classList.add('active');
                });
                
                this.voiceProcessor.on('speechEnd', () => {
                    console.log('🎵 VAD: Speech ended - restoring music');
                    this.audioSystem.onSpeechEnded();
                    this.vadIndicator.classList.remove('active');
                });
                
            } catch (voiceError) {
                console.error('❌ Voice processor failed:', voiceError);
                this.updateStatus('Voice system failed - continuing without voice');
                // Continue without voice processor
            }
            
            // Initialize audio system
            console.log('🎵 Initializing audio system...');
            try {
                await this.audioSystem.initialize();
                console.log('✅ Audio system initialized');
            } catch (audioError) {
                console.error('❌ Audio system failed:', audioError);
                this.updateStatus('Audio system failed - interface only mode');
                // Continue without audio
            }
            
            this.isInitialized = true;
            this.updateStatus('Ready - Voice detection active • Press ⌘M to request music • ESC to hide');
            console.log('🎉 Full initialization complete!');
            console.log('🖼️ Interface should be fully visible and interactive');
            
        } catch (error) {
            console.error('❌ Critical initialization error:', error);
            this.updateStatus('Critical Error: ' + error.message);
        }
    }
    
    async toggleListening() {
        console.log('toggleListening called, current state:', this.isListening);
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
    
    async startListening() {
        console.log('🚀 StartListening called, initialized:', this.isInitialized);
        if (!this.isInitialized) {
            console.log('❌ Not initialized yet');
            return;
        }
        
        try {
            console.log('🎤 Calling voiceProcessor.startListening...');
            await this.voiceProcessor.startListening();
            this.isListening = true;
            this.micToggle.textContent = '🔴'; // Red dot to show recording
            this.updateStatus('Listening... (Speak now)');
            console.log('✅ Voice listening started successfully');
        } catch (error) {
            console.error('❌ Failed to start listening:', error);
            this.updateStatus('Error: Cannot access microphone');
        }
    }
    
    stopListening() {
        this.voiceProcessor.stopListening();
        this.isListening = false;
        this.micToggle.textContent = '🎤';
        this.setListeningState(false);
        this.updateStatus('Voice control paused');
    }
    
    async handleVoiceCommand(transcription) {
        if (!transcription || transcription.trim().length === 0) return;
        
        console.log('Voice command:', transcription);
        this.updateStatus(`Processing: "${transcription}"`);
        
        try {
            // Check if it's a simple control command first - be more specific to avoid false positives
            const lowerTranscription = transcription.toLowerCase().trim();
            
            // Only treat as simple commands if they are EXACTLY these commands or very close
            const isVolumeCommand = lowerTranscription === 'louder' || 
                                   lowerTranscription === 'quieter' || 
                                   lowerTranscription === 'turn it up' || 
                                   lowerTranscription === 'turn it down';
            
            const isPlaybackCommand = lowerTranscription === 'stop' || 
                                     lowerTranscription === 'pause' || 
                                     lowerTranscription === 'resume' ||
                                     (lowerTranscription === 'play' && transcription.split(' ').length === 1); // Only single word "play"
            
            if (isVolumeCommand || isPlaybackCommand) {
                // Use traditional intent parsing for simple commands
                const command = await this.voiceProcessor.parseIntent(transcription);
                await this.audioSystem.executeCommand(command);
                const response = this.generateResponse(command);
                this.updateStatus(`✅ ${response}`);
            } else {
                // Pass full natural language to GPT-powered audio system
                console.log('🎵 Sending full transcription to GPT:', transcription);
                await this.audioSystem.executeCommand({ 
                    text: transcription,
                    category: 'music'
                });
                this.updateStatus(`✅ Playing music for: "${transcription}"`);
            }
            
        } catch (error) {
            console.error('Command processing error:', error);
            this.updateStatus('Sorry, I couldn\'t find music for that request');
        }
        
        // Stop listening after processing command - let music play normally
        this.stopListening();
        
        // Update status to show music is playing and how to make next request
        setTimeout(() => {
            this.updateStatus('Press ⌘M to request music • ESC to hide');
        }, 2000);
    }
    
    generateResponse(command) {
        const responses = {
            'ambient': 'Now playing dreamy ambient tones',
            'rainfall': 'Adding the sound of gentle rainfall',
            'piano': 'Switching to peaceful piano melodies',
            'focus': 'Optimizing for deep focus',
            'relax': 'Creating a relaxing atmosphere',
            'volume_up': 'Increasing volume',
            'volume_down': 'Decreasing volume',
            'stop': 'Music paused',
            'play': 'Resuming playback'
        };
        
        return responses[command.action] || `Adjusting soundscape to ${command.description}`;
    }
    
    setListeningState(listening) {
        if (listening) {
            this.listeningDot.classList.add('listening');
            this.listeningDot.classList.remove('speaking');
        } else {
            this.listeningDot.classList.remove('listening');
        }
    }
    
    setSpeakingState(speaking) {
        if (speaking) {
            this.listeningDot.classList.add('speaking');
            this.listeningDot.classList.remove('listening');
        } else {
            this.listeningDot.classList.remove('speaking');
            if (this.isListening) {
                this.listeningDot.classList.add('listening');
            }
        }
    }
    
    updateStatus(message) {
        this.statusText.textContent = message;
        console.log('Status update:', message);
    }
    
    updateMusicInfo(info) {
        // Update UI with current music information
        console.log('Music info:', info);
    }
    
    showSettings() {
        // TODO: Implement settings panel
        console.log('Settings clicked');
    }

    showVADSettings() {
        // Show current VAD status and allow adjustments
        const currentThreshold = this.voiceProcessor.vadThreshold;
        const currentDucking = this.audioSystem.vadDuckingFactor;
        
        const message = `Voice Activity Detection Settings:
        
Current Threshold: ${currentThreshold.toFixed(3)}
Current Ducking: ${(currentDucking * 100).toFixed(0)}%
Speech Active: ${this.voiceProcessor.isSpeechActive ? 'Yes' : 'No'}
Current Energy: ${this.voiceProcessor.currentEnergy.toFixed(4)}

Adjust sensitivity (0.001-0.1):`;
        
        const newThreshold = prompt(message, currentThreshold.toString());
        if (newThreshold !== null && !isNaN(newThreshold)) {
            const threshold = parseFloat(newThreshold);
            this.voiceProcessor.setVADThreshold(threshold);
            
            const duckingMessage = `Set music ducking level (10-100%):`;
            const newDucking = prompt(duckingMessage, (currentDucking * 100).toString());
            if (newDucking !== null && !isNaN(newDucking)) {
                const ducking = parseFloat(newDucking) / 100;
                this.audioSystem.setVADDuckingFactor(ducking);
            }
        }
    }
}

// Add global error handling
window.addEventListener('error', (e) => {
    console.error('❌ Global error:', e.error);
    console.error('❌ Error message:', e.message);
    console.error('❌ Error source:', e.filename, 'line', e.lineno);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('❌ Unhandled promise rejection:', e.reason);
});

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🚀 DOM loaded, creating VoiceProductivityCompanion...');
        new VoiceProductivityCompanion();
        console.log('✅ VoiceProductivityCompanion created successfully');
    } catch (error) {
        console.error('❌ Failed to create VoiceProductivityCompanion:', error);
        document.getElementById('statusText').textContent = 'Error: Failed to initialize - Check console';
    }
}); 