// // file: welcomeLightManager.js
// import * as THREE from 'three';
// import { CarModel } from './car.js';
// import { gSceneManager } from './scene.js';
// import { dataPanel } from './panel.js';

// /**
//  * WelcomeLightManager class (improved parabolic geometry)
//  */
// class WelcomeLightManager {
//     constructor() {
//         this.lightProjections = { Left: null, Right: null };
//         this.activationDistance = 4.0;
//         this.deactivationDistance = 5.0;
//         this.lightsActive = false;

//         this.lightConfig = {
//             Left: {
//                 position: { x: 3.75, y: 0.02, z: 0.7 },
//                 sizeNear: { width: 0.75, height: 0.5 },
//                 sizeFar: { width: 4.0, height: 3.0 },
//                 rotation: 0,
//                 color: 0xffd700      ,
//                 opacity: 0.9,
//                 // additional param: curvature power (1=linear, 2=parabolic, >2 more bowed)
//                 curvePower: 0.25,
//                 // resolution of mesh
//                 widthSegments: 24,
//                 heightSegments: 32
//             },
//             Right: {
//                 position: { x: 3.75, y: 0.02, z: -0.7 },
//                 sizeNear: { width: 0.75, height: 0.5 },
//                 sizeFar: { width: 4.0, height: 3.0 },
//                 rotation: 0,
//                 color: 0xffd700      ,
//                 opacity: 0.9,
//                 curvePower: 0.25,
//                 widthSegments: 24,
//                 heightSegments: 32
//             }
//         };

//         this.lightTexture = this.createLightTexture();
//         this.createLightProjections();

//         // DEBUG MODE
//         setTimeout(() => {
//             this.activateLights();
//             console.log('DEBUG MODE: Welcome lights activated automatically');
//         }, 1000);

//         // Disabled in debug - enable if needed
//         // this.startDistanceMonitoring();
//     }

//     createLightTexture() {
//         const canvas = document.createElement('canvas');
//         canvas.width = 512;
//         canvas.height = 512;
//         const ctx = canvas.getContext('2d');

//         const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
//         gradient.addColorStop(0, 'rgba(255,255,255,1.0)');
//         gradient.addColorStop(0.2, 'rgba(255,255,255,0.95)');
//         gradient.addColorStop(0.4, 'rgba(240,240,255,0.7)');
//         gradient.addColorStop(0.6, 'rgba(220,220,255,0.45)');
//         gradient.addColorStop(0.85, 'rgba(200,200,255,0.12)');
//         gradient.addColorStop(1, 'rgba(180,180,255,0)');

//         ctx.fillStyle = gradient;
//         ctx.fillRect(0, 0, 512, 512);

//         const texture = new THREE.CanvasTexture(canvas);
//         texture.anisotropy = 4;
//         return texture;
//     }

//     /**
//      * Create parabolic geometry by building a custom grid.
//      * - near edge at t=0 (closest to car), far edge at t=1
//      * - rowWidth = lerp(widthNear, widthFar, t^curvePower)
//      */
//     createParabolicGeometry(config) {
//         const widthSeg = Math.max(2, config.widthSegments || 24);
//         const heightSeg = Math.max(1, config.heightSegments || 32);
//         const widthNear = config.sizeNear.width;
//         const widthFar = config.sizeFar.width;
//         const height = config.sizeFar.height; // full longitudinal length
//         const curvePower = Math.max(1.0, config.curvePower || 2.0);

//         // buffers sizes
//         const vertexCount = (widthSeg + 1) * (heightSeg + 1);
//         const positions = new Float32Array(vertexCount * 3);
//         const normals = new Float32Array(vertexCount * 3);
//         const uvs = new Float32Array(vertexCount * 2);
//         const indices = [];

//         let ptrPos = 0;
//         let ptrUV = 0;

//         // build vertices row by row (near -> far)
//         for (let iy = 0; iy <= heightSeg; iy++) {
//             const t = iy / heightSeg;                // 0..1
//             const tt = Math.pow(t, curvePower);      // parabola-like
//             const rowWidth = widthNear + (widthFar - widthNear) * tt;
//             const halfRow = rowWidth / 2.0;
//             const y = t * height - (height / 2);     // center geometry around origin in Y

