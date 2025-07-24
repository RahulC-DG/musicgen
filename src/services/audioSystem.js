const EventEmitter = require('events');
const { ipcRenderer } = require('electron');

class AudioSystem extends EventEmitter {
    constructor() {
        super();
        this.currentMusicStyle = 'ambient';
        this.isPlaying = false;
        this.volume = 0.5;
        this.currentAudio = null;
        this.freesoundApiKey = null; // Will be set via IPC
        this.trackCache = new Map();
        
        // VAD-triggered volume control
        this.isVADMuted = false;
        this.originalVolume = null;
        this.originalGain = null;
        this.vadDuckingFactor = 0.2; // Reduce volume to 20% during speech
        this.vadFadeTime = 100; // Fade time in ms
    }
    
    async initialize() {
        console.log('🎵 Initializing GPT + Freesound Audio System...');
        
        try {
            // Get API key from main process
            this.freesoundApiKey = await ipcRenderer.invoke('get-freesound-api-key');
            
            if (!this.freesoundApiKey) {
                console.warn('⚠️ FREESOUND_API_KEY not found - please add to .env file');
            }
        } catch (error) {
            console.error('Failed to get Freesound API key:', error);
        }
        
        console.log('✅ Audio system ready for intelligent voice commands');
    }
    
    async startBackgroundMusic(style = 'ambient') {
        console.log('🎵 Starting background music -', style);
        this.currentMusicStyle = style;
        
        // Use GPT to interpret the style request
        const searchQuery = await this.interpretMusicRequest(style);
        const track = await this.findAndPlayTrack(searchQuery);
        
        if (track) {
            this.isPlaying = true;
            this.emit('music-changed', {
                style: style,
                isPlaying: true,
                volume: this.volume,
                trackName: track.name
            });
        }
    }
    
    async executeCommand(command) {
        console.log('🎵 Processing natural language command:', command.text || command.action);
        
        // Handle traditional commands
        if (command.action) {
            switch (command.action) {
                case 'volume_up':
                    this.adjustVolume(0.1);
                    return;
                case 'volume_down':
                    this.adjustVolume(-0.1);
                    return;
                case 'stop':
                    this.stopMusic();
                    return;
                case 'play':
                    await this.resumeMusic();
                    return;
            }
        }
        
        // Use GPT to interpret natural language
        const musicRequest = command.text || command.action || 'ambient background music';
        const searchQuery = await this.interpretMusicRequest(musicRequest);
        const track = await this.findAndPlayTrack(searchQuery);
        
        if (track) {
            this.currentMusicStyle = searchQuery.style;
            this.isPlaying = true;
            this.emit('music-changed', {
                style: searchQuery.style,
                isPlaying: true,
                volume: this.volume,
                trackName: track.name
            });
        }
    }
    
    async interpretMusicRequest(userInput) {
        console.log('🤖 Using GPT to interpret:', userInput);
        
        try {
            // Send request to main process for GPT interpretation
            const result = await ipcRenderer.invoke('interpret-music-request', userInput);
            console.log('🤖 GPT interpreted as:', result);
            return result;
            
        } catch (error) {
            console.error('🤖 GPT interpretation failed:', error);
            // Fallback to simple interpretation
            return this.fallbackInterpretation(userInput);
        }
    }
    
