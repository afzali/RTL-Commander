/**
 * RTL-LTR Controller Popup Script - Storage Listener Module
 * Handles listening for storage changes
 */

import { loadSavedElements } from './currentDomain.js';
import { loadAllDomains } from './allDomains.js';

/**
 * Setup storage change listener
 */
export function setupStorageListener() {
    // Listen for storage changes
    chrome.storage.onChanged.addListener(() => {
        loadSavedElements();
        if (document.querySelector('.tab-button[data-tab="all-domains"]').classList.contains('active')) {
            loadAllDomains();
        }
    });
}
