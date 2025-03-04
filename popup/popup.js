/**
 * RTL-LTR Controller Popup Script
 */

document.addEventListener('DOMContentLoaded', async () => {
    const savedElementsContainer = document.getElementById('element-list');
    const allDomainsContainer = document.getElementById('all-domains-list');
    const editDialog = document.getElementById('editDialog');
    const overlay = document.getElementById('overlay');
    let currentSelector = null;
    let currentDomain = null;

    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Setup tab navigation
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show the selected tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                }
            });
            
            // Load content based on selected tab
            if (tabName === 'current-domain') {
                loadSavedElements();
            } else if (tabName === 'all-domains') {
                loadAllDomains();
            }
        });
    });

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
        currentDomain = null;
    }

    // Add event listeners for edit dialog buttons
    document.getElementById('cancelEdit').addEventListener('click', closeEditDialog);
    
    document.getElementById('saveEdit').addEventListener('click', async () => {
        if (!currentSelector || !currentDomain) return;

        const direction = document.getElementById('editDirection').value;
        const customCSS = document.getElementById('editCustomCSS').value;

        chrome.storage.local.get(currentDomain, (items) => {
            const domainData = items[currentDomain];
            if (domainData && domainData.selectors && domainData.selectors[currentSelector]) {
                // Update settings
                domainData.selectors[currentSelector].direction = direction;
                domainData.selectors[currentSelector].customCSS = customCSS;
                domainData.selectors[currentSelector].lastUpdated = new Date().toISOString();

                chrome.storage.local.set({ [currentDomain]: domainData }, () => {
                    // Update the page if we're editing the current domain
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        const url = new URL(tabs[0].url);
                        if (url.hostname === currentDomain) {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                action: "updateSettings",
                                selector: currentSelector,
                                direction: direction,
                                customCSS: customCSS
                            });
                        }
                    });

                    // Close dialog and refresh lists
                    closeEditDialog();
                    loadSavedElements();
                    loadAllDomains();
                });
            }
        });
    });

    // Close dialog when clicking overlay
    overlay.addEventListener('click', closeEditDialog);

    // Show edit dialog
    function showEditDialog(selector, data, domain) {
        currentSelector = selector;
        currentDomain = domain;
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
                    showEditDialog(selector, data, domain);
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
                                
                                // Save updated settings
                                chrome.storage.local.set({ [domain]: domainData }, () => {
                                    loadSavedElements();
                                    loadAllDomains();
                                });
                            }
                        });
                    }
                    moreOptionsMenu.classList.remove('show');
                });

                // Add toggle event listener
                toggleInput.addEventListener('change', () => {
                    chrome.storage.local.get(domain, (items) => {
                        const domainData = items[domain];
                        if (domainData && domainData.selectors && domainData.selectors[selector]) {
                            domainData.selectors[selector].enabled = toggleInput.checked;
                            
                            // Update the page
                            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                                chrome.tabs.sendMessage(tabs[0].id, {
                                    action: toggleInput.checked ? "updateSettings" : "removeDirection",
                                    selector: selector,
                                    direction: data.direction,
                                    customCSS: data.customCSS || ''
                                });
                            });
                            
                            // Save updated settings
                            chrome.storage.local.set({ [domain]: domainData }, () => {
                                console.log(`Toggle ${selector} to ${toggleInput.checked}`);
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

    // Load and display saved elements for all domains
    function loadAllDomains() {
        allDomainsContainer.replaceChildren();
        
        chrome.storage.local.get(null, (items) => {
            // Filter out any non-domain items (like extension settings)
            const domains = Object.keys(items).filter(key => 
                items[key] && items[key].selectors && Object.keys(items[key].selectors).length > 0
            );
            
            if (domains.length === 0) {
                const noItems = document.createElement('div');
                noItems.className = 'no-items';
                noItems.textContent = 'No saved settings for any domain';
                allDomainsContainer.appendChild(noItems);
                return;
            }
            
            // Sort domains alphabetically
            domains.sort();
            
            const fragment = document.createDocumentFragment();
            
            domains.forEach(domain => {
                const domainData = items[domain];
                
                // Create domain header
                const domainHeader = document.createElement('div');
                domainHeader.className = 'domain-group-header';
                domainHeader.textContent = domain;
                fragment.appendChild(domainHeader);
                
                // Get and sort selectors for this domain
                const sortedEntries = Object.entries(domainData.selectors)
                    .sort(([, a], [, b]) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
                
                // Create list for this domain's selectors
                const domainList = document.createElement('ul');
                domainList.className = 'element-list';
                
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
                    
                    const timeSpan = document.createElement('span');
                    timeSpan.className = 'time';
                    timeSpan.textContent = time;
                    
                    metaInfo.appendChild(timeSpan);
                    
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
                        showEditDialog(selector, data, domain);
                        moreOptionsMenu.classList.remove('show');
                    });
                    
                    const deleteOption = moreOptionsMenu.querySelector('.delete-option');
                    deleteOption.addEventListener('click', () => {
                        if (confirm('Are you sure you want to delete this setting?')) {
                            chrome.storage.local.get(domain, (items) => {
                                const domainData = items[domain];
                                if (domainData && domainData.selectors) {
                                    delete domainData.selectors[selector];
                                    
                                    // Save updated settings
                                    chrome.storage.local.set({ [domain]: domainData }, () => {
                                        loadSavedElements();
                                        loadAllDomains();
                                    });
                                }
                            });
                        }
                        moreOptionsMenu.classList.remove('show');
                    });
                    
                    li.appendChild(elementInfo);
                    li.appendChild(metaInfo);
                    li.appendChild(moreOptionsBtn);
                    li.appendChild(moreOptionsMenu);
                    
                    domainList.appendChild(li);
                });
                
                fragment.appendChild(domainList);
            });
            
            allDomainsContainer.replaceChildren(fragment);
        });
    }

    // Clear current domain settings
    document.getElementById('clear-all').addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete all settings for the current domain?')) {
            const domain = await getCurrentTabDomain();
            chrome.storage.local.remove(domain, () => {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "settingsCleared"
                    });
                });
                loadSavedElements();
                loadAllDomains();
            });
        }
    });
    
    // Clear all domains settings
    document.getElementById('clear-all-domains').addEventListener('click', () => {
        if (confirm('Are you sure you want to delete settings for ALL domains? This cannot be undone.')) {
            chrome.storage.local.clear(() => {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "settingsCleared"
                    });
                });
                loadSavedElements();
                loadAllDomains();
            });
        }
    });

    // Initial load
    loadSavedElements();

    // Listen for storage changes
    chrome.storage.onChanged.addListener(() => {
        loadSavedElements();
        if (document.querySelector('.tab-button[data-tab="all-domains"]').classList.contains('active')) {
            loadAllDomains();
        }
    });
});
