// static/icon_control_panel.js - Control Panel for UWB & BLE Icons
import { UWBIcon } from './uwb_icon.js';
import { BLEIcon } from './test.js';

console.log("========================================");
console.log("[Icon Control Panel] Module loading...");
console.log("========================================");

class IconControlPanel {
    constructor() {
        this.panelElement = null;
        this.isMinimized = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        // Default positions
        this.position = {
            x: window.innerWidth - 320,
            y: 20
        };
        
        this.init();
    }
    
    init() {
        console.log("[Icon Control Panel] Initializing...");
        this.createPanel();
        this.attachEventListeners();
        console.log("[Icon Control Panel] ✅ Ready!");
    }
    
    createPanel() {
        // Main container
        this.panelElement = document.createElement('div');
        this.panelElement.id = 'icon-control-panel';
        this.panelElement.innerHTML = `
            <div class="panel-header">
                <div class="panel-title">
                    <span class="icon">🎛️</span>
                    <span>Icon Controls</span>
                </div>
                <div class="panel-actions">
                    <button class="minimize-btn" title="Minimize">─</button>
                    <button class="close-btn" title="Close">✕</button>
                </div>
            </div>
            
            <div class="panel-body">
                <!-- UWB Icon Section -->
                <div class="icon-section uwb-section">
                    <div class="section-header">
                        <span class="section-icon">📡</span>
                        <h3>UWB Icon</h3>
                        <span class="status-badge" id="uwb-status">Inactive</span>
                    </div>
                    
                    <div class="controls-group">
                        <label class="control-label">Animations</label>
                        <div class="toggle-group">
                            <button class="toggle-btn" data-icon="uwb" data-anim="pulse">
                                <span class="toggle-indicator"></span>
                                Pulse
                            </button>
                            <button class="toggle-btn" data-icon="uwb" data-anim="rotate">
                                <span class="toggle-indicator"></span>
                                Rotate
                            </button>
                            <button class="toggle-btn" data-icon="uwb" data-anim="float">
                                <span class="toggle-indicator"></span>
                                Float
                            </button>
                            <button class="toggle-btn" data-icon="uwb" data-anim="signalWaves">
                                <span class="toggle-indicator"></span>
                                Waves
                            </button>
                        </div>
                    </div>
                    
                    <div class="controls-group">
                        <label class="control-label">Speed Controls</label>
                        <div class="speed-control">
                            <label>Pulse Speed</label>
                            <input type="range" min="0.5" max="3" step="0.1" value="1.5" 
                                   data-icon="uwb" data-speed="pulse" class="speed-slider">
                            <span class="speed-value">1.5x</span>
                        </div>
                        <div class="speed-control">
                            <label>Rotate Speed</label>
                            <input type="range" min="0.1" max="1" step="0.1" value="0.3" 
                                   data-icon="uwb" data-speed="rotate" class="speed-slider">
                            <span class="speed-value">0.3x</span>
                        </div>
                        <div class="speed-control">
                            <label>Float Speed</label>
                            <input type="range" min="0.2" max="2" step="0.1" value="0.8" 
                                   data-icon="uwb" data-speed="float" class="speed-slider">
                            <span class="speed-value">0.8x</span>
                        </div>
                    </div>
                    
                    <div class="controls-group">
                        <label class="control-label">Test Actions</label>
                        <div class="action-buttons">
                            <button class="action-btn" data-action="uwb-ranging">
                                ✅ Force Ranging
                            </button>
                            <button class="action-btn" data-action="uwb-not-ranging">
                                ❌ Force Stop
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="section-divider"></div>
                
                <!-- BLE Icon Section -->
                <div class="icon-section ble-section">
                    <div class="section-header">
                        <span class="section-icon">📶</span>
                        <h3>BLE Icon</h3>
                        <span class="status-badge active" id="ble-status">Active</span>
                    </div>
                    
                    <div class="controls-group">
                        <label class="control-label">Animations</label>
                        <div class="toggle-group">
                            <button class="toggle-btn active" data-icon="ble" data-anim="pulse">
                                <span class="toggle-indicator"></span>
                                Pulse
                            </button>
                            <button class="toggle-btn active" data-icon="ble" data-anim="rotate">
                                <span class="toggle-indicator"></span>
                                Rotate
                            </button>
                            <button class="toggle-btn active" data-icon="ble" data-anim="float">
                                <span class="toggle-indicator"></span>
                                Float
                            </button>
                            <button class="toggle-btn active" data-icon="ble" data-anim="signalWaves">
                                <span class="toggle-indicator"></span>
                                Waves
                            </button>
                        </div>
                    </div>
                    
                    <div class="controls-group">
                        <label class="control-label">Speed Controls</label>
                        <div class="speed-control">
                            <label>Pulse Speed</label>
                            <input type="range" min="0.5" max="3" step="0.1" value="1.5" 
                                   data-icon="ble" data-speed="pulse" class="speed-slider">
                            <span class="speed-value">1.5x</span>
                        </div>
                        <div class="speed-control">
                            <label>Rotate Speed</label>
                            <input type="range" min="0.1" max="1" step="0.1" value="0.3" 
                                   data-icon="ble" data-speed="rotate" class="speed-slider">
                            <span class="speed-value">0.3x</span>
                        </div>
                        <div class="speed-control">
                            <label>Float Speed</label>
                            <input type="range" min="0.2" max="2" step="0.1" value="0.8" 
                                   data-icon="ble" data-speed="float" class="speed-slider">
                            <span class="speed-value">0.8x</span>
                        </div>
                    </div>
                    
                    <div class="controls-group">
                        <label class="control-label">Test Actions</label>
                        <div class="action-buttons">
                            <button class="action-btn" data-action="ble-connected">
                                🎉 Connected
                            </button>
                            <button class="action-btn" data-action="ble-disconnected">
                                ⚠️ Disconnected
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="panel-footer">
                    <div class="keyboard-hints">
                        <div class="hint-section">
                            <strong>UWB:</strong> U/I/O/P (Animations) • R/T (Force)
                        </div>
                        <div class="hint-section">
                            <strong>BLE:</strong> B/N/M/K (Animations) • C/X (Connect)
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add CSS styles
        this.addStyles();
        
        // Add to document
        document.body.appendChild(this.panelElement);
        
        // Set initial position
        this.updatePosition();
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #icon-control-panel {
                position: fixed;
                width: 300px;
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: white;
                z-index: 10000;
                overflow: hidden;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: transform 0.3s ease;
            }
            
            #icon-control-panel.minimized .panel-body {
                display: none;
            }
            
            #icon-control-panel.minimized {
                width: 200px;
            }
            
            .panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: rgba(0, 0, 0, 0.3);
                cursor: move;
                user-select: none;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .panel-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                font-size: 14px;
            }
            
            .panel-title .icon {
                font-size: 18px;
            }
            
            .panel-actions {
                display: flex;
                gap: 8px;
            }
            
            .minimize-btn, .close-btn {
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            .minimize-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .close-btn:hover {
                background: rgba(255, 0, 0, 0.6);
            }
            
            .panel-body {
                max-height: calc(100vh - 120px);
                overflow-y: auto;
                padding: 16px;
            }
            
            .panel-body::-webkit-scrollbar {
                width: 6px;
            }
            
            .panel-body::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 3px;
            }
            
            .panel-body::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.3);
                border-radius: 3px;
            }
            
            .icon-section {
                margin-bottom: 16px;
            }
            
            .section-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 2px solid rgba(255, 255, 255, 0.2);
            }
            
            .section-icon {
                font-size: 20px;
            }
            
            .section-header h3 {
                margin: 0;
                font-size: 16px;
                flex: 1;
            }
            
            .status-badge {
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                background: rgba(255, 255, 255, 0.2);
                text-transform: uppercase;
            }
            
            .status-badge.active {
                background: #00ff00;
                color: #000;
            }
            
            .section-divider {
                height: 1px;
                background: rgba(255, 255, 255, 0.2);
                margin: 20px 0;
            }
            
            .controls-group {
                margin-bottom: 16px;
            }
            
            .control-label {
                display: block;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 8px;
                color: rgba(255, 255, 255, 0.8);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .toggle-group {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 6px;
            }
            
            .toggle-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 10px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                color: white;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .toggle-btn:hover {
                background: rgba(255, 255, 255, 0.15);
                transform: translateY(-1px);
            }
            
            .toggle-btn.active {
                background: rgba(0, 255, 0, 0.2);
                border-color: #00ff00;
            }
            
            .toggle-indicator {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transition: all 0.2s;
            }
            
            .toggle-btn.active .toggle-indicator {
                background: #00ff00;
                box-shadow: 0 0 10px #00ff00;
            }
            
            .speed-control {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                padding: 6px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 6px;
            }
            
            .speed-control label {
                font-size: 11px;
                min-width: 80px;
                color: rgba(255, 255, 255, 0.9);
            }
            
            .speed-slider {
                flex: 1;
                height: 4px;
                border-radius: 2px;
                outline: none;
                background: rgba(255, 255, 255, 0.2);
                cursor: pointer;
            }
            
            .speed-slider::-webkit-slider-thumb {
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: #4a90e2;
                cursor: pointer;
                border: 2px solid white;
                transition: all 0.2s;
            }
            
            .speed-slider::-webkit-slider-thumb:hover {
                transform: scale(1.2);
                background: #5aa0f2;
            }
            
            .speed-value {
                min-width: 40px;
                text-align: right;
                font-size: 11px;
                font-weight: 600;
                color: #4a90e2;
            }
            
            .action-buttons {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }
            
            .action-btn {
                padding: 10px 12px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                color: white;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
                font-weight: 500;
            }
            
            .action-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
            
            .action-btn:active {
                transform: translateY(0);
            }
            
            .panel-footer {
                padding: 12px 16px;
                background: rgba(0, 0, 0, 0.3);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                font-size: 10px;
            }
            
            .keyboard-hints {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            
            .hint-section {
                color: rgba(255, 255, 255, 0.7);
                line-height: 1.4;
            }
            
            .hint-section strong {
                color: #4a90e2;
                font-weight: 600;
            }
            
            /* Animations */
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            #icon-control-panel {
                animation: fadeIn 0.3s ease-out;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    attachEventListeners() {
        // Header dragging
        const header = this.panelElement.querySelector('.panel-header');
        header.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.stopDrag());
        
        // Minimize button
        const minimizeBtn = this.panelElement.querySelector('.minimize-btn');
        minimizeBtn.addEventListener('click', () => this.toggleMinimize());
        
        // Close button
        const closeBtn = this.panelElement.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => this.hide());
        
        // Animation toggles
        const toggleBtns = this.panelElement.querySelectorAll('.toggle-btn');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const icon = btn.dataset.icon;
                const anim = btn.dataset.anim;
                this.toggleAnimation(icon, anim, btn);
            });
        });
        
        // Speed sliders
        const speedSliders = this.panelElement.querySelectorAll('.speed-slider');
        speedSliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                const icon = slider.dataset.icon;
                const speedType = slider.dataset.speed;
                const value = parseFloat(e.target.value);
                this.setSpeed(icon, speedType, value, e.target);
            });
        });
        
        // Action buttons
        const actionBtns = this.panelElement.querySelectorAll('.action-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.performAction(action);
            });
        });
    }
    
    startDrag(e) {
        this.isDragging = true;
        const rect = this.panelElement.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;
        this.panelElement.style.transition = 'none';
    }
    
    drag(e) {
        if (!this.isDragging) return;
        
        this.position.x = e.clientX - this.dragOffset.x;
        this.position.y = e.clientY - this.dragOffset.y;
        
        // Keep panel within viewport
        const maxX = window.innerWidth - this.panelElement.offsetWidth;
        const maxY = window.innerHeight - this.panelElement.offsetHeight;
        
        this.position.x = Math.max(0, Math.min(this.position.x, maxX));
        this.position.y = Math.max(0, Math.min(this.position.y, maxY));
        
        this.updatePosition();
    }
    
    stopDrag() {
        this.isDragging = false;
        this.panelElement.style.transition = 'transform 0.3s ease';
    }
    
    updatePosition() {
        this.panelElement.style.left = `${this.position.x}px`;
        this.panelElement.style.top = `${this.position.y}px`;
    }
    
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.panelElement.classList.toggle('minimized', this.isMinimized);
    }
    
    hide() {
        this.panelElement.style.display = 'none';
    }
    
    show() {
        this.panelElement.style.display = 'block';
    }
    
    toggleAnimation(icon, animType, btnElement) {
        if (icon === 'uwb') {
            UWBIcon.toggleAnimation(animType);
            btnElement.classList.toggle('active');
        } else if (icon === 'ble') {
            BLEIcon.toggleAnimation(animType);
            btnElement.classList.toggle('active');
        }
    }
    
    setSpeed(icon, speedType, value, sliderElement) {
        const valueSpan = sliderElement.parentElement.querySelector('.speed-value');
        valueSpan.textContent = `${value.toFixed(1)}x`;
        
        if (icon === 'uwb') {
            UWBIcon.setAnimationSpeed(speedType, value);
        } else if (icon === 'ble') {
            BLEIcon.setAnimationSpeed(speedType, value);
        }
    }
    
    performAction(action) {
        console.log(`[Icon Control Panel] Action: ${action}`);
        
        switch(action) {
            case 'uwb-ranging':
                UWBIcon.forceRanging();
                this.updateStatus('uwb', 'Ranging', true);
                break;
            case 'uwb-not-ranging':
                UWBIcon.forceNotRanging();
                this.updateStatus('uwb', 'Inactive', false);
                break;
            case 'ble-connected':
                BLEIcon.playConnectedAnimation();
                break;
            case 'ble-disconnected':
                BLEIcon.playDisconnectedAnimation();
                break;
        }
    }
    
    updateStatus(icon, text, active) {
        const badge = this.panelElement.querySelector(`#${icon}-status`);
        badge.textContent = text;
        badge.classList.toggle('active', active);
    }
}

// Initialize panel
export const iconControlPanel = new IconControlPanel();

// Global keyboard shortcut to toggle panel
document.addEventListener('keydown', (event) => {
    if (event.key === 'F2') {
        if (iconControlPanel.panelElement.style.display === 'none') {
            iconControlPanel.show();
        } else {
            iconControlPanel.hide();
        }
    }
});

console.log("========================================");
console.log("[Icon Control Panel] ✅ Initialized!");
console.log("[Icon Control Panel] 🎮 Press F2 to toggle panel");
console.log("[Icon Control Panel] 📍 Drag header to move panel");
console.log("========================================");