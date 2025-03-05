/**
 * RTL-LTR Text Direction Controller
 * Background script - Main Entry Point
 */

import { setupContextMenus } from './contextMenus.js';
import { setupMessageHandlers } from './messaging.js';

// Initialize context menus when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  setupContextMenus();
});

// Setup message handlers
setupMessageHandlers();
