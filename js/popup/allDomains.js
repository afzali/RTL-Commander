/**
 * RTL-LTR Controller Popup Script - All Domains Module
 * Handles the all domains tab functionality
 */

import { state } from './state.js';
import { showEditDialog } from './editDialog.js';
import { loadSavedElements } from './currentDomain.js';
import { sendMessageWithRetry } from './messaging.js';

/**
 * Load and display saved elements for all domains
 */
export function loadAllDomains() {
    state.allDomainsContainer.replaceChildren();
    
    chrome.storage.local.get(null, (items) => {
        // Filter out any non-domain items (like extension settings)
        const domains = Object.keys(items).filter(key => 
            items[key] && items[key].selectors && Object.keys(items[key].selectors).length > 0
        );
        
        if (domains.length === 0) {
            const noItems = document.createElement('div');
            noItems.className = 'no-items';
            noItems.textContent = 'No saved settings for any domain';
            state.allDomainsContainer.appendChild(noItems);
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
                const li = createDomainElementItem(selector, data, domain);
                domainList.appendChild(li);
            });
            
            fragment.appendChild(domainList);
        });
        
        state.allDomainsContainer.replaceChildren(fragment);
    });
}

/**
 * Create an element item for the all domains list
 */
function createDomainElementItem(selector, data, domain) {
    const li = document.createElement('li');
    li.className = 'element-item';
    
    const time = new Date(data.lastUpdated).toLocaleString();
    
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
    
    return li;
}
