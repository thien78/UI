import * as THREE from 'three';
import { gSceneManager } from './scene.js';

// Main application class
class CarModelViewer {
    constructor() {
        // Get references to shared scene elements
        this.scene = gSceneManager.scene;
        this.camera = gSceneManager.camera;
        this.renderer = gSceneManager.renderer;
        this.controls = gSceneManager.controls;

        // Car parts container
        this.carParts = {
            body: null,
            doors: {
                frontLeft: { model: null, hingePoint: new THREE.Vector3(-1.5, 0.8, 0.5), open: false, angle: 0 },
                frontRight: { model: null, hingePoint: new THREE.Vector3(1.5, 0.8, 0.5), open: false, angle: 0 },
                rearLeft: { model: null, hingePoint: new THREE.Vector3(-1.5, 0.8, -0.5), open: false, angle: 0 },
                rearRight: { model: null, hingePoint: new THREE.Vector3(1.5, 0.8, -0.5), open: false, angle: 0 }
            },
            anchors: {} // New anchors collection
        };

        // Store original material properties for all loaded meshes
        this.originalMaterialProps = new Map();
        
        // Current brightness level for the car model
        this.currentBrightness = 2.0;

        // Set up loaders
        this.loader = gSceneManager.createGLTFLoader();

        // Load default models
        this.loadDefaultModels();

        
        // Start animation loop
        this.animate();
        
        // Load configuration if available
        this.loadConfigurationFromJson();
    }

    loadDefaultModels() {
        // Define paths to your local models
        const modelPaths = {
            body: '/static/bodykit.glb',
            frontLeft: '/static/FL.glb',
            frontRight: '/static/FR.glb',
            rearLeft: '/static/RL.glb',
            rearRight: '/static/RR.glb'
        };

        // Status element
        const statusElement = document.getElementById('status');
        let loadedCount = 0;
        const totalModels = Object.keys(modelPaths).length;

        // Load each model
        for (const [partName, path] of Object.entries(modelPaths)) {
            this.loadCarModel(path, partName, () => {
                loadedCount++;
                statusElement.textContent = `Loading models: ${loadedCount}/${totalModels}`;

                // When all models are loaded
                if (loadedCount === totalModels) {
                    statusElement.textContent = 'All models loaded!';
                }
            });
        }
    }
    
    loadCarModel(path, partName, callback) {
        const statusElement = document.getElementById('status');
        statusElement.textContent = `Loading ${partName}...`;
        
        this.loader.load(
            path,
            (gltf) => {
                // scale down to correct size
                gltf.scene.scale.set(4.684 / 556.87, 4.684 / 556.87, 4.684 / 556.87)
                
                const model = gltf.scene;
                
                // Store original material properties for all meshes in this model
                model.traverse((child) => {
                    if (child.isMesh && child.material) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        materials.forEach((mat) => {
                            if (!this.originalMaterialProps.has(mat)) {
                                this.originalMaterialProps.set(mat, {
                                    color: mat.color ? mat.color.clone() : null,
                                    emissive: mat.emissive ? mat.emissive.clone() : null
                                });
                            }
                        });
                    }
                });
                
                // Apply shadows to all meshes
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                // Rotate all models 90 degrees on Y axis by default
                model.rotation.y = Math.PI / 2;

                // Simplify the model geometry to improve performance
                model.traverse(node => {
                    if (node.isMesh) {
                        // Reduce polygon count if the mesh has a geometry with attributes
                        if (node.geometry && node.geometry.attributes && node.geometry.attributes.position) {
                            // Use THREE.BufferGeometryUtils to simplify if available
                            if (THREE.BufferGeometryUtils && THREE.BufferGeometryUtils.mergeVertices) {
                                // Merge vertices that are close to each other
                                node.geometry = THREE.BufferGeometryUtils.mergeVertices(node.geometry, 0.1);
                            }
                            
                            // Optimize the geometry
                            node.geometry.computeBoundingSphere();
                            node.geometry.computeBoundingBox();
                            
                            // Remove unused attributes to save memory
                            if (node.geometry.attributes.color && !node.material.vertexColors) {
                                delete node.geometry.attributes.color;
                            }
                        }
                        
                        // Optimize materials
                        if (node.material) {
                            // Disable unnecessary features
                            node.material.flatShading = true;
                            node.material.needsUpdate = true;
                            
                            // Reduce texture quality if textures exist
                            if (node.material.map) {
                                node.material.map.anisotropy = 1;
                                node.material.map.minFilter = THREE.LinearFilter;
                            }
                        }
                        
                        // Enable frustum culling
                        node.frustumCulled = true;
                    }
                });

                
                // Add model to scene
                this.scene.add(model);
                
                // Store reference based on part type
                if (partName === 'body') {
                    this.carParts.body = model;
                    this.SetUpCamera();
                } else {
                    this.carParts.doors[partName].model = model;
                }
                this.loadConfigurationFromJson();
                
                if (callback) callback();
            },
            (xhr) => {
                const percent = (xhr.loaded / xhr.total) * 100;
                statusElement.textContent = `Loading ${partName}: ${Math.round(percent)}%`;
            },
            (error) => {
                console.error(`Error loading ${partName} model:`, error);
                statusElement.textContent = `Error loading ${partName}`;
                if (callback) callback(); // Continue loading other models
            }
        );
    }

    SetUpCamera() {
        // Compute and use bounding box to center the model
        const boundingBox = new THREE.Box3().setFromObject(this.carParts.body);

        // Adjust camera based on model size
        const size = boundingBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) * 2;
        // looking at front left of model as default
        this.camera.position.set(maxDim, maxDim * (2 / 3), -maxDim);
        this.camera.lookAt(0, 0, 0);
        this.controls.update();
    }

    loadConfigurationFromJson() {
        // Load configuration from a local JSON file
        fetch("/static/car_config.json")
            .then(response => {
                if (!response.ok) {
                    throw new Error('Configuration file not found');
                }
                return response.json();
            })
            .then(config => {
                this.applyConfiguration(config);
            })
            .catch(error => {
                console.warn('Could not load configuration:', error);
            });
    }

    applyConfiguration(config) {
        const statusElement = document.getElementById('status');
        statusElement.textContent = "Applying configuration...";

        // Apply body configuration
        if (this.carParts.body) {
            this.carParts.body.position.set(
                config.body.position.x,
                config.body.position.y,
                config.body.position.z
            );

            this.carParts.body.rotation.set(
                config.body.rotation.x,
                config.body.rotation.y,
                config.body.rotation.z
            );
        }

        // Apply door configurations
        for (const [doorName, doorConfig] of Object.entries(config.doors)) {
            const door = this.carParts.doors[doorName];
            if (door.model) {
                // Set position
                door.model.position.set(
                    doorConfig.position.x,
                    doorConfig.position.y,
                    doorConfig.position.z
                );

                // Set hinge point
                door.hingePoint.set(
                    doorConfig.hingePoint.x,
                    doorConfig.hingePoint.y,
                    doorConfig.hingePoint.z
                );

                // Set open state
                door.open = doorConfig.open;
                door.angle = doorConfig.angle;

                // Apply rotation if door is open
                if (door.open) {
                    door.model.rotation.y = Math.PI + door.angle;
                }
            }
        }

        statusElement.textContent = "Configuration applied!";
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

export var CarModel = new CarModelViewer();