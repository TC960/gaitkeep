// Advanced Scrollytelling Engine with Magnetic Scroll Snapping
class ScrollytellingEngine {
    constructor() {
        this.sections = [];
        this.currentSection = 0;
        this.scrollProgress = 0;
        this.isMobile = window.innerWidth <= 768;
        
        // Magnetic Scroll Snapping State
        this.isSnapping = false;
        this.snapCooldown = false;
        this.lastScrollPosition = 0;
        this.lastScrollTime = 0;
        this.scrollVelocity = 0;
        this.scrollDirection = 0; // -1 for up, 1 for down, 0 for none
        this.snapThreshold = 30; // Reduced for more sensitivity
        this.velocityThreshold = 0.3; // Reduced for more sensitivity
        this.snapCooldownTime = 600; // Reduced cooldown
        this.debounceTimer = null;
        this.snapDebounceTime = 100; // Reduced debounce time
        
        // Scroll Intent Detection
        this.wheelDelta = 0;
        this.touchStartY = 0;
        this.touchEndY = 0;
        this.scrollIntentThreshold = 20; // Reduced threshold
        
        // Section State Management
        this.section1Revealed = false;
        this.section2Animated = false;
        this.section3Animated = false;
        this.section4Animated = false;
        this.section5Animated = false;
        this.section6Animated = false;
        this.section7Animated = false;
        this.sectionTimers = {}; // Track timers for each section
        this.activeIntervals = {}; // Track active intervals
        
        // Preloading State Management
        this.preloadedSections = new Set(); // Track which sections have been preloaded
        this.preloadingQueue = []; // Queue for sections being preloaded
        
        // Gait Data Management
        this.gaitData = [];
        this.currentAgeGroup = 'all';
        
        this.init();
    }
    
    init() {
        this.setupSections();
        this.createProgressIndicator();
        this.createNavigationDots();
        this.loadGaitData();
        this.startMagneticScrollDetection();
        
        // PRELOADING ENHANCEMENT: Preload the first section's data immediately after initialization
        setTimeout(() => {
            this.preloadNextSection(-1); // Preload section 0 (first section after hero)
            console.log('🚀 Initial preloading completed - Ready for immediate data loading!');
        }, 500); // Give time for data loading to complete
        
        console.log('🧲 Magnetic Scrollytelling Engine initialized!');
    }
    
    // Load and parse CSV data
    async loadGaitData() {
        try {
            const response = await fetch('table.csv'); // Use consistent path
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            this.parseCSVData(csvText);
            console.log('📊 Gait data loaded:', this.gaitData.length, 'records - USING REAL DATA ✅');
        } catch (error) {
            console.error('❌ Error loading gait data:', error);
            console.warn('🔄 Falling back to mock data...');
            // Fallback to sample data if CSV fails to load
            this.createFallbackData();
        }
    }
    
