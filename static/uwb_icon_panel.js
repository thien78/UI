/**
 * UWB Icon Panel Manager
 * Manages UWB connection status display and animations in the panel
 */
import { dataPanel } from './panel.js';

// Constants
const CONFIG = {
    POLL_INTERVAL: 576,
    ANIMATION_FPS: 60,
    PULSE_SPEED: 1.5,
    PULSE_AMPLITUDE: 0.1,
    GLOW_BASE: 6,
    GLOW_AMPLITUDE: 2,
    INIT_DELAY: 500
};

const COLORS = {
    RANGING: {
        GRADIENT: ['#1a5f3a', '#0d4024', '#0a1e1a'],
        BORDER: '#00ff00',
        LOGO: '#FFFFFF',
        GLOW: '#00ff00'
    },
    INACTIVE: {
        GRADIENT: ['#3a3a3a', '#2a2a2a', '#1a1a1a'],
        BORDER: '#666666',
        LOGO: '#888888'
    }
};

const UWB_LOGO = {
    // Original dimensions (will be scaled based on canvas size)
    WAVE_COUNT: 3,
    LEFT_WAVE_START: Math.PI * 1.1,
    LEFT_WAVE_END: Math.PI * 1.9,
    RIGHT_WAVE_START: Math.PI * 0.1,
    RIGHT_WAVE_END: Math.PI * 0.9
};

class UWBIconPanelManager {
    constructor() {
        this.initializeProperties();
        this.delayedInit();
    }
    
    initializeProperties() {
        // Canvas elements
        this.canvas = null;
        this.ctx = null;
        this.statusCard = null;
        this.statusText = null;
        
        // Connection state
        this.isRanging = false;
        this.previousRangingState = false;
        this.uwbStatus = "NA";
        
        // Animation state
        this.animations = { pulse: false, waves: false };
        this.animTime = 0;
        this.animationFrameId = null;
    }
    
    delayedInit() {
        setTimeout(() => {
            this.init();
            this.startConnectionPolling();
        }, CONFIG.INIT_DELAY);
    }
    
