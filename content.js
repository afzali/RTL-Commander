/**
 * RTL-LTR Text Direction Controller
 * Content script that handles the text direction toggling functionality
 */

/**
 * Returns the current domain of the page
 * @returns {string} Current domain (hostname)
 */
function getCurrentDomain() {
    return window.location.hostname;
}

/**
 * Generates a unique CSS selector for a DOM element
 * Tries to use ID if available, otherwise builds a path using tag names and nth-child
 * @param {Element} element - DOM element to generate selector for
 * @returns {string} CSS selector string
 */
function getCssSelector(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
        return '';
    }

    // If element has a valid ID, use it
    if (element.id && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(element.id)) {
        return '#' + element.id;
    }
    
    let path = [];
    while (element.nodeType === Node.ELEMENT_NODE) {
        let selector = element.nodeName.toLowerCase();
        
        // If element has ID, use it and break
        if (element.id && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(element.id)) {
            selector += '#' + element.id;
            path.unshift(selector);
            break;
        } else {
            // Count previous siblings of same type for nth-of-type
            let sibling = element;
            let nth = 1;
            while (sibling.previousSibling) {
                sibling = sibling.previousSibling;
                if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === element.nodeName) {
                    nth++;
                }
            }
            if (nth > 1) selector += `:nth-of-type(${nth})`;
        }
        
        path.unshift(selector);
        element = element.parentNode;
        
        // Stop at body or if we reach the root
        if (!element || element === document.body) break;
    }
    return path.join(' > ');
}

// Track the last right-clicked element for context menu actions
let lastClickedElement = null;

// Listen for right-click events to store the target element
document.addEventListener('contextmenu', function(e) {
    lastClickedElement = e.target;
    console.log('Right-clicked element:', {
        tagName: e.target.tagName,
        id: e.target.id,
        className: e.target.className,
        text: e.target.textContent?.substring(0, 50)
    });
});

/**
 * Applies direction and custom CSS to elements matching a selector
 * @param {string} selector - CSS selector
 * @param {Object} data - Settings data including direction and custom CSS
 */
function applyDirectionToElements(selector, data) {
    try {
        // First remove any existing direction
        removeDirectionFromElements(selector);

        // Find all matching elements
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) return;

        // Create or get style block for this selector
        let styleBlock = document.getElementById(`rtl-ltr-style-${btoa(selector)}`);
        if (!styleBlock) {
            styleBlock = document.createElement('style');
            styleBlock.id = `rtl-ltr-style-${btoa(selector)}`;
            document.head.appendChild(styleBlock);
        }

        elements.forEach(element => {
            // Store original direction if not already stored
            if (!element.hasAttribute('data-original-direction')) {
                element.setAttribute('data-original-direction', getComputedStyle(element).direction || 'ltr');
            }

            // Only apply if enabled
            if (data.enabled !== false) {
                // Add class for styling
                element.classList.add('rtl-extension-modified');
                
                // Create CSS rule
                let cssRule = `${selector} { direction: ${data.direction} !important;`;
                
                // Add custom CSS if provided
                if (data.customCSS) {
                    try {
                        // Parse and add each CSS property
                        const cssProperties = data.customCSS.split(';')
                            .filter(prop => prop.trim())
                            .map(prop => {
                                const [key, value] = prop.split(':').map(s => s.trim());
                                return key && value ? `${key}: ${value} !important;` : '';
                            })
                            .join(' ');
                        cssRule += ` ${cssProperties}`;
                    } catch (cssError) {
                        console.error('Error parsing custom CSS:', cssError);
                    }
                }
                
                cssRule += ' }';
                
                // Apply the CSS rule
                styleBlock.textContent = cssRule;
            }
        });

        // Show notification
        showNotification(`Direction ${data.enabled !== false ? 'applied' : 'removed'} for ${elements.length} elements`);
    } catch (error) {
        console.error('Error in applyDirectionToElements:', error);
        showNotification('Error applying direction: ' + error.message, 'error');
    }
}

/**
 * Removes direction and custom CSS from elements matching a selector
 * @param {string} selector - CSS selector
 */
function removeDirectionFromElements(selector) {
    try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            // Remove our custom class
            element.classList.remove('rtl-extension-modified');
            
            // Restore original direction if it was stored
            const originalDirection = element.getAttribute('data-original-direction');
            if (originalDirection) {
                element.removeAttribute('data-original-direction');
            }
        });

        // Remove style block if exists
        const styleBlock = document.getElementById(`rtl-ltr-style-${btoa(selector)}`);
        if (styleBlock) {
            styleBlock.remove();
        }
    } catch (error) {
        console.error('Error in removeDirectionFromElements:', error);
        showNotification('Error removing direction: ' + error.message, 'error');
    }
}

