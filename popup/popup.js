/**
 * RTL-LTR Controller Popup Script
 */

document.addEventListener('DOMContentLoaded', async () => {
    const savedElementsContainer = document.getElementById('element-list');
    const editDialog = document.getElementById('editDialog');
    const overlay = document.getElementById('overlay');
    let currentSelector = null;

    // Close all menus when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.more-options-btn') && !e.target.closest('.more-options-menu')) {
            document.querySelectorAll('.more-options-menu').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });

    // Close edit dialog
    function closeEditDialog() {
        editDialog.classList.remove('show');
        overlay.classList.remove('show');
        currentSelector = null;
    }

    // Add event listeners for edit dialog buttons
    document.getElementById('cancelEdit').addEventListener('click', closeEditDialog);
    
    document.getElementById('saveEdit').addEventListener('click', async () => {
        if (!currentSelector) return;

        const direction = document.getElementById('editDirection').value;
        const customCSS = document.getElementById('editCustomCSS').value;
        const domain = await getCurrentTabDomain();

        chrome.storage.local.get(domain, (items) => {
            const domainData = items[domain];
            if (domainData && domainData.selectors && domainData.selectors[currentSelector]) {
                // Update settings
                domainData.selectors[currentSelector].direction = direction;
                domainData.selectors[currentSelector].customCSS = customCSS;
                domainData.selectors[currentSelector].lastUpdated = new Date().toISOString();

                chrome.storage.local.set({ [domain]: domainData }, () => {
                    // Update the page
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: "updateSettings",
                            selector: currentSelector,
                            direction: direction,
                            customCSS: customCSS
                        });
                    });

                    // Close dialog and refresh list
                    closeEditDialog();
                    loadSavedElements();
                });
            }
        });
    });

    // Close dialog when clicking overlay
    overlay.addEventListener('click', closeEditDialog);

    // Show edit dialog
    function showEditDialog(selector, data) {
        currentSelector = selector;
        document.getElementById('editSelector').value = selector;
        document.getElementById('editDirection').value = data.direction;
        document.getElementById('editCustomCSS').value = data.customCSS || '';
        
        editDialog.classList.add('show');
        overlay.classList.add('show');
    }

    // Get the current tab's domain
    async function getCurrentTabDomain() {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = new URL(tabs[0].url);
        return url.hostname;
    }

    // Load and display saved elements for the current domain
    async function loadSavedElements() {
        const domain = await getCurrentTabDomain();
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

            const sortedEntries = Object.entries(domainData.selectors)
                .sort(([, a], [, b]) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

            const fragment = document.createDocumentFragment();

            sortedEntries.forEach(([selector, data]) => {
                const li = document.createElement('li');
                li.className = 'element-item';
                
                const time = new Date(data.lastUpdated).toLocaleString();
                const isEnabled = data.enabled !== false;

                // Create elements
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

                // Add more options button and menu
                const moreOptionsBtn = document.createElement('button');
                moreOptionsBtn.className = 'more-options-btn';
                moreOptionsBtn.innerHTML = '⋮';
                moreOptionsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const menu = li.querySelector('.more-options-menu');
                    document.querySelectorAll('.more-options-menu').forEach(m => {
                        if (m !== menu) m.classList.remove('show');
                    });
                    menu.classList.toggle('show');
                });

                const moreOptionsMenu = document.createElement('div');
                moreOptionsMenu.className = 'more-options-menu';
                moreOptionsMenu.innerHTML = `
                    <ul>
                        <li class="edit-option">Edit Settings</li>
                        <li class="delete-option">Delete</li>
                    </ul>
                `;

                // Add event listeners for menu options
                const editOption = moreOptionsMenu.querySelector('.edit-option');
                editOption.addEventListener('click', () => {
                    showEditDialog(selector, data);
                    moreOptionsMenu.classList.remove('show');
                });

                const deleteOption = moreOptionsMenu.querySelector('.delete-option');
                deleteOption.addEventListener('click', async () => {
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

                                promise.then(() => {
                                    loadSavedElements();
                                });
                            }
                        });
                    }
                    moreOptionsMenu.classList.remove('show');
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
                li.appendChild(moreOptionsBtn);
                li.appendChild(moreOptionsMenu);
                
                fragment.appendChild(li);
            });

            savedElementsContainer.replaceChildren(fragment);
        });
    }

    // Clear all settings
    document.getElementById('clear-all').addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete all saved settings?')) {
            const domain = await getCurrentTabDomain();
            chrome.storage.local.remove(domain, () => {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "settingsCleared"
                    });
                });
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
