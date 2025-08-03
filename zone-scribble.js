/**
 * Zone-Based Scribble Module - AI Orchestrator's Ascent
 * 
 * Σωστή υλοποίηση με SIZ και FIA zones:
 * - SIZ zones (15% αριστερά, 15% δεξιά): Μόνο εκεί μπορεί να ξεκινήσει ink
 * - FIA zone (κεντρικό 70%): ΔΕΝ μπορεί να ξεκινήσει ink - μόνο κείμενο
 * - 5% buffer zones για διαχωρισμό
 * - Ink fade over text για διατήρηση αναγνωσιμότητας
 */

class ZoneScribble {
    constructor() {
        this.isActive = false;
        this.isDrawing = false;
        this.currentPath = [];
        this.allPaths = [];
        
        // Drawing state
        this.lastX = 0;
        this.lastY = 0;
        
        // Canvas and overlay references
        this.overlay = null;
        this.canvas = null;
        this.ctx = null;
        this.controlPanel = null;
        
        // Zone configuration: 15% + 5% + 60% + 5% + 15% = 100%
        this.zones = {
            leftSIZ: { start: 0, end: 0.15 },          // 0-15%: Left SIZ zone
            leftBuffer: { start: 0.15, end: 0.20 },    // 15-20%: Left buffer
            FIA: { start: 0.20, end: 0.80 },           // 20-80%: FIA zone (text area)
            rightBuffer: { start: 0.80, end: 0.85 },   // 80-85%: Right buffer  
            rightSIZ: { start: 0.85, end: 1.0 }        // 85-100%: Right SIZ zone
        };
        
        // Responsive state
        this.currentLayout = 'desktop';
        this.scrollOffset = { x: 0, y: 0 };
        
        // Event listeners storage
        this.eventListeners = [];
        
        console.log('📏 Zone-Based Scribble initialized');
    }

    /**
     * Initialize the zone-based scribble system
     */
    init() {
        console.log('📏 Starting Zone-Based Scribble...');
        
        if (this.isActive) {
            console.log('📏 Zone scribble already active');
            return;
        }
        
        this.detectLayout();
        this.createOverlaySystem();
        this.setupCanvas();
        this.createMinimalControls();
        this.attachEventListeners();
        this.setupScrollTracking();
        this.createZoneVisualGuides();
        
        // Initial dimension update
        this.updateDimensions();
        
        this.isActive = true;
        console.log(`✅ Zone-Based Scribble activated in ${this.currentLayout} mode`);
    }

    /**
     * Detect current layout
     */
    detectLayout() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        if (width <= 768) {
            this.currentLayout = height > width ? 'mobile-vertical' : 'mobile-horizontal';
        } else {
            this.currentLayout = 'desktop';
        }
        
