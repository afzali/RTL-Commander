/**
 * RTL-LTR Text Direction Controller
 * Background script that handles context menu creation and management
 */

// Create context menu items when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  // Remove existing menu items first
  chrome.contextMenus.removeAll(() => {
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

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Menu clicked:', info.menuItemId);
  
  if (info.menuItemId === "toggleDirection") {
    // Send simple toggle message to content script
    console.log('Sending toggleDirection message to tab:', tab.id);
    chrome.tabs.sendMessage(tab.id, {
      action: "toggleDirection"
    }, response => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
      } else {
        console.log('Message sent successfully');
      }
    });
  } else if (info.menuItemId === "toggleDirectionAdvanced") {
    // Send advanced toggle message to content script
    console.log('Sending showAdvancedToggle message to tab:', tab.id);
    chrome.tabs.sendMessage(tab.id, {
      action: "showAdvancedToggle"
    }, response => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
      }
    });
  } else if (info.menuItemId === "clearSettings") {
    // Clear settings and notify content script
    console.log('Clearing saved settings');
    chrome.storage.local.clear(() => {
      chrome.tabs.sendMessage(tab.id, {
        action: "settingsCleared"
      }, response => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
        }
      });
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
  }
});
