/**
 * RTL-LTR Controller Popup Script - Edit Dialog Module
 * Handles the edit dialog functionality
 */

import { state } from './state.js';
import { loadSavedElements } from './currentDomain.js';
import { loadAllDomains } from './allDomains.js';
import { sendMessageWithRetry } from './messaging.js';

/**
 * Setup edit dialog event listeners
 */
export function setupEditDialog() {
    // Add event listeners for edit dialog buttons
    document.getElementById('cancelEdit').addEventListener('click', closeEditDialog);
    document.getElementById('saveEdit').addEventListener('click', saveEditChanges);
    
    // Close dialog when clicking overlay
    state.overlay.addEventListener('click', closeEditDialog);
}

/**
 * Close the edit dialog
 */
export function closeEditDialog() {
    state.editDialog.classList.remove('show');
    state.overlay.classList.remove('show');
    state.currentSelector = null;
    state.currentDomain = null;
}

/**
 * Show the edit dialog for a selector
 */
export function showEditDialog(selector, data, domain) {
    state.currentSelector = selector;
    state.currentDomain = domain;
    document.getElementById('editSelector').value = selector;
    document.getElementById('editDirection').value = data.direction;
    document.getElementById('editCustomCSS').value = data.customCSS || '';
    
    state.editDialog.classList.add('show');
    state.overlay.classList.add('show');
}

/**
 * Save changes from the edit dialog
 */
function saveEditChanges() {
    if (!state.currentSelector || !state.currentDomain) return;

    const direction = document.getElementById('editDirection').value;
    const customCSS = document.getElementById('editCustomCSS').value;

    chrome.storage.local.get(state.currentDomain, (items) => {
        const domainData = items[state.currentDomain];
        if (domainData && domainData.selectors && domainData.selectors[state.currentSelector]) {
            // Update settings
            domainData.selectors[state.currentSelector].direction = direction;
            domainData.selectors[state.currentSelector].customCSS = customCSS;
            domainData.selectors[state.currentSelector].lastUpdated = new Date().toISOString();

            chrome.storage.local.set({ [state.currentDomain]: domainData }, () => {
                // Update the page if we're editing the current domain
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    const url = new URL(tabs[0].url);
                    if (url.hostname === state.currentDomain) {
                        sendMessageWithRetry(tabs[0].id, {
                            action: "updateSettings",
                            selector: state.currentSelector,
                            direction: direction,
                            customCSS: customCSS
                        });
                    }
                });

                // Close dialog and refresh lists
                closeEditDialog();
                loadSavedElements();
                loadAllDomains();
            });
        }
    });
}