//             for (let ix = 0; ix <= widthSeg; ix++) {
//                 const u = ix / widthSeg;             // 0..1 across width
//                 const x = (u - 0.5) * rowWidth;      // -halfRow .. +halfRow
//                 // plane in X (width) and Y (length). Z will be 0 (flat)
//                 positions[ptrPos++] = x;
//                 positions[ptrPos++] = y;
//                 positions[ptrPos++] = 0;

//                 // UV: map u across width, v from far->near so texture radiates correctly
//                 uvs[ptrUV++] = u;
//                 uvs[ptrUV++] = 1 - t; // flip so near uses bottom of texture
//             }
//         }

//         // build indices
//         for (let iy = 0; iy < heightSeg; iy++) {
//             for (let ix = 0; ix < widthSeg; ix++) {
//                 const a = ix + (widthSeg + 1) * iy;
//                 const b = ix + (widthSeg + 1) * (iy + 1);
//                 const c = (ix + 1) + (widthSeg + 1) * (iy + 1);
//                 const d = (ix + 1) + (widthSeg + 1) * iy;

//                 // two triangles per quad
//                 indices.push(a, b, d);
//                 indices.push(b, c, d);
//             }
//         }

//         // create buffer geometry
//         const geometry = new THREE.BufferGeometry();
//         geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
//         geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3)); // will be computed
//         geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
//         geometry.setIndex(indices);

//         // compute normals
//         geometry.computeVertexNormals();

//         return geometry;
//     }

//     createLightProjections() {
//         for (const [doorName, config] of Object.entries(this.lightConfig)) {
//             // create parabolic geometry
//             const geometry = this.createParabolicGeometry(config);

//             const material = new THREE.MeshBasicMaterial({
//                 map: this.lightTexture,
//                 color: config.color,
//                 transparent: true,
//                 opacity: 0.0,            // start invisible
//                 side: THREE.DoubleSide,
//                 depthWrite: false,
//                 blending: THREE.NormalBlending
//             });

//             const mesh = new THREE.Mesh(geometry, material);

//             // position: keep same local offsets
//             mesh.position.set(config.position.x, config.position.y, config.position.z);

//             // orient plane to face down onto the ground
//             // The geometry was created in X (width) and Y (length) with Z up = 0.
//             // To lay it on ground with its normal upwards, rotate so that plane normal points up:
//             // We want plane flat on ground (facing +Y up) -> rotate X axis -> rotate around X by +90 degrees.
//             mesh.rotation.x = Math.PI/2; // lay flat on ground
//             mesh.rotation.y = Math.PI;     // flip to correct orientation
//             mesh.rotation.z = Math.PI/2;

//             mesh.renderOrder = 999; // render on top to avoid z-fighting

//             // initial scale small (used by animation)
//             mesh.scale.set(0.5, 0.5, 1);

//             gSceneManager.scene.add(mesh);
//             this.lightProjections[doorName] = mesh;
//         }
//     }

//     activateLights() {
//         if (this.lightsActive) return;
//         this.lightsActive = true;
//         dataPanel.addEntry('Welcome Light', 'Status', 'Off', 'On');

//         for (const [doorName, mesh] of Object.entries(this.lightProjections)) {
//             if (!mesh) continue;
//             const config = this.lightConfig[doorName];
//             const animParams = { opacity: 0, sx: mesh.scale.x, sy: mesh.scale.y };

//             gsap.to(animParams, {
//                 opacity: config.opacity,
//                 sx: 1.0,
//                 sy: 1.2,
//                 ease: "power2.out",
//                 onUpdate: () => {
//                     mesh.material.opacity = animParams.opacity;
//                     mesh.scale.set(animParams.sx, animParams.sy, 1);
//                 }
//             });
//         }
//     }

//     deactivateLights() {
//         if (!this.lightsActive) return;
//         this.lightsActive = false;
//         dataPanel.addEntry('Welcome Light', 'Status', 'On', 'Off');

