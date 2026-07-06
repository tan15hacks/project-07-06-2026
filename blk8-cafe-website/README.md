# BLK.8 CAFÉ Website

A mobile-first marketing and ordering website for **BLK.8 CAFÉ** in Guinobatan, Albay.

## What is included

- Home page with strong café positioning and CTAs
- Menu highlights with filterable categories
- Dine-in / cozy experience section
- Reviews and social proof section
- Gallery using provided reference screenshots as cropped assets
- Lightweight order form that creates a Messenger-ready order message
- Location section with Google Maps search link
- Responsive layout for phones, tablets, and desktop

## Before publishing

Update these items with the café owner's official details:

1. `script.js`
   - Replace `MESSENGER_LINK = ""` with the official Messenger link.
2. `index.html`
   - Replace menu placeholders with official item names and exact prices.
   - Add official GCash/Maya payment instructions if the owner wants them shown.
   - Add official phone number/social links if available.
3. `assets/`
   - Replace cropped screenshot assets with original high-quality café photos when available.

## How to run locally

Open `index.html` directly in a browser.

Or use a simple local server:

```bash
python -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

## How to commit and push to GitHub

```bash
git init
git add .
git commit -m "Build BLK.8 CAFE website"
git branch -M main
git remote add origin https://github.com/tan15hacks/project-07-06-2026.git
git push -u origin main
```

If GitHub says the repository does not exist or you do not have permission, make sure the repository is public or that your GitHub account has write access.
