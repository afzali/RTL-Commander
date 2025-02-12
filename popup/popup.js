/**
 * RTL-LTR Controller Popup Script
 */

document.addEventListener('DOMContentLoaded', async () => {
    const savedElementsContainer = document.getElementById('element-list');
    savedElementsContainer.style.overflowY = 'auto';
    savedElementsContainer.style.maxHeight = '300px';

    // Get the current tab's domain
    async function getCurrentTabDomain() {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = new URL(tabs[0].url);
        return url.hostname;
    }

    // Load and display saved elements for the current domain
    async function loadSavedElements() {
        const domain = await getCurrentTabDomain();
        
        // Completely clear the container
        savedElementsContainer.replaceChildren();

        chrome.storage.local.get(domain, (items) => {
            const domainData = items[domain];
            if (!domainData || !domainData.selectors || Object.keys(domainData.selectors).length === 0) {
                const noItems = document.createElement('li');
                noItems.className = 'no-items';
                noItems.textContent = 'No saved elements for this domain';
                savedElementsContainer.appendChild(noItems);
                return;
            }

            // Sort entries by lastUpdated time (newest first)
            const sortedEntries = Object.entries(domainData.selectors)
                .sort(([, a], [, b]) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

            // Create document fragment for better performance
            const fragment = document.createDocumentFragment();

            sortedEntries.forEach(([selector, data]) => {
                const li = document.createElement('li');
                li.className = 'element-item';
                
                const time = new Date(data.lastUpdated).toLocaleString();
                const isEnabled = data.enabled !== false; // Default to true if not set
                
                // Create elements instead of using innerHTML for better control
                const elementInfo = document.createElement('div');
                elementInfo.className = 'element-info';

                const selectorDiv = document.createElement('div');
                selectorDiv.className = 'selector';
                selectorDiv.textContent = selector;

                const directionDiv = document.createElement('div');
                directionDiv.className = `direction ${data.direction}`;
                directionDiv.textContent = data.direction.toUpperCase();

                elementInfo.appendChild(selectorDiv);
                elementInfo.appendChild(directionDiv);

                const metaInfo = document.createElement('div');
                metaInfo.className = 'meta-info';

                const domainSpan = document.createElement('span');
                domainSpan.className = 'domain';
                domainSpan.textContent = domain;

                const timeSpan = document.createElement('span');
                timeSpan.className = 'time';
                timeSpan.textContent = time;

                const switchLabel = document.createElement('label');
                switchLabel.className = 'switch';
                
                const toggleInput = document.createElement('input');
                toggleInput.type = 'checkbox';
                toggleInput.className = 'toggle-switch';
                toggleInput.dataset.selector = selector;
                toggleInput.checked = isEnabled;

                const sliderSpan = document.createElement('span');
                sliderSpan.className = 'slider round';

                switchLabel.appendChild(toggleInput);
                switchLabel.appendChild(sliderSpan);

                metaInfo.appendChild(domainSpan);
                metaInfo.appendChild(timeSpan);
                metaInfo.appendChild(switchLabel);

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.dataset.selector = selector;
                removeBtn.textContent = '×';

                // Add remove button handler
                removeBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const selector = e.target.dataset.selector;
                    
                    if (confirm('Are you sure you want to delete this setting?')) {
                        const domain = await getCurrentTabDomain();
                        chrome.storage.local.get(domain, (items) => {
                            const domainData = items[domain];
                            if (domainData && domainData.selectors) {
                                delete domainData.selectors[selector];
                                
                                // Remove from current tab first
                                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                                    chrome.tabs.sendMessage(tabs[0].id, {
                                        action: "removeDirection",
                                        selector: selector
                                    });
                                });

                                // Then update storage
                                const promise = Object.keys(domainData.selectors).length === 0
                                    ? chrome.storage.local.remove(domain)
                                    : chrome.storage.local.set({ [domain]: domainData });

                                // Wait for storage update to complete before refreshing list
                                promise.then(() => {
                                    loadSavedElements();
                                });
                            }
                        });
                    }
                });

                // Add toggle switch handler
                toggleInput.addEventListener('change', async (e) => {
                    const selector = e.target.dataset.selector;
                    const isEnabled = e.target.checked;
                    
                    const domain = await getCurrentTabDomain();
                    chrome.storage.local.get(domain, (items) => {
                        const domainData = items[domain];
                        if (domainData && domainData.selectors && domainData.selectors[selector]) {
                            domainData.selectors[selector].enabled = isEnabled;
                            chrome.storage.local.set({ [domain]: domainData }).then(() => {
                                // Update the page
                                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                                    chrome.tabs.sendMessage(tabs[0].id, {
                                        action: "toggleDirection",
                                        selector: selector,
                                        enabled: isEnabled
                                    });
                                });
                            });
                        }
                    });
                });

                li.appendChild(elementInfo);
                li.appendChild(metaInfo);
                li.appendChild(removeBtn);
                
                fragment.appendChild(li);
            });

            // Replace all content with new fragment
            savedElementsContainer.replaceChildren(fragment);
        });
    }

    // Clear all settings for current domain
    document.getElementById('clear-all').addEventListener('click', async () => {
        const domain = await getCurrentTabDomain();
        
        // Show confirmation dialog with clear message
        const userConfirmed = confirm('Are you sure you want to delete all saved settings?');
        
        // Only proceed if user confirmed
        if (userConfirmed === true) {
            chrome.storage.local.remove(domain, () => {
                // Notify content script
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "settingsCleared"
                    });
                });
                
                // Refresh the list
                loadSavedElements();
            });
        }
    });

    // Initial load
    loadSavedElements();

    // Listen for storage changes
    chrome.storage.onChanged.addListener(() => {
        loadSavedElements();
    });
});
