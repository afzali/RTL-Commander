document.addEventListener('DOMContentLoaded', () => {
    const savedElementsContainer = document.getElementById('saved-elements');

    // Load and display saved elements
    function loadSavedElements() {
        chrome.storage.local.get(null, (items) => {
            savedElementsContainer.innerHTML = '';
            
            for (let selector in items) {
                const elementDiv = document.createElement('div');
                elementDiv.className = 'element-item';
                elementDiv.innerHTML = `
                    <span>${selector} (${items[selector].direction})</span>
                    <button class="delete-btn" data-selector="${selector}">Remove</button>
                `;
                savedElementsContainer.appendChild(elementDiv);
            }

            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const selector = e.target.dataset.selector;
                    chrome.storage.local.remove(selector, () => {
                        loadSavedElements();
                    });
                });
            });
        });
    }

    // Initial load
    loadSavedElements();

    // Listen for storage changes
    chrome.storage.onChanged.addListener(() => {
        loadSavedElements();
    });
});
