/**
 * RTL-LTR Text Direction Controller
 * Background script - Messaging Module
 */

import { sendMessageWithRetry } from './utils.js';

/**
 * Setup message handlers for communication with content scripts
 */
export function setupMessageHandlers() {
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
    } else if (request.action === "reloadContentScript") {
      // Reload content script in the specified tab
      if (request.tabId) {
        chrome.scripting.executeScript({
          target: { tabId: request.tabId },
          files: ['js/content/index.js']
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('Failed to reload content script:', chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            console.log('Content script reloaded successfully');
            sendResponse({ success: true });
          }
        });
        return true; // Keep the message channel open for async response
      } else {
        sendResponse({ success: false, error: 'No tabId provided' });
      }
    }
  });
}
