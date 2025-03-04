/**
 * RTL-LTR Controller Content Script - Initialization Module
 */

import { applyAllSettings } from './settings.js';
import { setupMutationObserver } from './observer.js';
import { state } from './state.js';

/**
 * Initialize the content script
 */
export function initialize() {
    if (state.initialized) return;
    
    console.log('RTL-LTR Controller: Initializing content script');
    
    // Create style element if it doesn't exist
    if (!state.styleElement) {
        state.styleElement = document.createElement('style');
        state.styleElement.id = 'rtl-ltr-controller-styles';
        document.head.appendChild(state.styleElement);
    }
    
    // Load settings for the current domain
    try {
        chrome.storage.local.get(window.location.hostname, (items) => {
            state.domainSettings = items[window.location.hostname];
            if (state.domainSettings && state.domainSettings.selectors) {
                console.log('RTL-LTR Controller: Loaded settings for', window.location.hostname);
                applyAllSettings();
                setupMutationObserver();
                state.initialized = true;
            } else {
                console.log('RTL-LTR Controller: No settings found for', window.location.hostname);
                state.initialized = true;
            }
        });
    } catch (error) {
        console.error('RTL-LTR Controller: Error loading settings', error);
        // If we get an extension context invalidated error, we can't do much
        // The page will need to be refreshed or the extension reloaded
        state.initialized = true; // Prevent further initialization attempts
    }
}

/**
 * Initialize settings with delay and multiple attempts
 */
export function initializeSettings() {
    // First attempt immediate initialization
    initialize();
    
    // Then try again after DOM content loaded
    document.addEventListener('DOMContentLoaded', () => {
        initialize();
    });
    
    // Also try after window load for dynamic content
    window.addEventListener('load', () => {
        initialize();
    });
    
    // Additional attempts with increasing delays
    const delays = [500, 1000, 2000, 5000];
    delays.forEach(delay => {
        setTimeout(() => {
            if (!state.initialized && state.initializationAttempts < state.MAX_INITIALIZATION_ATTEMPTS) {
                console.log(`RTL-LTR Controller: Retry initialization attempt ${state.initializationAttempts + 1}`);
                initialize();
                state.initializationAttempts++;
            }
        }, delay);
    });
}