// Initialize when page loads
function initializeSettings() {
    chrome.storage.local.get(window.location.hostname, (items) => {
        if (chrome.runtime.lastError) {
            console.error('Storage error:', chrome.runtime.lastError);
            return;
        }

        const domainData = items[window.location.hostname];
        if (domainData && domainData.selectors) {
            Object.entries(domainData.selectors).forEach(([selector, data]) => {
                try {
                    if (data.enabled !== false) {
                        applyDirectionToElements(selector, data);
                    }
                } catch (error) {
                    console.error('Error applying settings for selector:', selector, error);
                }
            });
        }
    });
}

// Initialize observer for dynamic content
function initializeObserver() {
    // Make sure body exists
    if (!document.body) {
        console.warn('Body not found, waiting for DOMContentLoaded');
        return;
    }

    const observer = new MutationObserver((mutations) => {
        chrome.storage.local.get(window.location.hostname, (items) => {
            if (chrome.runtime.lastError) {
                console.error('Storage error:', chrome.runtime.lastError);
                return;
            }

            const domainData = items[window.location.hostname];
            if (domainData && domainData.selectors) {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            Object.entries(domainData.selectors).forEach(([selector, data]) => {
                                try {
                                    if (data.enabled !== false) {
                                        // Check if the new node matches our selector
                                        if (node.matches && node.matches(selector)) {
                                            applyDirectionToElements(selector, data);
                                        }
                                        // Check children of the new node
                                        const matches = node.querySelectorAll(selector);
                                        if (matches.length > 0) {
                                            applyDirectionToElements(selector, data);
                                        }
                                    }
                                } catch (error) {
                                    console.error('Error applying settings for selector:', selector, error);
                                }
                            });
                        }
                    });
                });
            }
        });
    });

    try {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        console.log('Observer started successfully');
    } catch (error) {
        console.error('Error starting observer:', error);
    }
}

// Make sure we initialize at the right time
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeSettings();
        initializeObserver();
    });
} else {
    // Document already loaded
    initializeSettings();
    initializeObserver();
}

// Also handle dynamic changes to the page
document.addEventListener('load', () => {
    initializeSettings();
});

/**
 * Shows the advanced panel with overlay
 * @param {Element} element - The element to generate settings for
 */
