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
    if (!data.enabled) {
        removeDirectionFromElements(selector);
        return;
    }

    try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            console.log('Applying direction to elements:', selector);
            elements.forEach(element => {
                element.style.direction = data.direction;
                element.setAttribute('dir', data.direction);
            });

            // Apply custom CSS if exists
            if (data.customCSS) {
                let styleBlock = document.getElementById('rtl-ltr-custom-styles');
                if (!styleBlock) {
                    styleBlock = document.createElement('style');
                    styleBlock.id = 'rtl-ltr-custom-styles';
                    document.head.appendChild(styleBlock);
                }
                // Remove any existing rule for this selector
                styleBlock.textContent = styleBlock.textContent.replace(
                    new RegExp(`${selector}\\s*{[^}]*}`, 'g'),
                    ''
                );
                // Add the new rule
                const cssRule = `${selector} { direction: ${data.direction}; ${data.customCSS} }`;
                styleBlock.textContent += cssRule;
            }
        }
    } catch (e) {
        console.error('Invalid selector:', selector);
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
            element.style.removeProperty('direction');
            element.removeAttribute('dir');
        });

        // Remove custom CSS if exists
        const styleBlock = document.getElementById('rtl-ltr-custom-styles');
        if (styleBlock) {
            styleBlock.textContent = styleBlock.textContent.replace(
                new RegExp(`${selector}\\s*{[^}]*}`, 'g'),
                ''
            );
        }
    } catch (e) {
        console.error('Invalid selector:', selector);
    }
}

/**
 * Loads and applies saved direction settings for the current domain
 * Called when the page loads
 */
window.addEventListener('load', () => {
    console.log('Page loaded, restoring directions');
    const currentDomain = getCurrentDomain();
    chrome.storage.local.get(null, (items) => {
        console.log('Loaded stored items:', items);
        Object.entries(items).forEach(([domain, domainData]) => {
            // Only apply settings for current domain
            if (domain === currentDomain && domainData.selectors) {
                Object.entries(domainData.selectors).forEach(([selector, data]) => {
                    applyDirectionToElements(selector, data);
                });
            }
        });
    });
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
 * Handles messages from the background script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);

    if (request.action === "toggleDirection") {
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

    // Always send a response
    sendResponse({ received: true });
});
