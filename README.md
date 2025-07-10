# LeetCode Helper Chrome Extension

A Chrome extension that helps you quickly find and open LeetCode problems based on the current question title. It provides a convenient button next to the problem title, allowing you to find similar LeetCode problems and paste your solutions easily.

## Features

- 🔍 Button appears next to the LeetCode problem title
- Finds and suggests similar LeetCode problems (not just exact matches)
- Popup with direct links to matched problems
- Works with LeetCode's client-side routing (SPA)
- Clean, modern UI with dark mode support
- Popup appears near the question title for easy access

## Installation

1. **Clone or Download this repository**

2. **Load the extension in Chrome:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project folder (`TufToLeetcode`)

3. **You're ready to go!**
   - Visit [takeyouforward.org](https://takeyouforward.org/)
   - Open any problem page
   - Click the 🔍 button next to the problem title to find similar problems

## Usage

- Click the 🔍 button next to the LeetCode problem title
- A popup will appear with a list of similar LeetCode problems
- Click any problem in the popup to open it in a new tab
- Click outside the popup to close it

## Development

- Main logic: [`content.js`](content.js)
- Styles: [`styles.css`](styles.css)
- Data: [`leetcode-data.json`](leetcode-data.json)
- Manifest: [`manifest.json`](manifest.json)

### To update the LeetCode data
Replace or update `leetcode-data.json` with your latest scraped data.

## Contributing

Pull requests and suggestions are welcome! Please open an issue or submit a PR if you have ideas for improvements.

## License

MIT License 