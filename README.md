# LineLock – Guided Reading (Chrome Extension)

LineLock is a lightweight guided reading tool designed to help you read more deliberately and improve comprehension.

When you **highlight text on a webpage and press Enter**, LineLock guides you through the selected content **one word at a time**, subtly masking surrounding text to reduce distraction. Reading speed is adjustable via keyboard shortcuts or an on-screen toolbar.

**Chrome Web Store:** https://chromewebstore.google.com/detail/linelock-%E2%80%93-guided-reading/jngookbfdaepdjodnnoneahbgbcednfd

---

## Why I built this

With the amount of information we consume daily, I found myself skimming, skipping words, and losing context—often needing to reread sections to really absorb what I was reading. LineLock is meant to slow that down in a simple, minimal way.

---

## How it works (high level)

LineLock runs as a content script. It:
- Activates only when the user selects text and presses **Enter**
- Wraps words in the selected region so they can be revealed one by one
- Preserves the page’s original formatting and links as much as possible
- Restores the original content when the session ends

---

## Controls

- **Start:** Highlight text → press **Enter**
- **Pause/Resume:** **Space**
- **Speed:** **↑ / ↓**
- **Exit:** **Esc**
- Toolbar buttons mirror these controls (play/pause, speed, close).

---

## Privacy

LineLock is **privacy-first**:
- No accounts
- No analytics
- No tracking
- No network requests
- No collection or transmission of browsing data or selected text

The extension stores only basic preferences (e.g., reading speed, toolbar position) using Chrome storage so settings persist across sessions.

**Privacy policy:** https://dagr8716-pm.github.io/linelock-privacy/

---

## Permissions (and why)

LineLock requests:

- `storage`  
  Used to save basic preferences like WPM and toolbar position.

LineLock runs on webpages because it must be able to guide reading on whatever page the user chooses. It only operates on-page and does not transmit data off-device.

---

## Repo structure

- `extension/` – extension source (manifest, scripts, icons)
- `store-assets/` – screenshots and store listing copy
- `privacy-policy/` – privacy policy source HTML

---

## Development (local)

1. Clone/download this repo
2. In Chrome, open: `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the `extension/` folder

---

## Feedback / Issues

Feedback is welcome—especially around:
- usefulness of the core use case
- UX/discoverability
- reading comfort and pacing
- performance and edge cases




