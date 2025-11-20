// // static/ble_icon.js - Animated Bluetooth Icon
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
//         this.signalRings = [];
        
//         // Animation states
//         this.animations = {
//             pulse: true,
//             rotate: true,
//             float: true,
//             signalWaves: true
//         };
        
//         // Animation parameters
//         this.animTime = 0;
//         this.pulseSpeed = 1.5;
//         this.rotateSpeed = 0.3;
//         this.floatSpeed = 0.8;
//         this.floatAmplitude = 0.15;
//         this.baseY = 3.5; // Store base Y position
        
//         setTimeout(() => {
//             console.log("[BLE Icon] Creating animated BLE icon...");
//             this.createBLEIcon();
//             this.createSignalRings();
//             this.setFixedPosition();
//             this.startAnimations();
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
            
//             console.log("[BLE Icon] ✅ Animated Bluetooth icon created");
            
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
        
//         // ===== NỀN XANH TRÒN với GRADIENT =====
//         const gradient = ctx.createRadialGradient(center, center, 0, center, center, center * 0.92);
//         gradient.addColorStop(0, '#1a3a5f');
//         gradient.addColorStop(0.7, '#0d2440');
//         gradient.addColorStop(1, '#0a1e3d');
        
//         ctx.fillStyle = gradient;
//         ctx.beginPath();
//         ctx.arc(center, center, center * 0.92, 0, Math.PI * 2);
//         ctx.fill();
        
//         // ===== VIỀN SÁNG =====
//         ctx.strokeStyle = '#4a90e2';
//         ctx.lineWidth = 4;
//         ctx.beginPath();
//         ctx.arc(center, center, center * 0.88, 0, Math.PI * 2);
//         ctx.stroke();
        
//         // ===== VẼ LOGO BLUETOOTH ĐÚNG =====
//         ctx.save();
//         ctx.translate(center, center);
        
//         ctx.fillStyle = '#FFFFFF';
//         ctx.strokeStyle = '#FFFFFF';
//         ctx.lineWidth = 24;
//         ctx.lineCap = 'round';
//         ctx.lineJoin = 'round';

//         // ===== SHADOW ĐỂ NỔI BẬT HƠN =====
//         ctx.shadowColor = '#4a90e2';
//         ctx.shadowBlur = 15;
//         ctx.shadowOffsetX = 0;
//         ctx.shadowOffsetY = 0;
        
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
//         ctx.lineTo(-width, halfHeight/3);                 // Về trung tâm
//         ctx.stroke();
        
//         // ===== TAM GIÁC DƯỚI BÊN PHẢI =====
//         ctx.beginPath();
//         ctx.moveTo(0, halfHeight);        // Đỉnh dưới
//         ctx.lineTo(width, halfHeight/3);  // Góc phải giữa dưới
//         ctx.lineTo(-width, -halfHeight/3);                 // Về trung tâm
//         ctx.stroke();
        
        
//         ctx.restore();
        
//         console.log("[BLE Icon] ✅ Bluetooth logo with gradient & glow");
//         return canvas;
//     }
    
//     createSignalRings() {
//         // Tạo 3 vòng tròn sóng tín hiệu xung quanh icon
//         const ringCount = 3;
        
//         for (let i = 0; i < ringCount; i++) {
//             const geometry = new THREE.RingGeometry(0.5, 0.6, 32);
//             const material = new THREE.MeshBasicMaterial({
//                 color: 0x4a90e2,
//                 transparent: true,
//                 opacity: 0,
//                 side: THREE.DoubleSide,
//                 depthWrite: false
//             });
            
//             const ring = new THREE.Mesh(geometry, material);
//             ring.lookAt(gSceneManager.camera.position);
            
//             this.signalRings.push({
//                 mesh: ring,
//                 initialDelay: i * 0.8, // Delay giữa các ring
//                 scale: 1.0
//             });
            
//             this.iconGroup.add(ring);
//         }
//     }
    
//     startAnimations() {
//         // Sử dụng animation loop riêng
//         this.updateAnimations();
//         console.log("[BLE Icon] ✅ Animations started");
//     }
    
//     updateAnimations() {
//         requestAnimationFrame(() => this.updateAnimations());
        
//         this.animTime += 0.016; // ~60fps
        
//         if (!this.iconGroup) return;
        
//         // 1. PULSE ANIMATION - Icon phóng to thu nhỏ
//         if (this.animations.pulse && this.billboardSprite) {
//             const pulseScale = 1 + Math.sin(this.animTime * this.pulseSpeed) * 0.1;
//             this.billboardSprite.scale.set(0.8 * pulseScale, 0.8 * pulseScale, 1);
//         }
        
//         // 2. ROTATE ANIMATION - Xoay nhẹ
//         if (this.animations.rotate) {
//             this.iconGroup.rotation.y = Math.sin(this.animTime * this.rotateSpeed) * 0.2;
//         }
        
//         // 3. FLOAT ANIMATION - Bay lên xuống
//         if (this.animations.float) {
//             const floatOffset = Math.sin(this.animTime * this.floatSpeed) * this.floatAmplitude;
//             this.iconGroup.position.y = this.baseY + floatOffset;
//         }
        
//         // 4. SIGNAL WAVES ANIMATION - Sóng tín hiệu lan tỏa
//         if (this.animations.signalWaves) {
//             this.signalRings.forEach((ringData, index) => {
//                 const ring = ringData.mesh;
//                 const phase = (this.animTime + ringData.initialDelay) % 3.0; // Chu kỳ 3 giây
                