function showAdvancedPanel(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
        return;
    }

    const cssSelector = getCssSelector(element);
    if (!cssSelector) {
        return;
    }

    // Create overlay
    let overlay = document.createElement('div');
    overlay.className = 'rtl-ltr-overlay';
    document.body.appendChild(overlay);

    // Create or reuse panel element
    let panel = document.getElementById('rtl-ltr-advanced-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'rtl-ltr-advanced-panel';
        
        // Add styles for the panel
        const styles = document.createElement('style');
        styles.textContent = `
            #rtl-ltr-advanced-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                max-width: 500px;
                width: 90%;
                display: none;
            }
            
            .rtl-ltr-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 9999;
            }
            
            #rtl-ltr-advanced-panel .panel-header {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
            }
            
            #rtl-ltr-advanced-panel .input-group {
                margin-bottom: 15px;
            }
            
            #rtl-ltr-advanced-panel label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
            }
            
            #rtl-ltr-advanced-panel input[type="text"],
            #rtl-ltr-advanced-panel textarea {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-bottom: 5px;
                font-family: monospace;
            }

            #rtl-ltr-advanced-panel textarea {
                min-height: 80px;
                resize: vertical;
            }
            
            #rtl-ltr-advanced-panel .hint {
                display: block;
                color: #666;
                font-size: 12px;
                margin-bottom: 15px;
            }
            
            #rtl-ltr-advanced-panel .element-details {
                background: #f5f5f5;
                padding: 8px;
                border-radius: 4px;
                margin-bottom: 15px;
                font-family: monospace;
            }
            
            #rtl-ltr-advanced-panel .button-group {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
            }
            
            #rtl-ltr-advanced-panel button {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
            }
            
            #rtl-ltr-advanced-panel #apply-toggle {
                background: #4285f4;
                color: white;
            }
            
            #rtl-ltr-advanced-panel #cancel-toggle {
                background: #f1f3f4;
                color: #3c4043;
            }
            
            #rtl-ltr-advanced-panel button:hover {
                opacity: 0.9;
            }
        `;
        document.head.appendChild(styles);
        document.body.appendChild(panel);
    }
    
    // Get element details
    const tagName = element.tagName.toLowerCase();
    const elementClasses = Array.from(element.classList).join('.');
    const elementId = element.id ? `#${element.id}` : '';
    
    // Populate panel content
    panel.innerHTML = `
        <div class="panel-header">Advanced Toggle Settings</div>
        <div class="panel-content">
            <div class="input-group">
                <label>Element Details:</label>
                <div class="element-details">
                    <span class="tag-name">${tagName}</span>
                    ${elementClasses ? `<span class="classes">.${elementClasses}</span>` : ''}
                    ${elementId ? `<span class="id">${elementId}</span>` : ''}
                </div>
                <label>CSS Selector:</label>
                <input type="text" id="css-selector-input" value="${cssSelector}" />
                <small class="hint">Edit the selector to target specific elements</small>
                
                <label>Custom CSS:</label>
                <textarea id="custom-css-input" placeholder="Enter additional CSS properties (e.g., text-align: right;)"></textarea>
                <small class="hint">Add custom CSS properties to apply to the selected elements</small>
            </div>
            <div class="domain-info">
                <small>Settings will be saved for: ${getCurrentDomain()}</small>
            </div>
            <div class="button-group">
                <button id="apply-toggle">Apply Settings</button>
                <button id="cancel-toggle">Cancel</button>
            </div>
        </div>
    `;
    
    panel.style.display = 'block';
    
    // Handle apply button click
    document.getElementById('apply-toggle').addEventListener('click', () => {
        const newSelector = document.getElementById('css-selector-input').value;
        const customCSS = document.getElementById('custom-css-input').value;
        
        try {
            const targetElements = document.querySelectorAll(newSelector);
            
            if (targetElements.length > 0) {
                const currentDirection = getComputedStyle(targetElements[0]).direction;
                const newDirection = currentDirection === 'rtl' ? 'ltr' : 'rtl';
                
                // Create a style block for the custom CSS if not exists
                let styleBlock = document.getElementById('rtl-ltr-custom-styles');
                if (!styleBlock) {
                    styleBlock = document.createElement('style');
                    styleBlock.id = 'rtl-ltr-custom-styles';
                    document.head.appendChild(styleBlock);
                }

                // Apply direction and custom CSS to all matching elements
                targetElements.forEach(el => {
                    el.style.direction = newDirection;
                    el.setAttribute('dir', newDirection);
                });

                // Add the custom CSS to the style block
                if (customCSS.trim()) {
                    const cssRule = `${newSelector} { direction: ${newDirection}; ${customCSS} }`;
                    styleBlock.textContent += cssRule;
                }
                
                saveSelectorSettings(newSelector, newDirection, customCSS);
                closeAdvancedPanel();
            } else {
                alert('No elements found with the specified selector. Please check your CSS selector.');
            }
        } catch (e) {
            alert('Invalid CSS selector. Please check your syntax.');
        }
    });
    
    // Handle cancel button click
    document.getElementById('cancel-toggle').addEventListener('click', closeAdvancedPanel);
    
    // Handle overlay click
    overlay.addEventListener('click', closeAdvancedPanel);
    
    // Handle escape key
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            closeAdvancedPanel();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
}

/**
 * Closes the advanced panel and removes the overlay
 */
