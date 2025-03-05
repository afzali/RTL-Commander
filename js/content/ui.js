/**
 * RTL-LTR Controller Content Script - UI Module
 * Handles UI elements like panels, notifications, and selectors
 */

// Create global UI object
window.rtlUI = {};

/**
 * Show notification message in the bottom right corner
 * @param {string} message - Message to display
 */
window.rtlUI.showNotification = function(message) {
    try {
        // Skip if notifications are suppressed
        if (window.suppressNotifications) {
            return;
        }
        
        // Remove any existing notifications
        const existingNotification = document.querySelector('.rtl-ltr-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create and show new notification
        const notification = document.createElement('div');
        notification.className = 'rtl-ltr-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remove notification after delay
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 2500);
    } catch (error) {
        console.error('RTL-LTR Controller: Error showing notification', error);
    }
};

/**
 * Get CSS selector for an element
 * @param {Element} element - DOM element to get selector for
 * @returns {string} CSS selector for the element
 */
window.rtlUI.getCssSelector = function(element) {
    try {
        // First try getting existing selector if already processed
        if (element.dataset && element.dataset.rtlSelector) {
            return element.dataset.rtlSelector;
        }
        
        // Check for ID (most specific)
        if (element.id) {
            return '#' + element.id;
        }
        
        // Try to find a good class combination if available
        if (element.className && typeof element.className === 'string' && element.className.trim() !== '') {
            const classes = element.className.trim().split(/\s+/);
            if (classes.length > 0) {
                // Use first meaningful class that isn't dynamic or too generic
                const goodClasses = classes.filter(c => 
                    c.length > 2 && 
                    !/^(active|selected|open|visible|hidden|show|hide)$/.test(c) &&
                    !/^(ng-|js-|is-|has-|ui-|fa-|icon-)/.test(c));
                
                if (goodClasses.length > 0) {
                    return '.' + goodClasses.join('.');
                }
            }
        }
        
        // Fallback to tag name with nth-child for positioning
        let selector = element.tagName.toLowerCase();
        let parent = element.parentElement;
        
        if (parent) {
            const siblings = Array.from(parent.children);
            const sameTagSiblings = siblings.filter(el => el.tagName === element.tagName);
            
            if (sameTagSiblings.length > 1) {
                const index = Array.from(parent.children).indexOf(element) + 1;
                selector += ':nth-child(' + index + ')';
            }
            
            // Add parent tag name for more specificity
            selector = parent.tagName.toLowerCase() + ' > ' + selector;
        }
        
        return selector;
    } catch (error) {
        console.error('RTL-LTR Controller: Error generating CSS selector', error);
        return element.tagName.toLowerCase();
    }
};

/**
 * Show advanced panel for adjusting text direction and CSS
 * @param {Element} element - Target element
 */
window.rtlUI.showAdvancedPanel = function(element) {
    try {
        // Close any existing panel
        window.rtlUI.closeAdvancedPanel();
        
        // Create panel
        const panel = document.createElement('div');
        panel.className = 'rtl-ltr-panel';
        panel.id = 'rtl-ltr-advanced-panel';
        
        // Get current direction
        const currentDirection = getComputedStyle(element).direction;
        const newDirection = currentDirection === 'rtl' ? 'ltr' : 'rtl';
        
        // Get selector for element
        const selector = window.rtlUI.getCssSelector(element);
        
        // Build panel content
        panel.innerHTML = `
            <div class="rtl-ltr-panel-header">
                <h2>${currentDirection === 'rtl' ? 'RTL to LTR' : 'LTR to RTL'} Advanced Settings</h2>
                <button type="button" id="close-panel">×</button>
            </div>
            <div class="rtl-ltr-panel-content">
                <div class="rtl-ltr-panel-row">
                    <label for="css-selector">CSS Selector:</label>
                    <input type="text" id="css-selector" value="${selector}" />
                </div>
                <div class="rtl-ltr-panel-row">
                    <label for="text-direction">Direction:</label>
                    <select id="text-direction">
                        <option value="rtl" ${newDirection === 'rtl' ? 'selected' : ''}>RTL (Right to Left)</option>
                        <option value="ltr" ${newDirection === 'ltr' ? 'selected' : ''}>LTR (Left to Right)</option>
                    </select>
                </div>
                <div class="rtl-ltr-panel-row">
                    <label for="custom-css">Custom CSS (Optional):</label>
                    <textarea id="custom-css" placeholder="e.g., text-align: right;"></textarea>
                </div>
            </div>
            <div class="rtl-ltr-panel-buttons">
                <button type="button" id="apply-button">Apply</button>
                <button type="button" id="cancel-button">Cancel</button>
            </div>
        `;
        
        // Add panel to page
        document.body.appendChild(panel);
        
        // Setup event listeners
        document.getElementById('close-panel').addEventListener('click', window.rtlUI.closeAdvancedPanel);
        document.getElementById('cancel-button').addEventListener('click', window.rtlUI.closeAdvancedPanel);
        
        document.getElementById('apply-button').addEventListener('click', () => {
            const updatedSelector = document.getElementById('css-selector').value;
            const direction = document.getElementById('text-direction').value;
            const customCSS = document.getElementById('custom-css').value;
            
            // Update settings
            window.rtlSettings.updateSettings(updatedSelector, direction, customCSS);
            
            // Force an immediate reapply of all settings
            setTimeout(() => {
                window.rtlSettings.applyAllSettings();
            }, 50);
            
            // Close panel
            window.rtlUI.closeAdvancedPanel();
        });
    } catch (error) {
        console.error('RTL-LTR Controller: Error showing advanced panel', error);
    }
};