    // Parse CSV data into usable format
    parseCSVData(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');
        
        this.gaitData = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const record = {};
            
            headers.forEach((header, index) => {
                record[header.trim()] = values[index]?.trim() || '';
            });
            
            // Only include records with valid group data
            if (record.Group && record['Speed-m/sec'] && record['height-inches']) {
                this.gaitData.push({
                    id: record['subject-id(1-50)'],
                    age: parseInt(record['age-months']),
                    gender: record.gender,
                    height: parseFloat(record['height-inches']),
                    weight: parseFloat(record['weight-lbs']),
                    legLength: parseFloat(record['leg-length-inches']),
                    speed: parseFloat(record['Speed-m/sec']),
                    group: record.Group.toLowerCase()
                });
            }
        }
    }
    
    // Fallback data if CSV loading fails
    createFallbackData() {
        console.warn('⚠️  USING MOCK DATA - Real CSV failed to load!');
        this.gaitData = [
            { height: 40, speed: 1.04, group: 'young' },
            { height: 47, speed: 1.32, group: 'middle' },
            { height: 60, speed: 1.26, group: 'old' }
        ];
        console.log('📊 Mock data created:', this.gaitData.length, 'records - USING MOCK DATA ❌');
    }
    
    // Filter data by age group
    getFilteredData(ageGroup = 'all') {
        if (ageGroup === 'all') {
            return this.gaitData;
        }
        return this.gaitData.filter(record => record.group === ageGroup);
    }
    
    // Calculate statistics for filtered data
    calculateDataStats(filteredData) {
        if (filteredData.length === 0) return null;
        
        const speeds = filteredData.map(d => d.speed);
        const heights = filteredData.map(d => d.height);
        
        return {
            count: filteredData.length,
            avgSpeed: speeds.reduce((a, b) => a + b, 0) / speeds.length,
            minSpeed: Math.min(...speeds),
            maxSpeed: Math.max(...speeds),
            avgHeight: heights.reduce((a, b) => a + b, 0) / heights.length,
            minHeight: Math.min(...heights),
            maxHeight: Math.max(...heights)
        };
    }
    
    // Generate data points for visualization
    generateDataPoints(ageGroup = 'all') {
        const filteredData = this.getFilteredData(ageGroup);
        const stats = this.calculateDataStats(filteredData);
        
        if (!stats) return [];
        
        // Create representative data points
        const dataPoints = [];
        
        if (ageGroup === 'all' || ageGroup === 'young') {
            const youngData = this.getFilteredData('young');
            if (youngData.length > 0) {
                const avgYoung = this.calculateDataStats(youngData);
                dataPoints.push({
                    position: (avgYoung.avgSpeed / 1.5) * 100, // Scale to percentage
                    height: Math.round(avgYoung.avgHeight * 2.54), // Convert to cm
                    speed: avgYoung.avgSpeed,
                    group: 'Young',
                    color: '#4ecdc4'
                });
            }
        }
        
        if (ageGroup === 'all' || ageGroup === 'middle') {
            const middleData = this.getFilteredData('middle');
            if (middleData.length > 0) {
                const avgMiddle = this.calculateDataStats(middleData);
                dataPoints.push({
                    position: (avgMiddle.avgSpeed / 1.5) * 100,
                    height: Math.round(avgMiddle.avgHeight * 2.54),
                    speed: avgMiddle.avgSpeed,
                    group: 'Middle',
                    color: '#45b7d1'
                });
            }
        }
        
        if (ageGroup === 'all' || ageGroup === 'old') {
            const oldData = this.getFilteredData('old');
            if (oldData.length > 0) {
                const avgOld = this.calculateDataStats(oldData);
                dataPoints.push({
                    position: (avgOld.avgSpeed / 1.5) * 100,
                    height: Math.round(avgOld.avgHeight * 2.54),
                    speed: avgOld.avgSpeed,
                    group: 'Old',
                    color: '#ff6b6b'
                });
            }
        }
        
        return dataPoints.sort((a, b) => a.speed - b.speed);
    }
    
    // Update data points visualization
    updateDataPointsVisualization(ageGroup = 'all', containerId = 'dataPointsContainer') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Clear existing points
        container.innerHTML = '';
        
        const dataPoints = this.generateDataPoints(ageGroup);
        
        dataPoints.forEach((point, index) => {
            const pointElement = document.createElement('div');
            pointElement.className = 'data-point';
            pointElement.style.left = `${Math.min(Math.max(point.position, 10), 90)}%`;
            
            pointElement.innerHTML = `
                <div class="point-marker" style="background: ${point.color}; border-color: ${point.color};"></div>
                <div class="point-label">
                    ${point.group} Group<br>
                    Height: ${point.height}cm<br>
                    Speed: ${point.speed.toFixed(2)} m/s
                </div>
            `;
            
            container.appendChild(pointElement);
        });
        
        console.log(`📊 Updated visualization for ${ageGroup} group:`, dataPoints.length, 'points');
    }
    
    // PRELOADING SYSTEM FOR IMMEDIATE DATA LOADING
    
    // Preload data and prepare animations for the next section
    preloadNextSection(currentSectionIndex) {
        const nextSectionIndex = currentSectionIndex + 1;
        if (nextSectionIndex >= this.sections.length) return; // No next section
        
        const nextSection = this.sections[nextSectionIndex];
        if (!nextSection || this.preloadedSections.has(nextSection.id)) return; // Already preloaded
        
        console.log(`🔄 Preloading data for next section: ${nextSection.id}`);
        
        // Add to preloading queue
        this.preloadingQueue.push(nextSection.id);
        
        // Preload based on section type
        switch(nextSection.id) {
            case 'section2':
                this.preloadNumberLineData('young');
                break;
            case 'section3':
                this.preloadNumberLineData('middle');
                break;
            case 'section4':
                this.preloadNumberLineData('old');
                break;
            case 'section5':
                this.preloadComparisonData();
                break;
            case 'section6':
                this.preloadGrowthTrendsData();
                break;
            case 'section7':
                this.preloadGaitVisualizationData();
                break;
        }
        
        // Mark as preloaded
        this.preloadedSections.add(nextSection.id);
        
        // Remove from queue
        const queueIndex = this.preloadingQueue.indexOf(nextSection.id);
        if (queueIndex > -1) {
            this.preloadingQueue.splice(queueIndex, 1);
        }
        
        console.log(`✅ Preloaded section: ${nextSection.id}`);
    }
    
    // Preload number line animation data for specific age group
    preloadNumberLineData(ageGroup) {
        // Generate and cache data points
        const dataPoints = this.generateDataPoints(ageGroup);
        
        // Pre-calculate animation sequences
        const speeds = [0, ...dataPoints.map(d => d.speed)];
        const positions = [0, ...dataPoints.map(d => Math.min(Math.max(d.position, 10), 90))];
        
        // Cache the preloaded data
        this[`${ageGroup}PreloadedData`] = {
            dataPoints,
            speeds,
            positions,
            timestamp: Date.now()
        };
        
        // Pre-update visualization containers
        const containerId = ageGroup === 'young' ? 'dataPointsContainer' : 
                           ageGroup === 'middle' ? 'dataPointsContainerMiddle' : 
                           'dataPointsContainerOld';
        
        this.updateDataPointsVisualization(ageGroup, containerId);
        
        console.log(`📊 Preloaded ${ageGroup} age group data:`, dataPoints.length, 'points');
    }
    
    // Preload comparison animation data
    preloadComparisonData() {
        const youngData = this.generateDataPoints('young');
        const middleData = this.generateDataPoints('middle');
        const oldData = this.generateDataPoints('old');
        
        // Calculate average speeds
        const youngAvg = youngData.length > 0 ? youngData.reduce((sum, d) => sum + d.speed, 0) / youngData.length : 0;
        const middleAvg = middleData.length > 0 ? middleData.reduce((sum, d) => sum + d.speed, 0) / middleData.length : 0;
        const oldAvg = oldData.length > 0 ? oldData.reduce((sum, d) => sum + d.speed, 0) / oldData.length : 0;
        
        // Cache preloaded comparison data
        this.comparisonPreloadedData = {
            youngAvg,
            middleAvg,
            oldAvg,
            maxSpeed: Math.max(youngAvg, middleAvg, oldAvg),
            timestamp: Date.now()
        };
        
        console.log('📊 Preloaded comparison data:', { youngAvg, middleAvg, oldAvg });
    }
    
    // Preload growth trends data
    preloadGrowthTrendsData() {
        const youngData = this.generateDataPoints('young');
        const middleData = this.generateDataPoints('middle');
        const oldData = this.generateDataPoints('old');
        
        // Calculate average speeds
        const youngAvg = youngData.length > 0 ? youngData.reduce((sum, d) => sum + d.speed, 0) / youngData.length : 1.0;
        const middleAvg = middleData.length > 0 ? middleData.reduce((sum, d) => sum + d.speed, 0) / middleData.length : 1.2;
        const oldAvg = oldData.length > 0 ? oldData.reduce((sum, d) => sum + d.speed, 0) / oldData.length : 1.28;
        
        // Cache preloaded growth trends data
        this.growthTrendsPreloadedData = {
            youngAvg,
            middleAvg,
            oldAvg,
            positions: this.calculateTrendPositions(youngAvg, middleAvg, oldAvg),
            timestamp: Date.now()
        };
        
        console.log('📊 Preloaded growth trends data:', { youngAvg, middleAvg, oldAvg });
    }
    
    // Calculate trend line positions for preloading
    calculateTrendPositions(youngSpeed, middleSpeed, oldSpeed) {
        const maxSpeed = 1.5; // Scale based on expected max speed
        const containerHeight = 240; // Height minus margins
        const containerWidth = 240; // Width minus margins
        
        // Calculate positions (inverted Y because SVG coordinates)
        const youngY = containerHeight - (youngSpeed / maxSpeed) * containerHeight;
        const middleY = containerHeight - (middleSpeed / maxSpeed) * containerHeight;
        const oldY = containerHeight - (oldSpeed / maxSpeed) * containerHeight;
        
        return [
            { x: 0, y: youngY, speed: youngSpeed, label: 'Young', color: '#4ecdc4' },
            { x: containerWidth / 2, y: middleY, speed: middleSpeed, label: 'Middle', color: '#45b7d1' },
            { x: containerWidth, y: oldY, speed: oldSpeed, label: 'Older', color: '#ff6b6b' }
        ];
    }
    
    // Preload gait visualization data (for section 7)
    preloadGaitVisualizationData() {
        // This section uses the same CSV data that's already loaded
        // Just mark it as ready for immediate initialization
        this.gaitVisualizationPreloadedData = {
            ready: true,
            timestamp: Date.now(),
            // Pre-calculate commonly used data for immediate access
            totalRecords: this.gaitData.length,
            ageGroups: [...new Set(this.gaitData.map(d => d.group))],
            ageRange: {
                min: Math.min(...this.gaitData.map(d => d.age)),
                max: Math.max(...this.gaitData.map(d => d.age))
            },
            speedRange: {
                min: Math.min(...this.gaitData.map(d => d.speed)),
                max: Math.max(...this.gaitData.map(d => d.speed))
            },
            // Pre-process age-speed mapping for immediate chart rendering
            ageSpeedMap: this.preprocessAgeSpeedData()
        };
        
        console.log('📊 Preloaded gait visualization data with processed chart data');
    }
    
    // Preprocess age-speed data for immediate chart rendering
    preprocessAgeSpeedData() {
        // Safety check for gait data availability
        if (!this.gaitData || this.gaitData.length === 0) {
            console.warn('⚠️ Gait data not available for preprocessing');
            return { labels: [], speeds: [], ageMap: {} };
        }
        
        const ageMap = {};
        this.gaitData.forEach(d => {
            if (!ageMap[d.age]) ageMap[d.age] = [];
            ageMap[d.age].push(d);
        });
        
        const labels = Object.keys(ageMap).map(a => +a).sort((a, b) => a - b);
        const speeds = labels.map(a => {
            const entries = ageMap[a];
            return entries.reduce((sum, e) => sum + e.speed, 0) / entries.length;
        });
        
        return { labels, speeds, ageMap };
    }
    
    // Check if section data is preloaded and ready
    isSectionPreloaded(sectionId) {
        return this.preloadedSections.has(sectionId);
    }
    
    // Clear old preloaded data to prevent memory leaks
    clearOldPreloadedData() {
        const currentTime = Date.now();
        const maxAge = 60000; // 1 minute
        
        // Clear age group data
        ['young', 'middle', 'old'].forEach(ageGroup => {
            const dataKey = `${ageGroup}PreloadedData`;
            if (this[dataKey] && currentTime - this[dataKey].timestamp > maxAge) {
                delete this[dataKey];
                console.log(`🗑️ Cleared old preloaded data for ${ageGroup} age group`);
            }
        });
        
        // Clear comparison data
        if (this.comparisonPreloadedData && currentTime - this.comparisonPreloadedData.timestamp > maxAge) {
            delete this.comparisonPreloadedData;
            console.log('🗑️ Cleared old preloaded comparison data');
        }
        
        // Clear growth trends data
        if (this.growthTrendsPreloadedData && currentTime - this.growthTrendsPreloadedData.timestamp > maxAge) {
            delete this.growthTrendsPreloadedData;
            console.log('🗑️ Cleared old preloaded growth trends data');
        }
        
        // Clear gait visualization data
        if (this.gaitVisualizationPreloadedData && currentTime - this.gaitVisualizationPreloadedData.timestamp > maxAge) {
            delete this.gaitVisualizationPreloadedData;
            console.log('🗑️ Cleared old preloaded gait visualization data');
        }
    }
    
    // Enhanced Scroll Intent Detection
    startMagneticScrollDetection() {
        let animationFrame = null;
        let scrollStabilizationTimer = null;
        let lastScrollTime = 0;
        
        const updateScrollState = () => {
            if (this.isSnapping) {
                animationFrame = null;
                return;
            }
            
            const currentTime = performance.now();
            const currentScrollTop = window.pageYOffset;
            
            // Calculate scroll velocity and direction
            const timeDelta = currentTime - this.lastScrollTime;
            const scrollDelta = currentScrollTop - this.lastScrollPosition;
            
            if (timeDelta > 0) {
                this.scrollVelocity = Math.abs(scrollDelta) / timeDelta;
                this.scrollDirection = scrollDelta > 0 ? 1 : scrollDelta < 0 ? -1 : 0;
            }
            
            // Update visual states
            this.updateCurrentSection();
            this.updateVisualStates();
            this.updateProgressIndicator();
            this.updateKidState();
            
            // Check for snap conditions
            this.checkSnapConditions(currentScrollTop, scrollDelta);
            
            this.lastScrollPosition = currentScrollTop;
            this.lastScrollTime = currentTime;
            lastScrollTime = currentTime;
            animationFrame = null;
        };
        
        // Auto-trigger content loading when scroll stabilizes
        const checkScrollStabilization = () => {
            clearTimeout(scrollStabilizationTimer);
            scrollStabilizationTimer = setTimeout(() => {
                // Trigger animations for current section after 100ms of scroll stability
                this.autoTriggerSectionAnimations();
            }, 100);
        };
        
        this.checkScrollStabilization = checkScrollStabilization;
        
        // Wheel event detection - more responsive
        window.addEventListener('wheel', (e) => {
            if (this.isSnapping || this.snapCooldown) {
                e.preventDefault();
                return;
            }
            
            this.wheelDelta += e.deltaY;
            
            // Trigger snap on significant wheel movement
            if (Math.abs(this.wheelDelta) > this.scrollIntentThreshold) {
                this.detectScrollIntent('wheel', this.wheelDelta > 0 ? 1 : -1);
                this.wheelDelta = 0;
            }
            
            if (!animationFrame) {
                animationFrame = requestAnimationFrame(updateScrollState);
            }
            
            // Trigger stabilization check
            checkScrollStabilization();
        }, { passive: false });
        
        // Touch event detection - more responsive
        window.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        window.addEventListener('touchmove', (e) => {
            if (this.isSnapping) {
                e.preventDefault();
                return;
            }
            
            if (!animationFrame) {
                animationFrame = requestAnimationFrame(updateScrollState);
            }
            
            // Trigger stabilization check
            checkScrollStabilization();
        }, { passive: false });
        
        window.addEventListener('touchend', (e) => {
            if (this.isSnapping || this.snapCooldown) return;
            
            this.touchEndY = e.changedTouches[0].clientY;
            const touchDelta = this.touchStartY - this.touchEndY;
            
            if (Math.abs(touchDelta) > this.scrollIntentThreshold) {
                this.detectScrollIntent('touch', touchDelta > 0 ? 1 : -1);
            }
            
            // Trigger stabilization check after touch ends
            checkScrollStabilization();
        }, { passive: true });
        
        // Natural scroll detection with automatic triggering
        window.addEventListener('scroll', () => {
            if (this.isSnapping) return;
            
            if (!animationFrame) {
                animationFrame = requestAnimationFrame(updateScrollState);
            }
            
            // Always check for stabilization on scroll
            checkScrollStabilization();
            
            // Debounced snap check for natural scrolling
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                if (!this.isSnapping && this.scrollVelocity < this.velocityThreshold) {
                    this.checkNaturalScrollSnap();
                }
            }, this.snapDebounceTime);
        }, { passive: true });
    }
    
    // Auto-trigger animations for current section
    autoTriggerSectionAnimations() {
        const currentSectionData = this.sections[this.currentSection];
        if (!currentSectionData) return;
        
        const sectionId = currentSectionData.id;
        const progress = currentSectionData.progress;
        
        // Only trigger if section is sufficiently visible
        if (currentSectionData.state === 'visible' || 
            (currentSectionData.state === 'entering' && progress > 0.1)) {
            
            console.log(`🎬 Auto-triggering animations for section: ${sectionId}`);
            
            switch(sectionId) {
                case 'section1':
                    if (!this.section1Revealed) {
                        this.section1Revealed = true;
                        setTimeout(() => {
                            const revealText = document.querySelector('#section1 .reveal-text');
                            if (revealText && this.currentSection === 1) {
                                revealText.classList.add('visible');
                            }
                        }, 100); // 100ms delay as requested
                    }
                    break;
                    
                case 'section2':
                    if (!this.section2Animated) {
                        this.section2Animated = true;
                        setTimeout(() => {
                            if (this.currentSection === 2) {
                                this.startStrideWalkerAnimation();
                                console.log('✨ Section 2 stride walker animation started');
                            }
                        }, 100);
                    }
                    break;
                    
                case 'section3':
                    if (!this.section3Animated) {
                        this.section3Animated = true;
                        setTimeout(() => {
                            if (this.currentSection === 3) {
                                this.startComparisonRaceAnimation();
                                console.log('✨ Section 3 comparison race animation started');
                            }
                        }, 100);
                    }
                    break;
                    
                case 'section4':
                    if (!this.section4Animated) {
                        this.section4Animated = true;
                        setTimeout(() => {
                            if (this.currentSection === 4) {
                                this.startIndividualWalkerAnimation();
                                console.log('✨ Section 4 individual walker animation started');
                            }
                        }, 100);
                    }
                    break;
                    
                case 'section5':
                    if (!this.section5Animated) {
                        this.section5Animated = true;
                        setTimeout(() => {
                            if (this.currentSection === 5) {
                                this.startComparisonAnimation();
                                console.log('✨ Section 5 comparison animation started');
                            }
                        }, 100);
                    }
                    break;
                    
                case 'section6':
                    if (!this.section6Animated) {
                        this.section6Animated = true;
                        setTimeout(() => {
                            if (this.currentSection === 6) {
                                this.startGrowthTrendsAnimation();
                                console.log('✨ Section 6 growth trends animation started');
                            }
                        }, 100);
                    }
                    break;
                    
                case 'section7':
                    if (!this.section7Animated) {
                        this.section7Animated = true;
                        setTimeout(() => {
                            if (this.currentSection === 7) {
                                this.startGaitVisualizationAnimation();
                                console.log('✨ Section 7 gait visualization animation started');
                            }
                        }, 100);
                    }
                    break;
            }
        }
    }
    
    // 2. CALCULATE TARGET SLIDE
    detectScrollIntent(method, direction) {
        if (this.isSnapping || this.snapCooldown) return;
        
        const currentSlide = this.getCurrentSlideIndex();
        let targetSlide = currentSlide;
        
        // Calculate target based on direction and method
        if (method === 'wheel' || method === 'touch') {
            targetSlide = direction > 0 ? currentSlide + 1 : currentSlide - 1;
        }
        
        // Ensure target is within bounds
        targetSlide = Math.max(0, Math.min(targetSlide, this.sections.length - 1));
        
        // Only snap if target is different from current
        if (targetSlide !== currentSlide) {
            this.snapToSlide(targetSlide);
        }
    }
    
    getCurrentSlideIndex() {
        const scrollTop = window.pageYOffset;
        const viewportHeight = window.innerHeight;
        const viewportCenter = scrollTop + viewportHeight * 0.5;
        
        let closestIndex = 0;
        let minDistance = Infinity;
        
        this.sections.forEach((section, index) => {
            const sectionCenter = section.offsetTop + section.height * 0.5;
            const distance = Math.abs(viewportCenter - sectionCenter);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
            }
        });
        
        return closestIndex;
    }
    
    checkNaturalScrollSnap() {
        const currentScrollTop = window.pageYOffset;
        const currentSlide = this.getCurrentSlideIndex();
        const targetSection = this.sections[currentSlide];
        
        if (!targetSection) return;
        
        // Calculate optimal position for current slide
        const optimalPosition = this.calculateOptimalPosition(currentSlide);
        const distanceFromOptimal = Math.abs(currentScrollTop - optimalPosition);
        
        // More aggressive snapping - snap if we're anywhere near a section boundary
        if (distanceFromOptimal > 5 && distanceFromOptimal < window.innerHeight * 0.4) {
            this.snapToSlide(currentSlide);
        }
    }
    
    checkSnapConditions(currentScrollTop, scrollDelta) {
        // Don't check if already snapping or in cooldown
        if (this.isSnapping || this.snapCooldown) return;
        
        // Check if scroll distance exceeds threshold
        if (Math.abs(scrollDelta) < this.snapThreshold) return;
        
        // Check if velocity is low enough for snapping
        if (this.scrollVelocity > this.velocityThreshold) return;
        
        // Check boundary conditions
        const currentSlide = this.getCurrentSlideIndex();
        
        // Don't snap beyond boundaries
        if ((this.scrollDirection < 0 && currentSlide === 0) ||
            (this.scrollDirection > 0 && currentSlide === this.sections.length - 1)) {
            return;
        }
        
        // All conditions met - trigger snap
        this.detectScrollIntent('natural', this.scrollDirection);
    }
    
    // 3. IMPLEMENT SNAP BEHAVIOR
    snapToSlide(targetIndex) {
        if (this.isSnapping || this.snapCooldown) return;
        
        const targetSection = this.sections[targetIndex];
        if (!targetSection) return;
        
        // Reset current section before moving
        if (this.currentSection !== targetIndex) {
            this.resetSectionState(this.currentSection);
        }
        
        // Set snapping state
        this.isSnapping = true;
        this.wheelDelta = 0; // Reset wheel accumulator
        
        // Calculate target scroll position
        const targetPosition = this.calculateOptimalPosition(targetIndex);
        
        // Perform smooth scroll
        this.smoothScrollTo(targetPosition, () => {
            this.isSnapping = false;
            this.currentSection = targetIndex;
            this.updateProgressIndicator();
            
            // Initialize new section state
            this.initializeSectionState(targetIndex);
            
            // Trigger animations exactly 100ms after snap completion
            setTimeout(() => {
                this.triggerSectionAnimations(targetIndex);
            }, 100);
            
            // Double-check alignment after snap
            setTimeout(() => {
                this.ensurePerfectAlignment(targetIndex);
            }, 50);
            
            // Start cooldown period
            this.startSnapCooldown();
        });
    }
    
    calculateOptimalPosition(sectionIndex) {
        const section = this.sections[sectionIndex];
        if (!section) return 0;
        
        let targetPosition;
        
        if (sectionIndex === 0) {
            // Hero section - scroll to absolute top
            targetPosition = 0;
        } else {
            // All other sections - align to top of viewport with small offset
            // This ensures no previous section content is visible
            targetPosition = section.offsetTop - 1; // 1px offset to ensure clean alignment
        }
        
        // Ensure we don't scroll past document end
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        return Math.min(Math.max(0, targetPosition), maxScroll);
    }
    
    smoothScrollTo(targetY, callback) {
        const startY = window.pageYOffset;
        const distance = targetY - startY;
        const duration = Math.min(1000, Math.max(400, Math.abs(distance) * 0.8));
        const startTime = performance.now();
        
        const easeInOutQuart = (t) => {
            return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
        };
        
        const animateScroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeInOutQuart(progress);
            
            const currentY = startY + (distance * easedProgress);
            window.scrollTo(0, currentY);
            
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            } else {
                if (callback) callback();
            }
        };
        
        requestAnimationFrame(animateScroll);
    }
    
    // Ensure perfect alignment after snapping
    ensurePerfectAlignment(sectionIndex) {
        const currentScrollTop = window.pageYOffset;
        const optimalPosition = this.calculateOptimalPosition(sectionIndex);
        const difference = Math.abs(currentScrollTop - optimalPosition);
        
        // If we're off by more than 2 pixels, make a micro-adjustment
        if (difference > 2) {
            window.scrollTo(0, optimalPosition);
        }
    }
    
    // 4. TIMING CONTROL
    startSnapCooldown() {
        this.snapCooldown = true;
        setTimeout(() => {
            this.snapCooldown = false;
        }, this.snapCooldownTime);
    }
    
    // SECTION SETUP AND MANAGEMENT
    setupSections() {
        const sectionElements = document.querySelectorAll('.hero, .story-section');
        this.sections = [];
        
        sectionElements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            const offsetTop = window.pageYOffset + rect.top;
            
            this.sections.push({
                element: element,
                index: index,
                id: element.id || `section-${index}`,
                offsetTop: offsetTop,
                height: element.offsetHeight,
                triggerPoint: offsetTop - window.innerHeight * 0.6,
                exitPoint: offsetTop + element.offsetHeight - window.innerHeight * 0.4,
                state: 'hidden',
                progress: 0
            });
        });
        
        // Adjust trigger points for mobile
        if (this.isMobile) {
            this.sections.forEach(section => {
                section.triggerPoint = section.offsetTop - window.innerHeight * 0.8;
                section.exitPoint = section.offsetTop + section.height - window.innerHeight * 0.6;
            });
            
            // Adjust snap parameters for mobile
            this.snapThreshold = 30;
            this.velocityThreshold = 0.3;
            this.scrollIntentThreshold = 20;
        }
    }
    
    updateCurrentSection() {
        const scrollTop = window.pageYOffset;
        let previousSection = this.currentSection;
        
        this.sections.forEach((section, index) => {
            // Calculate section progress
            if (scrollTop >= section.triggerPoint && scrollTop <= section.exitPoint) {
                const sectionScrollRange = section.exitPoint - section.triggerPoint;
                const sectionScrollProgress = (scrollTop - section.triggerPoint) / sectionScrollRange;
                section.progress = Math.max(0, Math.min(1, sectionScrollProgress));
                
                if (section.progress < 0.15) {
                    section.state = 'entering';
                } else if (section.progress > 0.85) {
                    section.state = 'exiting';
                } else {
                    section.state = 'visible';
                }
            } else if (scrollTop < section.triggerPoint) {
                section.state = 'hidden';
                section.progress = 0;
            } else {
                section.state = 'exited';
                section.progress = 1;
            }
        });
        
        // Update current section index if not snapping
        if (!this.isSnapping) {
            const activeSection = this.sections.find(s => s.state === 'visible');
            if (activeSection && this.currentSection !== activeSection.index) {
                    // Reset the previous section's state
                    this.resetSectionState(this.currentSection);
                const newSectionIndex = activeSection.index;
                this.currentSection = newSectionIndex;
                    // Initialize the new section
                    this.initializeSectionState(this.currentSection);
                
                console.log(`📍 Section changed to: ${this.sections[newSectionIndex].id}`);
                
                // PRELOADING INTEGRATION: Preload next section's data immediately
                this.preloadNextSection(newSectionIndex);
                
                // Trigger animations exactly 100ms after section becomes fully visible
                this.scheduleAnimationTrigger(newSectionIndex);
                
                // Clean up old preloaded data periodically
                if (Math.random() < 0.1) { // 10% chance to clean up on section change
                    this.clearOldPreloadedData();
                }
            }
        }
        
        // Calculate overall progress
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        this.scrollProgress = Math.min(window.pageYOffset / maxScroll, 1);
    }
    
    // Schedule animation trigger for when section is fully loaded
    scheduleAnimationTrigger(sectionIndex) {
        const sectionData = this.sections[sectionIndex];
        if (!sectionData) return;
        
        // Clear any existing timer for this section
        const timerKey = `section-${sectionIndex}-trigger`;
        if (this.sectionTimers[timerKey]) {
            clearTimeout(this.sectionTimers[timerKey]);
        }
        
        // Set up the 100ms trigger timer
        const triggerTimer = setTimeout(() => {
            // Double-check we're still in the same section
            if (this.currentSection === sectionIndex) {
                console.log(`🎬 Auto-triggering animations for ${sectionData.id} after 100ms`);
                this.triggerSectionAnimations(sectionIndex);
            }
        }, 100); // Exactly 100ms as requested
        
        // Store the timer
        if (!this.sectionTimers[timerKey]) {
            this.sectionTimers[timerKey] = [];
        }
        this.sectionTimers[timerKey] = triggerTimer;
    }
    
    // Trigger animations for specific section
    triggerSectionAnimations(sectionIndex) {
        const sectionData = this.sections[sectionIndex];
        if (!sectionData) return;
        
        const sectionId = sectionData.id;
        
        switch(sectionId) {
            case 'section1':
                if (!this.section1Revealed) {
                    this.section1Revealed = true;
                    const revealText = document.querySelector('#section1 .reveal-text');
                    if (revealText && this.currentSection === sectionIndex) {
                        revealText.classList.add('visible');
                        console.log('✨ Section 1 text revealed');
                    }
                }
                break;
                
            case 'section2':
                if (!this.section2Animated) {
                    this.section2Animated = true;
                    if (this.currentSection === sectionIndex) {
                        this.startStrideWalkerAnimation();
                        console.log('✨ Section 2 stride walker animation started');
                    }
                }
                break;
                
            case 'section3':
                if (!this.section3Animated) {
                    this.section3Animated = true;
                    if (this.currentSection === sectionIndex) {
                        this.startComparisonRaceAnimation();
                        console.log('✨ Section 3 comparison race animation started');
                    }
                }
                break;
                
            case 'section4':
                if (!this.section4Animated) {
                    this.section4Animated = true;
                    if (this.currentSection === sectionIndex) {
                        this.startIndividualWalkerAnimation();
                        console.log('✨ Section 4 individual walker animation started');
                    }
                }
                break;
                
            case 'section5':
                if (!this.section5Animated) {
                    this.section5Animated = true;
                    if (this.currentSection === sectionIndex) {
                        this.startComparisonAnimation();
                        console.log('✨ Section 5 comparison animation started');
                    }
                }
                break;
                
            case 'section6':
                if (!this.section6Animated) {
                    this.section6Animated = true;
                    if (this.currentSection === sectionIndex) {
                        this.startGrowthTrendsAnimation();
                        console.log('✨ Section 6 growth trends animation started');
                    }
                }
                break;
                
            case 'section7':
                if (!this.section7Animated) {
                    this.section7Animated = true;
                    if (this.currentSection === sectionIndex) {
                        this.startGaitVisualizationAnimation();
                        console.log('✨ Section 7 gait visualization animation started');
                    }
                }
                break;
        }
    }
    
    // Reset the state of a specific section
    resetSectionState(sectionIndex) {
        if (sectionIndex < 0 || sectionIndex >= this.sections.length) return;
        
        const sectionData = this.sections[sectionIndex];
        const sectionId = sectionData.id;
        
        console.log(`🔄 Resetting state for section: ${sectionId}`);
        
        switch(sectionId) {
            case 'section1':
                // Reset Chapter 1 reveal text
                this.section1Revealed = false;
                const revealText = document.querySelector('#section1 .reveal-text');
                if (revealText) {
                    revealText.classList.remove('visible');
                    revealText.style.opacity = '0';
                }
                break;
                
            case 'section2':
                // Reset Chapter 2 - Stride walker animation
                this.section2Animated = false;
                this.resetStrideWalkerAnimation();
                break;
                
            case 'section3':
                // Reset Chapter 3 - Comparison race animation
                this.section3Animated = false;
                this.resetComparisonRaceAnimation();
                break;
                
            case 'section4':
                // Reset Chapter 4 - Individual walker animation
                this.section4Animated = false;
                this.resetIndividualWalkerAnimation();
                break;
                
            case 'section5':
                // Reset Chapter 5 - Comparison animation
                this.section5Animated = false;
                this.resetComparisonAnimation();
                break;
                
            case 'section6':
                // Reset Chapter 6 - Growth trends animation
                this.section6Animated = false;
                this.resetGrowthTrendsAnimation();
                break;
                
            case 'section7':
                // Reset Chapter 7 - Gait visualization (previously section 6)
                this.section7Animated = false;
                // Reset any chart-related elements
                const gaitChart = document.getElementById('gaitSpeedChart');
                if (gaitChart && window.gaitChart) {
                    window.gaitChart.destroy();
                    window.gaitChart = null;
                }
                // Reset gait stats
                const gaitStats = ['gaitAgeStat', 'gaitSpeedStat', 'gaitLegLengthStat'];
                gaitStats.forEach(statId => {
                    const statElement = document.getElementById(statId);
                    if (statElement) {
                        statElement.textContent = '-';
                    }
                });
                break;
                
            case 'finale':
                // Reset finale victory animation
                const kidSvgFinale = document.getElementById('kidSvg');
                if (kidSvgFinale) {
                    kidSvgFinale.style.animation = '';
                }
                break;
        }
        
        // Clear any running timers for this section
        this.clearSectionTimers(sectionIndex);
    }
    
    // Initialize the state of a specific section
    initializeSectionState(sectionIndex) {
        if (sectionIndex < 0 || sectionIndex >= this.sections.length) return;
        
        const sectionData = this.sections[sectionIndex];
        const sectionId = sectionData.id;
        
        console.log(`🎬 Initializing state for section: ${sectionId}`);
        
        // Reset section-specific flags
        switch(sectionId) {
            case 'section1':
                this.section1Revealed = false;
                break;
            case 'section2':
                this.section2Animated = false;
                break;
            case 'section3':
                this.section3Animated = false;
                break;
            case 'section4':
                this.section4Animated = false;
                break;
            case 'section5':
                this.section5Animated = false;
                break;
            case 'section6':
                this.section6Animated = false;
                break;
            case 'section7':
                this.section7Animated = false;
                break;
        }
    }
    
    // Reset number line animation to initial state for specific age group
    resetNumberLineAnimation(ageGroup = 'young') {
        let kidElement, speedElement, containerElement;
        
        switch(ageGroup) {
            case 'young':
                kidElement = document.getElementById('numberlineKid');
                speedElement = document.getElementById('speedValue');
                containerElement = document.getElementById('dataPointsContainer');
                break;
            case 'middle':
                kidElement = document.getElementById('numberlineKidMiddle');
                speedElement = document.getElementById('speedValueMiddle');
                containerElement = document.getElementById('dataPointsContainerMiddle');
                break;
            case 'old':
                kidElement = document.getElementById('numberlineKidOld');
                speedElement = document.getElementById('speedValueOld');
                containerElement = document.getElementById('dataPointsContainerOld');
                break;
        }
        
        if (kidElement) {
            // Reset kid position to start
            kidElement.style.left = '0%';
            kidElement.classList.remove('walking');
            kidElement.style.animation = '';
        }
        
        if (speedElement) {
            // Reset speed display
            speedElement.textContent = '0.0 m/s';
            speedElement.style.fontSize = '1.8rem';
            speedElement.style.color = '#ff6b6b';
            speedElement.style.transform = 'scale(1)';
            speedElement.style.textShadow = '0 0 15px rgba(255, 107, 107, 0.5)';
        }
        
        if (containerElement) {
        // Hide all data points
            const dataPoints = containerElement.querySelectorAll('.data-point');
        dataPoints.forEach(point => {
            point.classList.remove('visible');
            point.style.animation = '';
        });
        }
        
        // Clear any trail elements
        const trails = document.querySelectorAll('[style*="trailFade"]');
        trails.forEach(trail => trail.remove());
        
        console.log(`🔄 Number line animation reset for ${ageGroup} group`);
    }
    
    // Reset comparison animation
    resetComparisonAnimation() {
        // Reset race kids
        const raceKids = ['raceKidYoung', 'raceKidMiddle', 'raceKidOld'];
        raceKids.forEach(kidId => {
            const kid = document.getElementById(kidId);
            if (kid) {
                kid.style.left = '0%';
                kid.style.animation = '';
            }
        });
        
        // Reset comparison speeds
        const comparisonSpeeds = ['speedValueComparisonYoung', 'speedValueComparisonMiddle', 'speedValueComparisonOld'];
        comparisonSpeeds.forEach(speedId => {
            const speedElement = document.getElementById(speedId);
            if (speedElement) {
                speedElement.textContent = '-';
            }
        });
        
        // Reset average speeds
        const avgSpeeds = ['youngAvgSpeed', 'middleAvgSpeed', 'oldAvgSpeed'];
        avgSpeeds.forEach(avgId => {
            const avgElement = document.getElementById(avgId);
            if (avgElement) {
                avgElement.textContent = '-';
            }
        });
        
        console.log('🔄 Comparison animation reset');
    }
    
    // Clear any running timers for a specific section
    clearSectionTimers(sectionIndex) {
        const sectionId = this.sections[sectionIndex]?.id;
        if (!sectionId) return;
        
        // Clear section-specific timers
        if (this.sectionTimers[sectionId]) {
            this.sectionTimers[sectionId].forEach(timerId => {
                clearTimeout(timerId);
            });
            this.sectionTimers[sectionId] = [];
        }
        
        // Clear section-specific intervals
        if (this.activeIntervals[sectionId]) {
            this.activeIntervals[sectionId].forEach(intervalId => {
                clearInterval(intervalId);
            });
            this.activeIntervals[sectionId] = [];
        }
        
        console.log(`⏰ Cleared all timers for section: ${sectionId}`);
    }
    
    // Helper method to add tracked timers
    addSectionTimer(sectionId, timerId) {
        if (!this.sectionTimers[sectionId]) {
            this.sectionTimers[sectionId] = [];
        }
        this.sectionTimers[sectionId].push(timerId);
    }
    
    // Helper method to add tracked intervals
    addSectionInterval(sectionId, intervalId) {
        if (!this.activeIntervals[sectionId]) {
            this.activeIntervals[sectionId] = [];
        }
        this.activeIntervals[sectionId].push(intervalId);
    }
    
    // VISUAL STATE MANAGEMENT
    updateVisualStates() {
        this.sections.forEach(section => {
            const content = section.element.querySelector('.content, .hero-content');
            if (!content) return;
            
            const animationDuration = this.isSnapping ? 600 : this.calculateAnimationDuration();
            content.style.transitionDuration = `${animationDuration}ms`;
            
            switch (section.state) {
                case 'hidden':
                    this.setElementState(content, {
                        opacity: 0,
                        transform: 'translateY(60px) scale(0.9)',
                        filter: 'blur(8px)'
                    });
                    break;
                    
                case 'entering':
                    const enterProgress = this.easeInOutCubic(Math.min(section.progress * 1.5, 1));
                    this.setElementState(content, {
                        opacity: enterProgress,
                        transform: `translateY(${60 * (1 - enterProgress)}px) scale(${0.9 + 0.1 * enterProgress})`,
                        filter: `blur(${8 * (1 - enterProgress)}px)`
                    });
                    break;
                    
                case 'visible':
                    this.setElementState(content, {
                        opacity: 1,
                        transform: 'translateY(0px) scale(1)',
                        filter: 'blur(0px)'
                    });
                    break;
                    
                case 'exiting':
                    const exitProgress = this.easeInOutCubic((section.progress - 0.85) / 0.15);
                    this.setElementState(content, {
                        opacity: Math.max(0.3, 1 - exitProgress * 0.7),
                        transform: `translateY(${-30 * exitProgress}px) scale(${1 - 0.05 * exitProgress})`,
                        filter: `blur(${3 * exitProgress}px)`
                    });
                    break;
            }
        });
    }
    
    setElementState(element, styles) {
        Object.assign(element.style, styles);
    }
    
    calculateAnimationDuration() {
        const baseSpeed = 600;
        const speedMultiplier = Math.max(0.4, Math.min(1.5, 1 / (this.scrollVelocity * 0.02 + 1)));
        return baseSpeed * speedMultiplier;
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
    
    // NAVIGATION METHODS
    navigateToSection(sectionIndex) {
        if (this.isSnapping) return;
        
        const section = this.sections[sectionIndex];
        if (section) {
            // Reset all sections when jumping to a specific one
            this.resetAllSections();
            this.snapToSlide(sectionIndex);
        }
    }
    
    // Reset all sections to their initial state
    resetAllSections() {
        console.log('🔄 Resetting all sections to initial state');
        
        for (let i = 0; i < this.sections.length; i++) {
            this.resetSectionState(i);
        }
        
        // Reset global flags
        this.section1Revealed = false;
        this.section2Animated = false;
        this.section3Animated = false;
        this.section4Animated = false;
        this.section5Animated = false;
        this.section6Animated = false;
        this.section7Animated = false;
        
        // Reset kid character to default state
        const kidSvg = document.getElementById('kidSvg');
        if (kidSvg) {
            kidSvg.style.animation = '';
            kidSvg.style.filter = 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.4))';
            kidSvg.classList.remove('jumping', 'walking', 'snapping');
        }
    }
    
    navigateToNextSection() {
        const nextIndex = Math.min(this.currentSection + 1, this.sections.length - 1);
        this.navigateToSection(nextIndex);
    }
    
    navigateToPrevSection() {
        const prevIndex = Math.max(this.currentSection - 1, 0);
        this.navigateToSection(prevIndex);
    }
    
    // UI COMPONENTS
    createProgressIndicator() {
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        progressBar.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <div class="progress-text">
                <span class="current-chapter">Hero</span>
                <span class="progress-percent">0%</span>
            </div>
            <div class="snap-indicator ${this.isSnapping ? 'active' : ''}">
                <span>🧲</span>
            </div>
        `;
        document.body.appendChild(progressBar);
    }
    
    createNavigationDots() {
        const nav = document.createElement('nav');
        nav.className = 'story-navigation';
        
        this.sections.forEach((section, index) => {
            const dot = document.createElement('button');
            dot.className = 'nav-dot';
            dot.setAttribute('data-section', index);
            dot.setAttribute('aria-label', `Go to ${this.getSectionTitle(section, index)}`);
            
            const tooltip = document.createElement('span');
            tooltip.className = 'nav-tooltip';
            tooltip.textContent = this.getSectionTitle(section, index);
            dot.appendChild(tooltip);
            
            dot.addEventListener('click', () => this.navigateToSection(index));
            nav.appendChild(dot);
        });
        
        document.body.appendChild(nav);
    }
    
    getSectionTitle(section, index) {
        if (index === 0) return 'Hero';
        if (section.id === 'finale') return 'Finale';
        return `Chapter ${index}`;
    }
    
    updateProgressIndicator() {
        const progressFill = document.querySelector('.progress-fill');
        const progressPercent = document.querySelector('.progress-percent');
        const currentChapter = document.querySelector('.current-chapter');
        const snapIndicator = document.querySelector('.snap-indicator');
        
        if (progressFill) {
            progressFill.style.width = `${this.scrollProgress * 100}%`;
        }
        
        if (progressPercent) {
            progressPercent.textContent = `${Math.round(this.scrollProgress * 100)}%`;
        }
        
        if (currentChapter) {
            currentChapter.textContent = this.getSectionTitle(this.sections[this.currentSection], this.currentSection);
        }
        
        if (snapIndicator) {
            snapIndicator.classList.toggle('active', this.isSnapping);
        }
        
        // Update navigation dots
        document.querySelectorAll('.nav-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSection);
            dot.classList.toggle('completed', index < this.currentSection);
        });
    }
    
    // KID CHARACTER MANAGEMENT
    updateKidState() {
        const kidSvg = document.getElementById('kidSvg');
        const kidContainer = document.querySelector('.kid-container');
        
        if (!kidSvg || !kidContainer) return;
        
        // Position kid based on scroll progress
        const maxMove = this.isMobile ? 50 : 70;
        const newTop = 15 + (this.scrollProgress * maxMove);
        kidContainer.style.top = `${Math.min(newTop, 85)}%`;
        
        // Rotation based on scroll
        const rotation = this.scrollProgress * 45;
        kidSvg.style.transform = `rotate(${rotation}deg)`;
        
        // Animation based on current section
        this.animateKidForSection();
        
        // Special snapping animation
        if (this.isSnapping) {
            kidSvg.classList.add('snapping');
        } else {
            kidSvg.classList.remove('snapping');
        }
    }
    
    animateKidForSection() {
        const kidSvg = document.getElementById('kidSvg');
        const currentSectionData = this.sections[this.currentSection];
        
        if (!kidSvg || !currentSectionData) return;
        
        const sectionId = currentSectionData.id;
        const progress = currentSectionData.progress;
        
        // Clear any existing animations first
        kidSvg.style.animation = '';
        kidSvg.classList.remove('jumping');
        
        switch(sectionId) {
            case 'hero':
                kidSvg.style.filter = 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.4))';
                break;
            case 'section1':
                const glowIntensity = 20 + (progress * 15);
                kidSvg.style.filter = `drop-shadow(0 0 ${glowIntensity}px rgba(255, 215, 0, ${0.7 + progress * 0.3}))`;
                break;
            case 'section2':
                // Young children chapter - teal glow
                kidSvg.style.filter = `drop-shadow(0 0 18px rgba(76, 205, 196, ${0.7 + progress * 0.3}))`;
                break;
            case 'section3':
                // Middle children chapter - blue glow
                kidSvg.style.filter = `drop-shadow(0 0 18px rgba(69, 183, 209, ${0.7 + progress * 0.3}))`;
                break;
            case 'section4':
                // Older children chapter - red glow
                kidSvg.style.filter = `drop-shadow(0 0 18px rgba(255, 107, 107, ${0.7 + progress * 0.3}))`;
                break;
            case 'section5':
                // Comparison chapter - multi-color glow
                const colors = ['76, 205, 196', '69, 183, 209', '255, 107, 107'];
                const colorIndex = Math.floor((progress * 3) % 3);
                kidSvg.style.filter = `drop-shadow(0 0 25px rgba(${colors[colorIndex]}, ${0.8 + progress * 0.2}))`;
                break;
            case 'section6':
                // Growth trends chapter - analytical glow
                kidSvg.style.filter = `drop-shadow(0 0 ${20 + progress * 10}px rgba(254, 202, 87, ${0.7 + progress * 0.3}))`;
                break;
            case 'section7':
                // Gait analysis chapter - scientific glow (previously section6)
                kidSvg.style.filter = `drop-shadow(0 0 ${25 + progress * 15}px rgba(150, 206, 180, ${0.8 + progress * 0.2}))`;
                break;
            case 'finale':
                kidSvg.style.animation = 'kidVictory 2s ease-in-out infinite';
                kidSvg.style.filter = 'drop-shadow(0 0 40px rgba(255, 215, 0, 1))';
                break;
        }
    }
    
    // Enhanced Number Line Animation with real data
    startNumberLineAnimation(ageGroup = 'young') {
        let numberlineKid, speedValue, sectionId, containerId;
        
        // Set up elements based on age group
        switch(ageGroup) {
            case 'young':
                numberlineKid = document.getElementById('numberlineKid');
                speedValue = document.getElementById('speedValue');
                sectionId = 'section2';
                containerId = 'dataPointsContainer';
                break;
            case 'middle':
                numberlineKid = document.getElementById('numberlineKidMiddle');
                speedValue = document.getElementById('speedValueMiddle');
                sectionId = 'section3';
                containerId = 'dataPointsContainerMiddle';
                break;
            case 'old':
                numberlineKid = document.getElementById('numberlineKidOld');
                speedValue = document.getElementById('speedValueOld');
                sectionId = 'section4';
                containerId = 'dataPointsContainerOld';
                break;
        }
        
        if (!numberlineKid || !speedValue) return;
        
        // Check if we have preloaded data for immediate animation
        const preloadedDataKey = `${ageGroup}PreloadedData`;
        let dataPoints, speeds, positions;
        
        if (this[preloadedDataKey]) {
            // Use preloaded data for immediate start
            console.log(`⚡ Using preloaded data for ${ageGroup} animation - IMMEDIATE START!`);
            dataPoints = this[preloadedDataKey].dataPoints;
            speeds = this[preloadedDataKey].speeds;
            positions = this[preloadedDataKey].positions;
        } else {
            // Generate data on-demand (fallback)
            console.log(`🔄 Generating data on-demand for ${ageGroup} animation`);
            dataPoints = this.generateDataPoints(ageGroup);
            speeds = [0, ...dataPoints.map(d => d.speed)];
            positions = [0, ...dataPoints.map(d => Math.min(Math.max(d.position, 10), 90))];
            
            // Update visualization if not already done
            this.updateDataPointsVisualization(ageGroup, containerId);
        }
        
        if (dataPoints.length === 0) {
            console.log(`⚠️ No data points available for ${ageGroup} animation`);
            return;
        }
        
        // Create animation sequence from data
        let currentStep = 0;
        const sectionIndex = this.sections.findIndex(s => s.id === sectionId);
        
        const animateStep = () => {
            // Check if we're still in the correct section
            if (this.currentSection !== sectionIndex) {
                console.log(`🛑 Animation stopped - left ${sectionId}`);
                return;
            }
            
            if (currentStep >= speeds.length) {
                // Final animation - show completion
                const finalTimerId = setTimeout(() => {
                    if (this.currentSection === sectionIndex) {
                        speedValue.style.color = this.getAgeGroupColor(ageGroup);
                        speedValue.style.textShadow = `0 0 20px ${this.getAgeGroupColor(ageGroup, 0.8)}`;
                    }
                }, 1000);
                this.addSectionTimer(sectionId, finalTimerId);
                
                // Show all data points after animation completes
                setTimeout(() => {
                    if (this.currentSection === sectionIndex) {
                        this.showAllDataPoints(ageGroup, containerId);
                    }
                }, 1500);
                return;
            }
            
            const speed = speeds[currentStep];
            const position = positions[currentStep];
            
            // Enhanced speed display update with animation
            speedValue.style.transform = 'scale(1.2)';
            speedValue.style.color = '#feca57';
            
            const speedUpdateTimerId = setTimeout(() => {
                if (this.currentSection === sectionIndex) {
                    speedValue.textContent = `${speed.toFixed(2)} m/s`;
                    speedValue.style.transform = 'scale(1)';
                    speedValue.style.color = '#ff6b6b';
                }
            }, 200);
            this.addSectionTimer(sectionId, speedUpdateTimerId);
            
            // Move kid on number line with enhanced animation
            numberlineKid.style.left = `${position}%`;
            numberlineKid.classList.add('walking');
            
            // Add trail effect
            if (currentStep > 0) {
                this.createSpeedTrail(numberlineKid);
            }
            
            // Enhanced walking animation duration
            const walkingTimerId = setTimeout(() => {
                if (this.currentSection === sectionIndex) {
                    numberlineKid.classList.remove('walking');
                    // Add a small bounce when stopping
                    numberlineKid.style.animation = 'kidLand 0.3s ease-out';
                    const landTimerId = setTimeout(() => {
                        if (this.currentSection === sectionIndex) {
                            numberlineKid.style.animation = '';
                        }
                    }, 300);
                    this.addSectionTimer(sectionId, landTimerId);
                }
            }, 2500);
            this.addSectionTimer(sectionId, walkingTimerId);
            
            currentStep++;
            
            // Continue to next step with dynamic timing
            if (currentStep < speeds.length) {
                const nextStepTimerId = setTimeout(animateStep, 3500);
                this.addSectionTimer(sectionId, nextStepTimerId);
            }
        };
        
        // Start animation - immediately if preloaded, with countdown if not
        if (this[preloadedDataKey]) {
            // IMMEDIATE START - data is preloaded
            const immediateStartTimerId = setTimeout(animateStep, 200); // Minimal delay for smooth transition
            this.addSectionTimer(sectionId, immediateStartTimerId);
            
            // Update speed display immediately
            speedValue.textContent = 'Ready!';
            speedValue.style.color = this.getAgeGroupColor(ageGroup);
        } else {
            // Traditional countdown for non-preloaded data
            this.showCountdown(ageGroup, speedValue, sectionId, sectionIndex, () => {
                const startTimerId = setTimeout(animateStep, 500);
                this.addSectionTimer(sectionId, startTimerId);
            });
        }
    }
    
    // Get color scheme for age groups
    getAgeGroupColor(ageGroup, opacity = 1) {
        switch(ageGroup) {
            case 'young': return `rgba(76, 205, 196, ${opacity})`;
            case 'middle': return `rgba(69, 183, 209, ${opacity})`;
            case 'old': return `rgba(255, 107, 107, ${opacity})`;
            default: return `rgba(76, 205, 196, ${opacity})`;
        }
    }
    
    // Start comparison animation for chapter 5
    startComparisonAnimation() {
        // Check if we have preloaded comparison data
        if (this.comparisonPreloadedData) {
            // Use preloaded data for immediate start
            console.log('⚡ Using preloaded comparison data - IMMEDIATE START!');
            const { youngAvg, middleAvg, oldAvg } = this.comparisonPreloadedData;
            
            // Update comparison displays immediately
            this.updateComparisonDisplay('young', youngAvg);
            this.updateComparisonDisplay('middle', middleAvg);
            this.updateComparisonDisplay('old', oldAvg);
            this.startRaceAnimation(youngAvg, middleAvg, oldAvg);
        } else {
            // Generate data on-demand (fallback)
            console.log('🔄 Generating comparison data on-demand');
            const youngData = this.generateDataPoints('young');
            const middleData = this.generateDataPoints('middle');
            const oldData = this.generateDataPoints('old');
            
            // Calculate average speeds
            const youngAvg = youngData.length > 0 ? youngData.reduce((sum, d) => sum + d.speed, 0) / youngData.length : 0;
            const middleAvg = middleData.length > 0 ? middleData.reduce((sum, d) => sum + d.speed, 0) / middleData.length : 0;
            const oldAvg = oldData.length > 0 ? oldData.reduce((sum, d) => sum + d.speed, 0) / oldData.length : 0;
            
            // Update comparison displays with traditional delay
            setTimeout(() => {
                if (this.currentSection === 5) {
                    this.updateComparisonDisplay('young', youngAvg);
                    this.updateComparisonDisplay('middle', middleAvg);
                    this.updateComparisonDisplay('old', oldAvg);
                    this.startRaceAnimation(youngAvg, middleAvg, oldAvg);
                }
            }, 1000);
        }
    }
    
    // Update comparison display for specific age group
    updateComparisonDisplay(ageGroup, avgSpeed) {
        const speedElement = document.getElementById(`speedValueComparison${ageGroup.charAt(0).toUpperCase() + ageGroup.slice(1)}`);
        
        if (speedElement) {
            speedElement.textContent = `${avgSpeed.toFixed(2)} m/s`;
            speedElement.style.color = this.getAgeGroupColor(ageGroup).replace('1)', '1)');
        }
    }
    
    // Start race animation
    startRaceAnimation(youngSpeed, middleSpeed, oldSpeed) {
        const maxSpeed = Math.max(youngSpeed, middleSpeed, oldSpeed);
        const animationDuration = 4000; // 4 seconds
        
        // Calculate final positions based on relative speeds
        const youngPosition = (youngSpeed / maxSpeed) * 80; // 80% max to leave room
        const middlePosition = (middleSpeed / maxSpeed) * 80;
        const oldPosition = (oldSpeed / maxSpeed) * 80;
        
        // Animate race kids
        setTimeout(() => {
            if (this.currentSection === 5) {
                this.animateRaceKid('raceKidYoung', youngPosition, animationDuration);
                this.animateRaceKid('raceKidMiddle', middlePosition, animationDuration);
                this.animateRaceKid('raceKidOld', oldPosition, animationDuration);
            }
        }, 500);
    }
    
    // Animate individual race kid
    animateRaceKid(kidId, finalPosition, duration) {
        const kid = document.getElementById(kidId);
        if (!kid) return;
        
        kid.style.transition = `left ${duration}ms ease-out`;
        kid.style.left = `${finalPosition}%`;
        
        // Add walking animation
        kid.classList.add('racing');
        
        setTimeout(() => {
            kid.classList.remove('racing');
        }, duration);
    }
    
    // Show all data points with staggered animation for specific container
    showAllDataPoints(ageGroup, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const dataPointElements = container.querySelectorAll('.data-point');
        const sectionIndex = this.sections.findIndex(s => 
            (ageGroup === 'young' && s.id === 'section2') ||
            (ageGroup === 'middle' && s.id === 'section3') ||
            (ageGroup === 'old' && s.id === 'section4')
        );
        
        dataPointElements.forEach((element, index) => {
            const showTimerId = setTimeout(() => {
                if (this.currentSection === sectionIndex) {
                    element.classList.add('visible');
                    element.style.animation = 'dataPointAppear 0.8s ease-out, pointShake 0.5s ease-in-out 0.8s';
                }
            }, index * 400);
            
            const sectionId = ageGroup === 'young' ? 'section2' : ageGroup === 'middle' ? 'section3' : 'section4';
            this.addSectionTimer(sectionId, showTimerId);
        });
    }
    
    // Enhanced countdown with timer tracking for specific age group
    showCountdown(ageGroup, speedValue, sectionId, sectionIndex, callback) {
        if (!speedValue) return callback();
        
        let count = 3;
        const countdownInterval = setInterval(() => {
            // Check if we're still in the correct section
            if (this.currentSection !== sectionIndex) {
                clearInterval(countdownInterval);
                return;
            }
            
            speedValue.textContent = count.toString();
            speedValue.style.fontSize = '2.5rem';
            speedValue.style.color = '#feca57';
            speedValue.style.transform = 'scale(1.3)';
            
            const scaleTimerId = setTimeout(() => {
                if (this.currentSection === sectionIndex) {
                    speedValue.style.transform = 'scale(1)';
                }
            }, 300);
            this.addSectionTimer(sectionId, scaleTimerId);
            
            count--;
            
            if (count < 0) {
                clearInterval(countdownInterval);
                if (this.currentSection === sectionIndex) {
                    speedValue.textContent = 'GO!';
                    speedValue.style.color = this.getAgeGroupColor(ageGroup);
                    const goTimerId = setTimeout(() => {
                        if (this.currentSection === sectionIndex) {
                            speedValue.style.fontSize = '1.8rem';
                            callback();
                        }
                    }, 500);
                    this.addSectionTimer(sectionId, goTimerId);
                }
            }
        }, 800);
        
        this.addSectionInterval(sectionId, countdownInterval);
    }
    
    // Create visual trail effect
    createSpeedTrail(element) {
        const trail = document.createElement('div');
        trail.style.cssText = `
            position: absolute;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, rgba(76, 205, 196, 0.6), transparent);
            border-radius: 50%;
            pointer-events: none;
            z-index: 5;
            top: 50%;
            left: ${element.style.left};
            transform: translate(-50%, -50%);
            animation: trailFade 1.5s ease-out forwards;
        `;
        
        element.parentElement.appendChild(trail);
        
        setTimeout(() => {
            trail.remove();
        }, 1500);
    }
    
    // Start growth trends animation for chapter 6
    startGrowthTrendsAnimation() {
        // Check if we have preloaded growth trends data
        if (this.growthTrendsPreloadedData) {
            // Use preloaded data for immediate start
            console.log('⚡ Using preloaded growth trends data - IMMEDIATE START!');
            const { youngAvg, middleAvg, oldAvg } = this.growthTrendsPreloadedData;
            
            // Animate trend visualization immediately
            this.drawTrendLine(youngAvg, middleAvg, oldAvg);
            this.updateTrendStats(youngAvg, middleAvg, oldAvg);
        } else {
            // Generate data on-demand (fallback)
            console.log('🔄 Generating growth trends data on-demand');
            const youngData = this.generateDataPoints('young');
            const middleData = this.generateDataPoints('middle');
            const oldData = this.generateDataPoints('old');
            
            // Calculate average speeds
            const youngAvg = youngData.length > 0 ? youngData.reduce((sum, d) => sum + d.speed, 0) / youngData.length : 1.0;
            const middleAvg = middleData.length > 0 ? middleData.reduce((sum, d) => sum + d.speed, 0) / middleData.length : 1.2;
            const oldAvg = oldData.length > 0 ? oldData.reduce((sum, d) => sum + d.speed, 0) / oldData.length : 1.28;
            
            // Animate trend visualization with traditional delay
            setTimeout(() => {
                if (this.currentSection === 6) { // Check if still in section 6 (hero=0, so section6=6)
                    this.drawTrendLine(youngAvg, middleAvg, oldAvg);
                    this.updateTrendStats(youngAvg, middleAvg, oldAvg);
                }
            }, 1000);
        }
    }
    
    // Draw animated trend line
    drawTrendLine(youngSpeed, middleSpeed, oldSpeed) {
        const trendLine = document.getElementById('trendLine');
        const trendPoints = document.getElementById('trendPoints');
        
        if (!trendLine || !trendPoints) return;
        
        // Clear existing content
        trendLine.innerHTML = '';
        trendPoints.innerHTML = '';
        
        const maxSpeed = 1.5; // Scale based on expected max speed
        const containerHeight = 240; // Height minus margins
        const containerWidth = 240; // Width minus margins
        
        // Calculate positions (inverted Y because SVG coordinates)
        const youngY = containerHeight - (youngSpeed / maxSpeed) * containerHeight;
        const middleY = containerHeight - (middleSpeed / maxSpeed) * containerHeight;
        const oldY = containerHeight - (oldSpeed / maxSpeed) * containerHeight;
        
        const positions = [
            { x: 0, y: youngY, speed: youngSpeed, label: 'Young', color: '#4ecdc4' },
            { x: containerWidth / 2, y: middleY, speed: middleSpeed, label: 'Middle', color: '#45b7d1' },
            { x: containerWidth, y: oldY, speed: oldSpeed, label: 'Older', color: '#ff6b6b' }
        ];
        
        // Create SVG for trend line
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        
        // Create animated line path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const pathData = `M ${positions[0].x} ${positions[0].y} Q ${positions[1].x} ${positions[1].y} ${positions[2].x} ${positions[2].y}`;
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', '#feca57');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-dasharray', '500'); // Increased from 300 to 500 for longer line
        path.setAttribute('stroke-dashoffset', '500'); // Increased from 300 to 500 to match
        path.style.animation = 'drawLine 2s ease-out forwards';
        
        svg.appendChild(path);
        trendLine.appendChild(svg);
        
        // Add trend points with animation
        positions.forEach((pos, index) => {
            setTimeout(() => {
                if (this.currentSection === 6) { // Check if still in section 6 (hero=0, so section6=6)
                    const point = document.createElement('div');
                    point.style.position = 'absolute';
                    point.style.left = `${(pos.x / containerWidth) * 100}%`;
                    point.style.top = `${(pos.y / containerHeight) * 100}%`;
                    point.style.width = '12px';
                    point.style.height = '12px';
                    point.style.background = pos.color;
                    point.style.borderRadius = '50%';
                    point.style.border = '2px solid white';
                    point.style.transform = 'translate(-50%, -50%)';
                    point.style.boxShadow = `0 0 15px ${pos.color}`;
                    point.style.animation = 'pointAppear 0.5s ease-out';
                    
                    // Add tooltip
                    const tooltip = document.createElement('div');
                    tooltip.textContent = `${pos.label}: ${pos.speed.toFixed(2)} m/s`;
                    tooltip.style.position = 'absolute';
                    tooltip.style.bottom = '20px';
                    tooltip.style.left = '50%';
                    tooltip.style.transform = 'translateX(-50%)';
                    tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
                    tooltip.style.color = 'white';
                    tooltip.style.padding = '4px 8px';
                    tooltip.style.borderRadius = '4px';
                    tooltip.style.fontSize = '0.7rem';
                    tooltip.style.whiteSpace = 'nowrap';
                    tooltip.style.opacity = '0';
                    tooltip.style.transition = 'opacity 0.3s ease';
                    
                    point.appendChild(tooltip);
                    point.addEventListener('mouseenter', () => tooltip.style.opacity = '1');
                    point.addEventListener('mouseleave', () => tooltip.style.opacity = '0');
                    
                    trendPoints.appendChild(point);
                }
            }, index * 500 + 2000); // Staggered after line animation
        });
        
        // Add CSS keyframes for animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes drawLine {
                to { stroke-dashoffset: 0; }
            }
            @keyframes pointAppear {
                from { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Update trend statistics
    updateTrendStats(youngSpeed, middleSpeed, oldSpeed) {
        const stats = [
            { id: 'youngTrendStat', speed: youngSpeed, trend: 'Growing' },
            { id: 'middleTrendStat', speed: middleSpeed, trend: 'Developing' },
            { id: 'oldTrendStat', speed: oldSpeed, trend: 'Maturing' }
        ];
        
        stats.forEach((stat, index) => {
            setTimeout(() => {
                if (this.currentSection === 6) { // Check if still in section 6 (hero=0, so section6=6)
                    const element = document.getElementById(stat.id);
                    if (element) {
                        element.textContent = `${stat.speed.toFixed(2)} m/s (${stat.trend})`;
                        element.style.animation = 'statUpdate 0.5s ease-out';
                    }
                }
            }, 3000 + index * 300); // After line and points
        });
        
        // Add stat update animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes statUpdate {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            @keyframes chartAppear {
                from { transform: scale(0.9); opacity: 0; filter: blur(5px); }
                to { transform: scale(1); opacity: 1; filter: blur(0px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Reset growth trends animation
    resetGrowthTrendsAnimation() {
        // Reset trend line
        const trendLine = document.getElementById('trendLine');
        if (trendLine) {
            trendLine.innerHTML = '';
        }
        
        // Reset trend points
        const trendPoints = document.getElementById('trendPoints');
        if (trendPoints) {
            trendPoints.innerHTML = '';
        }
        
        // Reset trend stats
        const trendStats = ['youngTrendStat', 'middleTrendStat', 'oldTrendStat'];
        trendStats.forEach(statId => {
            const statElement = document.getElementById(statId);
            if (statElement) {
                statElement.textContent = '-';
            }
        });
        
        console.log('🔄 Growth trends animation reset');
    }
    
    // Start gait visualization animation for chapter 7
    startGaitVisualizationAnimation() {
        // Check if we have preloaded gait visualization data
        if (this.gaitVisualizationPreloadedData && this.gaitVisualizationPreloadedData.ready) {
            // Use preloaded data for immediate start
            console.log('⚡ Using preloaded gait visualization data - IMMEDIATE START!');
            
            // Initialize the gait visualization immediately with preloaded data
            this.initializeGaitVisualizationImmediate();
            
            // Trigger initial chart render with preloaded data
            setTimeout(() => {
                if (this.currentSection === 7) {
                    this.renderGaitChartImmediate();
                }
            }, 200); // Minimal delay for DOM readiness
            
        } else {
            // Generate data on-demand (fallback)
            console.log('🔄 Initializing gait visualization on-demand');
            
            // Traditional initialization with delay
            setTimeout(() => {
                if (this.currentSection === 7) {
                    this.initializeGaitVisualizationFallback();
                }
            }, 1000);
        }
    }
    
    // Initialize gait visualization immediately using preloaded data
    initializeGaitVisualizationImmediate() {
        const preloadedData = this.gaitVisualizationPreloadedData;
        
        // Set default values immediately using preloaded ranges
        const ageSlider = document.getElementById("gaitAgeSlider");
        const speedSlider = document.getElementById("gaitSpeedSlider");
        const legSlider = document.getElementById("gaitLegSlider");
        
        if (ageSlider) {
            ageSlider.min = preloadedData.ageRange.min;
            ageSlider.max = preloadedData.ageRange.max;
            ageSlider.value = Math.round((preloadedData.ageRange.min + preloadedData.ageRange.max) / 2);
        }
        
        if (speedSlider) {
            speedSlider.min = preloadedData.speedRange.min.toFixed(1);
            speedSlider.max = preloadedData.speedRange.max.toFixed(1);
            speedSlider.value = preloadedData.speedRange.min.toFixed(1);
        }
        
        // Update stats immediately with preloaded data
        this.updateGaitStatsImmediate(parseInt(ageSlider?.value || preloadedData.ageRange.min));
        
        console.log('⚡ Gait visualization initialized immediately with preloaded data');
    }
    
    // Render gait chart immediately using preloaded data
    renderGaitChartImmediate() {
        const chartCanvas = document.getElementById("gaitSpeedChart");
        if (!chartCanvas) return;
        
        const preloadedData = this.gaitVisualizationPreloadedData;
        const { labels, speeds } = preloadedData.ageSpeedMap;
        
        // Clear any existing chart
        if (window.gaitChart) {
            window.gaitChart.destroy();
        }
        
        // Create chart immediately with preloaded data
        window.gaitChart = new Chart(chartCanvas, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "Avg Speed (m/s)",
                    data: speeds,
                    borderColor: "#FF6B6B",
                    backgroundColor: "rgba(255, 107, 107, 0.1)",
                    fill: false,
                    tension: 0.2,
                    pointBackgroundColor: "#FF6B6B",
                    pointRadius: 3,
                    pointHoverRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: "Age (months)",
                            color: "#333",
                            font: { size: 14, weight: 'bold' }
                        },
                        grid: { color: "rgba(0,0,0,0.1)" }
                    },
                    y: {
                        title: {
                            display: true,
                            text: "Speed (m/s)",
                            color: "#333",
                            font: { size: 14, weight: 'bold' }
                        },
                        grid: { color: "rgba(0,0,0,0.1)" }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: "#333", font: { size: 12 } }
                    }
                }
            }
        });
        
        console.log('📊 Gait chart rendered immediately with preloaded data');
        
        // Trigger entry animation
        setTimeout(() => {
            if (this.currentSection === 7) {
                chartCanvas.style.animation = 'chartAppear 0.8s ease-out';
            }
        }, 100);
    }
    
    // Update gait stats immediately using preloaded data
    updateGaitStatsImmediate(selectedAge) {
        const preloadedData = this.gaitVisualizationPreloadedData;
        const { ageMap } = preloadedData.ageSpeedMap;
        
        let stats = ageMap[selectedAge] || [];
        
        // If no data at this age, find closest age
        if (stats.length === 0) {
            const availableAges = Object.keys(ageMap).map(a => +a).sort((a, b) => Math.abs(a - selectedAge) - Math.abs(b - selectedAge));
            if (availableAges.length > 0) {
                selectedAge = availableAges[0];
                stats = ageMap[selectedAge] || [];
            }
        }
        
        const ageStat = document.getElementById("gaitAgeStat");
        const speedStat = document.getElementById("gaitSpeedStat");
        const legStat = document.getElementById("gaitLegLengthStat");
        
        if (stats.length > 0) {
            const avgSpeed = stats.reduce((sum, d) => sum + d.speed, 0) / stats.length;
            const avgLeg = stats.reduce((sum, d) => sum + d.legLength, 0) / stats.length;
            
            if (ageStat) ageStat.textContent = `${selectedAge} months`;
            if (speedStat) speedStat.textContent = `${avgSpeed.toFixed(2)} m/s`;
            if (legStat) legStat.textContent = `${avgLeg.toFixed(1)} in`;
            
            // Update walker animation speed
            const walker = document.getElementById("gaitWalker");
            if (walker) {
                walker.style.animationDuration = `${(10 / (avgSpeed * 10)).toFixed(2)}s`;
            }
        } else {
            if (ageStat) ageStat.textContent = `${selectedAge} months`;
            if (speedStat) speedStat.textContent = "—";
            if (legStat) legStat.textContent = "—";
        }
    }
    
    // Fallback initialization for gait visualization (traditional method)
    initializeGaitVisualizationFallback() {
        // This would trigger the existing GaitVisualization class initialization
        // But with the preloading system, this should rarely be needed
        console.log('🔄 Using fallback gait visualization initialization');
        
        // Re-initialize the GaitVisualization class if it exists
        if (window.gaitViz) {
            window.gaitViz.updateChart();
        }
    }
    
    // NEW ANIMATION METHODS FOR CHAPTERS 2, 3, 4
    
    // Chapter 2: Stride Walker Animation
    startStrideWalkerAnimation() {
        console.log('🚶 Starting stride walker animation');
        
        // Initialize SVGs for both younger and older walkers
        this.initWalkerSVG('younger');
        this.initWalkerSVG('older');
        
        // Set up event listeners for stride walker controls
        this.setupStrideWalkerControls();
        
        // Load initial subject data
        this.loadStrideSubjectData();
        
        // Initialize stride variability plots
        setTimeout(() => {
            if (this.currentSection === 2) {
                this.initializeStrideVariabilityPlots();
            }
        }, 200);
        
        // Auto-populate dropdowns and start with default subjects
        setTimeout(() => {
            if (this.currentSection === 2) {
                this.populateStrideDropdowns();
                this.autoSelectDefaultStrideSubjects();
            }
        }, 500);
    }
    
    // Initialize walker SVG for stride animation
    initWalkerSVG(walkerId) {
        const svg = document.querySelector(`.kid-svg.${walkerId}`);
        if (!svg) return;
        
        // Set up articulated walker SVG
        svg.innerHTML = `
            <rect x="40" y="20" width="30" height="30" fill="#FFD700"></rect> <!-- head -->
            <rect x="40" y="50" width="20" height="30" fill="#FF6B6B"></rect> <!-- body -->
            <!-- Left leg -->
            <g class="leg left-leg" transform="translate(40,80)">
                <rect class="thigh" x="0" y="0" width="5" height="15" fill="#4ECDC4"></rect>
                <rect class="calf" x="0" y="15" width="5" height="15" fill="#4ECDC4"></rect>
            </g>
            <!-- Right leg -->
            <g class="leg right-leg" transform="translate(50,80)">
                <rect class="thigh" x="0" y="0" width="5" height="15" fill="#4ECDC4"></rect>
                <rect class="calf" x="0" y="15" width="5" height="15" fill="#4ECDC4"></rect>
            </g>
        `;
        
        console.log(`🎬 Initialized ${walkerId} walker SVG`);
    }
    
    // Set up stride walker controls
    setupStrideWalkerControls() {
        const startButton = document.getElementById('startButton');
        if (startButton) {
            console.log('✅ Found start button, attaching event listener');
            
            // Remove any existing event listeners
            startButton.removeEventListener('click', this.toggleStrideWalking);
            
            // Add new event listener
            startButton.addEventListener('click', () => {
                console.log('🔘 Start button clicked');
                this.toggleStrideWalking();
            });
        } else {
            console.error('❌ Start button not found with ID: startButton');
        }
        
        // Set up subject selection dropdowns
        ['younger', 'older'].forEach(walkerId => {
            const select = document.getElementById(`subjectSelect${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`);
            if (select) {
                console.log(`✅ Found ${walkerId} subject select`);
                select.addEventListener('change', (e) => {
                    this.onStrideSubjectChange(walkerId, parseInt(e.target.value));
                });
            } else {
                console.warn(`⚠️ Could not find subject select for ${walkerId}`);
            }
        });
    }
    
    // Load stride subject data
    loadStrideSubjectData() {
        // Use existing gait data to populate stride subjects
        if (!this.gaitData || this.gaitData.length === 0) {
            console.warn('⚠️ No gait data available for stride subjects');
            return;
        }
        
        // Store stride data reference
        this.strideSubjects = this.gaitData;
        console.log('📊 Loaded stride subject data:', this.strideSubjects.length, 'subjects');
    }
    
    // Populate stride dropdowns
    populateStrideDropdowns() {
        if (!this.strideSubjects) return;
        
        const youngerSelect = document.getElementById('subjectSelectYounger');
        const olderSelect = document.getElementById('subjectSelectOlder');
        
        if (youngerSelect) {
            youngerSelect.innerHTML = '<option value="">Choose subject...</option>';
            this.strideSubjects.filter(s => s.group === 'young').forEach(subject => {
                const option = document.createElement('option');
                option.value = subject.id;
                option.textContent = `Subject ${subject.id} (${subject.age} months, ${subject.speed.toFixed(2)} m/s)`;
                youngerSelect.appendChild(option);
            });
        }
        
        if (olderSelect) {
            olderSelect.innerHTML = '<option value="">Choose subject...</option>';
            this.strideSubjects.filter(s => s.group === 'old').forEach(subject => {
                const option = document.createElement('option');
                option.value = subject.id;
                option.textContent = `Subject ${subject.id} (${subject.age} months, ${subject.speed.toFixed(2)} m/s)`;
                olderSelect.appendChild(option);
            });
        }
    }
    
    // Auto-select default stride subjects
    autoSelectDefaultStrideSubjects() {
        const youngerSelect = document.getElementById('subjectSelectYounger');
        const olderSelect = document.getElementById('subjectSelectOlder');
        
        if (youngerSelect && youngerSelect.options.length > 1) {
            youngerSelect.selectedIndex = 1; // Select first available subject
            this.onStrideSubjectChange('younger', parseInt(youngerSelect.value));
        }
        
        if (olderSelect && olderSelect.options.length > 1) {
            olderSelect.selectedIndex = 1; // Select first available subject
            this.onStrideSubjectChange('older', parseInt(olderSelect.value));
        }
    }
    
    // Handle stride subject change
    onStrideSubjectChange(walkerId, subjectId) {
        const subject = this.strideSubjects.find(s => s.id === subjectId);
        if (!subject) return;
        
        // Update stats display
        const currentIntervalEl = document.getElementById(`currentInterval${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`);
        const avgIntervalEl = document.getElementById(`avgInterval${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`);
        const stdDevEl = document.getElementById(`stdDev${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`);
        
        if (currentIntervalEl) currentIntervalEl.textContent = '-';
        if (avgIntervalEl) avgIntervalEl.textContent = `${(600 + Math.random() * 200).toFixed(0)}`;
        if (stdDevEl) stdDevEl.textContent = `${(50 + Math.random() * 30).toFixed(0)}`;
        
        // Reset and reinitialize the plot with subject-specific parameters
        this.resetSubjectSpecificPlot(walkerId, subject);
        
        console.log(`📊 Selected ${walkerId} subject:`, subject.id, subject.speed.toFixed(2), 'm/s');
    }
    
    // Reset and reinitialize plot for specific subject
    resetSubjectSpecificPlot(walkerId, subject) {
        // Stop any existing real-time updates
        this.stopRealTimeVariabilityPlot(walkerId);
        
        // Store subject-specific parameters for this walker
        this[`${walkerId}CurrentSubject`] = subject;
        
        // If walking is currently active, restart the plot with new subject parameters
        const startButton = document.getElementById('startButton');
        if (startButton && startButton.textContent.includes('Pause')) {
            // Reinitialize plot with subject-specific parameters
            this.initializeRealTimeVariabilityPlot(walkerId);
            this.startSubjectSpecificAnimation(walkerId, subject);
        } else {
            // Just initialize the empty plot for when walking starts
            this.initializeRealTimeVariabilityPlot(walkerId);
        }
    }
    
    // Start subject-specific animation
    startSubjectSpecificAnimation(walkerId, subject) {
        // Generate subject-specific variability parameters
        const baseStdDev = this.calculateSubjectBaseStdDev(subject);
        const variabilityRange = this.calculateSubjectVariabilityRange(subject);
        
        let stepCount = this[`${walkerId}StrideCount`] || 0;
        
        const stepInterval = setInterval(() => {
            if (this.currentSection !== 2) {
                clearInterval(stepInterval);
                return;
            }
            
            stepCount++;
            this[`${walkerId}StrideCount`] = stepCount;
            
            // Generate subject-specific stride variability
            const currentStdDev = this.generateSubjectSpecificStdDev(subject, stepCount, baseStdDev, variabilityRange);
            
            // Add point to real-time plot
            this.addRealTimeVariabilityPoint(walkerId, currentStdDev);
            
            // Update stats
            this.updateStrideStats(walkerId, stepCount, currentStdDev);
            
        }, 1500);
        
        // Store interval for cleanup
        this.addSectionInterval('section2', stepInterval);
        this[`${walkerId}VariabilityInterval`] = stepInterval;
    }
    
    // Calculate subject-specific base standard deviation
    calculateSubjectBaseStdDev(subject) {
        // Base variability on age and speed characteristics
        const ageGroup = subject.group;
        const speed = subject.speed;
        const age = subject.age;
        
        // Younger subjects and slower speeds tend to have higher variability
        let baseStdDev;
        if (ageGroup === 'young') {
            baseStdDev = 70 - (speed * 10); // Slower young children more variable
        } else if (ageGroup === 'middle') {
            baseStdDev = 50 - (speed * 8);
        } else {
            baseStdDev = 35 - (speed * 5); // Older children more consistent
        }
        
        // Add age-specific adjustment
        baseStdDev += (60 - age) * 0.3; // Younger age = more variability
        
        return Math.max(15, Math.min(80, baseStdDev)); // Clamp between realistic bounds
    }
    
    // Calculate subject-specific variability range
    calculateSubjectVariabilityRange(subject) {
        const ageGroup = subject.group;
        const speed = subject.speed;
        
        // Range of variation around base
        let range;
        if (ageGroup === 'young') {
            range = 25 - (speed * 3); // Faster young children more consistent
        } else if (ageGroup === 'middle') {
            range = 20 - (speed * 2);
        } else {
            range = 15 - (speed * 1);
        }
        
        return Math.max(5, Math.min(30, range));
    }
    
    // Generate subject-specific stride variability at a given step
    generateSubjectSpecificStdDev(subject, stepCount, baseStdDev, variabilityRange) {
        // Create realistic patterns based on subject characteristics
        const progress = (stepCount % 12) / 12; // 12-step cycles for natural variation
        
        // Sinusoidal trend component (natural gait patterns)
        const trendComponent = baseStdDev + (variabilityRange * Math.sin(progress * Math.PI * 2));
        
        // Add fatigue effect (slight increase in variability over time)
        const fatigueEffect = stepCount * 0.2;
        
        // Random noise (more for younger, less for older)
        const noiseRange = subject.group === 'young' ? 15 : subject.group === 'middle' ? 10 : 5;
        const randomComponent = (Math.random() - 0.5) * noiseRange;
        
        const currentStdDev = trendComponent + fatigueEffect + randomComponent;
        
        return Math.max(10, Math.min(100, currentStdDev)); // Realistic bounds
    }
    
    // Update stride statistics display
    updateStrideStats(walkerId, stepCount, currentStdDev) {
        const stepCountEl = document.getElementById(`stepCount${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`);
        const currentIntervalEl = document.getElementById(`currentInterval${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`);
        const stdDevEl = document.getElementById(`stdDev${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`);
        
        if (stepCountEl) stepCountEl.textContent = stepCount;
        
        // Generate realistic current interval with some randomness
        const interval = 500 + Math.random() * 300;
        if (currentIntervalEl) {
            currentIntervalEl.textContent = `${interval.toFixed(0)}`;
        }
        
        if (stdDevEl) {
            stdDevEl.textContent = `${currentStdDev.toFixed(0)}`;
        }
    }
    
    // Generate mock stride variability data for a subject
    generateStrideVariabilityData(subject) {
        const numStrides = 20; // Number of stride intervals to show
        const baseInterval = 600 + (subject.speed * 100); // Base interval in ms
        const stdDevRange = subject.group === 'young' ? [40, 80] : [20, 50]; // Younger subjects more variable
        
        const data = [];
        for (let i = 0; i < numStrides; i++) {
            // Generate mock standard deviation that varies over time
            const progress = i / (numStrides - 1);
            const baseStdDev = stdDevRange[0] + (stdDevRange[1] - stdDevRange[0]) * 
                             (0.5 + 0.3 * Math.sin(progress * Math.PI * 2) + 0.2 * Math.random());
            
            data.push({
                stride: i + 1,
                stdDev: Math.max(10, baseStdDev) // Ensure minimum standard deviation
            });
        }
        
        return data;
    }
    
    // Create or update stride variability plot
    updateStrideVariabilityPlot(walkerId, subject) {
        const canvasId = `strideVariability${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`;
        const canvas = document.getElementById(canvasId);
        
        if (!canvas) {
            console.warn(`Canvas not found: ${canvasId}`);
            return;
        }
        
        // Destroy existing chart if it exists
        const chartKey = `${walkerId}VariabilityChart`;
        if (this[chartKey]) {
            this[chartKey].destroy();
        }
        
        // Generate mock data for this subject
        const data = this.generateStrideVariabilityData(subject);
        
        // Create color scheme based on walker type
        const colors = {
            younger: {
                line: '#4ecdc4',
                fill: 'rgba(76, 205, 196, 0.1)',
                grid: 'rgba(76, 205, 196, 0.2)'
            },
            older: {
                line: '#ff6b6b', 
                fill: 'rgba(255, 107, 107, 0.1)',
                grid: 'rgba(255, 107, 107, 0.2)'
            }
        };
        
        const colorScheme = colors[walkerId] || colors.younger;
        
        // Create new chart
        this[chartKey] = new Chart(canvas, {
            type: 'line',
            data: {
                labels: data.map(d => d.stride),
                datasets: [{
                    data: data.map(d => d.stdDev),
                    borderColor: colorScheme.line,
                    backgroundColor: colorScheme.fill,
                    borderWidth: 1.5,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 2,
                    pointBackgroundColor: colorScheme.line,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 0.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: colorScheme.line,
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                return `Stride ${context[0].label}`;
                            },
                            label: function(context) {
                                return `Std Dev: ${context.parsed.y.toFixed(1)} ms`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: false
                        },
                        grid: {
                            display: true,
                            color: colorScheme.grid,
                            lineWidth: 0.5
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            font: {
                                size: 9
                            },
                            maxTicksLimit: 6
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: false
                        },
                        grid: {
                            display: true,
                            color: colorScheme.grid,
                            lineWidth: 0.5
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            font: {
                                size: 9
                            },
                            maxTicksLimit: 4,
                            callback: function(value) {
                                return value.toFixed(0);
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        hoverRadius: 3
                    }
                }
            }
        });
        
        console.log(`📈 Updated ${walkerId} stride variability plot for subject ${subject.id}`);
    }
    
    // Initialize stride variability plots with default data
    initializeStrideVariabilityPlots() {
        // Create default plots for both walkers
        ['younger', 'older'].forEach(walkerId => {
            const defaultSubject = {
                id: walkerId === 'younger' ? 'default_young' : 'default_old',
                speed: walkerId === 'younger' ? 1.1 : 1.3,
                group: walkerId === 'younger' ? 'young' : 'old'
            };
            
            this.updateStrideVariabilityPlot(walkerId, defaultSubject);
        });
    }
    
    // Toggle stride walking animation
    toggleStrideWalking() {
        console.log('🔄 Toggle stride walking called');
        
        const startButton = document.getElementById('startButton');
        if (!startButton) {
            console.error('❌ Start button not found in toggle function');
            return;
        }
        
        const isWalking = startButton.textContent.includes('Pause');
        console.log('📊 Current walking state:', isWalking);
        
        if (isWalking) {
            startButton.textContent = 'START WALKING';
            this.stopStrideWalking();
        } else {
            startButton.textContent = 'PAUSE WALKING';
            this.startStrideWalking();
        }
    }
    
    // Reset stride walker animation
    resetStrideWalkerAnimation() {
        // Reset SVGs
        ['younger', 'older'].forEach(walkerId => {
            const svg = document.querySelector(`.kid-svg.${walkerId}`);
            if (svg) {
                svg.style.animation = '';
                svg.style.transform = 'scale(0.7)'; // Match CSS scale
                svg.innerHTML = ''; // Clear SVG content
            }
            
            // Clear current subject data
            this[`${walkerId}CurrentSubject`] = null;
            this[`${walkerId}StrideCount`] = 0;
            
            // Reset stats
            const currentIntervalEl = document.getElementById(`currentInterval${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`);
            const avgIntervalEl = document.getElementById(`avgInterval${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`);
            const stdDevEl = document.getElementById(`stdDev${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`);
            const stepCountEl = document.getElementById(`stepCount${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`);
            
            if (currentIntervalEl) currentIntervalEl.textContent = '-';
            if (avgIntervalEl) avgIntervalEl.textContent = '-';
            if (stdDevEl) stdDevEl.textContent = '-';
            if (stepCountEl) stepCountEl.textContent = '0';
            
            // Destroy variability charts
            const chartKey = `${walkerId}VariabilityChart`;
            if (this[chartKey]) {
                this[chartKey].destroy();
                this[chartKey] = null;
            }
        });
        
        // Reset dropdowns
        ['subjectSelectYounger', 'subjectSelectOlder'].forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Loading subjects...</option>';
            }
        });
        
        // Reset button
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.textContent = 'Start Walking';
        }
        
        console.log('🔄 Reset stride walker animation');
    }
    
    // Chapter 3: Comparison Race Animation
    startComparisonRaceAnimation() {
        console.log('🏁 Starting comparison race animation');
        
        // Initialize race SVGs
        ['young', 'middle', 'old'].forEach(ageGroup => {
            this.initRacerSVG(ageGroup);
        });
        
        // Set up race controls
        this.setupRaceControls();
        
        // Load race subject data
        this.loadRaceSubjectData();
        
        // Auto-populate race dropdowns
        setTimeout(() => {
            if (this.currentSection === 3) {
                this.populateRaceDropdowns();
                this.autoSelectDefaultRaceSubjects();
            }
        }, 500);
    }
    
    // Initialize racer SVG
    initRacerSVG(ageGroup) {
        const svg = document.querySelector(`.kid-svg.${ageGroup}`);
        if (!svg) return;
        
        const colors = {
            young: '#4ECDC4',
            middle: '#45B7D1', 
            old: '#FF6B6B'
        };
        
        // Set up racer SVG
        svg.innerHTML = `
            <rect x="35" y="20" width="30" height="30" fill="#FFD700"></rect>
            <rect x="40" y="50" width="20" height="30" fill="${colors[ageGroup]}"></rect>
            <rect x="35" y="80" width="10" height="20" fill="${colors[ageGroup]}"></rect>
            <rect x="55" y="80" width="10" height="20" fill="${colors[ageGroup]}"></rect>
        `;
        
        console.log(`🎬 Initialized ${ageGroup} racer SVG`);
    }
    
    // Set up race controls
    setupRaceControls() {
        const raceButton = document.getElementById('raceButton');
        if (raceButton) {
            raceButton.addEventListener('click', () => {
                this.startRace();
            });
        }
        
        // Set up subject selection dropdowns for race
        ['young', 'middle', 'old'].forEach(ageGroup => {
            const select = document.getElementById(`${ageGroup}Select`);
            if (select) {
                select.addEventListener('change', (e) => {
                    this.onRaceSubjectChange(ageGroup, parseInt(e.target.value));
                });
            }
        });
    }
    
    // Load race subject data
    loadRaceSubjectData() {
        this.raceSubjects = this.gaitData;
        console.log('📊 Loaded race subject data:', this.raceSubjects.length, 'subjects');
    }
    
    // Populate race dropdowns
    populateRaceDropdowns() {
        if (!this.raceSubjects) return;
        
        ['young', 'middle', 'old'].forEach(ageGroup => {
            const select = document.getElementById(`${ageGroup}Select`);
            if (select) {
                select.innerHTML = '<option value="">Choose subject...</option>';
                this.raceSubjects.filter(s => s.group === ageGroup).forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject.id;
                    option.textContent = `Subject ${subject.id} (${subject.speed.toFixed(2)} m/s)`;
                    select.appendChild(option);
                });
            }
        });
    }
    
    // Auto-select default race subjects
    autoSelectDefaultRaceSubjects() {
        ['young', 'middle', 'old'].forEach(ageGroup => {
            const select = document.getElementById(`${ageGroup}Select`);
            if (select && select.options.length > 1) {
                select.selectedIndex = 1;
                this.onRaceSubjectChange(ageGroup, parseInt(select.value));
            }
        });
    }
    
    // Handle race subject change
    onRaceSubjectChange(ageGroup, subjectId) {
        const subject = this.raceSubjects.find(s => s.id === subjectId);
        if (!subject) return;
        
        // Update info display
        const infoEl = document.getElementById(`${ageGroup}Info`);
        if (infoEl) {
            const spans = infoEl.getElementsByClassName('stat-value');
            if (spans.length >= 3) {
                spans[0].textContent = `${subject.age} mo`;
                spans[1].textContent = `${subject.speed.toFixed(2)} m/s`;
                spans[2].textContent = `${subject.height.toFixed(1)}"`;
            }
        }
        
        console.log(`📊 Selected ${ageGroup} racer:`, subject.id, subject.speed.toFixed(2), 'm/s');
    }
    
    // Start race
    startRace() {
        console.log('🏁 Starting race');
        
        const raceButton = document.getElementById('raceButton');
        if (raceButton) {
            raceButton.textContent = 'Racing...';
            raceButton.disabled = true;
        }
        
        // Get selected subjects and start race
        const subjects = {};
        ['young', 'middle', 'old'].forEach(ageGroup => {
            const select = document.getElementById(`${ageGroup}Select`);
            if (select && select.value) {
                subjects[ageGroup] = this.raceSubjects.find(s => s.id === parseInt(select.value));
            }
        });
        
        this.animateRace(subjects);
    }
    
    // Animate race
    animateRace(subjects) {
        const raceDuration = 4000;
        
        Object.entries(subjects).forEach(([ageGroup, subject]) => {
            if (!subject) return;
            
            const svg = document.querySelector(`.kid-svg.${ageGroup}`);
            if (svg) {
                const speed = subject.speed;
                const maxSpeed = Math.max(...Object.values(subjects).map(s => s ? s.speed : 0));
                const position = (speed / maxSpeed) * 70; // 70% max position
                
                svg.style.transition = `left ${raceDuration}ms ease-out`;
                svg.style.left = `${position}%`;
                svg.classList.add('racing');
            }
        });
        
        // Reset after race
        setTimeout(() => {
            if (this.currentSection === 3) {
                const raceButton = document.getElementById('raceButton');
                if (raceButton) {
                    raceButton.textContent = 'Start Race';
                    raceButton.disabled = false;
                }
                
                // Remove racing class
                ['young', 'middle', 'old'].forEach(ageGroup => {
                    const svg = document.querySelector(`.kid-svg.${ageGroup}`);
                    if (svg) {
                        svg.classList.remove('racing');
                    }
                });
            }
        }, raceDuration + 1000);
    }
    
    // Chapter 4: Individual Walker Animation
    startIndividualWalkerAnimation() {
        console.log('🚶 Starting individual walker animation');
        
        // Initialize individual walker SVG
        this.initIndividualWalkerSVG();
        
        // Set up individual walker controls
        this.setupIndividualWalkerControls();
        
        // Load individual walker data
        this.loadIndividualWalkerData();
        
        // Auto-populate filters and dropdown
        setTimeout(() => {
            if (this.currentSection === 4) {
                this.setupIndividualFilters();
                this.updateIndividualWalkerDropdown();
            }
        }, 500);
    }
    
    // Initialize individual walker SVG
    initIndividualWalkerSVG() {
        const svg = document.querySelector('.kid-svg.individual');
        if (!svg) return;
        
        svg.innerHTML = `
            <rect x="40" y="20" width="30" height="30" fill="#FFD700"></rect>
            <rect x="40" y="50" width="20" height="30" fill="#FF6B6B"></rect>
            <rect x="35" y="80" width="10" height="20" fill="#4ECDC4"></rect>
            <rect x="55" y="80" width="10" height="20" fill="#4ECDC4"></rect>
        `;
        
        console.log('🎬 Initialized individual walker SVG');
    }
    
    // Set up individual walker controls
    setupIndividualWalkerControls() {
        const ageGroupFilter = document.getElementById('ageGroupFilter');
        const genderFilter = document.getElementById('genderFilter');
        const individualSelect = document.getElementById('individualSelect');
        
        if (ageGroupFilter) {
            ageGroupFilter.addEventListener('change', () => {
                this.updateIndividualWalkerDropdown();
            });
        }
        
        if (genderFilter) {
            genderFilter.addEventListener('change', () => {
                this.updateIndividualWalkerDropdown();
            });
        }
        
        if (individualSelect) {
            individualSelect.addEventListener('change', (e) => {
                this.onIndividualWalkerChange(parseInt(e.target.value));
            });
        }
    }
    
    // Load individual walker data
    loadIndividualWalkerData() {
        this.individualWalkers = this.gaitData;
        console.log('📊 Loaded individual walker data:', this.individualWalkers.length, 'walkers');
    }
    
    // Set up individual filters
    setupIndividualFilters() {
        const ageGroupFilter = document.getElementById('ageGroupFilter');
        const genderFilter = document.getElementById('genderFilter');
        
        if (ageGroupFilter) {
            ageGroupFilter.innerHTML = `
                <option value="">All Ages</option>
                <option value="young">Young (20-40 months)</option>
                <option value="middle">Middle (40-60 months)</option>
                <option value="old">Older (60+ months)</option>
            `;
        }
        
        if (genderFilter) {
            genderFilter.innerHTML = `
                <option value="">All Genders</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
            `;
        }
    }
    
    // Update individual walker dropdown
    updateIndividualWalkerDropdown() {
        const ageGroupFilter = document.getElementById('ageGroupFilter');
        const genderFilter = document.getElementById('genderFilter');
        const individualSelect = document.getElementById('individualSelect');
        
        if (!individualSelect || !this.individualWalkers) return;
        
        let filteredWalkers = this.individualWalkers;
        
        // Apply age group filter
        if (ageGroupFilter && ageGroupFilter.value) {
            filteredWalkers = filteredWalkers.filter(w => w.group === ageGroupFilter.value);
        }
        
        // Apply gender filter
        if (genderFilter && genderFilter.value) {
            filteredWalkers = filteredWalkers.filter(w => w.gender === genderFilter.value);
        }
        
        // Populate dropdown
        individualSelect.innerHTML = '<option value="">Choose a walker...</option>';
        filteredWalkers.forEach(walker => {
            const option = document.createElement('option');
            option.value = walker.id;
            option.textContent = `Walker ${walker.id} (${walker.age} mo, ${walker.gender}, ${walker.speed.toFixed(2)} m/s)`;
            individualSelect.appendChild(option);
        });
    }
    
    // Handle individual walker change
    onIndividualWalkerChange(walkerId) {
        const walker = this.individualWalkers.find(w => w.id === walkerId);
        if (!walker) return;
        
        // Update walker display
        this.displayIndividualWalker(walker);
        
        console.log('📊 Selected individual walker:', walker.id, walker.speed.toFixed(2), 'm/s');
    }
    
    // Display individual walker
    displayIndividualWalker(walker) {
        const svg = document.querySelector('.kid-svg.individual');
        if (!svg) return;
        
        // Start walking animation
        svg.style.animation = `individualWalk ${(3 / walker.speed).toFixed(1)}s ease-in-out infinite`;
        
        // Update walker info (if elements exist)
        const ageDisplay = document.getElementById('individualAge');
        const speedDisplay = document.getElementById('individualSpeed');
        const heightDisplay = document.getElementById('individualHeight');
        
        if (ageDisplay) ageDisplay.textContent = `${walker.age} months`;
        if (speedDisplay) speedDisplay.textContent = `${walker.speed.toFixed(2)} m/s`;
        if (heightDisplay) heightDisplay.textContent = `${walker.height.toFixed(1)} inches`;
    }
    
    // Reset individual walker
    resetIndividualWalker() {
        const svg = document.querySelector('.kid-svg.individual');
        if (svg) {
            svg.style.animation = '';
        }
        
        // Reset displays
        const ageDisplay = document.getElementById('individualAge');
        const speedDisplay = document.getElementById('individualSpeed');
        const heightDisplay = document.getElementById('individualHeight');
        
        if (ageDisplay) ageDisplay.textContent = '-';
        if (speedDisplay) speedDisplay.textContent = '-';
        if (heightDisplay) heightDisplay.textContent = '-';
    }

    // Reset comparison race animation
    resetComparisonRaceAnimation() {
        // Reset race SVGs
        ['young', 'middle', 'old'].forEach(ageGroup => {
            const svg = document.querySelector(`.kid-svg.${ageGroup}`);
            if (svg) {
                svg.style.animation = '';
                svg.style.left = '0%';
                svg.style.transition = '';
                svg.classList.remove('racing');
                svg.innerHTML = ''; // Clear SVG content
            }
            
            // Reset info displays
            const infoEl = document.getElementById(`${ageGroup}Info`);
            if (infoEl) {
                const spans = infoEl.getElementsByClassName('stat-value');
                Array.from(spans).forEach(span => span.textContent = '-');
            }
            
            // Reset dropdowns
            const select = document.getElementById(`${ageGroup}Select`);
            if (select) {
                select.innerHTML = '<option value="">Choose subject...</option>';
            }
        });
        
        // Reset race button
        const raceButton = document.getElementById('raceButton');
        if (raceButton) {
            raceButton.textContent = 'Start Race';
            raceButton.disabled = false;
        }
        
        console.log('🔄 Reset comparison race animation');
    }

    // Reset individual walker animation
    resetIndividualWalkerAnimation() {
        // Reset individual walker
        this.resetIndividualWalker();
        
        // Reset filters
        const ageGroupFilter = document.getElementById('ageGroupFilter');
        const genderFilter = document.getElementById('genderFilter');
        const individualSelect = document.getElementById('individualSelect');
        
        if (ageGroupFilter) ageGroupFilter.selectedIndex = 0;
        if (genderFilter) genderFilter.selectedIndex = 0;
        if (individualSelect) individualSelect.innerHTML = '<option value="">Choose a walker...</option>';
        
        // Clear SVG
        const svg = document.querySelector('.kid-svg.individual');
        if (svg) {
            svg.style.animation = '';
            svg.style.transform = 'scale(0.7)'; // Match CSS scale
            svg.innerHTML = ''; // Clear SVG content
        }
        
        console.log('🔄 Reset individual walker animation');
    }

    // Start stride walking
    startStrideWalking() {
        console.log('🏃 Starting stride walking animations');
        
        ['younger', 'older'].forEach(walkerId => {
            // Initialize current subjects from dropdowns if not already set
            if (!this[`${walkerId}CurrentSubject`]) {
                const selectId = `subjectSelect${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`;
                const select = document.getElementById(selectId);
                if (select && select.value) {
                    const subjectId = parseInt(select.value);
                    const subject = this.strideSubjects?.find(s => s.id === subjectId);
                    if (subject) {
                        this[`${walkerId}CurrentSubject`] = subject;
                    }
                }
            }
            
            this.animateStrideWalker(walkerId);
            // Initialize real-time variability plot
            this.initializeRealTimeVariabilityPlot(walkerId);
        });
    }

    // Stop stride walking
    stopStrideWalking() {
        console.log('⏸️ Stopping stride walking animations');
        
        // Reset walker positions and stop animations
        ['younger', 'older'].forEach(walkerId => {
            const svg = document.querySelector(`.kid-svg.${walkerId}`);
            if (svg) {
                svg.style.animation = '';
                svg.style.transform = 'scale(0.7)'; // Match CSS scale
            }
            
            // Stop real-time plot updates
            this.stopRealTimeVariabilityPlot(walkerId);
        });
    }
    
    // Initialize real-time variability plot
    initializeRealTimeVariabilityPlot(walkerId) {
        const canvasId = `strideVariability${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`;
        const canvas = document.getElementById(canvasId);
        
        if (!canvas) {
            console.warn(`Canvas not found: ${canvasId}`);
            return;
        }
        
        // Destroy existing chart if it exists
        const chartKey = `${walkerId}VariabilityChart`;
        if (this[chartKey]) {
            this[chartKey].destroy();
        }
        
        // Color scheme based on walker type
        const colors = {
            younger: {
                line: '#4ecdc4',
                fill: 'rgba(76, 205, 196, 0.1)',
                grid: 'rgba(76, 205, 196, 0.2)',
                tracker: '#ffffff'
            },
            older: {
                line: '#ff6b6b', 
                fill: 'rgba(255, 107, 107, 0.1)',
                grid: 'rgba(255, 107, 107, 0.2)',
                tracker: '#ffffff'
            }
        };
        
        const colorScheme = colors[walkerId] || colors.younger;
        
        // Initialize empty chart for real-time updates
        this[chartKey] = new Chart(canvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Stride Variability',
                    data: [],
                    borderColor: colorScheme.line,
                    backgroundColor: colorScheme.fill,
                    borderWidth: 1.5,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 2,
                    pointBackgroundColor: colorScheme.line,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 0.5
                }, {
                    label: 'Current Position',
                    data: [],
                    borderColor: colorScheme.tracker,
                    backgroundColor: colorScheme.tracker,
                    borderWidth: 0,
                    fill: false,
                    tension: 0,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: colorScheme.tracker,
                    pointBorderColor: colorScheme.line,
                    pointBorderWidth: 2,
                    showLine: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false, // Disable animations for real-time updates
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: colorScheme.line,
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                return `Stride ${context[0].label}`;
                            },
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return `Std Dev: ${context.parsed.y.toFixed(1)} ms`;
                                } else {
                                    return `Current: ${context.parsed.y.toFixed(1)} ms`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: false
                        },
                        grid: {
                            display: true,
                            color: colorScheme.grid,
                            lineWidth: 0.5
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            font: {
                                size: 9
                            },
                            maxTicksLimit: 6
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: false
                        },
                        grid: {
                            display: true,
                            color: colorScheme.grid,
                            lineWidth: 0.5
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            font: {
                                size: 9
                            },
                            maxTicksLimit: 4,
                            callback: function(value) {
                                return value.toFixed(0);
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        hoverRadius: 3
                    }
                }
            }
        });
        
        // Initialize real-time data storage
        this[`${walkerId}VariabilityData`] = [];
        this[`${walkerId}StrideCount`] = 0;
        
        console.log(`📈 Initialized real-time ${walkerId} variability plot`);
    }
    
    // Stop real-time variability plot
    stopRealTimeVariabilityPlot(walkerId) {
        // Clear any running update intervals
        const intervalKey = `${walkerId}VariabilityInterval`;
        if (this[intervalKey]) {
            clearInterval(this[intervalKey]);
            this[intervalKey] = null;
        }
    }
    
    // Add real-time data point to variability plot
    addRealTimeVariabilityPoint(walkerId, stdDev) {
        const chartKey = `${walkerId}VariabilityChart`;
        const chart = this[chartKey];
        
        if (!chart) return;
        
        const dataKey = `${walkerId}VariabilityData`;
        const countKey = `${walkerId}StrideCount`;
        
        // Get current stride count
        const strideIndex = this[countKey] || 1;
        
        // Add new data point to the line
        chart.data.labels.push(strideIndex);
        chart.data.datasets[0].data.push(stdDev);
        
        // Update tracker dots to show progression along the line
        // Create an array that traces the line with dots, with the newest being most prominent
        const lineData = chart.data.datasets[0].data;
        const trackerData = [];
        
        for (let i = 0; i < lineData.length; i++) {
            if (i === lineData.length - 1) {
                // Current position - bright white dot
                trackerData.push(lineData[i]);
            } else if (i >= lineData.length - 3) {
                // Recent positions - fading white dots
                trackerData.push(lineData[i]);
            } else {
                // Older positions - no dots
                trackerData.push(null);
            }
        }
        
        chart.data.datasets[1].data = trackerData;
        
        // Update point styles for the tracker dataset to show fading effect
        const pointRadius = [];
        const pointBackgroundColor = [];
        const pointBorderColor = [];
        
        for (let i = 0; i < trackerData.length; i++) {
            if (trackerData[i] !== null) {
                if (i === trackerData.length - 1) {
                    // Current position - large bright white dot
                    pointRadius.push(5);
                    pointBackgroundColor.push('#ffffff');
                    pointBorderColor.push(walkerId === 'younger' ? '#4ecdc4' : '#ff6b6b');
                } else if (i >= trackerData.length - 3) {
                    // Recent positions - smaller, semi-transparent dots
                    const age = trackerData.length - 1 - i;
                    const opacity = 1 - (age * 0.3); // Fade out
                    const size = 4 - age; // Get smaller
                    pointRadius.push(Math.max(2, size));
                    pointBackgroundColor.push(`rgba(255, 255, 255, ${opacity})`);
                    pointBorderColor.push(walkerId === 'younger' ? `rgba(76, 205, 196, ${opacity})` : `rgba(255, 107, 107, ${opacity})`);
                }
            } else {
                pointRadius.push(0);
                pointBackgroundColor.push('transparent');
                pointBorderColor.push('transparent');
            }
        }
        
        // Apply the dynamic styling
        chart.data.datasets[1].pointRadius = pointRadius;
        chart.data.datasets[1].pointBackgroundColor = pointBackgroundColor;
        chart.data.datasets[1].pointBorderColor = pointBorderColor;
        
        // Keep only last 20 points for performance
        const maxPoints = 20;
        if (chart.data.labels.length > maxPoints) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
            chart.data.datasets[1].data.shift();
            
            // Also shift the styling arrays
            chart.data.datasets[1].pointRadius.shift();
            chart.data.datasets[1].pointBackgroundColor.shift();
            chart.data.datasets[1].pointBorderColor.shift();
        }
        
        // Update chart
        chart.update('none'); // Use 'none' mode for immediate update without animation
    }
    
    // Animate individual stride walker
    animateStrideWalker(walkerId) {
        const svg = document.querySelector(`.kid-svg.${walkerId}`);
        if (!svg) {
            console.error(`❌ Could not find SVG for walker: ${walkerId}`);
            return;
        }
        
        console.log(`🏃 Starting animation for ${walkerId} walker`);
        
        // Start walking animation with leg movement
        svg.style.animation = 'strideWalk 2s ease-in-out infinite';
        svg.style.transform = 'scale(0.7)'; // Match CSS scale
        
        // Get the current subject for this walker (if selected)
        const subject = this[`${walkerId}CurrentSubject`];
        
        if (subject) {
            // Use subject-specific animation
            this.startSubjectSpecificAnimation(walkerId, subject);
        } else {
            // Use default animation if no subject selected
            this.startDefaultAnimation(walkerId);
        }
        
        console.log(`✅ Animation started for ${walkerId}`);
    }
    
    // Start default animation (when no subject is selected)
    startDefaultAnimation(walkerId) {
        // Generate baseline variability parameters for this walker type
        const baseStdDev = walkerId === 'younger' ? 60 : 35;
        const variabilityRange = walkerId === 'younger' ? 30 : 15;
        
        let stepCount = 0;
        
        const stepInterval = setInterval(() => {
            if (this.currentSection !== 2) {
                clearInterval(stepInterval);
                return;
            }
            
            stepCount++;
            this[`${walkerId}StrideCount`] = stepCount;
            
            // Generate default stride variability data
            const progress = (stepCount % 10) / 10;
            const trendComponent = baseStdDev + (variabilityRange * Math.sin(progress * Math.PI * 2));
            const randomComponent = (Math.random() - 0.5) * 20;
            const currentStdDev = Math.max(10, trendComponent + randomComponent);
            
            // Add point to real-time plot
            this.addRealTimeVariabilityPoint(walkerId, currentStdDev);
            
            // Update stats
            this.updateStrideStats(walkerId, stepCount, currentStdDev);
            
        }, 1500);
        
        // Store interval for cleanup
        this.addSectionInterval('section2', stepInterval);
        this[`${walkerId}VariabilityInterval`] = stepInterval;
    }
    
    // Bind keyboard and other events
    bindEvents() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.isSnapping) return; // Don't allow keyboard nav while snapping
            
            switch(e.key) {
                case 'ArrowUp':
                case 'PageUp':
                    e.preventDefault();
                    this.navigateToPrevSection();
                    break;
                case 'ArrowDown':
                case 'PageDown':
                case ' ': // Space bar
                    e.preventDefault();
                    this.navigateToNextSection();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.navigateToSection(0);
                    break;
                case 'End':
                    e.preventDefault();
                    this.navigateToSection(this.sections.length - 1);
                    break;
                case 'Escape':
                    // Reset to beginning
                    e.preventDefault();
                    this.navigateToSection(0);
                    break;
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            // Debounced resize handler
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.setupSections(); // Recalculate section positions
                this.updateProgressIndicator();
                console.log('📐 Sections recalculated after resize');
            }, 250);
        });
        
        // Handle visibility change (when user switches tabs)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Pause any running animations when tab becomes hidden
                this.pauseAllAnimations();
            } else {
                // Resume animations when tab becomes visible
                this.resumeAllAnimations();
            }
        });
        
        console.log('🎮 Event bindings initialized');
    }
    
    // Pause all running animations
    pauseAllAnimations() {
        // This method can be expanded to pause specific animations
        // For now, it serves as a placeholder for future enhancements
        console.log('⏸️ Pausing animations (tab hidden)');
    }
    
    // Resume all animations
    resumeAllAnimations() {
        // This method can be expanded to resume specific animations
        // For now, it serves as a placeholder for future enhancements
        console.log('▶️ Resuming animations (tab visible)');
    }
}

