// Helper function to get XPath of an element
function getXPath(element) {
    // Handle null or undefined element
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
        return '';
    }

    // If element has ID, use it (but check for valid ID)
    if (element.id && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(element.id)) {
        return `//*[@id="${element.id}"]`;
    }

    // If we reached the body, return its path
    if (element === document.body) {
        return '/html/body';
    }

    // Get the element's position among its siblings
    let ix = 0;
    let siblings = element.parentNode?.childNodes || [];

    for (let i = 0; i < siblings.length; i++) {
        let sibling = siblings[i];
        if (sibling === element) {
            let parentPath = element.parentNode ? getXPath(element.parentNode) : '';
            if (!parentPath) return ''; // If parent path is invalid, return empty
            return `${parentPath}/${element.tagName.toLowerCase()}[${ix + 1}]`;
        }
        if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === element.tagName) {
            ix++;
        }
    }

    return ''; // Return empty if path cannot be determined
}

// Helper function to get current domain
function getCurrentDomain() {
    return window.location.hostname;
}

// Helper function to get CSS selector
function getCssSelector(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
        return '';
    }

    if (element.id && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(element.id)) {
        return '#' + element.id;
    }
    
    let path = [];
    while (element.nodeType === Node.ELEMENT_NODE) {
        let selector = element.nodeName.toLowerCase();
        if (element.id && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(element.id)) {
            selector += '#' + element.id;
            path.unshift(selector);
            break;
        } else {
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
        
        if (!element || element === document.body) break;
    }
    return path.join(' > ');
}

// Store the last right-clicked element
let lastClickedElement = null;

// Add click listener to track right-clicked element
document.addEventListener('contextmenu', function(e) {
    lastClickedElement = e.target;
    console.log('Right-clicked element:', {
        tagName: e.target.tagName,
        id: e.target.id,
        className: e.target.className,
        text: e.target.textContent?.substring(0, 50)
    });
});

// Load saved directions on page load
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

// Create and show advanced toggle panel
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

    let panel = document.getElementById('rtl-ltr-advanced-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'rtl-ltr-advanced-panel';
        document.body.appendChild(panel);
    }
    
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
    
    // Add event listeners
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
    
    document.getElementById('cancel-toggle').addEventListener('click', () => {
        panel.style.display = 'none';
    });
}

// Save selector settings for current domain
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

// Handle messages from background script
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
