// Load environment variables
require('dotenv').config();

const { createClient } = require('@deepgram/sdk');
const EventEmitter = require('events');

// We'll handle microphone differently in Electron
const mic = null;

class VoiceProcessor extends EventEmitter {
    constructor() {
        super();
        this.deepgram = null;
        this.liveTranscription = null;
        this.microphone = null;
        this.isListening = false;
        this.apiKey = process.env.DEEPGRAM_API_KEY;
        
        // Voice Activity Detection properties
        this.vadEnabled = true;
        this.vadThreshold = 0.01; // Minimum energy threshold for speech
        this.vadSmoothingFactor = 0.8; // Smoothing for energy calculation
        this.vadMinSpeechDuration = 300; // Minimum ms of speech to trigger
        this.vadSilenceTimeout = 1000; // Ms of silence before ending speech
        
        // VAD state tracking
        this.currentEnergy = 0;
        this.speechStartTime = null;
        this.lastSpeechTime = null;
        this.isSpeechActive = false;
        this.energyHistory = [];
        this.maxHistoryLength = 10;
    }
    
    async initialize() {
        console.log('Initializing VoiceProcessor...');
        console.log('API Key status:', this.apiKey ? 'Set' : 'Not set');
        console.log('API Key (first 10 chars):', this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'undefined');
        
        if (!this.apiKey) {
            throw new Error('Please set your Deepgram API key in the .env file: DEEPGRAM_API_KEY=your_key_here');
        }
        
        try {
            // Initialize Deepgram client
            this.deepgram = createClient(this.apiKey);
            console.log('✅ VoiceProcessor initialized with Deepgram');
        } catch (error) {
            console.error('❌ Failed to initialize Deepgram client:', error);
            throw error;
        }
    }
    
    async startListening() {
        console.log('🎤 Starting listening...');
        if (this.isListening) {
            console.log('Already listening, returning');
            return;
        }
        
        if (!this.deepgram) {
            throw new Error('Deepgram client not initialized');
        }
        
        try {
            // Create live transcription connection with Nova-3 model
            this.liveTranscription = this.deepgram.listen.live({
                model: 'nova-3', // Updated to Nova-3 as preferred
                language: 'en-US',
                smart_format: true,
                punctuate: true,
                interim_results: false,
                endpointing: 300, // End utterance after 300ms of silence
                vad_events: true,
                channels: 1,
                sample_rate: 16000,
                encoding: 'linear16'
            });
            
            // Set up event listeners
            this.liveTranscription.on('open', () => {
                console.log('Deepgram connection opened');
                this.emit('listening');
            });
            
            this.liveTranscription.on('Results', (data) => {
                const result = data.channel?.alternatives?.[0];
                if (result && result.transcript && result.transcript.trim().length > 0) {
                    console.log('Transcription:', result.transcript);
                    this.emit('transcription', result.transcript);
                }
            });
            
            this.liveTranscription.on('error', (error) => {
                console.error('Deepgram error:', error);
            });
            
            this.liveTranscription.on('close', () => {
                console.log('Deepgram connection closed');
                this.emit('stopped');
            });
            
            // Use Web Audio API for microphone access in Electron
            console.log('🎤 Starting Web Audio API microphone...');
            
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            
            console.log('✅ Microphone stream acquired');
            
            // Create audio context and connect to Deepgram
            const audioContext = new AudioContext({ sampleRate: 16000 });
            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (event) => {
                if (this.liveTranscription && this.liveTranscription.getReadyState() === 1) {
                    const inputData = event.inputBuffer.getChannelData(0);
                    
                    // Process Voice Activity Detection
                    this.processVAD(inputData);
                    
                    // Convert float32 to int16
                    const int16Data = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        int16Data[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
                    }
                    this.liveTranscription.send(int16Data.buffer);
                }
            };
            
            source.connect(processor);
            processor.connect(audioContext.destination);
            
            // Store references for cleanup
            this.audioContext = audioContext;
            this.mediaStream = stream;
            this.processor = processor;
            
            this.isListening = true;
            console.log('✅ Deepgram listening started successfully');
            
        } catch (error) {
            console.error('❌ Failed to start listening:', error);
            throw error;
        }
    }
    

    
    stopListening() {
        if (!this.isListening) return;
        
        this.isListening = false;
        
        // Clean up Web Audio API resources
        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        if (this.liveTranscription) {
            this.liveTranscription.finish();
            this.liveTranscription = null;
        }
        
        this.emit('stopped');
    }
    
