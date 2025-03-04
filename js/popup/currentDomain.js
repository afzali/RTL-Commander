/**
 * RTL-LTR Controller Popup Script - Current Domain Module
 * Handles the current domain tab functionality
 */

import { state } from './state.js';
import { getCurrentTabDomain, sendMessageWithRetry } from './messaging.js';
import { showEditDialog } from './editDialog.js';

/**
 * Load and display saved elements for the current domain
 */
export async function loadSavedElements() {
    const domain = await getCurrentTabDomain();
    state.savedElementsContainer.replaceChildren();

    chrome.storage.local.get(domain, (items) => {
        const domainData = items[domain];
        if (!domainData || !domainData.selectors || Object.keys(domainData.selectors).length === 0) {
            const noItems = document.createElement('li');
            noItems.className = 'no-items';
            noItems.textContent = 'No saved elements for this domain';
            state.savedElementsContainer.appendChild(noItems);
            return;
        }

        const sortedEntries = Object.entries(domainData.selectors)
            .sort(([, a], [, b]) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

        const fragment = document.createDocumentFragment();

        sortedEntries.forEach(([selector, data]) => {
            const li = createElementItem(selector, data, domain);
            fragment.appendChild(li);
        });

        state.savedElementsContainer.replaceChildren(fragment);
    });
}

/**
 * Create an element item for the list
 */
export function createElementItem(selector, data, domain) {
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
                        sendMessageWithRetry(tabs[0].id, {
                            action: "removeDirection",
                            selector: selector
                        });
                    });
                    
                    // Save updated settings
                    chrome.storage.local.set({ [domain]: domainData }, () => {
                        loadSavedElements();
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
                    sendMessageWithRetry(tabs[0].id, {
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
    
    return li;
}