//                 if (phase < 2.0) {
//                     // Lan tỏa ra ngoài
//                     const progress = phase / 2.0;
//                     ring.scale.set(1 + progress * 1.5, 1 + progress * 1.5, 1);
//                     ring.material.opacity = (1 - progress) * 0.6;
//                 } else {
//                     // Reset
//                     ring.scale.set(1, 1, 1);
//                     ring.material.opacity = 0;
//                 }
//                 ring.lookAt(gSceneManager.camera.position);
//             });
//         }
        
//         // 5. OPACITY PULSE - Độ trong suốt nhấp nháy nhẹ
//         if (this.billboardSprite) {
//             const opacityPulse = 0.9 + Math.sin(this.animTime * 2) * 0.1;
//             this.billboardSprite.material.opacity = opacityPulse;
//         }
//     }
    
//     setFixedPosition() {
//         const x = 1.0;
//         const y = this.baseY;
//         const z = 1.0;
        
//         this.iconGroup.position.set(x, y, z);
        
//         console.log("========================================");
//         console.log("[BLE Icon] Position set with animations active");
//         console.log("========================================");
//     }
    
//     // ===== CONTROL METHODS =====
    
//     toggleAnimation(animationType) {
//         if (this.animations.hasOwnProperty(animationType)) {
//             this.animations[animationType] = !this.animations[animationType];
//             console.log(`[BLE Icon] ${animationType}: ${this.animations[animationType] ? 'ON' : 'OFF'}`);
//             dataPanel.addEntry('BLE Icon', `Animation ${animationType}`, 
//                 !this.animations[animationType] ? 'On' : 'Off',
//                 this.animations[animationType] ? 'On' : 'Off'
//             );
//         }
//     }
    
//     setAnimationSpeed(type, speed) {
//         switch(type) {
//             case 'pulse':
//                 this.pulseSpeed = speed;
//                 break;
//             case 'rotate':
//                 this.rotateSpeed = speed;
//                 break;
//             case 'float':
//                 this.floatSpeed = speed;
//                 break;
//         }
//         console.log(`[BLE Icon] ${type} speed: ${speed}`);
//     }
    
//     playConnectedAnimation() {
//         // Animation đặc biệt khi kết nối thành công
//         console.log("[BLE Icon] 🎉 Connected animation!");
//         dataPanel.addEntry('BLE Icon', 'Status', 'Searching', 'Connected');
        
//         // Flash effect
//         if (this.billboardSprite) {
//             gsap.to(this.billboardSprite.material, {
//                 opacity: 0.2,
//                 duration: 0.1,
//                 yoyo: true,
//                 repeat: 5,
//                 ease: "power2.inOut"
//             });
            
//             // Expand effect
//             gsap.to(this.billboardSprite.scale, {
//                 x: 1.2,
//                 y: 1.2,
//                 duration: 0.3,
//                 yoyo: true,
//                 repeat: 1,
//                 ease: "elastic.out(1, 0.3)"
//             });
//         }
        
//         // Signal rings burst
//         this.signalRings.forEach((ringData, index) => {
//             gsap.to(ringData.mesh.material, {
//                 opacity: 0.8,
//                 duration: 0.5,
//                 delay: index * 0.1
//             });
//             gsap.to(ringData.mesh.scale, {
//                 x: 3,
//                 y: 3,
//                 duration: 1.0,
//                 delay: index * 0.1,
//                 ease: "power2.out",
//                 onComplete: () => {
//                     ringData.mesh.scale.set(1, 1, 1);
//                     ringData.mesh.material.opacity = 0;
//                 }
//             });
//         });
//     }
    
//     playDisconnectedAnimation() {
//         // Animation khi mất kết nối
//         console.log("[BLE Icon] ⚠️ Disconnected animation");
//         dataPanel.addEntry('BLE Icon', 'Status', 'Connected', 'Disconnected');
        
//         if (this.billboardSprite) {
//             // Fade out effect
//             gsap.to(this.billboardSprite.material, {
//                 opacity: 0.3,
//                 duration: 0.5
//             });
            
//             // Shrink effect
//             gsap.to(this.billboardSprite.scale, {
//                 x: 0.6,
//                 y: 0.6,
//                 duration: 0.5,
//                 ease: "power2.in"
//             });
//         }
//     }
// }

// export const BLEIcon = new BLEIconManager();

// // ===== KEYBOARD CONTROLS =====
// document.addEventListener('keydown', (event) => {
//     switch(event.key.toLowerCase()) {
//         case 'b':
//             BLEIcon.toggleAnimation('pulse');
//             break;
//         case 'n':
//             BLEIcon.toggleAnimation('rotate');
//             break;
//         case 'm':
//             BLEIcon.toggleAnimation('float');
//             break;
//         case 'k':
//             BLEIcon.toggleAnimation('signalWaves');
//             break;
//         case 'c':
//             BLEIcon.playConnectedAnimation();
//             break;
//         case 'x':
//             BLEIcon.playDisconnectedAnimation();
//             break;
//     }
// });

// console.log("[BLE Icon] ✅ Animated Bluetooth icon initialized");
// console.log("[BLE Icon] 🎮 Controls: B=Pulse | N=Rotate | M=Float | K=Waves | C=Connect | X=Disconnect");