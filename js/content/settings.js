/**
 * RTL-LTR Controller Content Script - Settings Module
 * Handles applying and removing settings
 */

// Create global settings object
window.rtlSettings = {};

/**
 * Returns the current domain of the page
 * @returns {string} Current domain (hostname)
 */
window.rtlSettings.getCurrentDomain = function() {
    return window.location.hostname;
};

/**
 * Apply all saved settings
 */
window.rtlSettings.applyAllSettings = function() {
    if (!window.rtlState.domainSettings || !window.rtlState.domainSettings.selectors) return;
    
    // First clean up existing styles
    window.rtlSettings.cleanupStyles();
    
    // Apply each selector's settings
    Object.entries(window.rtlState.domainSettings.selectors).forEach(([selector, data]) => {
        if (data.enabled !== false) {
            window.rtlSettings.applyDirectionToElements(selector, data);
        }
    });
};

/**
 * Clean up existing styles
 */
window.rtlSettings.cleanupStyles = function() {
    if (window.rtlState.styleElement) {
        window.rtlState.styleElement.textContent = '';
    }
};

/**
 * Apply direction and custom CSS to elements matching a selector
 * @param {string} selector - CSS selector to match elements
 * @param {object} data - Data including direction and custom CSS
 */
window.rtlSettings.applyDirectionToElements = function(selector, data) {
    try {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) return;
        
        console.log(`RTL-LTR Controller: Applying ${data.direction} to ${elements.length} elements matching ${selector}`);
        
        // Skip if not enabled
        if (data.enabled === false) {
            console.log(`RTL-LTR Controller: Skipping disabled selector: ${selector}`);
            // Remove any existing styles for this selector
            window.rtlSettings.removeDirectionFromElements(selector);
            return;
        }
        
        // Create a new style element
        const styleId = `rtl-ltr-style-${btoa(selector)}`;
        let styleBlock = document.getElementById(styleId);
        
        // Create new style block if it doesn't exist
        if (!styleBlock) {
            styleBlock = document.createElement('style');
            styleBlock.id = styleId;
            styleBlock.setAttribute('data-rtl-extension', 'true');
        }
        
        // Build CSS rule
        let cssRule = `${selector} { `;
        cssRule += `direction: ${data.direction} !important; `;
        
        // Add text alignment based on direction if not specified in custom CSS
        const hasTextAlign = data.customCSS && data.customCSS.includes('text-align');
        if (!hasTextAlign) {
            cssRule += data.direction === 'rtl' 
                ? 'text-align: right !important; '
                : 'text-align: left !important; ';
        }
        
        // Add custom CSS if provided and not empty
        if (data.customCSS && data.customCSS.trim() !== '') {
            // Ensure each property has !important
            const customCssProperties = data.customCSS.split(';')
                .filter(prop => prop.trim())
                .map(prop => {
                    const [key, value] = prop.split(':').map(s => s.trim());
                    if (key && value) {
                        // Add !important if not already there
                        if (!value.includes('!important')) {
                            return `${key}: ${value} !important`;
                        }
                        return `${key}: ${value}`;
                    }
                    return '';
                })
                .filter(prop => prop)
                .join('; ');
            
            if (customCssProperties) {
                cssRule += customCssProperties + '; ';
            }
        }
        
        cssRule += ' }';
        
        console.log('Applying CSS rule:', cssRule);
        
        // Apply the CSS rule
        styleBlock.textContent = cssRule;
        document.head.appendChild(styleBlock);

        // Add class and data attributes to elements and apply inline styles as backup
        elements.forEach(element => {
            // Store original direction if not already stored
            if (!element.hasAttribute('data-original-direction')) {
                element.setAttribute('data-original-direction', getComputedStyle(element).direction || 'ltr');
            }
            
            // Add class for easier identification
            element.classList.add('rtl-extension-modified');
            element.setAttribute('data-rtl-selector', selector);
            
            // Apply inline styles as a backup for elements that might have higher specificity styles
            if (data.direction) {
                element.style.setProperty('direction', data.direction, 'important');
                
                // Apply text alignment based on direction if not specified in custom CSS
                if (!hasTextAlign) {
                    if (data.direction === 'rtl') {
                        element.style.setProperty('text-align', 'right', 'important');
                    } else if (data.direction === 'ltr') {
                        element.style.setProperty('text-align', 'left', 'important');
                    }
                }
            }
            
            // Apply custom CSS properties as inline styles
            if (data.customCSS && data.customCSS.trim() !== '') {
                try {
                    data.customCSS.split(';')
                        .filter(prop => prop.trim())
                        .forEach(prop => {
                            const [key, value] = prop.split(':').map(s => s.trim());
                            if (key && value) {
                                element.style.setProperty(key, value, 'important');
                            }
                        });
                } catch (cssError) {
                    console.error('Error applying inline custom CSS:', cssError);
                }
            }
        });

        // Show notification only for user-initiated changes
        if (!window.suppressNotifications) {
            window.rtlUI.showNotification(`${data.direction.toUpperCase()} applied to ${elements.length} elements`);
        }
    } catch (error) {
        console.error('RTL-LTR Controller: Error applying direction', error);
    }
};

