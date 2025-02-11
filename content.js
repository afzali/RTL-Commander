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
                    try {
                        const element = document.querySelector(selector);
                        if (element) {
                            console.log('Applying direction to element:', selector);
                            element.style.direction = data.direction;
                            element.setAttribute('dir', data.direction);
                        }
                    } catch (e) {
                        console.error('Invalid selector:', selector);
                    }
                });
            }
        });
    });
});

/**
 * Creates and displays the advanced settings panel
 * @param {Element} element - The element to generate settings for
 */
function showAdvancedPanel(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
        console.error('Invalid element for advanced panel');
        return;
    }

    const cssSelector = getCssSelector(element);
    if (!cssSelector) {
        console.error('Could not generate valid selector for element');
        return;
    }

    // Create or reuse panel element
    let panel = document.getElementById('rtl-ltr-advanced-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'rtl-ltr-advanced-panel';
        document.body.appendChild(panel);
    }
    
    // Populate panel content
    panel.innerHTML = `
        <div class="panel-header">Advanced Toggle Settings</div>
        <div class="panel-content">
            <div class="input-group">
                <label>CSS Selector:</label>
                <input type="text" id="css-selector-input" value="${cssSelector}" />
                <small class="hint">Edit the selector to target specific elements</small>
            </div>
            <div class="domain-info">
                <small>Settings will be saved for: ${getCurrentDomain()}</small>
            </div>
            <div class="button-group">
                <button id="apply-toggle">Apply Toggle</button>
                <button id="cancel-toggle">Cancel</button>
            </div>
        </div>
    `;
    
    panel.style.display = 'block';
    
    // Handle apply button click
    document.getElementById('apply-toggle').addEventListener('click', () => {
        const newSelector = document.getElementById('css-selector-input').value;
        try {
            const targetElement = document.querySelector(newSelector);
            
            if (targetElement) {
                const currentDirection = getComputedStyle(targetElement).direction;
                const newDirection = currentDirection === 'rtl' ? 'ltr' : 'rtl';
                
                targetElement.style.direction = newDirection;
                targetElement.setAttribute('dir', newDirection);
                
                saveSelectorSettings(newSelector, newDirection);
                panel.style.display = 'none';
            } else {
                alert('No element found with the specified selector. Please check your CSS selector.');
            }
        } catch (e) {
            alert('Invalid CSS selector. Please check your syntax.');
        }
    });
    
    // Handle cancel button click
    document.getElementById('cancel-toggle').addEventListener('click', () => {
        panel.style.display = 'none';
    });
}

/**
 * Saves the direction settings for a selector in the current domain
 * @param {string} selector - CSS selector to save settings for
 * @param {string} direction - Text direction ('rtl' or 'ltr')
 */
function saveSelectorSettings(selector, direction) {
    const domain = getCurrentDomain();
    chrome.storage.local.get(domain, (items) => {
        const domainData = items[domain] || { selectors: {} };
        domainData.selectors[selector] = {
            direction: direction,
            lastUpdated: new Date().toISOString()
        };
        
        chrome.storage.local.set({
            [domain]: domainData
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving settings:', chrome.runtime.lastError);
            }
        });
    });
}

/**
 * Handles messages from the background script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);

    if (request.action === "toggleDirection") {
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
        
        element.style.direction = newDirection;
        element.setAttribute('dir', newDirection);

        saveSelectorSettings(getCssSelector(element), newDirection);
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
