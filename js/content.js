/**
 * RTL-LTR Controller Content Script
 * Main entry point and backward compatibility
 * 
 * This script serves as a compatibility layer for older code that might
 * reference functions directly on the window.rtlCommander object.
 */

// Ensure that new code is loaded first through manifest
// This file provides backward compatibility

// Create global rtlCommander object for backward compatibility
// Expose key functions for older code that might still reference them
window.rtlCommander = {
    // UI functions
    getCssSelector: function(element) {
        return window.rtlUI.getCssSelector(element);
    },
    
    showAdvancedPanel: function(element) {
        window.rtlUI.showAdvancedPanel(element);
    },
    
    closeAdvancedPanel: function() {
        window.rtlUI.closeAdvancedPanel();
    },
    
    toggleWholePage: function() {
        window.rtlUI.toggleWholePage();
    },
    
    toggleVazirFont: function() {
        window.rtlUI.toggleVazirFont();
    },
    
    showNotification: function(message) {
        window.rtlUI.showNotification(message);
    },
    
    // Settings functions
    applyAllSettings: function() {
        window.rtlSettings.applyAllSettings();
    },
    
    updateSettings: function(selector, direction, customCSS) {
        window.rtlSettings.updateSettings(selector, direction, customCSS);
    },
    
    removeDirection: function(selector) {
        window.rtlSettings.removeDirection(selector);
    },
    
    clearAllSettings: function() {
        window.rtlSettings.clearAllSettings();
    }
};

// Store the last clicked element
document.addEventListener('contextmenu', function(event) {
    window.lastClickedElement = event.target;
});

// Make sure we initialize if this script is loaded after page load
if (document.readyState !== 'loading') {
    console.log('RTL-LTR Controller: content.js loaded, ensuring initialization');
    
    if (typeof window.rtlInitialization !== 'undefined' && 
        typeof window.rtlInitialization.initialize === 'function' &&
        !window.rtlState.initialized) {
        window.rtlInitialization.initialize();
    }
}

// For debugging
console.log('RTL-LTR Controller: content.js loaded');
