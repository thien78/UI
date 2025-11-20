// static/uwb_icon.js - UWB Icon with Connection-based Animation Control
import * as THREE from 'three';
import { gSceneManager } from './scene.js';
import { dataPanel } from './panel.js';

console.log("========================================");
console.log("[UWB Icon] Module loading...");
console.log("========================================");

class UWBIconManager {
    constructor() {
        this.iconGroup = null;
        this.billboardSprite = null;
        this.signalRings = [];
        
        // Connection state tracking
        this.isRanging = false;
        this.previousRangingState = false;
        this.uwbStatus = "NA";  // "NA", "Ranging", "CPD", "Mixed"
        
        // Animation states - START AS FALSE (inactive by default)
        this.animations = {
            pulse: false,
            rotate: false,
            float: false,
            signalWaves: false
        };
        
        // Animation parameters (SAME AS BLE)
        this.animTime = 0;
        this.pulseSpeed = 1.5;      // Same as BLE
        this.rotateSpeed = 0.3;     // Same as BLE
        this.floatSpeed = 0.8;      // Same as BLE
        this.floatAmplitude = 0.15; // Same as BLE
        this.baseY = 3.5; // Store base Y position
        
        setTimeout(() => {
            console.log("[UWB Icon] Creating UWB icon (default static state)...");
            this.createUWBIcon();
            this.createSignalRings();
            this.setFixedPosition();
            this.startAnimationLoop();
            this.startConnectionPolling();
        }, 1000);
    }
    
    createUWBIcon() {
        console.log("[UWB Icon] Creating icon...");
        
        try {
            this.iconGroup = new THREE.Group();
            
            // Create canvas with disconnected style (gray/muted)
            const canvas = this.createUWBCanvas(false); // false = not ranging
            const texture = new THREE.CanvasTexture(canvas);
            
            const spriteMaterial = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthTest: true,
                depthWrite: false
            });
            
            this.billboardSprite = new THREE.Sprite(spriteMaterial);
            this.billboardSprite.scale.set(0.8, 0.8, 1);
            
            this.iconGroup.add(this.billboardSprite);
            this.iconGroup.visible = true;
            
            gSceneManager.scene.add(this.iconGroup);
            