    fallbackInterpretation(userInput) {
        const input = userInput.toLowerCase();
        
        if (input.includes('rock') || input.includes('guitar') || input.includes('electric')) {
            return {
                query: 'rock guitar electric music',
                filter: 'tag:rock duration:[60 TO *] avg_rating:[3 TO *] license:"Creative Commons 0"',
                style: 'rock',
                mood: 'energetic'
            };
        }
        
        if (input.includes('metal') || input.includes('heavy')) {
            return {
                query: 'metal heavy guitar',
                filter: 'tag:metal duration:[60 TO *] avg_rating:[3 TO *] license:"Creative Commons 0"',
                style: 'metal',
                mood: 'aggressive'
            };
        }
        
        if (input.includes('ambient') || input.includes('atmospheric')) {
            return {
                query: 'ambient drone atmospheric',
                filter: 'tag:ambient duration:[60 TO *] avg_rating:[3 TO *] license:"Creative Commons 0"',
                style: 'ambient',
                mood: 'peaceful'
            };
        }
        
        if (input.includes('rain') || input.includes('rainfall')) {
            return {
                query: 'rain weather nature',
                filter: 'tag:rain duration:[30 TO *] avg_rating:[3 TO *] license:"Creative Commons 0"',
                style: 'nature',
                mood: 'calming'
            };
        }
        
        if (input.includes('piano')) {
            return {
                query: 'piano peaceful solo',
                filter: 'tag:piano duration:[60 TO *] avg_rating:[3 TO *] license:"Creative Commons 0"',
                style: 'piano',
                mood: 'peaceful'
            };
        }
        
        if (input.includes('focus') || input.includes('concentrate')) {
            return {
                query: 'focus study concentration',
                filter: 'tag:focus duration:[120 TO *] avg_rating:[3 TO *] license:"Creative Commons 0"',
                style: 'focus',
                mood: 'concentrated'
            };
        }
        
        // Default
        return {
            query: 'ambient peaceful background',
            filter: 'duration:[60 TO *] avg_rating:[3 TO *] license:"Creative Commons 0"',
            style: 'ambient',
            mood: 'peaceful'
        };
    }
    