/**
 * Remove direction and custom CSS from elements
 * @param {string} selector - CSS selector to remove direction from
 */
window.rtlSettings.removeDirectionFromElements = function(selector) {
    try {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) return;
        
        console.log(`RTL-LTR Controller: Removing direction from ${elements.length} elements matching ${selector}`);
        
        // Remove style element for this selector
        const styleId = `rtl-ltr-style-${btoa(selector)}`;
        const styleElement = document.getElementById(styleId);
        if (styleElement) {
            styleElement.remove();
        }
        
        // Remove inline styles and classes from elements
        elements.forEach(element => {
            // Restore original direction if available
            const originalDirection = element.getAttribute('data-original-direction');
            if (originalDirection) {
                element.style.setProperty('direction', originalDirection);
            } else {
                element.style.removeProperty('direction');
            }
            
            // Remove text alignment
            element.style.removeProperty('text-align');
            
            // Remove all custom CSS properties that were applied by the extension
            // The safest approach is to remove the style attribute completely and rely on the original CSS
            element.removeAttribute('style');
            
            // Remove class and data attribute
            element.classList.remove('rtl-extension-modified');
            element.removeAttribute('data-rtl-selector');
            // Keep data-original-direction for future use
        });

        if (!window.suppressNotifications) {
            window.rtlUI.showNotification(`Direction removed from ${elements.length} elements`);
        }
    } catch (error) {
        console.error('RTL-LTR Controller: Error removing direction', error);
    }
};

/**
 * Toggle direction for selector
 * @param {string} selector - CSS selector to toggle direction for
 */
window.rtlSettings.toggleDirection = function(selector) {
    try {
        // Get current direction
        const element = document.querySelector(selector);
        if (!element) return;
        
        const currentDirection = getComputedStyle(element).direction;
        const newDirection = currentDirection === 'rtl' ? 'ltr' : 'rtl';
        
        console.log(`RTL-LTR Controller: Toggling direction from ${currentDirection} to ${newDirection} for ${selector}`);
        
        // Update settings with new direction
        window.rtlSettings.updateSettings(selector, newDirection, '');
    } catch (error) {
        console.error('RTL-LTR Controller: Error toggling direction', error);
    }
};

/**
 * Update settings for a selector
 * @param {string} selector - CSS selector to update
 * @param {string} direction - Text direction ('rtl' or 'ltr')
 * @param {string} customCSS - Optional custom CSS to apply
 * @param {boolean} enabled - Whether the setting is enabled (default: true)
 */
