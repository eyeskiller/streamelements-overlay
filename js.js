// Default configuration (will be overridden by StreamElements fields)
let config = {
    username: 'chiquitai',
    unifiedGoalTitle: 'New Streaming Setup',
    subGoal: 750,
    donationGoal: 2500,
    followerGoal: 5000,
    carouselInterval: 5000, // 5 seconds between carousel slides
    refreshInterval: 10000, // 10 seconds refresh interval (added)
    showElements: {
        username: true,
        latestEvents: true,
        goals: true,
        cameraFrame: true,
        latestSub: true,
        latestTip: true,
        topDonator: true,
        latestCheer: true,
        topWeeklyDonator: true,
        topStreamDonator: true,
        topAllTimeDonator: true
    }
};

// Carousel variables
let carouselItems = [];
let currentCarouselIndex = 0;
let carouselInterval;
let refreshInterval; // Added variable for refresh interval

// Track the latest data for forced refreshes
let latestData = {};

// Load data from StreamElements
window.addEventListener('onWidgetLoad', function (obj) {
    // Get custom fields data
    const fieldData = obj.detail.fieldData;
    config = {
        username: fieldData.channelName || config.username,
        unifiedGoalTitle: fieldData.unifiedGoalTitle || config.unifiedGoalTitle,
        subGoal: fieldData.subGoal || config.subGoal,
        donationGoal: fieldData.donationGoal || config.donationGoal,
        followerGoal: fieldData.followerGoal || config.followerGoal,
        carouselInterval: (fieldData.carouselInterval || 5) * 1000, // Convert to milliseconds
        refreshInterval: (fieldData.refreshInterval || 10) * 1000, // Added refresh interval field
        showElements: {
            username: typeof fieldData.showUsername !== 'undefined' ? fieldData.showUsername : config.showElements.username,
            latestEvents: typeof fieldData.showLatestEvents !== 'undefined' ? fieldData.showLatestEvents : config.showElements.latestEvents,
            goals: typeof fieldData.showGoals !== 'undefined' ? fieldData.showGoals : config.showElements.goals,
            cameraFrame: typeof fieldData.showCameraFrame !== 'undefined' ? fieldData.showCameraFrame : config.showElements.cameraFrame,
            latestSub: typeof fieldData.showLatestSub !== 'undefined' ? fieldData.showLatestSub : config.showElements.latestSub,
            latestTip: typeof fieldData.showLatestTip !== 'undefined' ? fieldData.showLatestTip : config.showElements.latestTip,
            topDonator: typeof fieldData.showTopDonator !== 'undefined' ? fieldData.showTopDonator : config.showElements.topDonator,
            latestCheer: typeof fieldData.showLatestCheer !== 'undefined' ? fieldData.showLatestCheer : config.showElements.latestCheer,
            topWeeklyDonator: typeof fieldData.showTopWeeklyDonator !== 'undefined' ? fieldData.showTopWeeklyDonator : config.showElements.topWeeklyDonator,
            topStreamDonator: typeof fieldData.showTopStreamDonator !== 'undefined' ? fieldData.showTopStreamDonator : config.showElements.topStreamDonator,
            topAllTimeDonator: typeof fieldData.showTopAllTimeDonator !== 'undefined' ? fieldData.showTopAllTimeDonator : config.showElements.topAllTimeDonator
        }
    };
    
    // Get session data
    const apiData = obj.detail.session.data;
    
    // Store API data reference for refreshes
    latestData = apiData;
    
    // Debug all available API data
    console.log("Available API data:", apiData);
    
    // Initialize with latest subscriber data
    if (apiData['subscriber-latest']) {
        const latestSub = apiData['subscriber-latest'];
        updateLatestSub(latestSub.name);
    }
    
    // Initialize with latest tip data
    if (apiData['tip-latest']) {
        const latestTip = apiData['tip-latest'];
        updateLatestTip(latestTip.name, latestTip.amount);
    }
    
    // Initialize with top donator data (monthly)
    if (apiData['tip-monthly-top-donation']) {
        const topDonator = apiData['tip-monthly-top-donation'];
        updateTopDonator(topDonator.name, topDonator.amount);
    }
    
    // Initialize with top weekly donator data
    if (apiData['tip-weekly-top-donator']) {
        const topWeeklyDonator = apiData['tip-weekly-top-donator'];
        updateTopWeeklyDonator(topWeeklyDonator.name, topWeeklyDonator.amount);
    }
    
    // Initialize with top stream donator data
    if (apiData['tip-session-top-donator']) {
        const topStreamDonator = apiData['tip-session-top-donator'];
        updateTopStreamDonator(topStreamDonator.name, topStreamDonator.amount);
    }
    
    // Initialize with all-time top donator data
    if (apiData['tip-alltime-top-donation']) {
        const topAllTimeDonator = apiData['tip-alltime-top-donation'];
        updateTopAllTimeDonator(topAllTimeDonator.name, topAllTimeDonator.amount);
    }
    
    // Initialize with latest cheer data
    if (apiData['cheer-latest']) {
        const latestCheer = apiData['cheer-latest'];
        updateLatestCheer(latestCheer.name, latestCheer.amount);
    }
    
    // Initialize with subscriber count
    if (apiData['subscriber-total']) {
        const subCount = apiData['subscriber-total'].count;
        updateSubCount(subCount);
    }
    
    // Initialize with follower count
    if (apiData['follower-total']) {
        const followerCount = apiData['follower-total'].count;
        updateFollowerCount(followerCount);
    }
    
    // Initialize with donation totals
    if (apiData['tip-total']) {
        const donationAmount = apiData['tip-total'].amount;
        updateDonationTotal(donationAmount);
    }
    
    // Initialize the overlay with config settings
    initOverlay();
    
    // Check for missing DOM elements
    checkDOMElements();
    
    // Set up periodic refresh interval (more frequent than before)
    setupRefreshInterval();
});