/**
 * Close advanced panel
 */
window.rtlUI.closeAdvancedPanel = function() {
    try {
        const panel = document.getElementById('rtl-ltr-advanced-panel');
        if (panel) {
            panel.remove();
        }
    } catch (error) {
        console.error('RTL-LTR Controller: Error closing panel', error);
    }
};

/**
 * Toggle text direction for the whole page
 */
window.rtlUI.toggleWholePage = function() {
    try {
        const html = document.documentElement;
        const currentDirection = getComputedStyle(html).direction;
        const newDirection = currentDirection === 'rtl' ? 'ltr' : 'rtl';
        
        window.rtlSettings.updateSettings('html', newDirection, '');
        window.rtlUI.showNotification(`Page direction changed to ${newDirection.toUpperCase()}`);
        
        // Additionally update body for better compatibility
        window.rtlSettings.updateSettings('body', newDirection, '');
    } catch (error) {
        console.error('RTL-LTR Controller: Error toggling whole page direction', error);
    }
};

/**
 * Toggle Vazir font for better RTL text display
 */
window.rtlUI.toggleVazirFont = function() {
    try {
        const fontStyleId = 'rtl-vazir-font';
        const existingStyle = document.getElementById(fontStyleId);
        
        if (existingStyle) {
            // Remove font if already added
            existingStyle.remove();
            window.rtlUI.showNotification('Vazir font removed');
            return;
        }
        
        // Create and show the font options dialog
        window.rtlUI.showFontOptionsDialog();
    } catch (error) {
        console.error('RTL-LTR Controller: Error toggling Vazir font', error);
    }
};

/**
 * Show a dialog with Vazir font application options
 */