    async parseIntent(transcription) {
        const text = transcription.toLowerCase().trim();
        
        // Simple intent parsing - can be replaced with GPT-based parsing
        const intents = {
            // Music style commands
            'make it more ambient': { action: 'ambient', description: 'ambient' },
            'more ambient': { action: 'ambient', description: 'ambient' },
            'switch to piano': { action: 'piano', description: 'piano' },
            'play piano': { action: 'piano', description: 'piano' },
            'add rainfall': { action: 'rainfall', description: 'rainfall' },
            'rain sounds': { action: 'rainfall', description: 'rainfall' },
            'focus music': { action: 'focus', description: 'focus' },
            'help me focus': { action: 'focus', description: 'focus' },
            'relaxing music': { action: 'relax', description: 'relax' },
            'help me relax': { action: 'relax', description: 'relax' },
            
            // Volume controls
            'louder': { action: 'volume_up', description: 'volume up' },
            'turn it up': { action: 'volume_up', description: 'volume up' },
            'quieter': { action: 'volume_down', description: 'volume down' },
            'turn it down': { action: 'volume_down', description: 'volume down' },
            
            // Playback controls
            'stop': { action: 'stop', description: 'stop' },
            'pause': { action: 'stop', description: 'pause' },
            'play': { action: 'play', description: 'play' },
            'resume': { action: 'play', description: 'resume' }
        };
        
        // Find matching intent
        for (const [pattern, command] of Object.entries(intents)) {
            if (text.includes(pattern)) {
                return command;
            }
        }
        
        // Fallback for unrecognized commands
        return { action: 'unknown', description: text };
    }
    
    async speak(text) {
        if (!text || text.trim().length === 0) return;
        
        console.log('🔊 TTS disabled for browser compatibility - would say:', text);
        
        // Skip TTS due to CORS restrictions in browser
        // Just log what would be spoken and immediately complete
        this.emit('speaking');
        setTimeout(() => {
            this.emit('speaking-complete');
        }, 100);
    }
    
    async getAudioBuffer(stream) {
        const chunks = [];
        const reader = stream.getReader();
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }
        } finally {
            reader.releaseLock();
        }
        
        return Buffer.concat(chunks);
    }
    
    async playAudio(buffer) {
        return new Promise((resolve, reject) => {
            const Speaker = require('speaker');
            const speaker = new Speaker({
                channels: 1,
                bitDepth: 16,
                sampleRate: 24000
            });
            
            speaker.on('close', resolve);
            speaker.on('error', reject);
            
            speaker.write(buffer);
            speaker.end();
        });
    }
    
    // Voice Activity Detection Methods
    calculateAudioEnergy(audioData) {
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += audioData[i] * audioData[i];
        }
        return Math.sqrt(sum / audioData.length);
    }
    
    updateEnergyHistory(energy) {
        this.energyHistory.push(energy);
        if (this.energyHistory.length > this.maxHistoryLength) {
            this.energyHistory.shift();
        }
    }
    
    getAverageEnergy() {
        if (this.energyHistory.length === 0) return 0;
        const sum = this.energyHistory.reduce((a, b) => a + b, 0);
        return sum / this.energyHistory.length;
    }
    
    processVAD(audioData) {
        if (!this.vadEnabled) return false;
        
        // Calculate current audio energy
        const instantEnergy = this.calculateAudioEnergy(audioData);
        
        // Smooth the energy using exponential moving average
        this.currentEnergy = (this.vadSmoothingFactor * this.currentEnergy) + 
                            ((1 - this.vadSmoothingFactor) * instantEnergy);
        
        // Update energy history for adaptive thresholding
        this.updateEnergyHistory(this.currentEnergy);
        
        // Adaptive threshold based on recent energy history
        const avgEnergy = this.getAverageEnergy();
        const adaptiveThreshold = Math.max(this.vadThreshold, avgEnergy * 1.5);
        
        const currentTime = Date.now();
        const isSpeechDetected = this.currentEnergy > adaptiveThreshold;
        
        if (isSpeechDetected) {
            if (!this.speechStartTime) {
                this.speechStartTime = currentTime;
                console.log('🎤 Speech detected, energy:', this.currentEnergy.toFixed(4));
            }
            this.lastSpeechTime = currentTime;
            
            // Check if we've had speech long enough to trigger
            const speechDuration = currentTime - this.speechStartTime;
            if (speechDuration >= this.vadMinSpeechDuration && !this.isSpeechActive) {
                this.isSpeechActive = true;
                console.log('🗣️ Speech activity started');
                this.emit('speechStart');
            }
        } else {
            // Check if we should end speech activity
            if (this.isSpeechActive && this.lastSpeechTime) {
                const silenceDuration = currentTime - this.lastSpeechTime;
                if (silenceDuration >= this.vadSilenceTimeout) {
                    this.isSpeechActive = false;
                    this.speechStartTime = null;
                    console.log('🤫 Speech activity ended');
                    this.emit('speechEnd');
                }
            }
        }
        
        return this.isSpeechActive;
    }
    
    // Method to enable/disable VAD
    setVADEnabled(enabled) {
        this.vadEnabled = enabled;
        if (!enabled && this.isSpeechActive) {
            this.isSpeechActive = false;
            this.speechStartTime = null;
            this.emit('speechEnd');
        }
    }
    
    // Method to adjust VAD sensitivity
    setVADThreshold(threshold) {
        this.vadThreshold = Math.max(0.001, Math.min(0.1, threshold));
        console.log('VAD threshold set to:', this.vadThreshold);
    }
}

module.exports = VoiceProcessor; 