// Simple Levenshtein Distance for fuzzy match
function similarity(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  let longer = a.length > b.length ? a : b;
  let shorter = a.length > b.length ? b : a;
  let longerLength = longer.length;
  if (longerLength === 0) return 1.0;
  let editDist = levenshtein(longer, shorter);
  return (longerLength - editDist) / parseFloat(longerLength);
}

function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

async function searchLeetCode(keyword) {
  const query = `
    query searchProblems($keyword: String!) {
      problemsetQuestionList(
        categorySlug: ""
        filters: { searchKeywords: $keyword }
        limit: 10
      ) {
        questions {
          title
          titleSlug
          difficulty
        }
      }
    }
  `;

  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      variables: { keyword }
    })
  });

  const data = await response.json();
  return data.data.problemsetQuestionList.questions;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "fetchLeetCode") {
    (async () => {
      let results = await searchLeetCode(msg.title);
      if (results.length > 0) {
        // Pick the most similar one
        let best = results.reduce((a, b) => 
          similarity(msg.title, a.title) > similarity(msg.title, b.title) ? a : b
        );

        sendResponse({
          title: best.title,
          url: `https://leetcode.com/problems/${best.titleSlug}/`,
          difficulty: best.difficulty
        });
      } else {
        sendResponse({ url: `https://leetcode.com/problemset/all/?search=${msg.title}`, difficulty: "Unknown" });
      }
    })();
    return true; // keeps message channel open
  }
});