// Gait Visualization Class
class GaitVisualization {
    constructor() {
        this.chart = null;
        this.data = null;
        this.selectedAge = null;
        this.init();
    }

    async init() {
        await this.loadData();
        this.bindEvents();
        this.selectedAge = parseInt(document.getElementById("gaitAgeSlider").value);
        this.updateChart();
        this.updateStatsFromAge(this.selectedAge);
    }

    async loadData() {
        try {
            const response = await fetch("table.csv");
            const text = await response.text();
            const rows = text.trim().split("\n").slice(1);

            this.data = rows.map(row => {
                const [id, age, gender, height, weight, legLength, speed, group] = row.split(",");
                return {
                    id: +id,
                    age: +age,
                    gender,
                    height: +height,
                    weight: +weight,
                    legLength: +legLength,
                    speed: +speed,
                    group
                };
            });
        } catch (error) {
            console.error("Error loading gait data:", error);
            this.data = [];
        }
    }

    getFilteredData() {
        if (!this.data) return [];
        
        const genderFilter = document.getElementById("gaitGender").value;
        const groupFilter = document.getElementById("gaitGroup").value;
        const minSpeed = parseFloat(document.getElementById("gaitSpeedSlider").value);
        const minLeg = parseFloat(document.getElementById("gaitLegSlider").value);

        return this.data.filter(d =>
            (genderFilter === "All" || d.gender === genderFilter) &&
            (groupFilter === "All" || d.group === groupFilter) &&
            d.speed >= minSpeed &&
            d.legLength >= minLeg
        );
    }