window.rtlUI.showFontOptionsDialog = function() {
    try {
        // Close any existing dialogs
        window.rtlUI.closeAdvancedPanel();
        const existingDialog = document.getElementById('rtl-font-options-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'rtl-ltr-overlay';
        overlay.id = 'rtl-font-overlay';
        document.body.appendChild(overlay);
        
        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'rtl-ltr-panel';
        dialog.id = 'rtl-font-options-dialog';
        
        dialog.innerHTML = `
            <div class="rtl-ltr-panel-header">
                <h2>Vazir Font Options</h2>
                <button type="button" id="close-font-dialog">×</button>
            </div>
            <div class="rtl-ltr-panel-content">
                <p style="margin-bottom: 16px;">How would you like to apply Vazir font?</p>
                
                <div class="rtl-ltr-panel-buttons" style="display: flex; flex-direction: column; gap: 10px;">
                    <button type="button" id="apply-to-all" class="rtl-ltr-button">
                        Apply to all RTL elements
                    </button>
                    <button type="button" id="add-for-css" class="rtl-ltr-button">
                        Add font for custom CSS use only
                    </button>
                    <button type="button" id="cancel-font" class="rtl-ltr-button rtl-ltr-button-secondary">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Add event listeners
        document.getElementById('close-font-dialog').addEventListener('click', window.rtlUI.closeFontDialog);
        document.getElementById('cancel-font').addEventListener('click', window.rtlUI.closeFontDialog);
        overlay.addEventListener('click', window.rtlUI.closeFontDialog);
        
        // Apply to all RTL elements
        document.getElementById('apply-to-all').addEventListener('click', () => {
            window.rtlUI.applyVazirFont(true);
            window.rtlUI.closeFontDialog();
        });
        
        // Add for custom CSS use
        document.getElementById('add-for-css').addEventListener('click', () => {
            window.rtlUI.applyVazirFont(false);
            window.rtlUI.closeFontDialog();
        });
        
       
    } catch (error) {
        console.error('RTL-LTR Controller: Error showing font options dialog', error);
    }
};

/**
 * Close the font options dialog
 */
window.rtlUI.closeFontDialog = function() {
    try {
        const dialog = document.getElementById('rtl-font-options-dialog');
        if (dialog) {
            dialog.remove();
        }
        
        const overlay = document.getElementById('rtl-font-overlay');
        if (overlay) {
            overlay.remove();
        }
    } catch (error) {
        console.error('RTL-LTR Controller: Error closing font dialog', error);
    }
};

/**
 * Apply Vazir font with specified option
 * @param {boolean} applyToAll - Whether to apply to all RTL elements or just add for custom CSS
 */
window.rtlUI.applyVazirFont = function(applyToAll) {
    try {
        const fontStyleId = 'rtl-vazir-font';
        
        // Remove any existing Vazir font styling
        const existingStyle = document.getElementById(fontStyleId);
        if (existingStyle) {
            existingStyle.remove();
        }
        
        // Add Vazir font using CDN
        const fontStyle = document.createElement('style');
        fontStyle.id = fontStyleId;
        fontStyle.setAttribute('data-rtl-extension', 'true');
        
        if (applyToAll) {
            // Apply to all RTL elements with high specificity
            fontStyle.textContent = `
                @font-face {
                    font-family: 'Vazir';
                    src: url('https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v30.1.0/dist/Vazir.woff2') format('woff2'),
                         url('https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v30.1.0/dist/Vazir.woff') format('woff'),
                         url('https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v30.1.0/dist/Vazir.ttf') format('truetype');
                    font-weight: normal;
                    font-style: normal;
                }
                
                * {
                    font-family: 'Vazir', Tahoma, Arial, sans-serif !important;
                }
                
                .rtl-vazir-applied {
                    font-family: 'Vazir', Tahoma, Arial, sans-serif !important;
                }
            `;
            
            // Also directly apply to elements using JavaScript for better coverage
            const rtlElements = document.querySelectorAll('[dir="rtl"]');
            console.log('Found RTL elements:', rtlElements.length);
            
            rtlElements.forEach(el => {
                el.style.fontFamily = 'Vazir, Tahoma, Arial, sans-serif';
                el.classList.add('rtl-vazir-applied');
                
                // Also apply to all children
                el.querySelectorAll('*').forEach(child => {
                    child.style.fontFamily = 'Vazir, Tahoma, Arial, sans-serif';
                    child.classList.add('rtl-vazir-applied');
                });
            });
            
            // If no RTL elements found, apply to html and body as fallback
            if (rtlElements.length === 0) {
                document.documentElement.style.fontFamily = 'Vazir, Tahoma, Arial, sans-serif';
                document.body.style.fontFamily = 'Vazir, Tahoma, Arial, sans-serif';
                document.documentElement.classList.add('rtl-vazir-applied');
                document.body.classList.add('rtl-vazir-applied');
            }
            
            window.rtlUI.showNotification('Vazir font added and applied to RTL elements');
        } else {
            // Just add the font without applying it
            fontStyle.textContent = `
                @font-face {
                    font-family: 'Vazir';
                    src: url('https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v30.1.0/dist/Vazir.woff2') format('woff2'),
                         url('https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v30.1.0/dist/Vazir.woff') format('woff'),
                         url('https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v30.1.0/dist/Vazir.ttf') format('truetype');
                    font-weight: normal;
                    font-style: normal;
                }
                
                /* Font is loaded but not automatically applied */
                .rtl-vazir-custom-apply {
                    font-family: 'Vazir', Tahoma, Arial, sans-serif;
                }
            `;
            window.rtlUI.showNotification('Vazir font added (available for use in custom CSS)');
            
            
        }
        
        document.head.appendChild(fontStyle);
        
        // Add global toggle to switch all text to Vazir if needed
        if (applyToAll) {
            const toggleBtn = document.createElement('button');
            toggleBtn.textContent = 'Toggle All Vazir';
            toggleBtn.style.position = 'fixed';
            toggleBtn.style.bottom = '10px';
            toggleBtn.style.right = '10px';
            toggleBtn.style.zIndex = '9999';
            toggleBtn.style.padding = '5px 10px';
            toggleBtn.style.borderRadius = '4px';
            toggleBtn.style.background = '#3498db';
            toggleBtn.style.color = 'white';
            toggleBtn.style.border = 'none';
            toggleBtn.style.cursor = 'pointer';
            toggleBtn.id = 'rtl-vazir-toggle';
            
            toggleBtn.addEventListener('click', function() {
                const allElements = document.querySelectorAll('*');
                allElements.forEach(el => {
                    if (!el.classList.contains('rtl-vazir-applied')) {
                        el.style.fontFamily = 'Vazir, Tahoma, Arial, sans-serif';
                        el.classList.add('rtl-vazir-applied');
                    } else {
                        el.style.removeProperty('font-family');
                        el.classList.remove('rtl-vazir-applied');
                    }
                });
            });
            
            document.body.appendChild(toggleBtn);
            
            // Remove the button after 5 seconds
            setTimeout(() => {
                const btn = document.getElementById('rtl-vazir-toggle');
                if (btn) btn.remove();
            }, 5000);
        }
    } catch (error) {
        console.error('RTL-LTR Controller: Error applying Vazir font', error);
    }
};

