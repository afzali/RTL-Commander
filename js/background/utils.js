/**
 * RTL-LTR Text Direction Controller
 * Background script - Utilities Module
 */

/**
 * Sends a message to a tab with retry mechanism
 * @param {number} tabId - The ID of the tab to send the message to
 * @param {Object} message - The message to send
 * @param {Function} callback - Callback function to execute after sending
 */
export function sendMessageWithRetry(tabId, message, callback) {
  console.log('Sending message to tab:', tabId, message);
  
  chrome.tabs.sendMessage(tabId, message, response => {
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError);
      
      // If connection failed, try to reload the content script
      if (chrome.runtime.lastError.message.includes('Receiving end does not exist')) {
        console.log('Content script connection lost. Attempting to reload content script...');
        
        // Execute the content script again in the tab
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['js/content/index.js']
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('Failed to reload content script:', chrome.runtime.lastError);
            if (callback) callback(null);
          } else {
            console.log('Content script reloaded successfully. Retrying message...');
            // Wait a moment for the script to initialize
            setTimeout(() => {
              chrome.tabs.sendMessage(tabId, message, secondResponse => {
                if (chrome.runtime.lastError) {
                  console.error('Retry failed:', chrome.runtime.lastError);
                } else {
                  console.log('Retry successful');
                }
                if (callback) callback(secondResponse);
              });
            }, 500);
          }
        });
      } else if (callback) {
        callback(null);
      }
    } else {
      console.log('Message sent successfully');
      if (callback) callback(response);
    }
  });
}
