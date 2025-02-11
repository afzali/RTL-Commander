// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  // Remove existing menu items first
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "toggleRTLSimple",
      title: "Toggle RTL/LTR",
      contexts: ["all"]
    });
    
    chrome.contextMenus.create({
      id: "toggleRTLAdvanced",
      title: "Toggle RTL/LTR (Advanced)",
      contexts: ["all"]
    });

    chrome.contextMenus.create({
      id: "clearSavedSelectors",
      title: "Clear Saved Settings",
      contexts: ["all"]
    });
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Menu clicked:', info.menuItemId);
  
  if (info.menuItemId === "toggleRTLSimple") {
    console.log('Sending toggleDirection message to tab:', tab.id);
    chrome.tabs.sendMessage(tab.id, {
      action: "toggleDirection",
      elementInfo: info
    }, response => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
      } else {
        console.log('Message sent successfully');
      }
    });
  } else if (info.menuItemId === "toggleRTLAdvanced") {
    console.log('Sending showAdvancedToggle message to tab:', tab.id);
    chrome.tabs.sendMessage(tab.id, {
      action: "showAdvancedToggle",
      elementInfo: info
    }, response => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
      }
    });
  } else if (info.menuItemId === "clearSavedSelectors") {
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
