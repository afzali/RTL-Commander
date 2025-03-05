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
        
        // Add Vazir font using CDN
        const fontStyle = document.createElement('style');
        fontStyle.id = fontStyleId;
        fontStyle.textContent = `
            @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v30.1.0/dist/font-face.css');
            
            [dir="rtl"], [dir="rtl"] * {
                font-family: 'Vazir', Tahoma, Arial, sans-serif !important;
            }
        `;
        
        document.head.appendChild(fontStyle);
        window.rtlUI.showNotification('Vazir font added for RTL text');
    } catch (error) {
        console.error('RTL-LTR Controller: Error toggling Vazir font', error);
    }
};
