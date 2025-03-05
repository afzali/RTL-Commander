/**
 * RTL-LTR Controller Content Script - Debug Module
 * Provides debug information and logging functions
 */

// Create global debug object
window.rtlDebug = {};

/**
 * Log the state of the RTL-LTR Controller
 */
window.rtlDebug.logState = function() {
    console.group('RTL-LTR Controller Debug Info');
    
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

// Add a shortcut function to the global window object for easier debugging
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
