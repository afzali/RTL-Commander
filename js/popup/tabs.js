/**
 * RTL-LTR Controller Popup Script - Tabs Module
 * Handles tab navigation
 */

import { loadSavedElements } from './currentDomain.js';
import { loadAllDomains } from './allDomains.js';

/**
 * Setup tab navigation
 */
export function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show the selected tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                }
            });
            
            // Load content based on selected tab
            if (tabName === 'current-domain') {
                loadSavedElements();
            } else if (tabName === 'all-domains') {
                loadAllDomains();
            }
        });
    });
}