    init() {
        if (!this.initializeElements()) {
            console.error("[UWB Icon Panel] Canvas not found!");
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.drawUWBIcon();
        this.startAnimation();
    
    }
    
    initializeElements() {
        this.canvas = document.getElementById('uwb-icon-canvas');
        this.statusCard = document.getElementById('uwb-status-card');
        this.statusText = document.getElementById('uwb-status-text');
        return this.canvas !== null;
    }
    
    drawUWBIcon() {
        if (!this.ctx) return;
        
        const size = this.canvas.width;
        const center = size / 2;
        const pulseScale = this.calculatePulseScale();
        
        this.clearCanvas(size);
        this.applyPulseTransform(center, pulseScale);
        this.drawBackground(center);
        this.drawBorder(center);
        this.drawUWBLogo(center);
        this.ctx.restore();
    }
    
    calculatePulseScale() {
        if (!this.isRanging || !this.animations.pulse) return 1.0;
        return 1 + Math.sin(this.animTime * CONFIG.PULSE_SPEED) * CONFIG.PULSE_AMPLITUDE;
    }
    
    clearCanvas(size) {
        this.ctx.clearRect(0, 0, size, size);
    }
    
    applyPulseTransform(center, scale) {
        this.ctx.save();
        this.ctx.translate(center, center);
        this.ctx.scale(scale, scale);
        this.ctx.translate(-center, -center);
    }
    
    drawBackground(center) {
        const colors = this.isRanging ? COLORS.RANGING.GRADIENT : COLORS.INACTIVE.GRADIENT;
        const gradient = this.ctx.createRadialGradient(center, center, 0, center, center, center * 0.92);
        
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(0.7, colors[1]);
        gradient.addColorStop(1, colors[2]);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(center, center, center * 0.92, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawBorder(center) {
        this.ctx.strokeStyle = this.isRanging ? COLORS.RANGING.BORDER : COLORS.INACTIVE.BORDER;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(center, center, center * 0.88, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    drawUWBLogo(center) {
        this.ctx.save();
        this.ctx.translate(center, center);
        
        // Calculate scale factor based on canvas size (200px vs original 512px)
        const canvasSize = this.canvas.width;
        const scaleFactor = canvasSize / 512;
        
        const colors = this.isRanging ? COLORS.RANGING : COLORS.INACTIVE;
        this.ctx.fillStyle = colors.LOGO;
        this.ctx.strokeStyle = colors.LOGO;
        this.ctx.lineWidth = 20 * scaleFactor; // Scale line width
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        if (this.isRanging) {
            this.applyGlowEffect();
        }
        
        this.drawLogoShape(scaleFactor);
        this.ctx.restore();
    }
    
    applyGlowEffect() {
        const glowIntensity = CONFIG.GLOW_BASE + Math.sin(this.animTime * 2) * CONFIG.GLOW_AMPLITUDE;
        this.ctx.shadowColor = COLORS.RANGING.GLOW;
        this.ctx.shadowBlur = glowIntensity;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }
    
    drawLogoShape(scaleFactor) {
        // Scale all dimensions based on canvas size
        const dotRadius = 15 * scaleFactor;
        const waveSpacing = 40 * scaleFactor;
        
        // Center dot
        this.ctx.beginPath();
        this.ctx.arc(0, 0, dotRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // above waves (3 arcs) - 1.1π - 1.9π
        for (let i = 1; i <= UWB_LOGO.WAVE_COUNT; i++) {
            const radius = waveSpacing * i;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius, UWB_LOGO.LEFT_WAVE_START, UWB_LOGO.LEFT_WAVE_END);
            this.ctx.stroke();
        }
        
        // below waves (3 arcs) - 0.1π - 0.9π
        for (let i = 1; i <= UWB_LOGO.WAVE_COUNT; i++) {
            const radius = waveSpacing * i;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius, UWB_LOGO.RIGHT_WAVE_START, UWB_LOGO.RIGHT_WAVE_END);
            this.ctx.stroke();
        }
    }
    
    startAnimation() {
        const frameTime = 1000 / CONFIG.ANIMATION_FPS / 1000; // Convert to seconds
        
        const animate = () => {
            if (this.isRanging) {
                this.animTime += frameTime;
            }
            
            this.drawUWBIcon();
            this.animationFrameId = requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    startConnectionPolling() {
        const poll = async () => {
            try {
                const response = await fetch('/api/connection');
                if (!response.ok) return;
                
                const data = await response.json();
                this.updateConnectionState(data.UwbStatus);
            } catch (error) {
                if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
                    return; // Server unavailable - silent fail
                }
                console.error("[UWB Icon Panel] Error fetching connection status:", error);
            }
        };
        
        poll();
        setInterval(poll, CONFIG.POLL_INTERVAL);

    }
    
    updateConnectionState(uwbStatus) {
        // UWB is "ranging" when status is "Ranging" or "Mixed"
        const newState = (uwbStatus === "Ranging" || uwbStatus === "Mixed");
        
        if (newState !== this.previousRangingState) {
            this.logStateChange(newState, uwbStatus);
            
            if (newState) {
                this.onRanging();
            } else {
                this.onInactive();
            }
            
            this.previousRangingState = newState;
            this.uwbStatus = uwbStatus;
        }
    }
    
    logStateChange(newState, uwbStatus) {
        const oldState = this.previousRangingState ? 'Ranging' : 'Inactive';
        const currentState = newState ? 'Ranging' : 'Inactive';
    }
    
    onRanging() {
        this.isRanging = true;
        this.animations.pulse = true;
        this.animations.waves = true;
        
        this.updateUI('RANGING', 'status-ranging');
        dataPanel.addEntry('UWB Icon', 'Status', 'Inactive', 'Ranging');
        this.drawUWBIcon();
    }
    
    onInactive() {
        this.isRanging = false;
        this.animations.pulse = false;
        this.animations.waves = false;
        this.animTime = 0;
        
        this.updateUI('NA', 'status-na');
        dataPanel.addEntry('UWB Icon', 'Status', 'Ranging', 'Inactive');
        this.drawUWBIcon();
    }
    
    updateUI(text, className) {
        this.statusText.textContent = text;
        this.statusText.className = `icon-status-label ${className}`;
        // Toggle 'active' class for CSS animations (signal waves)
        if (this.isRanging) {
            this.statusCard.classList.add('active');
        } else {
            this.statusCard.classList.remove('active');
        }
    }
    
    // Manual control methods (for testing)
    forceRanging() {
        this.updateConnectionState("Ranging");
    }
    
    forceInactive() {
        this.updateConnectionState("NA");
    }
    
    // Legacy compatibility methods
    setActive(active) {
        active ? this.forceRanging() : this.forceInactive();
    }
    
    playRangingAnimation() {
        this.forceRanging();
        this.flashStatusCard();
    }
    
    playInactiveAnimation() {
        this.forceInactive();
    }
    
    flashStatusCard() {
        this.statusCard.style.animation = 'none';
        setTimeout(() => {
            this.statusCard.style.animation = 'pulse-uwb 0.5s ease-out 3';
        }, 10);
    }
    
    // Cleanup method
    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
}

// Export singleton instance
export const UWBIconPanel = new UWBIconPanelManager();

// Keyboard controls for testing
document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'r') {
        UWBIconPanel.forceRanging();
    } else if (key === 't') {
        UWBIconPanel.forceInactive();
    }
});