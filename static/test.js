// // static/ble_icon.js - Correct Bluetooth Icon
// import * as THREE from 'three';
// import { gSceneManager } from './scene.js';
// import { dataPanel } from './panel.js';

// console.log("========================================");
// console.log("[BLE Icon] Module loading...");
// console.log("========================================");

// class BLEIconManager {
//     constructor() {
//         this.iconGroup = null;
//         this.billboardSprite = null;
        
//         setTimeout(() => {
//             console.log("[BLE Icon] Creating clean billboard BLE icon...");
//             this.createBLEIcon();
//             this.setFixedPosition();
//         }, 1000);
//     }
    
//     createBLEIcon() {
//         console.log("[BLE Icon] Creating icon...");
        
//         try {
//             this.iconGroup = new THREE.Group();
            
//             const canvas = this.createBLECanvas();
//             const texture = new THREE.CanvasTexture(canvas);
            
//             const spriteMaterial = new THREE.SpriteMaterial({
//                 map: texture,
//                 transparent: true,
//                 depthTest: true,
//                 depthWrite: false
//             });
            
//             this.billboardSprite = new THREE.Sprite(spriteMaterial);
//             this.billboardSprite.scale.set(0.8, 0.8, 1);
            
//             this.iconGroup.add(this.billboardSprite);
//             this.iconGroup.visible = true;
            
//             gSceneManager.scene.add(this.iconGroup);
            
//             console.log("[BLE Icon] ✅ Correct Bluetooth icon created");
            
//         } catch (error) {
//             console.error("[BLE Icon] ❌ ERROR:", error);
//         }
//     }
    
//     createBLECanvas() {
//         const canvas = document.createElement('canvas');
//         const size = 512;
//         canvas.width = size;
//         canvas.height = size;
        
//         const ctx = canvas.getContext('2d');
//         const center = size / 2;
        
//         // Clear canvas
//         ctx.clearRect(0, 0, size, size);
        
//         // ===== NỀN XANH TRÒN =====
//         ctx.fillStyle = '#0A1E3D';
//         ctx.beginPath();
//         ctx.arc(center, center, center * 0.92, 0, Math.PI * 2);
//         ctx.fill();
        
//         // ===== VẼ LOGO BLUETOOTH ĐÚNG =====
//         ctx.save();
//         ctx.translate(center, center);
        
//         ctx.fillStyle = '#FFFFFF';
//         ctx.strokeStyle = '#FFFFFF';
//         ctx.lineWidth = 24;
//         ctx.lineCap = 'round';
//         ctx.lineJoin = 'round';

//         // // ===== HOẶC THÊM SHADOW ĐỂ NỔI BẬT HƠN =====
//         // ctx.shadowColor = '#FFFFFF';
//         // ctx.shadowBlur = 8;  // Hiệu ứng phát sáng
//         // ctx.shadowOffsetX = 0;
//         // ctx.shadowOffsetY = 0;
        
//         // Kích thước logo
//         const height = 240;
//         const width = 84;
//         const halfHeight = height / 2;
//         // ===== ĐƯỜNG THẲNG DỌC GIỮA =====
//         ctx.beginPath();
//         ctx.moveTo(0, -halfHeight);
//         ctx.lineTo(0, halfHeight);
//         ctx.stroke();
//         // ===== TAM GIÁC TRÊN BÊN PHẢI =====
//         ctx.beginPath();
//         ctx.moveTo(0, -halfHeight);      // Đỉnh trên
//         ctx.lineTo(width, -halfHeight/3); // Góc phải giữa trên
//         ctx.lineTo(0, 0);                 // Về trung tâm
//         ctx.closePath();
//         ctx.stroke();
//         // ===== TAM GIÁC DƯỚI BÊN PHẢI =====
//         ctx.beginPath();
//         ctx.moveTo(0, halfHeight);        // Đỉnh dưới
//         ctx.lineTo(width, halfHeight/3);  // Góc phải giữa dưới
//         ctx.lineTo(0, 0);                 // Về trung tâm
//         ctx.closePath();
//         ctx.stroke();
//         // ===== GẠCH TRÊN BÊN TRÁI =====
//         ctx.beginPath();
//         ctx.lineTo(-width, -halfHeight/3); // Góc trái giữa trên
//         ctx.lineTo(0, 0);                  // Về trung tâm
//         ctx.closePath();
//         ctx.stroke();
//         // ===== GẠCH DƯỚI BÊN TRÁI =====
//         ctx.beginPath();
//         ctx.lineTo(-width, halfHeight/3);  // Góc trái giữa dưới
//         ctx.lineTo(0, 0);                  // Về trung tâm
//         ctx.closePath();
//         ctx.stroke();
        
