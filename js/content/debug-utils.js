/**
 * RTL-LTR Controller Content Script - Debug Utilities
 * Provides utility functions for debugging from the console
 */

// Create global utility object on window
window.rtlUtils = {};

/**
 * Enable or disable debug mode
 * @param {boolean} enable - Whether to enable debug mode
 * @param {boolean} [verbose=false] - Whether to enable verbose logging
 */
window.rtlUtils.setDebugMode = function(enable, verbose) {
    // Update state
    window.rtlState.debug = !!enable;
    window.rtlState.verboseDebug = !!verbose;
    
    // Update debug module
    window.rtlDebug.initialize({
        enabled: window.rtlState.debug,
        verboseMode: window.rtlState.verboseDebug,
        logToConsole: true
    });
    
    console.log(`RTL-Commander: Debug mode ${enable ? 'enabled' : 'disabled'}${verbose ? ' (verbose)' : ''}`);
    
    // Log current state if debug is enabled
    if (enable) {
        window.rtlDebug.logState();
    }
};

/**
 * Enable debug for specific components
 * @param {Object} components - Object with component flags to set
 */
window.rtlUtils.setDebugComponents = function(components) {
    if (!components || typeof components !== 'object') {
        console.error('RTL-Commander: Invalid components object');
        return;
    }
    
    // Update component flags
    Object.keys(components).forEach(key => {
        if (window.rtlState.debugComponents.hasOwnProperty(key)) {
            window.rtlState.debugComponents[key] = !!components[key];
        }
    });
    
    console.log('RTL-Commander: Debug components updated', window.rtlState.debugComponents);
};

/**
 * Get current debug settings
 * @returns {Object} Current debug settings
 */
window.rtlUtils.getDebugSettings = function() {
    return {
        debug: window.rtlState.debug,
        verboseDebug: window.rtlState.verboseDebug,
        components: { ...window.rtlState.debugComponents },
        debugModule: {
            enabled: window.rtlDebug.enabled,
            verboseMode: window.rtlDebug.verboseMode,
            logToConsole: window.rtlDebug.logToConsole
        }
    };
};

// Add help function for developers
window.rtlUtils.help = function() {
    console.group('RTL-Commander Debug Utilities');
    console.log('Available commands:');
    console.log('- rtlUtils.setDebugMode(enable, verbose): Enable/disable debug mode');
    console.log('- rtlUtils.setDebugComponents({ componentName: true/false }): Enable/disable debugging for specific components');
    console.log('- rtlUtils.getDebugSettings(): Get current debug settings');
    console.log('- rtlDebug.logState(): Log the current state of the extension');
    console.log('- debugRTL(): Shorthand for rtlDebug.logState()');
    console.groupEnd();
};

// Log help info when the script is loaded
if (window.rtlState && window.rtlState.debug) {
    console.log('RTL-Commander: Debug utilities loaded. Type rtlUtils.help() for available commands.');
}
