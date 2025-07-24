class WaveformVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Visualization settings
        this.barCount = 64;
        this.barWidth = this.width / this.barCount;
        this.colors = {
            ambient: ['#4ade80', '#22d3ee', '#a78bfa'],
            piano: ['#fbbf24', '#f59e0b', '#fb7185'],
            focus: ['#06b6d4', '#0891b2', '#0e7490'],
            relax: ['#a78bfa', '#c084fc', '#ddd6fe'],
            default: ['#4ade80', '#22d3ee', '#a78bfa']
        };
        this.currentStyle = 'ambient';
        
        // Animation state
        this.animationFrame = null;
        this.particles = [];
        this.lastUpdateTime = 0;
        
        this.initializeCanvas();
        this.startAnimation();
    }
    
    initializeCanvas() {
        // Set up canvas for high DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.width = rect.width;
        this.height = rect.height;
        this.barWidth = this.width / this.barCount;
    }
    
    updateWaveform(audioData) {
        if (!audioData || audioData.length === 0) return;
        
        // Convert audio data to visualization format
        const normalizedData = this.normalizeAudioData(audioData);
        this.renderWaveform(normalizedData);
    }
    
    normalizeAudioData(audioData) {
        if (Array.isArray(audioData)) {
            // Handle Tone.js waveform data
            return audioData.map(value => Math.abs(value));
        } else if (audioData instanceof Float32Array || audioData instanceof Uint8Array) {
            // Handle raw audio data
            const normalized = new Array(this.barCount);
            const step = audioData.length / this.barCount;
            
            for (let i = 0; i < this.barCount; i++) {
                const start = Math.floor(i * step);
                const end = Math.floor((i + 1) * step);
                let sum = 0;
                
                for (let j = start; j < end; j++) {
                    sum += Math.abs(audioData[j]);
                }
                
                normalized[i] = sum / (end - start);
            }
            
            return normalized;
        }
        
        // Fallback: generate smooth animated bars
        return this.generateSmoothWaveform();
    }
    
    generateSmoothWaveform() {
        const time = Date.now() * 0.001;
        const waveform = new Array(this.barCount);
        
        for (let i = 0; i < this.barCount; i++) {
            const frequency1 = 0.02 * i + time * 0.5;
            const frequency2 = 0.03 * i + time * 0.3;
            const wave1 = Math.sin(frequency1) * 0.3;
            const wave2 = Math.sin(frequency2) * 0.2;
            waveform[i] = Math.abs(wave1 + wave2) + 0.1;
        }
        
        return waveform;
    }
    
    renderWaveform(audioData) {
        // Clear canvas with subtle background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        const colors = this.colors[this.currentStyle] || this.colors.default;
        const centerY = this.height / 2;
        
        // Render waveform bars
        for (let i = 0; i < this.barCount && i < audioData.length; i++) {
            const amplitude = audioData[i];
            const barHeight = amplitude * this.height * 0.8;
            const x = i * this.barWidth;
            
            // Create gradient for each bar
            const gradient = this.ctx.createLinearGradient(0, centerY - barHeight/2, 0, centerY + barHeight/2);
            gradient.addColorStop(0, colors[0] + '80');
            gradient.addColorStop(0.5, colors[1] + 'CC');
            gradient.addColorStop(1, colors[2] + '80');
            
            this.ctx.fillStyle = gradient;
            
            // Draw symmetric bars
            this.ctx.fillRect(
                x + this.barWidth * 0.1,
                centerY - barHeight / 2,
                this.barWidth * 0.8,
                barHeight
            );
            
            // Add glow effect
            this.ctx.shadowColor = colors[1];
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(
                x + this.barWidth * 0.1,
                centerY - barHeight / 2,
                this.barWidth * 0.8,
                barHeight
            );
            this.ctx.shadowBlur = 0;
        }
        
        // Add particles for enhanced visual effect
        this.updateParticles();
        this.renderParticles();
    }
    
    updateParticles() {
        const time = Date.now();
        
        // Add new particles occasionally
        if (Math.random() < 0.1) {
            this.particles.push({
                x: Math.random() * this.width,
                y: this.height / 2 + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 1,
                life: 1.0,
                size: Math.random() * 3 + 1
            });
        }
        
        // Update existing particles
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.01;
            particle.vy += 0.02; // Gravity
        });
        
        // Remove dead particles
        this.particles = this.particles.filter(particle => 
            particle.life > 0 && 
            particle.x >= 0 && particle.x <= this.width &&
            particle.y >= 0 && particle.y <= this.height
        );
    }
    
    renderParticles() {
        const colors = this.colors[this.currentStyle] || this.colors.default;
        
        this.particles.forEach(particle => {
            const alpha = Math.floor(particle.life * 255).toString(16).padStart(2, '0');
            this.ctx.fillStyle = colors[1] + alpha;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    startAnimation() {
        const animate = (currentTime) => {
            if (currentTime - this.lastUpdateTime > 16) { // ~60fps
                // If no audio data is coming in, show animated idle state
                if (!this.hasRecentAudioData) {
                    const idleWaveform = this.generateSmoothWaveform();
                    this.renderWaveform(idleWaveform);
                }
                this.lastUpdateTime = currentTime;
            }
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        animate(0);
    }
    
    setStyle(style) {
        this.currentStyle = style;
    }
    
    dispose() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}

module.exports = WaveformVisualizer; 