//         ctx.restore();
        
//         console.log("[BLE Icon] ✅ Full Bluetooth logo with symmetry");
//         return canvas;
//     }
    
//     setFixedPosition() {
//         const x = 1.0;
//         const y = 3.0;
//         const z = 1.0;
        
//         this.iconGroup.position.set(x, y, z);
        
//         console.log("========================================");
//         console.log("[BLE Icon] Position set");
//         console.log("========================================");
//     }
// }

// export const BLEIcon = new BLEIconManager();

// console.log("[BLE Icon] Full Bluetooth icon initialized");

// static/ble_icon.js - BLE Icon with Connection-based Animation Control
import * as THREE from 'three';
import { gSceneManager } from './scene.js';
import { dataPanel } from './panel.js';

console.log("========================================");
console.log("[BLE Icon] Module loading...");
console.log("========================================");

class BLEIconManager {
    constructor() {
        this.iconGroup = null;
        this.billboardSprite = null;
        this.signalRings = [];
        
        // Connection state tracking
        this.isConnected = false;
        this.previousConnectionState = false;
        
        // Animation states - START AS FALSE (inactive by default)
        this.animations = {
            pulse: false,
            rotate: false,
            float: false,
            signalWaves: false
        };
        
        // Animation parameters
        this.animTime = 0;
        this.pulseSpeed = 1.5;
        this.rotateSpeed = 0.3;
        this.floatSpeed = 0.8;
        this.floatAmplitude = 0.15;
        this.baseY = 3.5; // Store base Y position
        
        setTimeout(() => {
            console.log("[BLE Icon] Creating BLE icon (default static state)...");
            this.createBLEIcon();
            this.createSignalRings();
            this.setFixedPosition();
            this.startAnimationLoop(); // Start loop but animations inactive
            this.startConnectionPolling(); // Start polling BLE status
        }, 1000);
    }
    
    createBLEIcon() {
        console.log("[BLE Icon] Creating icon...");
        
        try {
            this.iconGroup = new THREE.Group();
            
            // Create canvas with disconnected style (gray/red tone)
            const canvas = this.createBLECanvas(false); // false = disconnected state
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
            
            console.log("[BLE Icon] ✅ Static Bluetooth icon created (disconnected state)");
            
        } catch (error) {
            console.error("[BLE Icon] ❌ ERROR:", error);
        }
    }
    
