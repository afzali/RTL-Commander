/**
 * RTL-LTR Text Direction Controller
 * Background script - Context Menus Module
 */

import { sendMessageWithRetry } from './utils.js';

/**
 * Setup context menu items
 */
export function setupContextMenus() {
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
}
