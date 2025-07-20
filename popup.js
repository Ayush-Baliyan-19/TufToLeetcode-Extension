// Popup script

async function sendMessageToActiveTab(message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    const response = await chrome.tabs.sendMessage(tab.id, message);
    return response;
  } catch (e) {
    showStatus("This page is not supported by the extension. Try Refreshing", "error");
    throw e;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const statusEl = document.getElementById("status");
  const problemCountEl = document.getElementById("problemCount");
  const currentPageEl = document.getElementById("currentPage");
  const matchCountEl = document.getElementById("matchCount");
  const similaritySlider = document.getElementById("similaritySlider");
  const similarityValue = document.getElementById("similarityValue");

  // Sync slider with current threshold from content script
  try {
    const response = await sendMessageToActiveTab({ action: "getSimilarityThreshold" });
    if (response && typeof response.value === "number") {
      similaritySlider.value = response.value;
      similarityValue.textContent = response.value;
    }
  } catch (e) {
    // If not supported, leave default
  }

  // Load initial data
  try {
    const response = await chrome.runtime.sendMessage({
      action: "getLeetCodeData",
    });
    problemCountEl.textContent = response ? response.length : 0;

    // Get current tab info
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const hostname = new URL(tab.url).hostname;
    currentPageEl.textContent = hostname;

    showStatus("Extension loaded successfully!", "success");
  } catch (error) {
    showStatus("Error loading data", "error");
    problemCountEl.textContent = "Error";
  }

  // Button event listeners
  document
    .getElementById("refreshBtn")
    .addEventListener("click", async () => {
      try {
        await sendMessageToActiveTab({ action: "refresh" });
        showStatus("Analysis refreshed!", "success");
      } catch (e) {}
    });

  document
    .getElementById("toggleBtn")
    .addEventListener("click", async () => {
      try {
        await sendMessageToActiveTab({ action: "toggle" });
        showStatus("Visibility toggled!", "success");
      } catch (e) {}
    });

  document.getElementById("settingsBtn").addEventListener("click", () => {
    document.getElementById("settingsModal").style.display = "flex";
  });
  document.getElementById("closeSettings").addEventListener("click", () => {
    document.getElementById("settingsModal").style.display = "none";
  });
  similaritySlider.addEventListener("input", (e) => {
    similarityValue.textContent = e.target.value;
  });
  similaritySlider.addEventListener("change", async (e) => {
    const value = parseFloat(e.target.value);
    try {
      await sendMessageToActiveTab({ action: "setSimilarityThreshold", value });
    } catch (e) {}
  });
});

function showStatus(message, type) {
  const statusEl = document.getElementById("status");
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.style.display = "block";

  setTimeout(() => {
    statusEl.style.display = "none";
  }, 3000);
} 