    async findAndPlayTrack(searchQuery) {
        console.log('🔍 Searching Freesound for:', searchQuery);
        
        // Check cache first
        const cacheKey = `${searchQuery.query}-${searchQuery.filter}`;
        if (this.trackCache.has(cacheKey)) {
            console.log('🎵 Using cached track');
            const cachedTrack = this.trackCache.get(cacheKey);
            await this.playTrack(cachedTrack);
            return cachedTrack;
        }
        
        if (!this.freesoundApiKey) {
            console.warn('⚠️ No Freesound API key - using demo mode');
            return this.playDemoTrack(searchQuery.style);
        }
        
        try {
            const url = `https://freesound.org/apiv2/search/text/?` +
                `query=${encodeURIComponent(searchQuery.query)}&` +
                `filter=${encodeURIComponent(searchQuery.filter)}&` +
                `fields=name,previews,duration,tags,username&` +
                `sort=rating_desc&` +
                `page_size=5&` +
                `token=${this.freesoundApiKey}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                // Pick the best track (first result is highest rated)
                const track = data.results[0];
                
                // Cache the track
                this.trackCache.set(cacheKey, track);
                
                console.log(`🎵 Found track: "${track.name}" by ${track.username}`);
                await this.playTrack(track);
                return track;
            } else {
                console.warn('🔍 No tracks found, using demo');
                return this.playDemoTrack(searchQuery.style);
            }
            
        } catch (error) {
            console.error('🔍 Freesound search failed:', error);
            return this.playDemoTrack(searchQuery.style);
        }
    }
    
    async playTrack(track) {
        console.log('🎵 Playing track:', track.name);
        
        // Stop current audio
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        
        // Use high-quality preview
        const audioUrl = track.previews['preview-hq-mp3'] || track.previews['preview-lq-mp3'];
        
        if (!audioUrl) {
            console.error('🎵 No audio preview available');
            return;
        }
        
        // Create and play audio
        this.currentAudio = new Audio(audioUrl);
        this.currentAudio.loop = true;
        this.currentAudio.volume = this.volume;
        
        this.currentAudio.addEventListener('loadstart', () => {
            console.log('🎵 Loading track...');
        });
        
        this.currentAudio.addEventListener('canplay', () => {
            console.log('✅ Track ready to play');
        });
        
        this.currentAudio.addEventListener('error', (e) => {
            console.error('🎵 Audio playback error:', e);
        });
        
        try {
            await this.currentAudio.play();
            console.log('✅ Track playing:', track.name);
        } catch (error) {
            console.error('🎵 Failed to play track:', error);
        }
    }
    
    playDemoTrack(style) {
        console.log('🎵 Playing demo track for:', style);
        
        // Simple fallback audio
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        const frequencies = {
            'ambient': 220,
            'piano': 261.63,
            'nature': 110,
            'focus': 40,
            'electronic': 440
        };
        
        oscillator.frequency.value = frequencies[style] || 220;
        oscillator.type = 'sine';
        gainNode.gain.value = this.volume * 0.1;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        
        // Store reference for cleanup
        this.demoAudio = { oscillator, gainNode, audioContext };
        
        return { name: `Demo ${style} tone`, username: 'system' };
    }
    
    async switchToStyle(newStyle) {
        console.log('🎵 Switching to style:', newStyle);
        await this.executeCommand({ text: newStyle });
    }
    
    adjustVolume(delta) {
        this.volume = Math.max(0, Math.min(1, this.volume + delta));
        
        if (this.currentAudio) {
            this.currentAudio.volume = this.volume;
        }
        
        if (this.demoAudio && this.demoAudio.gainNode) {
            this.demoAudio.gainNode.gain.value = this.volume * 0.1;
        }
        
        this.emit('music-changed', {
            style: this.currentMusicStyle,
            isPlaying: this.isPlaying,
            volume: this.volume
        });
        
        console.log('🔊 Volume adjusted to:', Math.round(this.volume * 100) + '%');
    }
    
    stopMusic() {
        console.log('🎵 Stopping music...');
        
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        
        if (this.demoAudio) {
            this.demoAudio.oscillator.stop();
            this.demoAudio.audioContext.close();
            this.demoAudio = null;
        }
        
        this.isPlaying = false;
        
        this.emit('music-changed', {
            style: this.currentMusicStyle,
            isPlaying: false,
            volume: this.volume
        });
    }
    
    async resumeMusic() {
        if (!this.isPlaying) {
            console.log('🎵 Resuming music...');
            await this.startBackgroundMusic(this.currentMusicStyle);
        }
    }
    
    // VAD-triggered volume control methods
    onSpeechDetected() {
        if (this.isVADMuted) return; // Already ducked
        
        console.log('🎤 Speech detected - ducking music volume');
        this.isVADMuted = true;
        
        // Duck the current audio
        if (this.currentAudio) {
            this.originalVolume = this.currentAudio.volume;
            this.fadeVolume(this.currentAudio, this.originalVolume * this.vadDuckingFactor, this.vadFadeTime);
        }
        
        // Duck the demo audio
        if (this.demoAudio && this.demoAudio.gainNode) {
            this.originalGain = this.demoAudio.gainNode.gain.value;
            this.fadeGain(this.demoAudio.gainNode, this.originalGain * this.vadDuckingFactor, this.vadFadeTime);
        }
    }
    
    onSpeechEnded() {
        if (!this.isVADMuted) return; // Not currently ducked
        
        console.log('🎵 Speech ended - restoring music volume');
        this.isVADMuted = false;
        
        // Restore the current audio volume
        if (this.currentAudio && this.originalVolume !== null) {
            this.fadeVolume(this.currentAudio, this.originalVolume, this.vadFadeTime);
        }
        
        // Restore the demo audio gain
        if (this.demoAudio && this.demoAudio.gainNode && this.originalGain !== null) {
            this.fadeGain(this.demoAudio.gainNode, this.originalGain, this.vadFadeTime);
        }
    }
    
    // Smooth volume fading for regular audio elements
    fadeVolume(audioElement, targetVolume, duration) {
        if (!audioElement) return;
        
        const startVolume = audioElement.volume;
        const volumeDiff = targetVolume - startVolume;
        const steps = 20; // Number of fade steps
        const stepTime = duration / steps;
        let currentStep = 0;
        
        const fadeInterval = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            audioElement.volume = startVolume + (volumeDiff * progress);
            
            if (currentStep >= steps) {
                clearInterval(fadeInterval);
                audioElement.volume = targetVolume;
            }
        }, stepTime);
    }
    
    // Smooth gain fading for Web Audio API nodes
    fadeGain(gainNode, targetGain, duration) {
        if (!gainNode) return;
        
        const audioContext = gainNode.context;
        const currentTime = audioContext.currentTime;
        const endTime = currentTime + (duration / 1000);
        
        gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
        gainNode.gain.linearRampToValueAtTime(targetGain, endTime);
    }
    
    // Method to adjust VAD ducking factor
    setVADDuckingFactor(factor) {
        this.vadDuckingFactor = Math.max(0.1, Math.min(1.0, factor));
        console.log('VAD ducking factor set to:', this.vadDuckingFactor);
    }
}

module.exports = AudioSystem; 