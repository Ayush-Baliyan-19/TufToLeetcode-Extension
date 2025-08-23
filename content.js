// Extract problem title (adjust selector as per TUF site structure)
let titleElement = document.querySelector('.text-2xl.font-bold.text-new_primary.dark\\:text-new_dark_primary'); 

if (titleElement) {
  let problemTitle = titleElement.innerText.trim();

  chrome.runtime.sendMessage({ action: "fetchLeetCode", title: problemTitle }, (response) => {
    if (response && response.url) {
      injectLeetCodeLink(response);
    }
  });
}

function injectSearchIcon() {
  let titleElement = document.querySelector('.text-2xl.font-bold.text-new_primary.dark\\:text-new_dark_primary'); 
  console.log(titleElement);
  
  if (!titleElement) {
    console.log("Not found Item");  
    return
  };

  // Create icon
  let icon = document.createElement("div");
  icon.innerText = "🔍";
  icon.style.cursor = "pointer";
  icon.style.marginLeft = "10px";
  icon.style.fontSize = "20px";

  // Insert after title
  titleElement.insertAdjacentElement("afterend", icon);

  // On click → fetch LeetCode problem
  icon.addEventListener("click", () => {
    let problemTitle = titleElement.innerText.trim();

    chrome.runtime.sendMessage({ action: "fetchLeetCode", title: problemTitle }, (response) => {
      if (response && response.url) {
        showPopup(response);
      } else {
        alert("No matching problem found on LeetCode.");
      }
    });
  });
}

function showPopup(problem) {
  // Remove old popup if exists
  let old = document.querySelector("#leetcode-popup");
  if (old) old.remove();

  // Create popup container
  let popup = document.createElement("div");
  popup.id = "leetcode-popup";
  popup.style.position = "fixed";
  popup.style.top = "20%";
  popup.style.left = "50%";
  popup.style.transform = "translateX(-50%)";
  popup.style.background = "#1a202c";
  popup.style.color = "white";
  popup.style.padding = "20px";
  popup.style.borderRadius = "12px";
  popup.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
  popup.style.zIndex = 9999;
  popup.style.minWidth = "250px";

  popup.innerHTML = `
    <h3 style="margin:0 0 10px 0;">${problem.title}</h3>
    <p>Difficulty: <b>${problem.difficulty}</b></p>
    <a href="${problem.url}" target="_blank"
       style="display:inline-block;padding:8px 12px;background:#38a169;
              color:white;text-decoration:none;border-radius:6px;">
      🔗 Open on LeetCode
    </a>
    <button id="popup-close" 
            style="margin-left:10px;padding:6px 10px;border:none;
                   border-radius:6px;background:#e53e3e;color:white;cursor:pointer;">
      ✖
    </button>
  `;

  document.body.appendChild(popup);

  // Close button
  popup.querySelector("#popup-close").addEventListener("click", () => popup.remove());
}

injectSearchIcon();


