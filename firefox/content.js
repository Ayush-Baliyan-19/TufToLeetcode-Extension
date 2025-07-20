// Content script to detect problems and add LeetCode buttons
let leetcodeData = [];
let buttonContainer = null;

// Load the LeetCode data
async function loadLeetCodeData() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getLeetCodeData' });
        leetcodeData = response || [];
    } catch (error) {
        console.log('Loading from local data...');
        // Fallback - you'll need to include your data here or load it differently
        leetcodeData = []; // Your scraped data goes here
    }
}

// Function to normalize text for better matching
function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Function to calculate similarity between two strings
function calculateSimilarity(str1, str2) {
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);

    // If one string contains the other, it's a good match
    if (s1.includes(s2) || s2.includes(s1)) {
        return 0.8;
    }

    // Calculate word overlap
    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
}

let SIMILARITY_THRESHOLD = 0.4;

// Load threshold from localStorage if available
if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('leetcode-helper-similarity-threshold');
    if (stored) {
        SIMILARITY_THRESHOLD = parseFloat(stored);
    }
}

// Function to find matching LeetCode problems (similar matches)
function findMatchingProblems(pageText) {
    const normalizedPageText = normalizeText(pageText);
    console.log('Normalized page text preview:', normalizedPageText);

    const matches = [];
    // Use the global SIMILARITY_THRESHOLD
    for (let i = 0; i < leetcodeData.length; i++) {
        const problem = leetcodeData[i];
        const similarity = calculateSimilarity(pageText, problem.title);

        if (similarity >= SIMILARITY_THRESHOLD) {
            console.log(`Found match: "${problem.title}" (similarity: ${similarity.toFixed(2)})`);
            matches.push({
                ...problem,
                matchType: similarity > 0.8 ? 'exact' : 'similar',
                confidence: similarity
            });
        }
    }

    // Sort matches by confidence
    matches.sort((a, b) => b.confidence - a.confidence);

    // Remove redundant matches (keep only the highest confidence match for very similar titles)
    const uniqueMatches = [];
    const seenTitles = new Set();

    for (const match of matches) {
        const normalizedTitle = normalizeText(match.title);
        let isRedundant = false;

        for (const seenTitle of seenTitles) {
            if (calculateSimilarity(normalizedTitle, seenTitle) > 0.8) {
                isRedundant = true;
                break;
            }
        }

        if (!isRedundant) {
            uniqueMatches.push(match);
            seenTitles.add(normalizedTitle);
        }
    }

    console.log(`Found ${uniqueMatches.length} unique matches out of ${matches.length} total matches`);
    return uniqueMatches;
}

// Function to get the problem title from the page
function getProblemTitle() {
    const titleElement = document.querySelector('.text-2xl.font-bold.text-new_primary.dark\\:text-new_dark_primary.relative');
    if (titleElement) {
        return titleElement.textContent.trim();
    }
    return null;
}

// Function to create and inject the button container
function createButtonContainer() {
    if (buttonContainer) return buttonContainer;

    buttonContainer = document.createElement('div');
    buttonContainer.id = 'leetcode-helper-container';
    buttonContainer.className = 'leetcode-helper-floating';
    buttonContainer.style.display = 'none'; // Hide by default

    document.body.appendChild(buttonContainer);
    return buttonContainer;
}

// Function to create a LeetCode button
function createLeetCodeButton(problem) {
    const button = document.createElement('button');
    button.className = 'leetcode-helper-btn';
    button.innerHTML = `
    <div class="btn-content">
      <div class="btn-title">${problem.title}</div>
      <div class="btn-meta">
        <span class="difficulty ${problem.difficulty.toLowerCase()}">${problem.difficulty}</span>
        <span class="match-type">${problem.matchType} (${(problem.confidence * 100).toFixed(0)}%)</span>
      </div>
    </div>
    <div class="btn-arrow">→</div>
  `;

    button.addEventListener('click', () => {
        window.open(problem.url, '_blank');
    });

    return button;
}

// Function to update the UI with matched problems
function updateUI(matches) {
    const container = createButtonContainer();
    container.innerHTML = '';

    if (matches.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';

    const header = document.createElement('div');
    header.className = 'leetcode-helper-header';
    header.innerHTML = `
    <span>🎯 Found ${matches.length} LeetCode Match${matches.length > 1 ? 'es' : ''}!</span>
    <button class="close-btn" onclick="this.parentElement.parentElement.style.display='none'">×</button>
  `;
    container.appendChild(header);

    matches.forEach(problem => {
        const button = createLeetCodeButton(problem);
        container.appendChild(button);
    });
}

// Track current URL and content to detect navigation changes
let currentUrl = window.location.href;
let lastAnalyzedContent = '';

// Function to create the title button
function createTitleButton() {
    const titleButton = document.createElement('button');
    titleButton.className = 'leetcode-helper-title-btn';
    titleButton.innerHTML = '🔍';
    titleButton.title = 'Find similar LeetCode problems';

    titleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const title = getProblemTitle();
        if (title) {
            const matches = findMatchingProblems(title);
            updateUI(matches);

            // Position the popup near the button
            const rect = titleButton.getBoundingClientRect();
            if (buttonContainer) {
                buttonContainer.style.top = `${rect.bottom + window.scrollY + 5}px`;
                buttonContainer.style.left = `${rect.left + window.scrollX}px`;
                buttonContainer.style.display = 'block';
            }
        }
    });

    return titleButton;
}

