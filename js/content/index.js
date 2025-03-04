/**
 * RTL-LTR Controller Content Script - Main Entry Point
 */

import { initialize, initializeSettings } from './initialization.js';
import { setupMessageHandlers } from './messaging.js';

// Initialize the content script
initializeSettings();

// Set up message handlers
setupMessageHandlers();

// Add event listeners for SPA navigation
window.addEventListener('popstate', initializeSettings);
window.addEventListener('hashchange', initializeSettings);

// Add error handling for extension context invalidation
try {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "extensionContextInvalidated") {
            console.error("Extension context invalidated. Please refresh the page.");
            // Handle extension context invalidation
        }
    });
} catch (error) {
    console.error("Error handling extension context invalidation:", error);
}
