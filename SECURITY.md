# Security Policy (LineLock)

**Chrome Web Store:** https://chromewebstore.google.com/detail/linelock-%E2%80%93-guided-reading/jngookbfdaepdjodnnoneahbgbcednfd

## Reporting a vulnerability

If you believe you’ve found a security or privacy issue in LineLock, please report it responsibly.

**How to report**
- Open a GitHub issue with the label **security** (if you’re comfortable sharing publicly), OR
- If you prefer private disclosure, you can contact the developer via the Chrome Web Store listing contact method.

Please include:
- A clear description of the issue
- Steps to reproduce
- The affected site(s) and Chrome version (if relevant)
- Any screenshots or console output (if helpful)

## Scope

LineLock is designed to run entirely locally in the browser and does not transmit user data. The primary areas of concern are:

- Unintended modification of page content outside the user’s selection
- Failure to restore original content on cleanup
- Unexpected interaction with sensitive input fields
- Any accidental network requests (none are intended)
- Misuse or overreach of permissions

## Data handling / privacy expectations

LineLock:
- Does **not** collect, sell, or transmit personal data
- Does **not** include analytics or tracking
- Does **not** make external network requests
- Stores only basic preferences locally via Chrome storage (e.g., WPM, toolbar position)

## Supported versions

Security fixes will be released as updates via the Chrome Web Store. Users are encouraged to keep Chrome extensions up to date.

## Responsible disclosure

If you report a valid issue, I’ll do my best to:
- acknowledge receipt
- confirm scope
- ship a fix as soon as practical
- credit you (if you want) in release notes

