/**
 * RTL-LTR Controller Content Script - Observer Module
 * Handles DOM mutation observation
 */

import { applyAllSettings } from './settings.js';
import { state } from './state.js';

/**
 * Setup mutation observer to detect DOM changes
 */
export function setupMutationObserver() {
    if (state.observer) {
        state.observer.disconnect();
    }
    
    state.observer = new MutationObserver((mutations) => {
        let shouldReapply = false;
        
        for (const mutation of mutations) {
            // If nodes are added, we should reapply settings
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                shouldReapply = true;
                break;
            }
            
            // If attributes related to text direction are changed, we should reapply
            if (mutation.type === 'attributes' && 
                (mutation.attributeName === 'dir' || 
                 mutation.attributeName === 'style' || 
                 mutation.attributeName === 'class')) {
                shouldReapply = true;
                break;
            }
        }
        
        if (shouldReapply) {
            applyAllSettings();
        }
    });
    
    // Observe the entire document for changes
    state.observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['dir', 'style', 'class']
    });
}