        console.log(`📐 Layout: ${this.currentLayout} (${width}x${height})`);
    }

    /**
     * Create overlay system covering entire page
     */
    createOverlaySystem() {
        this.destroy();
        
        this.overlay = document.createElement('div');
        this.overlay.id = 'zone-scribble-overlay';
        this.overlay.className = `zone-overlay layout-${this.currentLayout}`;
        
        this.overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: ${Math.max(document.documentElement.scrollHeight, window.innerHeight)}px;
            pointer-events: none;
            z-index: 999;
        `;
        
        document.body.appendChild(this.overlay);
    }

    /**
     * Setup canvas with zone awareness
     */
    setupCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'zone-scribble-canvas';
        this.ctx = this.canvas.getContext('2d');
        
        const docHeight = Math.max(document.documentElement.scrollHeight, window.innerHeight);
        const docWidth = Math.max(document.documentElement.scrollWidth, window.innerWidth);
        
        this.canvas.width = docWidth;
        this.canvas.height = docHeight;
        
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: ${docHeight}px;
            pointer-events: auto;
            cursor: default;
        `;
        
        // Configure drawing context
        this.ctx.strokeStyle = '#2563eb';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.overlay.appendChild(this.canvas);
        console.log(`🖼️ Canvas setup: ${docWidth}x${docHeight}`);
    }

    /**
     * Create minimal controls (μόνο close και clear)
     */
    createMinimalControls() {
        this.controlPanel = document.createElement('div');
        this.controlPanel.className = `zone-controls layout-${this.currentLayout}`;
        
        if (this.currentLayout === 'mobile-vertical') {
            // Top center για mobile vertical
            this.controlPanel.style.cssText = `
                position: fixed;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 255, 255, 0.95);
                border: 1px solid #e5e7eb;
                border-radius: 20px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 1001;
                padding: 6px 12px;
                display: flex;
                gap: 10px;
                align-items: center;
            `;
        } else {
            // Right side για άλλα layouts
            this.controlPanel.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(255, 255, 255, 0.95);
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 1001;
                padding: 12px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                min-width: 120px;
            `;
        }
        
        this.controlPanel.innerHTML = `
            <button id="close-zone-scribble" class="zone-btn close">×</button>
            <button id="clear-zone-scribble" class="zone-btn clear">🗑️</button>
        `;
        
        document.body.appendChild(this.controlPanel);
    }

    /**
     * Create visual guides for zones (optional - για development)
     */
    createZoneVisualGuides() {
        // Προς το παρόν κρυφό - μπορεί να ενεργοποιηθεί για debugging
        if (false) { // Set to true για να δεις τις ζώνες
            const guide = document.createElement('div');
            guide.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 998;
                background: linear-gradient(90deg, 
                    rgba(34, 197, 94, 0.1) 0%, 
                    rgba(34, 197, 94, 0.1) 15%, 
                    rgba(251, 191, 36, 0.05) 15%, 
                    rgba(251, 191, 36, 0.05) 20%, 
                    rgba(239, 68, 68, 0.1) 20%, 
                    rgba(239, 68, 68, 0.1) 80%, 
                    rgba(251, 191, 36, 0.05) 80%, 
                    rgba(251, 191, 36, 0.05) 85%, 
                    rgba(34, 197, 94, 0.1) 85%, 
                    rgba(34, 197, 94, 0.1) 100%
                );
            `;
            document.body.appendChild(guide);
        }
    }

    /**
     * Setup scroll tracking
     */
    setupScrollTracking() {
        const trackScroll = () => {
            this.scrollOffset.x = window.pageXOffset || document.documentElement.scrollLeft || 0;
            this.scrollOffset.y = window.pageYOffset || document.documentElement.scrollTop || 0;
            
            // Update overlay and canvas dimensions dynamically
            this.updateDimensions();
        };
        
        // Track scroll immediately
        trackScroll();
        
        // Listen to scroll and resize events
        window.addEventListener('scroll', trackScroll, { passive: true });
        window.addEventListener('resize', trackScroll, { passive: true });
        
        this.eventListeners.push(
            { element: window, type: 'scroll', handler: trackScroll },
            { element: window, type: 'resize', handler: trackScroll }
        );
    }

    /**
     * Update overlay and canvas dimensions - για dynamic content
     */
    updateDimensions() {
        if (!this.overlay || !this.canvas) return;
        
        const docHeight = Math.max(document.documentElement.scrollHeight, window.innerHeight);
        const docWidth = Math.max(document.documentElement.scrollWidth, window.innerWidth);
        
        // Update overlay height
        this.overlay.style.height = `${docHeight}px`;
        
        // Update canvas if dimensions changed
        if (this.canvas.height !== docHeight || this.canvas.width !== docWidth) {
            // Store current paths before resize
            const currentPaths = [...this.allPaths];
            
            // Resize canvas
            this.canvas.width = docWidth;
            this.canvas.height = docHeight;
            
            // Update canvas style to cover full document
            this.canvas.style.width = '100%';
            this.canvas.style.height = `${docHeight}px`;
            
            // Redraw all paths
            this.allPaths = currentPaths;
            this.redrawAllPaths();
            
            console.log(`📐 Updated canvas: ${docWidth}x${docHeight}`);
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        this.removeEventListeners();
        
        // Control buttons
        const closeBtn = document.getElementById('close-zone-scribble');
        const clearBtn = document.getElementById('clear-zone-scribble');
        
        const closeHandler = () => this.destroy();
        const clearHandler = () => this.clearCanvas();
        
        closeBtn.addEventListener('click', closeHandler);
        clearBtn.addEventListener('click', clearHandler);
        
        this.eventListeners.push(
            { element: closeBtn, type: 'click', handler: closeHandler },
            { element: clearBtn, type: 'click', handler: clearHandler }
        );
        
        // Canvas drawing events με zone checking
        const mouseDownHandler = (e) => this.startDrawing(e);
        const mouseMoveHandler = (e) => this.draw(e);
        const mouseUpHandler = () => this.stopDrawing();
        
        this.canvas.addEventListener('mousedown', mouseDownHandler);
        this.canvas.addEventListener('mousemove', mouseMoveHandler);
        this.canvas.addEventListener('mouseup', mouseUpHandler);
        this.canvas.addEventListener('mouseleave', mouseUpHandler);
        
        this.eventListeners.push(
            { element: this.canvas, type: 'mousedown', handler: mouseDownHandler },
            { element: this.canvas, type: 'mousemove', handler: mouseMoveHandler },
            { element: this.canvas, type: 'mouseup', handler: mouseUpHandler },
            { element: this.canvas, type: 'mouseleave', handler: mouseUpHandler }
        );
        
        // Touch events
        const touchStartHandler = (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        };
        
        const touchMoveHandler = (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        };
        
        const touchEndHandler = (e) => {
            e.preventDefault();
            this.stopDrawing();
        };
        
        this.canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
        this.canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
        this.canvas.addEventListener('touchend', touchEndHandler, { passive: false });
        
        this.eventListeners.push(
            { element: this.canvas, type: 'touchstart', handler: touchStartHandler },
            { element: this.canvas, type: 'touchmove', handler: touchMoveHandler },
            { element: this.canvas, type: 'touchend', handler: touchEndHandler }
        );
        
        // Responsive layout changes
        const resizeHandler = () => {
            const oldLayout = this.currentLayout;
            this.detectLayout();
            if (oldLayout !== this.currentLayout) {
                this.recreateControls();
            }
        };
        
        window.addEventListener('resize', resizeHandler);
        this.eventListeners.push({ element: window, type: 'resize', handler: resizeHandler });
        
        console.log('🎮 Zone event listeners attached');
    }

    /**
     * Check if position is in SIZ zone (where ink can start)
     */
    isInSIZZone(x) {
        const canvasWidth = this.canvas.width;
        const relativeX = x / canvasWidth;
        
        // Check if in left or right SIZ zones
        return (relativeX >= this.zones.leftSIZ.start && relativeX <= this.zones.leftSIZ.end) ||
               (relativeX >= this.zones.rightSIZ.start && relativeX <= this.zones.rightSIZ.end);
    }

    /**
     * Check if position is in FIA zone (text area - ink can pass but not start)
     */
    isInFIAZone(x) {
        const canvasWidth = this.canvas.width;
        const relativeX = x / canvasWidth;
        
        return relativeX >= this.zones.FIA.start && relativeX <= this.zones.FIA.end;
    }

    /**
     * Get absolute position accounting for scroll
     */
    getAbsolutePosition(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left + this.scrollOffset.x,
            y: clientY - rect.top + this.scrollOffset.y
        };
    }

    /**
     * Start drawing - ONLY if in SIZ zone
     */
    startDrawing(e) {
        const pos = this.getAbsolutePosition(e.clientX, e.clientY);
        
        // ΚΡΙΣΙΜΟΣ ΕΛΕΓΧΟΣ: Μόνο στις SIZ zones μπορεί να ξεκινήσει drawing
        if (!this.isInSIZZone(pos.x)) {
            console.log('🚫 Cannot start drawing outside SIZ zones');
            return; // ΔΕΝ επιτρέπουμε drawing να ξεκινήσει
        }
        
        console.log('✅ Drawing started in SIZ zone');
        this.isDrawing = true;
        this.lastX = pos.x;
        this.lastY = pos.y;
        
        this.currentPath = [{ x: this.lastX, y: this.lastY }];
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
    }

    /**
     * Draw - can cross all zones but with fade over text
     */
    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getAbsolutePosition(e.clientX, e.clientY);
        
        this.currentPath.push({ x: pos.x, y: pos.y });
        
        // Adjust opacity based on zone
        if (this.isInFIAZone(pos.x)) {
            // Fade ink over text area για αναγνωσιμότητα
            this.ctx.globalAlpha = 0.3;
        } else {
            // Full opacity in SIZ zones
            this.ctx.globalAlpha = 1.0;
        }
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        
        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    /**
     * Stop drawing
     */
    stopDrawing() {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        this.ctx.globalAlpha = 1.0; // Reset opacity
        
        if (this.currentPath.length > 0) {
            this.allPaths.push([...this.currentPath]);
            this.currentPath = [];
        }
    }

    /**
     * Clear canvas
     */
    clearCanvas() {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.allPaths = [];
        this.currentPath = [];
        
        console.log('🧹 Zone canvas cleared');
    }

    /**
     * Recreate controls when layout changes
     */
    recreateControls() {
        if (this.controlPanel && this.controlPanel.parentNode) {
            this.controlPanel.parentNode.removeChild(this.controlPanel);
        }
        this.createMinimalControls();
        
        // Re-attach control listeners
        const closeBtn = document.getElementById('close-zone-scribble');
        const clearBtn = document.getElementById('clear-zone-scribble');
        
        if (closeBtn) closeBtn.addEventListener('click', () => this.destroy());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearCanvas());
    }

    /**
     * Remove all event listeners
     */
    removeEventListeners() {
        this.eventListeners.forEach(({ element, type, handler }) => {
            if (element && element.removeEventListener) {
                element.removeEventListener(type, handler);
            }
        });
        this.eventListeners = [];
    }

    /**
     * Destroy and clean up
     */
    destroy() {
        console.log('🧹 Destroying Zone Scribble...');
        
        this.removeEventListeners();
        
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        
        if (this.controlPanel && this.controlPanel.parentNode) {
            this.controlPanel.parentNode.removeChild(this.controlPanel);
        }
        
        this.isActive = false;
        this.isDrawing = false;
        this.currentPath = [];
        this.allPaths = [];
        this.overlay = null;
        this.canvas = null;
        this.ctx = null;
        this.controlPanel = null;
        
        console.log('✅ Zone Scribble destroyed');
    }

    /**
     * Get scribble data
     */
    getScribbleData() {
        return {
            paths: this.allPaths,
            layout: this.currentLayout,
            zones: this.zones,
            canvasSize: {
                width: this.canvas ? this.canvas.width : 0,
                height: this.canvas ? this.canvas.height : 0
            },
            scrollOffset: this.scrollOffset
        };
    }
}

// Make globally available
window.ZoneScribble = ZoneScribble;

// Global toggle function
window.toggleZoneScribble = function() {
    if (!window.zoneScribbleInstance) {
        window.zoneScribbleInstance = new ZoneScribble();
        window.zoneScribbleInstance.init();
    } else {
        window.zoneScribbleInstance.destroy();
        window.zoneScribbleInstance = null;
    }
};

console.log('📏 Zone-Based Scribble Module loaded and ready');