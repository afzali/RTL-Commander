/**
 * RTL-LTR Controller Popup Script - Messaging Module
 * Handles communication with content scripts
 */

/**
 * Send a message to a tab with retry mechanism
 * @param {number} tabId - The ID of the tab to send the message to
 * @param {object} message - The message to send
 * @param {function} [callback] - Optional callback function
 * @param {number} [retries=2] - Number of retries if the message fails
 */
export function sendMessageWithRetry(tabId, message, callback, retries = 2) {
    try {
        chrome.tabs.sendMessage(tabId, message, (response) => {
            const lastError = chrome.runtime.lastError;
            
            if (lastError) {
                console.error('Error sending message:', lastError.message);
                
                if (retries > 0 && lastError.message.includes('Receiving end does not exist')) {
                    console.log(`Retrying message (${retries} attempts left)...`);
                    
                    // Try to reload the content script via the background script
                    chrome.runtime.sendMessage({
                        action: 'reloadContentScript',
                        tabId: tabId
                    }, (reloadResponse) => {
                        if (reloadResponse && reloadResponse.success) {
                            // Wait a moment for the content script to initialize
                            setTimeout(() => {
                                sendMessageWithRetry(tabId, message, callback, retries - 1);
                            }, 500);
                        } else {
                            console.error('Failed to reload content script');
                            if (callback) callback({ success: false, error: 'Failed to reload content script' });
                        }
                    });
                } else {
                    if (callback) callback({ success: false, error: lastError.message });
                }
            } else {
                if (callback) callback(response);
            }
        });
    } catch (error) {
        console.error('Error in sendMessageWithRetry:', error);
        if (callback) callback({ success: false, error: error.message });
    }
}

/**
 * Get the current tab's domain
 * @returns {Promise<string>} The domain of the current tab
 */
export async function getCurrentTabDomain() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = new URL(tabs[0].url);
        return url.hostname;
    } catch (error) {
        console.error('Error getting current tab domain:', error);
        return '';
    }
}