//         for (const [doorName, mesh] of Object.entries(this.lightProjections)) {
//             if (!mesh) continue;
//             const animParams = { opacity: mesh.material.opacity, sx: mesh.scale.x, sy: mesh.scale.y };
//             gsap.to(animParams, {
//                 opacity: 0,
//                 sx: 0.5,
//                 sy: 0.5,
//                 duration: 0.6,
//                 ease: "power2.in",
//                 onUpdate: () => {
//                     mesh.material.opacity = animParams.opacity;
//                     mesh.scale.set(animParams.sx, animParams.sy, 1);
//                 }
//             });
//         }
//     }

//     updateLightIntensity(distance) {
//         if (!this.lightsActive) return;
//         const range = this.activationDistance;
//         const factor = Math.max(0.5, Math.min(1.0, distance / range));
//         for (const [doorName, mesh] of Object.entries(this.lightProjections)) {
//             if (!mesh) continue;
//             const config = this.lightConfig[doorName];
//             const targetOpacity = config.opacity * factor;
//             gsap.to(mesh.material, { opacity: targetOpacity, duration: 0.3, ease: "power1.inOut" });
//         }
//     }

//     checkUserDistance(userDistance) {
//         if (userDistance <= this.activationDistance && !this.lightsActive) {
//             this.activateLights();
//         } else if (userDistance > this.deactivationDistance && this.lightsActive) {
//             this.deactivateLights();
//         } else if (this.lightsActive) {
//             this.updateLightIntensity(userDistance);
//         }
//     }

//     startDistanceMonitoring() {
//         setInterval(() => {
//             this.updateFromUserDistance();
//         }, 288);
//     }

//     async updateFromUserDistance() {
//         try {
//             const response = await fetch('/api/user');
//             if (!response.ok) return;
//             const userData = await response.json();
//             const distance = Math.sqrt(userData.x * userData.x + userData.y * userData.y) / 100;
//             this.checkUserDistance(distance);
//         } catch (error) {
//             if (error instanceof TypeError && error.message.includes("Failed to fetch")) return;
//             console.error("Error fetching user distance for welcome lights:", error);
//         }
//     }

//     toggleLights() {
//         if (this.lightsActive) this.deactivateLights();
//         else this.activateLights();
//     }
// }

// export const welcomeLight = new WelcomeLightManager();

// document.addEventListener('keydown', (event) => {
//     if (event.key === 'l' || event.key === 'L') {
//         welcomeLight.toggleLights();
//         console.log('Welcome lights toggled manually');
//     }
// });

// file: welcome_light.js - Realistic Welcome Light Control
// Requires BOTH Vehicle Awake AND UWB Ranging
import * as THREE from 'three';
import { CarModel } from './car.js';
import { gSceneManager } from './scene.js';
import { dataPanel } from './panel.js';

console.log("========================================");
console.log("[Welcome Light] Module loading...");
console.log("========================================");

/**
 * WelcomeLightManager class
 * Realistic control based on vehicle state and UWB ranging
 * Lights activate ONLY when:
 * 1. Vehicle is AWAKE (not sleeping)
 * 2. UWB is RANGING (user is nearby)
 */
class WelcomeLightManager {
    constructor() {
        this.lightProjections = { Left: null, Right: null };
        this.lightsActive = false;
        
        // State tracking
        this.vehicleStatus = "Sleep";     // "Sleep" or "Awake"
        this.uwbStatus = "NA";            // "NA", "Ranging", "CPD", "Mixed"
        this.previousVehicleStatus = "Sleep";
        this.previousUwbStatus = "NA";

        this.lightConfig = {
            Left: {
                position: { x: 3.75, y: 0.003, z: 0.7 },
                sizeNear: { width: 0.75, height: 0.5 },
                sizeFar: { width: 4.0, height: 3.0 },
                rotation: 0,
                //color: 0xffd700,
                color: 0x8A2BE2,
                opacity: 0.9,
                curvePower: 0.25,
                widthSegments: 24,
                heightSegments: 32
            },
            Right: {
                position: { x: 3.75, y: 0.003, z: -0.7 },
                sizeNear: { width: 0.75, height: 0.5 },
                sizeFar: { width: 4.0, height: 3.0 },
                rotation: 0,
                //color: 0xffd700,
                color: 0x8A2BE2,
                opacity: 0.9,
                curvePower: 0.25,
                widthSegments: 24,
                heightSegments: 32
            }
        };

        // Create texture and light projections
        this.lightTexture = this.createLightTexture();
        this.createLightProjections();

        // Start polling connection status
        setTimeout(() => {
            console.log("[Welcome Light] Starting connection status monitoring...");
            this.startConnectionPolling();
        }, 1000);
    }

    createLightTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0, 'rgba(255,255,255,1.0)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.95)');
        gradient.addColorStop(0.4, 'rgba(240,240,255,0.7)');
        gradient.addColorStop(0.6, 'rgba(220,220,255,0.45)');
        gradient.addColorStop(0.85, 'rgba(200,200,255,0.12)');
        gradient.addColorStop(1, 'rgba(180,180,255,0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);

        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = 4;
        return texture;
    }

    createParabolicGeometry(config) {
        const widthSeg = Math.max(2, config.widthSegments || 24);
        const heightSeg = Math.max(1, config.heightSegments || 32);
        const widthNear = config.sizeNear.width;
        const widthFar = config.sizeFar.width;
        const height = config.sizeFar.height;
        const curvePower = Math.max(1.0, config.curvePower || 2.0);

        const vertexCount = (widthSeg + 1) * (heightSeg + 1);
        const positions = new Float32Array(vertexCount * 3);
        const normals = new Float32Array(vertexCount * 3);
        const uvs = new Float32Array(vertexCount * 2);
        const indices = [];

        let ptrPos = 0;
        let ptrUV = 0;

        for (let iy = 0; iy <= heightSeg; iy++) {
            const t = iy / heightSeg;
            const tt = Math.pow(t, curvePower);
            const rowWidth = widthNear + (widthFar - widthNear) * tt;
            const y = t * height - (height / 2);

            for (let ix = 0; ix <= widthSeg; ix++) {
                const u = ix / widthSeg;
                const x = (u - 0.5) * rowWidth;
                
                positions[ptrPos++] = x;
                positions[ptrPos++] = y;
                positions[ptrPos++] = 0;

                uvs[ptrUV++] = u;
                uvs[ptrUV++] = 1 - t;
            }
        }

        for (let iy = 0; iy < heightSeg; iy++) {
            for (let ix = 0; ix < widthSeg; ix++) {
                const a = ix + (widthSeg + 1) * iy;
                const b = ix + (widthSeg + 1) * (iy + 1);
                const c = (ix + 1) + (widthSeg + 1) * (iy + 1);
                const d = (ix + 1) + (widthSeg + 1) * iy;

                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return geometry;
    }

    createLightProjections() {
        console.log("[Welcome Light] Creating light projections (initially off)...");
        
        for (const [doorName, config] of Object.entries(this.lightConfig)) {
            const geometry = this.createParabolicGeometry(config);

            const material = new THREE.MeshBasicMaterial({
                map: this.lightTexture,
                color: config.color,
                transparent: true,
                opacity: 0.0,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.NormalBlending
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(config.position.x, config.position.y, config.position.z);
            mesh.rotation.x = Math.PI/2;
            mesh.rotation.y = Math.PI;
            mesh.rotation.z = Math.PI/2;
            mesh.renderOrder = 999;
            mesh.scale.set(0.5, 0.5, 1);

            gSceneManager.scene.add(mesh);
            this.lightProjections[doorName] = mesh;
        }
        
        console.log("[Welcome Light] ✅ Light projections created (off state)");
    }

    // ===== CONNECTION STATUS MONITORING =====

    startConnectionPolling() {
        setInterval(() => {
            this.fetchConnectionStatus();
        }, 576);
        
        console.log("[Welcome Light] 🔄 Started polling connection status (576ms interval)");
    }

    async fetchConnectionStatus() {
        try {
            const response = await fetch('/api/connection');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const connectionData = await response.json();
            this.updateConnectionState(connectionData);
            
        } catch (error) {
            if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
                return;
            }
            console.error("[Welcome Light] Error fetching connection status:", error);
        }
    }

    updateConnectionState(connectionData) {
        const newVehicleStatus = connectionData.VehicleStatus;  // "Sleep" or "Awake"
        const newUwbStatus = connectionData.UwbStatus;          // "NA", "Ranging", "CPD", "Mixed"
        
        // Check if any state changed
        const vehicleChanged = (newVehicleStatus !== this.previousVehicleStatus);
        const uwbChanged = (newUwbStatus !== this.previousUwbStatus);
        
        if (vehicleChanged || uwbChanged) {
            // Log state changes
            if (vehicleChanged) {
                console.log(`[Welcome Light] 🚗 Vehicle Status changed: ${this.previousVehicleStatus} → ${newVehicleStatus}`);
                dataPanel.addEntry('Welcome Light', 'Vehicle Status', this.previousVehicleStatus, newVehicleStatus);
            }
            
            if (uwbChanged) {
                console.log(`[Welcome Light] 📡 UWB Status changed: ${this.previousUwbStatus} → ${newUwbStatus}`);
                dataPanel.addEntry('Welcome Light', 'UWB Status', this.previousUwbStatus, newUwbStatus);
            }
            
            // Update stored states
            this.vehicleStatus = newVehicleStatus;
            this.uwbStatus = newUwbStatus;
            this.previousVehicleStatus = newVehicleStatus;
            this.previousUwbStatus = newUwbStatus;
            
            // Evaluate light condition
            this.evaluateLightCondition();
        }
    }

    evaluateLightCondition() {
        // Calculate if lights SHOULD be on based on both conditions
        const isVehicleAwake = (this.vehicleStatus === "Awake");
        const isUwbRanging = (this.uwbStatus === "Ranging" || this.uwbStatus === "Mixed");
        
        const shouldBeActive = isVehicleAwake && isUwbRanging;
        
        console.log(`[Welcome Light] 🔍 Evaluation:`);
        console.log(`  Vehicle: ${this.vehicleStatus} (${isVehicleAwake ? '✓' : '✗'})`);
        console.log(`  UWB: ${this.uwbStatus} (${isUwbRanging ? '✓' : '✗'})`);
        console.log(`  → Lights should be: ${shouldBeActive ? 'ON' : 'OFF'}`);
        
        // Apply the state
        if (shouldBeActive && !this.lightsActive) {
            this.activateLights();
        } else if (!shouldBeActive && this.lightsActive) {
            this.deactivateLights();
        }
    }

    // ===== LIGHT CONTROL =====

    activateLights() {
        if (this.lightsActive) return;
        this.lightsActive = true;

        console.log("[Welcome Light] ✅ 💡 LIGHTS ON - Welcome!");
        console.log(`  Reason: Vehicle Awake + UWB Ranging`);
        
        dataPanel.addEntry('Welcome Light', 'Lights', 'Off', 'On');

        for (const [doorName, mesh] of Object.entries(this.lightProjections)) {
            if (!mesh) continue;
            const config = this.lightConfig[doorName];
            const animParams = { opacity: 0, sx: mesh.scale.x, sy: mesh.scale.y };

            gsap.to(animParams, {
                opacity: config.opacity,
                sx: 1.0,
                sy: 1.0,
                duration: 0.8,
                ease: "power2.out",
                onUpdate: () => {
                    mesh.material.opacity = animParams.opacity;
                    mesh.scale.set(animParams.sx, animParams.sy, 1);
                }
            });
        }
    }

    deactivateLights() {
        if (!this.lightsActive) return;
        this.lightsActive = false;

        console.log("[Welcome Light] ❌ 🌑 LIGHTS OFF");
        
        // Determine reason for deactivation
        const reason = this.vehicleStatus === "Sleep" 
            ? "Vehicle Sleep" 
            : "UWB Not Ranging";
        console.log(`  Reason: ${reason}`);
        
        dataPanel.addEntry('Welcome Light', 'Lights', 'On', `Off (${reason})`);

        for (const [doorName, mesh] of Object.entries(this.lightProjections)) {
            if (!mesh) continue;
            const animParams = { opacity: mesh.material.opacity, sx: mesh.scale.x, sy: mesh.scale.y };
            
            gsap.to(animParams, {
                opacity: 0,
                sx: 0.5,
                sy: 0.5,
                duration: 0.6,
                ease: "power2.in",
                onUpdate: () => {
                    mesh.material.opacity = animParams.opacity;
                    mesh.scale.set(animParams.sx, animParams.sy, 1);
                }
            });
        }
    }

    // ===== MANUAL CONTROLS (for testing) =====

    toggleLights() {
        if (this.lightsActive) {
            this.deactivateLights();
        } else {
            this.activateLights();
        }
    }

    forceAwakeRanging() {
        console.log("[Welcome Light] 🧪 Force: Vehicle Awake + UWB Ranging");
        this.updateConnectionState({
            VehicleStatus: "Awake",
            UwbStatus: "Ranging"
        });
    }

    forceSleepNoRanging() {
        console.log("[Welcome Light] 🧪 Force: Vehicle Sleep + UWB NA");
        this.updateConnectionState({
            VehicleStatus: "Sleep",
            UwbStatus: "NA"
        });
    }

    forceAwakeNoRanging() {
        console.log("[Welcome Light] 🧪 Force: Vehicle Awake + UWB NA (lights should stay OFF)");
        this.updateConnectionState({
            VehicleStatus: "Awake",
            UwbStatus: "NA"
        });
    }

    forceSleepRanging() {
        console.log("[Welcome Light] 🧪 Force: Vehicle Sleep + UWB Ranging (lights should stay OFF)");
        this.updateConnectionState({
            VehicleStatus: "Sleep",
            UwbStatus: "Ranging"
        });
    }

    // Get current state for debugging
    getState() {
        return {
            vehicleStatus: this.vehicleStatus,
            uwbStatus: this.uwbStatus,
            lightsActive: this.lightsActive,
            shouldBeActive: (this.vehicleStatus === "Awake") && 
                          (this.uwbStatus === "Ranging" || this.uwbStatus === "Mixed")
        };
    }
}

export const welcomeLight = new WelcomeLightManager();

// ===== KEYBOARD CONTROLS (for testing) =====
document.addEventListener('keydown', (event) => {
    switch(event.key.toLowerCase()) {
        case 'l':
            // Toggle lights manually (override)
            welcomeLight.toggleLights();
            console.log('[Welcome Light] Lights toggled manually');
            break;
        case '1':
            // Test: Awake + Ranging → Lights ON
            welcomeLight.forceAwakeRanging();
            break;
        case '2':
            // Test: Sleep + NA → Lights OFF
            welcomeLight.forceSleepNoRanging();
            break;
        case '3':
            // Test: Awake + NA → Lights OFF (xe tỉnh nhưng không có user)
            welcomeLight.forceAwakeNoRanging();
            break;
        case '4':
            // Test: Sleep + Ranging → Lights OFF (có user nhưng xe ngủ)
            welcomeLight.forceSleepRanging();
            break;
        case 's':
            // Show current state
            const state = welcomeLight.getState();
            console.log('[Welcome Light] Current State:', state);
            break;
    }
});

console.log("========================================");
console.log("[Welcome Light] ✅ Initialized");
console.log("[Welcome Light] Logic: Awake + Ranging = ON");
console.log("[Welcome Light] 🎮 Controls:");
console.log("  L - Toggle lights");
console.log("  1 - Awake + Ranging (ON)");
console.log("  2 - Sleep + NA (OFF)");
console.log("  3 - Awake + NA (OFF)");
console.log("  4 - Sleep + Ranging (OFF)");
console.log("  S - Show state");
console.log("========================================");