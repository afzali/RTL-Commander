/**
 * RTL-LTR Controller Content Script - State Module
 * Stores shared state across all modules
 */

export const state = {
    // Settings
    domainSettings: null,
    styleElement: null,
    observer: null,
    initialized: false,
    initializationAttempts: 0,
    MAX_INITIALIZATION_ATTEMPTS: 5
};
