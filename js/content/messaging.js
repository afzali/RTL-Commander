/**
 * RTL-LTR Controller Content Script - Messaging Module
 * Handles communication with popup and background script
 */

import { 
    toggleDirection, 
    updateSettings, 
    removeDirection, 
    clearAllSettings 
} from './settings.js';

/**
 * Setup message handlers for communication with popup and background script
 */
export function setupMessageHandlers() {
    try {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            try {
                console.log('RTL-LTR Controller: Received message', message);
                
                switch (message.action) {
                    case 'toggleDirection':
                        toggleDirection(message.selector, message.enabled);
                        sendResponse({ success: true });
                        break;
                        
                    case 'updateSettings':
                        updateSettings(message.selector, message.direction, message.customCSS);
                        sendResponse({ success: true });
                        break;
                        
                    case 'removeDirection':
                        removeDirection(message.selector);
                        sendResponse({ success: true });
                        break;
                        
                    case 'settingsCleared':
                        clearAllSettings();
                        sendResponse({ success: true });
                        break;
                        
                    case 'showAdvancedToggle':
                        showAdvancedToggle();
                        sendResponse({ success: true });
                        break;
                        
                    default:
                        sendResponse({ success: false, error: 'Unknown action' });
                }
            } catch (error) {
                console.error('RTL-LTR Controller: Error handling message', error);
                sendResponse({ success: false, error: error.message });
            }
            
            return true; // Keep the message channel open for async response
        });
    } catch (error) {
        console.error('RTL-LTR Controller: Error setting up message handlers', error);
    }
}

/**
 * Show advanced toggle dialog
 */
function showAdvancedToggle() {
    // Implementation of advanced toggle dialog
    console.log('RTL-LTR Controller: Showing advanced toggle dialog');
    // This function would be implemented elsewhere
}
