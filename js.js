// Default configuration (will be overridden by StreamElements fields)
let config = {
    username: 'chiquitai',
    unifiedGoalTitle: 'New Streaming Setup',
    subGoal: 750,
    donationGoal: 2500,
    followerGoal: 5000,
    carouselInterval: 5000, // 5 seconds between carousel slides
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
    document.getElementById('unified-goal-title').textContent = config.unifiedGoalTitle;
    
    // Set goal values
    document.getElementById('sub-goal').textContent = config.subGoal;
    document.getElementById('donation-goal').textContent = config.donationGoal;
    document.getElementById('follower-goal').textContent = config.followerGoal;
    
    // Force update all progress bars
    setTimeout(forceUpdateAllGoals, 500);
}

// Helper function to toggle element visibility
function toggleElementVisibility(elementId, isVisible) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = isVisible ? 'block' : 'none';
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
    
    // Create navigation dots
    createNavDots();
    
    // Start the carousel if we have at least 2 items
    if (carouselItems.length > 1) {
        startCarousel();
    } else if (carouselItems.length === 1) {
        // If only one item, just show it
        activateCarouselItem(0);
    }
}

// Create navigation dots for carousel
function createNavDots() {
    const navContainer = document.getElementById('carousel-nav');
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
}

// Show a specific carousel item
function activateCarouselItem(index) {
    // Hide all items
    document.querySelectorAll('.event-entry').forEach(item => {
        item.classList.remove('active');
    });
    
    // Update nav dots
    document.querySelectorAll('.nav-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
    
    // Show selected item
    const activeItem = document.getElementById(carouselItems[index]);
    if (activeItem) {
        activeItem.classList.add('active');
    }
    
    currentCarouselIndex = index;
}

// Listen for StreamElements events
window.addEventListener('onEventReceived', function (obj) {
    const data = obj.detail.event;
    
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
});

// Update functions
function updateLatestSub(username) {
    const container = document.getElementById('latest-sub-container');
    const value = document.getElementById('latest-sub-value');
    
    value.textContent = username;
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

function updateLatestTip(username, amount) {
    const container = document.getElementById('latest-tip-container');
    const nameEl = document.getElementById('latest-tip-name');
    const amountEl = document.getElementById('latest-tip-amount');
    
    nameEl.textContent = username;
    amountEl.textContent = amount;
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

function updateTopDonator(username, amount) {
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

function updateTopWeeklyDonator(username, amount) {
    if (!username || username === '') {
        username = '--';
    }
    
    if (!amount) {
        amount = 0;
    }
    
    const container = document.getElementById('top-weekly-donator-container');
    const nameEl = document.getElementById('top-weekly-donator-name');
    const amountEl = document.getElementById('top-weekly-donator-amount');
    
    nameEl.textContent = username;
    amountEl.textContent = amount;
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

function updateTopStreamDonator(username, amount) {
    if (!username || username === '') {
        username = '--';
    }
    
    if (!amount) {
        amount = 0;
    }
    
    const container = document.getElementById('top-stream-donator-container');
    const nameEl = document.getElementById('top-stream-donator-name');
    const amountEl = document.getElementById('top-stream-donator-amount');
    
    nameEl.textContent = username;
    amountEl.textContent = amount;
    container.classList.add('new-event');
    
    // If this is the active item, temporarily stop the carousel
    if (carouselItems[currentCarouselIndex] === 'top-stream-donator-container' && carouselInterval) {
        clearInterval(carouselInterval);
        setTimeout(startCarousel, 5000); // Restart after 5 seconds
    } else {
        // If it's not the active item, switch to it
        const index = carouselItems.indexOf('top-stream-donator-container');
        if (index !== -1) {
            activateCarouselItem(index);
        }
    }
    
    setTimeout(() => {
        container.classList.remove('new-event');
    }, 2000);
}

function updateTopAllTimeDonator(username, amount) {
    if (!username || username === '') {
        username = '--';
    }
    
    if (!amount) {
        amount = 0;
    }
    
    const container = document.getElementById('top-alltime-donator-container');
    const nameEl = document.getElementById('top-alltime-donator-name');
    const amountEl = document.getElementById('top-alltime-donator-amount');
    
    nameEl.textContent = username;
    amountEl.textContent = amount;
    container.classList.add('new-event');
    
    // If this is the active item, temporarily stop the carousel
    if (carouselItems[currentCarouselIndex] === 'top-alltime-donator-container' && carouselInterval) {
        clearInterval(carouselInterval);
        setTimeout(startCarousel, 5000); // Restart after 5 seconds
    } else {
        // If it's not the active item, switch to it
        const index = carouselItems.indexOf('top-alltime-donator-container');
        if (index !== -1) {
            activateCarouselItem(index);
        }
    }
    
    setTimeout(() => {
        container.classList.remove('new-event');
    }, 2000);
}

function updateLatestCheer(username, amount) {
    const container = document.getElementById('latest-cheer-container');
    const nameEl = document.getElementById('latest-cheer-name');
    const amountEl = document.getElementById('latest-cheer-amount');
    
    nameEl.textContent = username;
    amountEl.textContent = amount;
    container.classList.add('new-event');
    
    // If this is the active item, temporarily stop the carousel
    if (carouselItems[currentCarouselIndex] === 'latest-cheer-container' && carouselInterval) {
        clearInterval(carouselInterval);
        setTimeout(startCarousel, 5000); // Restart after 5 seconds
    } else {
        // If it's not the active item, switch to it
        const index = carouselItems.indexOf('latest-cheer-container');
        if (index !== -1) {
            activateCarouselItem(index);
        }
    }
    
    setTimeout(() => {
        container.classList.remove('new-event');
    }, 2000);
}

function updateSubCount(count) {
    const currentSubs = document.getElementById('current-subs');
    currentSubs.textContent = count;
    
    // Update progress bar - ensure it's a percentage calculation
    const subGoal = parseInt(document.getElementById('sub-goal').textContent);
    const percentage = Math.min((count / subGoal) * 100, 100);
    document.getElementById('sub-goal-progress').style.width = percentage + '%';
    
    // Log for debugging
    console.log(`Sub update: ${count}/${subGoal} = ${percentage}%`);
}

function updateFollowerCount(count) {
    const currentFollowers = document.getElementById('current-followers');
    currentFollowers.textContent = count;
    
    // Update progress bar - ensure it's a percentage calculation
    const followerGoal = parseInt(document.getElementById('follower-goal').textContent);
    const percentage = Math.min((count / followerGoal) * 100, 100);
    document.getElementById('follower-goal-progress').style.width = percentage + '%';
    
    // Log for debugging
    console.log(`Follower update: ${count}/${followerGoal} = ${percentage}%`);
}

function updateDonationTotal(amount) {
    document.getElementById('current-donations').textContent = amount;
    
    // Update progress bar - ensure it's a percentage calculation
    const donationGoal = parseInt(document.getElementById('donation-goal').textContent);
    const percentage = Math.min((amount / donationGoal) * 100, 100);
    document.getElementById('donation-goal-progress').style.width = percentage + '%';
    
    // Log for debugging
    console.log(`Donation update: ${amount}/${donationGoal} = ${percentage}%`);
}

// Function to force update all goals
function forceUpdateAllGoals() {
    // Get current values
    const currentSubs = parseInt(document.getElementById('current-subs').textContent) || 0;
    const currentDonations = parseInt(document.getElementById('current-donations').textContent) || 0;
    const currentFollowers = parseInt(document.getElementById('current-followers').textContent) || 0;
    
    // Force update all progress bars
    updateSubCount(currentSubs);
    updateDonationTotal(currentDonations);
    updateFollowerCount(currentFollowers);
}

// Optional: Function to check top donator elements for debugging
function checkTopDonatorElements() {
    console.log("Top donator containers:");
    console.log("Monthly:", document.getElementById('top-donator-container'));
    console.log("Weekly:", document.getElementById('top-weekly-donator-container'));
    console.log("Stream:", document.getElementById('top-stream-donator-container'));
    console.log("All-time:", document.getElementById('top-alltime-donator-container'));
}