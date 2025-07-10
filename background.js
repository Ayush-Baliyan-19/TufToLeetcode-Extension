// Background script for the extension
let leetcodeData = [];

// Load LeetCode data on startup
chrome.runtime.onStartup.addListener(loadLeetCodeData);
chrome.runtime.onInstalled.addListener(loadLeetCodeData);

async function loadLeetCodeData() {
    try {
        // Try to load from storage first
        const result = await chrome.storage.local.get(['leetcodeData']);

        if (result.leetcodeData && result.leetcodeData.length > 0) {
            leetcodeData = result.leetcodeData;
            console.log('Loaded LeetCode data from storage:', leetcodeData.length, 'problems');
            return;
        }

        // If no data in storage, load from file (you'll need to include this)
        // For now, using a placeholder - replace with your actual data
        const response = await fetch(chrome.runtime.getURL('leetcode-data.json'));
        const data = await response.json();

        leetcodeData = data;

        // Save to storage for future use
        await chrome.storage.local.set({ leetcodeData: data });
        console.log('Loaded and cached LeetCode data:', data.length, 'problems');

    } catch (error) {
        console.error('Failed to load LeetCode data:', error);
        // Fallback data - you can put a subset of your data here
        leetcodeData = [
        ];
    }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getLeetCodeData') {
        sendResponse(leetcodeData);
        return true;
    }

    if (request.action === 'updateData') {
        leetcodeData = request.data;
        chrome.storage.local.set({ leetcodeData: request.data });
        sendResponse({ success: true });
        return true;
    }
});

// Initialize on load
loadLeetCodeData();