    updateChart() {
        const filtered = this.getFilteredData();

        const ageMap = {};
        filtered.forEach(d => {
            if (!ageMap[d.age]) ageMap[d.age] = [];
            ageMap[d.age].push(d);
        });

        const labels = Object.keys(ageMap).map(a => +a).sort((a, b) => a - b);
        const speeds = labels.map(a => {
            const entries = ageMap[a];
            return entries.reduce((sum, e) => sum + e.speed, 0) / entries.length;
        });

        if (this.chart) this.chart.destroy();

        const chartCanvas = document.getElementById("gaitSpeedChart");
        if (!chartCanvas) return;

        this.chart = new Chart(chartCanvas, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "Avg Speed (m/s)",
                    data: speeds,
                    borderColor: "#FF6B6B",
                    backgroundColor: "rgba(255, 107, 107, 0.1)",
                    fill: false,
                    tension: 0.2,
                    pointBackgroundColor: labels.map(age => age === this.selectedAge ? "#4ECDC4" : "#FF6B6B"),
                    pointRadius: labels.map(age => age === this.selectedAge ? 6 : 3),
                    pointHoverRadius: labels.map(age => age === this.selectedAge ? 7 : 4)
                }]
            },
            options: {
                onClick: (e, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        this.selectedAge = labels[index];
                        document.getElementById("gaitAgeSlider").value = this.selectedAge;
                        this.updateStatsFromAge(this.selectedAge);
                        this.updateChart(); // refresh to highlight selected dot
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: "Age (months)",
                            color: "#333",
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: "rgba(0,0,0,0.1)"
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: "Speed (m/s)",
                            color: "#333",
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: "rgba(0,0,0,0.1)"
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: "#333",
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    updateStatsFromAge(ageValue) {
        const filtered = this.getFilteredData();
        let stats = filtered.filter(d => d.age === ageValue);

        const ageStat = document.getElementById("gaitAgeStat");
        const speedStat = document.getElementById("gaitSpeedStat");
        const legStat = document.getElementById("gaitLegLengthStat");

        if (!ageStat || !speedStat || !legStat) return;

        // If no data at this age, try closest
        if (stats.length === 0) {
            const availableAges = [...new Set(filtered.map(d => d.age))].sort((a, b) => Math.abs(a - ageValue) - Math.abs(b - ageValue));
            if (availableAges.length === 0) {
                ageStat.textContent = `${ageValue} months`;
                speedStat.textContent = "—";
                legStat.textContent = "—";
                return;
            }
            const closestAge = availableAges[0];
            document.getElementById("gaitAgeSlider").value = closestAge;
            stats = filtered.filter(d => d.age === closestAge);
            ageValue = closestAge;
        }

        this.selectedAge = ageValue;

        const avgSpeed = stats.reduce((sum, d) => sum + d.speed, 0) / stats.length;
        const avgLeg = stats.reduce((sum, d) => sum + d.legLength, 0) / stats.length;

        ageStat.textContent = ageValue + " months";
        speedStat.textContent = avgSpeed.toFixed(2) + " m/s";
        legStat.textContent = avgLeg.toFixed(1) + " in";

        const walker = document.getElementById("gaitWalker");
        if (walker) {
            walker.style.animationDuration = (10 / (avgSpeed * 10)).toFixed(2) + "s";
        }
    }

    bindEvents() {
        // Gender filter
        const genderSelect = document.getElementById("gaitGender");
        if (genderSelect) {
            genderSelect.addEventListener("change", () => {
                this.updateChart();
                this.updateStatsFromAge(this.selectedAge);
            });
        }

        // Group filter
        const groupSelect = document.getElementById("gaitGroup");
        if (groupSelect) {
            groupSelect.addEventListener("change", () => {
                this.updateChart();
                this.updateStatsFromAge(this.selectedAge);
            });
        }

        // Speed slider
        const speedSlider = document.getElementById("gaitSpeedSlider");
        if (speedSlider) {
            speedSlider.addEventListener("input", () => {
                this.updateChart();
                this.updateStatsFromAge(this.selectedAge);
            });
        }

        // Leg length slider
        const legSlider = document.getElementById("gaitLegSlider");
        if (legSlider) {
            legSlider.addEventListener("input", () => {
                this.updateChart();
                this.updateStatsFromAge(this.selectedAge);
            });
        }

        // Age slider
        const ageSlider = document.getElementById("gaitAgeSlider");
        if (ageSlider) {
            ageSlider.addEventListener("input", function () {
                this.selectedAge = parseInt(this.value);
                this.updateStatsFromAge(this.selectedAge);
                this.updateChart();
            }.bind(this));
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the scrollytelling engine
    new ScrollytellingEngine();
    
    // Initialize gait visualization when section 6 elements are available
    setTimeout(() => {
        if (document.getElementById('gaitSpeedChart')) {
            window.gaitViz = new GaitVisualization();
        }
    }, 100);
}); 