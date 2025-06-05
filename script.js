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
        
        // Remove automatic variability chart initialization - charts will be created when section 2 is visited
        // This prevents chart canvas errors when the elements don't exist yet
        
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
                    id: parseInt(record['subject-id(1-50)']), // Convert to number to match dropdown values
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
        
        console.log('📊 Total subjects loaded from CSV:', this.gaitData.length);
        console.log('🔍 Subject IDs loaded:', this.gaitData.map(s => s.id).sort((a, b) => a - b));
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
    
    // ========================================================================================
    // CHAPTER 2: STRIDE WALKER ANIMATION - COMPLETE INTEGRATION FROM STANDALONE VERSION
    // ========================================================================================
    
    // Stride Walker State Management (Ported from stride-walker.js)
    walkerStates = {
        younger: {
            strideData: [],
            isWalking: false,
            currentStepIndex: 0,
            lastStepTime: 0,
            animationFrameId: null,
            stepCount: 0,
            elements: null,
            subject: null,
            chart: null,
            stdDev: 0,
            avgInterval: 0
        },
        older: {
            strideData: [],
            isWalking: false,
            currentStepIndex: 0,
            lastStepTime: 0,
            animationFrameId: null,
            stepCount: 0,
            elements: null,
            subject: null,
            chart: null,
            stdDev: 0,
            avgInterval: 0
        }
    };
    
    // Stride Walker Constants
    strideAgeThreshold = 100; // Threshold in months for older/younger grouping
    strideSpeedMultiplier = 0.5; // Animation speed multiplier
    
    // Chapter 2: Stride Walker Animation
    startStrideWalkerAnimation() {
        console.log('🚶 Starting stride walker animation - Full Integration');
        
        // Wait for gait data to be loaded before proceeding
        const waitForStrideData = () => {
            if (!this.gaitData || this.gaitData.length === 0) {
                console.log('⏳ Waiting for gait data to load for stride walker...');
                setTimeout(waitForStrideData, 100);
                return;
            }
            
            console.log('✅ Gait data available, proceeding with stride setup');
            
            // Process gait data for stride analysis
            this.processGaitDataForStride();
            
            // Initialize walker SVGs
            this.initStrideWalkerSVG('younger');
            this.initStrideWalkerSVG('older');
            
            // Set up stride walker controls
            this.setupStrideWalkerControls();
            
            // Initialize variability charts for this section
            this.initializeVariabilityCharts();
            
            // Auto-populate stride dropdowns after a short delay
        setTimeout(() => {
            if (this.currentSection === 2) {
                    this.setupStrideSubjectDropdowns();
                    console.log('🎯 Stride walker setup completed');
            }
        }, 200);
        };
        
        waitForStrideData();
    }
    
    // Process gait data for stride analysis
    processGaitDataForStride() {
        // Convert gait data to format expected by stride walker
        this.strideSubjectData = this.gaitData.map(subject => ({
            id: subject.id,
            age: subject.age,
            gender: subject.gender,
            height: subject.height,
            weight: subject.weight,
            legLength: subject.legLength,
            speed: subject.speed,
            group: subject.age >= this.strideAgeThreshold ? 'Older' : 'Younger'
        }));
        
        console.log('📊 Processed stride subject data:', this.strideSubjectData.length, 'subjects');
    }
    
    // Helper to get stride walker elements (from stride-walker.js)
    getStrideWalkerElements(walkerId) {
        const state = this.walkerStates[walkerId];
        if (!state) {
            console.error(`Invalid walkerId: ${walkerId}`);
            return {};
        }
        
        // Return cached elements if available
        if (state.elements) {
            return state.elements;
        } else {
            // Query and cache elements
        const svg = document.querySelector(`.kid-svg.${walkerId}`);
            const chartCanvas = document.getElementById(`strideVariability${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`);
            
            const elements = {
                svg: svg,
                currentIntervalEl: document.getElementById(`currentInterval${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`),
                avgIntervalEl: document.getElementById(`avgInterval${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`),
                stdDevEl: document.getElementById(`stdDev${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`),
                stepCountEl: document.getElementById(`stepCount${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`),
                leftLegGroup: svg ? svg.querySelector('.left-leg') : null,
                rightLegGroup: svg ? svg.querySelector('.right-leg') : null,
                leftCalf: svg ? svg.querySelector('.left-leg .calf') : null,
                rightCalf: svg ? svg.querySelector('.right-leg .calf') : null,
                chartCanvas: chartCanvas
            };
            
            // Cache the elements
            state.elements = elements;
            return elements;
        }
    }
    
    // Initialize stride walker SVG (from stride-walker.js)
    initStrideWalkerSVG(walkerId) {
        console.log(`🎬 Initializing stride walker SVG for ${walkerId}`);
        const svg = document.querySelector(`.kid-svg.${walkerId}`);
        const state = this.walkerStates[walkerId];

        if (!svg || !state) {
            console.error(`Stride walker SVG element or state not found for ${walkerId}!`);
            return;
        }

        // Create articulated side-profile walker SVG
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
        
        // Cache the DOM elements for this walker
        this.getStrideWalkerElements(walkerId); // This will cache the elements
        
        console.log(`✅ Stride walker SVG initialized for ${walkerId}`);
    }
    
    // Load stride data for specific walker and subject (from stride-walker.js)
    async loadStrideData(walkerId, subjectId) {
        console.log(`📊 Loading stride data for ${walkerId} walker (subject ${subjectId})`);
        const walker = this.walkerStates[walkerId];
        const { avgIntervalEl, stdDevEl } = this.getStrideWalkerElements(walkerId);

        if (!walker || !this.strideSubjectData) {
            console.error(`Invalid walkerId or subject data not loaded: ${walkerId}`);
            if (avgIntervalEl) avgIntervalEl.textContent = '-';
            if (stdDevEl) stdDevEl.textContent = '-';
            return false;
        }

        const subject = this.strideSubjectData.find(s => s.id === subjectId);
        if (!subject) {
            console.error(`Subject data not found for ID: ${subjectId}`);
            if (avgIntervalEl) avgIntervalEl.textContent = '-';
            if (stdDevEl) stdDevEl.textContent = '-';
            return false;
        }

        // Store the current subject data in the walker's state
        walker.subject = subject;

        // Reset data before loading new
        walker.strideData = [];

        try {
            // Try to load actual data file: gait-maturation-database-1.0.0/data/{id}-{age}.txt (corrected format)
            const filename = `${subject.id}-${subject.age}.txt`;
            const response = await fetch(`gait-maturation-database-1.0.0/data/${filename}`);
            
            if (response.ok) {
                const dataText = await response.text();
                console.log(`📁 Successfully loaded actual stride data file: ${filename}`);
                
                // Parse the actual stride data (time, stride_interval format)
                const lines = dataText.trim().split('\n');
                const actualStrideData = [];
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line && !line.startsWith('#')) { // Skip comments and empty lines
                        const [timeStr, strideIntervalStr] = line.split(/\s+/);
                        const time = parseFloat(timeStr);
                        const strideInterval = parseFloat(strideIntervalStr);
                        
                        if (!isNaN(time) && !isNaN(strideInterval)) {
                            actualStrideData.push({
                                time: time,
                                interval: strideInterval * 1000 // Convert from seconds to milliseconds
                            });
                        }
                    }
                }
                
                if (actualStrideData.length > 0) {
                    walker.strideData = actualStrideData;
                    console.log(`✅ Using ${actualStrideData.length} actual stride intervals from ${filename}`);
                } else {
                    console.error(`❌ No valid data found in ${filename}`);
                    return false;
                }
            } else {
                console.error(`❌ File ${filename} not found (${response.status}). Cannot proceed without real participant data.`);
                return false;
            }
        } catch (fetchError) {
            console.error(`❌ Error loading ${subject.id}-${subject.age}.txt: ${fetchError.message}. Cannot proceed without real participant data.`);
            return false;
        }

        if (walker.strideData.length === 0) {
            console.error(`No valid stride data found for ${walkerId} walker (subject ${subject.id})`);
            if (avgIntervalEl) avgIntervalEl.textContent = '-';
            if (stdDevEl) stdDevEl.textContent = '-';
            if (walker.chart) {
                walker.chart.destroy();
                walker.chart = null;
            }
            return false;
        }

        // Calculate and display average interval and standard deviation
        const intervals = walker.strideData.map(d => d.interval);
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        
        // Calculate standard deviation
        const stdDev = Math.sqrt(
            intervals.reduce((sq, n) => sq + Math.pow(n - avgInterval, 2), 0) / intervals.length
        );

        // Store in walker state for chart use
        walker.stdDev = stdDev;
        walker.avgInterval = avgInterval;

        // Update displays
        if (avgIntervalEl) avgIntervalEl.textContent = avgInterval.toFixed(2) + ' ms';
        if (stdDevEl) stdDevEl.textContent = stdDev.toFixed(2) + ' ms';

        console.log(`✅ Loaded ${walker.strideData.length} stride intervals for ${walkerId} walker (subject ${subject.id}), avg: ${avgInterval.toFixed(2)}ms, std dev: ${stdDev.toFixed(2)}ms`);

        // Initialize or update chart after data load
        await this.initializeStrideChart(walkerId);

        return true;
    }
    
    // Initialize Chart.js plot for stride analysis (from stride-walker.js)
    async initializeStrideChart(walkerId) {
        console.log(`📈 Initializing stride chart for ${walkerId}`);
        const walker = this.walkerStates[walkerId];
        const { chartCanvas } = this.getStrideWalkerElements(walkerId);

        if (!walker || !chartCanvas || !walker.strideData || walker.strideData.length === 0) {
            console.warn(`Cannot initialize chart for ${walkerId}: missing elements or data.`);
            if (walker && walker.chart) {
                walker.chart.destroy();
                walker.chart = null;
            }
            return;
        }

        // IMPROVED CHART CLEANUP - Fix canvas reuse error
        // First, destroy the chart stored in walker state
        if (walker.chart) {
            walker.chart.destroy();
            walker.chart = null;
        }
        
        // Then, check for any Chart.js instance attached to this canvas and destroy it
        const existingChart = Chart.getChart(chartCanvas);
        if (existingChart) {
            existingChart.destroy();
        }

        const ctx = chartCanvas.getContext('2d');

        // Prepare data for Chart.js
        const chartData = walker.strideData.map((d, index) => ({ x: index + 1, y: d.interval }));
        const intervals = walker.strideData.map(d => d.interval);
        const yMin = Math.min(...intervals);
        const yMax = Math.max(...intervals);

        // Create mean ± std dev band data
        const mean = walker.avgInterval;
        const stdDev = walker.stdDev;
        
        // Create upper and lower band lines
        const upperBandData = chartData.map(point => ({ x: point.x, y: mean + stdDev }));
        const lowerBandData = chartData.map(point => ({ x: point.x, y: mean - stdDev }));
        const meanLineData = chartData.map(point => ({ x: point.x, y: mean }));

        // Color scheme based on walker type (adapted for main website)
        const colors = {
            younger: {
                line: '#4ecdc4',
                fill: 'rgba(76, 205, 196, 0.2)',
                mean: 'rgba(76, 205, 196, 0.6)',
                band: 'rgba(76, 205, 196, 0.1)',
                averageLine: '#FF0000' // Bright red for maximum visibility
            },
            older: {
                line: '#ff6b6b', 
                fill: 'rgba(255, 107, 107, 0.2)',
                mean: 'rgba(255, 107, 107, 0.6)',
                band: 'rgba(255, 107, 107, 0.1)',
                averageLine: '#FF0000' // Bright red for maximum visibility
            }
        };
        
        const colorScheme = colors[walkerId] || colors.younger;
        
        // Create new chart instance
        walker.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    // Upper band line
                    label: 'Upper Band',
                    data: upperBandData,
                    borderColor: colorScheme.mean,
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    tension: 0
                }, {
                    // Lower band line  
                    label: 'Lower Band',
                    data: lowerBandData,
                    borderColor: colorScheme.mean,
                    backgroundColor: colorScheme.band,
                    borderWidth: 1,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: '-1', // Fill to previous dataset (upper band)
                    tension: 0
                }, {
                    // Mean line
                    label: 'Average Interval',
                    data: meanLineData,
                    borderColor: colorScheme.averageLine,
                    backgroundColor: 'transparent',
                    borderWidth: 5,  // Increased thickness from 3 to 5
                    pointRadius: 0,
                    fill: false,
                    tension: 0,
                    order: 1  // Ensure it draws on top
                }, {
                    // All stride data points - visible immediately
                    label: 'Stride Intervals',
                    data: chartData,
                    borderColor: colorScheme.line,
                    backgroundColor: colorScheme.line,
                    pointRadius: 3,
                    pointBackgroundColor: colorScheme.line,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1,
                    showLine: true,
                    borderWidth: 2,
                    tension: 0.2,
                    fill: false
                }, {
                    // Current Step - single highlighted point (updated during animation)
                    label: 'Current Step',
                    data: [], // Will be populated during animation
                    borderColor: '#ffffff',
                    backgroundColor: '#ffffff',
                    pointRadius: 6,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: colorScheme.line,
                    pointBorderWidth: 3,
                    showLine: false,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Stride Index',
                            color: '#000000',
                            font: { size: 12, weight: 'bold' }
                        },
                        beginAtZero: true,
                        suggestedMin: 0,
                        suggestedMax: walker.strideData.length > 0 ? walker.strideData.length + 1 : 10,
                        ticks: {
                            stepSize: 1,
                            color: '#000000',
                            font: { size: 10 }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.2)',
                            lineWidth: 0.5
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Interval (ms)',
                            color: '#000000',
                            font: { size: 12, weight: 'bold' }
                        },
                        beginAtZero: false,
                        suggestedMin: yMin > 0 ? yMin * 0.9 : 0,
                        suggestedMax: yMax > 0 ? yMax * 1.1 : 1000,
                        ticks: {
                            color: '#000000',
                            font: { size: 10 }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.2)',
                            lineWidth: 0.5
                        }
                    }
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
                                if (context[0].datasetIndex === 3) { // Stride data points
                                    return `Stride ${context[0].parsed.x}`;
                                }
                                return '';
                            },
                            label: function(context) {
                                if (context.datasetIndex === 0 || context.datasetIndex === 1) {
                                    return `Mean ± Std Dev: ${mean.toFixed(2)} ± ${stdDev.toFixed(2)} ms`;
                                } else if (context.datasetIndex === 2) {
                                    return `Average: ${mean.toFixed(2)} ms`;
                                } else if (context.datasetIndex === 3 || context.datasetIndex === 4) {
                                    return `Interval: ${context.parsed.y.toFixed(2)} ms`;
                                }
                            }
                        }
                    }
                }
            }
        });

        console.log(`✅ Chart initialized for ${walkerId} with ${walker.strideData.length} data points visible`);
    }
    
    // Update stride plot to highlight current step during animation (from stride-walker.js)
    updateStridePlot(walkerId, stepIndex) {
        const walker = this.walkerStates[walkerId];
        if (!walker || !walker.chart || !walker.strideData || walker.strideData.length === 0) {
            return;
        }

        // Get the current stride data point
        const currentPoint = stepIndex < walker.strideData.length ? 
            { x: stepIndex + 1, y: walker.strideData[stepIndex].interval } : null;
        
        // Update current step dataset (highlighted point) - dataset index 4
        walker.chart.data.datasets[4].data = currentPoint ? [currentPoint] : [];

        // Update the chart
        walker.chart.update('none'); // Use 'none' mode for better performance during animation
    }
    
    // Helper function to set leg transform (from stride-walker.js)
    setStrideLegTransform(legGroup, calf, hipAngle, kneeAngle) {
        if (!legGroup || !calf) return;
        
        // Apply rotation at the hip
        legGroup.setAttribute('transform', `translate(${parseFloat(legGroup.getAttribute('transform').split('(')[1].split(',')[0])},80) rotate(${hipAngle})`);
        
        // Apply rotation at the knee
        calf.setAttribute('transform', `translate(0,15) rotate(${kneeAngle}) translate(0,-15)`);
    }
    
    // Take a single step (animate legs) for specific walker (from stride-walker.js)
    takeStrideStep(walkerId) {
        const walker = this.walkerStates[walkerId];
        const { leftLegGroup, rightLegGroup, leftCalf, rightCalf } = this.getStrideWalkerElements(walkerId);

        if (!leftLegGroup || !rightLegGroup || !leftCalf || !rightCalf) {
            console.error(`Leg group or calf elements not found for ${walkerId} animation!`);
            return;
        }

        // Animate legs using rotation based on step count
        const hipRotationForward = 15; // Hip rotation angle for forward swing
        const hipRotationBackward = -5; // Hip rotation angle for backward swing
        const kneeRotationBend = -20; // Knee rotation angle for bending
        const kneeRotationStraight = 0; // Knee rotation angle for straight

        if (walker.stepCount % 2 === 0) {
            // Step 1: Left leg forward swing, Right leg backward swing
            this.setStrideLegTransform(leftLegGroup, leftCalf, hipRotationForward, kneeRotationBend);
            this.setStrideLegTransform(rightLegGroup, rightCalf, hipRotationBackward, kneeRotationStraight);
        } else {
            // Step 2: Right leg forward swing, Left leg backward swing
            this.setStrideLegTransform(leftLegGroup, leftCalf, hipRotationBackward, kneeRotationStraight);
            this.setStrideLegTransform(rightLegGroup, rightCalf, hipRotationForward, kneeRotationBend);
        }

        // Update the stride plot to highlight current step
        this.updateStridePlot(walkerId, walker.currentStepIndex);
    }
    
    // Setup stride walker controls (from stride-walker.js adapted)
    setupStrideWalkerControls() {
        const startButton = document.getElementById('startButton');
        if (startButton) {
            console.log('✅ Found stride start button, attaching event listener');
            
            // Remove any existing event listeners
            startButton.removeEventListener('click', this.toggleStrideWalking);
            
            // Add new event listener
            startButton.addEventListener('click', () => {
                console.log('🔘 Stride start button clicked');
                this.toggleStrideWalking();
            });
        } else {
            console.error('❌ Stride start button not found with ID: startButton');
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
    
    // Setup stride subject dropdowns (from stride-walker.js adapted)
    async setupStrideSubjectDropdowns() {
        console.log('📝 Setting up stride subject dropdowns');

        if (!this.strideSubjectData || this.strideSubjectData.length === 0) {
            console.warn('No stride subject data available to populate dropdowns.');
            return;
        }

        const olderSubjects = this.strideSubjectData.filter(s => s.group === 'Older');
        const youngerSubjects = this.strideSubjectData.filter(s => s.group === 'Younger');

        // Setup younger subjects dropdown
        const youngerSelect = document.getElementById('subjectSelectYounger');
        if (youngerSelect) {
            youngerSelect.innerHTML = youngerSubjects.map(s => 
                `<option value="${s.id}" data-age="${s.age}">${s.id}: Age ${s.age}</option>`
            ).join('');
            
            // Always select the first available subject
            if (youngerSubjects.length > 0) {
                youngerSelect.value = youngerSubjects[0].id.toString();
                console.log(`📋 Selected first younger subject: ${youngerSubjects[0].id}`);
            }
        }

        // Setup older subjects dropdown
        const olderSelect = document.getElementById('subjectSelectOlder');
        if (olderSelect) {
            olderSelect.innerHTML = olderSubjects.map(s => 
                `<option value="${s.id}" data-age="${s.age}">${s.id}: Age ${s.age}</option>`
            ).join('');
            
            // Always select the first available subject
            if (olderSubjects.length > 0) {
                olderSelect.value = olderSubjects[0].id.toString();
                console.log(`📋 Selected first older subject: ${olderSubjects[0].id}`);
            }
        }

        // Load initial data for default selected subjects
        if (youngerSelect && youngerSelect.value) {
            const initialYoungerSubjectId = parseInt(youngerSelect.value);
            console.log(`📊 Loading initial data for younger subject: ${initialYoungerSubjectId}`);
            await this.loadStrideData('younger', initialYoungerSubjectId);
        }

        if (olderSelect && olderSelect.value) {
            const initialOlderSubjectId = parseInt(olderSelect.value);
            console.log(`📊 Loading initial data for older subject: ${initialOlderSubjectId}`);
            await this.loadStrideData('older', initialOlderSubjectId);
        }

        // Update start button state
        this.updateStrideStartButtonState();

        console.log('✅ Stride subject dropdowns setup complete.');
    }
    
    // Handle stride subject change (from stride-walker.js adapted)
    async onStrideSubjectChange(walkerId, subjectId) {
        console.log(`👤 ${walkerId} subject selected: ID ${subjectId}`);
        
        // Stop current animation for this walker
        this.stopStrideWalking(walkerId);
        
        // Load new data and re-initialize walker display
        const success = await this.loadStrideData(walkerId, subjectId);
        
        // Update start button state after loading new data
        this.updateStrideStartButtonState();
    }
    
    // Toggle stride walking (from stride-walker.js adapted)
    toggleStrideWalking() {
        console.log('🔄 Toggle stride walking');
        const olderWalker = this.walkerStates.older;
        const youngerWalker = this.walkerStates.younger;

        const isCurrentlyWalking = olderWalker.isWalking || youngerWalker.isWalking;

        if (isCurrentlyWalking) {
            console.log('⏸️ Stopping stride walk for both');
            this.stopStrideWalking('older');
            this.stopStrideWalking('younger');
        const startButton = document.getElementById('startButton');
            if (startButton) startButton.textContent = 'Start Walking';
        } else {
            // Only start if both have data
            if (!olderWalker.strideData || olderWalker.strideData.length === 0 || 
                !youngerWalker.strideData || youngerWalker.strideData.length === 0) {
                console.warn('Cannot start stride walking: Data not loaded for one or both walkers.');
            return;
        }
            console.log('▶️ Starting stride walk for both');
            const startButton = document.getElementById('startButton');
            if (startButton) startButton.textContent = 'Pause Walking';

            // Start both animations
            this.startStrideWalking('older');
            this.startStrideWalking('younger');
        }
    }
    
    // Start stride walking for specific walker (from stride-walker.js adapted)
    startStrideWalking(walkerId) {
        const walker = this.walkerStates[walkerId];
        const { stepCountEl, currentIntervalEl } = this.getStrideWalkerElements(walkerId);

        if (!walker || !walker.strideData || walker.strideData.length === 0) {
            console.error(`No stride data available to start walking for ${walkerId}.`);
            return;
        }

        console.log(`🏃 Starting stride walk animation for ${walkerId}`);
        walker.isWalking = true;

        // Reset state when starting
        walker.stepCount = 0;
        walker.currentStepIndex = 0;
        walker.lastStepTime = performance.now();

        if (stepCountEl) stepCountEl.textContent = walker.stepCount;
        if (currentIntervalEl) currentIntervalEl.textContent = '-';

        // Take first step immediately and update plot
        this.takeStrideStep(walkerId);
        this.updateStridePlot(walkerId, walker.currentStepIndex);

        walker.animationFrameId = requestAnimationFrame((ts) => this.animateStrideWalker(walkerId, ts));
    }
    
    // Animate stride walker based on stride data (from stride-walker.js adapted)
    animateStrideWalker(walkerId, timestamp) {
        const walker = this.walkerStates[walkerId];
        const { currentIntervalEl, stepCountEl } = this.getStrideWalkerElements(walkerId);

        if (!walker || !walker.isWalking || !walker.strideData || walker.strideData.length === 0) {
            return;
        }

        // Get current stride data
        let activeStride = walker.strideData[walker.currentStepIndex];
        if (!activeStride) {
            console.log(`${walkerId} No more stride data, looping`);
            walker.currentStepIndex = 0; // Loop back to the beginning
            activeStride = walker.strideData[walker.currentStepIndex];
            if (!activeStride) {
                console.error(`Error: No stride data available for ${walkerId} after attempting loop.`);
                this.stopStrideWalking(walkerId);
                return;
            }
        }

        // Update current interval display
        if (currentIntervalEl) currentIntervalEl.textContent = activeStride.interval.toFixed(2) + ' ms';

        // Check if it's time for the next step
        if (timestamp - walker.lastStepTime >= activeStride.interval * this.strideSpeedMultiplier) {
            console.log(`${walkerId} Taking step ${walker.stepCount + 1} with interval ${activeStride.interval.toFixed(2)}ms`);
            
            // Take a step (animate legs)
            this.takeStrideStep(walkerId);
            walker.lastStepTime = timestamp;
            walker.currentStepIndex = (walker.currentStepIndex + 1) % walker.strideData.length;
            walker.stepCount++;
            if (stepCountEl) stepCountEl.textContent = walker.stepCount;
        }

        // Continue animation
        walker.animationFrameId = requestAnimationFrame((ts) => this.animateStrideWalker(walkerId, ts));
    }
    
    // Stop stride walking for specific walker (from stride-walker.js adapted)
    stopStrideWalking(walkerId) {
        console.log(`⏹️ Stopping stride walk animation for ${walkerId}`);
        const walker = this.walkerStates[walkerId];
        const { svg, currentIntervalEl } = this.getStrideWalkerElements(walkerId);

        if (!walker) return;

        walker.isWalking = false;
        if (walker.animationFrameId) {
            cancelAnimationFrame(walker.animationFrameId);
            walker.animationFrameId = null;
        }

        // Reset leg positions to neutral stance
        if (svg) {
            const leftLegGroup = svg.querySelector('.left-leg');
            const rightLegGroup = svg.querySelector('.right-leg');
            const leftCalf = leftLegGroup ? leftLegGroup.querySelector('.calf') : null;
            const rightCalf = rightLegGroup ? rightLegGroup.querySelector('.calf') : null;

            if (leftLegGroup) leftLegGroup.setAttribute('transform', 'translate(40,80) rotate(0)');
            if (rightLegGroup) rightLegGroup.setAttribute('transform', 'translate(50,80) rotate(0)');
            if (leftCalf) leftCalf.setAttribute('transform', 'translate(0,0)');
            if (rightCalf) rightCalf.setAttribute('transform', 'translate(0,0)');
        }

        // Reset state variables
        walker.stepCount = 0;
        walker.currentStepIndex = 0;
        walker.lastStepTime = 0;

        // Reset current interval display
        if (currentIntervalEl) currentIntervalEl.textContent = '-';

        // Remove chart highlighting when stopped
        if (walker.chart) {
            walker.chart.data.datasets[4].data = []; // Clear current step highlight
            walker.chart.update();
        }
    }
    
    // Update stride start button state (from stride-walker.js adapted)
    updateStrideStartButtonState() {
        const olderWalker = this.walkerStates.older;
        const youngerWalker = this.walkerStates.younger;
        const startButton = document.getElementById('startButton');

        if (startButton) {
            if (olderWalker.strideData.length > 0 && youngerWalker.strideData.length > 0) {
                startButton.disabled = false;
                startButton.textContent = 'Start Walking';
        } else {
                startButton.disabled = true;
                startButton.textContent = 'Loading Data...';
            }
        }
    }
    
    // Reset stride walker animation (adapted for scrollytelling)
    resetStrideWalkerAnimation() {
        // Stop variability visualization first to prevent canvas DOM errors
        this.pauseVariabilityVisualization();
        
        // Destroy variability charts completely
        if (this.variabilityState.charts.younger) {
            try {
                this.variabilityState.charts.younger.destroy();
            } catch (error) {
                console.warn('Error destroying younger variability chart:', error);
            }
            this.variabilityState.charts.younger = null;
        }
        
        if (this.variabilityState.charts.older) {
            try {
                this.variabilityState.charts.older.destroy();
            } catch (error) {
                console.warn('Error destroying older variability chart:', error);
            }
            this.variabilityState.charts.older = null;
        }
        
        // Reset both walkers
        ['younger', 'older'].forEach(walkerId => {
            const walker = this.walkerStates[walkerId];
            const svg = document.querySelector(`.kid-svg.${walkerId}`);
            
            if (svg) {
                svg.style.animation = '';
                svg.style.transform = 'scale(0.7)'; // Match CSS scale
                svg.innerHTML = ''; // Clear SVG content
            }
            
            // Stop walking animation
            this.stopStrideWalking(walkerId);
            
            // Clear walker state
            if (walker) {
                walker.subject = null;
                walker.strideData = [];
                walker.stepCount = 0;
                walker.elements = null; // Clear cached elements
                
                // Destroy chart
                if (walker.chart) {
                    walker.chart.destroy();
                    walker.chart = null;
                }
            }
            
            // Reset stats displays
            const currentIntervalEl = document.getElementById(`currentInterval${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`);
            const avgIntervalEl = document.getElementById(`avgInterval${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`);
            const stdDevEl = document.getElementById(`stdDev${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`);
            const stepCountEl = document.getElementById(`stepCount${walkerId.charAt(0).toUpperCase() + walkerId.slice(1)}`);
            
            if (currentIntervalEl) currentIntervalEl.textContent = '-';
            if (avgIntervalEl) avgIntervalEl.textContent = '-';
            if (stdDevEl) stdDevEl.textContent = '-';
            if (stepCountEl) stepCountEl.textContent = '0';
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
            startButton.disabled = false;
        }
        
        console.log('🔄 Reset stride walker animation completely');
    }
    
    // Chapter 3: Comparison Race Animation
    startComparisonRaceAnimation() {
        console.log('🏁 Starting comparison race animation');
        
        // Wait for gait data to be loaded before proceeding
        const waitForData = () => {
            if (!this.gaitData || this.gaitData.length === 0) {
                console.log('⏳ Waiting for gait data to load...');
                setTimeout(waitForData, 100);
                return;
            }
            
            console.log('✅ Gait data available, proceeding with race setup');
            
            // Load race subject data
            this.loadRaceSubjectData();
        
        // Initialize race SVGs
        ['young', 'middle', 'old'].forEach(ageGroup => {
            this.initRacerSVG(ageGroup);
        });
        
        // Set up race controls
        this.setupRaceControls();
        
            // Auto-populate race dropdowns after a short delay to ensure DOM readiness
        setTimeout(() => {
            if (this.currentSection === 3) {
                this.populateRaceDropdowns();
                this.autoSelectDefaultRaceSubjects();
                    console.log('🎯 Race setup completed');
            }
            }, 200);
        };
        
        waitForData();
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
        
        // Reset position and styles
        svg.style.left = '0%';
        svg.style.transition = '';
        svg.classList.remove('racing');
        
        // Create detailed walker SVG with head, body, arms, and legs
        svg.innerHTML = `
            <!-- Head -->
            <rect x="40" y="10" width="40" height="40" fill="#FFD700" rx="20"></rect>
            <!-- Hair -->
            <rect x="35" y="5" width="50" height="10" fill="#8B4513" rx="5"></rect>
            <!-- Eyes -->
            <rect x="45" y="25" width="5" height="5" fill="#000"></rect>
            <rect x="70" y="25" width="5" height="5" fill="#000"></rect>
            <!-- Nose -->
            <rect x="57" y="35" width="3" height="3" fill="#000"></rect>
            <!-- Mouth -->
            <rect x="50" y="40" width="20" height="3" fill="#000" rx="2"></rect>
            <!-- Body -->
            <rect x="45" y="50" width="30" height="35" fill="${colors[ageGroup]}" rx="5"></rect>
            <!-- Left Arm -->
            <rect x="30" y="55" width="15" height="20" fill="${colors[ageGroup]}" rx="7"></rect>
            <!-- Right Arm -->
            <rect x="75" y="55" width="15" height="20" fill="${colors[ageGroup]}" rx="7"></rect>
            <!-- Left Leg -->
            <rect x="50" y="85" width="8" height="25" fill="${colors[ageGroup]}" rx="4"></rect>
            <!-- Right Leg -->
            <rect x="62" y="85" width="8" height="25" fill="${colors[ageGroup]}" rx="4"></rect>
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
        this.raceSubjects = this.gaitData.filter(subject => {
            // Ensure we have valid data
            return subject && subject.id && subject.speed && subject.group;
        });
        console.log('📊 Loaded race subject data:', this.raceSubjects.length, 'subjects');
        console.log('📊 Sample subjects:', this.raceSubjects.slice(0, 3));
        console.log('📊 Available groups:', [...new Set(this.raceSubjects.map(s => s.group))]);
    }
    
    // Populate race dropdowns
    populateRaceDropdowns() {
        if (!this.raceSubjects || this.raceSubjects.length === 0) {
            console.error('❌ No race subjects available for dropdown population');
            return;
        }
        
        ['young', 'middle', 'old'].forEach(ageGroup => {
            const select = document.getElementById(`${ageGroup}Select`);
            if (!select) {
                console.error(`❌ Dropdown not found: ${ageGroup}Select`);
                return;
            }
            
            // Filter subjects by group
            const groupSubjects = this.raceSubjects.filter(s => s.group === ageGroup);
            console.log(`📊 ${ageGroup} group subjects:`, groupSubjects.length);
            
                select.innerHTML = '<option value="">Choose subject...</option>';
            
            if (groupSubjects.length === 0) {
                const noDataOption = document.createElement('option');
                noDataOption.value = '';
                noDataOption.textContent = `No ${ageGroup} subjects available`;
                noDataOption.disabled = true;
                select.appendChild(noDataOption);
                console.warn(`⚠️ No subjects found for ${ageGroup} group`);
                return;
            }
            
            groupSubjects.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject.id;
                option.textContent = `Subject ${subject.id} (${subject.speed.toFixed(2)} m/s, ${subject.age} mo)`;
                    select.appendChild(option);
                });
            
            console.log(`✅ Populated ${ageGroup} dropdown with ${groupSubjects.length} subjects`);
        });
    }
    
    // Auto-select default race subjects
    autoSelectDefaultRaceSubjects() {
        ['young', 'middle', 'old'].forEach(ageGroup => {
            const select = document.getElementById(`${ageGroup}Select`);
            if (select && select.options.length > 1) {
                // Select the first non-empty option (index 1)
                select.selectedIndex = 1;
                const selectedValue = parseInt(select.value);
                console.log(`🎯 Auto-selected ${ageGroup} subject: ${selectedValue}`);
                this.onRaceSubjectChange(ageGroup, selectedValue);
            } else {
                console.warn(`⚠️ Could not auto-select ${ageGroup} subject - insufficient options`);
            }
        });
    }
    
    // Handle race subject change
    onRaceSubjectChange(ageGroup, subjectId) {
        const subject = this.raceSubjects?.find(s => s.id === subjectId);
        if (!subject) {
            console.error(`❌ Subject not found: ID ${subjectId} in ${ageGroup} group`);
            return;
        }
        
        console.log(`📊 Selected ${ageGroup} subject:`, subject);
        
        // Update info display
        const infoEl = document.getElementById(`${ageGroup}Info`);
        if (infoEl) {
            const spans = infoEl.getElementsByClassName('stat-value');
            if (spans.length >= 3) {
                spans[0].textContent = `${subject.age}`;
                spans[1].textContent = `${subject.speed.toFixed(2)}`;
                spans[2].textContent = `${subject.height ? subject.height.toFixed(1) : subject.legLength ? subject.legLength.toFixed(1) : 'N/A'}`;
                console.log(`✅ Updated ${ageGroup} info display`);
            } else {
                console.warn(`⚠️ Could not find stat-value spans for ${ageGroup}Info`);
            }
        } else {
            console.warn(`⚠️ Info element not found: ${ageGroup}Info`);
        }
        
        console.log(`✅ ${ageGroup} racer selected: ID ${subject.id}, Speed ${subject.speed.toFixed(2)} m/s`);
    }
    
    // Start race
    startRace() {
        console.log('🏁 Starting race');
        
        const raceButton = document.getElementById('raceButton');
        if (raceButton) {
            raceButton.textContent = 'Racing...';
            raceButton.disabled = true;
        }
        
        // First, reset all walkers to starting position
        ['young', 'middle', 'old'].forEach(ageGroup => {
            const svg = document.querySelector(`.kid-svg.${ageGroup}`);
            if (svg) {
                svg.style.transition = 'none';
                svg.style.left = '0%';
                svg.classList.remove('racing');
                // Force reflow to ensure the reset is applied
                svg.offsetHeight;
            }
        });
        
        // Get selected subjects and validate data
        const subjects = {};
        let validSubjectsCount = 0;
        
        ['young', 'middle', 'old'].forEach(ageGroup => {
            const select = document.getElementById(`${ageGroup}Select`);
            console.log(`📊 ${ageGroup} select element:`, select);
            console.log(`📊 ${ageGroup} selected value:`, select?.value);
            
            if (select && select.value) {
                const subjectId = parseInt(select.value);
                const subject = this.raceSubjects?.find(s => s.id === subjectId);
                console.log(`📊 Found ${ageGroup} subject:`, subject);
                
                if (subject && subject.speed) {
                    subjects[ageGroup] = subject;
                    validSubjectsCount++;
                    console.log(`✅ ${ageGroup} subject loaded: ID ${subject.id}, Speed ${subject.speed.toFixed(2)} m/s`);
                } else {
                    console.warn(`⚠️ Invalid ${ageGroup} subject or missing speed data`);
                }
            } else {
                console.warn(`⚠️ No ${ageGroup} subject selected`);
            }
        });
        
        console.log(`📊 Total valid subjects: ${validSubjectsCount}`);
        console.log(`📊 Subjects object:`, subjects);
        
        if (validSubjectsCount === 0) {
            console.error('❌ No valid subjects found for race!');
            if (raceButton) {
                raceButton.textContent = 'Start Race';
                raceButton.disabled = false;
            }
            return;
        }
        
        // Start race animation after reset
        setTimeout(() => {
        this.animateRace(subjects);
        }, 100);
    }
    
    // Animate race
    animateRace(subjects) {
        console.log('🎬 Starting race animation with subjects:', subjects);
        
        const raceDuration = 4000;
        
        // Get all speeds for max calculation
        const speeds = Object.values(subjects).map(s => s ? s.speed : 0).filter(s => s > 0);
        if (speeds.length === 0) {
            console.error('❌ No valid speeds found for race animation!');
            return;
        }
        
        const maxSpeed = Math.max(...speeds);
        console.log(`📊 Max speed: ${maxSpeed.toFixed(2)} m/s`);
        console.log(`📊 All speeds: [${speeds.map(s => s.toFixed(2)).join(', ')}]`);
        
        Object.entries(subjects).forEach(([ageGroup, subject]) => {
            if (!subject) {
                console.warn(`⚠️ No subject for ${ageGroup} group`);
                return;
            }
            
            const svg = document.querySelector(`.kid-svg.${ageGroup}`);
            if (!svg) {
                console.error(`❌ SVG not found for ${ageGroup} group`);
                return;
            }
            
                const speed = subject.speed;
            const speedRatio = speed / maxSpeed;
            const position = speedRatio * 75; // 75% max position for better visibility
            
            console.log(`🏃 ${ageGroup.toUpperCase()} RACER:`);
            console.log(`   Subject ID: ${subject.id}`);
            console.log(`   Speed: ${speed.toFixed(2)} m/s`);
            console.log(`   Speed Ratio: ${speedRatio.toFixed(3)}`);
            console.log(`   Final Position: ${position.toFixed(1)}%`);
            
            // Enable smooth transition and add racing class for walking animation
                svg.style.transition = `left ${raceDuration}ms ease-out`;
                svg.classList.add('racing');
            
            // Start the race movement with immediate position update
            svg.style.left = `${position}%`;
            
            // Add visual feedback for speed
            if (speedRatio > 0.9) {
                svg.style.filter = 'drop-shadow(0 0 20px #feca57)'; // Gold glow for fastest
            } else if (speedRatio > 0.7) {
                svg.style.filter = 'drop-shadow(0 0 15px #4ecdc4)'; // Teal glow for fast
            } else {
                svg.style.filter = 'drop-shadow(0 2px 8px rgba(255, 255, 255, 0.4))'; // Default glow
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
                
                // Remove racing class and reset positions
                ['young', 'middle', 'old'].forEach(ageGroup => {
                    const svg = document.querySelector(`.kid-svg.${ageGroup}`);
                    if (svg) {
                        svg.classList.remove('racing');
                        svg.style.filter = 'drop-shadow(0 2px 8px rgba(255, 255, 255, 0.4))'; // Reset filter
                        // Reset to starting position smoothly
                        setTimeout(() => {
                            svg.style.transition = 'left 1000ms ease-in-out';
                            svg.style.left = '0%';
                        }, 500);
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
                
                // Re-initialize the SVG to ensure proper state
                this.initRacerSVG(ageGroup);
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
        console.log(`🚶 Starting default animation for ${walkerId} walker`);
        
        const elements = this.getStrideWalkerElements(walkerId);
        if (!elements.svg) return;
        
        // Initialize basic SVG if not already done
        if (!elements.svg.innerHTML.trim()) {
            this.initStrideWalkerSVG(walkerId);
        }
        
        // Simple walking animation
        const legGroups = elements.svg.querySelectorAll('.leg-group');
        const armGroups = elements.svg.querySelectorAll('.arm-group');
        
        let animationFrame = 0;
        const animate = () => {
            animationFrame += 0.1;
            
            legGroups.forEach((leg, index) => {
                const offset = index * Math.PI; // Legs move opposite to each other
                const legAngle = Math.sin(animationFrame + offset) * 15;
                leg.style.transform = `rotate(${legAngle}deg)`;
            });
            
            armGroups.forEach((arm, index) => {
                const offset = index * Math.PI; // Arms move opposite to legs
                const armAngle = Math.sin(animationFrame + offset + Math.PI) * 10;
                arm.style.transform = `rotate(${armAngle}deg)`;
            });
            
            if (this.walkerStates[walkerId] && this.walkerStates[walkerId].isWalking) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    // Real-time variability visualization state
    variabilityState = {
        isPlaying: false,
        charts: {
            younger: null,
            older: null
        },
        datasets: {
            younger: [],
            older: []
        },
        timeIndex: 0,
        maxDataPoints: 50,
        updateInterval: null,
        fixedAxes: {
            y: { min: 0, max: 100 }, // Fixed Y-axis for standard deviation
            x: { min: 0, max: 50 }   // Fixed X-axis for time steps
        }
    };

    // Initialize real-time variability charts
    initializeVariabilityCharts() {
        // Only initialize if we're in section 2 (stride walker section) and canvas elements exist
        const youngerCanvas = document.getElementById('strideVariabilityYounger');
        const olderCanvas = document.getElementById('strideVariabilityOlder');
        
        if (!youngerCanvas && !olderCanvas) {
            console.log('📊 Variability chart canvases not found, skipping initialization');
            return;
        }
        
        console.log('📊 Initializing variability charts');
        
        if (youngerCanvas) {
            this.initializeVariabilityChart('younger');
        }
        
        if (olderCanvas) {
            this.initializeVariabilityChart('older');
        }
        
        this.setupVariabilityControls();
    }

    initializeVariabilityChart(walkerId) {
        const canvasId = walkerId === 'younger' ? 'strideVariabilityYounger' : 'strideVariabilityOlder';
        const canvas = document.getElementById(canvasId);
        
        if (!canvas) {
            console.warn(`Canvas ${canvasId} not found, skipping chart initialization`);
            return;
        }

        // Ensure canvas is properly attached to DOM
        if (!canvas.parentNode) {
            console.warn(`Canvas ${canvasId} not attached to DOM, skipping chart initialization`);
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.warn(`Cannot get 2D context for canvas ${canvasId}, skipping chart initialization`);
            return;
        }
        
        // Destroy existing chart if it exists - IMPROVED CLEANUP
        if (this.variabilityState.charts[walkerId]) {
            try {
                this.variabilityState.charts[walkerId].destroy();
            } catch (error) {
                console.warn(`Error destroying existing ${walkerId} chart:`, error);
            }
            this.variabilityState.charts[walkerId] = null;
        }
        
        // Also check for any Chart.js instances attached to this canvas and destroy them
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            try {
                existingChart.destroy();
            } catch (error) {
                console.warn(`Error destroying existing Chart.js instance on ${canvasId}:`, error);
            }
        }

        try {
            this.variabilityState.charts[walkerId] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: Array.from({length: this.variabilityState.maxDataPoints}, (_, i) => i),
                    datasets: [{
                        label: 'Stride Std Dev (ms)',
                        data: [],
                        borderColor: walkerId === 'younger' ? '#4ecdc4' : '#ff6b6b',
                        backgroundColor: walkerId === 'younger' ? 'rgba(76, 205, 196, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0, // Hide all points on the main line
                        pointHoverRadius: 0, // Hide hover effects on the main line
                        showLine: true // Ensure continuous line is shown
                    }, {
                        label: 'Latest Data Point',
                        data: [],
                        borderColor: '#ffffff',
                        backgroundColor: '#ffffff',
                        borderWidth: 0,
                        fill: false,
                        tension: 0,
                        pointRadius: 4, // Smaller highlighted dot for latest point (reduced from 8)
                        pointHoverRadius: 6, // Reduced from 10
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: walkerId === 'younger' ? '#4ecdc4' : '#ff6b6b',
                        pointBorderWidth: 3,
                        showLine: false // Only show the point, not a line
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 300,
                        easing: 'easeInOutQuart'
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: '#000000',
                                font: { size: 10, weight: 'bold' },
                                filter: function(item, chart) {
                                    // Show only Average Interval and Stride Intervals in legend
                                    return item.datasetIndex === 2 || item.datasetIndex === 3;
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: walkerId === 'younger' ? '#4ecdc4' : '#ff6b6b',
                            borderWidth: 1,
                            cornerRadius: 6,
                            displayColors: true,
                            callbacks: {
                                title: function(context) {
                                    return `Step ${context[0].label}`;
                                },
                                label: function(context) {
                                    return `Std Dev: ${context.parsed.y.toFixed(2)} ms`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            min: this.variabilityState.fixedAxes.x.min,
                            max: this.variabilityState.fixedAxes.x.max,
                            title: {
                                display: true,
                                text: 'Time Steps',
                                color: '#ffffff',
                                font: {
                                    family: "'Courier New', monospace",
                                    size: 12,
                                    weight: 'bold'
                                }
                            },
                            ticks: {
                                color: '#ffffff',
                                font: {
                                    family: "'Courier New', monospace",
                                    size: 10
                                },
                                stepSize: 10
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)',
                                lineWidth: 1
                            }
                        },
                        y: {
                            min: this.variabilityState.fixedAxes.y.min,
                            max: this.variabilityState.fixedAxes.y.max,
                            title: {
                                display: true,
                                text: 'Standard Deviation (ms)',
                                color: '#ffffff',
                                font: {
                                    family: "'Courier New', monospace",
                                    size: 12,
                                    weight: 'bold'
                                }
                            },
                            ticks: {
                                color: '#ffffff',
                                font: {
                                    family: "'Courier New', monospace",
                                    size: 10
                                },
                                stepSize: 20
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)',
                                lineWidth: 1
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.warn(`Error initializing ${walkerId} variability chart:`, error);
        }
    }

    setupVariabilityControls() {
        const playBtn = document.getElementById('playVariabilityButton');
        const pauseBtn = document.getElementById('pauseVariabilityButton');
        const resetBtn = document.getElementById('resetVariabilityButton');

        if (playBtn) {
            playBtn.addEventListener('click', () => this.playVariabilityVisualization());
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pauseVariabilityVisualization());
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetVariabilityVisualization());
        }
    }

    playVariabilityVisualization() {
        if (this.variabilityState.isPlaying) return;

        this.variabilityState.isPlaying = true;
        this.updateVariabilityButtonStates();

        // Start the real-time data simulation
        this.variabilityState.updateInterval = setInterval(() => {
            this.updateVariabilityData();
        }, 200); // Update every 200ms for smooth real-time effect
    }

    pauseVariabilityVisualization() {
        this.variabilityState.isPlaying = false;
        this.updateVariabilityButtonStates();

        if (this.variabilityState.updateInterval) {
            clearInterval(this.variabilityState.updateInterval);
            this.variabilityState.updateInterval = null;
        }
    }

    resetVariabilityVisualization() {
        this.pauseVariabilityVisualization();
        
        // Reset data
        this.variabilityState.datasets.younger = [];
        this.variabilityState.datasets.older = [];
        this.variabilityState.timeIndex = 0;

        // Update charts - clear both datasets with error handling
        if (this.variabilityState.charts.younger) {
            try {
                if (this.variabilityState.charts.younger.data && 
                    this.variabilityState.charts.younger.data.datasets &&
                    this.variabilityState.charts.younger.data.datasets.length >= 2) {
                    this.variabilityState.charts.younger.data.datasets[0].data = []; // Clear continuous line
                    this.variabilityState.charts.younger.data.datasets[1].data = []; // Clear highlighted point
                    this.variabilityState.charts.younger.update('none');
                }
            } catch (error) {
                console.warn('Error resetting younger variability chart:', error);
                // Destroy and recreate the chart if reset fails
                try {
                    this.variabilityState.charts.younger.destroy();
                } catch (destroyError) {
                    console.warn('Error destroying younger chart during reset:', destroyError);
                }
                this.variabilityState.charts.younger = null;
            }
        }
        
        if (this.variabilityState.charts.older) {
            try {
                if (this.variabilityState.charts.older.data && 
                    this.variabilityState.charts.older.data.datasets &&
                    this.variabilityState.charts.older.data.datasets.length >= 2) {
                    this.variabilityState.charts.older.data.datasets[0].data = []; // Clear continuous line
                    this.variabilityState.charts.older.data.datasets[1].data = []; // Clear highlighted point
                    this.variabilityState.charts.older.update('none');
                }
            } catch (error) {
                console.warn('Error resetting older variability chart:', error);
                // Destroy and recreate the chart if reset fails
                try {
                    this.variabilityState.charts.older.destroy();
                } catch (destroyError) {
                    console.warn('Error destroying older chart during reset:', destroyError);
                }
                this.variabilityState.charts.older = null;
            }
        }
    }

    updateVariabilityButtonStates() {
        const playBtn = document.getElementById('playVariabilityButton');
        const pauseBtn = document.getElementById('pauseVariabilityButton');

        if (playBtn && pauseBtn) {
            if (this.variabilityState.isPlaying) {
                playBtn.style.display = 'none';
                pauseBtn.style.display = 'inline-block';
            } else {
                playBtn.style.display = 'inline-block';
                pauseBtn.style.display = 'none';
            }
        }
    }

    updateVariabilityData() {
        // Check if we're still in the stride section (section 2)
        if (this.currentSection !== 2) {
            console.log('No longer in stride section, stopping variability visualization');
            this.pauseVariabilityVisualization();
            return;
        }
        
        // Check if charts are properly initialized before generating data
        if (!this.variabilityState.charts.younger && !this.variabilityState.charts.older) {
            console.warn('No variability charts initialized, stopping visualization');
            this.pauseVariabilityVisualization();
            return;
        }

        try {
            // Generate realistic stride interval variability data
            const youngerStdDev = this.generateStrideStdDev('younger');
            const olderStdDev = this.generateStrideStdDev('older');

            // Add data points only if charts exist
            if (this.variabilityState.charts.younger) {
                this.addVariabilityDataPoint('younger', youngerStdDev);
            }
            
            if (this.variabilityState.charts.older) {
                this.addVariabilityDataPoint('older', olderStdDev);
            }

            this.variabilityState.timeIndex++;

            // Stop if we've reached the maximum
            if (this.variabilityState.timeIndex >= this.variabilityState.maxDataPoints) {
                this.pauseVariabilityVisualization();
            }
        } catch (error) {
            console.error('Error updating variability data:', error);
            this.pauseVariabilityVisualization();
        }
    }

    generateStrideStdDev(walkerId) {
        // Load real participant data directly for variability calculation
        const selectElement = document.getElementById(walkerId === 'younger' ? 'subjectSelectYounger' : 'subjectSelectOlder');
        
        if (!selectElement || !selectElement.value) {
            console.error(`No participant selected for ${walkerId} walker`);
            return 0;
        }
        
        const subjectId = parseInt(selectElement.value);
        const subject = this.strideSubjectData.find(s => s.id === subjectId);
        
        if (!subject) {
            console.error(`Subject data not found for ID: ${subjectId}`);
            return 0;
        }
        
        // Calculate standard deviation based on actual subject characteristics
        const baseStdDev = subject.age < 80 ? 25 : 35; // Younger subjects tend to have more consistent gait
        const ageEffect = (subject.age - 40) * 0.2; // Age-related increase in variability
        const speedEffect = (1.5 - subject.speed) * 10; // Slower speeds tend to have more variability
        
        // Add natural variation based on time to simulate real gait patterns
        const timeEffect = Math.sin(this.variabilityState.timeIndex * 0.1) * 5;
        
        const calculatedStdDev = Math.max(5, baseStdDev + ageEffect + speedEffect + timeEffect);
        
        return calculatedStdDev;
    }

    addVariabilityDataPoint(walkerId, stdDevValue) {
        // Check if we're still in the stride section (section 2)
        if (this.currentSection !== 2) {
            console.log(`Skipping variability update for ${walkerId} - not in stride section (current: ${this.currentSection})`);
            return;
        }
        
        const chart = this.variabilityState.charts[walkerId];
        
        // Enhanced null checks to prevent Chart.js errors
        if (!chart || !chart.data || !chart.data.datasets || chart.data.datasets.length < 2) {
            console.warn(`Chart not properly initialized for ${walkerId}, skipping data update`);
            return;
        }
        
        // Check if chart canvas still exists in DOM
        const canvas = chart.canvas;
        if (!canvas || !canvas.parentNode) {
            console.warn(`Chart canvas for ${walkerId} no longer in DOM, skipping update`);
            return;
        }
        
        // Check if chart is destroyed
        if (chart.destroyed) {
            console.warn(`Chart for ${walkerId} is destroyed, skipping update`);
            return;
        }

        const lineDataset = chart.data.datasets[0]; // Main continuous line
        const highlightDataset = chart.data.datasets[1]; // Highlighted latest point
        
        // Verify datasets exist
        if (!lineDataset || !highlightDataset) {
            console.warn(`Chart datasets for ${walkerId} are missing, skipping update`);
            return;
        }
        
        // Initialize data arrays if they don't exist
        if (!lineDataset.data) lineDataset.data = [];
        if (!highlightDataset.data) highlightDataset.data = [];
        
        // Add new data point to the continuous line
        lineDataset.data.push({
            x: this.variabilityState.timeIndex,
            y: stdDevValue
        });

        // Update the highlighted point to show only the latest data point
        highlightDataset.data = [{
            x: this.variabilityState.timeIndex,
            y: stdDevValue
        }];

        // Remove old data points from the line if we exceed the maximum
        if (lineDataset.data.length > this.variabilityState.maxDataPoints) {
            lineDataset.data.shift();
        }

        // Safe chart update with error handling
        try {
            chart.update('none'); // Use 'none' instead of 'active' for better performance
        } catch (error) {
            console.error(`Error updating ${walkerId} variability chart:`, error);
            // Stop the visualization if chart updates are failing
            this.pauseVariabilityVisualization();
            return;
        }

        // Update the stats display
        this.updateVariabilityStats(walkerId, stdDevValue);
    }

    updateVariabilityStats(walkerId, currentStdDev) {
        const currentId = walkerId === 'younger' ? 'currentIntervalYounger' : 'currentIntervalOlder';
        const stdDevId = walkerId === 'younger' ? 'stdDevYounger' : 'stdDevOlder';
        
        const currentElement = document.getElementById(currentId);
        const stdDevElement = document.getElementById(stdDevId);
        
        if (currentElement) {
            // Get real participant data for current interval calculation
            const selectElement = document.getElementById(walkerId === 'younger' ? 'subjectSelectYounger' : 'subjectSelectOlder');
            
            if (!selectElement || !selectElement.value) {
                console.error(`No participant selected for ${walkerId} walker stats`);
                currentElement.textContent = '-';
                return;
            }
            
            const subjectId = parseInt(selectElement.value);
            const subject = this.strideSubjectData.find(s => s.id === subjectId);
            
            if (!subject) {
                console.error(`Subject data not found for ID: ${subjectId} in stats`);
                currentElement.textContent = '-';
                return;
            }
            
            // Calculate realistic current interval based on subject characteristics
            const baseInterval = 400 + (subject.age * 3); // Age affects stride time
            const speedAdjustment = (1.5 - subject.speed) * 100; // Speed affects stride time
            
            // Use deterministic variation based on time index instead of random
            const timeBasedVariation = Math.sin(this.variabilityState.timeIndex * 0.2) * currentStdDev;
            
            const currentInterval = Math.max(200, baseInterval + speedAdjustment + timeBasedVariation);
            currentElement.textContent = `${currentInterval.toFixed(0)}`;
        }
        
        if (stdDevElement) {
            stdDevElement.textContent = `${currentStdDev.toFixed(1)}`;
        }
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
    
    // Initialize walking speed simulation if we're on chapter 8
    if (document.getElementById('chapter8')) {
        initializeWalkingSpeedSimulation();
    }
}); 

// Walking Speed Simulation
function initializeWalkingSpeedSimulation() {
    const sliders = {
        age: document.getElementById('age-slider'),
        height: document.getElementById('height-slider'),
        legLength: document.getElementById('leg-length-slider'),
        stride: document.getElementById('stride-slider')
    };

    const valueDisplays = {
        age: document.getElementById('age-value'),
        height: document.getElementById('height-value'),
        legLength: document.getElementById('leg-length-value'),
        stride: document.getElementById('stride-value')
    };

    const speedDisplay = document.getElementById('predicted-speed');

    function updateSpeed() {
        const age = parseFloat(sliders.age.value);
        const height = parseFloat(sliders.height.value);
        const legLength = parseFloat(sliders.legLength.value);
        const strideInterval = parseFloat(sliders.stride.value);

        // Calculate predicted speed using the provided formula
        const predicted_speed = 6.853 
            - 0.03 * age
            + 0.05 * height 
            - 0.01 * legLength
            - 1.51 * Math.log(age) 
            + 0.93 * Math.sqrt(age)
            - 1.33 * Math.log(height) 
            - 2.16 * strideInterval;

        // Update the speed display with 2 decimal places
        speedDisplay.textContent = predicted_speed.toFixed(2) + ' m/s';

        // Add animation effect
        speedDisplay.style.animation = 'none';
        speedDisplay.offsetHeight; // Trigger reflow
        speedDisplay.style.animation = 'speedPulse 2s ease-in-out infinite';
    }

    // Initialize all sliders
    Object.keys(sliders).forEach(key => {
        const slider = sliders[key];
        const display = valueDisplays[key];

        // Set initial value
        display.textContent = slider.value;

        // Add event listeners
        slider.addEventListener('input', () => {
            display.textContent = slider.value;
            updateSpeed();
        });

        // Add hover effect
        slider.addEventListener('mouseenter', () => {
            slider.style.transform = 'scale(1.02)';
        });

        slider.addEventListener('mouseleave', () => {
            slider.style.transform = 'scale(1)';
        });
    });

    // Calculate initial speed
    updateSpeed();
} 