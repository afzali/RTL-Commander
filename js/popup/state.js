/**
 * RTL-LTR Controller Popup Script - State Module
 * Stores shared state and DOM references
 */

export const state = {
    // DOM Elements
    savedElementsContainer: null,
    allDomainsContainer: null,
    editDialog: null,
    overlay: null,
    
    // Edit dialog state
    currentSelector: null,
    currentDomain: null,
    
    // Initialize DOM references
    init() {
        this.savedElementsContainer = document.getElementById('element-list');
        this.allDomainsContainer = document.getElementById('all-domains-list');
        this.editDialog = document.getElementById('editDialog');
        this.overlay = document.getElementById('overlay');
    }
};

// Initialize state when the module is imported
document.addEventListener('DOMContentLoaded', () => {
    state.init();
});
