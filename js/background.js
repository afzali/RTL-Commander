/**
 * RTL-LTR Controller Extension
 * Background Script
 */

// Create context menu items when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    // First remove any existing context menu items
    chrome.contextMenus.removeAll(() => {
        // Then create new ones
        chrome.contextMenus.create({
            id: 'toggleWholePage',
            title: 'Toggle RTL/LTR (Whole Page)',
            contexts: ['all']
        });
        
        chrome.contextMenus.create({
            id: 'toggleDirection',
            title: 'Toggle RTL/LTR (This Element)',
            contexts: ['all']
        });
        
        chrome.contextMenus.create({
            id: 'showAdvancedToggle',
            title: 'Advanced RTL/LTR Settings...',
            contexts: ['all']
        });
        
        chrome.contextMenus.create({
            id: 'separator1',
            type: 'separator',
            contexts: ['all']
        });
        
        chrome.contextMenus.create({
            id: 'addVazirFont',
            title: 'Toggle Vazir Font for RTL text',
            contexts: ['all']
        });
        
        chrome.contextMenus.create({
            id: 'separator2',
            type: 'separator',
            contexts: ['all']
        });
        
        chrome.contextMenus.create({
            id: 'clearSettings',
            title: 'Clear RTL/LTR Settings for This Domain',
            contexts: ['all']
        });
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab || !tab.id) return;
    
    // Get action based on which context menu item was clicked
    let action = null;
    
    switch (info.menuItemId) {
        case 'toggleWholePage':
            action = 'toggleWholePage';
            break;
            
        case 'toggleDirection':
            action = 'toggleDirection';
            break;
            
        case 'showAdvancedToggle':
            action = 'showAdvancedToggle';
            break;
            
        case 'addVazirFont':
            action = 'addVazirFont';
            break;
            
        case 'clearSettings':
            action = 'confirmClearSettings';
            break;
            
        default:
            console.error('Unknown context menu item:', info.menuItemId);
            return;
    }
    
    // Send message to content script
    chrome.tabs.sendMessage(tab.id, { action }, response => {
        if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError);
            return;
        }
        
        if (!response || !response.success) {
            console.error('Error response from content script:', response?.error || 'unknown error');
        }
    });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle messages from content script
    if (message.action === 'clearSettingsConfirmed') {
        // Clear settings for the domain
        if (sender.tab && sender.tab.url) {
            const domain = new URL(sender.tab.url).hostname;
            
            chrome.storage.local.get(domain, result => {
                if (chrome.runtime.lastError) {
                    console.error('Error getting settings:', chrome.runtime.lastError);
                    return;
                }
                
                // Remove domain settings
                chrome.storage.local.remove(domain, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Error removing settings:', chrome.runtime.lastError);
                        return;
                    }
                    
                    // Notify content script that settings were cleared
                    chrome.tabs.sendMessage(sender.tab.id, { action: 'settingsCleared' }, response => {
                        if (chrome.runtime.lastError) {
                            console.error('Error sending settingsCleared message:', chrome.runtime.lastError);
                        }
                    });
                });
            });
        }
    }
    
    // Keep message channel open
    return true;
});
