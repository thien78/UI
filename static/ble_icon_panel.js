/**
 * BLE Icon Panel Manager
 * Manages BLE connection status display and animations in the panel
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
    CONNECTED: {
        GRADIENT: ['#1a3a5f', '#0d2440', '#0a1e3d'],
        BORDER: '#4a90e2',
        LOGO: '#FFFFFF',
        GLOW: '#4a90e2'
    },
    DISCONNECTED: {
        GRADIENT: ['#3a3a3a', '#2a2a2a', '#1a1a1a'],
        BORDER: '#666666',
        LOGO: '#888888'
    }
};

const BLUETOOTH_LOGO = {
    HEIGHT: 40,
    WIDTH: 14,
    LINE_WIDTH: 4
};

class BLEIconPanelManager {
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
        this.isConnected = false;
        this.previousConnectionState = false;
        
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
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.drawBLEIcon();
        this.startAnimation();
        
    }
    
    initializeElements() {
        this.canvas = document.getElementById('ble-icon-canvas');
        this.statusCard = document.getElementById('ble-status-card');
        this.statusText = document.getElementById('ble-status-text');
        return this.canvas !== null;
    }
    
    drawBLEIcon() {
        if (!this.ctx) return;
        
        const size = this.canvas.width;
        const center = size / 2;
        const pulseScale = this.calculatePulseScale();
        
        this.clearCanvas(size);
        this.applyPulseTransform(center, pulseScale);
        this.drawBackground(center);
        this.drawBorder(center);
        this.drawBluetoothLogo(center);
        this.ctx.restore();
    }
    
    calculatePulseScale() {
        if (!this.isConnected || !this.animations.pulse) return 1.0;
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
        const colors = this.isConnected ? COLORS.CONNECTED.GRADIENT : COLORS.DISCONNECTED.GRADIENT;
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
        this.ctx.strokeStyle = this.isConnected ? COLORS.CONNECTED.BORDER : COLORS.DISCONNECTED.BORDER;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(center, center, center * 0.88, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    drawBluetoothLogo(center) {
        this.ctx.save();
        this.ctx.translate(center, center);
        
        const colors = this.isConnected ? COLORS.CONNECTED : COLORS.DISCONNECTED;
        this.ctx.fillStyle = colors.LOGO;
        this.ctx.strokeStyle = colors.LOGO;
        this.ctx.lineWidth = BLUETOOTH_LOGO.LINE_WIDTH;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        if (this.isConnected) {
            this.applyGlowEffect();
        }
        
        this.drawLogoShape();
        this.ctx.restore();
    }
    
    applyGlowEffect() {
        const glowIntensity = CONFIG.GLOW_BASE + Math.sin(this.animTime * 2) * CONFIG.GLOW_AMPLITUDE;
        this.ctx.shadowColor = COLORS.CONNECTED.GLOW;
        this.ctx.shadowBlur = glowIntensity;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }
    
    drawLogoShape() {
        const { HEIGHT, WIDTH } = BLUETOOTH_LOGO;
        const halfHeight = HEIGHT / 2;
        
        // Vertical line
        this.drawLine(0, -halfHeight, 0, halfHeight);
        
        // Upper triangle
        this.drawTriangle(0, -halfHeight, WIDTH, -halfHeight/3, -WIDTH, halfHeight/3);
        
        // Lower triangle
        this.drawTriangle(0, halfHeight, WIDTH, halfHeight/3, -WIDTH, -halfHeight/3);
    }
    
    drawLine(x1, y1, x2, y2) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }
    
    drawTriangle(x1, y1, x2, y2, x3, y3) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineTo(x3, y3);
        this.ctx.stroke();
    }
    
    startAnimation() {
        const frameTime = 1000 / CONFIG.ANIMATION_FPS / 1000; // Convert to seconds
        
        const animate = () => {
            if (this.isConnected) {
                this.animTime += frameTime;
            }
            
            this.drawBLEIcon();
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
                this.updateConnectionState(data.BleStatus);
            } catch (error) {
                if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
                    return; // Server unavailable - silent fail
                }
            }
        };
        
        poll();
        setInterval(poll, CONFIG.POLL_INTERVAL);
        
    }
    
    updateConnectionState(bleStatus) {
        const newState = (bleStatus === "Connected");
        
        if (newState !== this.previousConnectionState) {
            this.logStateChange(newState);
            
            if (newState) {
                this.onConnected();
            } else {
                this.onDisconnected();
            }
            
            this.previousConnectionState = newState;
        }
    }
    
    logStateChange(newState) {
        const oldState = this.previousConnectionState ? 'Connected' : 'Disconnected';
        const currentState = newState ? 'Connected' : 'Disconnected';
    }
    
    onConnected() {
        this.isConnected = true;
        this.animations.pulse = true;
        this.animations.waves = true;
        
        this.updateUI('Connected', 'status-connected');
        dataPanel.addEntry('BLE Icon', 'Connection', 'Disconnected', 'Connected');
        this.drawBLEIcon();
    }
    
    onDisconnected() {
        this.isConnected = false;
        this.animations.pulse = false;
        this.animations.waves = false;
        this.animTime = 0;
        
        this.updateUI('Disconnected', 'status-disconnected');
        dataPanel.addEntry('BLE Icon', 'Connection', 'Connected', 'Disconnected');
        this.drawBLEIcon();
    }
    
    updateUI(text, className) {
        this.statusText.textContent = text;
        this.statusText.className = `icon-status-label ${className}`;
        // Toggle 'active' class for CSS animations (signal waves)
        if (this.isConnected) {
            this.statusCard.classList.add('active');
        } else {
            this.statusCard.classList.remove('active');
        }
    }
    
    // Manual control methods (for testing)
    forceConnect() {
        this.updateConnectionState("Connected");
    }
    
    forceDisconnect() {
        this.updateConnectionState("Disconnected");
    }
    
    // Legacy compatibility methods
    setActive(active) {
        active ? this.forceConnect() : this.forceDisconnect();
    }
    
    playConnectedAnimation() {
        this.forceConnect();
        this.flashStatusCard();
    }
    
    playDisconnectedAnimation() {
        this.forceDisconnect();
    }
    
    flashStatusCard() {
        this.statusCard.style.animation = 'none';
        setTimeout(() => {
            this.statusCard.style.animation = 'pulse-ble 0.5s ease-out 3';
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
export const BLEIconPanel = new BLEIconPanelManager();

// Keyboard controls for testing
document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'c') {
        BLEIconPanel.forceConnect();
    } else if (key === 'x') {
        BLEIconPanel.forceDisconnect();
    }
});