
let leetcodeData = [];
chrome.runtime.onStartup.addListener(loadLeetCodeData);
chrome.runtime.onInstalled.addListener(loadLeetCodeData);

async function loadLeetCodeData() {
    try {
        const result = await chrome.storage.local.get(['leetcodeData']);

        if (result.leetcodeData && result.leetcodeData.length > 0) {
            leetcodeData = result.leetcodeData;
            console.log('Loaded LeetCode data from storage:', leetcodeData.length, 'problems');
            return;
        }
        const response = await fetch(chrome.runtime.getURL('leetcode-data.json'));
        const data = await response.json();

        leetcodeData = data;
        await chrome.storage.local.set({ leetcodeData: data });
        console.log('Loaded and cached LeetCode data:', data.length, 'problems');

    } catch (error) {
        console.error('Failed to load LeetCode data:', error);
        leetcodeData = [
        ];
    }
}

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

loadLeetCodeData();