// Initialize overlay
function initOverlay() {
    // Show/hide elements based on configuration
    toggleElementVisibility('username', config.showElements.username);
    toggleElementVisibility('latest-events', config.showElements.latestEvents);
    toggleElementVisibility('goals', config.showElements.goals);
    toggleElementVisibility('camera-frame', config.showElements.cameraFrame);
    
    // Setup carousel items - only add visible ones
    setupCarousel();
    
    // Set username
    if (document.getElementById('username-text')) {
        document.getElementById('username-text').textContent = config.username;
    }
    
    // Set unified goal title
    const unifiedGoalTitle = document.getElementById('unified-goal-title');
    if (unifiedGoalTitle) {
        unifiedGoalTitle.textContent = config.unifiedGoalTitle;
    }
    
    // Set goal values - added null checks
    const subGoalEl = document.getElementById('sub-goal');
    if (subGoalEl) subGoalEl.textContent = config.subGoal;
    
    const donationGoalEl = document.getElementById('donation-goal');
    if (donationGoalEl) donationGoalEl.textContent = config.donationGoal;
    
    const followerGoalEl = document.getElementById('follower-goal');
    if (followerGoalEl) followerGoalEl.textContent = config.followerGoal;
    
    // Force update all progress bars
    setTimeout(forceUpdateAllGoals, 500);
}

// Setup refresh interval (new function)
function setupRefreshInterval() {
    // Clear any existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Set up new refresh interval
    refreshInterval = setInterval(() => {
        console.log("Performing periodic refresh...");
        forceUpdateAllGoals();
        
        // Also refresh latest events from stored data
        refreshLatestEvents();
    }, config.refreshInterval);
}

