/**
 * RTL-LTR Controller Content Script - Observer Module
 * Handles DOM mutation observation to detect changes
 */

// Create global observer object
window.rtlObserver = {};

/**
 * Set up mutation observer to detect DOM changes
 */
window.rtlObserver.setupObserver = function() {
    try {
        // If observer already exists, disconnect it first
        if (window.rtlState.observer) {
            window.rtlState.observer.disconnect();
        }
        
        // Define which DOM changes to observe
        const observerConfig = {
            childList: true,
            subtree: true,
            attributes: false
        };
        
        // Create new observer
        window.rtlState.observer = new MutationObserver(window.rtlObserver.handleMutations);
        
        // Start observing
        window.rtlState.observer.observe(document.body, observerConfig);
        
        console.log('RTL-LTR Controller: Mutation observer set up');
    } catch (error) {
        console.error('RTL-LTR Controller: Error setting up observer', error);
    }
};

/**
 * Handle observed mutations
 * @param {MutationRecord[]} mutations - List of observed mutations
 */
window.rtlObserver.handleMutations = function(mutations) {
    try {
        // Skip if no settings are defined
        if (!window.rtlState.domainSettings || 
            !window.rtlState.domainSettings.selectors || 
            Object.keys(window.rtlState.domainSettings.selectors).length === 0) {
            return;
        }
        
        // Check if any mutation affects elements that match our selectors
        let shouldReapply = false;
        
        // First check if any nodes were added
        const addedNodes = [];
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                Array.from(mutation.addedNodes)
                    .filter(node => node.nodeType === Node.ELEMENT_NODE)
                    .forEach(node => addedNodes.push(node));
            }
        });
        
        // Check if any added nodes match our selectors
        if (addedNodes.length > 0) {
            Object.keys(window.rtlState.domainSettings.selectors).forEach(selector => {
                try {
                    for (let i = 0; i < addedNodes.length; i++) {
                        const node = addedNodes[i];
                        // Check if the node itself matches
                        if (node.matches && node.matches(selector)) {
                            shouldReapply = true;
                            break;
                        }
                        // Check if any descendants match
                        if (node.querySelectorAll && node.querySelectorAll(selector).length > 0) {
                            shouldReapply = true;
                            break;
                        }
                    }
                } catch (error) {
                    console.error('RTL-LTR Controller: Error checking selector', selector, error);
                }
            });
        }
        
        // Debounce reapplying settings to avoid excessive processing
        if (shouldReapply) {
            window.rtlObserver.debounceReapply();
        }
    } catch (error) {
        console.error('RTL-LTR Controller: Error handling mutations', error);
    }
};

/**
 * Debounce reapplying settings to prevent excessive processing
 */
window.rtlObserver.debounceReapply = (function() {
    let debounceTimer = null;
    const debounceDelay = 250; // milliseconds
    
    return function() {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        
        debounceTimer = setTimeout(() => {
            // Tell user temporarily we are suppressing notifications during reapply
            window.suppressNotifications = true;
            
            // Reapply settings
            console.log('RTL-LTR Controller: Reapplying settings after DOM changes');
            window.rtlSettings.applyAllSettings();
            
            // Re-enable notifications
            window.suppressNotifications = false;
            
            // Clear the timer
            debounceTimer = null;
        }, debounceDelay);
    };
})();