window.rtlSettings.updateSettings = function(selector, direction, customCSS, enabled = true) {
    try {
        // Get current domain
        const domain = window.rtlSettings.getCurrentDomain();
        
        // Initialize domain settings if needed
        chrome.storage.local.get(domain, function(items) {
            const domainData = items[domain] || { selectors: {} };
            
            // Update selector settings
            domainData.selectors[selector] = {
                direction: direction,
                customCSS: customCSS,
                enabled: enabled !== false, // Ensure we handle undefined correctly
                lastUpdated: new Date().toISOString()
            };
            
            // Save updated settings
            chrome.storage.local.set({ [domain]: domainData }, function() {
                // Update local copy
                window.rtlState.domainSettings = domainData;
                
                // Only apply settings if enabled
                if (enabled !== false) {
                    window.rtlSettings.applyDirectionToElements(selector, domainData.selectors[selector]);
                } else {
                    // Remove visual styles but keep the setting in storage
                    window.rtlSettings.removeDirectionFromElements(selector);
                }
                
                console.log('Settings updated for', selector, domainData.selectors[selector]);
            });
        });
    } catch (error) {
        console.error('Error updating settings:', error);
    }
};

/**
 * Remove direction for a selector
 * @param {string} selector - CSS selector to remove direction from
 */
window.rtlSettings.removeDirection = function(selector) {
    try {
        // Remove CSS from elements
        window.rtlSettings.removeDirectionFromElements(selector);
        
        // Update state
        if (window.rtlState.domainSettings && window.rtlState.domainSettings.selectors) {
            delete window.rtlState.domainSettings.selectors[selector];
            
            // Save updated settings
            const domain = window.rtlSettings.getCurrentDomain();
            const settingsToSave = {};
            settingsToSave[domain] = window.rtlState.domainSettings;
            
            chrome.storage.local.set(settingsToSave, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error saving settings:', chrome.runtime.lastError);
                } else {
                    console.log('Settings saved successfully');
                    window.rtlUI.showNotification('Direction removed');
                }
            });
        }
    } catch (error) {
        console.error('RTL-LTR Controller: Error removing direction', error);
    }
};

/**
 * Clear all settings for the current domain
 */
window.rtlSettings.clearAllSettings = function() {
    try {
        const domain = window.rtlSettings.getCurrentDomain();
        
        // Show confirmation first
        if (confirm(`Are you sure you want to clear all RTL/LTR settings for ${domain}?`)) {
            // Remove all style elements created by extension
            document.querySelectorAll('[id^="rtl-ltr-style-"]').forEach(el => el.remove());
            
            // Reset all rtl-extension-modified elements
            document.querySelectorAll('.rtl-extension-modified').forEach(element => {
                // Restore original direction if available
                const originalDirection = element.getAttribute('data-original-direction');
                if (originalDirection) {
                    element.style.direction = originalDirection;
                } else {
                    element.style.removeProperty('direction');
                }
                
                // Remove text alignment
                element.style.removeProperty('text-align');
                
                // Remove custom CSS properties
                if (element.getAttribute('style')) {
                    const style = element.getAttribute('style');
                    const customCSSProperties = style.split(';')
                        .filter(prop => !prop.includes('direction') && !prop.includes('text-align'))
                        .join(';');
                    
                    if (customCSSProperties.trim()) {
                        element.setAttribute('style', customCSSProperties);
                    } else {
                        element.removeAttribute('style');
                    }
                }
                
                // Remove class and data attributes
                element.classList.remove('rtl-extension-modified');
                element.removeAttribute('data-rtl-selector');
                element.removeAttribute('data-original-direction');
            });
            
            // Clear domain settings in state
            window.rtlState.domainSettings = { selectors: {} };
            
            // Remove from storage
            chrome.storage.local.remove(domain, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error clearing settings:', chrome.runtime.lastError);
                } else {
                    console.log('All settings cleared for domain:', domain);
                    window.rtlUI.showNotification('All settings cleared');
                }
            });
        }
    } catch (error) {
        console.error('RTL-LTR Controller: Error clearing all settings', error);
    }
};