let visibilityEnabled = true;
if (typeof localStorage !== 'undefined') {
    const storedVisibility = localStorage.getItem('leetcode-helper-visibility-enabled');
    if (storedVisibility !== null) {
        visibilityEnabled = storedVisibility === 'true';
    }
}

function removeTitleButton() {
    const titleElement = document.querySelector('.text-2xl.font-bold.text-new_primary.dark\\:text-new_dark_primary.relative');
    if (titleElement) {
        const btn = titleElement.querySelector('.leetcode-helper-title-btn');
        if (btn) btn.remove();
    }
}

function hidePopup() {
    if (buttonContainer) {
        buttonContainer.style.display = 'none';
    }
}

function showPopup() {
    if (buttonContainer && buttonContainer.innerHTML.trim() !== '') {
        buttonContainer.style.display = 'block';
    }
}

// Update injectTitleButton to respect visibilityEnabled
function injectTitleButton() {
    if (!visibilityEnabled) {
        removeTitleButton();
        hidePopup();
        return;
    }
    const titleElement = document.querySelector('.text-2xl.font-bold.text-new_primary.dark\\:text-new_dark_primary.relative');
    if (titleElement && !titleElement.querySelector('.leetcode-helper-title-btn')) {
        const titleButton = createTitleButton();
        titleElement.appendChild(titleButton);
    }
}

// Function to handle URL changes (for client-side navigation)
function handleUrlChange() {
    const newUrl = window.location.href;
    if (newUrl !== currentUrl) {
        currentUrl = newUrl;
        console.log('URL changed from:', currentUrl, 'to:', newUrl);

        // Clear and hide current container
        if (buttonContainer) {
            buttonContainer.innerHTML = '';
            buttonContainer.style.display = 'none';
        }

        // Wait for content to load and inject the title button
        setTimeout(() => {
            injectTitleButton();
        }, 1000);
    }
}

// Debounce function to avoid too frequent updates
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize the extension
async function init() {
    await loadLeetCodeData();

    // Create button container
    createButtonContainer();

    // Add click event listener to document to close popup when clicking outside
    document.addEventListener('click', (e) => {
        if (buttonContainer && !buttonContainer.contains(e.target) &&
            !e.target.classList.contains('leetcode-helper-title-btn')) {
            buttonContainer.style.display = 'none';
        }
    });

    // Inject title button on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectTitleButton);
    } else {
        injectTitleButton();
    }

    // Listen for URL changes (client-side navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
        originalPushState.apply(this, args);
        handleUrlChange();
    };

    history.replaceState = function (...args) {
        originalReplaceState.apply(this, args);
        handleUrlChange();
    };

    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', handleUrlChange);

    // Enhanced mutation observer for content changes
    const debouncedAnalyze = debounce(() => {
        injectTitleButton();
    }, 1000);

    const observer = new MutationObserver((mutations) => {
        // Check if significant content has changed
        const hasSignificantChange = mutations.some(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (let node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const textContent = node.textContent || '';
                        if (textContent.length > 100) {
                            return true;
                        }
                    }
                }
            }
            return false;
        });

        if (hasSignificantChange) {
            debouncedAnalyze();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'refresh') {
        console.log('Manual refresh triggered');
        injectTitleButton();
        sendResponse({ success: true });
    }

    if (request.action === 'toggle') {
        visibilityEnabled = !visibilityEnabled;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('leetcode-helper-visibility-enabled', visibilityEnabled);
        }
        if (!visibilityEnabled) {
            removeTitleButton();
            hidePopup();
        } else {
            injectTitleButton();
        }
        sendResponse({ success: true, visible: visibilityEnabled });
    }

    if (request.action === 'setSimilarityThreshold') {
        SIMILARITY_THRESHOLD = parseFloat(request.value);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('leetcode-helper-similarity-threshold', SIMILARITY_THRESHOLD);
        }
        console.log('Updated SIMILARITY_THRESHOLD to', SIMILARITY_THRESHOLD);
        sendResponse({ success: true });
    }

    if (request.action === 'getSimilarityThreshold') {
        sendResponse({ value: SIMILARITY_THRESHOLD });
    }
});

// Start the extension
init();