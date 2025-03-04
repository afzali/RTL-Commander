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
        if (elements.length === 0) {
            console.log('No elements found for selector:', selector);
            return;
        }

        console.log('Applying direction to elements:', {
            selector,
            data,
            elementsFound: elements.length
        });

        // Create unique style ID for this selector
        const styleId = `rtl-ltr-style-${btoa(selector)}`;
        
        // Remove existing style block if any
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
            existingStyle.remove();
        }

        // Only apply if enabled
        if (data.enabled !== false) {
            // Create new style block with higher specificity
            const styleBlock = document.createElement('style');
            styleBlock.id = styleId;
            
            // Create CSS rule with higher specificity by repeating the selector
            let cssRule = `${selector}, ${selector}, ${selector} {`;
            
            // Add direction
            if (data.direction) {
                cssRule += ` direction: ${data.direction} !important;`;
                
                // Add text alignment based on direction if not specified in custom CSS
                if (!data.customCSS || !data.customCSS.includes('text-align')) {
                    if (data.direction === 'rtl') {
                        cssRule += ` text-align: right !important;`;
                    } else if (data.direction === 'ltr') {
                        cssRule += ` text-align: left !important;`;
                    }
                }
            }
            
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
                    if (!data.customCSS || !data.customCSS.includes('text-align')) {
                        if (data.direction === 'rtl') {
                            element.style.setProperty('text-align', 'right', 'important');
                        } else if (data.direction === 'ltr') {
                            element.style.setProperty('text-align', 'left', 'important');
                        }
                    }
                }
                
                // Apply custom CSS properties as inline styles
                if (data.customCSS) {
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
        }

        // Show notification only for user-initiated changes
        if (!window.suppressNotifications) {
            showNotification(`Direction ${data.enabled !== false ? 'applied' : 'removed'} for ${elements.length} elements`);
        }
    } catch (error) {
        console.error('Error in applyDirectionToElements:', error, {
            selector,
            data
        });
        showNotification('Error applying direction: ' + error.message, 'error');
    }
}

/**
 * Removes direction and custom CSS from elements matching a selector
 * @param {string} selector - CSS selector
 */
function removeDirectionFromElements(selector) {
    try {
        // Remove style block
        const styleId = `rtl-ltr-style-${btoa(selector)}`;
        const styleBlock = document.getElementById(styleId);
        if (styleBlock) {
            styleBlock.remove();
        }

        // Reset elements
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            element.classList.remove('rtl-extension-modified');
            element.removeAttribute('data-rtl-selector');
            
            // Restore original direction if it was stored
            const originalDirection = element.getAttribute('data-original-direction');
            if (originalDirection) {
                // Remove inline style properties
                element.style.removeProperty('direction');
                element.style.removeProperty('text-align');
                
                // Clean up any custom CSS properties that might have been applied
                if (element.hasAttribute('style') && element.getAttribute('style').trim() !== '') {
                    // Keep the original style attribute but remove our custom properties
                    // We can't know all possible properties, but we'll remove the common RTL-related ones
                    element.style.removeProperty('unicode-bidi');
                    element.style.removeProperty('text-orientation');
                    element.style.removeProperty('writing-mode');
                }
                
                // Set the original direction back
                element.style.direction = originalDirection;
                element.removeAttribute('data-original-direction');
            }
        });

        console.log('Removed direction from elements:', {
            selector,
            elementsAffected: elements.length
        });
    } catch (error) {
        console.error('Error in removeDirectionFromElements:', error, {
            selector
        });
    }
}

/**
 * Saves the direction settings for a selector in the current domain
 * @param {string} selector - CSS selector to save settings for
 * @param {string} direction - Text direction ('rtl' or 'ltr')
 * @param {string} customCSS - Custom CSS properties
 */
function saveSelectorSettings(selector, direction, customCSS) {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
        console.warn('Extension context invalidated before storage operation');
        return;
    }

    const domain = getCurrentDomain();
    console.log('Saving settings for domain:', domain, 'selector:', selector);

    // Ensure selector is a valid string
    if (!selector || typeof selector !== 'string') {
        console.error('Invalid selector:', selector);
        return;
    }

    chrome.storage.local.get([domain], (result) => {
        if (chrome.runtime.lastError) {
            console.error('Storage error:', chrome.runtime.lastError);
            return;
        }

        try {
            // Initialize domain data if it doesn't exist
            let domainData = result[domain] || {};
            if (!domainData.selectors) {
                domainData.selectors = {};
            }

            // Create or update the selector settings
            domainData.selectors[selector] = {
                direction: direction,
                customCSS: customCSS || '',
                enabled: true,
                timestamp: new Date().getTime()
            };

            // Save the updated settings
            const dataToSave = { [domain]: domainData };
            console.log('Saving data:', dataToSave);

            chrome.storage.local.set(dataToSave, () => {
                if (chrome.runtime.lastError) {
                    console.error('Failed to save settings:', chrome.runtime.lastError);
                    return;
                }
                console.log('Settings saved successfully for:', selector);
                // Apply the settings immediately
                applyDirectionToElements(selector, domainData.selectors[selector]);
            });
        } catch (error) {
            console.error('Error while saving settings:', error);
        }
    });
}