// Refresh latest events from stored data (new function)
function refreshLatestEvents() {
    try {
        // Only refresh if we have data
        if (Object.keys(latestData).length === 0) {
            console.warn("No latest data available for refresh");
            return;
        }
        
        console.log("Refreshing latest events from stored data:", latestData);
        
        // Refresh latest sub
        if (latestData['subscriber-latest']) {
            const latestSub = latestData['subscriber-latest'];
            updateLatestSub(latestSub.name, false); // false = don't animate
        }
        
        // Refresh latest tip
        if (latestData['tip-latest']) {
            const latestTip = latestData['tip-latest'];
            updateLatestTip(latestTip.name, latestTip.amount, false);
        }
        
        // Refresh top donator (monthly)
        if (latestData['tip-monthly-top-donation']) {
            const topDonator = latestData['tip-monthly-top-donation'];
            updateTopDonator(topDonator.name, topDonator.amount, false);
        }
        
        // Refresh all other data similarly
        // ... (repeat for other data types)
        
    } catch (e) {
        console.error("Error refreshing latest events:", e);
    }
}

// Helper function to toggle element visibility
function toggleElementVisibility(elementId, isVisible) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = isVisible ? 'block' : 'none';
    } else {
        console.warn(`Element with ID ${elementId} not found`);
    }
}

// Setup carousel
function setupCarousel() {
    carouselItems = [];
    
    // Add items to carousel if they're enabled
    if (config.showElements.latestSub) {
        carouselItems.push('latest-sub-container');
    }
    
    if (config.showElements.latestTip) {
        carouselItems.push('latest-tip-container');
    }
    
    if (config.showElements.topDonator) {
        carouselItems.push('top-donator-container');
    }
    
    if (config.showElements.latestCheer) {
        carouselItems.push('latest-cheer-container');
    }
    
    if (config.showElements.topWeeklyDonator) {
        carouselItems.push('top-weekly-donator-container');
    }
    
    if (config.showElements.topStreamDonator) {
        carouselItems.push('top-stream-donator-container');
    }
    
    if (config.showElements.topAllTimeDonator) {
        carouselItems.push('top-alltime-donator-container');
    }
    
    // Debug carousel items
    console.log("Carousel items:", carouselItems);
    
    // Create navigation dots
    createNavDots();
    
    // Start the carousel if we have at least 2 items
    if (carouselItems.length > 1) {
        startCarousel();
    } else if (carouselItems.length === 1) {
        // If only one item, just show it
        activateCarouselItem(0);
    } else {
        console.warn("No carousel items to display");
    }
}

// Create navigation dots for carousel
function createNavDots() {
    const navContainer = document.getElementById('carousel-nav');
    if (!navContainer) {
        console.error("Carousel nav container not found");
        return;
    }
    
    navContainer.innerHTML = '';
    
    // Create a dot for each carousel item
    for (let i = 0; i < carouselItems.length; i++) {
        const dot = document.createElement('div');
        dot.className = 'nav-dot';
        dot.setAttribute('data-index', i);
        navContainer.appendChild(dot);
    }
}

// Start carousel rotation
function startCarousel() {
    // Show first item
    activateCarouselItem(0);
    
    // Clear any existing interval
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }
    
    // Set up interval to rotate items
    carouselInterval = setInterval(() => {
        currentCarouselIndex = (currentCarouselIndex + 1) % carouselItems.length;
        activateCarouselItem(currentCarouselIndex);
    }, config.carouselInterval);
    
    console.log(`Carousel started with ${carouselItems.length} items, rotating every ${config.carouselInterval/1000} seconds`);
}

