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
        this.snapThreshold = 50; // Minimum scroll distance to trigger snap
        this.velocityThreshold = 0.5; // Maximum velocity to allow snapping
        this.snapCooldownTime = 800; // Cooldown period in ms
        this.debounceTimer = null;
        this.snapDebounceTime = 150; // Debounce time for snap triggers
        
        // Scroll Intent Detection
        this.wheelDelta = 0;
        this.touchStartY = 0;
        this.touchEndY = 0;
        this.scrollIntentThreshold = 30;
        
        // Section State Management
        this.section1Revealed = false;
        this.section2Animated = false;
        this.sectionTimers = {}; // Track timers for each section
        this.activeIntervals = {}; // Track active intervals
        
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
        this.bindEvents();
        this.startMagneticScrollDetection();
        
        console.log('🧲 Magnetic Scrollytelling Engine initialized!');
    }
    
    // Load and parse CSV data
    async loadGaitData() {
        try {
            const response = await fetch('gait-maturation-database-1.0.0/data/table.csv');
            const csvText = await response.text();
            this.parseCSVData(csvText);
            console.log('📊 Gait data loaded:', this.gaitData.length, 'records');
        } catch (error) {
            console.error('❌ Error loading gait data:', error);
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
        this.gaitData = [
            { height: 40, speed: 1.04, group: 'young' },
            { height: 47, speed: 1.32, group: 'middle' },
            { height: 60, speed: 1.26, group: 'old' }
        ];
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
    updateDataPointsVisualization(ageGroup = 'all') {
        const container = document.getElementById('dataPointsContainer');
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
    
    // 1. SCROLL INTENT DETECTION
    startMagneticScrollDetection() {
        let animationFrame = null;
        
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
            animationFrame = null;
        };
        
        // Wheel event detection
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
        }, { passive: false });
        
        // Touch event detection
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
        }, { passive: false });
        
        window.addEventListener('touchend', (e) => {
            if (this.isSnapping || this.snapCooldown) return;
            
            this.touchEndY = e.changedTouches[0].clientY;
            const touchDelta = this.touchStartY - this.touchEndY;
            
            if (Math.abs(touchDelta) > this.scrollIntentThreshold) {
                this.detectScrollIntent('touch', touchDelta > 0 ? 1 : -1);
            }
        }, { passive: true });
        
        // Natural scroll detection with debouncing
        window.addEventListener('scroll', () => {
            if (this.isSnapping) return;
            
            if (!animationFrame) {
                animationFrame = requestAnimationFrame(updateScrollState);
            }
            
            // Debounced snap check for natural scrolling
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                if (!this.isSnapping && this.scrollVelocity < this.velocityThreshold) {
                    this.checkNaturalScrollSnap();
                }
            }, this.snapDebounceTime);
        }, { passive: true });
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
            const activeSection = this.sections.find(s => s.state === 'visible' || s.state === 'entering');
            if (activeSection) {
                // Check if we're moving to a different section
                if (this.currentSection !== activeSection.index) {
                    // Reset the previous section's state
                    this.resetSectionState(this.currentSection);
                    this.currentSection = activeSection.index;
                    // Initialize the new section
                    this.initializeSectionState(this.currentSection);
                }
            }
        }
        
        // Calculate overall progress
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        this.scrollProgress = Math.min(window.pageYOffset / maxScroll, 1);
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
                // Reset Chapter 2 number line animation
                this.section2Animated = false;
                this.resetNumberLineAnimation();
                break;
                
            case 'section3':
                // Reset any section 3 specific states
                const kidSvg = document.getElementById('kidSvg');
                if (kidSvg) {
                    kidSvg.classList.remove('jumping');
                }
                break;
                
            case 'section4':
                // Reset section 4 spinning animation
                const kidSvg4 = document.getElementById('kidSvg');
                if (kidSvg4) {
                    kidSvg4.style.animation = '';
                }
                break;
                
            case 'section5':
                // Reset section 5 final power animation
                const kidSvg5 = document.getElementById('kidSvg');
                if (kidSvg5) {
                    kidSvg5.style.animation = '';
                }
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
        }
    }
    
    // Reset number line animation to initial state
    resetNumberLineAnimation() {
        const numberlineKid = document.getElementById('numberlineKid');
        const speedValue = document.getElementById('speedValue');
        const dataPoints = document.querySelectorAll('.data-point');
        
        if (numberlineKid) {
            // Reset kid position to start
            numberlineKid.style.left = '0%';
            numberlineKid.classList.remove('walking');
            numberlineKid.style.animation = '';
        }
        
        if (speedValue) {
            // Reset speed display
            speedValue.textContent = '0.0 m/s';
            speedValue.style.fontSize = '1.8rem';
            speedValue.style.color = '#ff6b6b';
            speedValue.style.transform = 'scale(1)';
            speedValue.style.textShadow = '0 0 15px rgba(255, 107, 107, 0.5)';
        }
        
        // Hide all data points
        dataPoints.forEach(point => {
            point.classList.remove('visible');
            point.style.animation = '';
        });
        
        // Clear any trail elements
        const trails = document.querySelectorAll('[style*="trailFade"]');
        trails.forEach(trail => trail.remove());
        
        console.log('🔄 Number line animation reset');
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
                
                // Trigger reveal text after 2 seconds when section becomes visible
                if (currentSectionData.state === 'visible' && !this.section1Revealed) {
                    this.section1Revealed = true;
                    const timerId = setTimeout(() => {
                        const revealText = document.querySelector('#section1 .reveal-text');
                        if (revealText && this.currentSection === 1) { // Only if still in section 1
                            revealText.classList.add('visible');
                        }
                    }, 2000);
                    this.addSectionTimer('section1', timerId);
                }
                break;
            case 'section2':
                kidSvg.style.filter = `drop-shadow(0 0 18px rgba(76, 205, 196, ${0.7 + progress * 0.3}))`;
                
                // Trigger number line animation when section becomes visible
                if (currentSectionData.state === 'visible' && !this.section2Animated) {
                    this.section2Animated = true;
                    this.startNumberLineAnimation();
                }
                break;
            case 'section3':
                if (progress > 0.4) kidSvg.classList.add('jumping');
                kidSvg.style.filter = `drop-shadow(0 0 18px rgba(255, 107, 107, ${0.7 + progress * 0.3}))`;
                break;
            case 'section4':
                kidSvg.style.animation = `kidSpin ${2.5 - progress * 0.5}s ease-in-out infinite`;
                kidSvg.style.filter = `drop-shadow(0 0 ${25 + progress * 15}px rgba(150, 206, 180, ${0.8 + progress * 0.2}))`;
                break;
            case 'section5':
                kidSvg.style.animation = 'kidFinalPower 2.5s ease-in-out infinite';
                kidSvg.style.filter = `drop-shadow(0 0 ${30 + progress * 20}px rgba(255, 255, 255, 1))`;
                break;
            case 'finale':
                kidSvg.style.animation = 'kidVictory 2s ease-in-out infinite';
                kidSvg.style.filter = 'drop-shadow(0 0 40px rgba(255, 215, 0, 1))';
                break;
        }
    }
    
    // Enhanced Number Line Animation with real data
    startNumberLineAnimation() {
        const numberlineKid = document.getElementById('numberlineKid');
        const speedValue = document.getElementById('speedValue');
        
        if (!numberlineKid || !speedValue) return;
        
        // Get filtered data points for current age group
        const dataPoints = this.generateDataPoints(this.currentAgeGroup);
        
        if (dataPoints.length === 0) {
            console.log('⚠️ No data points available for animation');
            return;
        }
        
        // Create animation sequence from data
        const speeds = [0, ...dataPoints.map(d => d.speed)];
        const positions = [0, ...dataPoints.map(d => Math.min(Math.max(d.position, 10), 90))];
        let currentStep = 0;
        
        const animateStep = () => {
            // Check if we're still in section 2
            if (this.currentSection !== 2) {
                console.log('🛑 Animation stopped - left section 2');
                return;
            }
            
            if (currentStep >= speeds.length) {
                // Final animation - show completion
                const finalTimerId = setTimeout(() => {
                    if (this.currentSection === 2) { // Only if still in section 2
                        speedValue.style.color = '#4ecdc4';
                        speedValue.style.textShadow = '0 0 20px rgba(76, 205, 196, 0.8)';
                    }
                }, 1000);
                this.addSectionTimer('section2', finalTimerId);
                
                // Show all data points after animation completes
                setTimeout(() => {
                    if (this.currentSection === 2) {
                        this.showAllDataPoints();
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
                if (this.currentSection === 2) { // Only if still in section 2
                    speedValue.textContent = `${speed.toFixed(2)} m/s`;
                    speedValue.style.transform = 'scale(1)';
                    speedValue.style.color = '#ff6b6b';
                }
            }, 200);
            this.addSectionTimer('section2', speedUpdateTimerId);
            
            // Move kid on number line with enhanced animation
            numberlineKid.style.left = `${position}%`;
            numberlineKid.classList.add('walking');
            
            // Add trail effect
            if (currentStep > 0) {
                this.createSpeedTrail(numberlineKid);
            }
            
            // Enhanced walking animation duration
            const walkingTimerId = setTimeout(() => {
                if (this.currentSection === 2) { // Only if still in section 2
                    numberlineKid.classList.remove('walking');
                    // Add a small bounce when stopping
                    numberlineKid.style.animation = 'kidLand 0.3s ease-out';
                    const landTimerId = setTimeout(() => {
                        if (this.currentSection === 2) {
                            numberlineKid.style.animation = '';
                        }
                    }, 300);
                    this.addSectionTimer('section2', landTimerId);
                }
            }, 2500);
            this.addSectionTimer('section2', walkingTimerId);
            
            currentStep++;
            
            // Continue to next step with dynamic timing
            if (currentStep < speeds.length) {
                const nextStepTimerId = setTimeout(animateStep, 3500);
                this.addSectionTimer('section2', nextStepTimerId);
            }
        };
        
        // Initialize data points visualization
        this.updateDataPointsVisualization(this.currentAgeGroup);
        
        // Start animation with a dramatic countdown
        this.showCountdown(() => {
            const startTimerId = setTimeout(animateStep, 500);
            this.addSectionTimer('section2', startTimerId);
        });
    }
    
    // Show all data points with staggered animation
    showAllDataPoints() {
        const dataPointElements = document.querySelectorAll('#dataPointsContainer .data-point');
        
        dataPointElements.forEach((element, index) => {
            const showTimerId = setTimeout(() => {
                if (this.currentSection === 2) {
                    element.classList.add('visible');
                    element.style.animation = 'dataPointAppear 0.8s ease-out, pointShake 0.5s ease-in-out 0.8s';
                }
            }, index * 400);
            this.addSectionTimer('section2', showTimerId);
        });
    }
    
    // Enhanced countdown with timer tracking
    showCountdown(callback) {
        const speedValue = document.getElementById('speedValue');
        if (!speedValue) return callback();
        
        let count = 3;
        const countdownInterval = setInterval(() => {
            // Check if we're still in section 2
            if (this.currentSection !== 2) {
                clearInterval(countdownInterval);
                return;
            }
            
            speedValue.textContent = count.toString();
            speedValue.style.fontSize = '2.5rem';
            speedValue.style.color = '#feca57';
            speedValue.style.transform = 'scale(1.3)';
            
            const scaleTimerId = setTimeout(() => {
                if (this.currentSection === 2) {
                    speedValue.style.transform = 'scale(1)';
                }
            }, 300);
            this.addSectionTimer('section2', scaleTimerId);
            
            count--;
            
            if (count < 0) {
                clearInterval(countdownInterval);
                if (this.currentSection === 2) {
                    speedValue.textContent = 'GO!';
                    speedValue.style.color = '#4ecdc4';
                    const goTimerId = setTimeout(() => {
                        if (this.currentSection === 2) {
                            speedValue.style.fontSize = '1.8rem';
                            callback();
                        }
                    }, 500);
                    this.addSectionTimer('section2', goTimerId);
                }
            }
        }, 800);
        
        this.addSectionInterval('section2', countdownInterval);
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
    
    // EVENT BINDINGS
    bindEvents() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.isSnapping) return;
            
            switch(e.key) {
                case 'ArrowDown':
                case ' ':
                    e.preventDefault();
                    this.navigateToNextSection();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateToPrevSection();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.navigateToSection(0);
                    break;
                case 'End':
                    e.preventDefault();
                    this.navigateToSection(this.sections.length - 1);
                    break;
            }
        });
        
        // Age group filter dropdown
        const ageGroupFilter = document.getElementById('ageGroupFilter');
        if (ageGroupFilter) {
            ageGroupFilter.addEventListener('change', (e) => {
                this.currentAgeGroup = e.target.value;
                this.updateDataPointsVisualization(this.currentAgeGroup);
                console.log(`🔄 Age group filter changed to: ${this.currentAgeGroup}`);
                
                // If we're currently in section 2 and animation has started, restart with new data
                if (this.currentSection === 2 && this.section2Animated) {
                    this.resetNumberLineAnimation();
                    this.section2Animated = false;
                    // Restart animation with new data after a short delay
                    setTimeout(() => {
                        if (this.currentSection === 2) {
                            this.section2Animated = true;
                            this.startNumberLineAnimation();
                        }
                    }, 500);
                }
            });
        }
        
        // Kid interactions
        const kidSvg = document.getElementById('kidSvg');
        if (kidSvg) {
            kidSvg.addEventListener('click', this.onKidClick.bind(this));
        }
        
        // Resize handling
        window.addEventListener('resize', this.debounce(() => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 768;
            
            if (wasMobile !== this.isMobile) {
                this.setupSections();
                this.updateVisualStates();
            }
        }, 250));
        
        // Restart function
        window.restartJourney = () => {
            // Reset all sections before going to hero
            this.resetAllSections();
            this.navigateToSection(0);
        };
    }
    
    onKidClick() {
        if (this.isSnapping) return;
        
        const kidSvg = document.getElementById('kidSvg');
        const animations = ['kidJump', 'kidSpin', 'kidWiggle'];
        const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
        
        kidSvg.style.animation = `${randomAnimation} 0.8s ease-in-out`;
        
        setTimeout(() => {
            this.animateKidForSection();
        }, 800);
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
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
            new GaitVisualization();
        }
    }, 100);
}); 