// Initialize when page loads
function initializeSettings() {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
        console.warn('Extension context is invalid. Please refresh the page.');
        return;
    }

    const domain = getCurrentDomain();
    console.log('Initializing settings for domain:', domain);

    chrome.storage.local.get([domain], (result) => {
        if (chrome.runtime.lastError) {
            console.error('Storage error:', chrome.runtime.lastError);
            return;
        }

        try {
            const domainData = result[domain];
            console.log('Retrieved settings:', domainData);

            if (domainData && domainData.selectors) {
                // First remove any existing styles to prevent conflicts
                Object.entries(domainData.selectors).forEach(([selector, data]) => {
                    try {
                        if (data.enabled !== false) {
                            // First remove any existing direction to ensure clean application
                            removeDirectionFromElements(selector);
                        }
                    } catch (error) {
                        console.error('Error removing existing styles for selector:', selector, error);
                    }
                });
                
                // Add a small delay to ensure DOM is fully processed
                setTimeout(() => {
                    Object.entries(domainData.selectors).forEach(([selector, data]) => {
                        try {
                            if (data.enabled !== false) {
                                console.log('Applying settings for selector:', selector, data);
                                applyDirectionToElements(selector, {
                                    direction: data.direction,
                                    customCSS: data.customCSS || ''
                                });
                            }
                        } catch (error) {
                            console.error('Error applying settings for selector:', selector, error);
                        }
                    });
                }, 50); // Small delay to ensure DOM is ready
            }
        } catch (error) {
            console.error('Error while initializing settings:', error);
        }
    });
}