// Show a specific carousel item
function activateCarouselItem(index) {
    try {
        // Hide all items
        document.querySelectorAll('.event-entry').forEach(item => {
            item.classList.remove('active');
        });
        
        // Update nav dots
        document.querySelectorAll('.nav-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        
        // Show selected item
        const activeItemId = carouselItems[index];
        const activeItem = document.getElementById(activeItemId);
        if (activeItem) {
            activeItem.classList.add('active');
            console.log(`Activated carousel item: ${activeItemId}`);
        } else {
            console.error(`Carousel item not found: ${activeItemId}`);
        }
        
        currentCarouselIndex = index;
    } catch (e) {
        console.error("Error activating carousel item:", e);
    }
}

// Listen for StreamElements events
window.addEventListener('onEventReceived', function (obj) {
    console.log("Event received:", obj);
    
    try {
        const data = obj.detail.event;
        
        // Update our stored latest data
        if (data && data.type) {
            // Store the data for future refreshes
            switch (data.type) {
                case 'subscriber-latest':
                    latestData['subscriber-latest'] = data;
                    break;
                case 'tip-latest':
                    latestData['tip-latest'] = data;
                    break;
                case 'tip-monthly-top-donation':
                    latestData['tip-monthly-top-donation'] = data;
                    break;
                // Add other cases as needed
                default:
                    // For other event types, store by type
                    latestData[data.type] = data;
                    break;
            }
        }
        
        // Handle new subscriber
        if (data.type === 'subscriber-latest') {
            updateLatestSub(data.name);
        }
        
        // Handle new tip/donation
        if (data.type === 'tip-latest') {
            updateLatestTip(data.name, data.amount);
        }
        
        // Handle top donator update (monthly)
        if (data.type === 'tip-monthly-top-donation') {
            updateTopDonator(data.name, data.amount);
        }
        
        // Handle top weekly donator update
        if (data.type === 'tip-weekly-top-donator') {
            updateTopWeeklyDonator(data.name, data.amount);
        }
        
        // Handle top stream donator update
        if (data.type === 'tip-session-top-donator') {
            updateTopStreamDonator(data.name, data.amount);
        }
        
        // Handle all-time top donator update
        if (data.type === 'tip-alltime-top-donation') {
            updateTopAllTimeDonator(data.name, data.amount);
        }
        
        // Handle new cheer
        if (data.type === 'cheer-latest') {
            updateLatestCheer(data.name, data.amount);
        }
        
        // Handle subscriber count update
        if (data.type === 'subscriber-total') {
            updateSubCount(data.count);
        }
        
        // Handle follower count update
        if (data.type === 'follower-total') {
            updateFollowerCount(data.count);
        }
        
        // Handle donation total update
        if (data.type === 'tip-total') {
            updateDonationTotal(data.amount);
        }
    } catch (e) {
        console.error("Error processing event:", e);
    }
});

// Update functions - modified to accept 'animate' parameter
function updateLatestSub(username, animate = true) {
    const container = document.getElementById('latest-sub-container');
    const value = document.getElementById('latest-sub-value');
    
    if (!container || !value) {
        console.error("Latest sub elements not found");
        return;
    }
    
    value.textContent = username;
    
    if (animate) {
        container.classList.add('new-event');
        
        // If this is the active item, temporarily stop the carousel
        if (carouselItems[currentCarouselIndex] === 'latest-sub-container' && carouselInterval) {
            clearInterval(carouselInterval);
            setTimeout(startCarousel, 5000); // Restart after 5 seconds
        } else {
            // If it's not the active item, switch to it
            const index = carouselItems.indexOf('latest-sub-container');
            if (index !== -1) {
                activateCarouselItem(index);
            }
        }
        
        setTimeout(() => {
            container.classList.remove('new-event');
        }, 2000);
    }
}

function updateLatestTip(username, amount, animate = true) {
    const container = document.getElementById('latest-tip-container');
    const nameEl = document.getElementById('latest-tip-name');
    const amountEl = document.getElementById('latest-tip-amount');
    
    if (!container || !nameEl || !amountEl) {
        console.error("Latest tip elements not found");
        return;
    }
    
    nameEl.textContent = username;
    amountEl.textContent = amount;
    
    if (animate) {
        container.classList.add('new-event');
        
        // If this is the active item, temporarily stop the carousel
        if (carouselItems[currentCarouselIndex] === 'latest-tip-container' && carouselInterval) {
            clearInterval(carouselInterval);
            setTimeout(startCarousel, 5000); // Restart after 5 seconds
        } else {
            // If it's not the active item, switch to it
            const index = carouselItems.indexOf('latest-tip-container');
            if (index !== -1) {
                activateCarouselItem(index);
            }
        }
        
        setTimeout(() => {
            container.classList.remove('new-event');
        }, 2000);
    }
}

function updateTopDonator(username, amount, animate = true) {
    console.log("Updating top donator with:", username, amount);
    
    if (!username || username === '') {
        username = '--';
    }
    
    if (!amount) {
        amount = 0;
    }
    
    const container = document.getElementById('top-donator-container');
    const nameEl = document.getElementById('top-donator-name');
    const amountEl = document.getElementById('top-donator-amount');
    
    if (!container || !nameEl || !amountEl) {
        console.error("Top donator DOM elements not found!");
        return;
    }
    
    nameEl.textContent = username;
    amountEl.textContent = amount;
    
    if (animate) {
        container.classList.add('new-event');
        
        // If this is the active item, temporarily stop the carousel
        if (carouselItems[currentCarouselIndex] === 'top-donator-container' && carouselInterval) {
            clearInterval(carouselInterval);
            setTimeout(startCarousel, 5000); // Restart after 5 seconds
        } else {
            // If it's not the active item, switch to it
            const index = carouselItems.indexOf('top-donator-container');
            if (index !== -1) {
                activateCarouselItem(index);
            }
        }
        
        setTimeout(() => {
            container.classList.remove('new-event');
        }, 2000);
    }
}

// Similar modifications for other update functions...
// The following functions would need the same animate parameter added

function updateTopWeeklyDonator(username, amount, animate = true) {
    // Same pattern as updateTopDonator
    if (!username || username === '') {
        username = '--';
    }
    
    if (!amount) {
        amount = 0;
    }
    
    const container = document.getElementById('top-weekly-donator-container');
    const nameEl = document.getElementById('top-weekly-donator-name');
    const amountEl = document.getElementById('top-weekly-donator-amount');
    
    if (!container || !nameEl || !amountEl) {
        console.error("Top weekly donator elements not found");
        return;
    }
    
    nameEl.textContent = username;
    amountEl.textContent = amount;
    
    if (animate) {
        container.classList.add('new-event');
        
        // If this is the active item, temporarily stop the carousel
        if (carouselItems[currentCarouselIndex] === 'top-weekly-donator-container' && carouselInterval) {
            clearInterval(carouselInterval);
            setTimeout(startCarousel, 5000); // Restart after 5 seconds
        } else {
            // If it's not the active item, switch to it
            const index = carouselItems.indexOf('top-weekly-donator-container');
            if (index !== -1) {
                activateCarouselItem(index);
            }
        }
        
        setTimeout(() => {
            container.classList.remove('new-event');
        }, 2000);
    }
}

function updateTopStreamDonator(username, amount, animate = true) {
    // Same pattern as other update functions
    if (!username || username === '') {
        username = '--';
    }
    
    if (!amount) {
        amount = 0;
    }
    
    const container = document.getElementById('top-stream-donator-container');
    const nameEl = document.getElementById('top-stream-donator-name');
    const amountEl = document.getElementById('top-stream-donator-amount');
    
    if (!container || !nameEl || !amountEl) {
        console.error("Top stream donator elements not found");
        return;
    }
    
    nameEl.textContent = username;
    amountEl.textContent = amount;
    
    if (animate) {
        container.classList.add('new-event');
        
        // Animation and carousel handling
        if (carouselItems[currentCarouselIndex] === 'top-stream-donator-container' && carouselInterval) {
            clearInterval(carouselInterval);
            setTimeout(startCarousel, 5000);
        } else {
            const index = carouselItems.indexOf('top-stream-donator-container');
            if (index !== -1) {
                activateCarouselItem(index);
            }
        }
        
        setTimeout(() => {
            container.classList.remove('new-event');
        }, 2000);
    }
}

function updateTopAllTimeDonator(username, amount, animate = true) {
    // Same pattern as other update functions
    if (!username || username === '') {
        username = '--';
    }
    
    if (!amount) {
        amount = 0;
    }
    
    const container = document.getElementById('top-alltime-donator-container');
    const nameEl = document.getElementById('top-alltime-donator-name');
    const amountEl = document.getElementById('top-alltime-donator-amount');
    
    if (!container || !nameEl || !amountEl) {
        console.error("Top all-time donator elements not found");
        return;
    }
    
    nameEl.textContent = username;
    amountEl.textContent = amount;
    
    if (animate) {
        container.classList.add('new-event');
        
        // Animation and carousel handling
        if (carouselItems[currentCarouselIndex] === 'top-alltime-donator-container' && carouselInterval) {
            clearInterval(carouselInterval);
            setTimeout(startCarousel, 5000);
        } else {
            const index = carouselItems.indexOf('top-alltime-donator-container');
            if (index !== -1) {
                activateCarouselItem(index);
            }
        }
        
        setTimeout(() => {
            container.classList.remove('new-event');
        }, 2000);
    }
}

function updateLatestCheer(username, amount, animate = true) {
    // Same pattern as other update functions
    const container = document.getElementById('latest-cheer-container');
    const nameEl = document.getElementById('latest-cheer-name');
    const amountEl = document.getElementById('latest-cheer-amount');
    
    if (!container || !nameEl || !amountEl) {
        console.error("Latest cheer elements not found");
        return;
    }
    
    nameEl.textContent = username;
    amountEl.textContent = amount;
    
    if (animate) {
        container.classList.add('new-event');
        
        // Animation and carousel handling
        if (carouselItems[currentCarouselIndex] === 'latest-cheer-container' && carouselInterval) {
            clearInterval(carouselInterval);
            setTimeout(startCarousel, 5000);
        } else {
            const index = carouselItems.indexOf('latest-cheer-container');
            if (index !== -1) {
                activateCarouselItem(index);
            }
        }
        
        setTimeout(() => {
            container.classList.remove('new-event');
        }, 2000);
    }
}

function updateSubCount(count) {
    const currentSubs = document.getElementById('current-subs');
    if (!currentSubs) {
        console.error("Current subs element not found");
        return;
    }
    
    currentSubs.textContent = count;
    
    // Update progress bar - ensure it's a percentage calculation
    const subGoalEl = document.getElementById('sub-goal');
    const subGoalProgressEl = document.getElementById('sub-goal-progress');
    
    if (!subGoalEl || !subGoalProgressEl) {
        console.error("Sub goal elements not found");
        return;
    }
    
    const subGoal = parseInt(subGoalEl.textContent);
    const percentage = Math.min((count / subGoal) * 100, 100);
    subGoalProgressEl.style.width = percentage + '%';
    
    // Log for debugging
    console.log(`Sub update: ${count}/${subGoal} = ${percentage}%`);
}

function updateFollowerCount(count) {
    const currentFollowers = document.getElementById('current-followers');
    if (!currentFollowers) {
        console.error("Current followers element not found");
        return;
    }
    
    currentFollowers.textContent = count;
    
    // Update progress bar - ensure it's a percentage calculation
    const followerGoalEl = document.getElementById('follower-goal');
    const followerGoalProgressEl = document.getElementById('follower-goal-progress');
    
    if (!followerGoalEl || !followerGoalProgressEl) {
        console.error("Follower goal elements not found");
        return;
    }
    
    const followerGoal = parseInt(followerGoalEl.textContent);
    const percentage = Math.min((count / followerGoal) * 100, 100);
    followerGoalProgressEl.style.width = percentage + '%';
    
    // Log for debugging
    console.log(`Follower update: ${count}/${followerGoal} = ${percentage}%`);
}

function updateDonationTotal(amount) {
    const currentDonations = document.getElementById('current-donations');
    if (!currentDonations) {
        console.error("Current donations element not found");
        return;
    }
    
    currentDonations.textContent = amount;
    
    // Update progress bar - ensure it's a percentage calculation
    const donationGoalEl = document.getElementById('donation-goal');
    const donationGoalProgressEl = document.getElementById('donation-goal-progress');
    
    if (!donationGoalEl || !donationGoalProgressEl) {
        console.error("Donation goal elements not found");
        return;
    }
    
    const donationGoal = parseInt(donationGoalEl.textContent);
    const percentage = Math.min((amount / donationGoal) * 100, 100);
    donationGoalProgressEl.style.width = percentage + '%';
    
    // Log for debugging
    console.log(`Donation update: ${amount}/${donationGoal} = ${percentage}%`);
}

// Function to force update all goals
function forceUpdateAllGoals() {
    try {
        console.log("Forcing update of all goals...");
        
        // Get current values with proper error handling
        let currentSubs = 0;
        let currentDonations = 0;
        let currentFollowers = 0;
        
        const currentSubsEl = document.getElementById('current-subs');
        if (currentSubsEl) {
            currentSubs = parseInt(currentSubsEl.textContent) || 0;
        }
        
        const currentDonationsEl = document.getElementById('current-donations');
        if (currentDonationsEl) {
            currentDonations = parseFloat(currentDonationsEl.textContent) || 0;
        }
        
        const currentFollowersEl = document.getElementById('current-followers');
        if (currentFollowersEl) {
            currentFollowers = parseInt(currentFollowersEl.textContent) || 0;
        }
        
        // Force update all progress bars
        updateSubCount(currentSubs);
        updateDonationTotal(currentDonations);
        updateFollowerCount(currentFollowers);
        
        console.log("All goals updated successfully");
    } catch (e) {
        console.error("Error during force update of goals:", e);
    }
}

// Optional: Function to check top donator elements for debugging
function checkDOMElements() {
    console.log("Checking DOM elements:");
    
    // Check main containers
    console.log("Main containers:");
    console.log("Username:", document.getElementById('username'));
    console.log("Latest events:", document.getElementById('latest-events'));
    console.log("Goals:", document.getElementById('goals'));
    console.log("Camera frame:", document.getElementById('camera-frame'));
    
    // Check carousel items
    console.log("Carousel items:");
    console.log("Latest sub:", document.getElementById('latest-sub-container'));
    console.log("Latest tip:", document.getElementById('latest-tip-container'));
    console.log("Latest cheer:", document.getElementById('latest-cheer-container'));
    
    // Check top donator containers
    console.log("Top donator containers:");
    console.log("Monthly:", document.getElementById('top-donator-container'));
    console.log("Weekly:", document.getElementById('top-weekly-donator-container'));
    console.log("Stream:", document.getElementById('top-stream-donator-container'));
    console.log("All-time:", document.getElementById('top-alltime-donator-container'));
    
    // Check goal elements
    console.log("Goal elements:");
    console.log("Sub goal:", document.getElementById('sub-goal'));
    console.log("Current subs:", document.getElementById('current-subs'));
    console.log("Sub progress:", document.getElementById('sub-goal-progress'));
    
    console.log("Donation goal:", document.getElementById('donation-goal'));
    console.log("Current donations:", document.getElementById('current-donations'));
    console.log("Donation progress:", document.getElementById('donation-goal-progress'));
    
    console.log("Follower goal:", document.getElementById('follower-goal'));
    console.log("Current followers:", document.getElementById('current-followers'));
    console.log("Follower progress:", document.getElementById('follower-goal-progress'));
    
    // Return a summary of missing elements
    const missingElements = [];
    
    ['username', 'latest-events', 'goals', 'camera-frame',
     'latest-sub-container', 'latest-tip-container', 'latest-cheer-container',
     'top-donator-container', 'top-weekly-donator-container', 'top-stream-donator-container', 'top-alltime-donator-container',
     'sub-goal', 'current-subs', 'sub-goal-progress',
     'donation-goal', 'current-donations', 'donation-goal-progress',
     'follower-goal', 'current-followers', 'follower-goal-progress'
    ].forEach(id => {
        if (!document.getElementById(id)) {
            missingElements.push(id);
        }
    });
    
    if (missingElements.length > 0) {
        console.warn("Missing elements:", missingElements);
    } else {
        console.log("All required elements are present");
    }
}