function closeAdvancedPanel() {
    const panel = document.getElementById('rtl-ltr-advanced-panel');
    const overlay = document.querySelector('.rtl-ltr-overlay');
    
    if (panel) {
        panel.style.display = 'none';
    }
    
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Saves the direction settings for a selector in the current domain
 * @param {string} selector - CSS selector to save settings for
 * @param {string} direction - Text direction ('rtl' or 'ltr')
 * @param {string} customCSS - Custom CSS properties
 */
function saveSelectorSettings(selector, direction, customCSS) {
    const domain = getCurrentDomain();
    chrome.storage.local.get(domain, (items) => {
        const domainData = items[domain] || { selectors: {} };
        
        domainData.selectors[selector] = {
            direction: direction,
            customCSS: customCSS,
            lastUpdated: new Date().toISOString(),
            enabled: true
        };
        
        chrome.storage.local.set({
            [domain]: domainData
        }, () => {
            console.log('Saved direction settings:', {
                domain,
                selector,
                direction,
                customCSS
            });
        });
    });
}

/**
 * Toggles direction for the whole page
 * Saves the setting in storage and applies it to body and all its children
 */
function toggleWholePage() {
    const body = document.body;
    const currentDirection = getComputedStyle(body).direction;
    const newDirection = currentDirection === 'rtl' ? 'ltr' : 'rtl';
    
    // Create data object for the body
    const data = {
        direction: newDirection,
        customCSS: '',
        enabled: true
    };
    
    // Apply to body and all its children
    applyDirectionToElements('body, body *', data);
    
    // Save the settings
    saveSelectorSettings('body, body *', newDirection, '');
    
    // Show notification
    const notification = document.createElement('div');
    notification.className = 'rtl-ltr-notification';
    notification.textContent = `Page direction changed to ${newDirection.toUpperCase()}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

/**
 * Handles messages from the background script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);

    if (request.action === "toggleWholePage") {
        toggleWholePage();
    }
    else if (request.action === "toggleDirection") {
        // Handle enable/disable toggle from popup
        if (request.hasOwnProperty('enabled')) {
            const domain = getCurrentDomain();
            chrome.storage.local.get(domain, (items) => {
                const domainData = items[domain];
                if (domainData && domainData.selectors && domainData.selectors[request.selector]) {
                    const data = domainData.selectors[request.selector];
                    data.enabled = request.enabled;
                    applyDirectionToElements(request.selector, data);
                }
            });
        }
        // Handle normal direction toggle from context menu
        else {
            if (!lastClickedElement) {
                console.warn('No element was right-clicked!');
                return;
            }
            
            const element = lastClickedElement;
            console.log('Toggling direction for element:', {
                tagName: element.tagName,
                id: element.id,
                currentDirection: getComputedStyle(element).direction
            });

            const currentDirection = getComputedStyle(element).direction;
            const newDirection = currentDirection === 'rtl' ? 'ltr' : 'rtl';
            const selector = getCssSelector(element);
            
            // Create data object for the element
            const data = {
                direction: newDirection,
                customCSS: '',
                enabled: true
            };
            
            // Apply the direction change
            applyDirectionToElements(selector, data);
            
            // Save the settings
            saveSelectorSettings(selector, newDirection, '');
        }
    }
    else if (request.action === "showAdvancedToggle") {
        if (!lastClickedElement) {
            console.warn('No element was right-clicked!');
            return;
        }
        showAdvancedPanel(lastClickedElement);
    }
    else if (request.action === "updateSettings") {
        // Update direction and custom CSS for the specified selector
        const data = {
            direction: request.direction,
            customCSS: request.customCSS,
            enabled: true
        };
        
        // Apply the updated settings immediately
        applyDirectionToElements(request.selector, data);
    }
    else if (request.action === "removeDirection") {
        // Remove direction and custom CSS from the specified selector
        removeDirectionFromElements(request.selector);
    }
    else if (request.action === "confirmClearSettings") {
        // Show confirmation dialog
        if (confirm('Are you sure you want to delete all saved settings?')) {
            // Send confirmation back to background script
            chrome.runtime.sendMessage({
                action: "clearSettingsConfirmed"
            });
        }
    }
    else if (request.action === "settingsCleared") {
        console.log('Clearing all direction settings');
        const currentDomain = getCurrentDomain();
        // Remove domain settings
        chrome.storage.local.remove(currentDomain, () => {
            // Remove all custom directions from the page
            const elements = document.querySelectorAll('[style*="direction"]');
            elements.forEach(element => {
                element.style.removeProperty('direction');
                element.removeAttribute('dir');
            });
            
            // Show notification
            const notification = document.createElement('div');
            notification.className = 'rtl-ltr-notification';
            notification.textContent = `All saved direction settings for ${currentDomain} have been cleared`;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        });
    }
    else if (request.action === "addVazirFont") {
        toggleVazirFont();
    }

    // Always send a response
    sendResponse({ received: true });
});

/**
 * Toggles Vazir font on the page
 */
function toggleVazirFont() {
    try {
        let styleBlock = document.getElementById('rtl-ltr-vazir-font');
        
        if (styleBlock && styleBlock.textContent) {
            // Font is active, remove it
            styleBlock.textContent = '';
            showNotification('Vazir font has been removed');
        } else {
            // Add Google Fonts link if not already added
            if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Vazirmatn"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100;200;300;400;500;600;700;800;900&display=swap';
                document.head.appendChild(link);
            }

            // Create or update style for default font
            if (!styleBlock) {
                styleBlock = document.createElement('style');
                styleBlock.id = 'rtl-ltr-vazir-font';
                document.head.appendChild(styleBlock);
            }

            // Apply Vazir font to all elements
            styleBlock.textContent = `
                * {
                    font-family: 'Vazirmatn', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif !important;
                }
            `;
            showNotification('Vazir font has been added to the page');
        }
    } catch (error) {
        console.error('Error toggling Vazir font:', error);
        showNotification('Error toggling Vazir font: ' + error.message, 'error');
    }
}

/**
 * Shows a notification to the user
 * @param {string} message - Notification message
 * @param {string} type - Notification type (optional, default: 'info')
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `rtl-ltr-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
