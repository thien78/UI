import * as THREE from 'three';
import { gSceneManager } from './scene.js';
import { dataPanel } from './panel.js';


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
        
    }

    // ===== CONNECTION STATUS MONITORING =====

    startConnectionPolling() {
        setInterval(() => {
            this.fetchConnectionStatus();
        }, 576);
        
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
        }
    }

    updateConnectionState(connectionData) {
        const newVehicleStatus = connectionData.VehicleStatus;  // "Sleep" or "Awake"
        const newUwbStatus = connectionData.UwbStatus;          // "NA", "Ranging", "CPD", "Mixed"
        
        // Update stored states
        this.vehicleStatus = newVehicleStatus;
        this.uwbStatus = newUwbStatus;
        this.previousVehicleStatus = newVehicleStatus;
        this.previousUwbStatus = newUwbStatus;
                
        // Evaluate light condition
        this.evaluateLightCondition();
    }

    evaluateLightCondition() {
        // Calculate if lights SHOULD be on based on both conditions
        const isVehicleAwake = (this.vehicleStatus === "Awake");
        const isUwbRanging = (this.uwbStatus === "Ranging" || this.uwbStatus === "Mixed");
        
        const shouldBeActive = isVehicleAwake && isUwbRanging;
        
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
        
        // Determine reason for deactivation
        const reason = this.vehicleStatus === "Sleep" 
            ? "Vehicle Sleep" 
            : "UWB Not Ranging";
        
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
        this.updateConnectionState({
            VehicleStatus: "Awake",
            UwbStatus: "Ranging"
        });
    }

    forceSleepNoRanging() {
        this.updateConnectionState({
            VehicleStatus: "Sleep",
            UwbStatus: "NA"
        });
    }

    forceAwakeNoRanging() {
        this.updateConnectionState({
            VehicleStatus: "Awake",
            UwbStatus: "NA"
        });
    }

    forceSleepRanging() {
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
            break;
    }
});
