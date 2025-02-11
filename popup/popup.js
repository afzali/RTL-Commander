/**
 * RTL-LTR Controller Popup Script
 */

document.addEventListener('DOMContentLoaded', async () => {
    const savedElementsContainer = document.getElementById('element-list');

    // Get the current tab's domain
    async function getCurrentTabDomain() {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = new URL(tabs[0].url);
        return url.hostname;
    }

    // Load and display saved elements for the current domain
    async function loadSavedElements() {
        const domain = await getCurrentTabDomain();
        savedElementsContainer.innerHTML = '';

        chrome.storage.local.get(domain, (items) => {
            const domainData = items[domain];
            if (!domainData || !domainData.selectors || Object.keys(domainData.selectors).length === 0) {
                savedElementsContainer.innerHTML = '<li class="no-items">No saved elements for this domain</li>';
                return;
            }

            Object.entries(domainData.selectors).forEach(([selector, data]) => {
                const li = document.createElement('li');
                li.className = 'element-item';
                
                const time = new Date(data.lastUpdated).toLocaleString();
                
                li.innerHTML = `
                    <div class="element-info">
                        <div class="selector">${selector}</div>
                        <div class="direction ${data.direction}">${data.direction.toUpperCase()}</div>
                    </div>
                    <div class="meta-info">
                        <span class="domain">${domain}</span>
                        <span class="time">${time}</span>
                    </div>
                    <button class="remove-btn" data-selector="${selector}">×</button>
                `;
                
                savedElementsContainer.appendChild(li);
            });

            // Add remove button handlers
            document.querySelectorAll('.remove-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const selector = e.target.dataset.selector;
                    
                    // Remove from storage
                    const domain = await getCurrentTabDomain();
                    chrome.storage.local.get(domain, (items) => {
                        const domainData = items[domain];
                        if (domainData && domainData.selectors) {
                            delete domainData.selectors[selector];
                            
                            // If no more selectors, remove the domain entry
                            if (Object.keys(domainData.selectors).length === 0) {
                                chrome.storage.local.remove(domain);
                            } else {
                                chrome.storage.local.set({ [domain]: domainData });
                            }
                            
                            // Remove from current tab
                            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                                chrome.tabs.sendMessage(tabs[0].id, {
                                    action: "removeDirection",
                                    selector: selector
                                });
                            });
                            
                            // Refresh the list
                            loadSavedElements();
                        }
                    });
                });
            });
        });
    }

    // Clear all settings for current domain
    document.getElementById('clear-all').addEventListener('click', async () => {
        const domain = await getCurrentTabDomain();
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
    });

    // Initial load
    loadSavedElements();

    // Listen for storage changes
    chrome.storage.onChanged.addListener(() => {
        loadSavedElements();
    });
});