            console.log("[UWB Icon] ✅ Static UWB icon created (not ranging state)");
            
        } catch (error) {
            console.error("[UWB Icon] ❌ ERROR:", error);
        }
    }
    
    createUWBCanvas(isRanging = false) {
        const canvas = document.createElement('canvas');
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        const center = size / 2;
        
        // Clear canvas
        ctx.clearRect(0, 0, size, size);
        
        // ===== NỀN TRÒN với GRADIENT - màu thay đổi theo ranging =====
        const gradient = ctx.createRadialGradient(center, center, 0, center, center, center * 0.92);
        
        if (isRanging) {
            // Ranging: Green gradient (active)
            gradient.addColorStop(0, '#1a5f3a');
            gradient.addColorStop(0.7, '#0d4024');
            gradient.addColorStop(1, '#0a1e1a');
        } else {
            // Not Ranging: Gray/muted gradient
            gradient.addColorStop(0, '#3a3a3a');
            gradient.addColorStop(0.7, '#2a2a2a');
            gradient.addColorStop(1, '#1a1a1a');
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(center, center, center * 0.92, 0, Math.PI * 2);
        ctx.fill();
        
        // ===== VIỀN SÁNG - màu thay đổi theo ranging =====
        ctx.strokeStyle = isRanging ? '#00ff00' : '#666666';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(center, center, center * 0.88, 0, Math.PI * 2);
        ctx.stroke();
        
        // ===== VẼ LOGO UWB =====
        ctx.save();
        ctx.translate(center, center);
        
        // Logo color based on ranging
        ctx.fillStyle = isRanging ? '#FFFFFF' : '#888888';
        ctx.strokeStyle = isRanging ? '#FFFFFF' : '#888888';
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // ===== SHADOW ĐỂ NỔI BẬT HƠN - chỉ khi ranging =====
        if (isRanging) {
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
        
        // ===== VẼ LOGO UWB (Radio waves + dot) =====
        const logoSize = 180;
        
        // Center dot
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Left waves (3 arcs)
        for (let i = 1; i <= 3; i++) {
            const radius = 40 * i;
            const startAngle = Math.PI * 1.1;
            const endAngle = Math.PI * 1.9;
            
            ctx.beginPath();
            ctx.arc(0, 0, radius, startAngle, endAngle);
            ctx.stroke();
        }
        
        // Right waves (3 arcs)
        for (let i = 1; i <= 3; i++) {
            const radius = 40 * i;
            const startAngle = Math.PI * 0.1;
            const endAngle = Math.PI * 0.9;
            
            ctx.beginPath();
            ctx.arc(0, 0, radius, startAngle, endAngle);
            ctx.stroke();
        }
        
        // UWB text below (optional)
        if (isRanging) {
            ctx.shadowBlur = 5;
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('UWB', 0, 160);
        }
        
        ctx.restore();
        
        console.log(`[UWB Icon] ✅ UWB logo created (${isRanging ? 'Ranging' : 'Not Ranging'} style)`);
        return canvas;
    }
    
    createSignalRings() {
        // Tạo 3 vòng tròn sóng tín hiệu xung quanh icon
        const ringCount = 3;
        
        for (let i = 0; i < ringCount; i++) {
            const geometry = new THREE.RingGeometry(0.5, 0.6, 32);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ff00,  // Green for UWB
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            
            const ring = new THREE.Mesh(geometry, material);
            ring.lookAt(gSceneManager.camera.position);
            
            this.signalRings.push({
                mesh: ring,
                initialDelay: i * 0.8,
                scale: 1.0
            });
            
            this.iconGroup.add(ring);
        }
        
        console.log("[UWB Icon] ✅ Signal rings created (inactive)");
    }
    
    startAnimationLoop() {
        this.updateAnimations();
        console.log("[UWB Icon] ✅ Animation loop started (waiting for ranging)");
    }
    
    updateAnimations() {
        requestAnimationFrame(() => this.updateAnimations());
        
        // Chỉ increment time khi có animation nào đó active
        if (this.isRanging) {
            this.animTime += 0.016; // ~60fps
        }
        
        if (!this.iconGroup) return;
        
        // 1. PULSE ANIMATION (SAME AS BLE)
        if (this.animations.pulse && this.billboardSprite) {
            const pulseScale = 1 + Math.sin(this.animTime * this.pulseSpeed) * 0.1;  // 10% like BLE
            this.billboardSprite.scale.set(0.8 * pulseScale, 0.8 * pulseScale, 1);
        } else if (this.billboardSprite) {
            this.billboardSprite.scale.set(0.8, 0.8, 1);
        }
        
        // 2. ROTATE ANIMATION (SAME AS BLE)
        if (this.animations.rotate) {
            this.iconGroup.rotation.y = Math.sin(this.animTime * this.rotateSpeed) * 0.2;  // Same as BLE
        } else {
            this.iconGroup.rotation.y = 0;
        }
        
        // 3. FLOAT ANIMATION
        if (this.animations.float) {
            const floatOffset = Math.sin(this.animTime * this.floatSpeed) * this.floatAmplitude;
            this.iconGroup.position.y = this.baseY + floatOffset;
        } else {
            this.iconGroup.position.y = this.baseY;
        }
        
        // 4. SIGNAL WAVES ANIMATION (SAME AS BLE)
        if (this.animations.signalWaves) {
            this.signalRings.forEach((ringData, index) => {
                const ring = ringData.mesh;
                const phase = (this.animTime + ringData.initialDelay) % 3.0;
                
                if (phase < 2.0) {
                    const progress = phase / 2.0;
                    ring.scale.set(1 + progress * 1.5, 1 + progress * 1.5, 1);  // 1.5x like BLE
                    ring.material.opacity = (1 - progress) * 0.6;  // 0.6 like BLE
                } else {
                    ring.scale.set(1, 1, 1);
                    ring.material.opacity = 0;
                }
                ring.lookAt(gSceneManager.camera.position);
            });
        } else {
            this.signalRings.forEach((ringData) => {
                ringData.mesh.material.opacity = 0;
                ringData.mesh.scale.set(1, 1, 1);
            });
        }
        
        // 5. OPACITY PULSE (SAME AS BLE)
        if (this.billboardSprite && this.isRanging) {
            const opacityPulse = 0.9 + Math.sin(this.animTime * 2) * 0.1;  // Same as BLE
            this.billboardSprite.material.opacity = opacityPulse;
        } else if (this.billboardSprite) {
            this.billboardSprite.material.opacity = 0.7;
        }
    }
    
    setFixedPosition() {
        // Different position from BLE icon
        const x = -1.5;  // Left side (opposite of BLE)
        const y = this.baseY;
        const z = -1.5;
        
        this.iconGroup.position.set(x, y, z);
        
        console.log("========================================");
        console.log("[UWB Icon] Position set (static mode)");
        console.log(`[UWB Icon] Position: (${x}, ${y}, ${z})`);
        console.log("========================================");
    }
    
    // ===== CONNECTION HANDLING =====
    
    startConnectionPolling() {
        setInterval(() => {
            this.fetchUWBConnectionStatus();
        }, 576);
        
        console.log("[UWB Icon] 🔄 Started polling UWB connection status (576ms interval)");
    }
    
    async fetchUWBConnectionStatus() {
        try {
            const response = await fetch('/api/connection');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const connectionData = await response.json();
            const uwbStatus = connectionData.UwbStatus; // "NA", "Ranging", "CPD", "Mixed"
            
            this.updateConnectionState(uwbStatus);
            
        } catch (error) {
            if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
                return;
            }
            console.error("[UWB Icon] Error fetching connection status:", error);
        }
    }
    
    updateConnectionState(uwbStatus) {
        // UWB is "ranging" when status is "Ranging" or "Mixed"
        const newState = (uwbStatus === "Ranging" || uwbStatus === "Mixed");
        
        // Only update when state changes
        if (newState !== this.previousRangingState) {
            console.log(`[UWB Icon] 🔄 UWB Status changed: ${this.previousRangingState ? 'Ranging' : 'Not Ranging'} → ${newState ? 'Ranging' : 'Not Ranging'} (${uwbStatus})`);
            
            if (newState) {
                this.onRanging();
            } else {
                this.onNotRanging();
            }
            
            this.previousRangingState = newState;
            this.uwbStatus = uwbStatus;
        }
    }
    
    onRanging() {
        console.log("[UWB Icon] ✅ UWB RANGING - Activating animations!");
        this.isRanging = true;
        
        // Update icon appearance to ranging style
        const newCanvas = this.createUWBCanvas(true);
        const newTexture = new THREE.CanvasTexture(newCanvas);
        this.billboardSprite.material.map = newTexture;
        this.billboardSprite.material.needsUpdate = true;
        
        // Enable all animations
        this.animations.pulse = true;
        this.animations.rotate = true;
        this.animations.float = true;
        this.animations.signalWaves = true;
        
        // Log to data panel
        dataPanel.addEntry('UWB Icon', 'Status', 'Not Ranging', 'Ranging');
        
        // Play ranging animation effect
        //this.playRangingAnimation();
    }
    
    onNotRanging() {
        console.log("[UWB Icon] ❌ UWB NOT RANGING - Deactivating animations!");
        this.isRanging = false;
        
        // Update icon appearance to not ranging style
        const newCanvas = this.createUWBCanvas(false);
        const newTexture = new THREE.CanvasTexture(newCanvas);
        this.billboardSprite.material.map = newTexture;
        this.billboardSprite.material.needsUpdate = true;
        
        // Disable all animations
        this.animations.pulse = false;
        this.animations.rotate = false;
        this.animations.float = false;
        this.animations.signalWaves = false;
        
        // Reset animation time
        this.animTime = 0;
        
        // Log to data panel
        dataPanel.addEntry('UWB Icon', 'Status', 'Ranging', 'Not Ranging');
        
        // Play not ranging animation effect
        //this.playNotRangingAnimation();
    }
    
    // ===== CONTROL METHODS =====
    
    toggleAnimation(animationType) {
        if (this.animations.hasOwnProperty(animationType)) {
            this.animations[animationType] = !this.animations[animationType];
            console.log(`[UWB Icon] ${animationType}: ${this.animations[animationType] ? 'ON' : 'OFF'}`);
            dataPanel.addEntry('UWB Icon', `Animation ${animationType}`, 
                !this.animations[animationType] ? 'On' : 'Off',
                this.animations[animationType] ? 'On' : 'Off'
            );
        }
    }
    
    setAnimationSpeed(type, speed) {
        switch(type) {
            case 'pulse':
                this.pulseSpeed = speed;
                break;
            case 'rotate':
                this.rotateSpeed = speed;
                break;
            case 'float':
                this.floatSpeed = speed;
                break;
        }
        console.log(`[UWB Icon] ${type} speed: ${speed}`);
    }
    
    // playRangingAnimation() {
    //     console.log("[UWB Icon] 🎉 Playing ranging animation!");
        
    //     // Flash effect (SAME AS BLE)
    //     if (this.billboardSprite) {
    //         gsap.to(this.billboardSprite.material, {
    //             opacity: 0.2,
    //             duration: 0.1,
    //             yoyo: true,
    //             repeat: 5,
    //             ease: "power2.inOut",
    //             onComplete: () => {
    //                 this.billboardSprite.material.opacity = 1.0;
    //             }
    //         });
            
    //         // Expand effect (SAME AS BLE)
    //         gsap.to(this.billboardSprite.scale, {
    //             x: 1.2,
    //             y: 1.2,
    //             duration: 0.3,
    //             yoyo: true,
    //             repeat: 1,
    //             ease: "elastic.out(1, 0.3)",
    //             onComplete: () => {
    //                 this.billboardSprite.scale.set(0.8, 0.8, 1);
    //             }
    //         });
    //     }
        
    //     // Signal rings burst (SAME AS BLE)
    //     this.signalRings.forEach((ringData, index) => {
    //         gsap.to(ringData.mesh.material, {
    //             opacity: 0.8,
    //             duration: 0.5,
    //             delay: index * 0.1
    //         });
    //         gsap.to(ringData.mesh.scale, {
    //             x: 3,
    //             y: 3,
    //             duration: 1.0,
    //             delay: index * 0.1,
    //             ease: "power2.out",
    //             onComplete: () => {
    //                 ringData.mesh.scale.set(1, 1, 1);
    //                 ringData.mesh.material.opacity = 0;
    //             }
    //         });
    //     });
    // }
    
    // playNotRangingAnimation() {
    //     console.log("[UWB Icon] ⚠️ Playing not ranging animation");
        
    //     if (this.billboardSprite) {
    //         // Fade and shrink effect
    //         gsap.to(this.billboardSprite.material, {
    //             opacity: 0.3,
    //             duration: 0.5,
    //             onComplete: () => {
    //                 this.billboardSprite.material.opacity = 0.7;
    //             }
    //         });
            
    //         gsap.to(this.billboardSprite.scale, {
    //             x: 0.6,
    //             y: 0.6,
    //             duration: 0.5,
    //             ease: "power2.in",
    //             onComplete: () => {
    //                 this.billboardSprite.scale.set(0.8, 0.8, 1);
    //             }
    //         });
    //     }
        
    //     // Hide signal rings immediately
    //     this.signalRings.forEach((ringData) => {
    //         gsap.to(ringData.mesh.material, {
    //             opacity: 0,
    //             duration: 0.3
    //         });
    //     });
    // }
    
    // Manual connection control (for testing)
    forceRanging() {
        console.log("[UWB Icon] 🧪 Force ranging (test mode)");
        this.updateConnectionState("Ranging");
    }
    
    forceNotRanging() {
        console.log("[UWB Icon] 🧪 Force not ranging (test mode)");
        this.updateConnectionState("NA");
    }
}

export const UWBIcon = new UWBIconManager();

// ===== KEYBOARD CONTROLS (for testing) =====
document.addEventListener('keydown', (event) => {
    switch(event.key.toLowerCase()) {
        case 'u':
            UWBIcon.toggleAnimation('pulse');
            break;
        case 'i':
            UWBIcon.toggleAnimation('rotate');
            break;
        case 'o':
            UWBIcon.toggleAnimation('float');
            break;
        case 'p':
            UWBIcon.toggleAnimation('signalWaves');
            break;
        case 'r':
            // Test: force ranging
            UWBIcon.forceRanging();
            break;
        case 't':
            // Test: force not ranging
            UWBIcon.forceNotRanging();
            break;
    }
});

console.log("[UWB Icon] ✅ UWB Icon initialized (default: static/not ranging)");
console.log("[UWB Icon] 🎮 Controls: U=Pulse | I=Rotate | O=Float | P=Waves | R=Force Ranging | T=Force Not Ranging");
console.log("[UWB Icon] 📡 Polling /api/connection every 576ms for UWB status");
console.log("[UWB Icon] 📍 Position: Left side (-1.0, 3.5, 1.0)");