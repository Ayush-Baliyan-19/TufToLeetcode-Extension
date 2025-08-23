async function sendMessageToActiveTab(message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch (e) {
    showStatus("❌ Inactive, Try Refreshing [F5]", "error"); 
    throw e;
  }
}

function showStatus(message, type, duration = 2000) {
  const statusEl = document.getElementById("status");
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  
  if (type === "error") {
    return; 
  }
  
  if (duration === 0) {
    return; 
  }
  
  setTimeout(() => {
    statusEl.textContent = "🟢 Running";
    statusEl.className = "status running";
  }, duration);
}

// Check if current page is TakeUForward
async function checkCurrentSite() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab.url);
    
    if (!url.hostname.includes('takeuforward.org')) {
      showStatus("❌ Wrong Site", "error");
      return false;
    }
    return true;
  } catch (error) {
    showStatus("❌ Cannot detect site", "error");
    return false;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const problemCountEl = document.getElementById("problemCount");
  const currentPageEl = document.getElementById("currentPage");
  const similaritySlider = document.getElementById("similaritySlider");
  const similarityValue = document.getElementById("similarityValue");

  // Check if we're on the right site first
  const isCorrectSite = await checkCurrentSite();
  
  if (!isCorrectSite) {
    try {
      const response = await chrome.runtime.sendMessage({ action: "getLeetCodeData" });
      problemCountEl.textContent = response ? response.length : 0;

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const hostname = new URL(tab.url).hostname;
      currentPageEl.textContent = hostname;
    } catch (error) {
      problemCountEl.textContent = "Error";
      currentPageEl.textContent = "Unknown";
    }
    
    return;
  }

  // Load similarity threshold (only if on correct site)
  try {
    const response = await sendMessageToActiveTab({ action: "getSimilarityThreshold" });
    if (response && typeof response.value === "number") {
      similaritySlider.value = response.value;
      similarityValue.textContent = response.value;
    }
  } catch (e) {
  }

  try {
    const response = await chrome.runtime.sendMessage({ action: "getLeetCodeData" });
    problemCountEl.textContent = response ? response.length : 0;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const hostname = new URL(tab.url).hostname;
    currentPageEl.textContent = hostname;

    if (!document.getElementById("status").className.includes("error")) {
      showStatus("✅ Extension ready!", "success");
    }
  } catch (error) {
    showStatus("❌ Error loading data", "error"); 
    problemCountEl.textContent = "Error";
  }

  document.getElementById("refreshBtn").addEventListener("click", async () => {
    const isSiteOk = await checkCurrentSite();
    if (!isSiteOk) return;
    
    try {
      await sendMessageToActiveTab({ action: "refresh" });
      showStatus("🔄 Refreshed!", "success");
    } catch (e) {
    }
  });

  document.getElementById("toggleBtn").addEventListener("click", async () => {
    const isSiteOk = await checkCurrentSite();
    if (!isSiteOk) return;
    
    try {
      await sendMessageToActiveTab({ action: "toggle" });
      showStatus("👁️ Toggled!", "success");
    } catch (e) {
    }
  });

  similaritySlider.addEventListener("input", (e) => {
    similarityValue.textContent = e.target.value;
  });

  similaritySlider.addEventListener("change", async (e) => {
    const isSiteOk = await checkCurrentSite();
    if (!isSiteOk) return;
    
    const value = parseFloat(e.target.value);
    try {
      await sendMessageToActiveTab({ action: "setSimilarityThreshold", value });
      showStatus("⚙️ Threshold updated!", "success");
    } catch (e) {
    }
  });
});
