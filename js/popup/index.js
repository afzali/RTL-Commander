/**
 * RTL-LTR Controller Popup Script - Main Entry Point
 */

import { setupTabNavigation } from './tabs.js';
import { setupEditDialog } from './editDialog.js';
import { loadSavedElements } from './currentDomain.js';
import { loadAllDomains } from './allDomains.js';
import { setupClearButtons } from './clearButtons.js';
import { setupStorageListener } from './storageListener.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Setup tab navigation
    setupTabNavigation();
    
    // Setup edit dialog
    setupEditDialog();
    
    // Setup clear buttons
    setupClearButtons();
    
    // Initial load of current domain settings
    loadSavedElements();
    
    // Setup storage change listener
    setupStorageListener();
    
    // Close all menus when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.more-options-btn') && !e.target.closest('.more-options-menu')) {
            document.querySelectorAll('.more-options-menu').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
});