// Make sure we initialize at the right time
function initializeExtension() {
    console.log('Initializing RTL Commander extension...');
    
    // Initialize immediately and also after DOM is ready
    initializeSettings();
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeSettings();
            // Add a second initialization with a delay to catch late-loading elements
            setTimeout(initializeSettings, 500);
            initializeObserver();
        });
    } else {
        initializeSettings();
        // Add a second initialization with a delay to catch late-loading elements
        setTimeout(initializeSettings, 500);
        initializeObserver();
    }
    
    // Add one more initialization after window load event
    window.addEventListener('load', () => {
        setTimeout(initializeSettings, 1000);
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
        // Debounce the processing of mutations
        if (window.rtlObserverTimeout) {
            clearTimeout(window.rtlObserverTimeout);
        }

        window.rtlObserverTimeout = setTimeout(() => {
            chrome.storage.local.get(window.location.hostname, (items) => {
                if (chrome.runtime.lastError) {
                    console.error('Storage error:', chrome.runtime.lastError);
                    return;
                }

                const domainData = items[window.location.hostname];
                if (domainData && domainData.selectors) {
                    // Suppress notifications during observer updates
                    window.suppressNotifications = true;

                    // Check if any significant mutations occurred that might affect our elements
                    let significantChanges = false;
                    mutations.forEach(mutation => {
                        if (mutation.addedNodes.length > 0 || 
                            (mutation.type === 'attributes' && 
                             (mutation.attributeName === 'style' || 
                              mutation.attributeName === 'class' || 
                              mutation.attributeName === 'dir'))) {
                            significantChanges = true;
                        }
                    });

                    // If significant changes occurred, reapply all settings
                    if (significantChanges) {
                        Object.entries(domainData.selectors).forEach(([selector, data]) => {
                            try {
                                if (data.enabled !== false) {
                                    // First remove any existing direction to ensure clean application
                                    removeDirectionFromElements(selector);
                                    // Then apply the direction again
                                    applyDirectionToElements(selector, data);
                                }
                            } catch (error) {
                                console.error('Error reapplying settings for selector:', selector, error);
                            }
                        });
                    } else {
                        // Otherwise just process added nodes
                        mutations.forEach(mutation => {
                            mutation.addedNodes.forEach(node => {
                                if (node.nodeType === Node.ELEMENT_NODE) {
                                    Object.entries(domainData.selectors).forEach(([selector, data]) => {
                                        try {
                                            if (data.enabled !== false) {
                                                // Check if the new node matches our selector
                                                if (node.matches && node.matches(selector)) {
                                                    // Skip if the node is already being processed
                                                    if (!node.hasAttribute('data-rtl-processing')) {
                                                        node.setAttribute('data-rtl-processing', 'true');
                                                        applyDirectionToElements(selector, data);
                                                        node.removeAttribute('data-rtl-processing');
                                                    }
                                                }
                                                // Check children of the new node
                                                const matches = node.querySelectorAll(selector);
                                                if (matches.length > 0) {
                                                    matches.forEach(match => {
                                                        if (!match.hasAttribute('data-rtl-processing')) {
                                                            match.setAttribute('data-rtl-processing', 'true');
                                                            applyDirectionToElements(selector, data);
                                                            match.removeAttribute('data-rtl-processing');
                                                        }
                                                    });
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

                    // Re-enable notifications after processing
                    window.suppressNotifications = false;
                }
            });
        }, 100); // Debounce for 100ms
    });

    try {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true, // Also observe attribute changes
            attributeFilter: ['style', 'class', 'dir'], // Only these attributes
            characterData: false // Don't observe text content changes
        });
        console.log('Observer started successfully');
    } catch (error) {
        console.error('Error starting observer:', error);
    }
}

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
// Check extension context before setting up message listener
if (chrome.runtime?.id) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        // Check if extension is still valid before processing message
        if (!chrome.runtime?.id) {
            console.warn('Extension context invalidated during message processing');
            return;
        }

        console.log('Content script received message:', request);

        try {
            if (request.action === "toggleWholePage") {
                toggleWholePage();
            }
            else if (request.action === "toggleDirection") {
                // Handle enable/disable toggle from popup
                if (request.hasOwnProperty('enabled')) {
                    const domain = getCurrentDomain();
                    
                    // Check extension context again before storage operation
                    if (!chrome.runtime?.id) {
                        console.warn('Extension context invalidated before storage operation');
                        return;
                    }

                    chrome.storage.local.get(domain, (items) => {
                        if (chrome.runtime.lastError) {
                            console.error('Storage error:', chrome.runtime.lastError);
                            return;
                        }

                        // Check extension context again after storage operation
                        if (!chrome.runtime?.id) {
                            console.warn('Extension context invalidated after storage operation');
                            return;
                        }

                        const domainData = items[domain];
                        if (domainData && domainData.selectors && domainData.selectors[request.selector]) {
                            const data = domainData.selectors[request.selector];
                            data.enabled = request.enabled;
                            
                            // Wrap storage operation in try-catch
                            try {
                                chrome.storage.local.set({ [domain]: domainData }, () => {
                                    if (chrome.runtime.lastError) {
                                        console.error('Failed to save settings:', chrome.runtime.lastError);
                                        return;
                                    }
                                    applyDirectionToElements(request.selector, data);
                                });
                            } catch (error) {
                                console.error('Error saving settings:', error);
                            }
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
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });
}

/**
 * Creates a font application preference dialog
 */
function createFontDialog() {
    // Remove existing dialog if any
    const existingDialog = document.getElementById('rtl-ltr-font-dialog');
    if (existingDialog) {
        existingDialog.remove();
    }

    // Create dialog
    const dialog = document.createElement('div');
    dialog.id = 'rtl-ltr-font-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 999999;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    dialog.innerHTML = `
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Vazir Font Application</h3>
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #666;">How would you like to apply the Vazir font?</p>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="rtl-ltr-font-advanced" style="padding: 8px 12px; border: 1px solid #ddd; background: #f8f9fa; border-radius: 4px; cursor: pointer;">For Advanced CSS</button>
            <button id="rtl-ltr-font-default" style="padding: 8px 12px; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">As Default Font</button>
        </div>
    `;

    // Add overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 999998;
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);

    return new Promise((resolve) => {
        dialog.querySelector('#rtl-ltr-font-default').addEventListener('click', () => {
            overlay.remove();
            dialog.remove();
            resolve('default');
        });

        dialog.querySelector('#rtl-ltr-font-advanced').addEventListener('click', () => {
            overlay.remove();
            dialog.remove();
            resolve('advanced');
        });

        overlay.addEventListener('click', () => {
            overlay.remove();
            dialog.remove();
            resolve('cancel');
        });
    });
}

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

            // Ask user for preference
            createFontDialog().then(preference => {
                if (preference === 'default') {
                    // Apply Vazir font to all elements
                    styleBlock.textContent = `
                        * {
                            font-family: 'Vazirmatn', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                        }
                    `;
                    showNotification('Vazir font has been set as the default font');
                } else if (preference === 'advanced') {
                    // Just add the font without applying it
                    styleBlock.textContent = ''; // Empty style block to indicate font is loaded
                    showNotification('Vazir font is now available for custom CSS');
                } else {
                    // User cancelled
                    if (!document.querySelector('#rtl-ltr-vazir-font:not(:empty)')) {
                        styleBlock.remove(); // Remove empty style block
                    }
                    showNotification('Font application cancelled');
                }
            });
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

// Start initialization
initializeExtension();

// Handle SPA navigation
window.addEventListener('popstate', initializeSettings);
window.addEventListener('hashchange', initializeSettings);
