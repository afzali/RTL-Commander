/**
 * RTL-LTR Controller Content Script - Initialization Module
 * Handles initial setup and loading of saved settings
 */

// Create global initialization object
window.rtlInitialization = {};

/**
 * Initialize extension on the page
 */
window.rtlInitialization.initialize = function() {
    try {
        // Initialize debug settings first
        window.rtlDebug.initialize({
            enabled: window.rtlState.debug || false,
            verboseMode: window.rtlState.verboseDebug || false,
            logToConsole: true
        });
        
        // Skip initialization if already done
        if (window.rtlState.initialized) {
            window.rtlDebug.log('Already initialized');
            return;
        }
        
        // Increase attempt count
        window.rtlState.initializationAttempts++;
        window.rtlDebug.log(`Initializing (attempt ${window.rtlState.initializationAttempts})`);
        
        // Set up message handlers
        window.rtlMessaging.setupMessageHandlers();
        
        // Create style element for CSS rules
        if (!window.rtlState.styleElement) {
            window.rtlState.styleElement = document.createElement('style');
            window.rtlState.styleElement.id = 'rtl-ltr-global-styles';
            window.rtlState.styleElement.type = 'text/css';
            document.head.appendChild(window.rtlState.styleElement);
        }
        
        // Load saved settings
        window.rtlInitialization.loadSavedSettings(() => {
            // Set up observer after settings are loaded
            window.rtlObserver.setupObserver();
            
            // Mark initialization as complete
            window.rtlState.initialized = true;
            window.rtlDebug.log('Initialization complete');
            
            // Apply all settings to page
            window.rtlSettings.applyAllSettings();
        });

        // Set up SPA navigation detection
        window.rtlInitialization.setupNavigationHandlers();
    } catch (error) {
        window.rtlDebug.error('Error during initialization', error);
    }
};

/**
 * Set up handlers for SPA navigation 
 */
window.rtlInitialization.setupNavigationHandlers = function() {
    // Handle history API changes (SPA navigation)
    window.addEventListener('popstate', window.rtlInitialization.handleNavigation);
    window.addEventListener('pushstate', window.rtlInitialization.handleNavigation);
    window.addEventListener('replacestate', window.rtlInitialization.handleNavigation);
    window.addEventListener('hashchange', window.rtlInitialization.handleNavigation);
    
    // Monitor potential navigation events
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    // Override pushState
    history.pushState = function() {
        originalPushState.apply(this, arguments);
        window.dispatchEvent(new Event('pushstate'));
    };
    
    // Override replaceState
    history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        window.dispatchEvent(new Event('replacestate'));
    };
    
    window.rtlDebug.log('Navigation handlers set up');
};

/**
 * Handle navigation events in SPAs
 */
window.rtlInitialization.handleNavigation = function() {
    window.rtlDebug.log('Navigation detected, reapplying settings');
    
    // Wait a bit for the DOM to update
    setTimeout(() => {
        // Reapply settings
        window.rtlSettings.applyAllSettings();
    }, 500);
};

/**
 * Load saved settings from chrome.storage.local
 * @param {function} callback - Function to call after settings are loaded
 */
window.rtlInitialization.loadSavedSettings = function(callback) {
    try {
        const domain = window.rtlSettings.getCurrentDomain();
        
        chrome.storage.local.get(domain, result => {
            if (chrome.runtime.lastError) {
                window.rtlDebug.error('Error loading settings', chrome.runtime.lastError);
                if (callback) callback();
                return;
            }
            
            // Process loaded settings
            if (result && result[domain]) {
                window.rtlState.domainSettings = result[domain];
                window.rtlDebug.log('Loaded settings for domain', domain, window.rtlState.domainSettings);
            } else {
                // Create empty settings object if none exists
                window.rtlState.domainSettings = { selectors: {} };
                window.rtlDebug.log('No settings found for domain', domain);
            }
            
            if (callback) callback();
        });
    } catch (error) {
        window.rtlDebug.error('Error loading saved settings', error);
        if (callback) callback();
    }
};

/**
 * Initialize with a delay to ensure page is fully loaded
 */
window.rtlInitialization.initializeWithDelay = function() {
    setTimeout(window.rtlInitialization.initialize, 500);
};

// Initialize when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.rtlInitialization.initializeWithDelay);
} else {
    window.rtlInitialization.initializeWithDelay();
}