    createBLECanvas(isConnected = false) {
        const canvas = document.createElement('canvas');
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        const center = size / 2;
        
        // Clear canvas
        ctx.clearRect(0, 0, size, size);
        
        // ===== NỀN XANH TRÒN với GRADIENT - màu thay đổi theo connection =====
        const gradient = ctx.createRadialGradient(center, center, 0, center, center, center * 0.92);
        
        if (isConnected) {
            // Connected: Blue gradient (vibrant)
            gradient.addColorStop(0, '#1a3a5f');
            gradient.addColorStop(0.7, '#0d2440');
            gradient.addColorStop(1, '#0a1e3d');
        } else {
            // Disconnected: Gray/red gradient (muted)
            gradient.addColorStop(0, '#3a3a3a');
            gradient.addColorStop(0.7, '#2a2a2a');
            gradient.addColorStop(1, '#1a1a1a');
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(center, center, center * 0.92, 0, Math.PI * 2);
        ctx.fill();
        
        // ===== VIỀN SÁNG - màu thay đổi theo connection =====
        ctx.strokeStyle = isConnected ? '#4a90e2' : '#ff4444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(center, center, center * 0.88, 0, Math.PI * 2);
        ctx.stroke();
        
        // ===== VẼ LOGO BLUETOOTH ĐÚNG =====
        ctx.save();
        ctx.translate(center, center);
        
        // Logo color based on connection
        ctx.fillStyle = isConnected ? '#FFFFFF' : '#888888';
        ctx.strokeStyle = isConnected ? '#FFFFFF' : '#888888';
        ctx.lineWidth = 24;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // ===== SHADOW ĐỂ NỔI BẬT HƠN - chỉ khi connected =====
        if (isConnected) {
            ctx.shadowColor = '#4a90e2';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
        
        // Kích thước logo
        const height = 240;
        const width = 84;
        const halfHeight = height / 2;
        
        // ===== ĐƯỜNG THẲNG DỌC GIỮA =====
        ctx.beginPath();
        ctx.moveTo(0, -halfHeight);
        ctx.lineTo(0, halfHeight);
        ctx.stroke();
        
        // ===== TAM GIÁC TRÊN BÊN PHẢI =====
        ctx.beginPath();
        ctx.moveTo(0, -halfHeight);      // Đỉnh trên
        ctx.lineTo(width, -halfHeight/3); // Góc phải giữa trên
        ctx.lineTo(-width, halfHeight/3);                 // Vẽ chéo
        ctx.stroke();
        
        // ===== TAM GIÁC DƯỚI BÊN PHẢI =====
        ctx.beginPath();
        ctx.moveTo(0, halfHeight);        // Đỉnh dưới
        ctx.lineTo(width, halfHeight/3);  // Góc phải giữa dưới
        ctx.lineTo(-width, -halfHeight/3);                 // Vẽ chéo
        ctx.stroke();

        if (isConnected) {
            ctx.shadowBlur = 5;
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('BLE', 0, 160);
        }
        
        ctx.restore();
        
        console.log(`[BLE Icon] ✅ Bluetooth logo created (${isConnected ? 'Connected' : 'Disconnected'} style)`);
        return canvas;
    }
    
    createSignalRings() {
        // Tạo 3 vòng tròn sóng tín hiệu xung quanh icon
        const ringCount = 3;
        
        for (let i = 0; i < ringCount; i++) {
            const geometry = new THREE.RingGeometry(0.5, 0.6, 32);
            const material = new THREE.MeshBasicMaterial({
                color: 0x4a90e2,
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            
            const ring = new THREE.Mesh(geometry, material);
            ring.lookAt(gSceneManager.camera.position);
            
            this.signalRings.push({
                mesh: ring,
                initialDelay: i * 0.8, // Delay giữa các ring
                scale: 1.0
            });
            
            this.iconGroup.add(ring);
        }
        
        console.log("[BLE Icon] ✅ Signal rings created (inactive)");
    }
    
    startAnimationLoop() {
        // Animation loop luôn chạy, nhưng chỉ update khi animations active
        this.updateAnimations();
        console.log("[BLE Icon] ✅ Animation loop started (waiting for connection)");
    }
    
    updateAnimations() {
        requestAnimationFrame(() => this.updateAnimations());
        
        // Chỉ increment time khi có animation nào đó active
        if (this.isConnected) {
            this.animTime += 0.016; // ~60fps
        }
        
        if (!this.iconGroup) return;
        
        // 1. PULSE ANIMATION - Icon phóng to thu nhỏ
        if (this.animations.pulse && this.billboardSprite) {
            const pulseScale = 1 + Math.sin(this.animTime * this.pulseSpeed) * 0.1;
            this.billboardSprite.scale.set(0.8 * pulseScale, 0.8 * pulseScale, 1);
        } else if (this.billboardSprite) {
            // Reset to default scale when not animating
            this.billboardSprite.scale.set(0.8, 0.8, 1);
        }
        
        // 2. ROTATE ANIMATION - Xoay nhẹ
        if (this.animations.rotate) {
            this.iconGroup.rotation.y = Math.sin(this.animTime * this.rotateSpeed) * 0.2;
        } else {
            // Reset to default rotation when not animating
            this.iconGroup.rotation.y = 0;
        }
        
        // 3. FLOAT ANIMATION - Bay lên xuống
        if (this.animations.float) {
            const floatOffset = Math.sin(this.animTime * this.floatSpeed) * this.floatAmplitude;
            this.iconGroup.position.y = this.baseY + floatOffset;
        } else {
            // Reset to base position when not animating
            this.iconGroup.position.y = this.baseY;
        }
        
        // 4. SIGNAL WAVES ANIMATION - Sóng tín hiệu lan tỏa
        if (this.animations.signalWaves) {
            this.signalRings.forEach((ringData, index) => {
                const ring = ringData.mesh;
                const phase = (this.animTime + ringData.initialDelay) % 3.0; // Chu kỳ 3 giây
                
                if (phase < 2.0) {
                    // Lan tỏa ra ngoài
                    const progress = phase / 2.0;
                    ring.scale.set(1 + progress * 1.5, 1 + progress * 1.5, 1);
                    ring.material.opacity = (1 - progress) * 0.6;
                } else {
                    // Reset
                    ring.scale.set(1, 1, 1);
                    ring.material.opacity = 0;
                }
                ring.lookAt(gSceneManager.camera.position);
            });
        } else {
            // Hide signal rings when not animating
            this.signalRings.forEach((ringData) => {
                ringData.mesh.material.opacity = 0;
                ringData.mesh.scale.set(1, 1, 1);
            });
        }
        
        // 5. OPACITY PULSE - Độ trong suốt nhấp nháy nhẹ (chỉ khi connected)
        if (this.billboardSprite && this.isConnected) {
            const opacityPulse = 0.9 + Math.sin(this.animTime * 2) * 0.1;
            this.billboardSprite.material.opacity = opacityPulse;
        } else if (this.billboardSprite) {
            // Full opacity when disconnected
            this.billboardSprite.material.opacity = 0.7;
        }
    }
    
    setFixedPosition() {
        const x = 1.5;
        const y = this.baseY;
        const z = 1.5;
        
        this.iconGroup.position.set(x, y, z);
        
        console.log("========================================");
        console.log("[BLE Icon] Position set (static mode)");
        console.log("========================================");
    }
    
    // ===== CONNECTION HANDLING =====
    
    startConnectionPolling() {
        // Poll BLE connection status every 576ms (288 * 2)
        setInterval(() => {
            this.fetchBLEConnectionStatus();
        }, 576);
        
        console.log("[BLE Icon] 🔄 Started polling BLE connection status (576ms interval)");
    }
    
    async fetchBLEConnectionStatus() {
        try {
            const response = await fetch('/api/connection');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const connectionData = await response.json();
            const bleStatus = connectionData.BleStatus; // "Connected" or "Disconnected"
            
            this.updateConnectionState(bleStatus);
            
        } catch (error) {
            if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
                return; // Server not available, silent fail
            }
            console.error("[BLE Icon] Error fetching connection status:", error);
        }
    }
    
    updateConnectionState(bleStatus) {
        const newState = (bleStatus === "Connected");
        
        // Chỉ update khi state thay đổi
        if (newState !== this.previousConnectionState) {
            console.log(`[BLE Icon] 🔄 BLE Status changed: ${this.previousConnectionState ? 'Connected' : 'Disconnected'} → ${newState ? 'Connected' : 'Disconnected'}`);
            
            if (newState) {
                this.onConnected();
            } else {
                this.onDisconnected();
            }
            
            this.previousConnectionState = newState;
        }
    }
    
    onConnected() {
        console.log("[BLE Icon] ✅ BLE CONNECTED - Activating animations!");
        this.isConnected = true;
        
        // Update icon appearance to connected style
        const newCanvas = this.createBLECanvas(true);
        const newTexture = new THREE.CanvasTexture(newCanvas);
        this.billboardSprite.material.map = newTexture;
        this.billboardSprite.material.needsUpdate = true;
        
        // Enable all animations
        this.animations.pulse = true;
        this.animations.rotate = true;
        this.animations.float = true;
        this.animations.signalWaves = true;
        
        // Log to data panel
        dataPanel.addEntry('BLE Icon', 'Connection', 'Disconnected', 'Connected');
        
        // Play connected animation effect
        //this.playConnectedAnimation();
    }
    
    onDisconnected() {
        console.log("[BLE Icon] ❌ BLE DISCONNECTED - Deactivating animations!");
        this.isConnected = false;
        
        // Update icon appearance to disconnected style
        const newCanvas = this.createBLECanvas(false);
        const newTexture = new THREE.CanvasTexture(newCanvas);
        this.billboardSprite.material.map = newTexture;
        this.billboardSprite.material.needsUpdate = true;
        
        // Disable all animations
        this.animations.pulse = false;
        this.animations.rotate = false;
        this.animations.float = false;
        this.animations.signalWaves = false;
        
        // Reset animation time to prevent jump when reconnecting
        this.animTime = 0;
        
        // Log to data panel
        dataPanel.addEntry('BLE Icon', 'Connection', 'Connected', 'Disconnected');
        
        // Play disconnected animation effect
        //this.playDisconnectedAnimation();
    }
    
    // ===== CONTROL METHODS =====
    
    toggleAnimation(animationType) {
        if (this.animations.hasOwnProperty(animationType)) {
            this.animations[animationType] = !this.animations[animationType];
            console.log(`[BLE Icon] ${animationType}: ${this.animations[animationType] ? 'ON' : 'OFF'}`);
            dataPanel.addEntry('BLE Icon', `Animation ${animationType}`, 
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
        console.log(`[BLE Icon] ${type} speed: ${speed}`);
    }
    
    // playConnectedAnimation() {
    //     // Animation đặc biệt khi kết nối thành công
    //     console.log("[BLE Icon] 🎉 Playing connected animation!");
        
    //     // Flash effect
    //     if (this.billboardSprite) {
    //         gsap.to(this.billboardSprite.material, {
    //             opacity: 0.3,
    //             duration: 0.1,
    //             yoyo: true,
    //             repeat: 5,
    //             ease: "power2.inOut",
    //             onComplete: () => {
    //                 // Return to normal opacity pulse
    //                 this.billboardSprite.material.opacity = 1.0;
    //             }
    //         });
    //     }
        
    //     // // Signal rings burst
    //     // this.signalRings.forEach((ringData, index) => {
    //     //     gsap.to(ringData.mesh.material, {
    //     //         opacity: 0.8,
    //     //         duration: 0.5,
    //     //         delay: index * 0.1
    //     //     });
    //     //     gsap.to(ringData.mesh.scale, {
    //     //         x: 3,
    //     //         y: 3,
    //     //         duration: 1.0,
    //     //         delay: index * 0.1,
    //     //         ease: "power2.out",
    //     //         onComplete: () => {
    //     //             ringData.mesh.scale.set(1, 1, 1);
    //     //             ringData.mesh.material.opacity = 0;
    //     //         }
    //     //     });
    //     // });
    // }
    
    playDisconnectedAnimation() {
        // Animation khi mất kết nối
        console.log("[BLE Icon] ⚠️ Playing disconnected animation");
        
        if (this.billboardSprite) {
            // Fade and shrink effect
            gsap.to(this.billboardSprite.material, {
                opacity: 0.3,
                duration: 0.5,
                onComplete: () => {
                    this.billboardSprite.material.opacity = 0.7; // Final disconnected opacity
                }
            });
            
            gsap.to(this.billboardSprite.scale, {
                x: 0.6,
                y: 0.6,
                duration: 0.5,
                ease: "power2.in",
                onComplete: () => {
                    this.billboardSprite.scale.set(0.8, 0.8, 1); // Reset to default
                }
            });
        }
        
        // Hide signal rings immediately
        this.signalRings.forEach((ringData) => {
            gsap.to(ringData.mesh.material, {
                opacity: 0,
                duration: 0.3
            });
        });
    }
    
    // Manual connection control (for testing)
    forceConnect() {
        console.log("[BLE Icon] 🧪 Force connecting (test mode)");
        this.updateConnectionState("Connected");
    }
    
    forceDisconnect() {
        console.log("[BLE Icon] 🧪 Force disconnecting (test mode)");
        this.updateConnectionState("Disconnected");
    }
}

export const BLEIcon = new BLEIconManager();

// ===== KEYBOARD CONTROLS (for testing) =====
document.addEventListener('keydown', (event) => {
    switch(event.key.toLowerCase()) {
        case 'b':
            BLEIcon.toggleAnimation('pulse');
            break;
        case 'n':
            BLEIcon.toggleAnimation('rotate');
            break;
        case 'm':
            BLEIcon.toggleAnimation('float');
            break;
        case 'k':
            BLEIcon.toggleAnimation('signalWaves');
            break;
        case 'c':
            // Test: force connect
            BLEIcon.forceConnect();
            break;
        case 'x':
            // Test: force disconnect
            BLEIcon.forceDisconnect();
            break;
    }
});

console.log("[BLE Icon] ✅ BLE Icon initialized (default: static/disconnected)");
console.log("[BLE Icon] 🎮 Controls: B=Pulse | N=Rotate | M=Float | K=Waves | C=Force Connect | X=Force Disconnect");
console.log("[BLE Icon] 📡 Polling /api/connection every 576ms for BLE status");