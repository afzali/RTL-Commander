/**
 * RTL-LTR Controller Popup Script - Clear Buttons Module
 * Handles the clear buttons functionality
 */

import { getCurrentTabDomain, sendMessageWithRetry } from './messaging.js';
import { loadSavedElements } from './currentDomain.js';
import { loadAllDomains } from './allDomains.js';

/**
 * Setup clear buttons event listeners
 */
export function setupClearButtons() {
    // Clear current domain settings
    document.getElementById('clear-all').addEventListener('click', clearCurrentDomain);
    
    // Clear all domains settings
    document.getElementById('clear-all-domains').addEventListener('click', clearAllDomains);
}

/**
 * Clear settings for the current domain
 */
async function clearCurrentDomain() {
    if (confirm('Are you sure you want to delete all settings for the current domain?')) {
        const domain = await getCurrentTabDomain();
        chrome.storage.local.remove(domain, () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                sendMessageWithRetry(tabs[0].id, {
                    action: "settingsCleared"
                });
            });
            loadSavedElements();
            loadAllDomains();
        });
    }
}

/**
 * Clear settings for all domains
 */
function clearAllDomains() {
    if (confirm('Are you sure you want to delete settings for ALL domains? This cannot be undone.')) {
        chrome.storage.local.clear(() => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                sendMessageWithRetry(tabs[0].id, {
                    action: "settingsCleared"
                });
            });
            loadSavedElements();
            loadAllDomains();
        });
    }
}
