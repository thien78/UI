// static/uwb_icon_panel.js - UWB Icon rendered in panel with ranging status
import { dataPanel } from './panel.js';

console.log("========================================");
console.log("[UWB Icon Panel] Module loading...");
console.log("========================================");

class UWBIconPanelManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.statusCard = null;
        this.statusText = null;
        
        // State tracking - 4 states: Ranging, Mixed, NA, CPD
        this.currentState = "NA"; // Default state like BLE "Disconnected"
        this.previousState = "NA";
        
        // Animation states and parameters (matching BLE)
        this.animations = {
            pulse: false,
            waves: false
        };
        this.animTime = 0;
        this.pulseSpeed = 1.5;
        this.animationFrameId = null;
        
        setTimeout(() => {
            console.log("[UWB Icon Panel] Initializing UWB icon in panel...");
            this.init();
            this.startConnectionPolling(); // Start polling UWB status
        }, 500);
    }
    
    init() {
        // Get canvas element
        this.canvas = document.getElementById('uwb-icon-canvas');
        this.statusCard = document.getElementById('uwb-status-card');
        this.statusText = document.getElementById('uwb-status-text');
        
        if (!this.canvas) {
            console.error("[UWB Icon Panel] Canvas not found!");
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Draw initial icon (NA state)
        this.drawUWBIcon();
        
        // Start animation
        this.startAnimation();
        
        console.log("[UWB Icon Panel] ✅ UWB icon initialized in panel (NA)");
    }
    
    drawUWBIcon() {
        if (!this.ctx) return;
        
        const size = this.canvas.width;
        const center = size / 2;
        
        // Calculate pulse scale for Ranging/Mixed states (matching BLE logic)
        let pulseScale = 1.0;
        const isActive = (this.currentState === "Ranging" || this.currentState === "Mixed");
        if (isActive && this.animations.pulse) {
            pulseScale = 1 + Math.sin(this.animTime * this.pulseSpeed) * 0.1; // 10% pulse amplitude
        }
        
        // Clear canvas
        this.ctx.clearRect(0, 0, size, size);
        
        // Save context for pulse transformation
        this.ctx.save();
        this.ctx.translate(center, center);
        this.ctx.scale(pulseScale, pulseScale);
        this.ctx.translate(-center, -center);
        
        // Draw background circle with gradient
        const gradient = this.ctx.createRadialGradient(center, center, 0, center, center, center * 0.92);
        
        if (isActive) {
            // Ranging/Mixed: Green gradient (matching BLE connected)
            gradient.addColorStop(0, '#1a5f3a');
            gradient.addColorStop(0.7, '#0d4024');
            gradient.addColorStop(1, '#0a1e1a');
        } else {
            // NA/CPD: Gray gradient (matching BLE disconnected)
            gradient.addColorStop(0, '#3a3a3a');
            gradient.addColorStop(0.7, '#2a2a2a');
            gradient.addColorStop(1, '#1a1a1a');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(center, center, center * 0.92, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw border with color change based on state
        this.ctx.strokeStyle = isActive ? '#00ff00' : '#666666';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(center, center, center * 0.88, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw UWB logo (radio waves)
        this.ctx.save();
        this.ctx.translate(center, center);
        
        this.ctx.fillStyle = isActive ? '#FFFFFF' : '#888888';
        this.ctx.strokeStyle = isActive ? '#FFFFFF' : '#888888';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        if (isActive) {
            // Enhanced pulsing glow when ranging (matching BLE)
            const glowIntensity = 6 + Math.sin(this.animTime * 2) * 2; // Pulsing glow effect
            this.ctx.shadowColor = '#00ff00';
            this.ctx.shadowBlur = glowIntensity;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
        }
        
        // Center dot
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw waves only for Ranging/Mixed states
        if (isActive && this.animations.waves) {
            // Left waves (3 arcs)
            for (let i = 1; i <= 3; i++) {
                const radius = 7 * i;
                const startAngle = Math.PI * 1.1;
                const endAngle = Math.PI * 1.9;
                
                this.ctx.beginPath();
                this.ctx.arc(0, 0, radius, startAngle, endAngle);
                this.ctx.stroke();
            }
            
            // Right waves (3 arcs)
            for (let i = 1; i <= 3; i++) {
                const radius = 7 * i;
                const startAngle = Math.PI * 0.1;
                const endAngle = Math.PI * 0.9;
                
                this.ctx.beginPath();
                this.ctx.arc(0, 0, radius, startAngle, endAngle);
                this.ctx.stroke();
            }
        }
        
        // State text
        if (isActive) {
            this.ctx.shadowBlur = 2;
            this.ctx.font = 'bold 8px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.currentState, 0, 28);
        }
        
        this.ctx.restore(); // Restore from logo translation
        this.ctx.restore(); // Restore from pulse scale
    }
    
    startAnimation() {
        const animate = () => {
            // Only increment time when in active state (matching BLE logic)
            const isActive = (this.currentState === "Ranging" || this.currentState === "Mixed");
            if (isActive) {
                this.animTime += 0.016; // ~60fps
            }
            
            this.drawUWBIcon();
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    startConnectionPolling() {
        const pollInterval = 576; // Same as BLE
        
        const poll = async () => {
            try {
                const response = await fetch('/api/connection');
                const connectionData = await response.json();
                const uwbStatus = connectionData.uwb_status; // "Ranging", "Mixed", "NA", or "CPD"
                
                this.updateConnectionState(uwbStatus);
                
            } catch (error) {
                if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
                    return; // Server not available, silent fail
                }
                console.error("[UWB Icon Panel] Error fetching connection status:", error);
            }
        };
        
        // Poll immediately and then at intervals
        poll();
        setInterval(poll, pollInterval);
        
        console.log("[UWB Icon Panel] 📡 Connection polling started");
    }
    
    updateConnectionState(uwbStatus) {
        // Only update when state changes (matching BLE logic)
        if (uwbStatus !== this.previousState) {
            console.log(`[UWB Icon Panel] 🔄 UWB Status changed: ${this.previousState} → ${uwbStatus}`);
            
            // Handle state transitions
            if (uwbStatus === "Ranging") {
                this.onRanging();
            } else if (uwbStatus === "Mixed") {
                this.onMixed();
            } else if (uwbStatus === "NA") {
                this.onNA();
            } else if (uwbStatus === "CPD") {
                this.onCPD();
            }
            
            this.previousState = uwbStatus;
        }
    }
    
    onRanging() {
        console.log("[UWB Icon Panel] ✅ UWB RANGING - Activating animations!");
        this.currentState = "Ranging";
        
        // Enable all animations (matching BLE logic)
        this.animations.pulse = true;
        this.animations.waves = true;
        
        // Update UI
        this.statusText.textContent = 'Ranging';
        this.statusText.className = 'icon-status-label status-ranging';
        
        // Add active class for CSS animations
        this.statusCard.classList.add('active');
        
        // Log to data panel
        dataPanel.addEntry('UWB Icon', 'State', this.previousState, 'Ranging');
        
        this.drawUWBIcon();
    }
    
    onMixed() {
        console.log("[UWB Icon Panel] ✅ UWB MIXED - Activating animations!");
        this.currentState = "Mixed";
        
        // Enable all animations (matching BLE logic)
        this.animations.pulse = true;
        this.animations.waves = true;
        
        // Update UI
        this.statusText.textContent = 'Mixed';
        this.statusText.className = 'icon-status-label status-mixed';
        
        // Add active class for CSS animations
        this.statusCard.classList.add('active');
        
        // Log to data panel
        dataPanel.addEntry('UWB Icon', 'State', this.previousState, 'Mixed');
        
        this.drawUWBIcon();
    }
    
    onNA() {
        console.log("[UWB Icon Panel] ❌ UWB NA - Deactivating animations!");
        this.currentState = "NA";
        
        // Disable all animations (matching BLE logic)
        this.animations.pulse = false;
        this.animations.waves = false;
        
        // Reset animation time to prevent jump when reconnecting
        this.animTime = 0;
        
        // Update UI
        this.statusText.textContent = 'NA';
        this.statusText.className = 'icon-status-label status-na';
        
        // Remove active class for CSS animations
        this.statusCard.classList.remove('active');
        
        // Log to data panel
        dataPanel.addEntry('UWB Icon', 'State', this.previousState, 'NA');
        
        this.drawUWBIcon();
    }
    
    onCPD() {
        console.log("[UWB Icon Panel] ❌ UWB CPD - Deactivating animations!");
        this.currentState = "CPD";
        
        // Disable all animations (matching BLE logic)
        this.animations.pulse = false;
        this.animations.waves = false;
        
        // Reset animation time to prevent jump when reconnecting
        this.animTime = 0;
        
        // Update UI
        this.statusText.textContent = 'CPD';
        this.statusText.className = 'icon-status-label status-cpd';
        
        // Remove active class for CSS animations
        this.statusCard.classList.remove('active');
        
        // Log to data panel
        dataPanel.addEntry('UWB Icon', 'State', this.previousState, 'CPD');
        
        this.drawUWBIcon();
    }
    
    // Manual state control (for testing - matching BLE)
    forceRanging() {
        console.log("[UWB Icon Panel] 🧪 Force ranging (test mode)");
        this.updateConnectionState("Ranging");
    }
    
    forceMixed() {
        console.log("[UWB Icon Panel] 🧪 Force mixed (test mode)");
        this.updateConnectionState("Mixed");
    }
    
    forceNA() {
        console.log("[UWB Icon Panel] 🧪 Force NA (test mode)");
        this.updateConnectionState("NA");
    }
    
    forceCPD() {
        console.log("[UWB Icon Panel] 🧪 Force CPD (test mode)");
        this.updateConnectionState("CPD");
    }
    
    // Legacy methods for backward compatibility
    setActive(active) {
        if (active) {
            this.forceRanging();
        } else {
            this.forceNA();
        }
    }
    
    playRangingAnimation() {
        console.log("[UWB Icon Panel] 🎉 Ranging animation!");
        this.forceRanging();
        
        // Flash effect on status card
        this.statusCard.style.animation = 'none';
        setTimeout(() => {
            this.statusCard.style.animation = 'pulse-uwb 0.5s ease-out 3';
        }, 10);
    }
    
    playInactiveAnimation() {
        console.log("[UWB Icon Panel] ⚠️ Inactive animation");
        this.forceNA();
    }
}

export const UWBIconPanel = new UWBIconPanelManager();

// Keyboard controls for testing (matching BLE)
document.addEventListener('keydown', (event) => {
    switch(event.key.toLowerCase()) {
        case 'r':
            UWBIconPanel.forceRanging();
            break;
        case 'm':
            UWBIconPanel.forceMixed();
            break;
        case 'n':
            UWBIconPanel.forceNA();
            break;
        case 'p':
            UWBIconPanel.forceCPD();
            break;
    }
});

console.log("[UWB Icon Panel] ✅ UWB icon panel initialized (default: NA)");
console.log("[UWB Icon Panel] 🎮 Controls: R=Ranging | M=Mixed | N=NA | P=CPD");
console.log("[UWB Icon Panel] 📡 Polling /api/connection every 576ms for UWB status");