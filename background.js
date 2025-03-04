/**
 * RTL-LTR Text Direction Controller
 * Background script that handles context menu creation and management
 */

// Create context menu items when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  // Remove existing menu items first
  chrome.contextMenus.removeAll(() => {
    // Toggle whole page option (at the top)
    chrome.contextMenus.create({
      id: "toggleWholePage",
      title: "Toggle RTL/LTR (Whole Page)",
      contexts: ["all"]
    });

    // Add Vazir font
    chrome.contextMenus.create({
      id: "addVazirFont",
      title: "Toggle Vazir Font",
      contexts: ["all"]
    });

    // Separator
    chrome.contextMenus.create({
      id: "separator1",
      type: "separator",
      contexts: ["all"]
    });

    // Simple toggle option
    chrome.contextMenus.create({
      id: "toggleDirection",
      title: "Toggle RTL/LTR",
      contexts: ["all"]
    });

    // Advanced toggle option with selector editing
    chrome.contextMenus.create({
      id: "toggleDirectionAdvanced",
      title: "Toggle RTL/LTR (Advanced)",
      contexts: ["all"]
    });

    // Clear saved settings option
    chrome.contextMenus.create({
      id: "clearSettings",
      title: "Clear Saved Settings",
      contexts: ["all"]
    });
  });
});

/**
 * Sends a message to a tab with retry mechanism
 * @param {number} tabId - The ID of the tab to send the message to
 * @param {Object} message - The message to send
 * @param {Function} callback - Callback function to execute after sending
 */
function sendMessageWithRetry(tabId, message, callback) {
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
          files: ['content.js']
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

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Menu clicked:', info.menuItemId);
  
  if (info.menuItemId === "toggleWholePage") {
    // Send toggle whole page message to content script
    sendMessageWithRetry(tab.id, {
      action: "toggleWholePage"
    });
  } else if (info.menuItemId === "addVazirFont") {
    // Send add Vazir font message to content script
    sendMessageWithRetry(tab.id, {
      action: "addVazirFont"
    });
  } else if (info.menuItemId === "toggleDirection") {
    // Send simple toggle message to content script
    console.log('Sending toggleDirection message to tab:', tab.id);
    sendMessageWithRetry(tab.id, {
      action: "toggleDirection"
    });
  } else if (info.menuItemId === "toggleDirectionAdvanced") {
    // Send advanced toggle message to content script
    console.log('Sending showAdvancedToggle message to tab:', tab.id);
    sendMessageWithRetry(tab.id, {
      action: "showAdvancedToggle"
    });
  } else if (info.menuItemId === "clearSettings") {
    // Send message to content script to show confirmation dialog
    sendMessageWithRetry(tab.id, {
      action: "confirmClearSettings"
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  
  if (request.action === "saveElementDirection") {
    chrome.storage.local.set({
      [request.selector]: {
        direction: request.direction,
        xpath: request.xpath
      }
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving:', chrome.runtime.lastError);
      } else {
        console.log('Settings saved successfully');
      }
    });
  } else if (request.action === "clearSettingsConfirmed") {
    // Clear settings and notify content script
    console.log('Clearing saved settings');
    chrome.storage.local.clear(() => {
      sendMessageWithRetry(sender.tab.id, {
        action: "settingsCleared"
      });
    });
  }
});
