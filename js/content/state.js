/**
 * RTL-LTR Controller Content Script - State Module
 * Stores shared state across all modules
 */

// Create global state object
window.rtlState = {
    // Initialization state
    initialized: false,
    initializationAttempts: 0,
    MAX_INITIALIZATION_ATTEMPTS: 5,
    
    // Observer instance for DOM changes
    observer: null,
    
    // Style element reference
    styleElement: null,
    
    // Domain settings storage
    domainSettings: {
        selectors: {}
    },
    
    // Debug configuration
    debug: false,           // Basic debug logging
    verboseDebug: false,    // More detailed debug logging
    
    // Debug flags for specific components
    debugComponents: {
        initialization: false,
        settings: false,
        observer: false,
        ui: false,
        messaging: false
    }
};
