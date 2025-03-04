/**
 * RTL-LTR Controller Content Script - Settings Module
 * Handles applying and removing settings
 */

import { state } from './state.js';

/**
 * Apply all saved settings
 */
export function applyAllSettings() {
    if (!state.domainSettings || !state.domainSettings.selectors) return;
    
    // First clean up existing styles
    cleanupStyles();
    
    // Apply each selector's settings
    Object.entries(state.domainSettings.selectors).forEach(([selector, data]) => {
        if (data.enabled !== false) {
            applyDirectionToElements(selector, data);
        }
    });
}

/**
 * Clean up existing styles
 */
export function cleanupStyles() {
    if (state.styleElement) {
        state.styleElement.textContent = '';
    }
}

/**
 * Apply direction and custom CSS to elements
 */
export function applyDirectionToElements(selector, data) {
    try {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) return;
        
        console.log(`RTL-LTR Controller: Applying ${data.direction} to ${elements.length} elements matching ${selector}`);
        
        // First remove any existing direction
        removeDirectionFromElements(selector);
        
        // Determine text alignment based on direction
        const textAlign = data.direction === 'rtl' ? 'right' : 'left';
        
        // Create CSS rule with high specificity
        let cssRule = `${selector}, ${selector}, ${selector} { `;
        cssRule += `direction: ${data.direction} !important; `;
        cssRule += `text-align: ${textAlign} !important; `;
        
        // Add custom CSS if provided
        if (data.customCSS) {
            cssRule += `${data.customCSS} `;
        }
        
        cssRule += '} ';
        
        // Add the CSS rule to the style element
        if (state.styleElement) {
            state.styleElement.textContent += cssRule;
        }
        
        // Also apply inline styles as a backup for elements with high-specificity styles
        elements.forEach(el => {
            el.style.setProperty('direction', data.direction, 'important');
            el.style.setProperty('text-align', textAlign, 'important');
            
            // Apply custom CSS inline if provided
            if (data.customCSS) {
                const cssProperties = data.customCSS.split(';');
                cssProperties.forEach(prop => {
                    const [name, value] = prop.split(':');
                    if (name && value) {
                        el.style.setProperty(name.trim(), value.trim(), 'important');
                    }
                });
            }
        });
    } catch (error) {
        console.error('RTL-LTR Controller: Error applying direction', error);
    }
}

/**
 * Remove direction and custom CSS from elements
 */
export function removeDirectionFromElements(selector) {
    try {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) return;
        
        console.log(`RTL-LTR Controller: Removing direction from ${elements.length} elements matching ${selector}`);
        
        // Remove inline styles
        elements.forEach(el => {
            el.style.removeProperty('direction');
            el.style.removeProperty('text-align');
            
            // Remove common RTL-related CSS properties
            const rtlProperties = [
                'text-align', 'float', 'margin-left', 'margin-right', 
                'padding-left', 'padding-right', 'border-left', 'border-right'
            ];
            
            rtlProperties.forEach(prop => {
                el.style.removeProperty(prop);
            });
        });
    } catch (error) {
        console.error('RTL-LTR Controller: Error removing direction', error);
    }
}

/**
 * Toggle direction for a selector
 */
export function toggleDirection(selector, enabled) {
    if (!state.domainSettings || !state.domainSettings.selectors || !state.domainSettings.selectors[selector]) {
        console.error('RTL-LTR Controller: Cannot toggle direction, selector not found', selector);
        return;
    }
    
    const data = state.domainSettings.selectors[selector];
    
    if (enabled) {
        applyDirectionToElements(selector, data);
    } else {
        removeDirectionFromElements(selector);
    }
}

/**
 * Update settings for a selector
 */
export function updateSettings(selector, direction, customCSS) {
    try {
        if (!state.domainSettings) {
            state.domainSettings = { selectors: {} };
        }
        
        if (!state.domainSettings.selectors) {
            state.domainSettings.selectors = {};
        }
        
        // Update or create the selector settings
        state.domainSettings.selectors[selector] = {
            direction: direction,
            customCSS: customCSS,
            lastUpdated: new Date().toISOString(),
            enabled: true
        };
        
        // Save the updated settings
        chrome.storage.local.set({ [window.location.hostname]: state.domainSettings }, () => {
            console.log('RTL-LTR Controller: Settings updated for', selector);
            applyDirectionToElements(selector, state.domainSettings.selectors[selector]);
        });
    } catch (error) {
        console.error('RTL-LTR Controller: Error updating settings', error);
    }
}

/**
 * Remove direction for a selector
 */
export function removeDirection(selector) {
    try {
        removeDirectionFromElements(selector);
        
        if (state.domainSettings && state.domainSettings.selectors && state.domainSettings.selectors[selector]) {
            delete state.domainSettings.selectors[selector];
            
            // Save the updated settings
            chrome.storage.local.set({ [window.location.hostname]: state.domainSettings }, () => {
                console.log('RTL-LTR Controller: Direction removed for', selector);
            });
        }
    } catch (error) {
        console.error('RTL-LTR Controller: Error removing direction', error);
    }
}

/**
 * Clear all settings for the current domain
 */
export function clearAllSettings() {
    try {
        if (state.styleElement) {
            state.styleElement.textContent = '';
        }
        
        state.domainSettings = null;
        
        console.log('RTL-LTR Controller: All settings cleared');
    } catch (error) {
        console.error('RTL-LTR Controller: Error clearing settings', error);
    }
}
