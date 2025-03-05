/**
 * RTL-LTR Controller Content Script - Debug Module
 * Provides debug information and logging functions
 */

// Create global debug object
window.rtlDebug = {
    // Debug configuration
    enabled: false,
    verboseMode: false,
    logToConsole: true
};

/**
 * Initialize debug settings
 * @param {Object} options - Debug configuration options
 */
window.rtlDebug.initialize = function(options) {
    if (options) {
        this.enabled = options.enabled !== undefined ? options.enabled : this.enabled;
        this.verboseMode = options.verboseMode !== undefined ? options.verboseMode : this.verboseMode;
        this.logToConsole = options.logToConsole !== undefined ? options.logToConsole : this.logToConsole;
    }
    
    // Read from rtlState if available (for backward compatibility)
    if (window.rtlState && window.rtlState.debug !== undefined) {
        this.enabled = window.rtlState.debug;
    }
    
    this.log('Debug module initialized', { 
        enabled: this.enabled,
        verboseMode: this.verboseMode,
        logToConsole: this.logToConsole
    });
};

/**
 * Log a message if debug is enabled
 * @param {string} message - The message to log
 * @param {any} [data] - Optional data to log
 */
window.rtlDebug.log = function(message, data) {
    if (!this.enabled || !this.logToConsole) return;
    
    if (data !== undefined) {
        console.log(`RTL-Commander: ${message}`, data);
    } else {
        console.log(`RTL-Commander: ${message}`);
    }
};

/**
 * Log verbose information if debug and verbose mode are enabled
 * @param {string} message - The message to log
 * @param {any} [data] - Optional data to log
 */
window.rtlDebug.verbose = function(message, data) {
    if (!this.enabled || !this.verboseMode || !this.logToConsole) return;
    
    if (data !== undefined) {
        console.log(`RTL-Commander (verbose): ${message}`, data);
    } else {
        console.log(`RTL-Commander (verbose): ${message}`);
    }
};

/**
 * Log an error message (always logged regardless of debug setting)
 * @param {string} message - The error message
 * @param {Error|any} [error] - The error object or data
 */
window.rtlDebug.error = function(message, error) {
    if (!this.logToConsole) return;
    
    if (error !== undefined) {
        console.error(`RTL-Commander ERROR: ${message}`, error);
    } else {
        console.error(`RTL-Commander ERROR: ${message}`);
    }
};

/**
 * Log the state of the RTL-LTR Controller
 */
window.rtlDebug.logState = function() {
    if (!this.enabled || !this.logToConsole) return;
    
    console.group('RTL-Commander Debug Info');
    
    // Check if all the required global objects are defined
    console.log('Global Objects:');
    console.log('- rtlState:', typeof window.rtlState !== 'undefined' ? 'Defined' : 'Not Defined');
    console.log('- rtlSettings:', typeof window.rtlSettings !== 'undefined' ? 'Defined' : 'Not Defined');
    console.log('- rtlUI:', typeof window.rtlUI !== 'undefined' ? 'Defined' : 'Not Defined');
    console.log('- rtlObserver:', typeof window.rtlObserver !== 'undefined' ? 'Defined' : 'Not Defined');
    console.log('- rtlMessaging:', typeof window.rtlMessaging !== 'undefined' ? 'Defined' : 'Not Defined');
    console.log('- rtlInitialization:', typeof window.rtlInitialization !== 'undefined' ? 'Defined' : 'Not Defined');
    
    // Check initialization status
    if (typeof window.rtlState !== 'undefined') {
        console.log('Initialization:');
        console.log('- Initialized:', window.rtlState.initialized ? 'Yes' : 'No');
        console.log('- Attempts:', window.rtlState.initializationAttempts);
        console.log('- Domain Settings:', window.rtlState.domainSettings);
    }
    
    // Check if message handlers are set up
    try {
        const hasListener = !!chrome.runtime.onMessage.hasListeners();
        console.log('Message Handlers:', hasListener ? 'Set up' : 'Not set up');
    } catch (error) {
        console.log('Message Handlers: Error checking', error);
    }
    
    // Log styles
    if (typeof window.rtlState !== 'undefined' && window.rtlState.styleElement) {
        console.log('Styles:');
        console.log('- Style Element:', window.rtlState.styleElement);
        console.log('- Inner HTML:', window.rtlState.styleElement.innerHTML);
    }
    
    // Log elements with RTL/LTR styles
    const rtlElements = document.querySelectorAll('[dir="rtl"]');
    const ltrElements = document.querySelectorAll('[dir="ltr"]');
    console.log('Elements:');
    console.log('- RTL Elements:', rtlElements.length);
    console.log('- LTR Elements:', ltrElements.length);
    
    console.groupEnd();
};

/**
 * Add a shortcut function to the global window object for easier debugging
 */
window.debugRTL = function() {
    window.rtlDebug.logState();
};

// Automatically log debug info after initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => window.rtlDebug.logState(), 2000);
    });
} else {
    setTimeout(() => window.rtlDebug.logState(), 2000);
}
