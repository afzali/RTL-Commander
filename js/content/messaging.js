/**
 * RTL-LTR Controller Content Script - Messaging Module
 * Handles communication with the background script
 */

// Create global messaging object
window.rtlMessaging = {};

/**
 * Set up message handling for the content script
 */
window.rtlMessaging.setupMessageHandlers = function() {
    try {
        // Remove any existing listeners first to prevent duplicates
        chrome.runtime.onMessage.removeListener(window.rtlMessaging.handleMessage);
        
        // Add message listener
        chrome.runtime.onMessage.addListener(window.rtlMessaging.handleMessage);
        
        console.log('RTL-LTR Controller: Message handlers set up');
    } catch (error) {
        console.error('RTL-LTR Controller: Error setting up message handlers', error);
    }
};

/**
 * Handle messages from the background script
 * @param {object} message - Message from background script
 * @param {object} sender - Sender information
 * @param {function} sendResponse - Function to send a response
 * @returns {boolean} Whether to keep the message channel open
 */
window.rtlMessaging.handleMessage = function(message, sender, sendResponse) {
    try {
        console.log('RTL-LTR Controller: Received message', message);
        
        if (!message || !message.action) {
            console.error('RTL-LTR Controller: Invalid message received', message);
            sendResponse({ success: false, error: 'Invalid message' });
            return false;
        }
        
        // Define response object
        let response = { success: true };
        
        // Handle different actions
        switch (message.action) {
            case 'toggleWholePage':
                window.rtlUI.toggleWholePage();
                break;
                
            case 'toggleDirection':
                // Toggle clicked element
                if (window.rtlState.lastRightClickedElement) {
                    const selector = window.rtlUI.getCssSelector(window.rtlState.lastRightClickedElement);
                    if (selector) {
                        window.rtlSettings.toggleDirection(selector);
                    } else {
                        response = { success: false, error: 'Could not generate selector for element' };
                    }
                } else {
                    response = { success: false, error: 'No element was right-clicked' };
                }
                break;
                
            case 'showAdvancedToggle':
                // Show advanced panel for clicked element
                if (window.rtlState.lastRightClickedElement) {
                    window.rtlUI.showAdvancedPanel(window.rtlState.lastRightClickedElement);
                } else {
                    response = { success: false, error: 'No element was right-clicked' };
                }
                break;
                
            case 'addVazirFont':
                // Add Vazir font for better RTL text display
                window.rtlUI.toggleVazirFont();
                break;
                
            case 'confirmClearSettings':
                // Show confirmation for clearing settings
                window.rtlSettings.clearAllSettings();
                break;
                
            case 'settingsCleared':
                // Notification for settings being cleared
                window.rtlUI.showNotification('Settings cleared');
                window.rtlSettings.cleanupStyles();
                break;
                
            case 'updateSettings':
                // Handle settings update from popup
                if (message.selector) {
                    console.log('RTL-LTR Controller: Updating settings for', message.selector);
                    window.rtlSettings.updateSettings(
                        message.selector, 
                        message.direction, 
                        message.customCSS || '',
                        message.enabled
                    );
                } else {
                    response = { success: false, error: 'No selector provided for update' };
                }
                break;
                
            case 'removeDirection':
                // Handle direction removal from popup
                if (message.selector) {
                    console.log('RTL-LTR Controller: Removing direction for', message.selector);
                    window.rtlSettings.removeDirection(message.selector);
                } else {
                    response = { success: false, error: 'No selector provided for removal' };
                }
                break;
                
            case 'reapplySettings':
                console.log('RTL-LTR Controller: Reapplying all settings');
                
                // Clear all existing styles first to ensure clean slate
                document.querySelectorAll('style[data-rtl-extension="true"]').forEach(style => {
                    style.remove();
                });
                
                // Reapply all settings
                window.rtlSettings.applyAllSettings();
                
                // Send success response
                response = { success: true };
                break;
                
            default:
                console.warn('RTL-LTR Controller: Unknown action received', message.action);
                response = { success: false, error: 'Unknown action' };
        }
        
        // Send response back to background script
        sendResponse(response);
    } catch (error) {
        console.error('RTL-LTR Controller: Error handling message', error);
        sendResponse({ success: false, error: error.message });
    }
    
    // Keep message channel open
    return true;
};

// Store reference to last right-clicked element
document.addEventListener('contextmenu', function(event) {
    window.rtlState.lastRightClickedElement = event.target;
});
