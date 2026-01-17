# Legal Documentation - Developer Guide

This directory contains legal documentation for İmsakiye Pro app.

## Documents

1. **privacy-policy-tr.md** - KVKK-compliant Turkish privacy policy
2. **privacy-policy-en.md** - GDPR-compliant English privacy policy (for App Store)
3. **terms-of-service-tr.md** - Turkish terms of service

## GitHub Pages Setup

To publish these documents on GitHub Pages:

### Step 1: Enable GitHub Pages
1. Go to your GitHub repository settings
2. Navigate to "Pages" section
3. Under "Source", select: `main` branch and `/docs` folder
4. Click "Save"

### Step 2: Update URLs in Code
Once GitHub Pages is enabled, your URLs will be:
- **English Privacy:** `https://imsakiyepro.github.io/imsakiye-pro/privacy-policy-en`
- **Turkish Privacy:** `https://imsakiyepro.github.io/imsakiye-pro/privacy-policy-tr`
- **Terms of Service:** `https://imsakiyepro.github.io/imsakiye-pro/terms-of-service-tr`

Update these URLs in:
- `app.json` → `"privacyPolicy"` field
- `SettingsScreen.tsx` → URL constants

### Step 3: Convert to HTML (Optional)
GitHub Pages serves Markdown files as raw text by default. For better presentation, you can either:

**Option A:** Add Jekyll front matter (recommended)
```markdown
---
layout: default
title: Privacy Policy
---

# Gizlilik Politikası
...
```

**Option B:** Convert to HTML manually
Use a markdown-to-HTML converter and save as `.html` files.

## Updating Legal Documents

When updating these documents:

1. Update the "Last Updated" date at the top
2. If significant changes, increment version number in terms
3. Notify users via in-app notification (if KVKK/GDPR requires)
4. Commit and push changes to GitHub

## Important Notes

- **App Store Requirement:** Apple requires a public URL for privacy policy BEFORE submission
- **KVKK Compliance:** All privacy policies must be accessible and understandable
- **User Rights:** Users can exercise their KVKK/GDPR rights by emailing info@akdemyazilim.com
- **30-Day Response:** All data subject requests must be answered within 30 days

## Contact

For legal inquiries: info@akdemyazilim.com
